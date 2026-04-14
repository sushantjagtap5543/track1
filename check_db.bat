@ECHO OFF
SET PGPASSWORD=change-this-to-something-long-and-random
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -h 127.0.0.1 -U postgres -d postgres -c "SELECT 1"
