from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class CategoryEnum(str, Enum):
    pothole = "Pothole"
    waterlogging = "Waterlogging"
    broken_road = "Broken Road"
    streetlight = "Streetlight"
    garbage = "Garbage"
    drain_overflow = "Drain Overflow"
    other = "Other"

class StatusEnum(str, Enum):
    pending = "Pending"
    verified = "Verified"
    fake = "Fake"
    in_progress = "In Progress"
    resolved = "Resolved"

class ReportCreate(BaseModel):
    title: str
    description: str
    category: CategoryEnum
    latitude: float
    longitude: float
    address: Optional[str] = None
    is_anonymous: bool = False
    reporter_email: Optional[str] = None
    reporter_name: Optional[str] = None

class ReportUpdate(BaseModel):
    status: StatusEnum
    admin_comment: Optional[str] = None

class VoteCreate(BaseModel):
    report_id: str
    voter_email: str
    vote: str

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminUpdate(BaseModel):
    status: StatusEnum
    admin_comment: Optional[str] = None