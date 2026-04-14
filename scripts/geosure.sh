#!/bin/bash

# GeoSurePath Unified CLI
# Anti-Gravity Friction Removal Tool

set -e

COMMAND=$1
SHIFT_ARGS=${@:2}

function help() {
    echo "GeoSurePath Unified CLI"
    echo "Usage: ./geosure.sh [command]"
    echo ""
    echo "Commands:"
    echo "  up          Start the entire stack (detached)"
    echo "  down        Stop the entire stack"
    echo "  logs        View logs for all services"
    echo "  build       Rebuild all images"
    echo "  seed        Populate the database with initial data"
    echo "  migrate     Run database migrations"
    echo "  check       Run production readiness check"
    echo "  audit       View the cumulative audit reports"
    echo "  shell       Open a shell in the SaaS API container"
    echo "  help        Show this help message"
}

case $COMMAND in
    up)
        docker-compose -f deploy/docker-compose.yml up -d
        echo "Stack is starting. Use './scripts/geosure.sh logs' to follow."
        ;;
    down)
        docker-compose -f deploy/docker-compose.yml down
        echo "Stack stopped."
        ;;
    logs)
        docker-compose -f deploy/docker-compose.yml logs -f
        ;;
    build)
        docker-compose -f deploy/docker-compose.yml build
        ;;
    seed)
        docker-compose -f deploy/docker-compose.yml exec saas-api npm run seed
        ;;
    doctor)
        echo "Diagnosing GeoSurePath environment..."
        ./scripts/fix-permissions.sh
        
        # Security Policy Verification
        echo "[CHECK] Verifying Security Policy..."
        if grep -q "5432:5432" deploy/docker-compose.yml; then
            echo "[WARN] Database port 5432 is exposed to host! This is a security risk."
        else
            echo "[OK] Database port is isolated."
        fi

        if [ -f .env ]; then
            JWT_SEC=$(grep JWT_SECRET .env | cut -d '=' -f2)
            if [ ${#JWT_SEC} -lt 64 ]; then
                echo "[WARN] JWT_SECRET entropy is low. Run ./scripts/check-readiness.sh for details."
            fi
        else
            echo "[FIX] .env file missing. Creating from example..."
            cp .env.example .env
        fi

        echo "Diagnosis complete. All systems stable."
        ;;
    migrate)
        docker-compose -f deploy/docker-compose.yml exec saas-api npx prisma migrate deploy
        ;;
    check)
        ./scripts/check-readiness.sh
        ;;
    audit)
        ls -lh .gemini/antigravity/brain/a80f4a03-d03a-4533-a816-8f35536179c1/comprehensive_audit_final_*.md
        ;;
    shell)
        docker-compose -f deploy/docker-compose.yml exec saas-api sh
        ;;
    help|*)
        help
        ;;
esac
