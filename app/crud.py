from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, auth

# --- User CRUD ---
def get_user_by_phone(db: Session, phone_number: str):
    return db.query(models.User).filter(models.User.phone_number == phone_number).first()

# In app/crud.py
def create_user(db: Session, user: schemas.UserCreate):
    # The password hashing is now done outside of this function.
    # We expect user.password to already be hashed.
    db_user = models.User(
        phone_number=user.phone_number,
        hashed_password=user.password, # We now receive the hashed password directly
        name=user.name,
        role=user.role,
        location_area=user.location_area
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Skill CRUD ---
def get_skill_by_name(db: Session, name: str):
    return db.query(models.Skill).filter(models.Skill.name == name).first()
    
def get_skills(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Skill).offset(skip).limit(limit).all()

def create_skill(db: Session, skill: schemas.SkillCreate):
    db_skill = models.Skill(name=skill.name, category=skill.category)
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill

# ... (keep all your existing CRUD functions)

def update_user_skills(db: Session, user: models.User, skill_ids: List[int]):
    # First, clear the user's existing skills
    user.skills.clear()
    
    # Then, fetch the new skill objects from the database
    skills_to_add = db.query(models.Skill).filter(models.Skill.id.in_(skill_ids)).all()
    
    # Add the new skills
    for skill in skills_to_add:
        user.skills.append(skill)
        
    db.commit()
    db.refresh(user)
    return user


# ... (keep all your existing CRUD functions)

def create_job(db: Session, job: schemas.JobCreate, employer_id: int):
    # Create the basic job object
    db_job = models.Job(
        title=job.title,
        description=job.description,
        location_area=job.location_area,
        owner_id=employer_id
    )
    
    # Get the skill objects from the database using the list of IDs
    required_skills = db.query(models.Skill).filter(models.Skill.id.in_(job.required_skill_ids)).all()
    
    # Associate the skills with the job
    db_job.required_skills.extend(required_skills)
    
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

# ... (keep all your existing CRUD functions)

def get_jobs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Job).offset(skip).limit(limit).all()