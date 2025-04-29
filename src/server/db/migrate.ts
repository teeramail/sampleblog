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

// For migrations, we need to use the direct connection string
const DATABASE_URL = "postgresql://muaythai_owner:npg_uo1cbjDyXRx0@ep-hidden-morning-a134x57e-pooler.ap-southeast-1.aws.neon.tech/realsamui?sslmode=require";

// This script runs migrations on the database
async function main() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }
  
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
