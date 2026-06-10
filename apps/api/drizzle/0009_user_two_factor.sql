CREATE TABLE IF NOT EXISTS "user_two_factor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"secret" text DEFAULT '',
	"verified" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"backup_codes" text[] DEFAULT '{}' NOT NULL,
	"pending_code_hash" text,
	"pending_code_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_two_factor_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_two_factor" ADD CONSTRAINT "user_two_factor_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
