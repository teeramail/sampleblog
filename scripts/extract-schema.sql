-- Extract database schema information
-- This script will extract table and column information from the current database
-- It uses the database name from the connection context

-- Create a temporary function to get the current database name
DO $$
DECLARE
    current_db TEXT;
BEGIN
    -- Get the current database name
    SELECT current_database() INTO current_db;
    
    -- Output the database name
    RAISE NOTICE 'Extracting schema from database: %', current_db;
END $$;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extract table and column information
SELECT 
    table_name, 
    column_name, 
    data_type, 
    character_maximum_length, 
    column_default, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name, 
    ordinal_position;

-- Additional query to get primary key information
SELECT
    tc.table_name,
    kc.column_name
FROM
    information_schema.table_constraints tc
JOIN
    information_schema.key_column_usage kc ON kc.constraint_name = tc.constraint_name
WHERE
    tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY
    tc.table_name;

-- Additional query to get foreign key information
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints tc
JOIN
    information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN
    information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY
    tc.table_name;

-- Additional query to get index information
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
ORDER BY
    tablename,
    indexname;
