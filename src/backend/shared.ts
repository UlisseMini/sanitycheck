// ABOUTME: Shared utilities and constants for backend routes.
// ABOUTME: Exports prisma client and helper functions.

import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
import { Elysia } from 'elysia'

export const prisma = new PrismaClient()

export function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16)
}

export const ADMIN_KEY = process.env.ADMIN_KEY
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
export const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514'

/**
 * Extract client IP from request headers (for Elysia)
 */
export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null
  }
  return null
}

/**
 * Elysia plugin for admin authentication.
 * Accepts admin key via Authorization header or query parameter.
 */
export const requireAdmin = new Elysia()
  .onBeforeHandle(({ headers, query, set }) => {
    const key = headers.authorization?.replace('Bearer ', '') || (query as { key?: string }).key

    if (key !== ADMIN_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    return
  })
