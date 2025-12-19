// ABOUTME: Legacy annotation routes for public API.
// ABOUTME: Handles CRUD operations on user annotations.

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../shared';

const router = Router();

// Submit an annotation
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, title, quote, annotation, fallacyType, userId } = req.body;

    if (!url || !quote || !annotation) {
      res.status(400).json({
        error: 'Missing required fields: url, quote, annotation'
      });
      return;
    }

    const userAgent = req.headers['user-agent'] || null;

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
    });

    console.log(`New annotation: ${created.id} for ${url}`);

    res.status(201).json({
      success: true,
      id: created.id,
      createdAt: created.createdAt
    });
  } catch (error) {
    next(error);
  }
});

// Get all annotations
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const fallacyType = req.query.fallacyType as string | undefined;

    const where = fallacyType ? { fallacyType } : {};

    const [annotations, total] = await Promise.all([
      prisma.annotation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.annotation.count({ where })
    ]);

    res.json({ annotations, total, limit, offset });
  } catch (error) {
    next(error);
  }
});

// Get annotations for a specific URL
router.get('/by-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const url = req.query.url as string;

    if (!url) {
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }

    const annotations = await prisma.annotation.findMany({
      where: { url },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ annotations });
  } catch (error) {
    next(error);
  }
});

export default router;
