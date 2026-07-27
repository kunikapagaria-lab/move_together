# MoveTribe

A 75-day habit challenge tracker with crews, streaks, and friend accountability.
React + Vite frontend, Express + MongoDB backend.

## Project layout

- `src/` — React frontend (Vite, Redux Toolkit, Tailwind)
- `backend/` — Express + Mongoose API, run standalone for local development
- `api/index.ts` — the same API mounted as a Vercel serverless function for production

## Prerequisites

- Node.js 18+
- A MongoDB connection string (e.g. a free MongoDB Atlas cluster)

## Local setup

1. Install frontend dependencies (project root):
   ```
   npm install
   ```
2. Install backend dependencies:
   ```
   cd backend && npm install
   ```
3. Create `backend/.env` (gitignored — never commit this file):
   ```
   PORT=5000
   MONGODB_URI="your-mongodb-connection-string"
   JWT_SECRET="a long random string, e.g. `openssl rand -hex 32`"
   CLIENT_URL="http://localhost:5173"
   ```
4. Run the backend:
   ```
   cd backend && npm run dev
   ```
5. In a separate terminal, run the frontend:
   ```
   npm run dev
   ```
   The frontend proxies `/api` calls to `VITE_API_URL` if set, otherwise defaults to same-origin `/api`. For local dev against the standalone backend, set `VITE_API_URL=http://localhost:5000/api` in a root `.env.local`.

## Deployment (Vercel)

The frontend is built by Vite; `/api/*` requests are routed to the serverless function at `api/index.ts` (see `vercel.json`). Set these environment variables in the Vercel project settings:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL` (your production domain, optional — `*.vercel.app` and `localhost` are always allowed)

**Never commit real credentials to source.** Both `MONGODB_URI` and `JWT_SECRET` must come from the environment — the server refuses to start (or connect) without them.

## Known limitations

- Wearable sync (`/api/integrations/sync`) is a manual/simulated entry — there's no real OAuth connection to Strava, Apple Health, Google Fit, etc. yet.
- Progress photos are stored only in the browser's `localStorage` on the device that took them; they are not uploaded or synced anywhere.
- The scheduled "did you miss a day" challenge-failure check (`backend/src/cron/midnightReset.ts`) only runs inside the long-lived `backend/src/server.ts` process. It does **not** run in the Vercel serverless deployment (`api/index.ts`), since serverless functions don't stay alive to run a cron schedule. To make this work in production, wire it up to [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) (or another external scheduler) calling a dedicated, protected endpoint.
- There is no automated test suite yet.
