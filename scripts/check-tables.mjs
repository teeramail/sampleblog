// Script to check and display detailed information about tables in the database
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
    
    // Get information about each table
    for (const table of tables) {
      console.log(`\n[Table: ${table}]`);
      
      // Get column information
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      console.log('  Columns:');
      columnsResult.rows.forEach(col => {
        console.log(`    - ${col.column_name} (${col.data_type})${col.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
      });
      
      // Get index information
      const indexesResult = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = $1
      `, [table]);
      
      if (indexesResult.rows.length > 0) {
        console.log('  Indexes:');
        indexesResult.rows.forEach(idx => {
          console.log(`    - ${idx.indexname}: ${idx.indexdef}`);
        });
      }
      
      // Count rows in the table
      const countResult = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`  Row count: ${countResult.rows[0].count}`);
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
