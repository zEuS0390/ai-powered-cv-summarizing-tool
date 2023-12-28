from sqlalchemy import create_engine, event
from models import mapper_registry

# DB_URL="sqlite:///cv_scan_db.sqlite"
DB_URL="postgresql://user:pass123@db/cv_scan_db"
engine = create_engine(DB_URL)

# Define the event listener function
# def set_sqlite_pragma(dbapi_connection, connection_record):
#   cursor = dbapi_connection.cursor()
#   cursor.execute("PRAGMA foreign_keys=ON")
#   cursor.close()

engine = create_engine(url=DB_URL)
# event.listen(engine, "connect", set_sqlite_pragma)

mapper_registry.metadata.create_all(engine)