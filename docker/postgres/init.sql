SELECT 'CREATE DATABASE desmos_test'
WHERE NOT EXISTS (
    SELECT
    FROM pg_database
    WHERE datname = 'desmos_test'
)\gexec
