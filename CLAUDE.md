# Lingua — Claude Code Session Context

## What this project is

**Lingua** is a self-hosted AI language tutor web app. It runs entirely on a local Windows machine using Ollama (local LLM). Think Praktika but free and private. Users practice Spanish, French, German, or Dutch through voice or text conversations with an AI tutor that remembers past sessions.

## Git

- **Repo**: `leonardobove/language_learning_app`
- **Working branch**: `claude/lingua-language-tutor-jpTpf`
- Always develop and push to this branch. Never push to main without asking.

## Tech stack

- **Backend**: Python 3.11 + FastAPI + SQLite (no ORM) + httpx
- **LLM**: Ollama at `http://localhost:11434`, default model `gemma3:12b`
- **STT**: `openai-whisper` (loaded once at startup in `backend/whisper_client.py`)
- **TTS**: Kokoro → pyttsx3 fallback chain (`backend/tts_client.py`)
- **Frontend**: React 18 + Vite + Tailwind CSS (no component library)
- **Python env**: `.venv` in project root — `start.bat` creates it automatically on first run

## Project structure

```
language_learning_app/
├── backend/
│   ├── main.py            # FastAPI app, all routes, lifespan startup
│   ├── db.py              # SQLite schema + queries (users/sessions/messages/memory)
│   ├── ollama_client.py   # Async Ollama HTTP (SSE streaming + summarise)
│   ├── whisper_client.py  # Whisper STT, checks ffmpeg on PATH before transcribing
│   ├── tts_client.py      # Kokoro / Piper / pyttsx3 fallback TTS
│   ├── prompts.py         # System prompt builder + summarisation prompt
│   ├── models.py          # Pydantic models
│   └── config.py          # Settings from .env
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── ProfilePicker.jsx   # Netflix-style profile selector
│       │   ├── LanguagePicker.jsx  # Language + level picker
│       │   └── Session.jsx         # Main conversation UI
│       ├── components/
│       │   ├── MicButton.jsx       # Animated mic, gold idle / red pulsing when recording
│       │   ├── MessageBubble.jsx   # Chat bubbles with labels
│       │   ├── AudioPlayer.jsx     # Hidden auto-play for TTS
│       │   ├── StreamingText.jsx   # Word-by-word SSE display, amber correction highlight
│       │   └── HistoryPanel.jsx    # Slide-in past sessions
│       ├── hooks/
│       │   ├── useVoiceRecorder.js # MediaRecorder, webm/opus
│       │   └── useSSE.js           # Reads text/event-stream from fetch Response
│       └── api.js                  # All fetch calls to backend
├── scripts/
│   ├── install_windows_service.bat              # NSSM Ollama service
│   └── install_windows_service_task_scheduler.bat # Task Scheduler alternative
├── .env.example
├── .gitignore
├── requirements.txt
├── first_run.py       # Pipeline verification script
├── start.bat          # One-click launcher: creates .venv, installs deps, starts both servers
└── CLAUDE.md          # This file
```

## What has been built (all complete and pushed)

- Full backend with all 9 API endpoints (`/health`, `/api/models`, `/api/users`, `/api/sessions`, `/api/chat` SSE, `/api/transcribe`, `/api/tts`)
- SQLite schema: `users`, `sessions`, `messages`, `memory` tables
- Persistent memory: after each session, Ollama summarises topics/mistakes/vocabulary → stored in `memory` table → injected into next session's system prompt
- Level-adaptive system prompt (beginner=mostly English, advanced=mostly target language)
- Full React frontend with dark theme (`#0d0f14` bg, `#f5a623` gold accent), Playfair Display + DM Sans fonts
- Voice recording → Whisper transcription → chat → TTS autoplay pipeline
- `start.bat` auto-creates `.venv`, installs requirements, launches backend + frontend in separate windows

## Known issues fixed so far

1. **ffmpeg missing on Windows** — `[WinError 2]` crash in Whisper transcription.
   - Fix applied: `whisper_client.py` now calls `shutil.which("ffmpeg")` before transcribing and raises a clear `RuntimeError` if not found. Also catches `WinError 2` from the transcribe call itself.
   - **User still needs to install ffmpeg**: `winget install ffmpeg` then restart terminal.

## User's environment

- Windows machine (`C:\Users\lbove\Desktop\language_learning_app`)
- Running the backend manually with uvicorn (not yet using `start.bat` fully)
- Whisper loaded successfully (base model, FP32 on CPU — the FP16 warning is harmless)
- ffmpeg was missing — fix pushed, user needs to install it

## Design decisions / conventions

- CORS is wide open (`allow_origins=["*"]`) — intentional, app is local-only
- Vite dev server proxies `/api` and `/health` to `http://localhost:8000` (see `vite.config.js`)
- SSE stream yields `{"type": "chunk"|"done"|"error", "content": "..."}` JSON lines
- Correction highlighting: any sentence matching `In <Language> we'd say:` pattern turns amber in `StreamingText.jsx`
- TTS returns raw WAV bytes; frontend creates an object URL and plays it via hidden `<audio>`
- DB path is configurable via `DB_PATH` in `.env`, defaults to `./lingua.db` in project root

## How to run (Windows)

```cmd
git pull
start.bat
```

Or manually (with venv active):
```cmd
.venv\Scripts\activate
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
cd frontend && npm run dev
```

## How to verify setup

```cmd
.venv\Scripts\activate
python first_run.py
```

## Commit style

Single focused commit messages. Always push to `claude/lingua-language-tutor-jpTpf`. Include the session URL footer:
```
https://claude.ai/code/session_01HAoPEG2ybT6zoprr8Scx6K
```
