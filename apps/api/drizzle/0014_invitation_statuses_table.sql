-- Ensure invitation_statuses table exists with all columns
CREATE TABLE IF NOT EXISTS invitation_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  organisation_id UUID NOT NULL REFERENCES organisations(id),
  branch_id UUID REFERENCES branches(id),
  role TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  user_id UUID,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Add branch_id if missing (for existing tables from before migration 0008)
ALTER TABLE invitation_statuses ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
