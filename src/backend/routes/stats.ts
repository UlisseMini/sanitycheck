// ABOUTME: Public stats and export routes.
// ABOUTME: Provides annotation statistics and data export.

import { Elysia, t } from 'elysia'
import { prisma, ADMIN_KEY } from '../shared'

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
    const [total, byType, recentCount] = await Promise.all([
      prisma.annotation.count(),
      prisma.annotation.groupBy({
        by: ['fallacyType'],
        _count: true,
        orderBy: { _count: { fallacyType: 'desc' } }
      }),
      prisma.annotation.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    return {
      total,
      last24h: recentCount,
      byFallacyType: byType.map((b: { fallacyType: string | null; _count: number }) => ({
        type: b.fallacyType || 'unspecified',
        count: b._count
      }))
    }
  }, {
    response: StatsResponse
  })

  // Export annotations as JSONL (requires admin)
  .get('/export', async ({ query, set }) => {
    const key = query.key

    if (key !== ADMIN_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    const annotations = await prisma.annotation.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        url: true,
        quote: true,
        annotation: true,
        fallacyType: true,
        createdAt: true
      }
    })

    const jsonl = annotations.map(ann => JSON.stringify(ann)).join('\n')

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
