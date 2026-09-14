# Noble Education ERP - Startup Script (PowerShell)
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  NOBLE EDUCATION ERP - VADODARA, GUJARAT, INDIA" -ForegroundColor Cyan
Write-Host "  Final Year Project One-Click Launch Script" -ForegroundColor Cyan
Write-Host "  Brand: Noble Education Group (nobleedu.in)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot

Write-Host "[1/3] Starting Backend API Server on Port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm start"

Start-Sleep -Seconds 3

Write-Host "[2/3] Starting React Vite Frontend Client on Port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\client'; npm run dev"

Start-Sleep -Seconds 4

Write-Host "[3/3] Opening Web Portal in Default Browser..." -ForegroundColor Green
Start-Process "http://localhost:5173/login"

Write-Host ""
Write-Host "System is active! Test login credentials available on /login or use password: Noble@2026" -ForegroundColor Green
