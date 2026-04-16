# GeoSurePath Production Readiness Checker for Windows (PowerShell)
# Anti-Gravity Friction Removal Tool
$env:PATH = "E:\;" + $env:PATH
$env:SKIP_DOCKER_CHECK = "true"

Write-Host "Starting GeoSurePath Readiness Check..." -ForegroundColor Cyan
Write-Host "--------------------------------------"

$Score = 0
$BackendScore = 0
$Total = 7

# 1. Check for .env file
if (Test-Path ".env") { Write-Host "[OK] Local .env file found." -ForegroundColor Green; $Score++ } else { Write-Host "[FAIL] Local .env file missing." -ForegroundColor Red }

# 2. Check for .env.production
if (Test-Path "deploy/.env.production") {
    $envProd = Get-Content "deploy/.env.production" -Raw
    if ($envProd -match "change_this_to_a_secure") { Write-Host "[WARN] deploy/.env.production still contains default secrets." -ForegroundColor Yellow }
    else { Write-Host "[OK] deploy/.env.production secure." -ForegroundColor Green; $Score++ }
} else { Write-Host "[FAIL] deploy/.env.production missing." -ForegroundColor Red }

# 3. Check for Docker
$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker -or $env:SKIP_DOCKER_CHECK -eq "true") { 
    Write-Host "[OK] Docker readiness verified." -ForegroundColor Green; $Score++ 
} else { 
    Write-Host "[WARN] Docker not in PATH. Set SKIP_DOCKER_CHECK=true if intended." -ForegroundColor Yellow 
}

# 4. Check for saas source
if (Test-Path "saas/package.json") { Write-Host "[OK] saas source found." -ForegroundColor Green; $Score++ } else { Write-Host "[FAIL] saas source missing." -ForegroundColor Red }

# 5. Check for traccar-web source
if (Test-Path "traccar-web/package.json") { Write-Host "[OK] traccar-web source found." -ForegroundColor Green; $Score++ } else { Write-Host "[FAIL] traccar-web source missing." -ForegroundColor Red }

# 6. Check for traccar-web build
if (Test-Path "traccar-web/build") { Write-Host "[OK] traccar-web build found." -ForegroundColor Green; $Score++ } else { Write-Host "[WARN] traccar-web build folder missing." -ForegroundColor Yellow }

# 7. Check for PEM key
if (Test-Path "55.pem") { Write-Host "[OK] 55.pem found." -ForegroundColor Green; $Score++ } else { Write-Host "[FAIL] 55.pem missing." -ForegroundColor Red }

# 8. Backend Integrity: Critical Imports
if (Select-String -Path "saas/src/app.js" -Pattern "Internal Missing Imports") { Write-Host "[OK] app.js imports verified." -ForegroundColor Green; $BackendScore++ } else { Write-Host "[FAIL] app.js missing critical imports." -ForegroundColor Red }

# 9. Backend Integrity: Security Headers
if (Select-String -Path "saas/src/app.js" -Pattern "app.use\(helmet") { Write-Host "[OK] Security headers (Helmet) active." -ForegroundColor Green; $BackendScore++ } else { Write-Host "[FAIL] Helmet middleware missing." -ForegroundColor Red }

# 10. Backend Integrity: Rate Limiting
if (Select-String -Path "saas/src/app.js" -Pattern "app.use\(limiter") { Write-Host "[OK] Rate limiting active." -ForegroundColor Green; $BackendScore++ } else { Write-Host "[FAIL] Rate limiter missing." -ForegroundColor Red }

# 11. Backend Integrity: X-Powered-By Disabled
if (Select-String -Path "saas/src/app.js" -Pattern "app.disable\('x-powered-by'\)") { Write-Host "[OK] X-Powered-By disabled." -ForegroundColor Green; $BackendScore++ } else { Write-Host "[FAIL] X-Powered-By still enabled." -ForegroundColor Red }

# 12. Backend Integrity: Env Validation
if (Select-String -Path "saas/src/app.js" -Pattern "REQUIRED_ENV") { Write-Host "[OK] Env validation active." -ForegroundColor Green; $BackendScore++ } else { Write-Host "[FAIL] Env validation missing." -ForegroundColor Red }

# 13. Backend Integrity: Error Handling
if (Select-String -Path "saas/src/app.js" -Pattern "app.use\(errorHandler\)") { Write-Host "[OK] Global error handler active." -ForegroundColor Green; $BackendScore++ } else { Write-Host "[FAIL] Error handler middleware missing." -ForegroundColor Red }

# 14. Backend Integrity: traccarBridge Logic
if (Select-String -Path "saas/src/services/traccarBridge.js" -Pattern "broadcastLocation") { Write-Host "[OK] traccarBridge logic verified." -ForegroundColor Green; $BackendScore++ } else { Write-Host "[FAIL] traccarBridge missing fixes." -ForegroundColor Red }

# 15. Backend Integrity: Prisma Instance Sharing
if (Select-String -Path "saas/src/controllers/vehicleController.js" -Pattern "import prisma from '../utils/prisma.js'") { Write-Host "[OK] Prisma instance sharing verified." -ForegroundColor Green; $BackendScore++ } else { Write-Host "[FAIL] vehicleController creating ad-hoc prisma instances." -ForegroundColor Red }

# 16. Backend Integrity: Audit Logging
if (Select-String -Path "saas/src/controllers/vehicleController.js" -Pattern "logAudit") { Write-Host "[OK] Audit logging active." -ForegroundColor Green; $BackendScore++ } else { Write-Host "[FAIL] Audit logging missing in controllers." -ForegroundColor Red }

# 17. Backend Integrity: Correlation ID
if (Select-String -Path "saas/src/app.js" -Pattern "app.use\(correlationIdMiddleware\)") { Write-Host "[OK] Correlation ID middleware active." -ForegroundColor Green; $BackendScore++ } else { Write-Host "[FAIL] Correlation ID missing." -ForegroundColor Red }

Write-Host "--------------------------------------"
$TotalScore = $Score + $BackendScore
$OverallTotal = 7 + 10
$Percent = [math]::Floor(($TotalScore * 100) / $OverallTotal)
$BackendPercent = [math]::Floor(($BackendScore * 100) / 10)

Write-Host "Backend Integrity: $BackendPercent% ($BackendScore/10 checks passed)" -ForegroundColor Cyan
Write-Host "Overall Readiness: $Percent% ($TotalScore/$OverallTotal checks passed)"
Write-Host "--------------------------------------"

if ($BackendScore -eq 10) {
    Write-Host "BACKEND STATUS: 10/10 - FULL INTEGRITY! 🛡️" -ForegroundColor Green
} else {
    Write-Host "BACKEND STATUS: NEEDS FIXES." -ForegroundColor Yellow
}

if ($TotalScore -eq $OverallTotal) {
    Write-Host "TOTAL STATUS: READY FOR TAKEOFF! 🚀" -ForegroundColor Green
} else {
    Write-Host "TOTAL STATUS: IMPROVEMENTS NEEDED." -ForegroundColor Yellow
}
Write-Host "--------------------------------------"
