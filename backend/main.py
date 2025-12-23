from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import engine, Base
import models
import schemas
import auth
import database
from routes import exams

# Create Tables (in dev mode, we just do this. In prod, we use Alembic)
# Create Tables
# models.Base.metadata.create_all(bind=engine) # Disabled in favor of Alembic Migrations

app = FastAPI(title="LingoDrift API", version="2.0.0")

# Allow CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://lingualdrift.com", "https://staging.lingodrift.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(exams.router)

@app.get("/")
def read_root():
    return {"message": "Hello from LingoDrift Backend API!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Auth Routes
@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        auth_provider="email"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
