from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, JSON, Text, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

# Enums
class ExamLevel(str, enum.Enum):
    A1 = "A1"
    A2 = "A2"
    B1 = "B1"
    B2 = "B2"
    C1 = "C1"

class SectionType(str, enum.Enum):
    READING = "reading"
    LISTENING = "listening"
    WRITING = "writing"
    SPEAKING = "speaking"

class QuestionType(str, enum.Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    FILL_IN_BLANK = "fill_in_blank"
    ESSAY = "essay"
    AUDIO_RESPONSE = "audio_response"

# Models

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True) # Nullable for OAuth users
    
    # OAuth Fields
    auth_provider = Column(String, default="email") # email, google, microsoft
    auth_id = Column(String, nullable=True, index=True) # The 'sub' from provider
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    exam_attempts = relationship("ExamAttempt", back_populates="user")

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    level = Column(SQLAlchemyEnum(ExamLevel), index=True)
    description = Column(Text, nullable=True)
    time_limit_minutes = Column(Integer, default=60)
    
    sections = relationship("ExamSection", back_populates="exam", order_by="ExamSection.order")

class ExamSection(Base):
    __tablename__ = "exam_sections"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    title = Column(String) # e.g. "Lesen Teil 1"
    type = Column(SQLAlchemyEnum(SectionType))
    order = Column(Integer)
    
    exam = relationship("Exam", back_populates="sections")
    questions = relationship("Question", back_populates="section", order_by="Question.order")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("exam_sections.id"))
    text = Column(String, nullable=True) # The question prompt
    type = Column(SQLAlchemyEnum(QuestionType))
    content = Column(JSON) # Stores { "question": "...", "options": [...], "correct_answer": "..." }
    points = Column(Integer, default=1)
    order = Column(Integer)
    
    section = relationship("ExamSection", back_populates="questions")

class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exam_id = Column(Integer, ForeignKey("exams.id"))
    
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    score = Column(Integer, nullable=True)
    status = Column(String, default="in_progress") # in_progress, completed, abandoned
    
    user = relationship("User", back_populates="exam_attempts")
    exam = relationship("Exam")
