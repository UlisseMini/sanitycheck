// ABOUTME: Shared utilities, middleware, and constants for backend routes.
// ABOUTME: Exports prisma client, auth middleware, and helper functions.

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
}

export const ADMIN_KEY = process.env.ADMIN_KEY;
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const key = authHeader?.replace('Bearer ', '') || req.query.key as string;

  if (key !== ADMIN_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

export function getClientIp(req: Request): string | null {
  return req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
    || req.socket.remoteAddress
    || null;
}
