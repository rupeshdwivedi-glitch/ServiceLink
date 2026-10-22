from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base

from app.core.config import settings

engine = create_engine(settings.database_url)

# All our models (User, Service, Booking) will inherit from this Base
# so SQLAlchemy knows which Python classes map to which database tables.
Base = declarative_base()
