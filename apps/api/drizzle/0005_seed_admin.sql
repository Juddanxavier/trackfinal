-- Seed admin user
-- Run once only

DO $$
DECLARE
    gajan_id UUID;
    lanka_id UUID;
BEGIN
    -- Create Gajan Traders (India)
    INSERT INTO organisations (name, slug, email, phone, address, city, state, country_code, currency, is_active)
    VALUES ('Gajan Traders', 'gajan-traders', 'info@gajantraders.com', '+91 9000000001', '123 Market Road', 'Chennai', 'Tamil Nadu', 'IN', 'INR', true)
    RETURNING id INTO gajan_id;

    -- Create Lanka Mahal (Sri Lanka)
    INSERT INTO organisations (name, slug, email, phone, address, city, state, country_code, currency, is_active)
    VALUES ('Lanka Mahal', 'lanka-mahal', 'info@lankamahal.com', '+94 700000001', '456 Temple Road', 'Colombo', 'Western', 'LK', 'LKR', true)
    RETURNING id INTO lanka_id;

    -- Check if admin already exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'juddan2008@gmail.com') THEN
        -- Create GT Express organisation for admin
        INSERT INTO organisations (name, slug, email, phone, address, city, state, country_code, currency, is_active)
        VALUES ('GT Express', 'gt-express', 'juddan2008@gmail.com', '+1234567890', 'Admin HQ', 'Admin City', 'Admin State', 'US', 'USD', true);

        -- Create admin user
        INSERT INTO users (name, email, password_hash, role, organisation_id, is_active, email_verified)
        VALUES ('Admin', 'juddan2008@gmail.com', '$2b$10$110qbcm79Fi9FjeVIuFX/eG1BoeSYlFstmaJVZxHuuNeq0azD62jy', 'admin', (SELECT id FROM organisations WHERE slug = 'gt-express'), true, true);

        RAISE NOTICE 'Admin user seeded: juddan2008@gmail.com / B7a90sfd@12';
    ELSE
        RAISE NOTICE 'Admin user already exists, skipping';
    END IF;

    RAISE NOTICE 'Organisations seeded: Gajan Traders (IN), Lanka Mahal (LK), GT Express (US)';
END
$$;