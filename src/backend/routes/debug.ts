// ABOUTME: Debug logging routes for extension telemetry.
// ABOUTME: Receives and queries extension debug logs.

import { Elysia, t } from 'elysia'
import { prisma, ADMIN_KEY, getClientIp } from '../shared'

const DebugLogRequest = t.Object({
  level: t.Optional(t.String()),
  message: t.String(),
  data: t.Optional(t.Any()),
  source: t.Optional(t.String()),
  version: t.Optional(t.String())
})

export const debugRoutes = new Elysia({ prefix: '/debug' })
  // Receive debug logs from extension (public endpoint)
  .post('/log', async ({ body, request }) => {
    try {
      const { level, message, data, source, version } = body

      const ip = getClientIp(request.headers) || 'unknown'
      const userAgent = request.headers.get('user-agent')

      await prisma.debugLog.create({
        data: {
          level: level || 'log',
          message,
          data: data || null,
          source: source || null,
          ip,
          version: version || null,
          userAgent,
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Debug log error:', error)
      return { success: false }
    }
  }, {
    body: DebugLogRequest
  })

  // Get debug logs (admin only)
  .get('/logs', async ({ query, set }) => {
    const key = query.key

    if (key !== ADMIN_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    const limit = Math.min(parseInt(query.limit || '100'), 1000)
    const offset = parseInt(query.offset || '0')
    const ip = query.ip
    const level = query.level
    const since = query.since

    const where: {
      ip?: string
      level?: string
      createdAt?: { gte: Date }
    } = {}

    if (ip) where.ip = ip
    if (level) where.level = level

    if (since) {
      let sinceDate: Date
      const match = since.match(/^(\d+)(m|h|d)$/)
      if (match && match[1] && match[2]) {
        const amount = parseInt(match[1], 10)
        const unit = match[2]
        const ms = unit === 'm' ? amount * 60 * 1000
                 : unit === 'h' ? amount * 60 * 60 * 1000
                 : amount * 24 * 60 * 60 * 1000
        sinceDate = new Date(Date.now() - ms)
      } else {
        sinceDate = new Date(since)
      }

      if (!isNaN(sinceDate.getTime())) {
        where.createdAt = { gte: sinceDate }
      }
    }

    const [logs, total] = await Promise.all([
      prisma.debugLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.debugLog.count({ where })
    ])

    const uniqueIps = await prisma.debugLog.groupBy({
      by: ['ip'],
      _count: true,
      orderBy: { _count: { ip: 'desc' } },
      take: 50
    })

    return {
      logs,
      total,
      limit,
      offset,
      availableIps: uniqueIps.map((i: { ip: string | null; _count: number }) => ({ ip: i.ip, count: i._count }))
    }
  }, {
    query: t.Object({
      key: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      offset: t.Optional(t.String()),
      ip: t.Optional(t.String()),
      level: t.Optional(t.String()),
      since: t.Optional(t.String())
    })
  })

  // Clear old debug logs (admin only)
  .delete('/logs', async ({ query, set }) => {
    const key = query.key

    if (key !== ADMIN_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    const olderThan = query.olderThan || '7d'

    const match = olderThan.match(/^(\d+)(m|h|d)$/)
    if (!match || !match[1] || !match[2]) {
      set.status = 400
      return { error: 'Invalid olderThan format. Use format like 5m, 1h, 7d' }
    }

    const amount = parseInt(match[1], 10)
    const unit = match[2]
    const ms = unit === 'm' ? amount * 60 * 1000
             : unit === 'h' ? amount * 60 * 60 * 1000
             : amount * 24 * 60 * 60 * 1000

    const cutoffDate = new Date(Date.now() - ms)

    const result = await prisma.debugLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } }
    })

    return { success: true, deleted: result.count }
  }, {
    query: t.Object({
      key: t.Optional(t.String()),
      olderThan: t.Optional(t.String())
    })
  })
