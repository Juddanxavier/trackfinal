ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "branch_id" uuid;
--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "notify_on_update" jsonb DEFAULT '{"email":true,"sms":false}'::jsonb;
--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "notify_email" text;
--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "bill_amount" numeric(10, 2);
--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "last_invoice_email_sent_at" timestamp;
