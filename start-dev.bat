@echo off
REM Metro Booking Service - Development Startup Script for Windows

echo.
echo ========================================
echo Metro Booking Service - Dev Startup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

echo [OK] Node.js version:
node --version
echo.

REM Check if server dependencies are installed
if not exist "server\node_modules" (
    echo [INFO] Installing server dependencies...
    cd server
    call npm install
    cd ..
    echo [OK] Server dependencies installed
    echo.
)

REM Check if frontend dependencies are installed
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install
    echo [OK] Frontend dependencies installed
    echo.
)

REM Check if .env files exist
if not exist "server\.env" (
    echo [WARNING] server\.env not found
    echo Please create server\.env with your Twilio credentials
    echo.
)

if not exist ".env" (
    echo [WARNING] .env not found
    echo Creating from .env.example...
    copy .env.example .env >nul 2>nul
    echo.
)

echo.
echo [INFO] Starting services...
echo.
echo Backend API: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press Ctrl+C to stop all services
echo.

REM Start backend in new window
start "Metro Booking - Backend" cmd /k "cd server && npm run dev"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "Metro Booking - Frontend" cmd /k "npm run dev"

echo.
echo [OK] Services started in separate windows
echo.
pause
