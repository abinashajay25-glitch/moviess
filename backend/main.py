import os
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.routers import projects, voices, system

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cinedub.main")

app = FastAPI(
    title="CineDub AI API",
    description="Open-Source AI Movie Dubbing Studio API - Every Movie. Every Language. One AI Studio.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(projects.router)
app.include_router(voices.router)
app.include_router(system.router)

# Mount outputs for direct static file streaming
if settings.OUTPUT_DIR.exists():
    app.mount("/static/outputs", StaticFiles(directory=str(settings.OUTPUT_DIR)), name="outputs")

@app.on_event("startup")
async def startup_event():
    logger.info("🎬 Starting CineDub AI Studio Backend...")
    init_db()
    logger.info(f"Database initialized. Storage: {settings.STORAGE_DIR}")
    logger.info("CineDub AI Backend ready to process movies!")

@app.get("/")
async def root():
    return {
        "studio": "CineDub AI",
        "tagline": "Every Movie. Every Language. One AI Studio.",
        "status": "online",
        "docs": "/docs",
        "health": "/api/system/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
