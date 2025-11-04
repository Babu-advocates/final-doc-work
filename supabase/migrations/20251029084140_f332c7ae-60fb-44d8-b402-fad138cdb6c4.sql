-- Add table_type column to deeds table to support multiple independent tables
ALTER TABLE deeds
ADD COLUMN IF NOT EXISTS table_type TEXT DEFAULT 'table';

-- Add comment for documentation
COMMENT ON COLUMN deeds.table_type IS 'Table type identifier (table, table2, table3, table4) to support multiple independent deed tables';