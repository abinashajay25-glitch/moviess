@echo off
title CineDub AI - Master Studio Launcher
echo ========================================================
echo   Launching CineDub AI Studio Environment
echo   Tagline: Every Movie. Every Language. One AI Studio.
echo ========================================================

start "CineDub AI Backend" cmd /c "%~dp0run_backend.bat"
timeout /t 3 /nobreak >nul
start "CineDub AI Frontend" cmd /c "%~dp0run_frontend.bat"

echo.
echo CineDub AI Studio is launching!
echo Backend:  http://localhost:8000 (API & Swagger Docs at /docs)
echo Frontend: http://localhost:5173
echo.
timeout /t 5
start http://localhost:5173
