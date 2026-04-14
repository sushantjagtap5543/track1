-- MySQL Range Partitioning for tc_positions
-- Author: Database Expert

-- IMPORTANT: This will alter the table structure.
-- For large tables, this operation can take a long time and might lock the table.

ALTER TABLE tc_positions
PARTITION BY RANGE (TO_DAYS(fixtime)) (
    PARTITION p2026_01 VALUES LESS THAN (TO_DAYS('2026-02-01')),
    PARTITION p2026_02 VALUES LESS THAN (TO_DAYS('2026-03-01')),
    PARTITION p2026_03 VALUES LESS THAN (TO_DAYS('2026-04-01')),
    PARTITION p2026_04 VALUES LESS THAN (TO_DAYS('2026-05-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- How to add a new partition later:
-- ALTER TABLE tc_positions REORGANIZE PARTITION p_future INTO (
--     PARTITION p2026_05 VALUES LESS THAN (TO_DAYS('2026-06-01')),
--     PARTITION p_future VALUES LESS THAN MAXVALUE
-- );
