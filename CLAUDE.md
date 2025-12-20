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

When something changes about the project, remember to make a minimal update to `CLAUDE.md`.

When asked to remember something, write a design doc, plan, or save context: Write it to `.claude/plans/<plan>.md` or `.claude/docs/<doc>.md`.

These persist across sessions. Check `.claude/` when starting work and, if there's context that's directly relevant to the task at hand, read it in.
