from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    full_name: Optional[str] = None

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    auth_provider: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Exam Schemas ---

class QuestionBase(BaseModel):
    text: str
    type: str # multiple_choice, etc
    content: Optional[dict] = None
    points: int = 1
    order: int = 0

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    id: int
    section_id: int

    class Config:
        from_attributes = True

class ExamSectionBase(BaseModel):
    title: str
    type: str
    order: int

class ExamSectionCreate(ExamSectionBase):
    questions: list[QuestionCreate] = []

class ExamSection(ExamSectionBase):
    id: int
    exam_id: int
    questions: list[Question] = []

    class Config:
        from_attributes = True

class ExamBase(BaseModel):
    title: str
    level: str # A1, A2, etc
    description: Optional[str] = None
    time_limit_minutes: int = 60

class ExamCreate(ExamBase):
    sections: list[ExamSectionCreate] = []

class Exam(ExamBase):
    id: int
    sections: list[ExamSection] = []

    class Config:
        from_attributes = True

