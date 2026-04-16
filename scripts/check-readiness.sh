#!/bin/bash

# GeoSurePath Production Readiness Checker v2.0
# Anti-Gravity Friction Removal Tool

echo "Starting GeoSurePath Readiness Check..."
echo "--------------------------------------"

SCORE=0
BACKEND_SCORE=0
TOTAL=7

# 1. Check for .env file
if [ ! -f .env ]; then echo "[FAIL] Local .env missing."; else echo "[OK] Local .env found."; SCORE=$((SCORE+1)); fi

# 2. Check for .env.production
if [ ! -f deploy/.env.production ]; then
    echo "[FAIL] deploy/.env.production missing."
else
    if grep -q "change_this_to_a_secure" deploy/.env.production; then
        echo "[WARN] deploy/.env.production still contains default secrets."
    else
        echo "[OK] deploy/.env.production secure."; SCORE=$((SCORE+1))
    fi
fi

# 3. Check for Docker
if ! [ -x "$(command -v docker)" ]; then echo "[WARN] Docker not in PATH."; else echo "[OK] Docker found."; SCORE=$((SCORE+1)); fi

# 4. Check for saas source
if [ ! -f saas/package.json ]; then echo "[FAIL] saas source missing."; else echo "[OK] saas source found."; SCORE=$((SCORE+1)); fi

# 5. Check for traccar-web source
if [ ! -f traccar-web/package.json ]; then echo "[FAIL] traccar-web source missing."; else echo "[OK] traccar-web source found."; SCORE=$((SCORE+1)); fi

# 6. Check for traccar-web build
if [ ! -d traccar-web/build ]; then echo "[WARN] traccar-web build folder missing."; else echo "[OK] traccar-web build found."; SCORE=$((SCORE+1)); fi

# 7. Check for PEM key
if [ ! -f 55.pem ]; then echo "[FAIL] 55.pem missing."; else echo "[OK] 55.pem found."; SCORE=$((SCORE+1)); fi

# 8. Backend Integrity: Critical Imports
if grep -q "Internal Missing Imports" saas/src/app.js; then echo "[OK] app.js imports verified."; BACKEND_SCORE=$((BACKEND_SCORE+1)); else echo "[FAIL] app.js missing critical fixes."; fi

# 9. Backend Integrity: Security Headers
if grep -q "app.use(helmet" saas/src/app.js; then echo "[OK] Security headers (Helmet) active."; BACKEND_SCORE=$((BACKEND_SCORE+1)); else echo "[FAIL] Helmet middleware missing."; fi

# 10. Backend Integrity: Rate Limiting
if grep -q "app.use(limiter" saas/src/app.js; then echo "[OK] Rate limiting active."; BACKEND_SCORE=$((BACKEND_SCORE+1)); else echo "[FAIL] Rate limiter missing."; fi

# 11. Backend Integrity: X-Powered-By Disabled
if grep -q "app.disable('x-powered-by')" saas/src/app.js; then echo "[OK] X-Powered-By disabled."; BACKEND_SCORE=$((BACKEND_SCORE+1)); else echo "[FAIL] X-Powered-By still enabled."; fi

# 12. Backend Integrity: Env Validation
if grep -q "REQUIRED_ENV" saas/src/app.js; then echo "[OK] Env validation active."; BACKEND_SCORE=$((BACKEND_SCORE+1)); else echo "[FAIL] Env validation missing."; fi

# 13. Backend Integrity: Error Handling
if grep -q "app.use(errorHandler)" saas/src/app.js; then echo "[OK] Global error handler active."; BACKEND_SCORE=$((BACKEND_SCORE+1)); else echo "[FAIL] Error handler middleware missing."; fi

# 14. Backend Integrity: traccarBridge Logic
if grep -q "broadcastLocation" saas/src/services/traccarBridge.js; then echo "[OK] traccarBridge.js logic verified."; BACKEND_SCORE=$((BACKEND_SCORE+1)); else echo "[FAIL] traccarBridge.js missing critical fixes."; fi

# 15. Backend Integrity: Prisma instance sharing
if grep -q "import prisma from '../utils/prisma.js'" saas/src/controllers/vehicleController.js; then echo "[OK] Prisma instance sharing verified."; BACKEND_SCORE=$((BACKEND_SCORE+1)); else echo "[FAIL] vehicleController.js creating ad-hoc prisma instances."; fi

# 16. Backend Integrity: Audit Logging
if grep -q "logAudit" saas/src/controllers/vehicleController.js; then echo "[OK] Audit logging active."; BACKEND_SCORE=$((BACKEND_SCORE+1)); else echo "[FAIL] Audit logging missing."; fi

# 17. Backend Integrity: Correlation ID
if grep -q "app.use(correlationIdMiddleware)" saas/src/app.js; then echo "[OK] Correlation ID middleware active."; BACKEND_SCORE=$((BACKEND_SCORE+1)); else echo "[FAIL] Correlation ID missing."; fi

echo "--------------------------------------"
TOTAL_SCORE=$((SCORE + BACKEND_SCORE))
OVERALL_TOTAL=17
PERCENT=$(( (TOTAL_SCORE * 100) / OVERALL_TOTAL ))
BACKEND_PERCENT=$(( (BACKEND_SCORE * 100) / 10 ))

echo "Backend Integrity: $BACKEND_PERCENT% ($BACKEND_SCORE/10 checks passed)"
echo "Readiness Score: $PERCENT% ($TOTAL_SCORE/$OVERALL_TOTAL checks passed)"

if [ $BACKEND_SCORE -eq 10 ]; then
    echo "BACKEND STATUS: 10/10 - FULL INTEGRITY! 🛡️"
fi

if [ $TOTAL_SCORE -eq $OVERALL_TOTAL ]; then
    echo "STATUS: READY FOR TAKEOFF! 🚀"
else
    echo "STATUS: IMPROVEMENTS NEEDED."
fi
echo "--------------------------------------"
