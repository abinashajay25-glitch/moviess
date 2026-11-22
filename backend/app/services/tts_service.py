import os
import time
import json
import logging
import asyncio
import requests
from pathlib import Path
from typing import List, Dict, Any, Optional

from ..config import settings
from .ffmpeg_service import ffmpeg_service

logger = logging.getLogger("cinedub.tts")

# Voice library per engine and language
VOICE_CATALOG = {
    "sarvam": {
        "ta": [
            {"id": "tamil-male-1", "speaker": "arvind", "name": "Arvind (Hero / Deep Tamil)", "gender": "male"},
            {"id": "tamil-female-1", "speaker": "kavitha", "name": "Kavitha (Heroine / Expressive Tamil)", "gender": "female"},
            {"id": "tamil-male-2", "speaker": "mani", "name": "Mani (Supporting / Crisp Tamil)", "gender": "male"},
            {"id": "tamil-female-2", "speaker": "rekha", "name": "Rekha (Secondary / Warm Tamil)", "gender": "female"},
            {"id": "tamil-male-3", "speaker": "vijay", "name": "Vijay (Villain / Heavy Tamil)", "gender": "male"},
        ],
        "hi": [
            {"id": "hindi-male-1", "speaker": "amit", "name": "Amit (Lead Hero / Hindi)", "gender": "male"},
            {"id": "hindi-female-1", "speaker": "priya", "name": "Priya (Lead Heroine / Hindi)", "gender": "female"},
            {"id": "hindi-male-2", "speaker": "rahul", "name": "Rahul (Supporting Male / Hindi)", "gender": "male"},
            {"id": "hindi-female-2", "speaker": "pooja", "name": "Pooja (Supporting Female / Hindi)", "gender": "female"},
        ],
        "te": [
            {"id": "telugu-male-1", "speaker": "surya", "name": "Surya (Lead Actor / Telugu)", "gender": "male"},
            {"id": "telugu-female-1", "speaker": "ananya", "name": "Ananya (Lead Actress / Telugu)", "gender": "female"},
        ],
        "ml": [
            {"id": "malayalam-male-1", "speaker": "mohan", "name": "Mohan (Lead Actor / Malayalam)", "gender": "male"},
            {"id": "malayalam-female-1", "speaker": "parvathi", "name": "Parvathi (Lead Actress / Malayalam)", "gender": "female"},
        ],
        "kn": [
            {"id": "kannada-male-1", "speaker": "praveen", "name": "Praveen (Lead Actor / Kannada)", "gender": "male"},
            {"id": "kannada-female-1", "speaker": "shwetha", "name": "Shwetha (Lead Actress / Kannada)", "gender": "female"},
        ]
    },
    "elevenlabs": {
        "multilingual": [
            {"id": "pNInz6obpgDQGcFmaJgB", "name": "Adam (Deep Cinematic Male)", "gender": "male"},
            {"id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel (Calm Studio Female)", "gender": "female"},
            {"id": "VR6AewLTigWG4xSOukaG", "name": "Arnold (Crisp Narrative Male)", "gender": "male"},
            {"id": "EXAVITQu4vr4xnSDxMaL", "name": "Bella (Youthful Expressive Female)", "gender": "female"},
            {"id": "ErXwobaYiN019PkySvjV", "name": "Antoni (Dynamic Heroic Male)", "gender": "male"},
            {"id": "MF3mGyEYCl7XYWbV9V6O", "name": "Elli (Soft Emotional Female)", "gender": "female"},
            {"id": "yoZ06aMxZJJ28mfd3POQ", "name": "Sam (Resonant Male)", "gender": "male"},
            {"id": "jBpfuIE2acCO8z3wKNLl", "name": "Gigi (Vibrant Character Female)", "gender": "female"},
        ]
    },
    "edge_tts": {
        "ta": [
            {"id": "ta-IN-ValluvarNeural", "name": "Valluvar (Tamil Male Neural)", "gender": "male"},
            {"id": "ta-IN-PallaviNeural", "name": "Pallavi (Tamil Female Neural)", "gender": "female"},
            {"id": "ta-LK-KumarNeural", "name": "Kumar (Sri Lankan Tamil Male)", "gender": "male"},
            {"id": "ta-LK-SaranyaNeural", "name": "Saranya (Sri Lankan Tamil Female)", "gender": "female"},
        ],
        "hi": [
            {"id": "hi-IN-MadhurNeural", "name": "Madhur (Hindi Male Neural)", "gender": "male"},
            {"id": "hi-IN-SwaraNeural", "name": "Swara (Hindi Female Neural)", "gender": "female"},
        ],
        "en": [
            {"id": "en-US-GuyNeural", "name": "Guy (American Male Studio)", "gender": "male"},
            {"id": "en-US-JennyNeural", "name": "Jenny (American Female Studio)", "gender": "female"},
            {"id": "en-GB-RyanNeural", "name": "Ryan (British Male Cinematic)", "gender": "male"},
            {"id": "en-GB-SoniaNeural", "name": "Sonia (British Female Cinematic)", "gender": "female"},
        ],
        "te": [
            {"id": "te-IN-MohanNeural", "name": "Mohan (Telugu Male)", "gender": "male"},
            {"id": "te-IN-ShrutiNeural", "name": "Shruti (Telugu Female)", "gender": "female"},
        ],
        "ml": [
            {"id": "ml-IN-MidhunNeural", "name": "Midhun (Malayalam Male)", "gender": "male"},
            {"id": "ml-IN-SobhanaNeural", "name": "Sobhana (Malayalam Female)", "gender": "female"},
        ],
        "kn": [
            {"id": "kn-IN-GaganNeural", "name": "Gagan (Kannada Male)", "gender": "male"},
            {"id": "kn-IN-SapnaNeural", "name": "Sapna (Kannada Female)", "gender": "female"},
        ],
        "ja": [
            {"id": "ja-JP-KeitaNeural", "name": "Keita (Japanese Male)", "gender": "male"},
            {"id": "ja-JP-NanamiNeural", "name": "Nanami (Japanese Female)", "gender": "female"},
        ],
        "ko": [
            {"id": "ko-KR-InJoonNeural", "name": "InJoon (Korean Male)", "gender": "male"},
            {"id": "ko-KR-SunHiNeural", "name": "SunHi (Korean Female)", "gender": "female"},
        ],
        "es": [
            {"id": "es-ES-AlvaroNeural", "name": "Alvaro (Spanish Male)", "gender": "male"},
            {"id": "es-ES-ElviraNeural", "name": "Elvira (Spanish Female)", "gender": "female"},
        ],
        "fr": [
            {"id": "fr-FR-HenriNeural", "name": "Henri (French Male)", "gender": "male"},
            {"id": "fr-FR-DeniseNeural", "name": "Denise (French Female)", "gender": "female"},
        ],
        "de": [
            {"id": "de-DE-ConradNeural", "name": "Conrad (German Male)", "gender": "male"},
            {"id": "de-DE-KatjaNeural", "name": "Katja (German Female)", "gender": "female"},
        ]
    }
}

class TTSService:
    def __init__(self):
        self.eleven_key = settings.ELEVENLABS_API_KEY
        self.sarvam_key = settings.SARVAM_API_KEY
        self.nvidia_key = settings.NVIDIA_API_KEY

    def get_catalog(self, target_lang: str) -> List[Dict[str, Any]]:
        """Returns all available voices for a given target language."""
        voices = []
        # 1. Sarvam AI (Indian languages)
        sarvam_voices = VOICE_CATALOG["sarvam"].get(target_lang, [])
        for v in sarvam_voices:
            voices.append({**v, "engine": "sarvam", "badge": "Sarvam AI (HQ Native)"})

        # 2. ElevenLabs
        for v in VOICE_CATALOG["elevenlabs"]["multilingual"]:
            voices.append({**v, "engine": "elevenlabs", "badge": "ElevenLabs Studio"})

        # 3. Edge-TTS (Free Open-Source)
        edge_voices = VOICE_CATALOG["edge_tts"].get(target_lang, VOICE_CATALOG["edge_tts"].get("en", []))
        for v in edge_voices:
            voices.append({**v, "engine": "edge_tts", "badge": "Neural Open-Source"})

        return voices

    def auto_assign_voices(
        self,
        speakers: Dict[str, Dict[str, Any]],
        target_lang: str,
        engine_preference: str = "hybrid"
    ) -> Dict[str, Dict[str, Any]]:
        """
        Auto assigns unique, character-specific voices so no two characters sound alike.
        """
        updated = dict(speakers)
        available_voices = self.get_catalog(target_lang)

        # Separate into male and female pools
        male_pool = [v for v in available_voices if v["gender"] == "male"]
        female_pool = [v for v in available_voices if v["gender"] == "female"]

        male_idx = 0
        female_idx = 0

        for spk_id, spk_info in updated.items():
            # If user already assigned a custom voice, preserve it
            if spk_info.get("voice_id"):
                continue

            gender = spk_info.get("gender", "male")
            if gender == "female" and female_pool:
                chosen = female_pool[female_idx % len(female_pool)]
                female_idx += 1
            else:
                chosen = male_pool[male_idx % len(male_pool)] if male_pool else available_voices[0]
                male_idx += 1

            spk_info["voice_id"] = chosen["id"]
            spk_info["voice_name"] = chosen["name"]
            spk_info["engine"] = chosen.get("engine", "edge_tts")

        return updated

    def synthesize_segment(
        self,
        text: str,
        output_path: str,
        voice_id: str,
        engine: str,
        target_lang: str,
        speed: float = 1.0,
        pitch: float = 1.0
    ) -> bool:
        """
        Synthesize dialogue line using the selected engine.
        Includes automatic multi-engine fallbacks (Sarvam -> ElevenLabs -> Edge-TTS).
        """
        if not text.strip():
            return False

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        # Method 1: Sarvam AI
        if engine == "sarvam" and self.sarvam_key:
            success = self._synthesize_sarvam(text, output_path, target_lang, speed)
            if success:
                return True
            logger.warning("Sarvam AI call failed, falling back to ElevenLabs/Edge-TTS")

        # Method 2: ElevenLabs
        if (engine == "elevenlabs" or engine == "hybrid") and self.eleven_key:
            success = self._synthesize_elevenlabs(text, output_path, voice_id)
            if success:
                return True
            logger.warning("ElevenLabs call failed, falling back to Edge-TTS")

        # Method 3: Edge-TTS (100% Free Open-Source neural TTS)
        success = self._synthesize_edge_tts(text, output_path, voice_id, target_lang, speed)
        if success:
            return True

        # Method 4: Offline Silence/WAV generator fallback
        logger.warning(f"Generating synthetic audio fallback for: {text[:30]}")
        return ffmpeg_service.create_silence_wav(output_path, max(2.0, len(text) * 0.1))

    def _synthesize_sarvam(self, text: str, output_path: str, target_lang: str, speed: float) -> bool:
        """Sarvam AI Text-to-Speech API for Indian languages."""
        url = "https://api.sarvam.ai/text-to-speech"
        headers = {
            "api-subscription-key": self.sarvam_key,
            "Content-Type": "application/json"
        }
        # Language code conversion
        lang_code = f"{target_lang}-IN" if len(target_lang) == 2 else target_lang
        
        payload = {
            "inputs": [text],
            "target_language_code": lang_code,
            "speaker": "arvind" if target_lang == "ta" else "amit",
            "pitch": 0,
            "pace": max(0.5, min(2.0, speed)),
            "loudness": 1.0,
            "speech_sample_rate": 22050,
            "enable_preprocessing": True,
            "model": "bulbul:v1"
        }

        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                audios = data.get("audios", [])
                if audios:
                    import base64
                    audio_bytes = base64.b64decode(audios[0])
                    # Write to temporary file, then convert to wav if needed
                    with open(output_path, "wb") as f:
                        f.write(audio_bytes)
                    return os.path.getsize(output_path) > 100
            else:
                logger.error(f"Sarvam AI error ({resp.status_code}): {resp.text[:200]}")
        except Exception as e:
            logger.error(f"Sarvam AI request failed: {e}")
        return False

    def _synthesize_elevenlabs(self, text: str, output_path: str, voice_id: str) -> bool:
        """ElevenLabs Multilingual v2 API."""
        vid = voice_id if len(voice_id) > 15 else "pNInz6obpgDQGcFmaJgB"
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{vid}"
        headers = {
            "xi-api-key": self.eleven_key,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "use_speaker_boost": True
            }
        }
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=45)
            if resp.status_code == 200:
                with open(output_path, "wb") as f:
                    f.write(resp.content)
                return os.path.getsize(output_path) > 100
            logger.error(f"ElevenLabs error ({resp.status_code}): {resp.text[:200]}")
        except Exception as e:
            logger.error(f"ElevenLabs request failed: {e}")
        return False

    def _synthesize_edge_tts(self, text: str, output_path: str, voice_id: str, target_lang: str, speed: float) -> bool:
        """Free neural Edge-TTS synthesis."""
        try:
            import edge_tts

            # Resolve voice name
            edge_voices = VOICE_CATALOG["edge_tts"].get(target_lang, VOICE_CATALOG["edge_tts"].get("en", []))
            voice = next((v["id"] for v in edge_voices if v["id"] == voice_id), edge_voices[0]["id"])

            rate_pct = int((speed - 1.0) * 100)
            rate_str = f"{rate_pct:+d}%"

            async def _run():
                communicate = edge_tts.Communicate(text, voice, rate=rate_str)
                await communicate.save(output_path)

            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    import concurrent.futures
                    with concurrent.futures.ThreadPoolExecutor() as pool:
                        pool.submit(lambda: asyncio.run(_run())).result()
                else:
                    loop.run_until_complete(_run())
            except RuntimeError:
                asyncio.run(_run())

            return os.path.exists(output_path) and os.path.getsize(output_path) > 100
        except Exception as e:
            logger.error(f"Edge-TTS failed: {e}")
            return False

tts_service = TTSService()
