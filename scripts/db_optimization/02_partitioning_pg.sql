-- PostgreSQL Declarative Partitioning for tc_positions
-- Author: Database Expert

-- IMPORTANT: This script creates a NEW partitioned table. 
-- For existing data, you must migrate it carefully.

BEGIN;

-- 1. Create the partitioned table
CREATE TABLE tc_positions_partitioned (
    id BIGINT,
    protocol VARCHAR(128),
    deviceid INT NOT NULL,
    servertime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    devicetime TIMESTAMP NOT NULL,
    fixtime TIMESTAMP NOT NULL,
    valid BOOLEAN NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude REAL NOT NULL,
    speed REAL NOT NULL,
    course REAL NOT NULL,
    address VARCHAR(512),
    attributes JSONB,
    accuracy DOUBLE PRECISION NOT NULL DEFAULT 0,
    network VARCHAR(4000)
) PARTITION BY RANGE (fixtime);

-- 2. Create initial partitions (Example: monthly)
CREATE TABLE tc_positions_y2026m04 PARTITION OF tc_positions_partitioned
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE tc_positions_y2026m05 PARTITION OF tc_positions_partitioned
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- 3. Create indices on the partitioned table
CREATE INDEX idx_pos_part_device_fixtime ON tc_positions_partitioned (deviceid, fixtime);

-- 4. Migration Strategy (Manual Step)
/*
INSERT INTO tc_positions_partitioned 
SELECT * FROM tc_positions;

ALTER TABLE tc_positions RENAME TO tc_positions_old;
ALTER TABLE tc_positions_partitioned RENAME TO tc_positions;
*/

COMMIT;
