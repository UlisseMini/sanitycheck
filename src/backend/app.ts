// ABOUTME: Elysia app with full type inference.
// ABOUTME: Export type App for end-to-end type safety with extension.

import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { staticPlugin } from '@elysiajs/static'
import { existsSync, mkdirSync, readdirSync } from 'fs'
import { join, dirname } from 'path'

import { generateHomepage } from './pages/homepage'
import { generateFaqPage } from './pages/faq'
import { generatePrivacyPage } from './pages/privacy'
import { generateTechnicalFaqPage } from './pages/technical-faq'
import { generateEarlyAccessPage } from './pages/early-access'
import { generateAdminPage } from './pages/admin'
import { prisma, ADMIN_KEY } from './shared'

import { analyzeRoutes } from './routes/analyze'
import { articlesRoutes } from './routes/articles'
import { commentsRoutes } from './routes/comments'
import { annotationsRoutes } from './routes/annotations'
import { statsRoutes } from './routes/stats'
import { debugRoutes } from './routes/debug'
import { adminRoutes } from './routes/admin'
import { earlyAccessRoutes } from './routes/early-access'

// Validate admin key at startup
if (!ADMIN_KEY) {
  console.error('FATAL: ADMIN_KEY environment variable is not set')
  process.exit(1)
}
if (ADMIN_KEY === 'changeme') {
  console.error('FATAL: ADMIN_KEY cannot be "changeme" - please set a strong admin key')
  process.exit(1)
}

// Determine public directory path
const srcDir = dirname(import.meta.dir)
const isDevMode = srcDir.endsWith('/src') || srcDir.endsWith('\\src')
const publicDir = isDevMode
  ? join(srcDir, '../build/public')
  : join(srcDir, '../public')

console.log('Public directory path:', publicDir, isDevMode ? '(dev mode)' : '(production)')

if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true })
  console.log('Created public directory:', publicDir)
}

if (existsSync(publicDir)) {
  console.log('Static files available:', readdirSync(publicDir))
} else {
  console.warn('WARNING: Public directory does not exist:', publicDir)
}

const PORT = parseInt(process.env.PORT || '3000', 10)

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type export
const app = new Elysia()
  .use(cors())
  .use(staticPlugin({
    prefix: '/static',
    assets: publicDir
  }))

  // Request logging
  .onBeforeHandle(({ request, body }) => {
    const url = new URL(request.url)
    let bodyStr = ''
    if (body && typeof body === 'object') {
      const bodyWithoutUserAgent = { ...body as Record<string, unknown> }
      delete bodyWithoutUserAgent.userAgent
      if (Object.keys(bodyWithoutUserAgent).length > 0) {
        bodyStr = JSON.stringify(bodyWithoutUserAgent).slice(0, 500)
      }
    }
    console.log(`${request.method} ${url.pathname}${bodyStr ? ' ' + bodyStr : ''}`)
  })

  // Health check
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString()
  }))

  // HTML pages
  .get('/', () => new Response(generateHomepage(), {
    headers: { 'Content-Type': 'text/html' }
  }))
  .get('/faq', () => new Response(generateFaqPage(), {
    headers: { 'Content-Type': 'text/html' }
  }))
  .get('/technical-faq', () => new Response(generateTechnicalFaqPage(), {
    headers: { 'Content-Type': 'text/html' }
  }))
  .get('/privacy', () => new Response(generatePrivacyPage(), {
    headers: { 'Content-Type': 'text/html' }
  }))
  .get('/early-access', () => new Response(generateEarlyAccessPage(), {
    headers: { 'Content-Type': 'text/html' }
  }))
  .get('/admin', () => new Response(generateAdminPage(), {
    headers: { 'Content-Type': 'text/html' }
  }))

  // API routes
  .use(analyzeRoutes)
  .use(articlesRoutes)
  .use(commentsRoutes)
  .use(annotationsRoutes)
  .use(statsRoutes)
  .use(debugRoutes)
  .use(adminRoutes)
  .use(earlyAccessRoutes)

  // Error handler
  .onError(({ error, code, request }) => {
    if (code === 'NOT_FOUND') {
      const url = new URL(request.url)
      console.log(`404 ${url.pathname}`)
      return { error: 'Not found' }
    }
    console.error('Error:', error)
    return { error: 'Internal server error' }
  })

  .listen(PORT)

console.log(`Server running on port ${PORT}`)
console.log(`Health check: http://localhost:${PORT}/health`)
console.log(`Admin panel: http://localhost:${PORT}/admin`)

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...')
  await prisma.$disconnect()
  process.exit(0)
})

// Export the app type for end-to-end type safety with extension
export type App = typeof app
