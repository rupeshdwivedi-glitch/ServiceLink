# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ServiceLink is a full-stack web app that helps customers find and book local service providers (plumbers, cleaners, electricians, tutors, photographers). The user building it is a beginner, so prefer clear, simple explanations and small incremental changes over large one-shot implementations.

Current state: backend Phases 1-4 (project setup, auth/JWT, services CRUD, bookings) are implemented and tested end-to-end against a real SQL Server database. Frontend is still Phase 1 scaffolding only — `frontend/src/api/*.ts`, `pages/*.tsx`, `context/AuthContext.tsx` are placeholder comments. See the phased plan below before adding features out of order.

Known gap before frontend work can call the API: no CORS middleware is configured on the backend yet, and no proxy is set up in `vite.config.ts`. One of these is needed first.

`main.py` still has a temporary `GET /db-check` route used to verify the DB connection during setup; remove it once it's no longer needed.

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

## Architecture

### Backend (`backend/app/`)

- `main.py` — FastAPI app instance; routers get included here.
- `core/config.py` — Pydantic `Settings`, loaded from `.env` (database URL, JWT secret/algorithm/expiry).
- `core/security.py` — password hashing (via `bcrypt` directly, not `passlib` — `passlib`'s bcrypt handler is incompatible with modern `bcrypt` releases) and JWT create/verify (`create_access_token`, `decode_access_token`, via `python-jose`).
- `db/database.py` — SQLAlchemy engine/connection to SQL Server, and the `Base` declarative class.
- `db/session.py` — per-request DB session dependency (`get_db`).
- `models/` — SQLAlchemy ORM classes, one file per table (`user.py`, `service.py`, `booking.py`). Each must be imported in `main.py` so `Base.metadata.create_all()` picks it up.
- `schemas/` — Pydantic request/response models, mirrored per resource. Kept separate from `models/` so DB-only fields (e.g. `password_hash`) never leak into API responses.
- `routers/` — one file per resource (`auth.py`, `services.py`, `bookings.py`), included into `main.py`. `users.py` exists but is still an empty placeholder — not needed yet since `auth.py` covers register/login/me.
- `dependencies.py` — shared FastAPI dependencies, notably `get_current_user()` (decodes the bearer token, loads the `User`) used by every protected route. `services.py` and `bookings.py` each layer a local `require_provider`/`require_customer` role-check dependency on top of it, plus an ownership check (`get_own_service` in services; an inline provider-id check in bookings) so writes are scoped to the acting user's own records.

### Frontend (`frontend/src/`)

- `api/` — thin wrappers around backend calls (axios), one file per resource, mirroring the backend routers.
- `context/AuthContext.tsx` — holds the logged-in user and JWT token app-wide.
- `pages/` — route-level screens (`Login`, `Register`, `BrowseServices`, `Dashboard`).
- `components/` — reusable UI pieces shared across pages.
- `types/` — shared TypeScript interfaces (`User`, `Service`, `Booking`), should mirror backend schemas.

### Data model

Three tables: `users` (role is `"customer"` or `"provider"`), `services` (belongs to a provider via `provider_id`), `bookings` (links a `customer_id` to a `service_id`, has a `status` of `pending/confirmed/completed/cancelled`). One provider → many services; one service → many bookings; one customer → many bookings.

### API surface (MVP)

- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Services: `GET /services`, `GET /services/{id}`, `POST /services`, `PUT /services/{id}`, `DELETE /services/{id}` (write ops are provider-only)
- Bookings: `POST /bookings` (customer-only), `GET /bookings/me` (customer's own), `GET /bookings/provider` (bookings against the provider's services), `PUT /bookings/{id}/status` (provider updates status)

### Build order

Features land in this order: (1) project setup, (2) auth/JWT, (3) services CRUD, (4) bookings, (5) frontend, (6) polish/styling. Phases 1-4 are done on the backend; phase 5 (frontend) is next. Avoid jumping ahead (e.g. don't build bookings before auth works) since later phases depend on earlier ones.

### Explicitly out of scope for MVP

Payments, reviews/ratings, real-time chat/notifications, provider verification, geolocation/search ranking.
