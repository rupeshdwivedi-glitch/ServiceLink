# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ServiceLink is a full-stack web app that helps customers find and book local service providers (plumbers, cleaners, electricians, tutors, photographers). The user building it is a beginner, so prefer clear, simple explanations and small incremental changes over large one-shot implementations.

Current state: the full MVP (Phases 1-5) plus an admin role/dashboard are done and verified end-to-end through a real browser (Playwright, since no `chromium-cli` is available in this environment — see "Browser verification" below). Only Phase 6 (polish/styling) remains from the original plan. See the phased plan below before adding features out of order.

The admin role was added after the original MVP plan, at the user's request, specifically scoped to *before* hosting (the user plans to host the project and wants admin oversight in place first, and described this as an industry-level project worth treating with production-level care, not just a learning exercise).

CORS is configured in `main.py` for `localhost` **and** `127.0.0.1` on ports 5173/5174 (Vite picks 5174 if 5173 is already taken on this machine). Previously it only allowed `localhost`, which caused a real bug caught during verification: opening the app via `http://127.0.0.1:...` instead of `http://localhost:...` made every API call fail with a silent CORS rejection and a generic "Something went wrong" in the UI, no indication it was a CORS issue. If the dev port ever changes again, add both the `localhost` and `127.0.0.1` variants here, not just one. The frontend API base URL is hardcoded as `http://localhost:8000` in `frontend/src/api/client.ts` (no `.env` — see the permissions note below for why).

**A local test admin account already exists in the dev database:** `admin@example.com` / `adminpass1`, created via `backend/create_admin.py` for verification. Treat it as a known dev-only credential, not something to carry into any hosted/production database.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Python + FastAPI
- Database: SQL Server (via SQLAlchemy + pyodbc)
- Auth: JWT (stateless — no server-side session store)

## Commands

### Backend (run from `backend/`)

```
python -m venv .venv
.venv\Scripts\activate      # Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env      # Linux/macOS: cp .env.example .env. Fill in DATABASE_URL and JWT_SECRET_KEY
uvicorn app.main:app --reload


```

Always start uvicorn from `backend/`: `core/config.py` loads `.env` via a relative path, and `database_url` / `jwt_secret_key` default to empty strings, so running from elsewhere fails silently instead of erroring.

`.env` already exists locally with a working SQL Server Authentication connection (`sa`@`localhost`, database `ServiceLink`, ODBC Driver 18, `TrustServerCertificate=yes`). It's git-ignored and denied from Claude's Read tool (see settings below) — don't try to read or print its contents.

Tables are created automatically on app startup via `Base.metadata.create_all()` in `main.py` (every new model needs importing there so it registers with `Base`) — there's no migration tool (e.g. Alembic) yet.

No test suite or linter is configured yet.

**Managing dev server processes on this machine:** the PowerShell tool and the Bash tool see different process tables on this machine (likely a sandboxing/virtualization quirk) — a uvicorn process started via Bash often isn't visible to, or killable by, PowerShell's `Get-Process`/`Stop-Process`/`taskkill`, even though both see the same `netstat`-reported listening port. Use `tasklist //FI "IMAGENAME eq python.exe"` and `taskkill //F //PID <pid>` (or `//IM python.exe`) from the **Bash** tool to reliably find/stop backend dev servers, not PowerShell.

The venv's packages have intermittently installed with empty/corrupted package directories (e.g. `click`, `fastapi`, `pyodbc` ending up as empty folders) — suspected antivirus or file-sync interference during `pip install`. If imports fail with missing attributes/names right after an install, check for an empty package directory under `.venv/Lib/site-packages/<pkg>/` and reinstall with `pip install --ignore-installed --no-deps <pkg>`, or rebuild the whole venv (`python -m venv .venv --clear`) after stopping any process locking files inside it.

### Frontend (run from `frontend/`)

```
npm install
npm run dev            # start dev server
npm run build           # tsc -b && vite build
```

No test suite configured yet. Type-check only via `npm run build` or `npx tsc -b`.

### Slash commands and permissions

Project commands live in `.claude/commands/`: `/next-phase` (propose and implement the next small step of the build order, confirming with the user first), `/run-backend`, `/run-frontend`.

The `Read(//c/ServiceLink/**)` rules in `.claude/settings.json`, including the `.env` deny rules, are Windows paths and do not match a Linux checkout such as `/workspaces/ServiceLink`.

The `.env` deny rule also blocks *writing* a new `frontend/.env` (the Write tool respects the same deny pattern), even though the frontend has no secrets to protect. That's why the frontend's API base URL is hardcoded in `api/client.ts` instead of read from an env var — simplest path around a rule that's really meant for the backend's DB credentials.

## Architecture

### Backend (`backend/app/`)

- `main.py` — FastAPI app instance; routers get included here.
- `core/config.py` — Pydantic `Settings`, loaded from `.env` (database URL, JWT secret/algorithm/expiry).
- `core/security.py` — password hashing (via `bcrypt` directly, not `passlib` — `passlib`'s bcrypt handler is incompatible with modern `bcrypt` releases) and JWT create/verify (`create_access_token`, `decode_access_token`, via `python-jose`).
- `db/database.py` — SQLAlchemy engine/connection to SQL Server, and the `Base` declarative class.
- `db/session.py` — per-request DB session dependency (`get_db`).
- `models/` — SQLAlchemy ORM classes, one file per table (`user.py`, `service.py`, `booking.py`). Each must be imported in `main.py` so `Base.metadata.create_all()` picks it up.
- `schemas/` — Pydantic request/response models, mirrored per resource. Kept separate from `models/` so DB-only fields (e.g. `password_hash`) never leak into API responses.
- `routers/` — one file per resource (`auth.py`, `services.py`, `bookings.py`, `admin.py`), included into `main.py`. `users.py` exists but is still an empty placeholder — not needed yet since `auth.py` covers register/login/me.
- `dependencies.py` — shared FastAPI dependencies, notably `get_current_user()` (decodes the bearer token, loads the `User`) used by every protected route. `services.py`, `bookings.py`, and `admin.py` each layer a local role-check dependency on top of it (`require_provider`/`require_customer`/`require_admin`), plus an ownership check where relevant (`get_own_service` in services; an inline provider-id check in bookings) so writes are scoped to the acting user's own records.
- `routers/admin.py` — admin-only oversight: list/delete any user, list/delete any service, list all bookings. Deletes catch `IntegrityError` and return a clear 400 instead of a raw DB crash when the target still has linked rows (e.g. deleting a provider who owns a service with bookings). Also blocks an admin from deleting their own account.
- `create_admin.py` (at `backend/`, not under `app/`) — standalone CLI script to create/promote an admin user directly against the database. Deliberately **not** an API endpoint — admin accounts should never be creatable over HTTP. `UserCreate`'s `role` field stays restricted to `Literal["customer", "provider"]` specifically so the public `/auth/register` endpoint can't be used to self-promote; this was verified (422 on `role: "admin"`).

### Frontend (`frontend/src/`)

- `api/client.ts` — shared axios instance (hardcoded `baseURL`); a request interceptor attaches the JWT from `localStorage` to every outgoing call, so individual wrapper functions never handle auth headers themselves.
- `api/` — thin wrappers around backend calls, one file per resource, mirroring the backend routers (`auth.ts`, `services.ts`, `bookings.ts`).
- `context/AuthContext.tsx` — `AuthProvider`/`useAuth()`. Holds the logged-in `User` and persists the token in `localStorage`; on mount it calls `GET /auth/me` to restore the session if a token is already saved.
- `pages/Login.tsx` / `Register.tsx` — forms that call the API then populate `AuthContext` and navigate to `/dashboard`.
- `pages/BrowseServices.tsx` — lists/filters services; each listing is its own `ServiceCard` component holding a datetime picker and local booking state, so customers can book directly from this page.
- `pages/Dashboard.tsx` — branches on `user.role`: customers see their own bookings (`GET /bookings/me`), providers see bookings against their services (`GET /bookings/provider`) with buttons to advance status or cancel. Also fetches all services to resolve `service_id` → title for display, since bookings don't carry the title themselves.
- `pages/Admin.tsx` — only reachable when `user.role === "admin"` (redirects to `/dashboard` otherwise, or `/login` if logged out); lists all users/services/bookings with delete actions on users/services. Nav bar only shows the "Admin" link for admins.
- `components/` — not used yet; reusable UI pieces would go here if duplication appears across pages.
- `types/` — shared TypeScript interfaces (`User`, `Service`, `Booking`), mirroring the backend's Pydantic schemas. `UserRole` (`Role | "admin"`) is kept separate from `Role` (`"customer" | "provider"`) since only the latter is a valid value for the registration form's dropdown.

### Data model

Three tables: `users` (`role` column is a plain string — `"customer"`, `"provider"`, or `"admin"`; no DB-level enum/check constraint, so the constraint lives in application code: `UserCreate.role` for the public API, `create_admin.py` for admins), `services` (belongs to a provider via `provider_id`), `bookings` (links a `customer_id` to a `service_id`, has a `status` of `pending/confirmed/completed/cancelled`). One provider → many services; one service → many bookings; one customer → many bookings.

### API surface (MVP)

- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Services: `GET /services`, `GET /services/{id}`, `POST /services`, `PUT /services/{id}`, `DELETE /services/{id}` (write ops are provider-only)
- Bookings: `POST /bookings` (customer-only), `GET /bookings/me` (customer's own), `GET /bookings/provider` (bookings against the provider's services), `PUT /bookings/{id}/status` (provider updates status)
- Admin (all admin-only): `GET /admin/users`, `DELETE /admin/users/{id}`, `GET /admin/services`, `DELETE /admin/services/{id}`, `GET /admin/bookings`

### Browser verification

No `chromium-cli` is available in this environment. To actually verify frontend changes in a real browser (not just `tsc -b`), install Playwright's Chromium locally once per machine (`npx playwright install chromium`), `npm install --no-save playwright` in `frontend/`, then write a throwaway `.mjs` driver script *inside* `frontend/` (so it resolves `node_modules`) using `chromium.launch()` / `page.goto()` / `page.click()` / `page.screenshot()`. Run both the backend (`uvicorn`) and frontend (`npm run dev`) first. Delete the driver script when done — it's scratch, not part of the app. This is how the CORS `127.0.0.1` bug (see above) was actually caught; `tsc -b` alone would never have found it.

### Build order

Features land in this order: (1) project setup, (2) auth/JWT, (3) services CRUD, (4) bookings, (5) frontend, (6) polish/styling. Phases 1-5 are done and manually verified in a browser; only phase 6 (polish/styling) remains. Avoid jumping ahead since later phases depend on earlier ones.

### Explicitly out of scope for MVP

Payments, reviews/ratings, real-time chat/notifications, provider verification, geolocation/search ranking.
