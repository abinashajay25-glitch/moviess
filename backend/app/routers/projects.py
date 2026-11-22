import os
import shutil
import logging
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Project, ProjectStatus
from ..schemas import ProjectCreateRequest, ProjectUpdateRequest, TranscriptUpdateRequest, SpeakerUpdateRequest
from ..config import settings
from ..services.pipeline import movie_pipeline
from ..services.subtitle_service import subtitle_service

logger = logging.getLogger("cinedub.api.projects")

router = APIRouter(prefix="/api/projects", tags=["projects"])

ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mkv", ".mov", ".webm", ".avi", ".ts"}

@router.post("")
async def create_project(data: ProjectCreateRequest, db: Session = Depends(get_db)):
    """Create a new CineDub AI project."""
    project = Project(
        name=data.name,
        source_language=data.source_language,
        target_language=data.target_language,
        voice_preference=data.voice_preference,
        tts_engine=data.tts_engine,
        remove_original_audio=data.remove_original_audio,
        preserve_background_music=data.preserve_background_music,
        generate_subtitles=data.generate_subtitles,
        bilingual_subtitles=data.bilingual_subtitles,
        status=ProjectStatus.DRAFT
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return {"success": True, "data": project.to_dict()}

@router.get("")
async def list_projects(db: Session = Depends(get_db)):
    """List all movie dubbing projects."""
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    return {"success": True, "data": [p.to_dict() for p in projects]}

@router.get("/{project_id}")
async def get_project(project_id: str, db: Session = Depends(get_db)):
    """Get project details."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"success": True, "data": project.to_dict()}

@router.post("/{project_id}/upload")
async def upload_movie(
    project_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    STEP 1: Upload movie file with validation and secure chunked streaming.
    Supports MP4, MKV, MOV, WebM, and multi-gigabyte video files.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Allowed: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}")

    project_dir = os.path.join(settings.UPLOAD_DIR, project_id)
    Path(project_dir).mkdir(parents=True, exist_ok=True)

    dest_path = os.path.join(project_dir, f"movie{ext}")

    total_bytes = 0
    with open(dest_path, "wb") as out_file:
        while chunk := await file.read(2 * 1024 * 1024): # 2MB chunk streaming
            total_bytes += len(chunk)
            if total_bytes > settings.max_upload_bytes:
                out_file.close()
                os.remove(dest_path)
                raise HTTPException(status_code=413, detail=f"File exceeds maximum allowed size ({settings.MAX_UPLOAD_SIZE_GB} GB)")
            out_file.write(chunk)

    project.video_path = dest_path
    project.original_filename = file.filename
    project.file_size = total_bytes
    project.status = ProjectStatus.UPLOADED
    project.current_stage = "Uploaded - Ready to Start"
    db.commit()

    return {
        "success": True,
        "message": f"Successfully uploaded {file.filename} ({round(total_bytes / (1024*1024), 1)} MB)",
        "data": project.to_dict()
    }

@router.post("/{project_id}/start")
async def start_processing(
    project_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Start the 9-stage movie dubbing pipeline."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.video_path or not os.path.exists(project.video_path):
        raise HTTPException(status_code=400, detail="No movie file found for this project. Please upload first.")

    project.status = ProjectStatus.PROCESSING
    project.progress = 1.0
    project.current_stage = "Starting pipeline..."
    project.error_message = None
    db.commit()

    # Launch pipeline in background task
    background_tasks.add_task(movie_pipeline.run_pipeline_async, project_id)

    return {"success": True, "message": "Pipeline initiated", "project_id": project_id}

@router.get("/{project_id}/status")
async def get_project_status(project_id: str, db: Session = Depends(get_db)):
    """Get real-time progress, stage index, and logs."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"success": True, "data": project.to_dict()}

@router.get("/{project_id}/transcript")
async def get_transcript(project_id: str, db: Session = Depends(get_db)):
    """Get transcribed dialogues and translations."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "success": True,
        "data": {
            "transcript": project.transcript or [],
            "translations": project.translations or []
        }
    }

@router.put("/{project_id}/transcript")
async def update_transcript(
    project_id: str,
    data: TranscriptUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update dialogue translations manually in the Subtitle Studio."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.translations = data.segments
    # Regenerate SRT string
    project.subtitles_srt = subtitle_service.generate_srt(data.segments, text_key="translated_text")
    project.bilingual_subtitles_srt = subtitle_service.generate_bilingual_srt(data.segments)
    db.commit()

    return {"success": True, "message": f"Updated {len(data.segments)} dialogue lines"}

@router.get("/{project_id}/speakers")
async def get_speakers(project_id: str, db: Session = Depends(get_db)):
    """Get character list and assigned AI voices."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"success": True, "data": project.speakers or {}}

@router.put("/{project_id}/speakers")
async def update_speakers(
    project_id: str,
    data: SpeakerUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update character names, genders, and assigned AI voices."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.speakers = data.speakers
    db.commit()
    return {"success": True, "message": "Character voice casting updated"}

@router.get("/{project_id}/subtitles")
async def download_subtitles(
    project_id: str,
    format_type: str = "target", # target, original, bilingual
    db: Session = Depends(get_db)
):
    """Download SRT subtitle file."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if format_type == "original":
        content = project.original_subtitles_srt or "1\n00:00:00,000 --> 00:00:05,000\nNo dialogue detected."
        filename = f"{project.name}_{project.source_language}_original.srt"
    elif format_type == "bilingual":
        content = project.bilingual_subtitles_srt or project.subtitles_srt or ""
        filename = f"{project.name}_{project.target_language}_bilingual.srt"
    else:
        content = project.subtitles_srt or "1\n00:00:00,000 --> 00:00:05,000\nNo dialogue detected."
        filename = f"{project.name}_{project.target_language}_dubbed.srt"

    return StreamingResponse(
        iter([content.encode("utf-8")]),
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{project_id}/download")
async def download_movie(project_id: str, db: Session = Depends(get_db)):
    """Download the final dubbed MP4 movie."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.status != ProjectStatus.COMPLETED or not project.output_video_path:
        raise HTTPException(status_code=400, detail="Dubbed movie is not yet ready for download.")

    if not os.path.exists(project.output_video_path):
        raise HTTPException(status_code=404, detail="Dubbed movie file could not be found on disk.")

    filename = os.path.basename(project.output_video_path)
    return FileResponse(
        project.output_video_path,
        media_type="video/mp4",
        filename=filename
    )

@router.get("/{project_id}/media/{media_type}")
async def stream_media(
    project_id: str,
    media_type: str, # original_video, dubbed_video, original_audio, dubbed_audio, bgm
    db: Session = Depends(get_db)
):
    """Stream media files for in-browser HTML5 video/audio playback."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    path_map = {
        "original_video": project.video_path,
        "dubbed_video": project.output_video_path,
        "original_audio": project.audio_path,
        "dubbed_audio": project.dubbed_audio_path,
        "bgm": project.bgm_path
    }

    target_path = path_map.get(media_type)
    if not target_path or not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail=f"Media file '{media_type}' is not yet available.")

    content_type = "video/mp4" if "video" in media_type else "audio/wav"
    return FileResponse(target_path, media_type=content_type)

@router.post("/{project_id}/cancel")
async def cancel_project(project_id: str, db: Session = Depends(get_db)):
    """Cancel processing pipeline."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    movie_pipeline.cancel(project_id)
    return {"success": True, "message": "Dubbing pipeline cancelled"}

@router.post("/{project_id}/retry")
async def retry_project(
    project_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Retry a failed or cancelled project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.status = ProjectStatus.PROCESSING
    project.error_message = None
    project.progress = 0.0
    db.commit()

    background_tasks.add_task(movie_pipeline.run_pipeline_async, project_id)
    return {"success": True, "message": "Pipeline restarted"}

@router.delete("/{project_id}")
async def delete_project(project_id: str, db: Session = Depends(get_db)):
    """Delete project and remove files from storage."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Clean directories
    for base in [settings.UPLOAD_DIR, settings.OUTPUT_DIR]:
        d = os.path.join(base, project_id)
        if os.path.exists(d):
            shutil.rmtree(d, ignore_errors=True)

    db.delete(project)
    db.commit()
    return {"success": True, "message": "Project deleted"}
