import { config } from 'dotenv';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
config();

// Get database connection string from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Extract database name from connection string
const dbNameMatch = databaseUrl.match(/\/([^?]+)(\?|$)/);
const dbName = dbNameMatch ? dbNameMatch[1] : 'unknown';

console.log(`Extracting schema from database: ${dbName}`);

// Create database connection
const pool = new Pool({
  connectionString: databaseUrl,
});

async function extractSchema() {
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');

    // Query to get table and column information
    const schemaQuery = `
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        character_maximum_length, 
        column_default, 
        is_nullable
      FROM 
        information_schema.columns
      WHERE 
        table_schema = 'public'
      ORDER BY 
        table_name, 
        ordinal_position;
    `;

    // Execute the query
    const result = await client.query(schemaQuery);
    console.log(`Found ${result.rows.length} columns in the database schema`);

    // Format the result as a simple text output
    let output = '';
    
    // Add header
    output += `"table_name"\t"column_name"\t"data_type"\t"character_maximum_length"\t"column_default"\t"is_nullable"\n`;
    
    // Add rows
    for (const row of result.rows) {
      output += `"${row.table_name}"\t"${row.column_name}"\t"${row.data_type}"\t${row.character_maximum_length || ''}\t"${row.column_default || ''}"\t"${row.is_nullable}"\n`;
    }

    // Save the output to a file
    const outputPath = path.join(process.cwd(), 'db-schema.txt');
    fs.writeFileSync(outputPath, output);
    console.log(`Schema saved to ${outputPath}`);

    // Also print to console
    console.log('\nDatabase Schema:');
    console.log(output);

    // Release the client
    client.release();
    
    // Close the pool
    await pool.end();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error extracting schema:', error);
    process.exit(1);
  }
}

// Run the extraction
extractSchema();
