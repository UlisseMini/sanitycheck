# SanityCheck

Our core mission is to help people think clearly, rationally and rigorously. We do this by providing AI sanity checks on writing. We primarily want to assist users:

- Trying to infer nontrivial facts about the world or future
- Thinking through hard research problems
- Making difficult decisions

The **core hard problem** that we're in the process of solving is: How do we scaffold modern language models to do high-quality & robust reasoning checks? We _must_ figure out how to avoid annoying, false-positive issues being raised that aren't actually issues. (Otherwise we'll just be uninstalled and fail at our mission.)

Currently, the project is a browser extension that uses Claude with special prompting to find logical gaps in articles. Users click on an article, we extract the text, analyze it, and highlight problematic passages inline. We will soon move to a multistep pipeline as the single prompt performance is not good right now.

Some users use SanityCheck on things they're writing, e.g. by running the extension in the substack editor. We may release a native writing tool at some point.

## Architecture

```
Extension (browser)  →  Backend API (Elysia/Bun)  →  Claude API (Anthropic)
       ↑                        ↓
  Eden client              PostgreSQL
  (type-safe)
```

**End-to-end type safety**: The extension imports `type App` from the backend, and uses Eden to make type-safe API calls. TypeScript verifies that extension API calls match backend route definitions at compile time.

## Commands

```bash
npm run dev          # Start Elysia server with hot reload (Bun)
npm run dev:db       # Start local Postgres via Docker
npm run build        # Build extension + shared assets
npm run start        # Start production server
npm run typecheck    # TypeScript type checking (verifies backend/extension types match)
npm test             # Run tests (vitest)
npm run lint         # ESLint
npm run pipeline     # Test analysis pipeline: npm run pipeline <name> <articles-dir>
```

## First-time Setup

```bash
npm install
cp .env.example .env    # Defaults work for local dev
npm run dev:db          # Start Postgres
npx prisma migrate deploy
npm run dev
```

## Key Files

- `src/backend/app.ts` - Elysia app, exports `type App` for Eden
- `src/extension/api.ts` - Eden client, imports `type App` from backend
- `src/extension/background.ts` - Uses typed API calls

## Persistence

When something changes about the project, remember to make a minimal update to `CLAUDE.md`.
