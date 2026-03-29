import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from typing import AsyncIterator

from backend import db, ollama_client, whisper_client, tts_client, prompts
from backend.models import (
    CreateUserRequest,
    StartSessionRequest,
    ChatRequest,
    TTSRequest,
    HealthResponse,
)
from backend.config import OLLAMA_MODEL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initialising database...")
    db.init_db()
    logger.info("Pre-loading Whisper model...")
    whisper_client.load_whisper()
    logger.info("Startup complete.")
    yield


app = FastAPI(title="Lingua API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health():
    connected = await ollama_client.check_health()
    models = []
    if connected:
        try:
            models = await ollama_client.list_models()
        except Exception:
            pass
    return HealthResponse(
        status="ok" if connected else "degraded",
        ollama_connected=connected,
        available_models=models,
    )


# ── Models ────────────────────────────────────────────────────────────────────

@app.get("/api/models")
async def get_models():
    try:
        models = await ollama_client.list_models()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


# ── Users ─────────────────────────────────────────────────────────────────────

@app.post("/api/users", status_code=201)
async def create_user(req: CreateUserRequest):
    user = db.create_user(req.name, req.avatar_color)
    return user


@app.get("/api/users")
async def list_users():
    return db.list_users()


@app.get("/api/users/{user_id}")
async def get_user(user_id: int):
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    memory = db.get_user_memory(user_id)
    sessions = db.get_sessions_for_user(user_id)
    return {**user, "memory": memory, "sessions": sessions}


# ── Sessions ──────────────────────────────────────────────────────────────────

@app.post("/api/sessions", status_code=201)
async def start_session(req: StartSessionRequest):
    user = db.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session = db.create_session(req.user_id, req.language, req.level)
    return session


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: int):
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = db.get_messages(session_id)
    return {**session, "messages": messages}


@app.post("/api/sessions/{session_id}/end")
async def end_session(session_id: int):
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.end_session(session_id)

    messages = db.get_messages(session_id)
    if len(messages) < 2:
        return {"status": "ended", "summary": None}

    user = db.get_user(session["user_id"])
    summary_prompt = prompts.build_summary_prompt(
        user_name=user["name"],
        language=session["language"],
        level=session["level"],
        messages=messages,
    )

    try:
        summary = await ollama_client.generate_summary(summary_prompt)
        db.upsert_memory(session["user_id"], session["language"], summary)
        return {"status": "ended", "summary": summary}
    except Exception as e:
        logger.error(f"Summarisation failed: {e}")
        return {"status": "ended", "summary": None, "error": str(e)}


# ── Chat (SSE streaming) ──────────────────────────────────────────────────────

@app.post("/api/chat")
async def chat(req: ChatRequest):
    session = db.get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user = db.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    memory_summary = db.get_memory(req.user_id, req.language)

    system_prompt = prompts.build_system_prompt(
        user_name=user["name"],
        language=req.language,
        level=session["level"],
        memory_summary=memory_summary,
    )

    # Load conversation history
    history = db.get_messages(req.session_id)
    ollama_messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        ollama_messages.append({"role": msg["role"], "content": msg["content"]})

    # Add the new user message
    ollama_messages.append({"role": "user", "content": req.message})

    # Persist user message
    db.add_message(req.session_id, "user", req.message)

    async def event_stream() -> AsyncIterator[str]:
        full_response = []
        try:
            async for chunk in ollama_client.chat_stream(ollama_messages):
                full_response.append(chunk)
                payload = json.dumps({"type": "chunk", "content": chunk})
                yield f"data: {payload}\n\n"

            # Persist the full assistant message
            complete_text = "".join(full_response)
            db.add_message(req.session_id, "assistant", complete_text)

            done_payload = json.dumps({"type": "done", "content": complete_text})
            yield f"data: {done_payload}\n\n"

        except Exception as e:
            error_payload = json.dumps({"type": "error", "content": str(e)})
            yield f"data: {error_payload}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ── Transcription ─────────────────────────────────────────────────────────────

@app.post("/api/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = Form(default="English"),
):
    try:
        audio_bytes = await audio.read()
        text = whisper_client.transcribe_audio(audio_bytes, language_hint=language)
        return {"text": text}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail="Transcription failed")


# ── TTS ───────────────────────────────────────────────────────────────────────

@app.post("/api/tts")
async def text_to_speech(req: TTSRequest):
    try:
        audio_bytes = tts_client.synthesize_speech(req.text, req.language)
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={"Content-Disposition": "inline; filename=speech.wav"},
        )
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail="TTS failed")
