// ABOUTME: Article and analysis CRUD routes.
// ABOUTME: Handles article creation and storing analysis results.

import { Router, Request, Response, NextFunction } from 'express';
import { prisma, hashText, getClientIp } from '../shared';

const router = Router();

interface HighlightInput {
  quote: string;
  importance?: string;
  gap?: string;
}

// Create article
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, title, textContent } = req.body;

    if (!url || !textContent) {
      res.status(400).json({ error: 'Missing required fields: url, textContent' });
      return;
    }

    const textHash = hashText(textContent);
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || null;

    let article = await prisma.article.findUnique({
      where: { url_textHash: { url, textHash } }
    });

    if (!article) {
      article = await prisma.article.create({
        data: { url, title, textContent, textHash, ip, userAgent }
      });
    }

    res.status(201).json({ articleId: article.id, isNew: !article });
  } catch (error) {
    next(error);
  }
});

// Add analysis results to article
router.post('/:articleId/analysis', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const articleId = req.params['articleId'];
    if (!articleId) {
      res.status(400).json({ error: 'Missing articleId parameter' });
      return;
    }

    const { modelVersion, rawResponse, severity, highlights, promptUsed, isCustomPrompt } = req.body as {
      modelVersion?: string;
      rawResponse: unknown;
      severity?: string;
      highlights?: HighlightInput[];
      promptUsed?: string;
      isCustomPrompt?: boolean;
    };

    if (!rawResponse) {
      res.status(400).json({ error: 'Missing required field: rawResponse' });
      return;
    }

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
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
    });

    res.status(201).json({
      analysisId: analysis.id,
      highlightCount: analysis.highlights.length
    });
  } catch (error) {
    next(error);
  }
});

export default router;
