// Simple script to set up database tables with configurable prefix
// Usage: node scripts/setup-db.mjs [prefix]
// Example: node scripts/setup-db.mjs "" (for no prefix)

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { Client } = pg;

// Load environment variables
dotenv.config();

// Get table prefix from command line argument or use empty string
const tablePrefix = process.argv[2] || '';
console.log(`Using table prefix: "${tablePrefix}"`);

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
console.log(`Setting up database: ${dbName}`);

async function main() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check existing tables
    console.log('Checking existing tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    if (tables.length > 0) {
      console.log('Existing tables:', tables.join(', '));
    } else {
      console.log('No existing tables found');
    }

    // Drop existing tables with the specified prefix if they exist
    const tableName = `${tablePrefix}customer`;
    if (tables.includes(tableName)) {
      console.log(`Dropping existing table: ${tableName}`);
      await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    }

    // Create customer table
    console.log(`Creating table: ${tableName}`);
    await client.query(`
      CREATE TABLE "${tableName}" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" varchar(256) NOT NULL,
        "email" varchar(256) NOT NULL,
        "phone" varchar(50),
        "thumbnailUrl" text,
        "imageUrls" text[],
        "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Create indexes
    console.log('Creating indexes...');
    await client.query(`CREATE INDEX "${tablePrefix}customer_name_idx" ON "${tableName}" USING btree ("name")`);
    await client.query(`CREATE INDEX "${tablePrefix}customer_email_idx" ON "${tableName}" USING btree ("email")`);
    await client.query(`CREATE INDEX "${tablePrefix}customer_updated_at_idx" ON "${tableName}" USING btree ("updatedAt")`);

    // Insert sample data
    console.log('Inserting sample data...');
    await client.query(`
      INSERT INTO "${tableName}" ("name", "email", "phone")
      VALUES 
        ('John Doe', 'john@example.com', '+1234567890'),
        ('Jane Smith', 'jane@example.com', '+0987654321')
    `);

    // Verify data
    const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
    console.log(`Created ${countResult.rows[0].count} sample customers.`);

    console.log('Schema setup complete!');
  } catch (error) {
    console.error('Error setting up schema:', error);
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
