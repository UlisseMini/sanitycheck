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

## Features

- **AI Analysis**: Uses Claude via Anthropic API to analyze article logic
- **Inline Highlighting**: Highlights problematic passages using CSS Custom Highlight API
- **Severity Ranking**: Issues ranked as critical/significant/minor
- **Crowdsourced Annotations**: Users can submit their own annotations
- **Admin Dashboard**: View and manage all annotations

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

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Railway) |
| `ADMIN_KEY` | Password for admin dashboard |
| `PORT` | Server port (default: 3001, Railway sets automatically) |

## API Endpoints

### Public

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Homepage with extension download |
| `/health` | GET | Health check |
| `/static/logic-checker-extension.zip` | GET | Download extension |
| `/annotations` | GET | List annotations (paginated) |
| `/annotations` | POST | Submit new annotation |
| `/annotations/by-url?url=...` | GET | Get annotations for URL |
| `/stats` | GET | Annotation statistics |

### Admin (requires `Authorization: Bearer <ADMIN_KEY>`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin` | GET | Admin dashboard |
| `/admin/verify` | GET | Verify admin key |
| `/admin/annotations/:id` | DELETE | Delete annotation |
| `/export` | GET | Export annotations as JSONL |

## Extension Features

- **Article Detection**: Heuristics to detect article pages
- **CSS Custom Highlight API**: Modern highlighting without DOM modification (Chrome 105+, Safari 17.4+)
- **Fallback Span Wrapping**: For browsers without Highlight API support
- **Result Caching**: Analysis results persist across popup opens
- **User Annotations**: Right-click → "Annotate as logical issue"

## Development

```bash
npm run dev          # Build + start server + watch for changes
npm run dev:db       # Start local Postgres (Docker)
npm run dev:db:stop  # Stop local Postgres
npm run build        # Full production build
npm run typecheck    # TypeScript type checking
npm test             # Run tests
npm run lint         # ESLint
```

## Tech Stack

- **Extension**: TypeScript, CSS Custom Highlight API
- **Backend**: Express.js, TypeScript, Prisma
- **Database**: PostgreSQL
- **AI**: Claude (Anthropic API)
- **Hosting**: Railway
