import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service';
import { loginSchema, registerSchema, refreshTokenSchema } from './auth.schema';
import { z } from 'zod';

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = registerSchema.parse(request.body);
      const user = await authService.register(data);
      
      const accessToken = await reply.jwtSign({ id: user.id }, { expiresIn: '30m' });
      const refreshToken = await authService.createRefreshToken(user.id);

      return reply.code(201).send({
        success: true,
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = (error as any).issues?.[0]?.message || (error as any).errors?.[0]?.message || 'Validation failed';
        return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message } });
      }
      if (error instanceof Error && error.message === 'Email already in use') {
        return reply.code(409).send({ success: false, error: { code: 'EMAIL_IN_USE', message: error.message } });
      }
      request.log.error(error);
      return reply.code(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = loginSchema.parse(request.body);
      const user = await authService.validateUser(data);

      if (!user) {
        return reply.code(401).send({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
      }

      const accessToken = await reply.jwtSign({ id: user.id }, { expiresIn: '30m' });
      const refreshToken = await authService.createRefreshToken(user.id);

      return reply.send({
        success: true,
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = (error as any).issues?.[0]?.message || (error as any).errors?.[0]?.message || 'Validation failed';
        return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message } });
      }
      request.log.error(error);
      return reply.code(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
    }
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { refreshToken } = refreshTokenSchema.parse(request.body);
      const user = await authService.validateRefreshToken(refreshToken);

      if (!user) {
        return reply.code(401).send({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' } });
      }

      // Rotate refresh token (optional, but good practice)
      await authService.revokeRefreshToken(refreshToken);
      const newRefreshToken = await authService.createRefreshToken(user.id);
      const accessToken = await reply.jwtSign({ id: user.id }, { expiresIn: '30m' });

      return reply.send({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body' } });
      }
      request.log.error(error);
      return reply.code(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { refreshToken } = refreshTokenSchema.parse(request.body);
      await authService.revokeRefreshToken(refreshToken);
      return reply.send({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      // Even if token is invalid, we return success for logout usually
      return reply.send({ success: true, message: 'Logged out successfully' });
    }
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    try {
      // request.user is populated by the authenticate decorator
      const { id } = request.user as { id: string };
      
      const user = await authService.getUserById(id);
      if (!user) {
        return reply.code(404).send({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      }
      return reply.send({ success: true, data: { user } });
    } catch(err) {
       return reply.code(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
    }
  }
}

export const authController = new AuthController();
