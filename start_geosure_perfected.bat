@echo off
echo [GeoSurePath] Starting platform with Anti-Gravity resilience...

:: Kill existing processes on ports 3000 and 3001
echo [1/3] Cleaning up existing ports...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

:: Start SaaS Backend
echo [2/3] Starting SaaS API...
cd saas
start /min "GeoSure SaaS API" E:\node.exe index.js
cd ..

:: Start Frontend
echo [3/3] Starting Frontend UI...
cd traccar-web
start /min "GeoSure Frontend" E:\node.exe .\node_modules\vite\bin\vite.js --host
cd ..

echo.
echo ------------------------------------------------
echo GeoSurePath is now ONLINE at http://localhost:3000
echo SaaS Status available at http://localhost:3001/api/status
echo ------------------------------------------------
pause
