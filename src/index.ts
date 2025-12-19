// ABOUTME: Express server entry point and route orchestration.
// ABOUTME: Configures middleware and mounts all route modules.

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import { generateHomepage } from './backend/pages/homepage';
import { generateFaqPage } from './backend/pages/faq';
import { generatePrivacyPage } from './backend/pages/privacy';
import { generateTechnicalFaqPage } from './backend/pages/technical-faq';
import { generateEarlyAccessPage } from './backend/pages/early-access';
import { prisma, ADMIN_KEY } from './backend/shared';
import {
  analyzeRoutes,
  articlesRoutes,
  commentsRoutes,
  annotationsRoutes,
  statsRoutes,
  debugRoutes,
  adminRoutes,
  earlyAccessRoutes,
} from './backend/routes';

// Validate admin key at startup
if (!ADMIN_KEY) {
  console.error('FATAL: ADMIN_KEY environment variable is not set');
  process.exit(1);
}
if (ADMIN_KEY === 'changeme') {
  console.error('FATAL: ADMIN_KEY cannot be "changeme" - please set a strong admin key');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Static files
const isDevMode = __dirname.endsWith('/src') || __dirname.endsWith('\\src');
const publicDir = isDevMode
  ? path.join(__dirname, '../build/public')
  : path.join(__dirname, '../public');
console.log('Public directory path:', publicDir, isDevMode ? '(dev mode)' : '(production)');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Created public directory:', publicDir);
}

app.use('/static', express.static(publicDir));

if (fs.existsSync(publicDir)) {
  console.log('Static files available:', fs.readdirSync(publicDir));
} else {
  console.warn('WARNING: Public directory does not exist:', publicDir);
}

// Extension download fallback
app.get('/static/sanitycheck-extension.zip', (_req, res) => {
  const zipPath = path.join(publicDir, 'sanitycheck-extension.zip');
  console.log('Extension download requested, looking for:', zipPath);
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'sanitycheck-extension.zip');
  } else {
    console.error('Extension zip not found at:', zipPath);
    res.status(404).send('Extension zip not found. Please contact support.');
  }
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Page routes
app.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(generateHomepage());
});

app.get('/faq', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(generateFaqPage());
});

app.get('/technical-faq', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(generateTechnicalFaqPage());
});

app.get('/privacy', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(generatePrivacyPage());
});

app.get('/early-access', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(generateEarlyAccessPage());
});

// API routes
app.use('/analyze', analyzeRoutes);
app.use('/articles', articlesRoutes);
app.use('/comments', commentsRoutes);
app.use('/annotations', annotationsRoutes);
app.use('/stats', statsRoutes);
app.use('/debug', debugRoutes);
app.use('/admin', adminRoutes);
app.use('/api', earlyAccessRoutes);

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
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
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
