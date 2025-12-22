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
