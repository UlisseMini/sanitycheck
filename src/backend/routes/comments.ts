// ABOUTME: User comment/feedback routes.
// ABOUTME: Handles creating comments linked to articles.

import { Elysia, t } from 'elysia'
import { prisma, hashText, getClientIp } from '../shared'

const CommentRequest = t.Object({
  url: t.String(),
  title: t.Optional(t.String()),
  textContent: t.String(),
  selectedText: t.String(),
  commentText: t.String()
})

const CommentResponse = t.Object({
  commentId: t.String(),
  articleId: t.String(),
  isNewArticle: t.Boolean()
})

export const commentsRoutes = new Elysia({ prefix: '/comments' })
  .post('/', async ({ body, request }) => {
    const { url, title, textContent, selectedText, commentText } = body

    const textHash = hashText(textContent)
    const ip = getClientIp(request.headers)
    const userAgent = request.headers.get('user-agent')

    let article = await prisma.article.findUnique({
      where: { url_textHash: { url, textHash } }
    })

    const isNewArticle = !article

    if (!article) {
      article = await prisma.article.create({
        data: { url, title: title ?? null, textContent, textHash, ip, userAgent }
      })
    }

    const comment = await prisma.comment.create({
      data: {
        articleId: article.id,
        selectedText,
        commentText,
        ip,
        userAgent
      }
    })

    return {
      commentId: comment.id,
      articleId: article.id,
      isNewArticle
    }
  }, {
    body: CommentRequest,
    response: CommentResponse
  })
