-- MySQL Cleanup and Archival Script for Traccar
-- Author: Database Expert

-- 1. Create Archival Table
CREATE TABLE IF NOT EXISTS tc_positions_archive LIKE tc_positions;

-- 2. Stored Procedure for Archival
DELIMITER //

CREATE PROCEDURE archive_old_positions(IN retention_days INT)
BEGIN
    -- Move data older than X days to archive table
    INSERT INTO tc_positions_archive
    SELECT * FROM tc_positions
    WHERE fixtime < DATE_SUB(NOW(), INTERVAL retention_days DAY);

    -- Delete moved data from live table
    DELETE FROM tc_positions
    WHERE fixtime < DATE_SUB(NOW(), INTERVAL retention_days DAY);

    -- Optional: Delete very old data from archive (e.g., after 1 year)
    DELETE FROM tc_positions_archive 
    WHERE fixtime < DATE_SUB(NOW(), INTERVAL 365 DAY);
END //

DELIMITER ;

-- 3. MySQL Event (Scheduled Task)
-- Enable event scheduler: SET GLOBAL event_scheduler = ON;
-- CREATE EVENT IF NOT EXISTS daily_archive_event
-- ON SCHEDULE EVERY 1 DAY
-- STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 2 HOUR)
-- DO CALL archive_old_positions(90);
