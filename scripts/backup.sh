#!/bin/bash
# GeoSurePath Autonomous Backup System
# Backs up both Traccar (PG) and SaaS (SQLite/PG) databases

BACKUP_DIR="/opt/geosurepath/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

echo "💾 Starting autonomous backup at $TIMESTAMP..."

# 1. Backup Traccar Database (PostgreSQL)
docker exec geosurepath_db pg_dump -U geosurepath geosurepath > "$BACKUP_DIR/traccar_db_$TIMESTAMP.sql"

# 2. Backup SaaS Database (If using SQLite)
if [ -f "saas/prisma/dev.db" ]; then
    cp "saas/prisma/dev.db" "$BACKUP_DIR/saas_db_$TIMESTAMP.db"
fi

# 3. Cleanup old backups (Keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.db" -mtime +7 -delete

echo "✅ Backup completed successfully."
