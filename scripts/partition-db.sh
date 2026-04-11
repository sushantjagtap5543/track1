#!/bin/bash
# GeoSurePath DB Partitioning Automation v1.0.0
# Automates PostgreSQL table partitioning for high-frequency GPS data.

TABLE_NAME="Positions"
PARTITION_COLUMN="deviceTime"

echo "🚀 Starting Database Partitioning for ${TABLE_NAME}..."

# 1. Create the template for a new month (e.g., May 2026)
# Usage: ./partition-db.sh 2026 05
YEAR=$1
MONTH=$2

if [ -z "$YEAR" ] || [ -z "$MONTH" ]; then
    echo "❌ Usage: ./partition-db.sh [YYYY] [MM]"
    exit 1
fi

NEXT_MONTH=$((MONTH + 1))
NEXT_YEAR=$YEAR
if [ $NEXT_MONTH -eq 13 ]; then
    NEXT_MONTH=1
    NEXT_YEAR=$((YEAR + 1))
fi

# Formatting with leading zero
MONTH_STR=$(printf "%02d" $MONTH)
NEXT_MONTH_STR=$(printf "%02d" $NEXT_MONTH)

PARTITION_NAME="${TABLE_NAME}_p${YEAR}_${MONTH_STR}"
START_DATE="${YEAR}-${MONTH_STR}-01"
END_DATE="${NEXT_YEAR}-${NEXT_MONTH_STR}-01"

echo "📦 Creating partition: ${PARTITION_NAME} [${START_DATE} to ${END_DATE}]"

# In a real environment, this would run via psql
# Here we output the SQL for verification
cat <<EOF > "scripts/partitions/${PARTITION_NAME}.sql"
CREATE TABLE IF NOT EXISTS "${PARTITION_NAME}" PARTITION OF "${TABLE_NAME}"
FOR VALUES FROM ('${START_DATE}') TO ('${END_DATE}');

CREATE INDEX IF NOT EXISTS "${PARTITION_NAME}_device_idx" ON "${PARTITION_NAME}" ("deviceId");
CREATE INDEX IF NOT EXISTS "${PARTITION_NAME}_time_idx" ON "${PARTITION_NAME}" ("${PARTITION_COLUMN}" DESC);
EOF

echo "✅ SQL Partition template generated at scripts/partitions/${PARTITION_NAME}.sql"
