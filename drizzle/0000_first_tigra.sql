CREATE TABLE "realestate_customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"phone" varchar(50),
	"thumbnailUrl" text,
	"imageUrls" text[],
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX "customer_name_idx" ON "realestate_customer" USING btree ("name");--> statement-breakpoint
CREATE INDEX "customer_email_idx" ON "realestate_customer" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customer_updated_at_idx" ON "realestate_customer" USING btree ("updatedAt");