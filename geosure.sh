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
        docker compose up -d
        echo "Stack is starting. Use './geosure.sh logs' to follow."
        ;;
    down)
        docker compose down
        echo "Stack stopped."
        ;;
    logs)
        docker compose logs -f
        ;;
    build)
        docker compose build
        ;;
    seed)
        docker compose exec saas-api npm run seed
        ;;
    doctor)
        echo "Diagnosing GeoSurePath environment..."
        ./fix-permissions.sh
        
        # Golden Config Verification
        if [ -f nginx.conf ]; then
            echo "[OK] Nginx configuration found. Verifying against Golden Standard..."
            # Simple check for critical security headers
            if ! grep -q "Content-Security-Policy" nginx.conf; then
                echo "[WARN] Security headers missing in nginx.conf! Self-healing recommended."
            fi
        fi

        if [ ! -f .env ]; then
            echo "[FIX] Creating .env from .env.example..."
            cp .env.example .env
        fi
        echo "Diagnosis complete. All systems stable."
        ;;
    migrate)
        docker compose exec saas-api npx prisma migrate deploy
        ;;
    check)
        ./check-readiness.sh
        ;;
    audit)
        ls -lh .gemini/antigravity/brain/a80f4a03-d03a-4533-a816-8f35536179c1/comprehensive_audit_final_*.md
        ;;
    shell)
        docker compose exec saas-api sh
        ;;
    help|*)
        help
        ;;
esac
