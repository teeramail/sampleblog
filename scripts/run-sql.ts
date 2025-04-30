// Script to run SQL commands from a file
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
dotenv.config();

async function runSqlFromFile(sqlFilePath: string) {
  console.log(`Reading SQL file: ${sqlFilePath}`);
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync(path.resolve(sqlFilePath), 'utf8');
    
    // Split the SQL file into separate commands (by semicolon)
    const commands = sql
      .split(';')
      .map(command => command.trim())
      .filter(command => command.length > 0);
    
    console.log(`Found ${commands.length} SQL commands to execute`);
    
    // Connect to the database
    console.log("Connecting to PostgreSQL database...");
    const client = postgres(process.env.DATABASE_URL!, {
      ssl: true,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 30,
    });
    
    // Execute each command
    console.log("Executing SQL commands...");
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`Executing command ${i + 1}/${commands.length}: ${command.slice(0, 50)}...`);
      await client.unsafe(command);
    }
    
    console.log("SQL commands executed successfully");
    
    // Verify the post table schema
    console.log("Verifying post table schema...");
    const newTableColumns = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'post'
      ORDER BY ordinal_position
    `;
    
    console.log("Post table schema:");
    newTableColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Close the connection
    await client.end();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error executing SQL commands:", error);
  }
}

// Get the SQL file path from command line arguments
const sqlFilePath = process.argv[2];

if (!sqlFilePath) {
  console.error("Please provide the path to the SQL file as an argument");
  process.exit(1);
}

// Run the function
runSqlFromFile(sqlFilePath).catch(console.error); 