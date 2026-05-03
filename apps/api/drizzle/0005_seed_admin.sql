-- Seed admin user
-- Run once only

DO $$
DECLARE
    org_id UUID;
BEGIN
    -- Check if admin already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = 'juddan2008@gmail.com') THEN
        RAISE NOTICE 'Admin user already exists, skipping seed';
        RETURN;
    END IF;

    -- Create organisation
    INSERT INTO organisations (name, slug, email, phone, address, city, state, country_code, currency, is_active)
    VALUES ('GT Express', 'gt-express', 'juddan2008@gmail.com', '+1234567890', 'Admin HQ', 'Admin City', 'Admin State', 'US', 'USD', true)
    RETURNING id INTO org_id;

    -- Create admin user
    INSERT INTO users (name, email, password_hash, role, organisation_id, is_active, email_verified)
    VALUES ('Admin', 'juddan2008@gmail.com', '$2b$10$110qbcm79Fi9FjeVIuFX/eG1BoeSYlFstmaJVZxHuuNeq0azD62jy', 'admin', org_id, true, true);

    RAISE NOTICE 'Admin user seeded: juddan2008@gmail.com / B7a90sfd@12';
END
$$;