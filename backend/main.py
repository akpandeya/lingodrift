from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="LingoDrift API", version="2.0.0")

# Allow CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://lingualdrift.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Willkommen bei LingoDrift v2 API 🇩🇪"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
