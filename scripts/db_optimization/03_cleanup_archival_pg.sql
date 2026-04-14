-- PostgreSQL Cleanup and Archival Script for Traccar
-- Author: Database Expert

-- 1. Create Archival Table (if not using partitioning)
-- Using a compressed table structure is recommended.
CREATE TABLE IF NOT EXISTS tc_positions_archive (
    LIKE tc_positions INCLUDING ALL
);

-- 2. Stored Procedure for Archival
CREATE OR REPLACE PROCEDURE archive_old_positions(retention_days INT)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Move data older than X days to archive table
    WITH moved_rows AS (
        DELETE FROM tc_positions
        WHERE fixtime < NOW() - (retention_days || ' days')::INTERVAL
        RETURNING *
    )
    INSERT INTO tc_positions_archive SELECT * FROM moved_rows;

    -- Optional: Delete very old data from archive (e.g., after 1 year)
    DELETE FROM tc_positions_archive 
    WHERE fixtime < NOW() - INTERVAL '365 days';
    
    COMMIT;
END;
$$;

-- Example usage: CALL archive_old_positions(90);

-- 3. Maintenance Tip
-- For non-partitioned tables, run VACUUM ANALYZE regularly.
-- VACUUM ANALYZE tc_positions;
