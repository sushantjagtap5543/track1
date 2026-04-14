@ECHO OFF
SET PGPASSWORD=change-this-to-something-long-and-random
SET PSQL="C:\Program Files\PostgreSQL\16\bin\psql.exe" -h 127.0.0.1 -U postgres

ECHO Creating database and user...
%PSQL% -c "CREATE USER geosurepath WITH PASSWORD 'change-this-to-something-long-and-random';"
%PSQL% -c "CREATE DATABASE geosurepath OWNER geosurepath;"
%PSQL% -c "GRANT ALL PRIVILEGES ON DATABASE geosurepath TO geosurepath;"

ECHO Database setup complete.
