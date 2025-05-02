import { Pool } from 'pg';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config();

async function runSqlFix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log(`Connecting to database...`);
    const client = await pool.connect();
    console.log('Connected to database');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'fix-post-table.sql');
    const sqlCommands = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing SQL commands...');
    const result = await client.query(sqlCommands);
    
    // The last query in our SQL file returns the updated schema
    if (result && Array.isArray(result) && result.length > 0) {
      const schemaResult = result[result.length - 1];
      
      console.log('\nUpdated Post Table Schema:');
      console.log('-------------------------');
      schemaResult.rows.forEach(row => {
        console.log(`${row.column_name}: ${row.data_type}${row.is_nullable === 'YES' ? ', NULL' : ', NOT NULL'}${row.column_default ? `, DEFAULT: ${row.column_default}` : ''}`);
      });
    } else {
      console.log('SQL commands executed successfully, but no schema information returned.');
    }

    client.release();
  } catch (error) {
    console.error('Error executing SQL commands:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

runSqlFix();
