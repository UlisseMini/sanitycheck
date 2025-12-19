# SanityCheck

Browser extension that uses Claude with special prompting and pipelining to find logical gaps in articles. Users click on an article, we extract the text, analyze it, and highlight problematic passages inline.

## Architecture

```
Extension (browser)  →  Backend API (Express)  →  Claude API (Anthropic)
                              ↓
                         PostgreSQL
```

## Commands

```bash
npm run dev          # Build + start server + watch for changes
npm run dev:db       # Start local Postgres via Docker
npm run build        # Full build (backend + extension + zip)
npm run typecheck    # TypeScript type checking
npm test             # Run tests (vitest)
npm run lint         # ESLint
```

## First-time Setup

```bash
npm install
cp .env.example .env    # Defaults work for local dev
npm run dev:db          # Start Postgres
npx prisma migrate deploy
npm run dev
```

## Persistence

When asked to remember something, write a design doc, plan, or save context:

- **Plans/designs**: `.claude/plans/<topic>.md`
- **Memories/context**: `.claude/memories/<topic>.md`

These persist across sessions. Check `.claude/` when starting work to recall prior context.
