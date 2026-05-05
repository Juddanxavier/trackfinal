-- Seed admin user and organisations
-- Run once only

DO $$
BEGIN
    -- Check if already seeded
    IF EXISTS (SELECT 1 FROM organisations WHERE slug = 'gajan-traders') THEN
        RAISE NOTICE 'Organisations already seeded, skipping';
        RETURN;
    END IF;

    -- Create Gajan Traders (India)
    INSERT INTO organisations (name, slug, email, phone, address, city, state, country_code, currency, is_active)
    VALUES ('Gajan Traders', 'gajan-traders', 'info@gajantraders.com', '+91 9000000001', '123 Market Road', 'Chennai', 'Tamil Nadu', 'IN', 'INR', true);

    -- Create Lanka Mahal (Sri Lanka)
    INSERT INTO organisations (name, slug, email, phone, address, city, state, country_code, currency, is_active)
    VALUES ('Lanka Mahal', 'lanka-mahal', 'info@lankamahal.com', '+94 700000001', '456 Temple Road', 'Colombo', 'Western', 'LK', 'LKR', true);

    -- Create GT Express organisation for admin
    INSERT INTO organisations (name, slug, email, phone, address, city, state, country_code, currency, is_active)
    VALUES ('GT Express', 'gt-express', 'juddan2008@gmail.com', '+1234567890', 'Admin HQ', 'Admin City', 'Admin State', 'US', 'USD', true);

    -- Create admin user
    INSERT INTO users (name, email, password_hash, role, organisation_id, is_active, email_verified)
    VALUES ('Admin', 'juddan2008@gmail.com', '$2b$10$110qbcm79Fi9FjeVIuFX/eG1BoeSYlFstmaJVZxHuuNeq0azD62jy', 'admin', (SELECT id FROM organisations WHERE slug = 'gt-express'), true, true);

    RAISE NOTICE 'Seeded: Gajan Traders, Lanka Mahal, GT Express, Admin user';
END
$$;