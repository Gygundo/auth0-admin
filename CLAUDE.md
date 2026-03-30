# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Auth0 user management admin tool — an Express 5 server with a vanilla JS frontend (Tailwind CSS via CDN). Lets you search, inspect, unblock, reset passwords, verify emails, and delete Auth0 users through the Management API.

## Commands

```bash
npm run dev    # Start with --watch (auto-restart on changes)
npm start      # Production start
```

Server runs on `http://localhost:3847` by default (configurable via `PORT` in `.env`).

## Architecture

- **`server.js`** — Express 5 entrypoint. Mounts three route groups under `/api/`.
- **`lib/auth0.js`** — Singleton `ManagementClient` from `auth0` SDK v5. All routes import this.
- **`routes/`** — Express routers:
  - `users.js` — search (`GET /api/users/search?q=`), get by ID, get user logs, delete
  - `blocks.js` — get blocks, unblock by ID, unblock by email
  - `tickets.js` — password reset and email verification ticket creation
- **`public/`** — Static SPA served by Express:
  - `index.html` — Tailwind-styled single page with search, detail panel, delete modal
  - `app.js` — All frontend logic (fetch calls, DOM manipulation, toast notifications)
  - `style.css` — Minimal custom styles beyond Tailwind

## Key Details

- Uses **Auth0 SDK v5** (`auth0` npm package) — the Management API methods use the pattern `management.users.list()`, `management.userBlocks.delete()`, etc. (not the v3/v4 `getUsers()` style).
- Auth0 API responses are accessed via `.response` property on SDK results (e.g., `result.response` for user search).
- The unblock button is always shown because brute-force blocks can exist at IP/identifier level even when the user profile doesn't show `blocked: true`.
- No build step — frontend is plain JS/HTML/CSS served as static files.
- Dates are formatted with `en-ZA` locale.

## Environment

Requires `.env` with Auth0 M2M credentials (see `.env.example`):
- `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`
- The M2M app needs Management API permissions for users, user blocks, and tickets.
