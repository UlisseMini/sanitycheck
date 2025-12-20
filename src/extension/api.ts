// ABOUTME: Type-safe API client using Eden.
// ABOUTME: Types flow from backend/app.ts at compile time.

import { treaty } from '@elysiajs/eden'
import type { App } from '../backend/app'
import { BACKEND_URL } from './config'

// Create typed client - all methods are inferred from App type
export const api = treaty<App>(BACKEND_URL)

// Re-export useful types derived from the API
// These can be used throughout the extension for type-safe data handling
export type AnalyzeData = NonNullable<Awaited<ReturnType<typeof api.analyze.post>>['data']>
