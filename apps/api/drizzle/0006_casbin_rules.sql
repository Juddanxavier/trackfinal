-- Casbin rules table for RBAC policies
CREATE TABLE IF NOT EXISTS "casbin_rule" (
  "id" serial PRIMARY KEY,
  "ptype" text NOT NULL,
  "v0" text,
  "v1" text,
  "v2" text,
  "v3" text,
  "v4" text,
  "v5" text
);

CREATE INDEX IF NOT EXISTS "idx_casbin_rule_ptype" ON "casbin_rule" ("ptype");
CREATE INDEX IF NOT EXISTS "idx_casbin_rule_v0" ON "casbin_rule" ("v0");