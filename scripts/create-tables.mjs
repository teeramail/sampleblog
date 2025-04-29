// Script to directly create tables from migration SQL files
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

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

// Function to read and execute SQL files
async function executeSQLFile(client, filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    // Split by statement breakpoint marker and filter empty statements
    const statements = sql.split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Executing ${statements.length} SQL statements from ${path.basename(filePath)}...`);
    
    for (const statement of statements) {
      try {
        await client.query(statement);
        console.log(`✓ Successfully executed: ${statement.substring(0, 60)}${statement.length > 60 ? '...' : ''}`);
      } catch (stmtError) {
        console.error(`Error executing statement: ${statement.substring(0, 100)}...`);
        console.error(stmtError);
      }
    }
    
    console.log(`Completed executing SQL from ${path.basename(filePath)}`);
    return true;
  } catch (fileError) {
    console.error(`Error processing SQL file ${filePath}:`, fileError);
    return false;
  }
}

async function main() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if the tables exist
    console.log('Checking existing tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`Existing tables: ${tables.length ? tables.join(', ') : 'None'}`);
    
    // Path to migration files
    const migrationsDir = path.join(__dirname, '..', 'drizzle');
    
    // Get all .sql files in the drizzle directory
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => path.join(migrationsDir, file));
    
    console.log(`Found ${migrationFiles.length} migration files:`, migrationFiles.map(f => path.basename(f)).join(', '));
    
    // Execute each migration file
    for (const file of migrationFiles) {
      await executeSQLFile(client, file);
    }
    
    // Verify tables after execution
    const verifyResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tablesAfter = verifyResult.rows.map(row => row.table_name);
    console.log(`Tables after execution: ${tablesAfter.length ? tablesAfter.join(', ') : 'None'}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 