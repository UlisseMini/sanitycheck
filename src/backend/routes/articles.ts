// ABOUTME: Article and analysis CRUD routes.
// ABOUTME: Handles article creation and storing analysis results.

import { Elysia, t } from 'elysia'
import { prisma, hashText, getClientIp } from '../shared'

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

    let article = await prisma.article.findUnique({
      where: { url_textHash: { url, textHash } }
    })

    const isNew = !article

    if (!article) {
      article = await prisma.article.create({
        data: { url, title: title ?? null, textContent, textHash, ip, userAgent }
      })
    }

    return { articleId: article.id, isNew }
  }, {
    body: CreateArticleRequest,
    response: CreateArticleResponse
  })

  // Add analysis results to article
  .post('/:articleId/analysis', async ({ params, body }) => {
    const { articleId } = params
    const { modelVersion, rawResponse, severity, highlights, promptUsed, isCustomPrompt } = body

    if (!rawResponse) {
      throw new Error('Missing required field: rawResponse')
    }

    const article = await prisma.article.findUnique({ where: { id: articleId } })
    if (!article) {
      throw new Error('Article not found')
    }

    const analysis = await prisma.analysis.create({
      data: {
        articleId,
        modelVersion: modelVersion ?? null,
        rawResponse,
        severity: severity ?? null,
        promptUsed: promptUsed ?? null,
        isCustomPrompt: isCustomPrompt ?? false,
        highlights: highlights ? {
          create: highlights.map((h) => ({
            quote: h.quote,
            importance: h.importance ?? 'minor',
            gap: h.gap ?? ''
          }))
        } : undefined
      },
      include: { highlights: true }
    })

    return {
      analysisId: analysis.id,
      highlightCount: analysis.highlights.length
    }
  }, {
    body: AddAnalysisRequest,
    response: AddAnalysisResponse
  })
