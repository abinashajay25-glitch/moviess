@echo off
title CineDub AI - Frontend Studio
echo ========================================================
echo   CineDub AI - React Dark Cinematic Web Studio
echo   Starting Vite Dev Server on http://localhost:5173
echo ========================================================
cd /d "%~dp0frontend"
call npm run dev
pause
