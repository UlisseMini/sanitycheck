// ABOUTME: Admin dashboard routes for content management.
// ABOUTME: Provides article, comment, and stats management endpoints.

import { Elysia, t } from 'elysia'
import { prisma, ADMIN_KEY } from '../shared'

export const adminRoutes = new Elysia({ prefix: '/admin' })
  // Verify admin key
  .get('/verify', ({ query, headers, set }) => {
    const key = headers.authorization?.replace('Bearer ', '') || query.key

    if (key !== ADMIN_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    return { success: true }
  }, {
    query: t.Object({
      key: t.Optional(t.String())
    })
  })

  // Delete annotation (admin only)
  .delete('/annotations/:id', async ({ params, query, headers, set }) => {
    const key = headers.authorization?.replace('Bearer ', '') || query.key
    if (key !== ADMIN_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    await prisma.annotation.delete({
      where: { id: params.id }
    })
    return { success: true }
  }, {
    query: t.Object({
      key: t.Optional(t.String())
    })
  })

  // Get all articles (admin)
  .get('/articles', async ({ query, headers, set }) => {
    const key = headers.authorization?.replace('Bearer ', '') || query.key
    if (key !== ADMIN_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    const limit = Math.min(parseInt(query.limit || '50'), 200)
    const offset = parseInt(query.offset || '0')

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          _count: { select: { analyses: true, comments: true } },
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { severity: true, highlights: { select: { id: true } } }
          }
        }
      }),
      prisma.article.count()
    ])

    return {
      articles: articles.map((a) => {
        const latestAnalysis = a.analyses[0]
        return {
          id: a.id,
          createdAt: a.createdAt,
          url: a.url,
          title: a.title,
          textPreview: a.textContent.substring(0, 200) + (a.textContent.length > 200 ? '...' : ''),
          analysisCount: a._count.analyses,
          commentCount: a._count.comments,
          latestAnalysis: latestAnalysis ? {
            severity: latestAnalysis.severity ?? 'none',
            highlightCount: latestAnalysis.highlights.length
          } : null,
          ip: a.ip
        }
      }),
      total,
      limit,
      offset
    }
  }, {
    query: t.Object({
      key: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      offset: t.Optional(t.String())
    })
  })

  // Get single article with all data (admin)
  .get('/articles/:id', async ({ params, query, headers, set }) => {
    const key = headers.authorization?.replace('Bearer ', '') || query.key
    if (key !== ADMIN_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    const article = await prisma.article.findUnique({
      where: { id: params.id },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          include: { highlights: true }
        },
        comments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!article) {
      set.status = 404
      return { error: 'Article not found' }
    }

    return { article }
  }, {
    query: t.Object({
      key: t.Optional(t.String())
    })
  })

  // Delete article (admin)
  .delete('/articles/:id', async ({ params, query, headers, set }) => {
    const key = headers.authorization?.replace('Bearer ', '') || query.key
    if (key !== ADMIN_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    await prisma.article.delete({ where: { id: params.id } })
    return { success: true }
  }, {
    query: t.Object({
      key: t.Optional(t.String())
    })
  })

  // Get all comments (admin)
  .get('/comments', async ({ query, headers, set }) => {
    const key = headers.authorization?.replace('Bearer ', '') || query.key
    if (key !== ADMIN_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    const limit = Math.min(parseInt(query.limit || '50'), 200)
    const offset = parseInt(query.offset || '0')

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          article: { select: { url: true, title: true } }
        }
      }),
      prisma.comment.count()
    ])

    return { comments, total, limit, offset }
  }, {
    query: t.Object({
      key: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      offset: t.Optional(t.String())
    })
  })

  // Delete comment (admin)
  .delete('/comments/:id', async ({ params, query, headers, set }) => {
    const key = headers.authorization?.replace('Bearer ', '') || query.key
    if (key !== ADMIN_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    await prisma.comment.delete({ where: { id: params.id } })
    return { success: true }
  }, {
    query: t.Object({
      key: t.Optional(t.String())
    })
  })

  // Get all early access signups (admin)
  .get('/early-access', async ({ query, headers, set }) => {
    const key = headers.authorization?.replace('Bearer ', '') || query.key
    if (key !== ADMIN_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    const limit = Math.min(parseInt(query.limit || '50'), 200)
    const offset = parseInt(query.offset || '0')

    const [signups, total] = await Promise.all([
      prisma.earlyAccessSignup.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.earlyAccessSignup.count()
    ])

    return { signups, total, limit, offset }
  }, {
    query: t.Object({
      key: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      offset: t.Optional(t.String())
    })
  })

  // Get early access stats (admin)
  .get('/early-access-stats', async ({ query, headers, set }) => {
    const key = headers.authorization?.replace('Bearer ', '') || query.key
    if (key !== ADMIN_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    const [total, recentCount] = await Promise.all([
      prisma.earlyAccessSignup.count(),
      prisma.earlyAccessSignup.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    return {
      total,
      last24h: recentCount
    }
  }, {
    query: t.Object({
      key: t.Optional(t.String())
    })
  })

  // Get feedback stats
  .get('/feedback-stats', async ({ query, headers, set }) => {
    const key = headers.authorization?.replace('Bearer ', '') || query.key
    if (key !== ADMIN_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }

    const [articleCount, analysisCount, commentCount, highlightCount, recentArticles] = await Promise.all([
      prisma.article.count(),
      prisma.analysis.count(),
      prisma.comment.count(),
      prisma.highlight.count(),
      prisma.article.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      })
    ])

    const highlightsByImportance = await prisma.highlight.groupBy({
      by: ['importance'],
      _count: true
    })

    return {
      articles: articleCount,
      analyses: analysisCount,
      comments: commentCount,
      highlights: highlightCount,
      articlesLast24h: recentArticles,
      highlightsByImportance: highlightsByImportance.map((h: { importance: string; _count: number }) => ({
        importance: h.importance,
        count: h._count
      }))
    }
  }, {
    query: t.Object({
      key: t.Optional(t.String())
    })
  })
