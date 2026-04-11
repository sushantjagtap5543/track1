#!/bin/bash

# GeoSurePath Production Readiness Checker
# Anti-Gravity Friction Removal Tool

echo "Starting GeoSurePath Readiness Check..."
echo "--------------------------------------"

# 1. Check for .env file
if [ ! -f .env ]; then
    echo "[FAIL] .env file missing. Run install.sh first."
    exit 1
fi
echo "[OK] .env file found."

# 2. Check for Docker
if ! [ -x "$(command -v docker)" ]; then
  echo "[FAIL] Docker is not installed."
  exit 1
fi
echo "[OK] Docker found."

# 3. Check for JWT Secret Strength
JWT_SEC=$(grep JWT_SECRET .env | cut -d '=' -f2)
if [ ${#JWT_SEC} -lt 64 ]; then
    echo "[WARN] JWT_SECRET is shorter than 64 chars. Consider using the provided high-entropy secret."
else
    echo "[OK] JWT_SECRET entropy looks solid."
fi

# 4. Check for Submodule
if [ ! -f traccar-web/package.json ]; then
    echo "[WARN] traccar-web submodule appears empty. UI build may fail."
else
    echo "[OK] traccar-web source found."
fi

# 5. Check System Resources (Linux only)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    FREE_MEM=$(free -m | awk '/^Mem:/{print $4}')
    if [ $FREE_MEM -lt 1024 ]; then
        echo "[WARN] System has less than 1GB free RAM. Performance may be degraded."
    else
        echo "[OK] System memory looks sufficient."
    fi
fi

echo "--------------------------------------"
echo "Check complete. Ready for takeoff!"
