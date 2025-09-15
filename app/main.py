from typing import List
from fastapi import Depends, FastAPI, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from . import crud, models, schemas, auth,database # Import everything
from .database import SessionLocal, engine
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import List, Optional # Make sure Optional is imported at the top
from pydantic import BaseModel
from . import chatbot
from . import notifications
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import joinedload

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
# Add CORSMiddleware to your imports

# --- ADD THIS CORS MIDDLEWARE CONFIGURATION ---
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173", # The default port for Vite React apps
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)
# ---------------------------------------------

# ... (the rest of your main.py file with all your endpoints) ...
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

@app.post("/jobs/", response_model=schemas.Job)
def create_job_endpoint(
    job: schemas.JobCreate,
    # Add background_tasks as a parameter. FastAPI will inject it.
    background_tasks: BackgroundTasks, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if current_user.role != 'employer':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can post jobs"
        )
    
    # Create the job as before
    db_job = crud.create_job(db=db, job=job, employer_id=current_user.id)
    
    # Add our new function to the background tasks
    background_tasks.add_task(run_job_matching_and_notifications, db=db, job=db_job)
    
    return db_job

@app.get("/jobs/")
def read_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    # Load related user in a single query if relationship exists (assumes Job.employer or Job.owner)
    try:
        # try `employer` relationship first, else `owner`
        jobs = db.query(models.Job).options(joinedload(models.Job.employer)).offset(skip).limit(limit).all()
        # if joinedload fails (attribute doesn't exist), try owner:
    except Exception:
        jobs = db.query(models.Job).options(joinedload(models.Job.owner)).offset(skip).limit(limit).all()

    results = []
    for job in jobs:
        # prefer job.employer.name or job.owner.name if available
        employer_name = None
        try:
            if getattr(job, "employer", None):
                employer_name = getattr(job.employer, "name", None)
            elif getattr(job, "owner", None):
                employer_name = getattr(job.owner, "name", None)
        except Exception:
            employer_name = None

        job_data = schemas.Job.from_orm(job).dict()
        job_data["employer_name"] = employer_name
        results.append(job_data)

    return results



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
    
def run_job_matching_and_notifications(db: Session, job: models.Job):
    print(f"Starting background task for job '{job.title}' (ID: {job.id})")
    matching_seekers = crud.get_matching_seekers(db=db, job=job)
    
    print(f"Found {len(matching_seekers)} matching seekers.")
    for seeker in matching_seekers:
        notifications.send_job_notification(
            user_name=seeker.name,
            phone_number=seeker.phone_number,
            job_title=job.title
        )
    print(f"Finished background task for job ID: {job.id}")

# ... (at the end of the file)

@app.get("/jobs/my-postings/", response_model=List[schemas.JobWithMatches])
def read_my_postings(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Retrieve all jobs posted by the currently logged-in employer,
    along with a count of matching seekers for each job.
    """
    if current_user.role != 'employer':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can view their job postings."
        )
    
    jobs = crud.get_jobs_by_owner(db, owner_id=current_user.id)
    jobs_with_counts = []
    
    for job in jobs:
        matching_seekers = crud.get_matching_seekers(db, job=job)
        job_data = schemas.Job.from_orm(job) # Convert SQLAlchemy object to Pydantic model
        
        job_with_count_data = schemas.JobWithMatches(
            **job_data.dict(),
            matching_seekers_count=len(matching_seekers)
        )
        jobs_with_counts.append(job_with_count_data)
        
    return jobs_with_counts

# ... (at the end of the file)

@app.get("/jobs/my-postings/", response_model=List[schemas.JobWithMatches])
def read_my_postings(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Retrieve all jobs posted by the currently logged-in employer,
    along with a count of matching seekers for each job.
    """
    if current_user.role != 'employer':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can view their job postings."
        )
    
    jobs = crud.get_jobs_by_owner(db, owner_id=current_user.id)
    jobs_with_counts = []
    
    for job in jobs:
        matching_seekers = crud.get_matching_seekers(db, job=job)
        job_data = schemas.Job.from_orm(job) # Convert SQLAlchemy object to Pydantic model
        
        job_with_count_data = schemas.JobWithMatches(
            **job_data.dict(),
            matching_seekers_count=len(matching_seekers)
        )
        jobs_with_counts.append(job_with_count_data)
        
    return jobs_with_counts