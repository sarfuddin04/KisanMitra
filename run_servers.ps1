Write-Host "===================================================" -ForegroundColor Green
Write-Host "KisanMitra AI - Your Intelligent Farming Companion" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host "Starting FastAPI Backend (Port 8000) and React Vite Frontend (Port 5173)...`n"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python run.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Backend API: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "API Docs (Swagger): http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "Frontend Portal: http://localhost:5173" -ForegroundColor Yellow
Write-Host "`nDemo Farmer Login: farmer@kisanmitra.ai / Farmer@123"
Write-Host "Demo Admin Login: admin@kisanmitra.ai / Admin@123`n"
