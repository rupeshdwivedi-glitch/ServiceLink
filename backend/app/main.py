from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
from app.models import booking, service, user  # noqa: F401 - import registers the models with Base
from app.routers import admin, auth, bookings, services

app = FastAPI(title="ServiceLink API")

# Creates any tables that don't exist yet, based on the models imported above.
# Fine for development; a real migration tool (e.g. Alembic) would replace this later.
Base.metadata.create_all(bind=engine)

# Without this, the browser blocks the React app (on a different port) from calling this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(services.router)
app.include_router(bookings.router)
app.include_router(admin.router)


@app.get("/")
def read_root():
    return {"message": "ServiceLink API is running"}
