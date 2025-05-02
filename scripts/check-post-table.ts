import { Pool } from 'pg';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config();

async function getPostTableSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log(`Connecting to database...`);
    const client = await pool.connect();
    console.log('Connected to database');

    // Query to get post table structure
    const query = `
      SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'post'
      ORDER BY ordinal_position;
    `;

    const result = await client.query(query);
    
    console.log('\nPost Table Schema:');
    console.log('--------------------');
    
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}, ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}${row.column_default ? `, DEFAULT: ${row.column_default}` : ''}`);
    });

    client.release();
  } catch (error) {
    console.error('Error fetching schema:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

getPostTableSchema();
