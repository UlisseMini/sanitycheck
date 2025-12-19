// ABOUTME: Admin dashboard routes for content management.
// ABOUTME: Provides article, comment, and stats management endpoints.

import { Router, Request, Response, NextFunction } from 'express';
import { prisma, requireAdmin } from '../shared';
import { generateAdminPage } from '../pages/admin';

const router = Router();

// Serve admin page (no auth - page handles its own login)
router.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(generateAdminPage());
});

// Verify admin key
router.get('/verify', requireAdmin, (_req: Request, res: Response) => {
  res.json({ success: true });
});

// Delete annotation (admin only)
router.delete('/annotations/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.annotation.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get all articles (admin)
router.get('/articles', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

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
    ]);

    res.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      articles: articles.map((a: any) => {
        const latestAnalysis = a.analyses[0];
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
        };
      }),
      total,
      limit,
      offset
    });
  } catch (error) {
    next(error);
  }
});

// Get single article with all data (admin)
router.get('/articles/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await prisma.article.findUnique({
      where: { id: req.params.id },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          include: { highlights: true }
        },
        comments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    res.json({ article });
  } catch (error) {
    next(error);
  }
});

// Delete article (admin)
router.delete('/articles/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.article.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get all comments (admin)
router.get('/comments', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

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
    ]);

    res.json({ comments, total, limit, offset });
  } catch (error) {
    next(error);
  }
});

// Delete comment (admin)
router.delete('/comments/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.comment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get all early access signups (admin)
router.get('/early-access', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    const [signups, total] = await Promise.all([
      prisma.earlyAccessSignup.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.earlyAccessSignup.count()
    ]);

    res.json({ signups, total, limit, offset });
  } catch (error) {
    next(error);
  }
});

// Get early access stats (admin)
router.get('/early-access-stats', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [total, recentCount] = await Promise.all([
      prisma.earlyAccessSignup.count(),
      prisma.earlyAccessSignup.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // last 24h
          }
        }
      })
    ]);

    res.json({
      total,
      last24h: recentCount
    });
  } catch (error) {
    next(error);
  }
});

// Get feedback stats
router.get('/feedback-stats', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [articleCount, analysisCount, commentCount, highlightCount, recentArticles] = await Promise.all([
      prisma.article.count(),
      prisma.analysis.count(),
      prisma.comment.count(),
      prisma.highlight.count(),
      prisma.article.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      })
    ]);

    const highlightsByImportance = await prisma.highlight.groupBy({
      by: ['importance'],
      _count: true
    });

    res.json({
      articles: articleCount,
      analyses: analysisCount,
      comments: commentCount,
      highlights: highlightCount,
      articlesLast24h: recentArticles,
      highlightsByImportance: highlightsByImportance.map((h: { importance: string; _count: number }) => ({
        importance: h.importance,
        count: h._count
      }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;
