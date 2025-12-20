// ABOUTME: Legacy annotation routes for public API.
// ABOUTME: Handles CRUD operations on user annotations.

import { Elysia, t } from 'elysia'
import { prisma } from '../shared'

const CreateAnnotationRequest = t.Object({
  url: t.String(),
  title: t.Optional(t.String()),
  quote: t.String(),
  annotation: t.String(),
  fallacyType: t.Optional(t.String()),
  userId: t.Optional(t.String())
})

const CreateAnnotationResponse = t.Object({
  success: t.Literal(true),
  id: t.String(),
  createdAt: t.Date()
})

const AnnotationItem = t.Object({
  id: t.String(),
  url: t.String(),
  title: t.Nullable(t.String()),
  quote: t.String(),
  annotation: t.String(),
  fallacyType: t.Nullable(t.String()),
  userId: t.Nullable(t.String()),
  userAgent: t.Nullable(t.String()),
  createdAt: t.Date()
})

const ListAnnotationsResponse = t.Object({
  annotations: t.Array(AnnotationItem),
  total: t.Number(),
  limit: t.Number(),
  offset: t.Number()
})

const ByUrlResponse = t.Object({
  annotations: t.Array(AnnotationItem)
})

export const annotationsRoutes = new Elysia({ prefix: '/annotations' })
  // Submit an annotation
  .post('/', async ({ body, request }) => {
    const { url, title, quote, annotation, fallacyType, userId } = body
    const userAgent = request.headers.get('user-agent')

    const created = await prisma.annotation.create({
      data: {
        url,
        title: title || null,
        quote,
        annotation,
        fallacyType: fallacyType || null,
        userId: userId || null,
        userAgent,
      }
    })

    console.log(`New annotation: ${created.id} for ${url}`)

    return {
      success: true as const,
      id: created.id,
      createdAt: created.createdAt
    }
  }, {
    body: CreateAnnotationRequest,
    response: CreateAnnotationResponse
  })

  // Get all annotations
  .get('/', async ({ query }) => {
    const limit = Math.min(parseInt(query.limit || '100'), 1000)
    const offset = parseInt(query.offset || '0')
    const fallacyType = query.fallacyType

    const where = fallacyType ? { fallacyType } : {}

    const [annotations, total] = await Promise.all([
      prisma.annotation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.annotation.count({ where })
    ])

    return { annotations, total, limit, offset }
  }, {
    query: t.Object({
      limit: t.Optional(t.String()),
      offset: t.Optional(t.String()),
      fallacyType: t.Optional(t.String())
    }),
    response: ListAnnotationsResponse
  })

  // Get annotations for a specific URL
  .get('/by-url', async ({ query }) => {
    const url = query.url

    if (!url) {
      throw new Error('Missing url parameter')
    }

    const annotations = await prisma.annotation.findMany({
      where: { url },
      orderBy: { createdAt: 'desc' }
    })

    return { annotations }
  }, {
    query: t.Object({
      url: t.Optional(t.String())
    }),
    response: ByUrlResponse
  })
