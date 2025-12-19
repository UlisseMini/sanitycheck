// ABOUTME: Debug logging routes for extension telemetry.
// ABOUTME: Receives and queries extension debug logs.

import { Router, Request, Response, NextFunction } from 'express';
import { prisma, requireAdmin, getClientIp } from '../shared';

const router = Router();

// Receive debug logs from extension (public endpoint)
router.post('/log', async (req: Request, res: Response) => {
  try {
    const { level, message, data, source, version } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Missing message' });
      return;
    }

    const ip = getClientIp(req) || 'unknown';
    const userAgent = req.headers['user-agent'] || null;

    await prisma.debugLog.create({
      data: {
        level: level || 'log',
        message,
        data: data || null,
        source: source || null,
        ip,
        version: version || null,
        userAgent,
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Debug log error:', error);
    res.json({ success: false });
  }
});

// Get debug logs (admin only)
router.get('/logs', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const ip = req.query.ip as string | undefined;
    const level = req.query.level as string | undefined;
    const since = req.query.since as string | undefined;

    const where: {
      ip?: string;
      level?: string;
      createdAt?: { gte: Date };
    } = {};

    if (ip) where.ip = ip;
    if (level) where.level = level;

    if (since) {
      let sinceDate: Date;
      const match = since.match(/^(\d+)(m|h|d)$/);
      if (match && match[1] && match[2]) {
        const amount = parseInt(match[1], 10);
        const unit = match[2];
        const ms = unit === 'm' ? amount * 60 * 1000
                 : unit === 'h' ? amount * 60 * 60 * 1000
                 : amount * 24 * 60 * 60 * 1000;
        sinceDate = new Date(Date.now() - ms);
      } else {
        sinceDate = new Date(since);
      }

      if (!isNaN(sinceDate.getTime())) {
        where.createdAt = { gte: sinceDate };
      }
    }

    const [logs, total] = await Promise.all([
      prisma.debugLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.debugLog.count({ where })
    ]);

    const uniqueIps = await prisma.debugLog.groupBy({
      by: ['ip'],
      _count: true,
      orderBy: { _count: { ip: 'desc' } },
      take: 50
    });

    res.json({
      logs,
      total,
      limit,
      offset,
      availableIps: uniqueIps.map((i: { ip: string | null; _count: number }) => ({ ip: i.ip, count: i._count }))
    });
  } catch (error) {
    next(error);
  }
});

// Clear old debug logs (admin only)
router.delete('/logs', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const olderThan = req.query.olderThan as string || '7d';

    const match = olderThan.match(/^(\d+)(m|h|d)$/);
    if (!match || !match[1] || !match[2]) {
      res.status(400).json({ error: 'Invalid olderThan format. Use format like 5m, 1h, 7d' });
      return;
    }

    const amount = parseInt(match[1], 10);
    const unit = match[2];
    const ms = unit === 'm' ? amount * 60 * 1000
             : unit === 'h' ? amount * 60 * 60 * 1000
             : amount * 24 * 60 * 60 * 1000;

    const cutoffDate = new Date(Date.now() - ms);

    const result = await prisma.debugLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } }
    });

    res.json({ success: true, deleted: result.count });
  } catch (error) {
    next(error);
  }
});

export default router;
