CREATE TYPE "public"."goods_type" AS ENUM('general', 'fragile', 'hazardous', 'perishable', 'electronics', 'machinery', 'chemicals', 'other');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('pending', 'quoted', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('pending', 'in_transit', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"type" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "verifications_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_to_id" uuid,
	"origin_country" text NOT NULL,
	"destination_country" text NOT NULL,
	"status" "quote_status" DEFAULT 'pending' NOT NULL,
	"goods_type" "goods_type" DEFAULT 'general' NOT NULL,
	"weight" numeric(10, 2) NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"remarks" text,
	"price" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title_key" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_to_id" uuid,
	"tracking_number" text NOT NULL,
	"white_label_tracking_code" text,
	"carrier_code" text NOT NULL,
	"recipient_name" text NOT NULL,
	"recipient_email" text,
	"recipient_phone" text,
	"recipient_address" text,
	"origin_country" text NOT NULL,
	"destination_country" text NOT NULL,
	"status" "shipment_status" DEFAULT 'pending' NOT NULL,
	"goods_type" text DEFAULT 'general',
	"weight" text,
	"track17_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;