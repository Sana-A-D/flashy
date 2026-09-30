import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from 'fs';
import path from 'path';

// Local disk uploads root directory
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// In-memory buffer cache for fast access
const localBufferStore = new Map<string, { buffer: Buffer; mimeType: string }>();

export class StorageService {
  private s3: S3Client;
  private bucket: string;
  private isDummyCreds: boolean;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || 'listingmate-images';
    const accessKey = process.env.AWS_ACCESS_KEY_ID || 'dummy';
    const secretKey = process.env.AWS_SECRET_ACCESS_KEY || 'dummy';
    this.isDummyCreds = accessKey === 'dummy' || secretKey === 'dummy';

    const config: any = {
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
    };
    if (process.env.AWS_S3_ENDPOINT) {
      config.endpoint = process.env.AWS_S3_ENDPOINT;
    }
    this.s3 = new S3Client(config);
  }

  private getDiskPath(key: string): string {
    const cleanKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, '').replace(/^[\/\\]+/, '');
    const resolved = path.resolve(uploadsDir, cleanKey);
    if (!resolved.startsWith(uploadsDir)) {
      throw new Error('Access denied: invalid storage path');
    }
    return resolved;
  }

  async getUploadUrl(key: string, mimeType: string): Promise<string> {
    if (this.isDummyCreds) {
      return `/api/v1/fashion/images/file?key=${encodeURIComponent(key)}`;
    }
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
      });
      return await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    } catch {
      return `/api/v1/fashion/images/file?key=${encodeURIComponent(key)}`;
    }
  }

  async getObjectUrl(key: string): Promise<string | null> {
    // 1. Check in-memory store or local disk
    const diskPath = this.getDiskPath(key);
    if (localBufferStore.has(key) || fs.existsSync(diskPath)) {
      return `/api/v1/fashion/images/file?key=${encodeURIComponent(key)}`;
    }

    // 2. If configured for real S3, generate presigned URL
    if (!this.isDummyCreds) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        });
        return await getSignedUrl(this.s3, command, { expiresIn: 3600 * 24 });
      } catch (err) {
        console.warn(`S3 getObjectUrl failed for ${key}:`, err);
      }
    }

    // 3. DO NOT return a placeholder watch image. Return null for genuinely missing images.
    return null;
  }

  async putObject(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    // Save to in-memory map
    localBufferStore.set(key, { buffer, mimeType });

    // Persist to local disk so it survives server restarts
    try {
      const diskPath = this.getDiskPath(key);
      const parentDir = path.dirname(diskPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(diskPath, buffer);
    } catch (diskErr) {
      console.warn('Failed to write image to disk:', diskErr);
    }

    if (!this.isDummyCreds) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        });
        await this.s3.send(command);
      } catch (err) {
        console.warn('S3 send failed, saved locally:', err);
      }
    }
  }

  async deleteObject(key: string): Promise<void> {
    localBufferStore.delete(key);
    try {
      const diskPath = this.getDiskPath(key);
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
    } catch (diskErr) {
      console.warn('Failed to delete image from disk:', diskErr);
    }

    if (!this.isDummyCreds) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        });
        await this.s3.send(command);
      } catch (err) {
        console.warn('S3 delete failed:', err);
      }
    }
  }

  async downloadObject(key: string): Promise<Buffer> {
    const local = localBufferStore.get(key);
    if (local) {
      return local.buffer;
    }
    const diskPath = this.getDiskPath(key);
    if (fs.existsSync(diskPath)) {
      const buf = fs.readFileSync(diskPath);
      localBufferStore.set(key, { buffer: buf, mimeType: this.inferMimeType(key) });
      return buf;
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await this.s3.send(command);
    if (!response.Body) {
      throw new Error('No body in S3 response');
    }
    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  getLocalObject(key: string): { buffer: Buffer; mimeType: string } | null {
    const local = localBufferStore.get(key);
    if (local) {
      return local;
    }
    try {
      const diskPath = this.getDiskPath(key);
      if (fs.existsSync(diskPath)) {
        const buffer = fs.readFileSync(diskPath);
        const mimeType = this.inferMimeType(key);
        localBufferStore.set(key, { buffer, mimeType });
        return { buffer, mimeType };
      }
    } catch {
      return null;
    }
    return null;
  }

  private inferMimeType(key: string): string {
    const ext = path.extname(key).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      case '.gif':
        return 'image/gif';
      default:
        return 'image/jpeg';
    }
  }
}

export const storageService = new StorageService();
