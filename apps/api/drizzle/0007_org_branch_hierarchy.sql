-- Add organisation hierarchy (parent_id) and branch flag
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES organisations(id);
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS is_branch boolean DEFAULT false;

-- Add branch_id to users for branch assignment
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES organisations(id);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);

-- Example data: Create branches under Sri Lanka
-- First, get the Sri Lanka organisation ID and update accordingly
-- UPDATE organisations SET is_branch = true WHERE parent_id IS NOT NULL;