from pydantic import BaseModel
from typing import List, Optional

# --- Skill Schemas ---
class SkillBase(BaseModel):
    name: str
    category: str

class SkillCreate(SkillBase):
    pass

class Skill(SkillBase):
    id: int

    class Config:
        from_attributes = True

# --- User Schemas ---
class UserBase(BaseModel):
    phone_number: str
    name: str
    location_area: str

class UserCreate(UserBase):
    password: str
    role: str # 'seeker' or 'employer'

class User(UserBase):
    id: int
    is_active: bool
    role: str  
    skills: List[Skill] = []

    class Config:
        from_attributes = True

# --- Job Schemas ---
class JobBase(BaseModel):
    title: str
    description: Optional[str] = None
    location_area: str

class JobCreate(JobBase):
    required_skill_ids: List[int]

class Job(JobBase):
    id: int
    owner_id: int
    required_skills: List[Skill] = []

    class Config:
        from_attributes = True

# --- Token Schema for Authentication ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    phone_number: Optional[str] = None

# ... (at the end of the file, with the other schemas)

class UserSkillsUpdate(BaseModel):
    skill_ids: List[int]