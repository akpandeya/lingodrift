from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(
    prefix="/api/exams",
    tags=["exams"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[schemas.Exam])
def read_exams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    exams = db.query(models.Exam).offset(skip).limit(limit).all()
    return exams

@router.get("/{exam_id}", response_model=schemas.Exam)
def read_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

# Admin only (basic implementation for seeding)
@router.post("/", response_model=schemas.Exam, status_code=status.HTTP_201_CREATED)
def create_exam(exam: schemas.ExamCreate, db: Session = Depends(get_db)):
    # 1. Create Exam
    db_exam = models.Exam(
        title=exam.title,
        level=exam.level,
        description=exam.description,
        time_limit_minutes=exam.time_limit_minutes
    )
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    
    # 2. Create Sections & Questions (Nested)
    for section_data in exam.sections:
        db_section = models.ExamSection(
            exam_id=db_exam.id,
            title=section_data.title,
            type=section_data.type,
            order=section_data.order
        )
        db.add(db_section)
        db.commit()
        db.refresh(db_section)
        
        for question_data in section_data.questions:
            db_question = models.Question(
                section_id=db_section.id,
                text=question_data.text,
                type=question_data.type,
                content=question_data.content,
                points=question_data.points,
                order=question_data.order
            )
            db.add(db_question)
    
    db.commit()
    db.refresh(db_exam)
    return db_exam
