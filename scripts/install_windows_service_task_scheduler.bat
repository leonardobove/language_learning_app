@echo off
:: ============================================================
:: Install Ollama to auto-start via Windows Task Scheduler
:: (No NSSM required)
::
:: Prerequisites:
::   1. Install Ollama: https://ollama.com/download
::   2. Run this script as Administrator
:: ============================================================

setlocal

set TASK_NAME=OllamaAutoStart
set OLLAMA_EXE=C:\Users\%USERNAME%\AppData\Local\Programs\Ollama\ollama.exe

echo ================================================
echo   Ollama Auto-Start via Task Scheduler
echo ================================================
echo.

:: Check Ollama
if not exist "%OLLAMA_EXE%" (
    echo [ERROR] Ollama executable not found at %OLLAMA_EXE%
    echo         Please install Ollama from https://ollama.com/download
    echo         or update the OLLAMA_EXE path in this script.
    pause
    exit /b 1
)

:: Check admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script must be run as Administrator.
    pause
    exit /b 1
)

:: Remove existing task if present
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

echo Creating scheduled task: %TASK_NAME%...

:: Create task that runs at logon for all users, with highest privileges
schtasks /create ^
  /tn "%TASK_NAME%" ^
  /tr "\"%OLLAMA_EXE%\" serve" ^
  /sc ONLOGON ^
  /ru "SYSTEM" ^
  /rl HIGHEST ^
  /f

if %errorlevel% neq 0 (
    echo [ERROR] Failed to create scheduled task.
    pause
    exit /b 1
)

echo.
echo Task created. Running it now...
schtasks /run /tn "%TASK_NAME%"

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Ollama scheduled task created and running.
    echo          It will start automatically when Windows boots.
    echo.
    echo Task details:
    schtasks /query /tn "%TASK_NAME%" /fo LIST
    echo.
    echo Verify: http://localhost:11434/api/tags
) else (
    echo.
    echo [WARNING] Task created but failed to run immediately.
    echo          It will start on next boot.
)

echo.
echo To remove this task later, run:
echo   schtasks /delete /tn "%TASK_NAME%" /f
echo.
pause
