import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Submit an annotation
app.post('/annotations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, title, quote, annotation, fallacyType, userId } = req.body;
    
    // Validation
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

// Get all annotations (for later use in prompt engineering)
app.get('/annotations', async (req: Request, res: Response, next: NextFunction) => {
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
    
    res.json({
      annotations,
      total,
      limit,
      offset
    });
  } catch (error) {
    next(error);
  }
});

// Get annotations for a specific URL
app.get('/annotations/by-url', async (req: Request, res: Response, next: NextFunction) => {
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

// Get stats
app.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
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
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // last 24h
          }
        }
      })
    ]);
    
    res.json({
      total,
      last24h: recentCount,
      byFallacyType: byType.map(b => ({
        type: b.fallacyType || 'unspecified',
        count: b._count
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Export annotations as JSONL (for prompt engineering)
app.get('/export', async (req: Request, res: Response, next: NextFunction) => {
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

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

