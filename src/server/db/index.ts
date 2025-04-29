import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

// Simple connection configuration for PostgreSQL
const connectionConfig = {
  // SSL settings (typically needed for cloud databases)
  ssl: true,
  // Basic connection settings
  max: 1, // Use minimal connections for serverless
  idle_timeout: 20, // Shorter idle timeout
  connect_timeout: 10, // Connection timeout
};

// Log the connection attempt for debugging
console.log("Connecting to PostgreSQL database...");

// Create a simple, reliable connection
// Define the db variable with explicit type from drizzle-orm
import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";
let db: PostgresJsDatabase<typeof schema>;
try {
  // Extract the database name from the connection URL for logging
  try {
    const dbUrlParts = env.DATABASE_URL.split('/');
    // Make sure we have a valid URL with parts
    if (dbUrlParts.length > 0) {
      const dbNameWithParams = dbUrlParts[dbUrlParts.length - 1] ?? '';
      const dbName = dbNameWithParams.split('?')[0];
      console.log(`Connecting to database: ${dbName}`);
    }
  } catch (_) {
    console.log('Could not extract database name from connection string');
  }
  
  // Use cached connection or create new one
  const conn = globalForDb.conn ?? postgres(env.DATABASE_URL, connectionConfig);
  
  // Cache connection in development
  if (env.NODE_ENV !== "production") {
    globalForDb.conn = conn;
  }
  
  // Create Drizzle instance
  db = drizzle(conn, { schema });
  
  // Log success
  console.log("Database connection initialized successfully");
} catch (error) {
  console.error("Database connection error:", error);
  throw error;
}

// Export the database instance
export { db };

// Error handling wrapper
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error("Database operation failed:", error);
    throw error;
  }
}
