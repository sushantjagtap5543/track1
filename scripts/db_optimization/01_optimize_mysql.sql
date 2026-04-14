-- MySQL Optimization Script for Traccar
-- Target: High-volume positions and events
-- Author: Database Expert

-- 1. SCHEMA IMPROVEMENTS
-- Upgrade id columns to BIGINT if they aren't already
ALTER TABLE tc_positions MODIFY id BIGINT AUTO_INCREMENT;
ALTER TABLE tc_events MODIFY id BIGINT AUTO_INCREMENT;

-- 2. INDEXING STRATEGY

-- In MySQL, we want a composite index for range scans on device + time
-- This is already present in most Traccar versions, but ensure it's there
CREATE INDEX idx_positions_device_fixtime ON tc_positions (deviceid, fixtime);

-- Optimization for "Latest Position" query
-- Traccar often queries the latest position for a device
CREATE INDEX idx_positions_device_id_desc ON tc_positions (deviceid, id DESC);

-- 3. STORAGE ENGINE (Optional)
-- Ensure InnoDB is used and configured properly (innodb_buffer_pool_size is key)
-- ALTER TABLE tc_positions ENGINE=InnoDB;
