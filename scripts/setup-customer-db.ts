import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../src/env";
import * as schema from "../src/server/db/schema";
import { sql } from "drizzle-orm";

// Log the migration attempt
console.log("Setting up customer database schema...");
console.log(`Using database URL: ${env.DATABASE_URL.replace(/\/\/([^:]+):[^@]+@/, "//***:***@")}`);
console.log(`Using table prefix: "${env.DB_TABLE_PREFIX}"`);

async function main() {
  try {
    // Create a connection to the database
    const connectionConfig = {
      ssl: true,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    };

    const conn = postgres(env.DATABASE_URL, connectionConfig);
    const db = drizzle(conn, { schema });

    // Extract the database name from the URL
    const dbUrlParts = env.DATABASE_URL.split('/');
    const dbNameWithParams = dbUrlParts[dbUrlParts.length - 1] || '';
    const dbName = dbNameWithParams.split('?')[0];
    console.log(`Connected to database: ${dbName}`);

    // Check existing tables
    console.log("Checking existing tables...");
    const tables = await conn.unsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tables.length > 0) {
      console.log("Existing tables:", tables.map((t: any) => t.table_name).join(", "));
      
      // Drop existing customer tables if they exist
      const customerTables = tables
        .map((t: any) => t.table_name)
        .filter((name: string) => name.startsWith(env.DB_TABLE_PREFIX));
      
      if (customerTables.length > 0) {
        console.log(`Dropping existing ${env.DB_TABLE_PREFIX} tables:`, customerTables.join(", "));
        
        for (const tableName of customerTables) {
          console.log(`Dropping table: ${tableName}`);
          await conn.unsafe(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
        }
      }
    } else {
      console.log("No existing tables found.");
    }

    // Create customer table
    console.log(`Creating table: ${env.DB_TABLE_PREFIX}customer`);
    await conn.unsafe(`
      CREATE TABLE "${env.DB_TABLE_PREFIX}customer" (
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
    await conn.unsafe(`CREATE INDEX "customer_name_idx" ON "${env.DB_TABLE_PREFIX}customer" USING btree ("name")`);
    await conn.unsafe(`CREATE INDEX "customer_email_idx" ON "${env.DB_TABLE_PREFIX}customer" USING btree ("email")`);
    await conn.unsafe(`CREATE INDEX "customer_updated_at_idx" ON "${env.DB_TABLE_PREFIX}customer" USING btree ("updatedAt")`);

    // Insert sample data
    console.log("Inserting sample data...");
    await conn.unsafe(`
      INSERT INTO "${env.DB_TABLE_PREFIX}customer" ("name", "email", "phone")
      VALUES 
        ('John Doe', 'john@example.com', '+1234567890'),
        ('Jane Smith', 'jane@example.com', '+0987654321')
    `);

    // Verify data
    const customerCount = await conn.unsafe(`SELECT COUNT(*) FROM "${env.DB_TABLE_PREFIX}customer"`);
    console.log(`Created ${customerCount[0].count} sample customers.`);

    console.log("Schema setup complete!");
    
    // Close the connection
    await conn.end();
  } catch (error) {
    console.error("Error setting up schema:", error);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Unhandled error during schema setup:", e);
  process.exit(1);
});
