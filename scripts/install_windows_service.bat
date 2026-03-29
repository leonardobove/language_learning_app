@echo off
:: ============================================================
:: Install Ollama as a Windows Service using NSSM
:: (Non-Sucking Service Manager)
::
:: Prerequisites:
::   1. Install NSSM: https://nssm.cc/download
::      Place nssm.exe in C:\nssm\nssm.exe (or update path below)
::   2. Install Ollama: https://ollama.com/download
::   3. Run this script as Administrator
:: ============================================================

setlocal

set SERVICE_NAME=Ollama
set NSSM=C:\nssm\nssm.exe
set OLLAMA_EXE=C:\Users\%USERNAME%\AppData\Local\Programs\Ollama\ollama.exe

echo ================================================
echo   Ollama Windows Service Installer (NSSM)
echo ================================================
echo.

:: Check NSSM
if not exist "%NSSM%" (
    echo [ERROR] NSSM not found at %NSSM%
    echo         Download NSSM from https://nssm.cc/download
    echo         and place nssm.exe at %NSSM%
    pause
    exit /b 1
)

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

echo Installing Ollama as Windows service...
echo.

:: Remove existing service if present
%NSSM% status %SERVICE_NAME% >nul 2>&1
if %errorlevel% equ 0 (
    echo Removing existing %SERVICE_NAME% service...
    %NSSM% stop %SERVICE_NAME% >nul 2>&1
    %NSSM% remove %SERVICE_NAME% confirm
)

:: Install the service
%NSSM% install %SERVICE_NAME% "%OLLAMA_EXE%" serve

:: Configure service settings
%NSSM% set %SERVICE_NAME% DisplayName "Ollama AI Service"
%NSSM% set %SERVICE_NAME% Description "Ollama local LLM inference server for Lingua"
%NSSM% set %SERVICE_NAME% Start SERVICE_AUTO_START
%NSSM% set %SERVICE_NAME% AppStdout "%TEMP%\ollama_service.log"
%NSSM% set %SERVICE_NAME% AppStderr "%TEMP%\ollama_service_err.log"
%NSSM% set %SERVICE_NAME% AppRotateFiles 1
%NSSM% set %SERVICE_NAME% AppRotateBytes 1048576

:: Start the service
echo.
echo Starting %SERVICE_NAME% service...
%NSSM% start %SERVICE_NAME%

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Ollama service installed and started.
    echo          It will now start automatically on Windows boot.
    echo.
    echo Verify: http://localhost:11434/api/tags
) else (
    echo.
    echo [WARNING] Service installed but failed to start.
    echo          Check the logs at %TEMP%\ollama_service_err.log
)

pause
