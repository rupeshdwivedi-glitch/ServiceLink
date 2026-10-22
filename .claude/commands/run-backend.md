---
description: Start the FastAPI backend dev server
---

From `backend/`, activate the virtualenv if present and run:

```
uvicorn app.main:app --reload
```

If `.venv` doesn't exist yet, create it first (`python -m venv .venv`, activate, `pip install -r requirements.txt`), and make sure `.env` exists (copy from `.env.example` and fill in `DATABASE_URL` / `JWT_SECRET_KEY`) before starting the server.
