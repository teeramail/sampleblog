CREATE TABLE "customer" (
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
CREATE TABLE "post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" varchar(256) NOT NULL,
	"content" text NOT NULL,
	"thumbnailUrl" text NOT NULL,
	"imageUrls" text[],
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE INDEX "customer_name_idx" ON "customer" USING btree ("name");--> statement-breakpoint
CREATE INDEX "customer_email_idx" ON "customer" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customer_updated_at_idx" ON "customer" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "post_subject_idx" ON "post" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "post_created_at_idx" ON "post" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "post_updated_at_idx" ON "post" USING btree ("updatedAt");