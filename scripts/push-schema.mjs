// Script to push Drizzle schema to the database
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../src/server/db/schema.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log(`Using database URL: ${dbUrl.replace(/\/\/([^:]+):[^@]+@/, "//***:***@")}`);

// Extract database name from URL
const dbUrlParts = dbUrl.split('/');
const dbNameWithParams = dbUrlParts[dbUrlParts.length - 1] || '';
const dbName = dbNameWithParams.split('?')[0];
console.log(`Working with database: ${dbName}`);

async function main() {
  try {
    // Create a connection to the database
    const connectionConfig = {
      ssl: true,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    };

    console.log("Connecting to database...");
    const conn = postgres(dbUrl, connectionConfig);
    const db = drizzle(conn, { schema });

    // Check if the tables exist
    console.log("Checking existing tables...");
    const tables = await conn.unsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tables.length > 0) {
      console.log("Existing tables:", tables.map(t => t.table_name).join(", "));
    } else {
      console.log("No existing tables found.");
    }

    // Create tables based on schema
    console.log("Creating tables from schema...");
    
    // Create the customers table
    await conn.unsafe(`
      CREATE TABLE IF NOT EXISTS "customer" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" varchar(256) NOT NULL,
        "email" varchar(256) NOT NULL,
        "phone" varchar(50),
        "thumbnailUrl" text,
        "imageUrls" text[],
        "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    
    // Create indexes
    console.log("Creating indexes...");
    await conn.unsafe(`CREATE INDEX IF NOT EXISTS "customer_name_idx" ON "customer" USING btree ("name")`);
    await conn.unsafe(`CREATE INDEX IF NOT EXISTS "customer_email_idx" ON "customer" USING btree ("email")`);
    await conn.unsafe(`CREATE INDEX IF NOT EXISTS "customer_updated_at_idx" ON "customer" USING btree ("updatedAt")`);
    
    // Insert sample data
    console.log("Inserting sample data...");
    await conn.unsafe(`
      INSERT INTO "customer" ("name", "email", "phone")
      VALUES 
        ('John Doe', 'john@example.com', '+1234567890'),
        ('Jane Smith', 'jane@example.com', '+0987654321')
    `);
    
    // Verify tables
    const verifyTables = await conn.unsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log("Tables created:", verifyTables.map(t => t.table_name).join(", "));
    
    // Count records
    const customerCount = await conn.unsafe(`SELECT COUNT(*) FROM "customer"`);
    console.log(`Created ${customerCount[0].count} sample customers.`);
    
    console.log("Schema push complete!");
    
    // Close the connection
    await conn.end();
  } catch (error) {
    console.error("Error pushing schema:", error);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Unhandled error during schema push:", e);
  process.exit(1);
});
