-- PostgreSQL Optimization Script for Traccar
-- Target: High-volume positions and events
-- Author: Database Expert

BEGIN;

-- 1. SCHEMA IMPROVEMENTS
-- Upgrade id columns to BIGINT if they aren't already (prevents overflow)
ALTER TABLE tc_positions ALTER COLUMN id TYPE BIGINT;
ALTER TABLE tc_events ALTER COLUMN id TYPE BIGINT;

-- Convert attributes to JSONB for better performance and indexing (PostgreSQL only)
-- Note: Traccar uses Jackson, which handles JSON strings fine, 
-- but JSONB allows DB-side extraction.
ALTER TABLE tc_positions ALTER COLUMN attributes TYPE JSONB USING attributes::jsonb;
ALTER TABLE tc_events ALTER COLUMN attributes TYPE JSONB USING attributes::jsonb;

-- 2. INDEXING STRATEGY

-- Covering index for common "current state" and "history" queries
-- This allows index-only scans for common report data.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_device_fixtime_covering 
ON tc_positions (deviceid, fixtime) 
INCLUDE (latitude, longitude, speed, course, altitude);

-- BRIN index for massive historical tables (Block Range Index)
-- Extremely small compared to B-TREE. Best if data is inserted mostly in order of fixtime.
-- Only use this if you have 10M+ rows.
-- CREATE INDEX idx_positions_fixtime_brin ON tc_positions USING BRIN (fixtime);

-- Index for JSONB attributes (Example: fast search for 'ignition' status)
CREATE INDEX idx_positions_attributes_gin ON tc_positions USING GIN (attributes);

COMMIT;
