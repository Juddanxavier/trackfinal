-- Migration: 0004_security_updates
-- Description: Security updates for sessions table - hash refresh tokens, add metadata tracking

-- Drop the old plaintext refresh_token column
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "refresh_token";

-- Add new secure columns
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "refresh_token_hash" text NOT NULL;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "refresh_token_version" integer NOT NULL DEFAULT 1;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "revoked_at" timestamp;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "user_agent" text;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "ip_address" text;

-- Create index for secure token lookup
CREATE INDEX IF NOT EXISTS "idx_sessions_token_hash" ON "sessions"("refresh_token_hash") WHERE "revoked_at" IS NULL;

-- Create index for session cleanup
CREATE INDEX IF NOT EXISTS "idx_sessions_expires_at" ON "sessions"("expires_at");
CREATE INDEX IF NOT EXISTS "idx_sessions_revoked" ON "sessions"("revoked") WHERE "revoked" = true;
