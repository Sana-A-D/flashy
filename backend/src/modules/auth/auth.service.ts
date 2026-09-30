import bcrypt from 'bcrypt';
import { prisma } from '../../app/server';
import { RegisterInput, LoginInput } from './auth.schema';
import crypto from 'crypto';

export class AuthService {
  async register(data: RegisterInput) {
    const email = data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email already in use');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    const createData = {
      email,
      name: data.name,
      password: passwordHash,
    } as any;
    Object.keys(createData).forEach(k => createData[k] === undefined && delete createData[k]);
    
    const user = await prisma.user.create({
      data: createData,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async validateUser(data: LoginInput) {
    const email = data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    let isValid = false;
    if (user.password.startsWith('$2')) {
      isValid = await bcrypt.compare(data.password, user.password);
    } else {
      isValid = data.password === user.password;
    }

    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
  }

  async createRefreshToken(userId: string) {
    // Generate a random token
    const token = crypto.randomBytes(40).toString('hex');
    // Hash it for storage
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return token;
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      }
    });
  }

  async validateRefreshToken(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          }
        }
      }
    });

    if (!storedToken) {
      return null;
    }

    return storedToken.user;
  }

  async revokeRefreshToken(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });
  }
}

export const authService = new AuthService();
