import os
import wave
import logging
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple
from .ffmpeg_service import ffmpeg_service

logger = logging.getLogger("cinedub.synchronizer")

class AudioSynchronizer:
    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate

    def get_wav_duration(self, wav_path: str) -> float:
        """Get duration in seconds of an audio file."""
        if not os.path.exists(wav_path):
            return 0.0
        try:
            info = ffmpeg_service.probe_media(wav_path)
            return float(info.get("duration", 0.0))
        except Exception:
            return 0.0

    def synchronize_movie_timeline(
        self,
        translated_segments: List[Dict[str, Any]],
        movie_duration: float,
        output_dubbed_wav: str,
        temp_dir: str,
        progress_callback=None
    ) -> bool:
        """
        STEP 8: Audio Synchronization.
        Places every dubbed line at its exact start timestamp.
        Speed-stretches clips if dialogue exceeds allocated scene time.
        Generates a master 44.1kHz stereo WAV track matching the movie duration.
        """
        Path(output_dubbed_wav).parent.mkdir(parents=True, exist_ok=True)
        Path(temp_dir).mkdir(parents=True, exist_ok=True)

        if movie_duration <= 0:
            movie_duration = max((s.get("end", 0.0) for s in translated_segments), default=10.0)

        total_samples = int(movie_duration * self.sample_rate)
        # 16-bit stereo master buffer (channels = 2)
        master_left = np.zeros(total_samples, dtype=np.float32)
        master_right = np.zeros(total_samples, dtype=np.float32)

        total_segs = len(translated_segments)
        logger.info(f"Synchronizing {total_segs} dubbed dialogues across {movie_duration:.1f}s movie timeline...")

        for idx, seg in enumerate(translated_segments):
            audio_file = seg.get("audio_file")
            if not audio_file or not os.path.exists(audio_file):
                continue

            orig_st = seg["start"]
            orig_en = seg["end"]
            allowed_duration = max(0.5, orig_en - orig_st)
            actual_duration = self.get_wav_duration(audio_file)

            aligned_audio_file = audio_file

            # Speed stretch if actual speech is significantly longer than original slot
            if actual_duration > (allowed_duration * 1.15) and actual_duration > 0.5:
                speed_ratio = actual_duration / allowed_duration
                # Clamp speed ratio to avoid hyper-fast chipmunk speech
                speed_ratio = min(1.45, speed_ratio)
                stretched_file = os.path.join(temp_dir, f"stretched_seg_{idx}.wav")
                ok = ffmpeg_service.adjust_audio_speed(audio_file, stretched_file, speed_ratio)
                if ok:
                    aligned_audio_file = stretched_file

            # Overlay clip into master audio buffer at exact start timestamp
            try:
                # Read clip audio via ffmpeg conversion to raw pcm or wave
                clip_wav = os.path.join(temp_dir, f"conv_seg_{idx}.wav")
                cmd_ok = ffmpeg_service.extract_audio(aligned_audio_file, clip_wav, sample_rate=self.sample_rate)
                target_clip = clip_wav if cmd_ok else aligned_audio_file

                with wave.open(target_clip, "rb") as wf:
                    n_frames = wf.getnframes()
                    raw = wf.readframes(n_frames)
                    clip_samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

                start_idx = int(orig_st * self.sample_rate)
                end_idx = min(start_idx + len(clip_samples), total_samples)
                clip_len = end_idx - start_idx

                if clip_len > 0 and start_idx < total_samples:
                    master_left[start_idx:end_idx] += clip_samples[:clip_len]
                    master_right[start_idx:end_idx] += clip_samples[:clip_len]

            except Exception as e:
                logger.warning(f"Error overlaying segment {idx}: {e}")

            if progress_callback and total_segs > 0:
                progress_callback(round(((idx + 1) / total_segs) * 100, 1))

        # Normalize to prevent clipping distortion
        max_val = max(np.max(np.abs(master_left)), np.max(np.abs(master_right)), 1.0)
        master_left = (master_left / max_val * 0.95 * 32767.0).astype(np.int16)
        master_right = (master_right / max_val * 0.95 * 32767.0).astype(np.int16)

        # Interleave stereo
        stereo_data = np.empty((total_samples, 2), dtype=np.int16)
        stereo_data[:, 0] = master_left
        stereo_data[:, 1] = master_right

        # Write master WAV
        try:
            with wave.open(output_dubbed_wav, "wb") as wf:
                wf.setnchannels(2)
                wf.setsampwidth(2)
                wf.setframerate(self.sample_rate)
                wf.writeframes(stereo_data.tobytes())

            logger.info(f"Master synchronized dubbed audio rendered: {output_dubbed_wav} ({movie_duration:.1f}s)")
            return os.path.exists(output_dubbed_wav)
        except Exception as e:
            logger.error(f"Failed to write master dubbed audio: {e}")
            return False

audio_synchronizer = AudioSynchronizer()
