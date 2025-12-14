# Logic Checker

An AI-powered browser extension that spots logical fallacies and reasoning gaps in articles.

## Project Structure

```
sanitycheck/
├── extension/           # Chrome extension files
│   ├── manifest.json
│   ├── popup.html/js
│   ├── content.js
│   └── ...
├── src/                 # Backend API (Express + TypeScript)
│   └── index.ts
├── prisma/              # Database schema
├── scripts/             # Build scripts
└── debug-server/        # Local debugging server
```

## Features

- **AI Analysis**: Uses Claude 4.5 Sonnet via Replicate to analyze article logic
- **Inline Highlighting**: Highlights problematic passages using CSS Custom Highlight API
- **Severity Ranking**: Issues ranked as critical/significant/minor
- **Crowdsourced Annotations**: Users can submit their own annotations
- **Admin Dashboard**: View and manage all annotations

## Quick Start

### Extension (Local Development)

1. Navigate to `chrome://extensions` in Chrome/Edge
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension/` folder
4. Click the extension icon on any article

### Backend (Local Development)

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
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
# Backend development
npm run dev

# Bundle extension manually
npm run bundle-extension

# Build for production
npm run build
```

## Tech Stack

- **Extension**: Vanilla JS, CSS Custom Highlight API
- **Backend**: Express.js, TypeScript, Prisma
- **Database**: PostgreSQL
- **AI**: Claude 4.5 Sonnet via Replicate API
- **Hosting**: Railway
