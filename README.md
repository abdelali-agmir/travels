# WANDERLY 🌍

A global travel SaaS platform: destination intelligence, trip planning, budgets, visas, maps,
community and creator content — built on Next.js (App Router), PostgreSQL and Drizzle ORM.

> Wanderly ships with a realistic **sample dataset** (12 countries, 19 cities/islands, 120+ verified
> places, 18 visa corridors). It does **not** pretend to cover the whole world yet — the schema,
> services and provider adapters are designed to scale to full global coverage.

---

## Features

| Module | Status |
| --- | --- |
| Authentication (register / login / sessions / profiles) | ✅ Working |
| Explore (continents, country cards, filters) | ✅ Working |
| Destination guides (`/travel/[country]/[city]`) | ✅ Working |
| Place pages with reviews, sources, save & add-to-trip | ✅ Working |
| Trip planner → itinerary + budget + checklist generation | ✅ Working |
| Smart route optimization (nearest-neighbour, transport legs) | ✅ Working |
| Interactive world map (Leaflet + OpenStreetMap) | ✅ Working |
| Global search (⌘K) with autocomplete & recents | ✅ Working |
| Visa checker with sources & verification statuses | ✅ Working (sample matrix) |
| Weather | ✅ **Live** (Open-Meteo, keyless) |
| Currency converter | ✅ **Live** (ECB via Frankfurter, keyless) |
| Community (posts, likes, comments) | ✅ Working |
| Creator hub (journeys, spending, mistakes, socials) | ✅ Working |
| AI assistant (database-grounded, cites sources) | ✅ Working |
| Admin dashboard (metrics, data health, source registry) | ✅ Working |
| Flights / hotels / places / visa providers | 🔌 Adapter-ready — add API keys |

## Running on Windows (PowerShell)

Prerequisites: **Node.js 20+** and **PostgreSQL 15+** running locally.

```powershell
# 1. Install dependencies
npm install

# 2. Configure environment
Copy-Item .env.example .env
# then edit .env and set DATABASE_URL to your local PostgreSQL

# 3. Create the schema
npm run db:push

# 4. Seed sample data (idempotent — skips if already seeded)
npm run db:seed

# 5. Start developing
npm run dev
# → http://localhost:3000
```

Production build:

```powershell
npm run build
npm run start
```

All commands are PowerShell-compatible; no Linux-specific tooling is required.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Traveler | `demo@wanderly.app` | `demo1234` |
| Admin | `admin@wanderly.app` | `admin1234` |
| Creator | `abdelali@wanderly.app` | `creator1234` |

## Architecture

```
src/
  app/                  # Next.js App Router pages + API routes
    api/                # auth, search, trips, visa, currency, weather, ai, admin…
    travel/[country]/[city]   # SEO destination pages
    places/[slug]       # place detail pages
  components/           # reusable UI (navbar, map, planner, workspace, toasts…)
  db/
    schema.ts           # 25+ tables: geography, knowledge, trips, social, sources
    index.ts            # Drizzle client
  lib/
    auth.ts             # scrypt hashing + DB-backed cookie sessions
    providers/          # adapter layer: weather, currency, flights, hotels, visa, LLM
    services/itinerary.ts  # generation, geo-routing, budget & checklist engines
scripts/
  seed.ts               # realistic multi-country sample dataset
```

### Design principles

1. **Never fake data.** Unconnected providers render a "not connected" panel; live data is
   labeled live; sample data is labeled sample.
2. **Every fact has a source.** Visa rules, safety notes and key facts store `source_url`,
   `verification_status`, `confidence` and `last_checked_at`. Admins manage the registry at `/admin`.
3. **Adapters, not vendor lock-in.** Swap flight/hotel/visa providers by changing env vars —
   application code talks only to the adapter interface in `src/lib/providers`.
4. **Service layer.** Itinerary/budget/checklist logic lives in `src/lib/services`, not in UI
   components or route handlers.

## Connecting real providers

Add keys to `.env` (see `.env.example`). Each adapter in `src/lib/providers/index.ts` documents
which variable enables it:

- `FLIGHTS_API_KEY` — live fares (Amadeus, Duffel, Kiwi…)
- `HOTELS_API_KEY` — live availability/pricing
- `PLACES_API_KEY` — global POI sync (Google Places, Foursquare)
- `VISA_API_KEY` — automated visa-rule sync (Sherpa°)
- `OPENAI_API_KEY` — free-form LLM reasoning for the assistant (grounded mode works without it)

Secrets are read server-side only and never shipped to the browser.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run db:push` | Apply schema to the database |
| `npm run db:seed` | Seed sample data |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
