import os
import unittest
from app.database import init_db, SessionLocal
from app.models import Project, ProjectStatus
from app.services.subtitle_service import subtitle_service
from app.services.translation_service import translation_service
from app.services.tts_service import tts_service
from app.services.ffmpeg_service import ffmpeg_service

class TestCineDubBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def test_database_project_lifecycle(self):
        db = SessionLocal()
        p = Project(
            name="Test Movie",
            source_language="en",
            target_language="ta",
            status=ProjectStatus.DRAFT
        )
        db.add(p)
        db.commit()
        db.refresh(p)
        self.assertIsNotNone(p.id)
        self.assertEqual(p.name, "Test Movie")
        p_dict = p.to_dict()
        self.assertEqual(p_dict["target_language"], "ta")
        db.delete(p)
        db.commit()
        db.close()

    def test_subtitle_formatting(self):
        segments = [
            {"id": 0, "start": 1.25, "end": 4.50, "original_text": "Hello world", "translated_text": "வணக்கம் உலகம்"}
        ]
        srt = subtitle_service.generate_srt(segments, text_key="translated_text")
        self.assertIn("00:00:01,250 --> 00:00:04,500", srt)
        self.assertIn("வணக்கம் உலகம்", srt)

    def test_voice_catalog(self):
        ta_voices = tts_service.get_catalog("ta")
        self.assertTrue(len(ta_voices) > 0)
        # Check male and female voices exist
        genders = {v["gender"] for v in ta_voices}
        self.assertIn("male", genders)
        self.assertIn("female", genders)

    def test_silence_wav_generation(self):
        temp_wav = "test_silence.wav"
        ok = ffmpeg_service.create_silence_wav(temp_wav, duration_sec=1.0)
        self.assertTrue(ok)
        self.assertTrue(os.path.exists(temp_wav))
        if os.path.exists(temp_wav):
            os.remove(temp_wav)

if __name__ == "__main__":
    unittest.main()
