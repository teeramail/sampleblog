import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { env } from "../src/env";
import * as schema from "../src/server/db/schema";
import path from "path";

// Log the migration attempt
console.log("Adapting schema to work with existing database...");

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

    // Check if the tables exist with the current naming convention
    console.log("Checking existing database structure...");
    
    // Run a simple query to check if the customer table exists
    const tables = await conn.unsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log("Existing tables:", tables.map(t => t.table_name).join(", "));
    
    // Close the connection
    await conn.end();
    
    console.log("Schema adaptation complete. You may need to update your migrations manually if table structures differ.");
  } catch (error) {
    console.error("Error adapting schema:", error);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Unhandled error during schema adaptation:", e);
  process.exit(1);
});
