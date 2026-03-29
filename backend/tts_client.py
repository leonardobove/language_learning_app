import io
import logging
import tempfile
import os
from backend.config import TTS_ENGINE, PIPER_MODEL_PATH

logger = logging.getLogger(__name__)

_kokoro_pipeline = None
_kokoro_available = None


LANGUAGE_VOICE_MAP = {
    "Spanish": "es",
    "French": "fr",
    "German": "de",
    "Dutch": "nl",
    "English": "en-us",
}

KOKORO_VOICE_MAP = {
    "Spanish": "es",
    "French": "fr",
    "German": "de",
    "Dutch": "nl",
    "English": "en-us",
}


def _try_load_kokoro():
    global _kokoro_pipeline, _kokoro_available
    if _kokoro_available is not None:
        return _kokoro_available

    try:
        from kokoro import KPipeline
        _kokoro_pipeline = KPipeline(lang_code="en-us")
        _kokoro_available = True
        logger.info("Kokoro TTS loaded successfully.")
    except Exception as e:
        logger.warning(f"Kokoro TTS not available: {e}. Will fall back to pyttsx3.")
        _kokoro_available = False

    return _kokoro_available


def synthesize_speech(text: str, language: str = "English") -> bytes:
    """
    Convert text to speech and return raw audio bytes (WAV).
    Tries Kokoro first, then falls back to pyttsx3.
    """
    if TTS_ENGINE == "kokoro" or TTS_ENGINE == "auto":
        if _try_load_kokoro():
            return _synthesize_kokoro(text, language)

    if TTS_ENGINE == "piper":
        return _synthesize_piper(text, language)

    # Fallback: pyttsx3
    return _synthesize_pyttsx3(text)


def _synthesize_kokoro(text: str, language: str) -> bytes:
    from kokoro import KPipeline
    import soundfile as sf
    import numpy as np

    global _kokoro_pipeline

    lang_code = KOKORO_VOICE_MAP.get(language, "en-us")

    # Re-init pipeline for the right language if needed
    pipeline = KPipeline(lang_code=lang_code)

    audio_chunks = []
    for _, _, audio in pipeline(text):
        audio_chunks.append(audio)

    if not audio_chunks:
        return b""

    combined = np.concatenate(audio_chunks)

    buf = io.BytesIO()
    sf.write(buf, combined, samplerate=24000, format="WAV")
    buf.seek(0)
    return buf.read()


def _synthesize_piper(text: str, language: str) -> bytes:
    import subprocess

    if not os.path.exists(PIPER_MODEL_PATH):
        logger.error(f"Piper model not found at {PIPER_MODEL_PATH}")
        return _synthesize_pyttsx3(text)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as out_file:
        out_path = out_file.name

    try:
        result = subprocess.run(
            ["piper", "--model", PIPER_MODEL_PATH, "--output_file", out_path],
            input=text.encode("utf-8"),
            capture_output=True,
            timeout=30,
        )
        if result.returncode != 0:
            raise RuntimeError(f"Piper failed: {result.stderr.decode()}")

        with open(out_path, "rb") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Piper TTS failed: {e}")
        return _synthesize_pyttsx3(text)
    finally:
        if os.path.exists(out_path):
            os.unlink(out_path)


def _synthesize_pyttsx3(text: str) -> bytes:
    try:
        import pyttsx3
        import wave

        engine = pyttsx3.init()
        engine.setProperty("rate", 160)

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            out_path = f.name

        try:
            engine.save_to_file(text, out_path)
            engine.runAndWait()

            with open(out_path, "rb") as f:
                return f.read()
        finally:
            engine.stop()
            if os.path.exists(out_path):
                os.unlink(out_path)

    except Exception as e:
        logger.error(f"pyttsx3 TTS failed: {e}")
        # Return minimal silent WAV if everything fails
        return _generate_silent_wav()


def _generate_silent_wav(duration_ms: int = 500, sample_rate: int = 22050) -> bytes:
    """Generate a short silent WAV file as last-resort fallback."""
    import struct
    import math

    num_samples = int(sample_rate * duration_ms / 1000)
    buf = io.BytesIO()

    # WAV header
    data_size = num_samples * 2  # 16-bit samples
    buf.write(b"RIFF")
    buf.write(struct.pack("<I", 36 + data_size))
    buf.write(b"WAVE")
    buf.write(b"fmt ")
    buf.write(struct.pack("<IHHIIHH", 16, 1, 1, sample_rate, sample_rate * 2, 2, 16))
    buf.write(b"data")
    buf.write(struct.pack("<I", data_size))
    buf.write(b"\x00" * data_size)

    buf.seek(0)
    return buf.read()
