-- Add website_url and tracking_domain columns to organisations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organisations' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE organisations ADD COLUMN website_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organisations' AND column_name = 'tracking_domain'
  ) THEN
    ALTER TABLE organisations ADD COLUMN tracking_domain TEXT;
  END IF;
END $$;
