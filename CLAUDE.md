# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ServiceLink is a full-stack web app that helps customers find and book local service providers (plumbers, cleaners, electricians, tutors, photographers). The user building it is a beginner, so prefer clear, simple explanations and small incremental changes over large one-shot implementations.

Current state: Phase 1 scaffolding only (empty backend/frontend skeletons, no business logic). See the phased plan below before adding features out of order.

Scaffold details worth knowing: `main.py` only defines `GET /` and does not include any routers yet. `frontend/src/api/*.ts` are placeholder comments. No CORS middleware on the backend and no API proxy in `vite.config.ts`, so one of these is needed before the frontend can call the API.

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

No test suite or linter is configured yet.

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
- `core/security.py` — password hashing and JWT create/verify logic.
- `db/database.py` — SQLAlchemy engine/connection to SQL Server.
- `db/session.py` — per-request DB session dependency (`get_db`).
- `models/` — SQLAlchemy ORM classes, one file per table (`user.py`, `service.py`, `booking.py`).
- `schemas/` — Pydantic request/response models, mirrored per resource. Kept separate from `models/` so DB-only fields (e.g. `password_hash`) never leak into API responses.
- `routers/` — one file per resource (`auth.py`, `users.py`, `services.py`, `bookings.py`), included into `main.py`.
- `dependencies.py` — shared FastAPI dependencies, notably `get_current_user()` for JWT-protected routes.

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

Features should land in this order: (1) project setup, (2) auth/JWT, (3) services CRUD, (4) bookings, (5) polish/styling. Avoid jumping ahead (e.g. don't build bookings before auth works) since later phases depend on earlier ones.

### Explicitly out of scope for MVP

Payments, reviews/ratings, real-time chat/notifications, provider verification, geolocation/search ranking.
