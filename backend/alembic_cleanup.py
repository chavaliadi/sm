from sqlmodel import Session, text
from app.db.session import engine

with Session(engine) as session:
    session.exec(text("DELETE FROM alembic_version WHERE version_num = 'c4d2e5f3a1b8'"))
    session.commit()
    
print("Cleaned up alembic_version")
