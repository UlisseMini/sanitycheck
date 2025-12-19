// ABOUTME: User comment/feedback routes.
// ABOUTME: Handles creating comments linked to articles.

import { Router, Request, Response, NextFunction } from 'express';
import { prisma, hashText, getClientIp } from '../shared';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, title, textContent, selectedText, commentText } = req.body;

    if (!url || !textContent || !selectedText || !commentText) {
      res.status(400).json({
        error: 'Missing required fields: url, textContent, selectedText, commentText'
      });
      return;
    }

    const textHash = hashText(textContent);
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || null;

    let article = await prisma.article.findUnique({
      where: { url_textHash: { url, textHash } }
    });

    const isNewArticle = !article;

    if (!article) {
      article = await prisma.article.create({
        data: { url, title, textContent, textHash, ip, userAgent }
      });
    }

    const comment = await prisma.comment.create({
      data: {
        articleId: article.id,
        selectedText,
        commentText,
        ip,
        userAgent
      }
    });

    res.status(201).json({
      commentId: comment.id,
      articleId: article.id,
      isNewArticle
    });
  } catch (error) {
    next(error);
  }
});

export default router;
