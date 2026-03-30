@echo off
setlocal enabledelayedexpansion

title Lingua - AI Language Tutor

echo ================================================
echo   Lingua - AI Language Tutor
echo ================================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found in PATH.
    echo         Please install Python 3.11+ from https://python.org
    pause
    exit /b 1
)

:: Create virtual environment if it doesn't exist
if not exist ".venv\Scripts\activate.bat" (
    echo Creating Python virtual environment...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created.
    echo.
    echo Installing Python dependencies...
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] pip install failed. Check requirements.txt and your internet connection.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed.
    echo.
) else (
    echo [OK] Virtual environment found.
)

:: Check if Ollama is running
echo Checking Ollama...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Ollama does not appear to be running.
    echo          Please start Ollama and try again, or it may start automatically
    echo          if registered as a Windows service.
    echo.
    pause
)

:: Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found. Copying from .env.example...
    copy ".env.example" ".env" >nul
    echo         Please edit .env to configure your settings.
    echo.
)

:: Start backend in a new window using the venv
echo Starting backend...
start "Lingua Backend" cmd /k "cd /d %~dp0 && call .venv\Scripts\activate.bat && python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait a moment for the backend to start
timeout /t 3 /nobreak >nul

:: Build check - if dist doesn't exist, build the frontend
if not exist "frontend\dist\index.html" (
    echo Building frontend (first run)...
    cd frontend
    call npm install
    call npm run build
    cd ..
)

:: Start frontend dev server in a new window
echo Starting frontend...
start "Lingua Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"

:: Wait for frontend to start
timeout /t 3 /nobreak >nul

:: Open browser
echo Opening browser...
start http://localhost:5173

echo.
echo ================================================
echo   Lingua is running!
echo   Backend:   http://localhost:8000
echo   Frontend:  http://localhost:5173
echo   API Docs:  http://localhost:8000/docs
echo ================================================
echo.
echo Close this window to keep both servers running,
echo or close the individual server windows to stop.
echo.
pause
