-- SCALED DATABASE INITIALIZATION
-- This script sets up a partitioned 'tc_positions' table for high-volume tracking data.

-- 1. Create the template for the main positions table
CREATE TABLE IF NOT EXISTS public.tc_positions (
    id SERIAL,
    protocol VARCHAR(128),
    deviceid INTEGER NOT NULL,
    servertime TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    devicetime TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    fixtime TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    valid BOOLEAN NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION NOT NULL,
    course DOUBLE PRECISION NOT NULL,
    address VARCHAR(512),
    attributes VARCHAR(4000),
    accuracy DOUBLE PRECISION DEFAULT 0 NOT NULL,
    network VARCHAR(4000)
) PARTITION BY RANGE (fixtime);

-- 2. Create sample partitions (Weekly)
CREATE TABLE tc_positions_y2026_w15 PARTITION OF tc_positions
    FOR VALUES FROM ('2026-04-06') TO ('2026-04-13');

CREATE TABLE tc_positions_y2026_w16 PARTITION OF tc_positions
    FOR VALUES FROM ('2026-04-13') TO ('2026-04-20');

CREATE TABLE tc_positions_y2026_w17 PARTITION OF tc_positions
    FOR VALUES FROM ('2026-04-20') TO ('2026-04-27');

-- 3. Optimization: Add indexes to partitions automatically via the parent table
CREATE INDEX IF NOT EXISTS idx_positions_deviceid_fixtime ON tc_positions (deviceid, fixtime);
CREATE INDEX IF NOT EXISTS idx_positions_fixtime ON tc_positions (fixtime);

-- 4. Retention Policy (Conceptual)
-- To purge data older than 3 months:
-- DROP TABLE tc_positions_yXXXX_wXX;
