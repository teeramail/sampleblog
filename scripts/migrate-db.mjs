// Script to migrate database using Drizzle's migrator
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
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
    console.log("Connecting to database...");
    
    // Set up the Postgres connection
    const sql = postgres(dbUrl, {
      ssl: { rejectUnauthorized: false },
      max: 1
    });
    
    // Initialize Drizzle ORM
    const db = drizzle(sql);
    
    // Path to the migrations directory
    const migrationsFolder = path.join(__dirname, "..", "drizzle");
    console.log(`Using migrations from: ${migrationsFolder}`);
    
    // Before migration, check for existing tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    if (tables.length > 0) {
      console.log("Existing tables:", tables.map(t => t.table_name).join(", "));
    } else {
      console.log("No existing tables found. Ready for migration.");
    }
    
    // Run the migrations
    console.log("Starting migration...");
    await migrate(db, { migrationsFolder });
    console.log("Migration completed successfully!");
    
    // Verify tables after migration
    const tablesAfter = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log("Tables after migration:", tablesAfter.map(t => t.table_name).join(", "));
    
    // Close the database connection
    await sql.end();
    console.log("Database connection closed.");
    
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

main()
  .then(() => console.log("Migration process complete."))
  .catch(error => {
    console.error("Unhandled error:", error);
    process.exit(1);
  }); 