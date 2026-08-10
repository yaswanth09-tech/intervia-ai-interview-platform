"""
Speech-to-text service using Faster-Whisper.

The model is loaded once (lazily, on first use) and kept in memory - loading
it per-request would make every voice answer painfully slow. For local dev,
"base" + int8 on CPU is a reasonable balance of speed/accuracy. Swap to a
GPU-backed instance with a larger model (e.g. "small" or "medium") in
production if accuracy needs improving.

Latency tuning notes (why transcription was slow):
- `language` is pinned to English below. Without it, faster-whisper runs a
  separate language-detection pass over the audio before every transcription,
  which adds real overhead on every single call - worst on short clips.
  If interview answers may come in other languages, remove this and accept
  the extra latency, or detect+cache the language once per session instead.
- `beam_size` dropped from 5 to 1 (greedy decoding). Beam search explores
  multiple candidate paths per step and is roughly beam_size times slower;
  for clear, single-speaker interview answers the accuracy gain from beam
  search is marginal, so this trades a small amount of accuracy for a large
  speed win. Bump it back up (e.g. 3-5) if transcription quality suffers.
- `cpu_threads` is pinned to the machine's core count. CTranslate2 doesn't
  always use all available cores by default, so on multi-core machines this
  can meaningfully speed up CPU inference.

Note: VAD (voice-activity) filtering was deliberately left off. It skips
segments it judges to be silence, which speeds things up, but its speech
threshold can misjudge quieter mics/soft speech as silence entirely,
producing an empty transcript for a real answer. That failure mode is worse
than the time it saves, so it's not used here.
"""

import os

from faster_whisper import WhisperModel

_model: WhisperModel | None = None


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel(
            "base",
            device="cpu",
            compute_type="int8",
            cpu_threads=os.cpu_count() or 4,
        )
    return _model


def transcribe_audio(file_path: str) -> str:
    """Transcribe an audio file on disk and return the full text."""
    model = get_model()
    segments, _info = model.transcribe(
        file_path,
        beam_size=1,
        language="en",
    )
    return " ".join(segment.text.strip() for segment in segments).strip()