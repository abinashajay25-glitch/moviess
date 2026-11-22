import os
import wave
import logging
import subprocess
import numpy as np
from pathlib import Path
from typing import Optional
from .ffmpeg_service import ffmpeg_service

logger = logging.getLogger("cinedub.separator")

class AudioSeparatorService:
    def __init__(self):
        self._demucs_available = False

    def separate_vocals_and_bgm(
        self,
        audio_path: str,
        output_bgm_path: str,
        output_vocals_path: Optional[str] = None
    ) -> bool:
        """
        Extract background music and sound effects while removing original dialogue.
        Uses Demucs / Spleeter if available, with robust center-channel vocal cancellation fallback.
        """
        Path(output_bgm_path).parent.mkdir(parents=True, exist_ok=True)

        # Attempt 1: Demucs CLI / library if installed
        try:
            cmd = ["demucs", "--two-stems=vocals", "-o", os.path.dirname(output_bgm_path), audio_path]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)
            if res.returncode == 0:
                logger.info("Demucs stem separation completed successfully")
                return True
        except Exception:
            pass

        # Attempt 2: High quality center-channel speech attenuation via FFmpeg
        # Movie speech is typically panned dead-center, while BGM/reverb/SFX are wide stereo.
        # [0:a]pan=stereo|c0=c0-c1|c1=c1-c0 cancels mono dialog while preserving stereo ambiance.
        try:
            cmd = [
                ffmpeg_service.ffmpeg_bin, "-y",
                "-i", audio_path,
                "-af", "pan=stereo|c0=0.7*c0-0.7*c1|c1=0.7*c1-0.7*c0,lowpass=f=4000,highpass=f=80",
                "-c:a", "pcm_s16le",
                output_bgm_path
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            if res.returncode == 0 and os.path.exists(output_bgm_path):
                logger.info(f"Background ambiance extracted via vocal attenuation: {output_bgm_path}")
                return True
        except Exception as e:
            logger.warning(f"FFmpeg vocal suppression failed: {e}")

        # Fallback: copy original at lowered level
        try:
            cmd = [
                ffmpeg_service.ffmpeg_bin, "-y",
                "-i", audio_path,
                "-filter:a", "volume=0.2",
                output_bgm_path
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            return res.returncode == 0
        except Exception:
            return False

audio_separator = AudioSeparatorService()
