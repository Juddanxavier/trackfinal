-- Add superadmin to the role enum (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'superadmin' AND enumtypid = 'role'::regtype) THEN
    ALTER TYPE "role" ADD VALUE 'superadmin';
  END IF;
END $$;
