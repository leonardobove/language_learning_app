# Lingua — AI Language Tutor

A self-hosted, privacy-first AI language tutor that runs entirely on your local machine using [Ollama](https://ollama.com). Inspired by [Praktika](https://praktika.ai) but completely free with no subscriptions or external API calls.

Practice **Spanish, French, German, or Dutch** through natural voice or text conversations with an AI tutor that remembers past sessions, tracks your mistakes, and adapts to your level over time.

---

## Features

- **Voice-first conversation** — speak into your mic, get spoken responses back
- **Multi-user profiles** — Netflix-style profile picker; each user has their own progress
- **Persistent memory** — after each session, the AI summarises what you discussed, your mistakes, and vocabulary. This is injected into every future session automatically
- **Level-adaptive** — beginner mode uses mostly English; advanced mode is almost entirely the target language
- **Inline corrections** — grammar and vocabulary mistakes are gently corrected in context
- **Session history** — browse past conversations in a slide-in panel
- **Fully local** — no internet required after initial model download; all data stays on your machine

---

## Prerequisites

- **[Ollama](https://ollama.com/download)** — local LLM inference
- **Python 3.11+** — backend
- **Node.js 18+** — frontend build
- **GPU recommended** — NVIDIA with CUDA or Apple Silicon for fast inference; CPU works but is slow

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/leonardobove/language_learning_app.git
cd language_learning_app
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` to set your preferred Ollama model and other settings (defaults work out of the box).

### 3. Create a virtual environment and install Python dependencies

**Windows:**
```cmd
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

> `start.bat` on Windows will create and activate the venv automatically on first run — you only need to do this manually if you want to run commands directly (e.g. `first_run.py`).

### 4. Pull the Ollama model

```bash
ollama pull gemma3:12b
```

This downloads ~8 GB. See [Model Recommendations](#model-recommendations) for lighter options.

### 5. Install Whisper (speech-to-text)

With the venv activated:
```bash
pip install openai-whisper
```

The model weights download automatically on first use (~150 MB for `base`).

### 6. Install TTS (text-to-speech)

With the venv activated:

**Option A — Kokoro** (recommended, higher quality):
```bash
pip install kokoro soundfile
```

**Option B — pyttsx3** (always available, no extra download):
```bash
pip install pyttsx3
```

pyttsx3 is used automatically as a fallback if Kokoro is not installed.

**Option C — Piper** (fast, good quality):
1. Download the [Piper binary](https://github.com/rhasspy/piper/releases) and add it to your PATH
2. Download a model from [the Piper voices page](https://huggingface.co/rhasspy/piper-voices/tree/main)
3. Set `TTS_ENGINE=piper` and `PIPER_MODEL_PATH=./models/piper/your-model.onnx` in `.env`

### 7. Build the frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

### 8. Run the app

**Windows (recommended):**
```
start.bat
```

**Manual (any OS):**
```bash
# Terminal 1 — backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — frontend
cd frontend && npm run dev
```

Then open **http://localhost:5173** in your browser.

### 9. First-run verification (optional)

```bash
python first_run.py
```

This seeds the database with a demo user and verifies that Ollama, Whisper, and TTS are all working.

---

## Running Ollama as a Windows Service

By default, Ollama must be running before you start Lingua. The following scripts register Ollama so it starts automatically on Windows boot.

### Method A — NSSM (recommended)

[NSSM](https://nssm.cc) (Non-Sucking Service Manager) is a small utility that wraps any executable as a proper Windows Service.

1. Download `nssm.exe` from https://nssm.cc/download
2. Place it at `C:\nssm\nssm.exe`
3. Run the install script **as Administrator**:
   ```
   scripts\install_windows_service.bat
   ```

To manage the service later:
```cmd
nssm start Ollama
nssm stop Ollama
nssm remove Ollama confirm
```

### Method B — Windows Task Scheduler (no NSSM required)

This creates a scheduled task that runs Ollama at user logon.

1. Run the install script **as Administrator**:
   ```
   scripts\install_windows_service_task_scheduler.bat
   ```

To remove the task later:
```cmd
schtasks /delete /tn "OllamaAutoStart" /f
```

---

## Accessing on Your Local Network

To use Lingua from a phone or tablet on the same Wi-Fi:

1. Find your PC's local IP address:
   ```cmd
   ipconfig
   ```
   Look for `IPv4 Address` under your Wi-Fi adapter (e.g. `192.168.1.42`).

2. Start Lingua normally with `start.bat`.

3. Open your phone browser and go to:
   ```
   http://192.168.1.42:5173
   ```

> **Note:** Voice recording requires HTTPS in most mobile browsers. For local network use, either use the IP directly (works in some browsers) or set up a local reverse proxy with a self-signed certificate.

---

## Supported Languages

| Language | Code | Flag |
|----------|------|------|
| Spanish  | es   | 🇪🇸  |
| French   | fr   | 🇫🇷  |
| German   | de   | 🇩🇪  |
| Dutch    | nl   | 🇳🇱  |

---

## Adding a New Language

1. **`backend/config.py`** — add to `SUPPORTED_LANGUAGES` and `LANGUAGE_CODES`
2. **`backend/prompts.py`** — add level instructions specific to the language if needed
3. **`backend/whisper_client.py`** — add the language code to `lang_map`
4. **`backend/tts_client.py`** — add a voice mapping to `LANGUAGE_VOICE_MAP` / `KOKORO_VOICE_MAP`
5. **`frontend/src/pages/LanguagePicker.jsx`** — add the language entry to the `LANGUAGES` array

---

## Model Recommendations

| Model | VRAM | Speed | Quality | Command |
|-------|------|-------|---------|---------|
| `gemma3:12b` (default) | ~8 GB | Medium | Excellent | `ollama pull gemma3:12b` |
| `llama3.1:8b` | ~5 GB | Fast | Very good | `ollama pull llama3.1:8b` |
| `mistral:7b` | ~4 GB | Fast | Good | `ollama pull mistral:7b` |
| `gemma3:4b` | ~3 GB | Very fast | Good | `ollama pull gemma3:4b` |

Change the model by setting `OLLAMA_MODEL=<model-name>` in your `.env` file.

---

## Folder Structure

```
lingua/
├── backend/
│   ├── main.py               # FastAPI app, all API routes
│   ├── db.py                 # SQLite setup and all database queries
│   ├── ollama_client.py      # Ollama HTTP client (chat streaming, summarise)
│   ├── whisper_client.py     # Whisper speech-to-text
│   ├── tts_client.py         # TTS (Kokoro / Piper / pyttsx3 fallback)
│   ├── prompts.py            # System prompt builder and summarisation prompt
│   ├── models.py             # Pydantic request/response models
│   └── config.py             # Settings loaded from .env
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ProfilePicker.jsx     # Netflix-style user selector
│   │   │   ├── LanguagePicker.jsx    # Language + level selection
│   │   │   └── Session.jsx           # Main conversation screen
│   │   ├── components/
│   │   │   ├── MicButton.jsx         # Animated mic button
│   │   │   ├── MessageBubble.jsx     # Chat bubbles
│   │   │   ├── AudioPlayer.jsx       # Hidden auto-play audio
│   │   │   ├── StreamingText.jsx     # Word-by-word streaming
│   │   │   └── HistoryPanel.jsx      # Slide-in history panel
│   │   ├── hooks/
│   │   │   ├── useVoiceRecorder.js   # MediaRecorder audio capture
│   │   │   └── useSSE.js             # Server-sent events reader
│   │   └── api.js                    # All fetch calls to backend
│   ├── vite.config.js
│   └── tailwind.config.js
├── scripts/
│   ├── install_windows_service.bat               # NSSM service installer
│   └── install_windows_service_task_scheduler.bat # Task Scheduler installer
├── .env.example              # Configuration template
├── requirements.txt          # Python dependencies
├── first_run.py              # Setup verification script
├── start.bat                 # One-click launcher (Windows)
└── README.md
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Check Ollama connectivity and available models |
| `GET` | `/api/models` | List available Ollama models |
| `POST` | `/api/users` | Create a new user profile |
| `GET` | `/api/users` | List all user profiles |
| `GET` | `/api/users/{id}` | Get user profile with memory and session history |
| `POST` | `/api/sessions` | Start a new session |
| `GET` | `/api/sessions/{id}` | Get session with all messages |
| `POST` | `/api/sessions/{id}/end` | End session and generate memory summary |
| `POST` | `/api/chat` | Send message, stream AI response via SSE |
| `POST` | `/api/transcribe` | Upload audio blob → transcribed text |
| `POST` | `/api/tts` | Text → speech audio file |

Interactive API docs are available at **http://localhost:8000/docs** when the backend is running.

---

## License

MIT License — free to use, modify, and distribute.
