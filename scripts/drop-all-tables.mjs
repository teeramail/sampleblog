// Script to drop all tables in the database
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
    
    // Drop all tables
    console.log('Dropping all tables...');
    
    // First disable all triggers to avoid foreign key constraint issues
    await client.query('SET session_replication_role = replica;');
    
    for (const table of tables) {
      console.log(`Dropping table: ${table}`);
      await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
    
    // Re-enable triggers
    await client.query('SET session_replication_role = DEFAULT;');
    
    console.log('All tables have been dropped successfully.');
    
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
