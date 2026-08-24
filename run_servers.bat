@echo off
echo ===================================================
echo KisanMitra AI - Your Intelligent Farming Companion
echo ===================================================
echo Starting FastAPI Backend (Port 8000) and React Vite Frontend (Port 5173)...
echo.

start "KisanMitra AI - Backend API" cmd /k "cd backend && python run.py"
start "KisanMitra AI - Frontend Web App" cmd /k "cd frontend && npm run dev"

echo Backend API: http://127.0.0.1:8000
echo API Docs (Swagger): http://127.0.0.1:8000/docs
echo Frontend Portal: http://localhost:5173
echo.
echo Demo Farmer Login: farmer@kisanmitra.ai / Farmer@123
echo Demo Admin Login: admin@kisanmitra.ai / Admin@123
echo.
