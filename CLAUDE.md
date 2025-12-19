# SanityCheck

AI-powered browser extension that detects logical reasoning gaps in articles using Claude.

## Project Structure

```
src/
  index.ts              # Express backend server
  shared/               # Code shared between backend and extension
  extension/            # Chrome extension source (content, popup, background scripts)
  backend/pages/        # Server-rendered HTML pages (homepage, faq, etc.)
__tests__/              # Vitest tests
scripts/build.js        # Build script
```

## Commands

```bash
npm run dev        # Start dev server (ts-node, auto-reload)
npm run build      # Full build (backend + extension + zip)
npm run typecheck  # TypeScript type checking
npm test           # Run tests (vitest)
npm run lint       # ESLint
```

## Build Output

- `build/backend/` - Compiled backend
- `build/extension/` - Bundled extension files
- `build/public/` - Static assets served at `/static/*` (icons, kawaii.js, extension zip)

## Shared Code

`src/shared/` is used by both backend and extension:
- `kawaii.ts` - Text transformation for "Miss Information" theme
- `colors.ts` - Theme CSS variables
- `constants.ts` - URLs, prompts

Backend pages load `/static/kawaii.js` (browser build). Extension imports directly from shared.
