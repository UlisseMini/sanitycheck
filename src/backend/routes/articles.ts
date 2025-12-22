// ABOUTME: Article and analysis CRUD routes.
// ABOUTME: Handles article creation and storing analysis results.

import { Elysia, t } from 'elysia'
import { hashText, getClientIp } from '../shared'
import { db, articles, analyses, highlights } from '../db'
import { eq, and } from 'drizzle-orm'

const CreateArticleRequest = t.Object({
  url: t.String(),
  title: t.Optional(t.String()),
  textContent: t.String()
})

const CreateArticleResponse = t.Object({
  articleId: t.String(),
  isNew: t.Boolean()
})

const HighlightInput = t.Object({
  quote: t.String(),
  importance: t.Optional(t.String()),
  gap: t.Optional(t.String())
})

const AddAnalysisRequest = t.Object({
  modelVersion: t.Optional(t.String()),
  rawResponse: t.Any(),
  severity: t.Optional(t.String()),
  highlights: t.Optional(t.Array(HighlightInput)),
  promptUsed: t.Optional(t.String()),
  isCustomPrompt: t.Optional(t.Boolean())
})

const AddAnalysisResponse = t.Object({
  analysisId: t.String(),
  highlightCount: t.Number()
})

export const articlesRoutes = new Elysia({ prefix: '/articles' })
  // Create article
  .post('/', async ({ body, request }) => {
    const { url, title, textContent } = body

    const textHash = hashText(textContent)
    const ip = getClientIp(request.headers)
    const userAgent = request.headers.get('user-agent')

    let article = await db.query.articles.findFirst({
      where: and(eq(articles.url, url), eq(articles.textHash, textHash)),
    })

    const isNew = !article

    if (!article) {
      const [newArticle] = await db.insert(articles).values({
        url,
        title: title ?? null,
        textContent,
        textHash,
        ip,
        userAgent,
      }).returning()
      article = newArticle!
    }

    return { articleId: article.id, isNew }
  }, {
    body: CreateArticleRequest,
    response: CreateArticleResponse
  })

  // Add analysis results to article
  .post('/:articleId/analysis', async ({ params, body }) => {
    const { articleId } = params
    const { modelVersion, rawResponse, severity, highlights: highlightData, promptUsed, isCustomPrompt } = body

    if (!rawResponse) {
      throw new Error('Missing required field: rawResponse')
    }

    const article = await db.query.articles.findFirst({
      where: eq(articles.id, articleId),
    })
    if (!article) {
      throw new Error('Article not found')
    }

    // Insert analysis
    const [analysis] = await db.insert(analyses).values({
      articleId,
      modelVersion: modelVersion ?? null,
      rawResponse,
      severity: severity ?? null,
      promptUsed: promptUsed ?? null,
      isCustomPrompt: isCustomPrompt ?? false,
    }).returning()

    // Insert highlights if any
    let highlightCount = 0
    if (highlightData && highlightData.length > 0) {
      const insertedHighlights = await db.insert(highlights).values(
        highlightData.map((h) => ({
          analysisId: analysis!.id,
          quote: h.quote,
          importance: h.importance ?? 'minor',
          gap: h.gap ?? '',
        }))
      ).returning()
      highlightCount = insertedHighlights.length
    }

    return {
      analysisId: analysis!.id,
      highlightCount,
    }
  }, {
    body: AddAnalysisRequest,
    response: AddAnalysisResponse
  })
