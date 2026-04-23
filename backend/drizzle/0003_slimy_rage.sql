ALTER TYPE "public"."quote_status" ADD VALUE 'deleted';--> statement-breakpoint
ALTER TYPE "public"."shipment_status" ADD VALUE 'archived';--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "deleted_reason" text;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "deleted_reason" text;