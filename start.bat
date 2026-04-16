@echo off
title Academic Certificate Portal

echo ============================================
echo   Academic Certificate Portal
echo ============================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm.cmd install
    echo.
)

echo [INFO] Preparing CNN baseline model...
call npm.cmd run bootstrap:model
echo.

echo [INFO] Starting backend on http://localhost:5000 ...
start "CertPortal API" cmd /k "cd /d %~dp0 && npm.cmd run server"

timeout /t 3 /nobreak >nul

echo [INFO] Starting frontend on http://localhost:3000 ...
start "CertPortal Web" cmd /k "cd /d %~dp0 && npm.cmd run dev"

timeout /t 3 /nobreak >nul
start "" http://localhost:3000

echo.
echo ============================================
echo   Login credentials
echo   Admin:   admin / admin123
echo   Student: student01 / student123
echo ============================================
pause
