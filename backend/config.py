import os
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:12b")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
TTS_ENGINE = os.getenv("TTS_ENGINE", "kokoro")
PIPER_MODEL_PATH = os.getenv("PIPER_MODEL_PATH", "./models/piper/en_US-lessac-medium.onnx")
PORT = int(os.getenv("PORT", "8000"))
FRONTEND_PORT = int(os.getenv("FRONTEND_PORT", "5173"))
DB_PATH = os.getenv("DB_PATH", "./lingua.db")

SUPPORTED_LANGUAGES = ["Spanish", "French", "German", "Dutch"]

LANGUAGE_CODES = {
    "Spanish": "es",
    "French": "fr",
    "German": "de",
    "Dutch": "nl",
}

LEVELS = ["beginner", "intermediate", "advanced"]
