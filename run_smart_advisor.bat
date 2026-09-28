@echo off
title Smart Financial Advisor System
color 0A
cls

echo ============================================================
echo   SMART FINANCIAL ADVISOR SYSTEM - Auto Setup and Launch
echo ============================================================
echo.

:: ── STEP 1: Check Python ─────────────────────────────────────
echo [1/5] Checking Python installation...
python --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo.
    echo  ERROR: Python is NOT installed or not found in PATH.
    echo  Download Python 3.11+ from: https://www.python.org/downloads/
    echo  During install, check "Add Python to PATH".
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do set PY_VER=%%v
echo  OK - Found %PY_VER%
echo.

:: ── STEP 2: Check project files ──────────────────────────────
echo [2/5] Checking project files...
IF NOT EXIST "app.py" (
    echo  ERROR: app.py not found.
    echo  Run this .bat file from inside the SmartFinancialAdvisor folder.
    pause
    exit /b 1
)
IF NOT EXIST "data\banks.csv" (
    echo  ERROR: data\banks.csv not found.
    pause
    exit /b 1
)
IF NOT EXIST "templates\index.html" (
    echo  ERROR: templates\index.html not found.
    pause
    exit /b 1
)
echo  OK - All required files found.
echo.

:: ── STEP 3: Create virtual environment ───────────────────────
echo [3/5] Setting up virtual environment...
IF NOT EXIST "venv\Scripts\activate.bat" (
    echo  Creating virtual environment...
    python -m venv venv
    IF ERRORLEVEL 1 (
        echo  ERROR: Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo  Virtual environment created successfully.
) ELSE (
    echo  OK - Virtual environment already exists.
)
echo.

:: ── STEP 4: Install packages ─────────────────────────────────
echo [4/5] Installing required packages...
call venv\Scripts\activate.bat

pip show flask >nul 2>&1
IF ERRORLEVEL 1 (
    echo  Installing Flask...
    pip install flask --quiet
    IF ERRORLEVEL 1 (
        echo  ERROR: Failed to install Flask.
        pause
        exit /b 1
    )
) ELSE (
    echo  OK - Flask already installed.
)

pip show pandas >nul 2>&1
IF ERRORLEVEL 1 (
    echo  Installing Pandas...
    pip install pandas --quiet
) ELSE (
    echo  OK - Pandas already installed.
)
echo.

:: ── STEP 5: Launch app ───────────────────────────────────────
echo [5/5] Starting Smart Financial Advisor...
echo.
echo ============================================================
echo  URL:  http://127.0.0.1:5000
echo  To stop the server, close this window or press CTRL+C
echo ============================================================
echo.

:: Wait 2 seconds then open browser
start "" cmd /c "timeout /t 2 >nul && start http://127.0.0.1:5000"

python app.py
pause
