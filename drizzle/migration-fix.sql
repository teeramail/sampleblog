-- Check if 'isQuestion' column exists in post table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'post' AND column_name = 'isQuestion'
    ) THEN
        -- Add isQuestion column to post table
        ALTER TABLE "post" ADD COLUMN "isQuestion" boolean DEFAULT true NOT NULL;
    END IF;
END $$;

-- Check if 'authorName' column exists in post table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'post' AND column_name = 'authorName'
    ) THEN
        -- Add authorName column to post table
        ALTER TABLE "post" ADD COLUMN "authorName" varchar(256);
    END IF;
END $$;

-- Check if 'answer' table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'answer'
    ) THEN
        -- Create the answer table
        CREATE TABLE "answer" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "postId" uuid NOT NULL,
            "content" text NOT NULL,
            "imageUrls" text[],
            "authorName" varchar(256),
            "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
            "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
            "isVerified" boolean DEFAULT false NOT NULL,
            CONSTRAINT "answer_postId_post_id_fk" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE cascade
        );

        -- Create indexes for the answer table
        CREATE INDEX "answer_post_id_idx" ON "answer" USING btree ("postId");
        CREATE INDEX "answer_created_at_idx" ON "answer" USING btree ("createdAt");
    END IF;
END $$; 