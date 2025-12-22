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
