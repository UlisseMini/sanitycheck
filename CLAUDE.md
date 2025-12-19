# SanityCheck

AI-powered browser extension that detects logical reasoning gaps in articles using Claude.

## Commands

```bash
npm run dev        # Build + start server + watch for changes (rebuilds on any src/ change)
npm run build      # Full build (backend + extension + zip)
npm run typecheck  # TypeScript type checking
npm test           # Run tests (vitest)
npm run lint       # ESLint
```

`npm run dev` is sufficient for all development.

## Persistence

When asked to remember something, write a design doc, plan, or save context:

- **Plans/designs**: `.claude/plans/<topic>.md`
- **Memories/context**: `.claude/memories/<topic>.md`

These persist across sessions. Check `.claude/` when starting work to recall prior context.
