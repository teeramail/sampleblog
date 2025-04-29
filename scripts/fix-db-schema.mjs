// Script to fix database schema for flexible table prefixes
// Usage: node scripts/fix-db-schema.mjs

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

// Get table prefix from environment
const tablePrefix = process.env.DB_TABLE_PREFIX || '';
console.log(`Using table prefix: "${tablePrefix}"`);
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
      process.exit(0);
    }

    // Check if we need to drop and recreate tables
    const targetTableName = `${tablePrefix}customer`;
    
    // Drop existing indexes to avoid conflicts
    try {
      console.log('Dropping existing indexes...');
      await client.query(`DROP INDEX IF EXISTS "customer_name_idx"`);
      await client.query(`DROP INDEX IF EXISTS "customer_email_idx"`);
      await client.query(`DROP INDEX IF EXISTS "customer_updated_at_idx"`);
      
      // Also try with prefixes that might exist
      await client.query(`DROP INDEX IF EXISTS "realestate_customer_name_idx"`);
      await client.query(`DROP INDEX IF EXISTS "realestate_customer_email_idx"`);
      await client.query(`DROP INDEX IF EXISTS "realestate_customer_updated_at_idx"`);
      
      await client.query(`DROP INDEX IF EXISTS "customercustomer_name_idx"`);
      await client.query(`DROP INDEX IF EXISTS "customercustomer_email_idx"`);
      await client.query(`DROP INDEX IF EXISTS "customercustomer_updated_at_idx"`);
    } catch (error) {
      console.log('Error dropping indexes (this is often normal):', error.message);
    }

    // Check if we need to create or recreate the customer table
    if (!tables.includes(targetTableName)) {
      console.log(`Table "${targetTableName}" doesn't exist, creating it...`);
      
      // Create customer table with the correct prefix
      await client.query(`
        CREATE TABLE "${targetTableName}" (
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
      
      // Insert sample data
      console.log('Inserting sample data...');
      await client.query(`
        INSERT INTO "${targetTableName}" ("name", "email", "phone")
        VALUES 
          ('John Doe', 'john@example.com', '+1234567890'),
          ('Jane Smith', 'jane@example.com', '+0987654321')
      `);
    } else {
      console.log(`Table "${targetTableName}" already exists, skipping creation.`);
    }
    
    // Create indexes with the correct prefix
    console.log('Creating indexes...');
    try {
      await client.query(`CREATE INDEX "${tablePrefix}customer_name_idx" ON "${targetTableName}" USING btree ("name")`);
      await client.query(`CREATE INDEX "${tablePrefix}customer_email_idx" ON "${targetTableName}" USING btree ("email")`);
      await client.query(`CREATE INDEX "${tablePrefix}customer_updated_at_idx" ON "${targetTableName}" USING btree ("updatedAt")`);
    } catch (error) {
      console.log('Error creating indexes (may already exist):', error.message);
    }

    // Verify data
    const countResult = await client.query(`SELECT COUNT(*) FROM "${targetTableName}"`);
    console.log(`Table "${targetTableName}" has ${countResult.rows[0].count} customers.`);

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
