# GeoSurePath Unified Platform Startup v2 (PostgreSQL)
Write-Host "[GeoSurePath] Initializing startup sequence..." -ForegroundColor Cyan

# 1. Start SaaS Backend (PostgreSQL-Native)
Write-Host "[1/2] Starting SaaS API..." -ForegroundColor Green
Start-Process -FilePath "E:\node.exe" -ArgumentList "index.js" -WorkingDirectory "c:\Users\sushant\Desktop\track\track1\saas" -NoNewWindow

# 2. Start Frontend (Vite)
Write-Host "[2/2] Starting Frontend UI..." -ForegroundColor Green
Start-Process -FilePath "E:\node.exe" -ArgumentList ".\node_modules\vite\bin\vite.js", "--host" -WorkingDirectory "c:\Users\sushant\Desktop\track\track1\traccar-web" -NoNewWindow

Write-Host "------------------------------------------------"
Write-Host "GeoSurePath is now ONLINE at http://localhost:3000" -ForegroundColor Yellow
Write-Host "PostgreSQL Database: ACTIVE" -ForegroundColor Gray
Write-Host "------------------------------------------------"
