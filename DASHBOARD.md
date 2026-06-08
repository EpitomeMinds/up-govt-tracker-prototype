# Epitome Minds · UP Government Jobs Dashboard

REST API that scrapes [freejobalert.com](https://www.freejobalert.com), stores jobs in SQLite, and serves a Next.js dashboard.

## Quick start

### 1. API (port 3000)

```bash
npm install
npm start
```

On startup the API syncs **UP** jobs into SQLite and runs a cron every 4 hours.

Manual sync:

```bash
npm run sync              # UP only
npm run sync -- --state=MH
npm run sync:all          # all states
```

### 2. Dashboard (port 3001)

```bash
cd dashboard
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

### Dashboard features

- **Overview stats** — listings, total vacancies, closing soon, top category
- **Interactive UP map** — Leaflet + OpenStreetMap (CARTO Voyager tiles) with official district GeoJSON boundaries ([udit-001/india-maps-data](https://github.com/udit-001/india-maps-data))
- Click **districts** (choropleth by vacancy count) or **city markers** to drill down
  - Education level (8th → Professional)
  - Skilled / semi-skilled / unskilled labour
  - Job category (Medical, Teaching, Technical, Police, Apprentice…)
  - Recruitment board
  - Qualification tags (ITI, 10TH, MBBS, B.Tech…)
  - Application mode (Online / Walk-in)
- **Advanced filters** — search, board, min posts, closing-this-week toggle
- **Drill-down table** — category, labour type, education tier, qual tags, post count

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/jobs?state=UP&q=teacher&board=UPSSSC&page=1` | Paginated jobs |
| GET | `/api/stats?state=UP` | Dashboard stats |
| GET | `/api/states` | All state codes |
| POST | `/api/sync?state=UP` | Trigger scrape + DB update |
| GET | `/freejobalert/gov/state/UP` | Legacy live scrape (no DB) |

## Environment

```env
PORT=3000
DEFAULT_STATE=UP
CORS_ORIGIN=http://localhost:3001
SYNC_CRON=0 */4 * * *
DB_PATH=./data/jobs.db
SKIP_STARTUP_SYNC=false
DISABLE_CRON=false
```

Dashboard (`dashboard/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Architecture

```
FreeJobAlert → scraper.js → SQLite → /api/* → Next.js dashboard
                    ↑
              node-cron (every 4h)
```

## Notes

- Data is aggregated from FreeJobAlert, not official UPPSC/UPSSSC sites.
- SQLite is for local/self-hosted use; serverless deploys need a hosted DB.
- Legacy `/freejobalert/*` routes still work for backward compatibility.
