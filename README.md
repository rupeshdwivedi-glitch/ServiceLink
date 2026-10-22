# ServiceLink

ServiceLink helps customers find and book local service providers such as plumbers, cleaners, electricians, tutors, and photographers.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Python + FastAPI
- **Database:** SQL Server
- **Authentication:** JWT

## Status

Phase 1 (project setup) is scaffolded: empty backend and frontend skeletons with no business logic yet. See `CLAUDE.md` for the full development plan, folder structure, database models, and API endpoints.

## Getting Started

### Backend

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # then fill in real values
uvicorn app.main:app --reload
```

### Frontend

```
cd frontend
npm install
npm run dev
```
