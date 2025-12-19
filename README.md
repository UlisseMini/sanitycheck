# SanityCheck

An AI-powered browser extension that spots logical gaps and reasoning issues in articles.

## Project Structure

```
sanitycheck/
├── src/
│   ├── backend/         # Express route modules and pages
│   ├── extension/       # Chrome extension source (TypeScript)
│   ├── shared/          # Code shared between backend and extension
│   └── index.ts         # Server entry point
├── extension/           # Static extension files (HTML, manifest)
├── prisma/              # Database schema and migrations
├── scripts/             # Build and dev scripts
├── build/               # Compiled output (gitignored)
└── docker-compose.yml   # Local Postgres for development
```

## Quick Start

### Backend (Local Development)

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env - defaults work for local Postgres via Docker

# Start local Postgres
npm run dev:db

# Run migrations
npx prisma migrate deploy

# Start development server (watches for changes)
npm run dev
```

The app works without `ANTHROPIC_API_KEY` - only the `/analyze` endpoint requires it.

### Extension (Local Development)

1. Run `npm run build` to build the extension
2. Navigate to `chrome://extensions` in Chrome/Edge
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `build/extension/` folder
5. Click the extension icon on any article

## Development command cheatsheet

```bash
npm run dev          # Build + start server + watch for changes
npm run dev:db       # Start local Postgres (Docker)
npm run dev:db:stop  # Stop local Postgres
npm run build        # Full production build
npm run typecheck    # TypeScript type checking
npm test             # Run tests (use these!)
npm run lint         # ESLint
```

## Deployment

### Railway (Recommended)

The backend is designed for Railway deployment:

1. Create a new project on Railway
2. Add a PostgreSQL database
3. Connect this GitHub repo
4. Set `ADMIN_KEY` environment variable for admin access
5. Deploy — Railway will automatically:
   - Install dependencies
   - Bundle the extension for download
   - Run database migrations
   - Start the server

**Note**: Ensure "Root Directory" is blank (deploys from repo root).