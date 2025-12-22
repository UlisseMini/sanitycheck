// ABOUTME: User comment/feedback routes.
// ABOUTME: Handles creating comments linked to articles.

import { Elysia, t } from 'elysia'
import { hashText, getClientIp } from '../shared'
import { db, articles, comments } from '../db'
import { eq, and } from 'drizzle-orm'

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

    // Find existing article
    let article = await db.query.articles.findFirst({
      where: and(eq(articles.url, url), eq(articles.textHash, textHash)),
    })

    const isNewArticle = !article

    // Create if not exists
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

    // Create comment
    const [comment] = await db.insert(comments).values({
      articleId: article.id,
      selectedText,
      commentText,
      ip,
      userAgent,
    }).returning()

    return {
      commentId: comment!.id,
      articleId: article.id,
      isNewArticle
    }
  }, {
    body: CommentRequest,
    response: CommentResponse
  })
