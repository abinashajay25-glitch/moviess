import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("cinedub.translation")

# ISO Language codes mapping for NLLB & deep-translator
LANGUAGE_MAP = {
    "ta": {"name": "Tamil", "nllb": "tam_Taml", "deep": "ta", "native": "தமிழ்"},
    "hi": {"name": "Hindi", "nllb": "hin_Deva", "deep": "hi", "native": "हिन्दी"},
    "en": {"name": "English", "nllb": "eng_Latn", "deep": "en", "native": "English"},
    "te": {"name": "Telugu", "nllb": "tel_Telu", "deep": "te", "native": "తెలుగు"},
    "ml": {"name": "Malayalam", "nllb": "mal_Mlym", "deep": "ml", "native": "മലയാളം"},
    "kn": {"name": "Kannada", "nllb": "kan_Knda", "deep": "kn", "native": "ಕನ್ನಡ"},
    "ja": {"name": "Japanese", "nllb": "jpn_Jpan", "deep": "ja", "native": "日本語"},
    "ko": {"name": "Korean", "nllb": "kor_Hang", "deep": "ko", "native": "한국어"},
    "zh": {"name": "Chinese", "nllb": "zho_Hans", "deep": "zh-CN", "native": "中文"},
    "es": {"name": "Spanish", "nllb": "spa_Latn", "deep": "es", "native": "Español"},
    "fr": {"name": "French", "nllb": "fra_Latn", "deep": "fr", "native": "Français"},
    "de": {"name": "German", "nllb": "deu_Latn", "deep": "de", "native": "Deutsch"},
}

class TranslationService:
    def __init__(self, model_name: str = "facebook/nllb-200-distilled-600M", device: str = "cpu"):
        self.model_name = model_name
        self.device = device
        self._nllb_model = None
        self._nllb_tokenizer = None
        self._has_nllb = False

    def _init_nllb(self):
        if self._nllb_model is not None:
            return
        try:
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
            import torch
            logger.info(f"Loading NLLB-200 model: {self.model_name}...")
            self._nllb_tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self._nllb_model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
            if self.device == "cuda" and torch.cuda.is_available():
                self._nllb_model.to("cuda")
            self._nllb_model.eval()
            self._has_nllb = True
            logger.info("NLLB-200 loaded successfully")
        except Exception as e:
            logger.warning(f"NLLB-200 local load unavailable ({e}), using deep-translator engine")
            self._has_nllb = False

    def translate_text(self, text: str, source_lang: str, target_lang: str) -> str:
        """Translate a single dialogue line while preserving emotion and punctuation."""
        text = text.strip()
        if not text:
            return ""
        if source_lang == target_lang:
            return text

        # Attempt 1: Deep-translator (instant, reliable, no multi-GB download)
        try:
            from deep_translator import GoogleTranslator
            src = LANGUAGE_MAP.get(source_lang, {}).get("deep", source_lang)
            tgt = LANGUAGE_MAP.get(target_lang, {}).get("deep", target_lang)
            translated = GoogleTranslator(source=src, target=tgt).translate(text)
            if translated:
                return translated.strip()
        except Exception as e:
            logger.debug(f"Deep-translator pass skipped: {e}")

        # Attempt 2: Local NLLB-200
        self._init_nllb()
        if self._has_nllb:
            try:
                src_code = LANGUAGE_MAP.get(source_lang, {}).get("nllb", "eng_Latn")
                tgt_code = LANGUAGE_MAP.get(target_lang, {}).get("nllb", "tam_Taml")
                self._nllb_tokenizer.src_lang = src_code
                inputs = self._nllb_tokenizer(text, return_tensors="pt", padding=True, truncation=True)
                if self.device == "cuda":
                    inputs = {k: v.to("cuda") for k, v in inputs.items()}
                
                target_lang_id = self._nllb_tokenizer.convert_tokens_to_ids(tgt_code)
                outputs = self._nllb_model.generate(
                    **inputs,
                    forced_bos_token_id=target_lang_id,
                    max_new_tokens=256,
                    num_beams=3
                )
                res = self._nllb_tokenizer.decode(outputs[0], skip_special_tokens=True)
                if res:
                    return res.strip()
            except Exception as e:
                logger.error(f"NLLB translation failed: {e}")

        # Fallback: Return original
        return text

    def translate_segments(
        self,
        transcript_segments: List[Dict[str, Any]],
        source_lang: str,
        target_lang: str,
        progress_callback=None
    ) -> List[Dict[str, Any]]:
        """
        Translates dialogues across all segments.
        Preserves timestamps and character IDs for synchronization.
        """
        translated_segments = []
        total = len(transcript_segments)

        for i, seg in enumerate(transcript_segments):
            orig_text = seg.get("text", "")
            translated = self.translate_text(orig_text, source_lang, target_lang)

            item = {
                "id": seg["id"],
                "start": seg["start"],
                "end": seg["end"],
                "original_text": orig_text,
                "translated_text": translated,
                "speaker_id": seg.get("speaker_id", "SPEAKER_00"),
                "audio_file": None,
                "confidence": seg.get("confidence", 1.0)
            }
            translated_segments.append(item)

            if progress_callback and total > 0:
                progress_callback(round(((i + 1) / total) * 100, 1))

        return translated_segments

translation_service = TranslationService()
