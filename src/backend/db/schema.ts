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
