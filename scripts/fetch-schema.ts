// Script to fetch database schema information
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function fetchDatabaseSchema() {
  console.log("Connecting to PostgreSQL database...");
  
  try {
    // Create a simple connection to the database
    const sql = postgres(process.env.DATABASE_URL!, {
      ssl: true,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 30, // Longer timeout for initial connection
    });

    console.log("Connection established, fetching schema information...");

    // Query to get table information
    const tables = await sql`
      SELECT 
        table_schema, 
        table_name 
      FROM 
        information_schema.tables 
      WHERE 
        table_schema NOT IN ('pg_catalog', 'information_schema')
        AND table_type = 'BASE TABLE'
      ORDER BY 
        table_schema, table_name;
    `;

    console.log("\n=== DATABASE TABLES ===");
    for (const table of tables) {
      console.log(`${table.table_schema}.${table.table_name}`);
      
      // Query to get column information for this table
      const columns = await sql`
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default
        FROM 
          information_schema.columns
        WHERE 
          table_schema = ${table.table_schema}
          AND table_name = ${table.table_name}
        ORDER BY 
          ordinal_position;
      `;
      
      console.log("  Columns:");
      for (const column of columns) {
        console.log(`    - ${column.column_name} (${column.data_type})${column.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'}${column.column_default ? ` DEFAULT ${column.column_default}` : ''}`);
      }
      console.log("");
    }

    // Close the connection
    await sql.end();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
}

// Run the function
fetchDatabaseSchema().catch(console.error);
