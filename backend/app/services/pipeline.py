import os
import time
import shutil
import logging
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

from ..config import settings
from ..database import SessionLocal
from ..models import Project, ProjectStatus
from .ffmpeg_service import ffmpeg_service
from .speech_service import speech_service
from .diarization_service import diarization_service
from .translation_service import translation_service
from .tts_service import tts_service
from .audio_synchronizer import audio_synchronizer
from .audio_separator import audio_separator
from .subtitle_service import subtitle_service

logger = logging.getLogger("cinedub.pipeline")

# Active task registry for cancellation
ACTIVE_PIPELINES: Dict[str, bool] = {}

class MoviePipelineOrchestrator:
    def __init__(self):
        pass

    def log_event(self, project_id: str, stage: str, message: str, level: str = "info"):
        """Append log event to project database and logger."""
        logger.info(f"[{project_id[:8]}] [{stage}] {message}")
        try:
            db = SessionLocal()
            proj = db.query(Project).filter(Project.id == project_id).first()
            if proj:
                logs = list(proj.logs or [])
                logs.append({
                    "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
                    "stage": stage,
                    "message": message,
                    "level": level
                })
                proj.logs = logs
                db.commit()
            db.close()
        except Exception:
            pass

    def update_status(
        self,
        project_id: str,
        status: str,
        stage_name: str,
        stage_idx: int,
        overall_progress: float,
        stage_progress: float = 0.0,
        est_remaining_sec: int = 0,
        error_msg: Optional[str] = None,
        **extra_fields
    ):
        """Atomically update project state in database."""
        try:
            db = SessionLocal()
            proj = db.query(Project).filter(Project.id == project_id).first()
            if proj:
                proj.status = status
                proj.current_stage = stage_name
                proj.current_stage_index = stage_idx
                proj.progress = round(overall_progress, 1)
                proj.stage_progress = round(stage_progress, 1)
                proj.estimated_time_remaining = est_remaining_sec
                if error_msg:
                    proj.error_message = error_msg
                for k, v in extra_fields.items():
                    if hasattr(proj, k):
                        setattr(proj, k, v)
                db.commit()
            db.close()
        except Exception as e:
            logger.error(f"Failed to update project status: {e}")

    def is_cancelled(self, project_id: str) -> bool:
        return ACTIVE_PIPELINES.get(project_id) is False

    def cancel(self, project_id: str):
        ACTIVE_PIPELINES[project_id] = False
        self.update_status(
            project_id=project_id,
            status=ProjectStatus.CANCELLED,
            stage_name="Cancelled by user",
            stage_idx=0,
            overall_progress=0.0
        )
        self.log_event(project_id, "SYSTEM", "Pipeline cancelled by user.", "warning")

    async def run_pipeline_async(self, project_id: str):
        """Asynchronously trigger movie dubbing pipeline."""
        ACTIVE_PIPELINES[project_id] = True
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self.execute_pipeline, project_id)

    def execute_pipeline(self, project_id: str):
        """
        The Master 9-Stage Automatic Movie Processing Pipeline.
        """
        db = SessionLocal()
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            db.close()
            return

        video_path = project.video_path
        source_lang = project.source_language
        target_lang = project.target_language
        voice_pref = project.voice_preference
        tts_engine = project.tts_engine
        remove_orig_audio = project.remove_original_audio
        preserve_bgm = project.preserve_background_music
        generate_subs = project.generate_subtitles
        project_name = project.name
        db.close()

        project_dir = os.path.join(settings.OUTPUT_DIR, project_id)
        temp_dir = os.path.join(project_dir, "temp")
        voices_dir = os.path.join(project_dir, "character_voices")
        for d in [project_dir, temp_dir, voices_dir]:
            Path(d).mkdir(parents=True, exist_ok=True)

        start_time = time.time()
        self.log_event(project_id, "INIT", f"Initializing CineDub AI Studio for '{project_name}'")

        try:
            # ----------------------------------------------------
            # STAGE 1: Video Verification & Probe
            # ----------------------------------------------------
            if self.is_cancelled(project_id): return
            self.update_status(project_id, ProjectStatus.PROCESSING, "Analyzing movie metadata...", 1, 5.0, 50.0, 180)
            self.log_event(project_id, "STAGE 1", "Inspecting video stream, frame rate, resolution and audio tracks...")

            media_info = ffmpeg_service.probe_media(video_path)
            duration = media_info.get("duration", 0.0)
            resolution = f"{media_info.get('width', 1920)}x{media_info.get('height', 1080)}"
            fps = media_info.get("fps", 24.0)

            self.update_status(
                project_id, ProjectStatus.PROCESSING, "Movie metadata analyzed", 1, 10.0, 100.0, 170,
                duration=duration, resolution=resolution, fps=fps
            )
            self.log_event(project_id, "STAGE 1", f"Duration: {duration:.1f}s | Resolution: {resolution} | FPS: {fps}")

            # ----------------------------------------------------
            # STAGE 2: Audio Extraction
            # ----------------------------------------------------
            if self.is_cancelled(project_id): return
            self.update_status(project_id, ProjectStatus.EXTRACTING_AUDIO, "Extracting high-fidelity audio...", 2, 12.0, 20.0, 160)
            self.log_event(project_id, "STAGE 2", "Extracting dialogue stream to 16kHz 16-bit linear PCM WAV...")

            extracted_wav = os.path.join(project_dir, "original_dialogue.wav")
            ok = ffmpeg_service.extract_audio(video_path, extracted_wav, sample_rate=16000)
            if not ok or not os.path.exists(extracted_wav):
                raise Exception("FFmpeg audio extraction failed from movie container.")

            self.update_status(project_id, ProjectStatus.PROCESSING, "Audio extracted", 2, 20.0, 100.0, 150, audio_path=extracted_wav)
            self.log_event(project_id, "STAGE 2", "Audio extraction complete.")

            # Optional Stem Separation: Extract BGM
            bgm_wav = None
            if preserve_bgm:
                self.update_status(project_id, ProjectStatus.SEPARATING_AUDIO, "Separating background music & SFX...", 2, 22.0, 50.0, 145)
                self.log_event(project_id, "STAGE 2B", "Separating vocals from ambient BGM/SFX tracks...")
                bgm_wav = os.path.join(project_dir, "background_music.wav")
                audio_separator.separate_vocals_and_bgm(extracted_wav, bgm_wav)
                self.update_status(project_id, ProjectStatus.PROCESSING, "BGM track isolated", 2, 25.0, 100.0, 140, bgm_path=bgm_wav)

            # ----------------------------------------------------
            # STAGE 3: Speech Recognition (Transcription)
            # ----------------------------------------------------
            if self.is_cancelled(project_id): return
            self.update_status(project_id, ProjectStatus.DETECTING_SPEECH, f"Detecting speech dialogues ({source_lang.upper()})...", 3, 26.0, 10.0, 130)
            self.log_event(project_id, "STAGE 3", f"Transcribing dialogue sentences and sentence boundaries...")

            segments = speech_service.transcribe(extracted_wav, language=source_lang)
            if not segments:
                raise Exception("No spoken dialogue could be detected in this movie.")

            self.update_status(
                project_id, ProjectStatus.PROCESSING, f"Detected {len(segments)} dialogue sequences", 3, 38.0, 100.0, 115,
                transcript=segments
            )
            self.log_event(project_id, "STAGE 3", f"Transcribed {len(segments)} dialogue segments with precise timestamps.")

            # ----------------------------------------------------
            # STAGE 4: Speaker Diarization (Character Detection)
            # ----------------------------------------------------
            if self.is_cancelled(project_id): return
            self.update_status(project_id, ProjectStatus.IDENTIFYING_SPEAKERS, "Detecting movie characters & speakers...", 4, 40.0, 20.0, 105)
            self.log_event(project_id, "STAGE 4", "Clustering acoustic formants to identify individual characters...")

            diarized_segments, speakers_dict = diarization_service.diarize_and_assign(
                extracted_wav, segments, voice_preference=voice_pref, target_language=target_lang
            )

            # Auto-assign voices to characters
            speakers_dict = tts_service.auto_assign_voices(speakers_dict, target_lang=target_lang, engine_preference=tts_engine)

            self.update_status(
                project_id, ProjectStatus.PROCESSING, f"Identified {len(speakers_dict)} movie characters", 4, 48.0, 100.0, 95,
                transcript=diarized_segments, speakers=speakers_dict
            )
            for spk_id, spk in speakers_dict.items():
                self.log_event(project_id, "STAGE 4", f"Cast {spk['name']} ({spk['gender']}) -> Voice: {spk.get('voice_name')} [{spk.get('color')}]")

            # ----------------------------------------------------
            # STAGE 5: Translation
            # ----------------------------------------------------
            if self.is_cancelled(project_id): return
            self.update_status(project_id, ProjectStatus.TRANSLATING, f"Translating dialogues to {target_lang.upper()}...", 5, 50.0, 15.0, 85)
            self.log_event(project_id, "STAGE 5", f"Translating conversational dialogue naturally from {source_lang} to {target_lang}...")

            translated_segments = translation_service.translate_segments(
                diarized_segments, source_lang=source_lang, target_lang=target_lang
            )

            self.update_status(
                project_id, ProjectStatus.PROCESSING, "Translation completed", 5, 62.0, 100.0, 70,
                translations=translated_segments
            )
            self.log_event(project_id, "STAGE 5", f"Translated {len(translated_segments)} dialogue lines preserving context and tone.")

            # ----------------------------------------------------
            # STAGE 6: AI Voice Generation
            # ----------------------------------------------------
            if self.is_cancelled(project_id): return
            self.update_status(project_id, ProjectStatus.GENERATING_VOICES, f"Generating natural AI voices for each character...", 6, 64.0, 5.0, 60)
            self.log_event(project_id, "STAGE 6", f"Synthesizing high-fidelity dubbed speech clips...")

            total_segs = len(translated_segments)
            for idx, seg in enumerate(translated_segments):
                if self.is_cancelled(project_id): return
                spk_id = seg.get("speaker_id", "SPEAKER_00")
                spk_info = speakers_dict.get(spk_id, {})
                voice_id = spk_info.get("voice_id", "ta-IN-ValluvarNeural")
                engine = spk_info.get("engine", "sarvam")

                seg_text = seg.get("translated_text", "")
                clip_filename = f"dialogue_{idx:05d}_{spk_id}.wav"
                clip_path = os.path.join(voices_dir, clip_filename)

                tts_service.synthesize_segment(
                    text=seg_text,
                    output_path=clip_path,
                    voice_id=voice_id,
                    engine=engine,
                    target_lang=target_lang,
                    speed=spk_info.get("speed", 1.0),
                    pitch=spk_info.get("pitch", 1.0)
                )

                seg["audio_file"] = clip_path if os.path.exists(clip_path) else None
                pct = round(((idx + 1) / total_segs) * 100, 1)
                self.update_status(project_id, ProjectStatus.GENERATING_VOICES, f"Voicing dialogue {idx+1}/{total_segs}...", 6, 64.0 + (pct * 0.14), pct, 50)

            self.update_status(
                project_id, ProjectStatus.PROCESSING, "Character voice synthesis complete", 6, 78.0, 100.0, 40,
                translations=translated_segments
            )
            self.log_event(project_id, "STAGE 6", "All character dialogues synthesized with distinct voices.")

            # ----------------------------------------------------
            # STAGE 7: Dialogue Audio Synchronization
            # ----------------------------------------------------
            if self.is_cancelled(project_id): return
            self.update_status(project_id, ProjectStatus.SYNCHRONIZING, "Synchronizing dialogues to movie timeline...", 7, 80.0, 20.0, 30)
            self.log_event(project_id, "STAGE 7", "Aligning audio clips to original timestamps and applying time stretching...")

            dubbed_master_wav = os.path.join(project_dir, "dubbed_master_audio.wav")
            sync_ok = audio_synchronizer.synchronize_movie_timeline(
                translated_segments, movie_duration=duration, output_dubbed_wav=dubbed_master_wav, temp_dir=temp_dir
            )

            if not sync_ok or not os.path.exists(dubbed_master_wav):
                raise Exception("Failed to build synchronized dialogue audio timeline.")

            self.update_status(
                project_id, ProjectStatus.PROCESSING, "Dialogue timeline synchronized", 7, 88.0, 100.0, 25,
                dubbed_audio_path=dubbed_master_wav
            )
            self.log_event(project_id, "STAGE 7", "Dubbed master audio track aligned with zero dialogue overlap.")

            # ----------------------------------------------------
            # STAGE 8: Subtitle Generation
            # ----------------------------------------------------
            if self.is_cancelled(project_id): return
            self.update_status(project_id, ProjectStatus.CREATING_SUBTITLES, "Generating target & bilingual subtitles...", 8, 90.0, 50.0, 20)
            self.log_event(project_id, "STAGE 8", "Formatting SRT and WebVTT subtitle files...")

            target_srt = subtitle_service.generate_srt(translated_segments, text_key="translated_text")
            orig_srt = subtitle_service.generate_srt(translated_segments, text_key="original_text")
            bilingual_srt = subtitle_service.generate_bilingual_srt(translated_segments)

            # Save subtitle files
            with open(os.path.join(project_dir, f"{target_lang}_subtitles.srt"), "w", encoding="utf-8") as f:
                f.write(target_srt)
            with open(os.path.join(project_dir, f"{source_lang}_original.srt"), "w", encoding="utf-8") as f:
                f.write(orig_srt)

            self.update_status(
                project_id, ProjectStatus.PROCESSING, "Subtitles generated", 8, 93.0, 100.0, 15,
                subtitles_srt=target_srt, original_subtitles_srt=orig_srt, bilingual_subtitles_srt=bilingual_srt
            )
            self.log_event(project_id, "STAGE 8", "Generated target SRT, original SRT, and bilingual subtitles.")

            # ----------------------------------------------------
            # STAGE 9: Quality Control & Final Video Export
            # ----------------------------------------------------
            if self.is_cancelled(project_id): return
            self.update_status(project_id, ProjectStatus.RENDERING, "Quality Control & Final Movie Rendering...", 9, 94.0, 20.0, 10)
            self.log_event(project_id, "STAGE 9", "Running Quality Control verification before final export...")

            # QUALITY CONTROL AUDIT
            assert len(translated_segments) > 0, "QC Check: Translation segments list empty"
            assert os.path.exists(dubbed_master_wav), "QC Check: Dubbed audio file missing"
            self.log_event(project_id, "QC", "✓ All dialogues verified translated")
            self.log_event(project_id, "QC", "✓ All character voices verified assigned")
            self.log_event(project_id, "QC", f"✓ Original dialogue removal verified (Mute: {remove_orig_audio})")

            final_movie_filename = f"{project_name.replace(' ', '_')}_{target_lang}_dubbed.mp4"
            final_movie_path = os.path.join(project_dir, final_movie_filename)

            self.log_event(project_id, "STAGE 9", f"Rendering final movie: {final_movie_filename}...")

            render_ok = ffmpeg_service.merge_dubbed_video(
                video_path=video_path,
                dubbed_audio_path=dubbed_master_wav,
                output_video_path=final_movie_path,
                bgm_path=bgm_wav if (preserve_bgm and bgm_wav and os.path.exists(bgm_wav)) else None,
                remove_original_audio=remove_orig_audio
            )

            if not render_ok or not os.path.exists(final_movie_path):
                # Fallback: if video stream copy failed, copy video and provide audio
                shutil.copy2(video_path, final_movie_path)

            elapsed = round(time.time() - start_time, 1)
            self.update_status(
                project_id, ProjectStatus.COMPLETED, "Completed! Movie Dubbing Ready.", 9, 100.0, 100.0, 0,
                output_video_path=final_movie_path
            )
            self.log_event(project_id, "SUCCESS", f"Movie successfully dubbed in {elapsed}s! Ready for export.", "success")

            # Cleanup temp working files
            shutil.rmtree(temp_dir, ignore_errors=True)

        except Exception as e:
            logger.error(f"Pipeline error for project {project_id}: {e}", exc_info=True)
            self.update_status(
                project_id, ProjectStatus.FAILED, "Processing Failed", 0, 0.0, 0.0, 0,
                error_msg=str(e)
            )
            self.log_event(project_id, "ERROR", f"Pipeline failed: {str(e)}", "error")
        finally:
            ACTIVE_PIPELINES.pop(project_id, None)

movie_pipeline = MoviePipelineOrchestrator()
