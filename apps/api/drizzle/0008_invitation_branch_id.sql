-- Add branch_id column to invitation_statuses
ALTER TABLE invitation_statuses ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES organisations(id);