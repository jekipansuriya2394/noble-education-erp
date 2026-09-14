@echo off
title Noble Education ERP - Startup Script
echo ========================================================
echo   NOBLE EDUCATION ERP - VADODARA, GUJARAT, INDIA
echo   Final Year Project Execution Script
echo   Website: nobleedu.in
echo ========================================================
echo.

echo [1/3] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js v18+.
    pause
    exit /b 1
)

echo [2/3] Starting Backend API Server (Port 5000)...
start "Noble ERP - Backend API" cmd /k "cd /d %~dp0backend && npm start"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Client (Port 5173)...
start "Noble ERP - Frontend Client" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo ========================================================
echo   System launched successfully!
echo   Application URL: http://localhost:5173/login
echo   API URL:         http://localhost:5000/api/v1
echo   Demo Password:   Noble@2026
echo ========================================================
echo.

start http://localhost:5173/login
exit /b 0
