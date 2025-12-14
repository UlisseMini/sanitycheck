# Logic Checker Backend

Backend API for crowdsourcing logical fallacy annotations.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your database URL in `.env`:
   ```
   DATABASE_URL="postgresql://..."
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Deploy to Railway

1. Create a new project on Railway
2. Add a PostgreSQL database
3. Connect this repo/folder
4. Railway will automatically:
   - Set `DATABASE_URL`
   - Run `npm install` (which runs `prisma generate`)
   - Run `npm run build`
   - Run `npm start`

5. Run migrations manually once:
   ```bash
   railway run npx prisma migrate deploy
   ```

## API Endpoints

### POST /annotations
Submit a new annotation.

```json
{
  "url": "https://example.com/article",
  "title": "Article Title",
  "quote": "The selected text",
  "annotation": "This is a non-sequitur because...",
  "fallacyType": "non-sequitur"
}
```

### GET /annotations
Get all annotations (paginated).

Query params: `limit`, `offset`, `fallacyType`

### GET /annotations/by-url?url=...
Get annotations for a specific URL.

### GET /stats
Get annotation statistics.

### GET /export
Export all annotations as JSONL (for prompt engineering).

### GET /health
Health check.

