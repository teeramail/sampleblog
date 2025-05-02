-- Add missing columns to the post table
ALTER TABLE post
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add comment to explain the purpose of this script
COMMENT ON TABLE post IS 'Post table with added timestamp columns to match Drizzle schema';

-- Create a function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to update the updated_at timestamp automatically
DROP TRIGGER IF EXISTS update_post_updated_at ON post;
CREATE TRIGGER update_post_updated_at
BEFORE UPDATE ON post
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Show the updated schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'post'
ORDER BY ordinal_position;
