// ABOUTME: Admin dashboard routes for content management.
// ABOUTME: Provides article, comment, and stats management endpoints.

import { Elysia, t } from 'elysia'
import { requireAdmin } from '../shared'
import { db, articles, analyses, highlights, comments, earlyAccessSignups, annotations } from '../db'
import { eq, desc, sql, gte, count } from 'drizzle-orm'

export const adminRoutes = new Elysia({ prefix: '/admin' })
  .use(requireAdmin)

  // Verify admin key
  .get('/verify', () => {
    return { success: true }
  }, {
    query: t.Object({
      key: t.Optional(t.String())
    })
  })

  // Delete annotation (admin only)
  .delete('/annotations/:id', async ({ params }) => {
    await db.delete(annotations).where(eq(annotations.id, params.id))
    return { success: true }
  }, {
    query: t.Object({
      key: t.Optional(t.String())
    })
  })

  // Get all articles (admin)
  .get('/articles', async ({ query }) => {
    const limit = Math.min(parseInt(query.limit || '50'), 200)
    const offset = parseInt(query.offset || '0')

    const [articleList, totalResult] = await Promise.all([
      db.select({
        id: articles.id,
        createdAt: articles.createdAt,
        url: articles.url,
        title: articles.title,
        textContent: articles.textContent,
        ip: articles.ip,
        analysisCount: sql<number>`(SELECT count(*) FROM ${analyses} WHERE ${analyses.articleId} = ${articles.id})`,
        commentCount: sql<number>`(SELECT count(*) FROM ${comments} WHERE ${comments.articleId} = ${articles.id})`,
      })
        .from(articles)
        .orderBy(desc(articles.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(articles)
    ])

    // Get latest analysis for each article
    const articleIds = articleList.map(a => a.id)
    const latestAnalyses = articleIds.length > 0 ? await db.query.analyses.findMany({
      where: (analyses, { inArray }) => inArray(analyses.articleId, articleIds),
      with: {
        highlights: {
          columns: { id: true }
        }
      },
      orderBy: (analyses, { desc }) => [desc(analyses.createdAt)]
    }) : []

    // Group analyses by articleId and get latest
    const latestByArticle = new Map()
    for (const analysis of latestAnalyses) {
      if (!latestByArticle.has(analysis.articleId)) {
        latestByArticle.set(analysis.articleId, analysis)
      }
    }

    return {
      articles: articleList.map((a) => {
        const latestAnalysis = latestByArticle.get(a.id)
        return {
          id: a.id,
          createdAt: a.createdAt,
          url: a.url,
          title: a.title,
          textPreview: a.textContent.substring(0, 200) + (a.textContent.length > 200 ? '...' : ''),
          analysisCount: a.analysisCount,
          commentCount: a.commentCount,
          latestAnalysis: latestAnalysis ? {
            severity: latestAnalysis.severity ?? 'none',
            highlightCount: latestAnalysis.highlights.length
          } : null,
          ip: a.ip
        }
      }),
      total: totalResult[0]!.count,
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
  .get('/articles/:id', async ({ params, set }) => {
    const article = await db.query.articles.findFirst({
      where: eq(articles.id, params.id),
      with: {
        analyses: {
          with: { highlights: true },
          orderBy: (analyses, { desc }) => [desc(analyses.createdAt)],
        },
        comments: {
          orderBy: (comments, { desc }) => [desc(comments.createdAt)],
        },
      },
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
  .delete('/articles/:id', async ({ params }) => {
    await db.delete(articles).where(eq(articles.id, params.id))
    return { success: true }
  }, {
    query: t.Object({
      key: t.Optional(t.String())
    })
  })

  // Get all comments (admin)
  .get('/comments', async ({ query }) => {
    const limit = Math.min(parseInt(query.limit || '50'), 200)
    const offset = parseInt(query.offset || '0')

    const [commentList, totalResult] = await Promise.all([
      db.query.comments.findMany({
        orderBy: (comments, { desc }) => [desc(comments.createdAt)],
        limit,
        offset,
        with: {
          article: {
            columns: { url: true, title: true }
          }
        }
      }),
      db.select({ count: count() }).from(comments)
    ])

    return { comments: commentList, total: totalResult[0]!.count, limit, offset }
  }, {
    query: t.Object({
      key: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      offset: t.Optional(t.String())
    })
  })

  // Delete comment (admin)
  .delete('/comments/:id', async ({ params }) => {
    await db.delete(comments).where(eq(comments.id, params.id))
    return { success: true }
  }, {
    query: t.Object({
      key: t.Optional(t.String())
    })
  })

  // Get all early access signups (admin)
  .get('/early-access', async ({ query }) => {
    const limit = Math.min(parseInt(query.limit || '50'), 200)
    const offset = parseInt(query.offset || '0')

    const [signups, totalResult] = await Promise.all([
      db.query.earlyAccessSignups.findMany({
        orderBy: (earlyAccessSignups, { desc }) => [desc(earlyAccessSignups.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: count() }).from(earlyAccessSignups)
    ])

    return { signups, total: totalResult[0]!.count, limit, offset }
  }, {
    query: t.Object({
      key: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      offset: t.Optional(t.String())
    })
  })

  // Get early access stats (admin)
  .get('/early-access-stats', async () => {
    const [totalResult, recentResult] = await Promise.all([
      db.select({ count: count() }).from(earlyAccessSignups),
      db.select({ count: count() })
        .from(earlyAccessSignups)
        .where(gte(earlyAccessSignups.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
    ])

    return {
      total: totalResult[0]!.count,
      last24h: recentResult[0]!.count
    }
  }, {
    query: t.Object({
      key: t.Optional(t.String())
    })
  })

  // Get feedback stats
  .get('/feedback-stats', async () => {
    const [articleCountResult, analysisCountResult, commentCountResult, highlightCountResult, recentArticlesResult] = await Promise.all([
      db.select({ count: count() }).from(articles),
      db.select({ count: count() }).from(analyses),
      db.select({ count: count() }).from(comments),
      db.select({ count: count() }).from(highlights),
      db.select({ count: count() })
        .from(articles)
        .where(gte(articles.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
    ])

    const highlightsByImportance = await db.select({
      importance: highlights.importance,
      count: count()
    })
      .from(highlights)
      .groupBy(highlights.importance)

    return {
      articles: articleCountResult[0]!.count,
      analyses: analysisCountResult[0]!.count,
      comments: commentCountResult[0]!.count,
      highlights: highlightCountResult[0]!.count,
      articlesLast24h: recentArticlesResult[0]!.count,
      highlightsByImportance: highlightsByImportance.map((h) => ({
        importance: h.importance,
        count: h.count
      }))
    }
  }, {
    query: t.Object({
      key: t.Optional(t.String())
    })
  })
