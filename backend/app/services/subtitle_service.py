import os
import re
from typing import List, Dict, Any, Optional
from pathlib import Path

class SubtitleService:
    @staticmethod
    def format_timestamp_srt(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int(round((seconds - int(seconds)) * 1000))
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    @staticmethod
    def format_timestamp_vtt(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int(round((seconds - int(seconds)) * 1000))
        return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"

    def generate_srt(self, segments: List[Dict[str, Any]], text_key: str = "translated_text") -> str:
        """Generate standard SRT string from segments."""
        lines = []
        counter = 1
        for seg in segments:
            text = seg.get(text_key) or seg.get("translated_text") or seg.get("original_text") or seg.get("text", "")
            text = text.strip()
            if not text:
                continue

            st = self.format_timestamp_srt(seg["start"])
            en = self.format_timestamp_srt(seg["end"])

            lines.append(str(counter))
            lines.append(f"{st} --> {en}")
            lines.append(text)
            lines.append("") # Blank line separator
            counter += 1

        return "\n".join(lines)

    def generate_bilingual_srt(self, segments: List[Dict[str, Any]]) -> str:
        """Generate dual language SRT: Dubbed language on top, original on bottom."""
        lines = []
        counter = 1
        for seg in segments:
            trans = seg.get("translated_text", "").strip()
            orig = seg.get("original_text") or seg.get("text", "")
            orig = orig.strip()

            if not trans and not orig:
                continue

            st = self.format_timestamp_srt(seg["start"])
            en = self.format_timestamp_srt(seg["end"])

            lines.append(str(counter))
            lines.append(f"{st} --> {en}")
            if trans and orig and trans != orig:
                lines.append(f"{trans}\n({orig})")
            else:
                lines.append(trans or orig)
            lines.append("")
            counter += 1

        return "\n".join(lines)

    def generate_vtt(self, segments: List[Dict[str, Any]], text_key: str = "translated_text") -> str:
        """Generate WebVTT string for direct in-browser HTML5 video player integration."""
        lines = ["WEBVTT", ""]
        counter = 1
        for seg in segments:
            text = seg.get(text_key) or seg.get("translated_text") or seg.get("original_text") or seg.get("text", "")
            text = text.strip()
            if not text:
                continue

            st = self.format_timestamp_vtt(seg["start"])
            en = self.format_timestamp_vtt(seg["end"])

            lines.append(str(counter))
            lines.append(f"{st} --> {en}")
            lines.append(text)
            lines.append("")
            counter += 1

        return "\n".join(lines)

    def parse_srt(self, srt_content: str) -> List[Dict[str, Any]]:
        """Parses an SRT file back into segment objects."""
        blocks = re.split(r'\n\s*\n', srt_content.strip())
        segments = []

        for b in blocks:
            lines = [l.strip() for l in b.split('\n') if l.strip()]
            if len(lines) >= 3:
                time_match = re.search(r'(\d+:\d+:\d+,\d+)\s*-->\s*(\d+:\d+:\d+,\d+)', lines[1])
                if time_match:
                    st_str, en_str = time_match.groups()
                    st = self._parse_srt_time(st_str)
                    en = self._parse_srt_time(en_str)
                    text = " ".join(lines[2:])
                    segments.append({
                        "id": len(segments),
                        "start": st,
                        "end": en,
                        "translated_text": text
                    })
        return segments

    def _parse_srt_time(self, t_str: str) -> float:
        parts = t_str.replace(',', ':').split(':')
        h, m, s, ms = map(int, parts)
        return h * 3600 + m * 60 + s + ms / 1000.0

subtitle_service = SubtitleService()
