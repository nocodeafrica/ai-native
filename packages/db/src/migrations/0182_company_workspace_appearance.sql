ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "workspace_background_kind" text DEFAULT 'preset' NOT NULL;
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "workspace_background_preset" text DEFAULT 'ainative-ambient' NOT NULL;
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "workspace_background_position" text DEFAULT 'center' NOT NULL;
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "workspace_background_presence" text DEFAULT 'balanced' NOT NULL;
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "workspace_glass_character" text DEFAULT 'balanced' NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company_workspace_backgrounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM "pg_constraint" WHERE "conname" = 'company_workspace_backgrounds_company_id_companies_id_fk'
	) THEN
		ALTER TABLE "company_workspace_backgrounds" ADD CONSTRAINT "company_workspace_backgrounds_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM "pg_constraint" WHERE "conname" = 'company_workspace_backgrounds_asset_id_assets_id_fk'
	) THEN
		ALTER TABLE "company_workspace_backgrounds" ADD CONSTRAINT "company_workspace_backgrounds_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "company_workspace_backgrounds_company_uq" ON "company_workspace_backgrounds" USING btree ("company_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "company_workspace_backgrounds_asset_uq" ON "company_workspace_backgrounds" USING btree ("asset_id");
