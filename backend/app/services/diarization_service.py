import os
import wave
import logging
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from sklearn.cluster import AgglomerativeClustering, KMeans

logger = logging.getLogger("cinedub.diarization")

# Character palette for UI tags
SPEAKER_PALETTE = [
    {"color": "#8b5cf6", "tag": "Hero / Lead Male", "gender": "male", "name": "Lead Actor (Speaker 1)"},
    {"color": "#ec4899", "tag": "Heroine / Lead Female", "gender": "female", "name": "Lead Actress (Speaker 2)"},
    {"color": "#38bdf8", "tag": "Supporting Male", "gender": "male", "name": "Supporting Male (Speaker 3)"},
    {"color": "#34d399", "tag": "Supporting Female", "gender": "female", "name": "Supporting Female (Speaker 4)"},
    {"color": "#f59e0b", "tag": "Antagonist / Character", "gender": "male", "name": "Antagonist (Speaker 5)"},
    {"color": "#a855f7", "tag": "Narrator / Secondary", "gender": "female", "name": "Secondary (Speaker 6)"},
    {"color": "#06b6d4", "tag": "Cameo / Extra", "gender": "male", "name": "Character 7"},
    {"color": "#f43f5e", "tag": "Cameo / Extra", "gender": "female", "name": "Character 8"},
]

class DiarizationService:
    def __init__(self, hf_token: Optional[str] = None, device: str = "cpu"):
        self.hf_token = hf_token
        self.device = device
        self._pipeline = None

    def _init_pyannote(self):
        if self._pipeline is not None or not self.hf_token:
            return
        try:
            from pyannote.audio import Pipeline
            self._pipeline = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                use_auth_token=self.hf_token
            )
            if self.device == "cuda":
                import torch
                self._pipeline.to(torch.device("cuda"))
            logger.info("Initialized pyannote speaker diarization")
        except Exception as e:
            logger.warning(f"pyannote not available ({e}), using acoustic clustering")

    def diarize_and_assign(
        self,
        audio_path: str,
        transcript_segments: List[Dict[str, Any]],
        voice_preference: str = "mixed", # male, female, mixed
        target_language: str = "ta"
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Diarize speakers and map them to transcript segments.
        Returns:
            (updated_transcript_segments, speakers_metadata_dict)
        """
        if not transcript_segments:
            return [], {}

        self._init_pyannote()

        # If pyannote is loaded, use it
        diarized_turns = []
        if self._pipeline is not None:
            try:
                diarization = self._pipeline(audio_path)
                for turn, _, speaker in diarization.itertracks(yield_label=True):
                    diarized_turns.append({
                        "start": turn.start,
                        "end": turn.end,
                        "speaker": speaker
                    })
            except Exception as e:
                logger.error(f"Pyannote diarization run failed: {e}")

        # If pyannote didn't run or found nothing, run acoustic clustering
        if not diarized_turns:
            diarized_turns = self._acoustic_clustering(audio_path, transcript_segments)

        # Map turns to transcript segments based on maximum time overlap
        updated_segments = []
        speaker_dialogue_counts = {}

        for seg in transcript_segments:
            s_start, s_end = seg["start"], seg["end"]
            best_speaker = "SPEAKER_00"
            max_overlap = 0.0

            for turn in diarized_turns:
                overlap_st = max(s_start, turn["start"])
                overlap_en = min(s_end, turn["end"])
                overlap = max(0.0, overlap_en - overlap_st)
                if overlap > max_overlap:
                    max_overlap = overlap
                    best_speaker = turn["speaker"]

            seg_copy = dict(seg)
            seg_copy["speaker_id"] = best_speaker
            updated_segments.append(seg_copy)
            speaker_dialogue_counts[best_speaker] = speaker_dialogue_counts.get(best_speaker, 0) + 1

        # Sort speakers by activity (Speaker 01 is lead, etc.)
        sorted_speakers = sorted(speaker_dialogue_counts.keys(), key=lambda k: speaker_dialogue_counts[k], reverse=True)
        
        # Build comprehensive character roster
        speakers_dict = {}
        for idx, spk_id in enumerate(sorted_speakers):
            preset = SPEAKER_PALETTE[idx % len(SPEAKER_PALETTE)]
            
            # Determine gender based on voice preference or alternate
            if voice_preference == "male":
                gender = "male"
            elif voice_preference == "female":
                gender = "female"
            else:
                gender = preset["gender"]

            speakers_dict[spk_id] = {
                "id": spk_id,
                "name": preset["name"],
                "role": preset["tag"],
                "gender": gender,
                "color": preset["color"],
                "dialogue_count": speaker_dialogue_counts[spk_id],
                "voice_id": None, # Will be set by TTS service
                "voice_name": None,
                "engine": "hybrid",
                "pitch": 1.0,
                "speed": 1.0,
                "volume": 1.0
            }

        logger.info(f"Diarization identified {len(speakers_dict)} distinct characters across {len(updated_segments)} dialogues")
        return updated_segments, speakers_dict

    def _acoustic_clustering(
        self,
        audio_path: str,
        transcript_segments: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        High accuracy open-source acoustic feature clustering using:
        - Spectral Centroid (pitch brightness / vocal formant proxy)
        - Zero Crossing Rate (fricative / breathiness)
        - Energy RMS (vocal power)
        Assigns stable clusters (2 to 5 characters).
        """
        try:
            with wave.open(audio_path, "rb") as wf:
                sr = wf.getframerate()
                n_frames = wf.getnframes()
                raw_bytes = wf.readframes(n_frames)
                signal = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32)

            # Extract feature vectors for each segment
            features = []
            valid_indices = []

            for idx, seg in enumerate(transcript_segments):
                st_sample = int(seg["start"] * sr)
                en_sample = min(int(seg["end"] * sr), len(signal))
                chunk = signal[st_sample:en_sample]

                if len(chunk) < int(sr * 0.2): # Too short (<200ms)
                    features.append([0.0, 0.0, 0.0])
                    continue

                # 1. Root Mean Square (Energy)
                rms = np.sqrt(np.mean(chunk ** 2)) + 1e-6
                
                # 2. Zero Crossing Rate
                zcr = np.mean(np.abs(np.diff(np.sign(chunk)))) / 2.0

                # 3. Spectral Centroid
                fft_vals = np.abs(np.fft.rfft(chunk))
                freqs = np.fft.rfftfreq(len(chunk), 1.0 / sr)
                sum_fft = np.sum(fft_vals) + 1e-6
                centroid = np.sum(freqs * fft_vals) / sum_fft

                features.append([np.log1p(rms), zcr, centroid / 1000.0])
                valid_indices.append(idx)

            X = np.array(features)
            
            # Determine reasonable cluster count based on number of dialogues (2 to 5 characters)
            n_segments = len(transcript_segments)
            n_clusters = 2
            if n_segments >= 15:
                n_clusters = 4
            elif n_segments >= 6:
                n_clusters = 3
            elif n_segments <= 2:
                n_clusters = min(n_segments, 2)

            if len(valid_indices) >= n_clusters:
                # Normalize features
                means = np.mean(X, axis=0)
                stds = np.std(X, axis=0) + 1e-6
                X_norm = (X - means) / stds

                clusterer = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
                labels = clusterer.fit_predict(X_norm)
            else:
                labels = [i % n_clusters for i in range(len(transcript_segments))]

            # Build turns
            turns = []
            for i, seg in enumerate(transcript_segments):
                cluster_id = labels[i]
                turns.append({
                    "start": seg["start"],
                    "end": seg["end"],
                    "speaker": f"SPEAKER_{cluster_id:02d}"
                })
            return turns

        except Exception as e:
            logger.warning(f"Acoustic clustering error: {e}. Falling back to alternating casting.")
            turns = []
            for i, seg in enumerate(transcript_segments):
                turns.append({
                    "start": seg["start"],
                    "end": seg["end"],
                    "speaker": f"SPEAKER_{i % 3:02d}"
                })
            return turns

diarization_service = DiarizationService()
