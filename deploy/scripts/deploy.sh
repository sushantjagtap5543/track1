#!/usr/bin/env bash
# =============================================================================
# GeoSurePath — Lightsail Deploy Script
# Run on the server by GitHub Actions CI/CD pipeline.
# Can also be run manually: bash deploy/scripts/deploy.sh
# =============================================================================
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/home/ubuntu/track1}"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
HEALTH_RETRIES=12        # 12 × 5s = 60s timeout
SAAS_HEALTH_RETRIES=6    # 6 × 5s = 30s timeout

log()  { echo "[$(date '+%H:%M:%S')] $*"; }
ok()   { echo "[$(date '+%H:%M:%S')] ✅ $*"; }
warn() { echo "[$(date '+%H:%M:%S')] ⚠️  $*"; }
fail() { echo "[$(date '+%H:%M:%S')] ❌ $*"; exit 1; }

# ── 1. Change to deploy directory ──────────────────────────────────────────
log "📂 Working in: $DEPLOY_DIR"
cd "$DEPLOY_DIR"

# ── 2. Pull latest code ─────────────────────────────────────────────────────
log "📥 Pulling latest code from origin/main..."
git fetch origin main
git reset --hard origin/main
ok "Code updated to $(git rev-parse --short HEAD)"

# ── 3. Pull new Docker images ───────────────────────────────────────────────
log "📦 Pulling Docker images from GHCR..."
cd deploy
docker compose $COMPOSE_FILES pull
ok "Images pulled."

# ── 4. Restart services ─────────────────────────────────────────────────────
log "♻️  Restarting all services (zero-downtime replacement)..."
docker compose $COMPOSE_FILES up -d --remove-orphans --no-build
ok "Services restarted."

# ── 5. Traccar health check ─────────────────────────────────────────────────
log "⏳ Waiting for Traccar (max ${HEALTH_RETRIES}×5s)..."
for i in $(seq 1 $HEALTH_RETRIES); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/api/server 2>/dev/null || echo "000")
  # 200 = healthy, 401 = healthy but unauthenticated (normal for Traccar)
  if [[ "$STATUS" == "200" || "$STATUS" == "401" ]]; then
    ok "Traccar healthy (HTTP $STATUS)"
    break
  fi
  if [[ "$i" -eq "$HEALTH_RETRIES" ]]; then
    fail "Traccar health check timed out after $((HEALTH_RETRIES * 5))s (last status: $STATUS)"
  fi
  log "   Attempt $i/$HEALTH_RETRIES — HTTP $STATUS — retrying in 5s..."
  sleep 5
done

# ── 6. SaaS API health check ────────────────────────────────────────────────
log "⏳ Waiting for SaaS API (max ${SAAS_HEALTH_RETRIES}×5s)..."
for i in $(seq 1 $SAAS_HEALTH_RETRIES); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null || echo "000")
  if [[ "$STATUS" == "200" ]]; then
    ok "SaaS API healthy (HTTP $STATUS)"
    break
  fi
  if [[ "$i" -eq "$SAAS_HEALTH_RETRIES" ]]; then
    warn "SaaS API health check timed out — non-fatal, check logs: docker compose logs saas-api"
    break
  fi
  log "   Attempt $i/$SAAS_HEALTH_RETRIES — HTTP $STATUS — retrying in 5s..."
  sleep 5
done

# ── 7. Summary ──────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║ 🎉  GeoSurePath deployment complete!         ║"
echo "╚══════════════════════════════════════════════╝"
docker compose $COMPOSE_FILES ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
