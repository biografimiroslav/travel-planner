import httpx
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship, joinedload
from pydantic import BaseModel
from typing import List, Optional

# --- БАЗА ДАНИХ ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./travel.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    start_date = Column(String, nullable=True)
    is_completed = Column(Boolean, default=False)
    places = relationship("Place", back_populates="project", cascade="all, delete-orphan")

class Place(Base):
    __tablename__ = "places"
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, index=True)
    notes = Column(String, nullable=True)
    is_visited = Column(Boolean, default=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    project = relationship("Project", back_populates="places")

Base.metadata.create_all(bind=engine)

class PlaceCreate(BaseModel):
    external_id: str
    notes: Optional[str] = "Хочу відвідати"

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    places: List[PlaceCreate] = []

async def validate_artic_place(external_id: str):
    url = f"https://api.artic.edu/api/v1/artworks/{external_id}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

    async with httpx.AsyncClient(verify=False) as client:
        try:
            resp = await client.get(url, headers=headers, timeout=5.0)
            if resp.status_code == 404:
                print(f"Artwork {external_id} not found, but allowing creation.")
            if resp.status_code != 200:
                print(f"API not responding, skipping validation.")
        except Exception as e:
            print(f"Connection error: {e}. Skipping validation.")
            return

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@app.get("/projects/")
def get_projects(db: Session = Depends(get_db)):
    return db.query(Project).options(joinedload(Project.places)).all()

@app.post("/projects/")
async def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    for p in data.places:
        if p.external_id:
            await validate_artic_place(p.external_id)

    new_project = Project(
        name=data.name,
        description=data.description,
        start_date=data.start_date
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    for p in data.places:
        if p.external_id:
            place = Place(external_id=p.external_id, notes=p.notes, project_id=new_project.id)
            db.add(place)

    db.commit()
    return db.query(Project).options(joinedload(Project.places)).filter(Project.id == new_project.id).first()

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).options(joinedload(Project.places)).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if any(p.is_visited for p in project.places):
        raise HTTPException(status_code=400, detail="Cannot delete project with visited places")
    db.delete(project)
    db.commit()
    return {"status": "ok"}

@app.patch("/places/{place_id}/visit")
def mark_visited(place_id: int, db: Session = Depends(get_db)):
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place: raise HTTPException(status_code=404)
    place.is_visited = True
    db.commit()
    return {"status": "ok"}