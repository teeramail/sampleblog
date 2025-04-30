import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../..");
const envPath = path.join(rootDir, ".env");

if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`No .env file found at ${envPath}`);
  dotenv.config();
}

// Get DATABASE_URL from environment variables
const DATABASE_URL = process.env.DATABASE_URL;

// This script executes a custom SQL migration file
async function main() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }
  
  // Extract the database name from the URL for logging
  const dbUrlParts = DATABASE_URL.split('/');
  const dbNameWithParams = dbUrlParts[dbUrlParts.length - 1] || '';
  const dbName = dbNameWithParams.split('?')[0];
  console.log(`Executing custom migration on database: ${dbName}`);
  
  const migrationPath = path.join(rootDir, "drizzle", "migration-fix.sql");
  
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found at ${migrationPath}`);
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  const connection = postgres(DATABASE_URL, { 
    max: 1,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  console.log("Executing custom SQL migration...");
  
  try {
    await connection.unsafe(migrationSQL);
    console.log("Migration executed successfully");
  } catch (error) {
    console.error("Error executing migration:");
    console.error(error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((e) => {
  console.error("Migration failed:");
  console.error(e);
  process.exit(1);
}); 