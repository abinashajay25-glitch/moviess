import os
import shutil
import json
import wave
import struct
import logging
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger("cinedub.ffmpeg")

class FFmpegService:
    def __init__(self):
        self.ffmpeg_bin = self._find_binary("ffmpeg")
        self.ffprobe_bin = self._find_binary("ffprobe")
        logger.info(f"FFmpeg binary detected: {self.ffmpeg_bin}")
        logger.info(f"FFprobe binary detected: {self.ffprobe_bin}")

    def _find_binary(self, name: str) -> Optional[str]:
        # 1. System PATH
        bin_path = shutil.which(name)
        if bin_path:
            return bin_path
        
        # 2. Check common Windows / Linux locations
        candidates = [
            f"C:\\Program Files\\Topaz Labs LLC\\Topaz Video AI\\{name}.exe",
            f"C:\\ffmpeg\\bin\\{name}.exe",
            f"C:\\Program Files\\ffmpeg\\bin\\{name}.exe",
            f"C:\\ProgramData\\chocolatey\\bin\\{name}.exe",
            f"/usr/bin/{name}",
            f"/usr/local/bin/{name}",
        ]
        for c in candidates:
            if os.path.exists(c):
                return c
        return name # Fallback to invocation by name

    def is_available(self) -> bool:
        try:
            res = subprocess.run([self.ffmpeg_bin, "-version"], capture_output=True, text=True, timeout=5)
            return res.returncode == 0
        except Exception:
            return False

    def probe_media(self, file_path: str) -> Dict[str, Any]:
        """Extract media metadata using ffprobe or file size estimation."""
        result = {
            "duration": 0.0,
            "width": 1920,
            "height": 1080,
            "fps": 24.0,
            "has_audio": True,
            "channels": 2,
            "format": "mp4",
            "size": os.path.getsize(file_path) if os.path.exists(file_path) else 0
        }

        try:
            cmd = [
                self.ffprobe_bin,
                "-v", "error",
                "-show_entries", "format=duration,size,format_name:stream=codec_type,width,height,r_frame_rate,channels",
                "-of", "json",
                file_path
            ]
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if proc.returncode == 0:
                data = json.loads(proc.stdout)
                fmt = data.get("format", {})
                result["duration"] = float(fmt.get("duration", 0.0))
                result["size"] = int(fmt.get("size", result["size"]))
                result["format"] = fmt.get("format_name", "mp4").split(",")[0]

                has_audio = False
                for stream in data.get("streams", []):
                    if stream.get("codec_type") == "video":
                        result["width"] = int(stream.get("width", 1920))
                        result["height"] = int(stream.get("height", 1080))
                        fps_str = stream.get("r_frame_rate", "24/1")
                        if "/" in fps_str:
                            num, den = map(float, fps_str.split("/"))
                            result["fps"] = round(num / den, 2) if den > 0 else 24.0
                    elif stream.get("codec_type") == "audio":
                        has_audio = True
                        result["channels"] = int(stream.get("channels", 2))
                result["has_audio"] = has_audio
        except Exception as e:
            logger.warning(f"ffprobe failed ({e}), using fallback estimate")
            # If wave file, probe with python wave
            if file_path.lower().endswith(".wav") and os.path.exists(file_path):
                try:
                    with wave.open(file_path, "rb") as wf:
                        frames = wf.getnframes()
                        rate = wf.getframerate()
                        result["duration"] = round(frames / float(rate), 2)
                except Exception:
                    pass

        return result

    def extract_audio(self, video_path: str, output_wav_path: str, sample_rate: int = 16000) -> bool:
        """
        Extract original audio to 16kHz Mono WAV 16-bit PCM for processing.
        """
        Path(output_wav_path).parent.mkdir(parents=True, exist_ok=True)
        try:
            cmd = [
                self.ffmpeg_bin, "-y",
                "-i", video_path,
                "-vn",                     # Disable video
                "-acodec", "pcm_s16le",    # 16-bit linear PCM
                "-ar", str(sample_rate),   # 16000 Hz
                "-ac", "1",                # Mono
                output_wav_path
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
            if res.returncode == 0 and os.path.exists(output_wav_path):
                return True
            logger.error(f"FFmpeg extraction failed: {res.stderr[:300]}")
            return False
        except Exception as e:
            logger.error(f"Error in extract_audio: {e}")
            return False

    def create_silence_wav(self, output_wav_path: str, duration_sec: float, sample_rate: int = 44100, channels: int = 2) -> bool:
        """Create a silent WAV file using pure Python wave module."""
        Path(output_wav_path).parent.mkdir(parents=True, exist_ok=True)
        try:
            n_samples = int(duration_sec * sample_rate)
            with wave.open(output_wav_path, "wb") as wf:
                wf.setnchannels(channels)
                wf.setsampwidth(2) # 16-bit
                wf.setframerate(sample_rate)
                # 0 bytes for silence
                silence_frame = b"\x00" * (2 * channels)
                chunk = silence_frame * 10000
                full_chunks = n_samples // 10000
                remainder = n_samples % 10000
                for _ in range(full_chunks):
                    wf.writeframes(chunk)
                if remainder:
                    wf.writeframes(silence_frame * remainder)
            return True
        except Exception as e:
            logger.error(f"Failed to create silence WAV: {e}")
            return False

    def adjust_audio_speed(self, input_wav: str, output_wav: str, speed_factor: float) -> bool:
        """
        Adjust audio speed while preserving pitch (atempo filter: 0.5 to 2.0).
        """
        Path(output_wav).parent.mkdir(parents=True, exist_ok=True)
        if abs(speed_factor - 1.0) < 0.03:
            shutil.copy2(input_wav, output_wav)
            return True

        # Clamp speed factor to realistic speech rates
        speed_factor = max(0.5, min(2.0, speed_factor))
        try:
            cmd = [
                self.ffmpeg_bin, "-y",
                "-i", input_wav,
                "-filter:a", f"atempo={speed_factor:.3f}",
                output_wav
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            return res.returncode == 0 and os.path.exists(output_wav)
        except Exception as e:
            logger.warning(f"Speed adjustment with ffmpeg failed ({e}), copying original")
            shutil.copy2(input_wav, output_wav)
            return True

    def merge_dubbed_video(
        self,
        video_path: str,
        dubbed_audio_path: str,
        output_video_path: str,
        bgm_path: Optional[str] = None,
        bgm_volume: float = 0.25,
        dialogue_volume: float = 1.0,
        remove_original_audio: bool = True
    ) -> bool:
        """
        STEP 10: Final video export.
        - Preserves video quality with -c:v copy (or fast re-encode if required).
        - COMPLETELY MUTES and replaces original audio track.
        - Mixes in separated BGM / SFX if requested.
        - Output high quality AAC audio.
        """
        Path(output_video_path).parent.mkdir(parents=True, exist_ok=True)

        try:
            if bgm_path and os.path.exists(bgm_path):
                # Mix dubbed audio + BGM track
                filter_complex = (
                    f"[1:a]volume={dialogue_volume}[dialogue];"
                    f"[2:a]volume={bgm_volume}[bgm];"
                    f"[dialogue][bgm]amix=inputs=2:duration=first:dropout_transition=0[aout]"
                )
                cmd = [
                    self.ffmpeg_bin, "-y",
                    "-i", video_path,          # 0: Video
                    "-i", dubbed_audio_path,   # 1: Dubbed speech
                    "-i", bgm_path,            # 2: Background music/SFX
                    "-filter_complex", filter_complex,
                    "-map", "0:v:0",           # Video stream from original
                    "-map", "[aout]",          # Mixed audio stream
                    "-c:v", "copy",            # Preserves original video resolution, FPS & quality
                    "-c:a", "aac",             # AAC audio codec
                    "-b:a", "192k",
                    "-movflags", "+faststart", # Streaming friendly MP4
                    "-shortest",
                    output_video_path
                ]
            else:
                # Dubbed audio ONLY - Original audio completely removed & replaced
                cmd = [
                    self.ffmpeg_bin, "-y",
                    "-i", video_path,          # 0: Original video
                    "-i", dubbed_audio_path,   # 1: Generated dubbed audio
                    "-map", "0:v:0",           # Keep only video from input 0
                    "-map", "1:a:0",           # Take audio strictly from dubbed track
                    "-c:v", "copy",            # Keep original video stream
                    "-c:a", "aac",             # High-quality AAC
                    "-b:a", "192k",
                    "-movflags", "+faststart",
                    "-shortest",
                    output_video_path
                ]

            res = subprocess.run(cmd, capture_output=True, text=True, timeout=7200)
            if res.returncode == 0 and os.path.exists(output_video_path):
                logger.info(f"Final dubbed video rendered successfully: {output_video_path}")
                return True
            
            logger.warning(f"Stream copy merge failed, attempting re-encode fallback: {res.stderr[:300]}")
            # Fallback with libx264 re-encode if container metadata copy failed
            fallback_cmd = [
                self.ffmpeg_bin, "-y",
                "-i", video_path,
                "-i", dubbed_audio_path,
                "-map", "0:v:0",
                "-map", "1:a:0",
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "22",
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",
                "-shortest",
                output_video_path
            ]
            res2 = subprocess.run(fallback_cmd, capture_output=True, text=True, timeout=7200)
            return res2.returncode == 0 and os.path.exists(output_video_path)

        except Exception as e:
            logger.error(f"Failed to merge dubbed video: {e}")
            return False

ffmpeg_service = FFmpegService()
