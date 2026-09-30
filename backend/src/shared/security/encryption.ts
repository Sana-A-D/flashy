import crypto from 'crypto';

// The key should be a 32-byte hex string or 32-byte plain string.
// We get it from environment variables.
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is missing');
  }
  
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  
  if (key.length === 32) {
    return Buffer.from(key, 'utf-8');
  }

  // If not exactly 32 bytes, we hash it to get 32 bytes.
  return crypto.createHash('sha256').update(key).digest();
};

const ALGORITHM = 'aes-256-cbc';

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text: string): string => {
  const textParts = text.split(':');
  const ivPart = textParts.shift();
  if (!ivPart) throw new Error('Invalid encrypted text format');
  
  const iv = Buffer.from(ivPart, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
