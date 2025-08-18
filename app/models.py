from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship

from .database import Base

# Association Table for Many-to-Many relationship between Users and Skills
user_skills_association_table = Table(
    'user_skills', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('skill_id', Integer, ForeignKey('skills.id'))
)

# Association Table for Many-to-Many relationship between Jobs and Skills
job_skills_association_table = Table(
    'job_skills', Base.metadata,
    Column('job_id', Integer, ForeignKey('jobs.id')),
    Column('skill_id', Integer, ForeignKey('skills.id'))
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(10), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100))
    role = Column(String(50), index=True) # 'seeker' or 'employer'
    location_area = Column(String(100), index=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    skills = relationship("Skill", secondary=user_skills_association_table)
    jobs_posted = relationship("Job", back_populates="owner")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    category = Column(String(100), index=True)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), index=True)
    description = Column(String(500))
    location_area = Column(String(100), index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    owner = relationship("User", back_populates="jobs_posted")
    required_skills = relationship("Skill", secondary=job_skills_association_table)