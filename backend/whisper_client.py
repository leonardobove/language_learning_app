import io
import tempfile
import os
import logging
from backend.config import WHISPER_MODEL

logger = logging.getLogger(__name__)

_whisper_model = None


def load_whisper():
    """Load the Whisper model once at startup."""
    global _whisper_model
    if _whisper_model is not None:
        return _whisper_model

    try:
        import whisper
        logger.info(f"Loading Whisper model: {WHISPER_MODEL}")
        _whisper_model = whisper.load_model(WHISPER_MODEL)
        logger.info("Whisper model loaded successfully.")
    except ImportError:
        logger.warning("openai-whisper not installed. STT will be unavailable.")
        _whisper_model = None
    except Exception as e:
        logger.error(f"Failed to load Whisper model: {e}")
        _whisper_model = None

    return _whisper_model


def transcribe_audio(audio_bytes: bytes, language_hint: str | None = None) -> str:
    """
    Transcribe raw audio bytes using Whisper.
    Returns the transcribed text string.
    """
    model = load_whisper()
    if model is None:
        raise RuntimeError(
            "Whisper model is not available. Install openai-whisper to enable transcription."
        )

    # Write to a temp file because Whisper needs a file path
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        options = {}
        if language_hint:
            # Map full language name to Whisper language code
            lang_map = {
                "Spanish": "es",
                "French": "fr",
                "German": "de",
                "Dutch": "nl",
                "English": "en",
            }
            options["language"] = lang_map.get(language_hint, None)

        result = model.transcribe(tmp_path, **options)
        return result["text"].strip()
    finally:
        os.unlink(tmp_path)
