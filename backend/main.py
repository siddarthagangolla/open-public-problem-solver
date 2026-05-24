from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from routers import reports, auth, admin, verify

load_dotenv()

app = FastAPI(
    title="Open Public Problem Solver API",
    description="A civic platform to report, verify and resolve public problems — A Hope",
    version="1.0.0"
)

# CORS — allows React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(auth.router,    prefix="/api/auth",    tags=["Auth"])
app.include_router(admin.router,   prefix="/api/admin",   tags=["Admin"])
app.include_router(verify.router,  prefix="/api/verify",  tags=["Verify"])

@app.get("/")
def root():
    return {
        "app": "Open Public Problem Solver",
        "version": "1.0.0",
        "status": "running",
        "message": "Report. Verify. Resolve. — A Hope 🌍"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}