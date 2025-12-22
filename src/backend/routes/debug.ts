// ABOUTME: Debug logging routes for extension telemetry.
// ABOUTME: Receives and queries extension debug logs.

import { Elysia, t } from 'elysia'
import { requireAdmin, getClientIp } from '../shared'
import { db, debugLogs } from '../db'
import { eq, gte, desc, sql, and, lt } from 'drizzle-orm'

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

      await db.insert(debugLogs).values({
        level: level || 'log',
        message,
        data: data || null,
        source: source || null,
        ip,
        version: version || null,
        userAgent,
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
  .use(requireAdmin)
  .get('/logs', async ({ query }) => {
    const limit = Math.min(parseInt(query.limit || '100'), 1000)
    const offset = parseInt(query.offset || '0')
    const ip = query.ip
    const level = query.level
    const since = query.since

    // Build where conditions dynamically
    const conditions = []
    if (ip) conditions.push(eq(debugLogs.ip, ip))
    if (level) conditions.push(eq(debugLogs.level, level))

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
        conditions.push(gte(debugLogs.createdAt, sinceDate))
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [logs, countResult] = await Promise.all([
      db.select()
        .from(debugLogs)
        .where(whereClause)
        .orderBy(desc(debugLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(debugLogs)
        .where(whereClause)
    ])

    const total = countResult[0]?.count ?? 0

    const uniqueIps = await db.select({
      ip: debugLogs.ip,
      count: sql<number>`count(*)`,
    })
      .from(debugLogs)
      .groupBy(debugLogs.ip)
      .orderBy(desc(sql`count(*)`))
      .limit(50)

    return {
      logs,
      total,
      limit,
      offset,
      availableIps: uniqueIps.map((i: { ip: string | null; count: number }) => ({ ip: i.ip, count: i.count }))
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

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(debugLogs)
      .where(lt(debugLogs.createdAt, cutoffDate))

    const deleted = countResult[0]?.count ?? 0

    await db.delete(debugLogs)
      .where(lt(debugLogs.createdAt, cutoffDate))

    return { success: true, deleted }
  }, {
    query: t.Object({
      key: t.Optional(t.String()),
      olderThan: t.Optional(t.String())
    })
  })
