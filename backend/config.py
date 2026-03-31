import os
from dotenv import load_dotenv

load_dotenv()

# NVIDIA NIM (OpenAI-compatible free API)
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct")

PORT = int(os.getenv("PORT", "8000"))
DB_PATH = os.getenv("DB_PATH", "./lingua.db")

SUPPORTED_LANGUAGES = ["Spanish", "French", "German", "Dutch"]

LANGUAGE_CODES = {
    "Spanish": "es",
    "French": "fr",
    "German": "de",
    "Dutch": "nl",
}

LEVELS = ["beginner", "intermediate", "advanced"]
