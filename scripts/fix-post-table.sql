-- Drop post table if it exists
DROP TABLE IF EXISTS "post";

-- Create new post table with correct schema
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

-- Create indexes
CREATE INDEX "post_subject_idx" ON "post" USING btree ("subject");
CREATE INDEX "post_created_at_idx" ON "post" USING btree ("createdAt");
CREATE INDEX "post_updated_at_idx" ON "post" USING btree ("updatedAt"); 