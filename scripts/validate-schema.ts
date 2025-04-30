import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");

if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`No .env file found at ${envPath}`);
  dotenv.config();
}

// Import schema at runtime to avoid import issues
const getSchema = async () => {
  try {
    return await import("../src/server/db/schema");
  } catch (error) {
    console.error("Error importing schema:", error);
    process.exit(1);
  }
};

// Utility function to format validation output
const formatValidationMessage = (message: string, isError = false) => {
  return isError 
    ? `❌ ${message}` 
    : `✅ ${message}`;
};

async function validateSchema(databaseUrl: string) {
  console.log(`\nValidating schema for ${databaseUrl.replace(/\/\/([^:]+):[^@]+@/, "//***:***@")}`);
  
  // Extract the database name from the URL
  const dbUrlParts = databaseUrl.split('/');
  const dbNameWithParams = dbUrlParts[dbUrlParts.length - 1] || '';
  const dbName = dbNameWithParams.split('?')[0];
  console.log(`Database: ${dbName}`);
  
  try {
    // Establish connection
    const connectionConfig = {
      ssl: true,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    };

    const conn = postgres(databaseUrl, connectionConfig);
    const schema = await getSchema();
    const db = drizzle(conn, { schema });
    
    // Check if tables exist in the database
    console.log("Checking database schema...");
    const tables = await conn.unsafe(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    
    // Group columns by table name
    const tableColumnsMap = new Map();
    tables.forEach((column: any) => {
      if (!tableColumnsMap.has(column.table_name)) {
        tableColumnsMap.set(column.table_name, []);
      }
      tableColumnsMap.get(column.table_name).push({
        name: column.column_name,
        type: column.data_type,
        nullable: column.is_nullable === 'YES'
      });
    });
    
    // Output all tables found
    console.log(`Found ${tableColumnsMap.size} tables: ${[...tableColumnsMap.keys()].join(', ')}`);
    
    // Check if customer table exists and has expected columns
    if (tableColumnsMap.has('customer')) {
      console.log(formatValidationMessage('Customer table found'));
      
      const customerColumns = tableColumnsMap.get('customer');
      const requiredColumns = [
        { name: 'id', type: 'uuid' },
        { name: 'name', type: 'character varying' },
        { name: 'email', type: 'character varying' },
        { name: 'phone', type: 'character varying', nullable: true },
        { name: 'thumbnailUrl', type: 'text', nullable: true },
        { name: 'imageUrls', type: 'ARRAY', nullable: true },
        { name: 'createdAt', type: 'timestamp with time zone' },
        { name: 'updatedAt', type: 'timestamp with time zone' }
      ];
      
      // Validate each required column
      let columnsValid = true;
      requiredColumns.forEach(col => {
        const dbColumn = customerColumns.find(c => c.name === col.name);
        if (!dbColumn) {
          console.log(formatValidationMessage(`Missing column: ${col.name}`, true));
          columnsValid = false;
        } else {
          // For array type, just check if it contains "ARRAY"
          const typeMatches = col.type === 'ARRAY' 
            ? dbColumn.type.includes('ARRAY') 
            : dbColumn.type === col.type;
            
          const nullableMatches = col.nullable === undefined || dbColumn.nullable === col.nullable;
          
          if (typeMatches && nullableMatches) {
            console.log(formatValidationMessage(`Column ${col.name} has correct type and nullability`));
          } else {
            columnsValid = false;
            if (!typeMatches) {
              console.log(formatValidationMessage(`Column ${col.name} has incorrect type: expected ${col.type}, got ${dbColumn.type}`, true));
            }
            if (!nullableMatches) {
              console.log(formatValidationMessage(`Column ${col.name} has incorrect nullability: expected ${col.nullable}, got ${dbColumn.nullable}`, true));
            }
          }
        }
      });
      
      // Check for indexes
      const indexes = await conn.unsafe(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'customer'
      `);
      
      const requiredIndexes = [
        { name: 'customer_name_idx' },
        { name: 'customer_email_idx' },
        { name: 'customer_updated_at_idx' }
      ];
      
      let indexesValid = true;
      requiredIndexes.forEach(idx => {
        const dbIndex = indexes.find((i: any) => i.indexname === idx.name);
        if (dbIndex) {
          console.log(formatValidationMessage(`Index ${idx.name} exists`));
        } else {
          console.log(formatValidationMessage(`Missing index: ${idx.name}`, true));
          indexesValid = false;
        }
      });
      
      const isValid = columnsValid && indexesValid;
      console.log(formatValidationMessage(`Customer table schema is ${isValid ? 'valid' : 'invalid'}`, !isValid));
      
    } else {
      console.log(formatValidationMessage('Customer table not found', true));
      console.log("Available tables:", [...tableColumnsMap.keys()].join(', '));
    }
    
    console.log("Schema validation completed");
    await conn.end();
    return true;
    
  } catch (error) {
    console.error("Error validating schema:", error);
    return false;
  }
}

// Main function to validate schemas across all databases
async function main() {
  // URLs for all three databases
  const databaseUrls = [
    process.env.DATABASE_URL!, // Current active database
    "postgresql://muaythai_owner:npg_uo1cbjDyXRx0@ep-hidden-morning-a134x57e-pooler.ap-southeast-1.aws.neon.tech/keepdoc?sslmode=require",
    "postgresql://muaythai_owner:npg_uo1cbjDyXRx0@ep-hidden-morning-a134x57e-pooler.ap-southeast-1.aws.neon.tech/customer?sslmode=require",
    "postgresql://muaythai_owner:npg_uo1cbjDyXRx0@ep-hidden-morning-a134x57e-pooler.ap-southeast-1.aws.neon.tech/realsamui?sslmode=require"
  ];
  
  // Remove duplicates
  const uniqueUrls = [...new Set(databaseUrls)];
  
  // Validate each database
  let allValid = true;
  for (const url of uniqueUrls) {
    const isValid = await validateSchema(url);
    if (!isValid) allValid = false;
    console.log("-----------------------------------");
  }
  
  return allValid;
}

// Run the validation
main()
  .then(success => {
    if (success) {
      console.log("✅ All schema validations processed");
      process.exit(0);
    } else {
      console.error("❌ Schema validation encountered errors");
      process.exit(1);
    }
  })
  .catch(error => {
    console.error("Unhandled error:", error);
    process.exit(1);
  }); 