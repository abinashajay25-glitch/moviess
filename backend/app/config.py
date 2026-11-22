import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "CineDub AI"
    APP_ENV: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    DEBUG: bool = True

    # Storage paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOAD_DIR: Path = STORAGE_DIR / "uploads"
    OUTPUT_DIR: Path = STORAGE_DIR / "outputs"
    TEMP_DIR: Path = STORAGE_DIR / "temp"
    MODELS_DIR: Path = STORAGE_DIR / "models"
    
    DATABASE_URL: str = f"sqlite:///{(BASE_DIR / 'cinedub.db').as_posix()}"
    MAX_UPLOAD_SIZE_GB: float = 10.0

    # API Keys
    AUDIO_API_KEY: str = ""
    ELEVENLABS_API_KEY: str = ""
    NVIDIA_API_KEY: str = ""
    SARVAM_API_KEY: str = ""

    # Engine configs
    DEFAULT_TTS_ENGINE: str = "hybrid"  # sarvam, elevenlabs, edge_tts, hybrid
    WHISPER_MODEL: str = "base"
    WHISPER_DEVICE: str = "cpu"
    TRANSLATION_MODEL: str = "nllb-200-distilled-600M"
    USE_GPU: bool = False

    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"

    class Config:
        env_file = Path(__file__).resolve().parent.parent / ".env"
        extra = "allow"

    @property
    def max_upload_bytes(self) -> int:
        return int(self.MAX_UPLOAD_SIZE_GB * 1024 * 1024 * 1024)

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

settings = Settings()

# Ensure all storage directories exist
for folder in [settings.STORAGE_DIR, settings.UPLOAD_DIR, settings.OUTPUT_DIR, settings.TEMP_DIR, settings.MODELS_DIR]:
    folder.mkdir(parents=True, exist_ok=True)
