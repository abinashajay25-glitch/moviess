import os
import tempfile
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ..config import settings
from ..schemas import VoicePreviewRequest
from ..services.tts_service import tts_service, VOICE_CATALOG

router = APIRouter(prefix="/api", tags=["voices"])

LANGUAGES = [
    {"code": "ta", "name": "Tamil", "native": "தமிழ்", "flag": "🇮🇳", "supported": True},
    {"code": "hi", "name": "Hindi", "native": "हिन्दी", "flag": "🇮🇳", "supported": True},
    {"code": "en", "name": "English", "native": "English", "flag": "🇺🇸", "supported": True},
    {"code": "te", "name": "Telugu", "native": "తెలుగు", "flag": "🇮🇳", "supported": True},
    {"code": "ml", "name": "Malayalam", "native": "മലയാളം", "flag": "🇮🇳", "supported": True},
    {"code": "kn", "name": "Kannada", "native": "ಕನ್ನಡ", "flag": "🇮🇳", "supported": True},
    {"code": "ja", "name": "Japanese", "native": "日本語", "flag": "🇯🇵", "supported": True},
    {"code": "ko", "name": "Korean", "native": "한국어", "flag": "🇰🇷", "supported": True},
    {"code": "zh", "name": "Chinese", "native": "中文", "flag": "🇨🇳", "supported": True},
    {"code": "es", "name": "Spanish", "native": "Español", "flag": "🇪🇸", "supported": True},
    {"code": "fr", "name": "French", "native": "Français", "flag": "🇫🇷", "supported": True},
    {"code": "de", "name": "German", "native": "Deutsch", "flag": "🇩🇪", "supported": True},
]

@router.get("/languages")
async def get_languages():
    """Return all supported movie dubbing languages."""
    return {
        "success": True,
        "source_languages": LANGUAGES,
        "target_languages": LANGUAGES
    }

@router.get("/voices")
async def get_voices(target_lang: str = "ta"):
    """Get all voice models available for a target language."""
    voices = tts_service.get_catalog(target_lang)
    return {
        "success": True,
        "target_language": target_lang,
        "voices": voices
    }

@router.post("/voice-preview")
async def preview_voice(req: VoicePreviewRequest):
    """Generate sample audio to audition a character's voice."""
    sample_text = req.text.strip() or "Welcome to CineDub AI studio. Every movie, every language, one AI studio."
    temp_preview = os.path.join(settings.TEMP_DIR, f"preview_{req.voice_id}.wav")

    ok = tts_service.synthesize_segment(
        text=sample_text,
        output_path=temp_preview,
        voice_id=req.voice_id,
        engine=req.engine,
        target_lang=req.language,
        speed=req.speed,
        pitch=req.pitch
    )

    if not ok or not os.path.exists(temp_preview):
        raise HTTPException(status_code=500, detail="Voice audition synthesis failed")

    return FileResponse(temp_preview, media_type="audio/wav")
