#!/usr/bin/env python3
"""
first_run.py — Seeds the Lingua database and verifies the full pipeline.

Run this once after setup to:
1. Initialise the SQLite database
2. Create a demo user
3. Verify Ollama connectivity
4. Test a short chat round-trip
5. Test Whisper is loadable (no audio needed)
6. Test TTS is available

Usage:
    python first_run.py
"""

import sys
import asyncio
import os

# Ensure we run from the project root
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Load .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("[WARNING] python-dotenv not installed. Using system environment variables.")


def section(title: str):
    print(f"\n{'='*50}")
    print(f"  {title}")
    print("="*50)


async def main():
    print("\n🌐 Lingua First-Run Verification")
    print("="*50)

    # ── 1. Database init ──────────────────────────────────────────────────────
    section("1. Initialising database")
    from backend.db import init_db, create_user, list_users, create_session, add_message, get_memory
    init_db()
    print("  [OK] Database initialised at", os.environ.get("DB_PATH", "./lingua.db"))

    # ── 2. Seed demo user ─────────────────────────────────────────────────────
    section("2. Creating demo user")
    users = list_users()
    demo = next((u for u in users if u["name"] == "Demo User"), None)
    if not demo:
        demo = create_user("Demo User", "#f5a623")
        print(f"  [OK] Created demo user: {demo['name']} (id={demo['id']})")
    else:
        print(f"  [OK] Demo user already exists (id={demo['id']})")

    # ── 3. Ollama connectivity ────────────────────────────────────────────────
    section("3. Checking Ollama connectivity")
    from backend.ollama_client import check_health, list_models
    healthy = await check_health()
    if healthy:
        print("  [OK] Ollama is reachable at", os.environ.get("OLLAMA_URL", "http://localhost:11434"))
        models = await list_models()
        if models:
            print(f"  [OK] Available models: {', '.join(models[:5])}")
        else:
            print("  [WARNING] No models found. Run: ollama pull gemma3:12b")
    else:
        print("  [FAIL] Cannot reach Ollama.")
        print("         Start Ollama with: ollama serve")
        print("         Then pull a model:  ollama pull gemma3:12b")

    # ── 4. Chat round-trip ────────────────────────────────────────────────────
    section("4. Chat round-trip test")
    if healthy and models:
        from backend.ollama_client import chat_stream
        from backend.prompts import build_system_prompt
        print("  Sending test message to", os.environ.get("OLLAMA_MODEL", "gemma3:12b"), "...")
        system = build_system_prompt("Demo User", "Spanish", "beginner")
        test_messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": "Hola! Please introduce yourself briefly."},
        ]
        response_chunks = []
        async for chunk in chat_stream(test_messages):
            response_chunks.append(chunk)
            print(".", end="", flush=True)
        print()
        response = "".join(response_chunks)
        if response:
            print(f"  [OK] Got response ({len(response)} chars):")
            print(f"       {response[:200]}...")
        else:
            print("  [WARNING] Empty response from model.")
    else:
        print("  [SKIP] Ollama not available or no models installed.")

    # ── 5. Whisper check ──────────────────────────────────────────────────────
    section("5. Whisper STT check")
    import shutil
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        print(f"  [OK] ffmpeg found: {ffmpeg}")
    else:
        print("  [FAIL] ffmpeg not found on PATH.")
        print("         Whisper requires ffmpeg to decode audio from the browser.")
        print("         Install it from https://ffmpeg.org/download.html")
        print("         On Windows: winget install ffmpeg  (then restart terminal)")
        print()

    try:
        import whisper
        model_size = os.environ.get("WHISPER_MODEL", "base")
        print(f"  [OK] openai-whisper installed. Model: {model_size}")
        print("       (Model will be downloaded on first transcription if not cached)")
    except ImportError:
        print("  [WARNING] openai-whisper not installed.")
        print("            Install with: pip install openai-whisper")

    # ── 6. TTS check ─────────────────────────────────────────────────────────
    section("6. TTS check")
    engine = os.environ.get("TTS_ENGINE", "kokoro")
    print(f"  TTS engine configured: {engine}")
    if engine == "kokoro":
        try:
            import kokoro
            print("  [OK] Kokoro TTS installed.")
        except ImportError:
            print("  [WARNING] Kokoro not installed. Will fall back to pyttsx3.")
            try:
                import pyttsx3
                print("  [OK] pyttsx3 (fallback TTS) is available.")
            except ImportError:
                print("  [WARNING] pyttsx3 not installed either.")
                print("            Install with: pip install pyttsx3")
    elif engine == "piper":
        print(f"  Piper model path: {os.environ.get('PIPER_MODEL_PATH', 'not set')}")

    # ── 7. Summary ────────────────────────────────────────────────────────────
    section("Summary")
    print("  Database: ready")
    print(f"  Ollama:   {'connected' if healthy else 'NOT CONNECTED'}")
    print(f"  Models:   {', '.join(models[:3]) if healthy and models else 'none found'}")
    print()
    print("  Start the app with:  start.bat  (Windows)")
    print("  Or manually:")
    print("    python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload")
    print("    cd frontend && npm run dev")
    print()
    print("  Then open: http://localhost:5173")
    print()


if __name__ == "__main__":
    asyncio.run(main())
