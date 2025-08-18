from typing import List
from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.orm import Session
from . import crud, models, schemas, auth,database # Import everything
from .database import SessionLocal, engine
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import List, Optional # Make sure Optional is imported at the top
from pydantic import BaseModel
from . import chatbot

models.Base.metadata.create_all(bind=engine)

app = FastAPI()



@app.get("/")
def read_root():
    return {"Project": "SkillSetu API - Phase 1"}

# --- Endpoint to Create a Skill ---
@app.post("/skills/", response_model=schemas.Skill, status_code=201)
def create_skill_endpoint(skill: schemas.SkillCreate, db: Session = Depends(database.get_db)):
    db_skill = crud.get_skill_by_name(db, name=skill.name.strip())
    if db_skill:
        raise HTTPException(status_code=400, detail="Skill already registered")
    return crud.create_skill(db=db, skill=skill)

# --- Endpoint to Get all Skills ---
@app.get("/skills/", response_model=List[schemas.Skill])
def read_skills(skip: int = 0,limit: int = 100,db: Session = Depends(database.get_db)):
    limit = min(limit, 100)  # Safety cap
    skills = crud.get_skills(db, skip=skip, limit=limit)
    return skills


# --- Endpoint for User Signup ---# In app/main.py
@app.post("/signup/", response_model=schemas.User)
def create_user_endpoint(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_phone(db, phone_number=user.phone_number)
    if db_user:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Hash the password here, before sending it to the CRUD function
    hashed_password = auth.get_password_hash(user.password)
    user.password = hashed_password
    
    return crud.create_user(db=db, user=user)


# --- Endpoint for User Login / Token Generation ---
@app.post("/token", response_model=schemas.Token)
def login_for_access_token(db: Session = Depends(database.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # In OAuth2, the 'username' field of the form is used. We'll use it for our phone_number.
    user = crud.get_user_by_phone(db, phone_number=form_data.username)

    # Verify user exists and password is correct
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Create the token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.phone_number}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# ... (keep all your existing code and imports) ...

# --- Our First Protected Endpoint ---
@app.get("/users/me/", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    """
    Fetches the profile of the currently logged-in user.
    """
    return current_user

@app.put("/users/me/skills", response_model=schemas.User)
def update_my_skills(
    skills_update: schemas.UserSkillsUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Update the skills for the currently logged-in user.
    Only users with the 'seeker' role can update their skills.
    """
    if current_user.role != 'seeker':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only job seekers can update their skills"
        )
    
    user = crud.update_user_skills(db, user=current_user, skill_ids=skills_update.skill_ids)
    return user

# ... (keep all your existing endpoints)

@app.post("/jobs/", response_model=schemas.Job)
def create_job_endpoint(
    job: schemas.JobCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Create a new job posting.
    Only users with the 'employer' role can create jobs.
    """
    print(f"Attempting to post job. User: '{current_user.name}', Role: '{current_user.role}'")
    if current_user.role != 'employer':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can post jobs"
        )
    
    return crud.create_job(db=db, job=job, employer_id=current_user.id)


# ... (keep all your existing endpoints)

@app.get("/jobs/", response_model=List[schemas.Job])
def read_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """
    Retrieve a list of all job postings.
    """
    jobs = crud.get_jobs(db, skip=skip, limit=limit)
    return jobs


# ... (keep all your existing code)

# Define the request body for our chat endpoint
class ChatRequest(BaseModel):
    message: str

@app.post("/chat/")
def chat_with_agent(request: ChatRequest):
    """
    Receives a message from the user and gets a response from the LangChain agent.
    """
    try:
        response = chatbot.agent_executor.invoke({"input": request.message})
        return {"response": response['output']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))