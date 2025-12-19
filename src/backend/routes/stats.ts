// ABOUTME: Public stats and export routes.
// ABOUTME: Provides annotation statistics and data export.

import { Router, Request, Response, NextFunction } from 'express';
import { prisma, requireAdmin } from '../shared';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [total, byType, recentCount] = await Promise.all([
      prisma.annotation.count(),
      prisma.annotation.groupBy({
        by: ['fallacyType'],
        _count: true,
        orderBy: { _count: { fallacyType: 'desc' } }
      }),
      prisma.annotation.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      total,
      last24h: recentCount,
      byFallacyType: byType.map((b: { fallacyType: string | null; _count: number }) => ({
        type: b.fallacyType || 'unspecified',
        count: b._count
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Export annotations as JSONL (requires admin)
router.get('/export', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const annotations = await prisma.annotation.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        url: true,
        quote: true,
        annotation: true,
        fallacyType: true,
        createdAt: true
      }
    });

    res.setHeader('Content-Type', 'application/jsonl');
    res.setHeader('Content-Disposition', 'attachment; filename=annotations.jsonl');

    for (const ann of annotations) {
      res.write(JSON.stringify(ann) + '\n');
    }
    res.end();
  } catch (error) {
    next(error);
  }
});

export default router;
