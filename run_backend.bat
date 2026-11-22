@echo off
title CineDub AI - Backend Studio
echo ========================================================
echo   CineDub AI - Every Movie. Every Language. One AI Studio.
echo   Starting Backend FastAPI Server on http://localhost:8000
echo ========================================================
cd /d "%~dp0backend"
"C:\Users\Abinashajay\AppData\Local\Programs\Python\Python313\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
