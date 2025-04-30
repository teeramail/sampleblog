import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
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

// This script runs migrations on the database
async function main() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }
  
  // Extract the database name from the URL for logging
  const dbUrlParts = DATABASE_URL.split('/');
  const dbNameWithParams = dbUrlParts[dbUrlParts.length - 1] || '';
  const dbName = dbNameWithParams.split('?')[0];
  console.log(`Running migrations on database: ${dbName}`);
  
  const connection = postgres(DATABASE_URL, { 
    max: 1,
    ssl: {
      rejectUnauthorized: false
    }
  });
  const db = drizzle(connection);

  console.log("Running migrations...");
  
  await migrate(db, { migrationsFolder: "drizzle" });
  
  console.log("Migrations completed successfully");
  
  await connection.end();
}

main().catch((e) => {
  console.error("Migration failed:");
  console.error(e);
  process.exit(1);
});
