import os
import shutil
import psutil
from fastapi import APIRouter
from ..config import settings
from ..services.ffmpeg_service import ffmpeg_service

router = APIRouter(prefix="/api/system", tags=["system"])

@router.get("/health")
async def health():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "ffmpeg_available": ffmpeg_service.is_available()
    }

@router.get("/hardware")
async def hardware_info():
    """Detect local GPU, CPU, and storage statistics."""
    # Storage info
    total_b, used_b, free_b = shutil.disk_usage(settings.STORAGE_DIR)
    
    # GPU detection
    gpu_available = False
    gpu_name = "CPU Mode"
    try:
        import torch
        if torch.cuda.is_available():
            gpu_available = True
            gpu_name = torch.cuda.get_device_name(0)
    except Exception:
        pass

    return {
        "cpu_count": psutil.cpu_count(logical=True),
        "cpu_percent": psutil.cpu_percent(interval=None),
        "ram_total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
        "ram_used_gb": round(psutil.virtual_memory().used / (1024**3), 2),
        "ram_percent": psutil.virtual_memory().percent,
        "disk_free_gb": round(free_b / (1024**3), 2),
        "disk_total_gb": round(total_b / (1024**3), 2),
        "gpu_available": gpu_available,
        "gpu_name": gpu_name,
        "ffmpeg_path": ffmpeg_service.ffmpeg_bin,
        "ffmpeg_available": ffmpeg_service.is_available()
    }
