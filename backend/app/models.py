import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON
from .database import Base

class ProjectStatus:
    DRAFT = "draft"
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    
    # 9-stage pipeline steps
    EXTRACTING_AUDIO = "extracting_audio"          # Step 1
    DETECTING_SPEECH = "detecting_speech"          # Step 2
    IDENTIFYING_SPEAKERS = "identifying_speakers"  # Step 3
    TRANSLATING = "translating"                    # Step 4
    GENERATING_VOICES = "generating_voices"        # Step 5
    SYNCHRONIZING = "synchronizing"                # Step 6
    CREATING_SUBTITLES = "creating_subtitles"      # Step 7
    SEPARATING_AUDIO = "separating_audio"          # Optional BGM separation
    RENDERING = "rendering"                        # Step 8
    
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=True)
    
    # Media paths
    video_path = Column(String(512), nullable=True)
    audio_path = Column(String(512), nullable=True)
    bgm_path = Column(String(512), nullable=True)
    dubbed_audio_path = Column(String(512), nullable=True)
    output_video_path = Column(String(512), nullable=True)
    
    # Language & Audio settings
    source_language = Column(String(50), nullable=False, default="en")
    target_language = Column(String(50), nullable=False, default="ta")
    voice_preference = Column(String(50), default="mixed") # male, female, mixed, dynamic
    tts_engine = Column(String(50), default="hybrid")      # sarvam, elevenlabs, edge_tts, hybrid
    
    # Audio configuration
    remove_original_audio = Column(Boolean, default=True)  # Default: completely mute original audio
    preserve_background_music = Column(Boolean, default=False) # Separate BGM if enabled
    generate_subtitles = Column(Boolean, default=True)
    bilingual_subtitles = Column(Boolean, default=False)
    
    # Media metadata
    file_size = Column(Integer, default=0) # Bytes
    duration = Column(Float, default=0.0)  # Seconds
    resolution = Column(String(50), default="")
    fps = Column(Float, default=0.0)
    
    # Status & Progress tracking (never fake)
    status = Column(String(50), default=ProjectStatus.DRAFT)
    current_stage = Column(String(50), default="idle")
    current_stage_index = Column(Integer, default=0)       # 1 to 9
    progress = Column(Float, default=0.0)                  # Overall 0.0 to 100.0
    stage_progress = Column(Float, default=0.0)            # Current stage 0.0 to 100.0
    estimated_time_remaining = Column(Integer, default=0)  # Seconds
    error_message = Column(Text, nullable=True)
    
    # Data storage
    transcript = Column(JSON, nullable=True)     # [{id, start, end, text, speaker_id, confidence}]
    speakers = Column(JSON, nullable=True)       # {speaker_id: {name, gender, voice_id, voice_name, engine, color}}
    translations = Column(JSON, nullable=True)   # [{id, start, end, original_text, translated_text, speaker_id, audio_file}]
    subtitles_srt = Column(Text, nullable=True)  # Target language SRT
    original_subtitles_srt = Column(Text, nullable=True)
    bilingual_subtitles_srt = Column(Text, nullable=True)
    logs = Column(JSON, default=list)            # [{timestamp, stage, message, level}]
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "original_filename": self.original_filename,
            "video_path": self.video_path,
            "audio_path": self.audio_path,
            "bgm_path": self.bgm_path,
            "dubbed_audio_path": self.dubbed_audio_path,
            "output_video_path": self.output_video_path,
            "source_language": self.source_language,
            "target_language": self.target_language,
            "voice_preference": self.voice_preference,
            "tts_engine": self.tts_engine,
            "remove_original_audio": self.remove_original_audio,
            "preserve_background_music": self.preserve_background_music,
            "generate_subtitles": self.generate_subtitles,
            "bilingual_subtitles": self.bilingual_subtitles,
            "file_size": self.file_size,
            "duration": self.duration,
            "resolution": self.resolution,
            "fps": self.fps,
            "status": self.status,
            "current_stage": self.current_stage,
            "current_stage_index": self.current_stage_index,
            "progress": round(self.progress, 1),
            "stage_progress": round(self.stage_progress, 1),
            "estimated_time_remaining": self.estimated_time_remaining,
            "error_message": self.error_message,
            "has_transcript": bool(self.transcript),
            "transcript_count": len(self.transcript) if self.transcript else 0,
            "has_speakers": bool(self.speakers),
            "speaker_count": len(self.speakers) if self.speakers else 0,
            "has_translations": bool(self.translations),
            "has_subtitles": bool(self.subtitles_srt),
            "has_output_video": bool(self.output_video_path),
            "logs": self.logs[-20:] if self.logs else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
