from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    source_language: str = "en"
    target_language: str = "ta"
    voice_preference: str = "mixed"  # male, female, mixed
    tts_engine: str = "hybrid"
    remove_original_audio: bool = True
    preserve_background_music: bool = False
    generate_subtitles: bool = True
    bilingual_subtitles: bool = False

class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    source_language: Optional[str] = None
    target_language: Optional[str] = None
    voice_preference: Optional[str] = None
    tts_engine: Optional[str] = None
    remove_original_audio: Optional[bool] = None
    preserve_background_music: Optional[bool] = None
    generate_subtitles: Optional[bool] = None

class TranscriptSegment(BaseModel):
    id: int
    start: float
    end: float
    text: str
    speaker_id: Optional[str] = "SPEAKER_00"
    translated_text: Optional[str] = None
    confidence: Optional[float] = 1.0

class TranscriptUpdateRequest(BaseModel):
    segments: List[Dict[str, Any]]

class SpeakerInfo(BaseModel):
    id: str
    name: str
    gender: str = "male"
    voice_id: Optional[str] = None
    voice_name: Optional[str] = None
    engine: Optional[str] = "sarvam"
    color: Optional[str] = "#7c3aed"
    pitch: Optional[float] = 1.0
    speed: Optional[float] = 1.0
    volume: Optional[float] = 1.0

class SpeakerUpdateRequest(BaseModel):
    speakers: Dict[str, Dict[str, Any]]

class VoicePreviewRequest(BaseModel):
    text: str
    voice_id: str
    engine: str = "sarvam"
    language: str = "ta"
    gender: str = "female"
    speed: float = 1.0
    pitch: float = 1.0

class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
