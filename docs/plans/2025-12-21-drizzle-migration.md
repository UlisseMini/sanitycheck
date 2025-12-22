# Prisma to Drizzle ORM Migration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Prisma ORM with Drizzle ORM for simpler, more performant database access

**Architecture:** Drizzle schema defines tables in TypeScript with full type inference. Single db client exported from shared.ts. Relations defined separately from schema. Migrations generated via drizzle-kit and applied programmatically.

**Tech Stack:** drizzle-orm, drizzle-kit, postgres (postgres.js driver)

---

## Task 1: Install Drizzle Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install drizzle-orm and postgres driver**

Run:
```bash
bun add drizzle-orm postgres
```

**Step 2: Install drizzle-kit as dev dependency**

Run:
```bash
bun add -D drizzle-kit
```

**Step 3: Verify installation**

Run: `bun pm ls | grep -E "drizzle|postgres"`

Expected: Both drizzle-orm and postgres packages listed

**Step 4: Commit**

```bash
git add package.json bun.lockb
git commit -m "chore: add drizzle-orm and postgres dependencies"
```

---

## Task 2: Create Drizzle Schema

**Files:**
- Create: `src/backend/db/schema.ts`

**Step 1: Create the schema file with all tables**

```typescript
// ABOUTME: Drizzle schema defining all database tables
// ABOUTME: Mirrors the Prisma schema with PostgreSQL-native types

import { pgTable, text, timestamp, boolean, jsonb, index, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

// =====================================================
// Core Data Models
// =====================================================

export const articles = pgTable('Article', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  url: text('url').notNull(),
  title: text('title'),
  textContent: text('textContent').notNull(),
  textHash: text('textHash').notNull(),
  ip: text('ip'),
  userAgent: text('userAgent'),
}, (table) => [
  unique('Article_url_textHash_key').on(table.url, table.textHash),
  index('Article_url_idx').on(table.url),
  index('Article_createdAt_idx').on(table.createdAt),
  index('Article_ip_idx').on(table.ip),
])

export const analyses = pgTable('Analysis', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  articleId: text('articleId').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  modelVersion: text('modelVersion'),
  rawResponse: jsonb('rawResponse').notNull(),
  severity: text('severity'),
  promptUsed: text('promptUsed'),
  isCustomPrompt: boolean('isCustomPrompt').default(false).notNull(),
}, (table) => [
  index('Analysis_articleId_idx').on(table.articleId),
  index('Analysis_createdAt_idx').on(table.createdAt),
])

export const highlights = pgTable('Highlight', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  analysisId: text('analysisId').notNull().references(() => analyses.id, { onDelete: 'cascade' }),
  quote: text('quote').notNull(),
  importance: text('importance').notNull(),
  gap: text('gap').notNull(),
}, (table) => [
  index('Highlight_analysisId_idx').on(table.analysisId),
  index('Highlight_importance_idx').on(table.importance),
])

export const comments = pgTable('Comment', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  articleId: text('articleId').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  selectedText: text('selectedText').notNull(),
  commentText: text('commentText').notNull(),
  ip: text('ip'),
  userAgent: text('userAgent'),
}, (table) => [
  index('Comment_articleId_idx').on(table.articleId),
  index('Comment_createdAt_idx').on(table.createdAt),
])

// =====================================================
// Legacy & Utility Models
// =====================================================

// DEPRECATED: Use comments instead. Kept for data migration.
export const annotations = pgTable('Annotation', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  url: text('url').notNull(),
  title: text('title'),
  quote: text('quote').notNull(),
  annotation: text('annotation').notNull(),
  fallacyType: text('fallacyType'),
  userId: text('userId'),
  userAgent: text('userAgent'),
}, (table) => [
  index('Annotation_url_idx').on(table.url),
  index('Annotation_fallacyType_idx').on(table.fallacyType),
  index('Annotation_createdAt_idx').on(table.createdAt),
])

export const debugLogs = pgTable('DebugLog', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  level: text('level').notNull(),
  message: text('message').notNull(),
  data: jsonb('data'),
  source: text('source'),
  ip: text('ip'),
  version: text('version'),
  userAgent: text('userAgent'),
}, (table) => [
  index('DebugLog_createdAt_idx').on(table.createdAt),
  index('DebugLog_ip_idx').on(table.ip),
  index('DebugLog_level_idx').on(table.level),
])

export const earlyAccessSignups = pgTable('EarlyAccessSignup', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  firstName: text('firstName').notNull(),
  email: text('email').notNull(),
  discord: text('discord'),
  reason: text('reason'),
  ip: text('ip'),
  userAgent: text('userAgent'),
}, (table) => [
  index('EarlyAccessSignup_email_idx').on(table.email),
  index('EarlyAccessSignup_createdAt_idx').on(table.createdAt),
])
```

**Step 2: Verify TypeScript compiles**

Run: `bun run typecheck`

Expected: No errors (may need cuid2 package)

**Step 3: Install cuid2 if needed**

Run: `bun add @paralleldrive/cuid2`

**Step 4: Commit**

```bash
git add src/backend/db/schema.ts package.json bun.lockb
git commit -m "feat: add drizzle schema matching prisma models"
```

---

## Task 3: Define Drizzle Relations

**Files:**
- Modify: `src/backend/db/schema.ts`

**Step 1: Add relations after table definitions**

Append to `src/backend/db/schema.ts`:

```typescript
// =====================================================
// Relations
// =====================================================

export const articlesRelations = relations(articles, ({ many }) => ({
  analyses: many(analyses),
  comments: many(comments),
}))

export const analysesRelations = relations(analyses, ({ one, many }) => ({
  article: one(articles, {
    fields: [analyses.articleId],
    references: [articles.id],
  }),
  highlights: many(highlights),
}))

export const highlightsRelations = relations(highlights, ({ one }) => ({
  analysis: one(analyses, {
    fields: [highlights.analysisId],
    references: [analyses.id],
  }),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  article: one(articles, {
    fields: [comments.articleId],
    references: [articles.id],
  }),
}))
```

**Step 2: Verify TypeScript compiles**

Run: `bun run typecheck`

Expected: No errors

**Step 3: Commit**

```bash
git add src/backend/db/schema.ts
git commit -m "feat: add drizzle relations for eager loading"
```

---

## Task 4: Create Drizzle Configuration

**Files:**
- Create: `drizzle.config.ts`

**Step 1: Create drizzle config file**

```typescript
// ABOUTME: Drizzle Kit configuration for migrations
// ABOUTME: Points to schema file and sets PostgreSQL dialect

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/backend/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

**Step 2: Add drizzle scripts to package.json**

Add to `scripts` section:
```json
"drizzle:generate": "drizzle-kit generate",
"drizzle:push": "drizzle-kit push",
"drizzle:studio": "drizzle-kit studio"
```

**Step 3: Verify config is valid**

Run: `bun run drizzle:generate --dry-run` (or just check that drizzle-kit recognizes the config)

**Step 4: Commit**

```bash
git add drizzle.config.ts package.json
git commit -m "chore: add drizzle-kit configuration"
```

---

## Task 5: Create Database Client

**Files:**
- Create: `src/backend/db/client.ts`

**Step 1: Create the Drizzle client**

```typescript
// ABOUTME: Drizzle database client with postgres.js driver
// ABOUTME: Exports typed db instance for use in route handlers

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Create postgres.js client
const queryClient = postgres(connectionString)

// Create drizzle instance with schema for relational queries
export const db = drizzle(queryClient, { schema })

// Export for graceful shutdown
export const closeDb = async () => {
  await queryClient.end()
}
```

**Step 2: Verify TypeScript compiles**

Run: `bun run typecheck`

Expected: No errors

**Step 3: Commit**

```bash
git add src/backend/db/client.ts
git commit -m "feat: add drizzle database client"
```

---

## Task 6: Create db/index.ts Barrel Export

**Files:**
- Create: `src/backend/db/index.ts`

**Step 1: Create barrel export**

```typescript
// ABOUTME: Barrel export for database layer
// ABOUTME: Re-exports client, schema, and table references

export { db, closeDb } from './client'
export * from './schema'
```

**Step 2: Commit**

```bash
git add src/backend/db/index.ts
git commit -m "chore: add db barrel export"
```

---

## Task 7: Migrate articles.ts Route

**Files:**
- Modify: `src/backend/routes/articles.ts`

**Step 1: Read the current implementation**

Read `src/backend/routes/articles.ts` to understand current Prisma usage.

**Step 2: Update imports**

Replace:
```typescript
import { prisma, hashText, getClientIp } from '../shared'
```

With:
```typescript
import { hashText, getClientIp } from '../shared'
import { db, articles, analyses, highlights } from '../db'
import { eq, and } from 'drizzle-orm'
```

**Step 3: Update findUnique to Drizzle**

Replace Prisma's `prisma.article.findUnique({ where: { url_textHash: { url, textHash } } })`:

```typescript
const existing = await db.query.articles.findFirst({
  where: and(eq(articles.url, url), eq(articles.textHash, textHash)),
})
```

**Step 4: Update article create**

Replace Prisma's `prisma.article.create()`:

```typescript
const [article] = await db.insert(articles).values({
  url,
  title,
  textContent,
  textHash,
  ip,
  userAgent,
}).returning()
```

**Step 5: Update analysis create with nested highlights**

Replace Prisma's nested create pattern. In Drizzle, we need separate inserts:

```typescript
// Insert analysis
const [analysis] = await db.insert(analyses).values({
  articleId: article.id,
  modelVersion,
  rawResponse,
  severity,
  promptUsed,
  isCustomPrompt,
}).returning()

// Insert highlights if any
if (highlightData.length > 0) {
  await db.insert(highlights).values(
    highlightData.map(h => ({
      analysisId: analysis.id,
      quote: h.quote,
      importance: h.importance,
      gap: h.gap,
    }))
  )
}
```

**Step 6: Verify TypeScript compiles**

Run: `bun run typecheck`

**Step 7: Commit**

```bash
git add src/backend/routes/articles.ts
git commit -m "refactor: migrate articles route to drizzle"
```

---

## Task 8: Migrate comments.ts Route

**Files:**
- Modify: `src/backend/routes/comments.ts`

**Step 1: Read the current implementation**

Read `src/backend/routes/comments.ts`.

**Step 2: Update imports**

```typescript
import { hashText, getClientIp } from '../shared'
import { db, articles, comments } from '../db'
import { eq, and } from 'drizzle-orm'
```

**Step 3: Update find or create article logic**

```typescript
// Find existing article
let article = await db.query.articles.findFirst({
  where: and(eq(articles.url, url), eq(articles.textHash, textHash)),
})

// Create if not exists
if (!article) {
  const [newArticle] = await db.insert(articles).values({
    url,
    title,
    textContent,
    textHash,
    ip,
    userAgent,
  }).returning()
  article = newArticle
}

// Create comment
await db.insert(comments).values({
  articleId: article.id,
  selectedText,
  commentText,
  ip,
  userAgent,
})
```

**Step 4: Verify TypeScript compiles**

Run: `bun run typecheck`

**Step 5: Commit**

```bash
git add src/backend/routes/comments.ts
git commit -m "refactor: migrate comments route to drizzle"
```

---

## Task 9: Migrate annotations.ts Route

**Files:**
- Modify: `src/backend/routes/annotations.ts`

**Step 1: Read the current implementation**

**Step 2: Update imports**

```typescript
import { getClientIp } from '../shared'
import { db, annotations } from '../db'
import { eq, desc, sql } from 'drizzle-orm'
```

**Step 3: Update create**

```typescript
await db.insert(annotations).values({
  url,
  title,
  quote,
  annotation,
  fallacyType,
  userId,
  userAgent,
})
```

**Step 4: Update findMany with pagination**

```typescript
const results = await db.select()
  .from(annotations)
  .orderBy(desc(annotations.createdAt))
  .limit(limit)
  .offset(skip)
```

**Step 5: Update count**

```typescript
const [{ count }] = await db.select({ count: sql<number>`count(*)` })
  .from(annotations)
```

**Step 6: Verify TypeScript compiles**

Run: `bun run typecheck`

**Step 7: Commit**

```bash
git add src/backend/routes/annotations.ts
git commit -m "refactor: migrate annotations route to drizzle"
```

---

## Task 10: Migrate debug.ts Route

**Files:**
- Modify: `src/backend/routes/debug.ts`

**Step 1: Read the current implementation**

**Step 2: Update imports**

```typescript
import { getClientIp } from '../shared'
import { db, debugLogs } from '../db'
import { eq, gte, desc, sql, and } from 'drizzle-orm'
```

**Step 3: Update create**

```typescript
await db.insert(debugLogs).values({
  level,
  message,
  data,
  source,
  ip,
  version,
  userAgent,
})
```

**Step 4: Update findMany with filtering**

```typescript
// Build where conditions dynamically
const conditions = []
if (ip) conditions.push(eq(debugLogs.ip, ip))
if (level) conditions.push(eq(debugLogs.level, level))
if (since) conditions.push(gte(debugLogs.createdAt, new Date(since)))

const results = await db.select()
  .from(debugLogs)
  .where(conditions.length > 0 ? and(...conditions) : undefined)
  .orderBy(desc(debugLogs.createdAt))
  .limit(limit)
```

**Step 5: Update count**

```typescript
const [{ count }] = await db.select({ count: sql<number>`count(*)` })
  .from(debugLogs)
```

**Step 6: Update groupBy for active clients**

```typescript
const activeClients = await db.select({
  ip: debugLogs.ip,
  count: sql<number>`count(*)`,
})
  .from(debugLogs)
  .groupBy(debugLogs.ip)
```

**Step 7: Update deleteMany**

```typescript
await db.delete(debugLogs).where(/* condition */)
```

**Step 8: Verify TypeScript compiles**

Run: `bun run typecheck`

**Step 9: Commit**

```bash
git add src/backend/routes/debug.ts
git commit -m "refactor: migrate debug route to drizzle"
```

---

## Task 11: Migrate early-access.ts Route

**Files:**
- Modify: `src/backend/routes/early-access.ts`

**Step 1: Read the current implementation**

**Step 2: Update imports**

```typescript
import { getClientIp } from '../shared'
import { db, earlyAccessSignups } from '../db'
```

**Step 3: Update create with duplicate handling**

Drizzle doesn't throw P2002 like Prisma. Use `onConflictDoNothing()` or catch PostgreSQL error:

```typescript
try {
  await db.insert(earlyAccessSignups).values({
    firstName,
    email,
    discord,
    reason,
    ip,
    userAgent,
  })
} catch (error: unknown) {
  // PostgreSQL unique violation is code 23505
  if (error instanceof Error && 'code' in error && error.code === '23505') {
    return { success: true, message: 'Already signed up' }
  }
  throw error
}
```

Or add unique constraint handling via `.onConflictDoUpdate()` / `.onConflictDoNothing()`.

**Step 4: Verify TypeScript compiles**

Run: `bun run typecheck`

**Step 5: Commit**

```bash
git add src/backend/routes/early-access.ts
git commit -m "refactor: migrate early-access route to drizzle"
```

---

## Task 12: Migrate admin.ts Route

**Files:**
- Modify: `src/backend/routes/admin.ts`

This is the most complex route. Read it first and migrate each query pattern.

**Step 1: Read the current implementation**

**Step 2: Update imports**

```typescript
import { requireAdmin, getClientIp } from '../shared'
import { db, articles, analyses, highlights, comments, earlyAccessSignups, annotations } from '../db'
import { eq, desc, sql } from 'drizzle-orm'
```

**Step 3: Update article listing with counts**

Replace Prisma's include with _count:

```typescript
const articleList = await db.query.articles.findMany({
  orderBy: (articles, { desc }) => [desc(articles.createdAt)],
  limit,
  offset: skip,
  with: {
    analyses: {
      limit: 1,
      orderBy: (analyses, { desc }) => [desc(analyses.createdAt)],
    },
    _count: true, // Not directly supported - need subquery
  },
})
```

Actually, Drizzle doesn't have `_count` like Prisma. You'll need separate count queries or use SQL:

```typescript
const articleList = await db.select({
  ...articles,
  analysisCount: sql<number>`(SELECT count(*) FROM "Analysis" WHERE "articleId" = "Article"."id")`,
  commentCount: sql<number>`(SELECT count(*) FROM "Comment" WHERE "articleId" = "Article"."id")`,
})
  .from(articles)
  .orderBy(desc(articles.createdAt))
  .limit(limit)
  .offset(skip)
```

**Step 4: Update delete operations**

```typescript
await db.delete(articles).where(eq(articles.id, id))
await db.delete(comments).where(eq(comments.id, id))
await db.delete(annotations).where(eq(annotations.id, id))
```

**Step 5: Update article detail with relations**

```typescript
const article = await db.query.articles.findFirst({
  where: eq(articles.id, id),
  with: {
    analyses: {
      with: { highlights: true },
      orderBy: (analyses, { desc }) => [desc(analyses.createdAt)],
    },
    comments: {
      orderBy: (comments, { desc }) => [desc(comments.createdAt)],
    },
  },
})
```

**Step 6: Update highlight groupBy**

```typescript
const highlightStats = await db.select({
  importance: highlights.importance,
  count: sql<number>`count(*)`,
})
  .from(highlights)
  .groupBy(highlights.importance)
```

**Step 7: Verify TypeScript compiles**

Run: `bun run typecheck`

**Step 8: Commit**

```bash
git add src/backend/routes/admin.ts
git commit -m "refactor: migrate admin route to drizzle"
```

---

## Task 13: Migrate stats.ts Route

**Files:**
- Modify: `src/backend/routes/stats.ts`

**Step 1: Read and update**

**Step 2: Update imports and queries**

```typescript
import { db, annotations } from '../db'
import { sql, desc } from 'drizzle-orm'

// Count
const [{ count }] = await db.select({ count: sql<number>`count(*)` })
  .from(annotations)

// Group by fallacyType
const byType = await db.select({
  fallacyType: annotations.fallacyType,
  count: sql<number>`count(*)`,
})
  .from(annotations)
  .groupBy(annotations.fallacyType)

// Export as JSONL
const all = await db.select().from(annotations).orderBy(desc(annotations.createdAt))
```

**Step 3: Verify TypeScript compiles**

Run: `bun run typecheck`

**Step 4: Commit**

```bash
git add src/backend/routes/stats.ts
git commit -m "refactor: migrate stats route to drizzle"
```

---

## Task 14: Update shared.ts

**Files:**
- Modify: `src/backend/shared.ts`

**Step 1: Remove Prisma import and export**

Remove:
```typescript
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient()
```

Keep: `hashText`, `getClientIp`, `requireAdmin`, and other utilities.

**Step 2: Verify no other files import prisma from shared**

Run: `grep -r "from.*shared.*prisma\|import.*prisma.*from" src/`

**Step 3: Verify TypeScript compiles**

Run: `bun run typecheck`

**Step 4: Commit**

```bash
git add src/backend/shared.ts
git commit -m "refactor: remove prisma from shared.ts"
```

---

## Task 15: Update app.ts Graceful Shutdown

**Files:**
- Modify: `src/backend/app.ts`

**Step 1: Update shutdown handler**

Replace:
```typescript
import { prisma } from './shared'
// ...
await prisma.$disconnect()
```

With:
```typescript
import { closeDb } from './db'
// ...
await closeDb()
```

**Step 2: Verify TypeScript compiles**

Run: `bun run typecheck`

**Step 3: Commit**

```bash
git add src/backend/app.ts
git commit -m "refactor: update graceful shutdown for drizzle"
```

---

## Task 16: Remove Prisma

**Files:**
- Modify: `package.json`
- Delete: `prisma/` directory
- Delete: `prisma.config.ts`

**Step 1: Remove Prisma packages**

Run:
```bash
bun remove @prisma/client prisma
```

**Step 2: Remove Prisma scripts from package.json**

Remove from scripts:
- `prisma:generate`
- `prisma:migrate`
- `prisma:studio`
- `postinstall` (or update it if needed for other things)

**Step 3: Delete Prisma files**

```bash
rm -rf prisma/
rm prisma.config.ts
```

**Step 4: Verify TypeScript compiles**

Run: `bun run typecheck`

Expected: No errors, no references to Prisma

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove prisma orm"
```

---

## Task 17: Verify Against Existing Database

**Step 1: Start local database**

Run: `npm run dev:db`

**Step 2: Introspect existing schema matches**

Run: `bun run drizzle:pull` (to see what drizzle-kit sees)

Compare output against your schema.ts to ensure table names and column names match exactly.

**Step 3: Start dev server**

Run: `npm run dev`

**Step 4: Test basic operations**

- Load the extension
- Analyze an article
- Check admin panel loads
- Verify no console errors

**Step 5: Commit if any fixes needed**

---

## Task 18: Run Full Test Suite

**Step 1: Run typecheck**

Run: `npm run typecheck`

Expected: No errors

**Step 2: Run lint**

Run: `npm run lint`

Expected: No errors

**Step 3: Run tests**

Run: `npm test`

Expected: All tests pass (current tests don't hit DB, so should pass)

**Step 4: Commit any fixes**

---

## Task 19: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update commands section**

Replace Prisma commands with Drizzle:
```bash
npm run drizzle:generate  # Generate migrations from schema changes
npm run drizzle:push      # Push schema directly (prototyping)
npm run drizzle:studio    # Open Drizzle Studio
```

**Step 2: Update architecture description if needed**

Mention Drizzle instead of Prisma.

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for drizzle"
```

---

## Notes for Implementer

### Key Differences from Prisma

1. **No nested creates**: Insert parent, get ID, insert children separately
2. **No `_count`**: Use SQL subqueries or separate count queries
3. **Error codes**: PostgreSQL uses `23505` for unique violations (not `P2002`)
4. **Relations are separate**: Define with `relations()` function, not inline
5. **Query API**: Use `db.query.table.findMany()` for relational queries, `db.select().from()` for SQL-style

### Table Naming

The schema uses PascalCase table names (`Article`, `Analysis`) to match existing Prisma migrations. Do NOT change these or you'll need new migrations.

### Type Inference

Drizzle infers types from schema. For insert types:
```typescript
type NewArticle = typeof articles.$inferInsert
type Article = typeof articles.$inferSelect
```
