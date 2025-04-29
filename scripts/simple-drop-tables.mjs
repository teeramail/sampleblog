// Simple script to drop all tables in the database without using session_replication_role
import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;

// Load environment variables
dotenv.config();

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
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get all tables in the public schema
    console.log('Fetching all tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    
    if (tables.length === 0) {
      console.log('No tables found in the database.');
      return;
    }
    
    console.log(`Found ${tables.length} tables: ${tables.join(', ')}`);
    
    // Drop each table one by one, not using session_replication_role
    for (const table of tables) {
      try {
        console.log(`Dropping table: ${table}`);
        await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`Successfully dropped table: ${table}`);
      } catch (error) {
        console.error(`Error dropping table ${table}:`, error);
      }
    }
    
    console.log('Tables drop operation completed.');
    
    // Verify that all tables are gone
    const verifyResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (verifyResult.rows.length === 0) {
      console.log('Verified: No tables remain in the database.');
    } else {
      console.warn(`Warning: Some tables still exist: ${verifyResult.rows.map(row => row.table_name).join(', ')}`);
    }
    
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
