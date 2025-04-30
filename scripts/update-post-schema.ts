import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import { sql } from "drizzle-orm";

// Load environment variables
dotenv.config();

async function updatePostSchema() {
  console.log("Connecting to PostgreSQL database...");
  
  try {
    // Create a connection to the database
    const client = postgres(process.env.DATABASE_URL!, {
      ssl: true,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 30,
    });
    
    const db = drizzle(client);

    console.log("Connection established, updating post table schema...");

    // First, check if post_old already exists
    console.log("Checking if post_old table exists...");
    const postOldExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'post_old'
      )
    `;

    // Check if post table exists
    console.log("Checking if post table exists...");
    const postExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'post'
      )
    `;

    // If both tables exist, we need to drop the post table first
    if (postOldExists[0].exists && postExists[0].exists) {
      console.log("Both post and post_old tables exist, dropping post table...");
      await client`DROP TABLE IF EXISTS post`;
    }
    // If only post exists, rename it to post_old
    else if (postExists[0].exists) {
      console.log("Backing up existing post table...");
      await client`ALTER TABLE post RENAME TO post_old`;
    }

    // Create the new post table with the correct schema
    console.log("Creating new post table with updated schema...");
    await client`
      CREATE TABLE IF NOT EXISTS "post" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "subject" varchar(256) NOT NULL,
        "content" text NOT NULL,
        "thumbnailUrl" text NOT NULL,
        "imageUrls" text[],
        "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "isActive" boolean DEFAULT true NOT NULL
      )
    `;

    // Transfer data from the old table if it exists
    if (postOldExists[0].exists) {
      console.log("Checking column names in the old table...");
      const oldTableColumns = await client`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'post_old'
      `;
      
      console.log("Columns in post_old table:", oldTableColumns.map(col => col.column_name));
      
      console.log("Transferring data from old table to new table...");
      
      // Check if the table already has data
      const existingCount = await client`SELECT COUNT(*) FROM post`;
      if (existingCount[0].count > 0) {
        console.log("New post table already has data, skipping data transfer");
      } else {
        // Dynamically build the SQL based on the columns we find
        const hasNameColumn = oldTableColumns.some(col => col.column_name === 'name');
        const hasUpdatedAtColumn = oldTableColumns.some(col => col.column_name === 'updatedAt');
        const hasCreatedAtColumn = oldTableColumns.some(col => col.column_name === 'createdAt');
        
        // Use a different approach based on available columns
        if (hasNameColumn && hasCreatedAtColumn) {
          // Build the appropriate SQL query based on column existence
          if (hasUpdatedAtColumn) {
            await client`
              INSERT INTO post (
                id, subject, content, thumbnailUrl, imageUrls, createdAt, updatedAt, isActive
              )
              SELECT 
                gen_random_uuid(),  -- Generate new UUIDs
                name,               -- name becomes subject
                'Content pending',  -- default content text 
                'https://placeholder.com/150',  -- default thumbnail
                NULL,               -- null imageUrls
                "createdAt",
                "updatedAt",
                true                -- isActive defaults to true
              FROM post_old
            `;
          } else {
            await client`
              INSERT INTO post (
                id, subject, content, thumbnailUrl, imageUrls, createdAt, updatedAt, isActive
              )
              SELECT 
                gen_random_uuid(),  -- Generate new UUIDs
                name,               -- name becomes subject
                'Content pending',  -- default content text 
                'https://placeholder.com/150',  -- default thumbnail
                NULL,               -- null imageUrls
                "createdAt",
                "createdAt",        -- Use createdAt as updatedAt
                true                -- isActive defaults to true
              FROM post_old
            `;
          }
          console.log("Data transfer complete.");
        } else {
          console.log("Required columns not found in old table, skipping data transfer");
        }
      }
    } else {
      console.log("No existing data to transfer (post_old table doesn't exist).");
    }

    // Create indexes on the new table
    console.log("Creating indexes on the new post table...");
    
    // First check if indexes already exist
    const subjectIndexExists = await client`
      SELECT EXISTS (
        SELECT FROM pg_indexes
        WHERE tablename = 'post'
        AND indexname = 'post_subject_idx'
      )
    `;
    
    if (!subjectIndexExists[0].exists) {
      await client`CREATE INDEX "post_subject_idx" ON "post" USING btree ("subject")`;
    } else {
      console.log("Subject index already exists, skipping...");
    }
    
    const createdAtIndexExists = await client`
      SELECT EXISTS (
        SELECT FROM pg_indexes
        WHERE tablename = 'post'
        AND indexname = 'post_created_at_idx'
      )
    `;
    
    if (!createdAtIndexExists[0].exists) {
      await client`CREATE INDEX "post_created_at_idx" ON "post" USING btree ("createdAt")`;
    } else {
      console.log("CreatedAt index already exists, skipping...");
    }
    
    const updatedAtIndexExists = await client`
      SELECT EXISTS (
        SELECT FROM pg_indexes
        WHERE tablename = 'post'
        AND indexname = 'post_updated_at_idx'
      )
    `;
    
    if (!updatedAtIndexExists[0].exists) {
      await client`CREATE INDEX "post_updated_at_idx" ON "post" USING btree ("updatedAt")`;
    } else {
      console.log("UpdatedAt index already exists, skipping...");
    }

    console.log("Post table schema update completed successfully.");
    
    // Verify the new schema matches our Drizzle schema
    console.log("Verifying post table schema...");
    const newTableColumns = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'post'
      ORDER BY ordinal_position
    `;
    
    console.log("New post table schema:");
    newTableColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Close the connection
    await client.end();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error updating post table schema:", error);
  }
}

// Run the function
updatePostSchema().catch(console.error); 