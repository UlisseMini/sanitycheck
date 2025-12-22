// ABOUTME: Public stats and export routes.
// ABOUTME: Provides annotation statistics and data export.

import { Elysia, t } from 'elysia'
import { db, annotations } from '../db'
import { sql, desc, gte } from 'drizzle-orm'
import { requireAdmin } from '../shared'

const StatsResponse = t.Object({
  total: t.Number(),
  last24h: t.Number(),
  byFallacyType: t.Array(t.Object({
    type: t.String(),
    count: t.Number()
  }))
})

export const statsRoutes = new Elysia({ prefix: '/stats' })
  .get('/', async () => {
    const [totalResult, byType, recentResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(annotations),
      db.select({
        fallacyType: annotations.fallacyType,
        count: sql<number>`count(*)`,
      })
        .from(annotations)
        .groupBy(annotations.fallacyType),
      db.select({ count: sql<number>`count(*)` })
        .from(annotations)
        .where(gte(annotations.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
    ])

    const total = totalResult[0]?.count ?? 0
    const recentCount = recentResult[0]?.count ?? 0

    return {
      total,
      last24h: recentCount,
      byFallacyType: byType.map((b: { fallacyType: string | null; count: number }) => ({
        type: b.fallacyType || 'unspecified',
        count: b.count
      }))
    }
  }, {
    response: StatsResponse
  })

  // Export annotations as JSONL (requires admin)
  .use(requireAdmin)
  .get('/export', async () => {
    const all = await db.select({
      url: annotations.url,
      quote: annotations.quote,
      annotation: annotations.annotation,
      fallacyType: annotations.fallacyType,
      createdAt: annotations.createdAt
    })
      .from(annotations)
      .orderBy(desc(annotations.createdAt))

    const jsonl = all.map(ann => JSON.stringify(ann)).join('\n')

    return new Response(jsonl, {
      headers: {
        'Content-Type': 'application/jsonl',
        'Content-Disposition': 'attachment; filename=annotations.jsonl'
      }
    })
  }, {
    query: t.Object({
      key: t.Optional(t.String())
    })
  })
