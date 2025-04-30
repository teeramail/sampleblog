import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { z } from "zod";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");

if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`No .env file found at ${envPath}`);
  dotenv.config();
}

// Configuration schema with Zod for type safety
const ConfigSchema = z.object({
  projectName: z.string().default("Project"),
  databaseUrl: z.string(),
  schemaPath: z.string().default("../src/server/db/schema"),
  requireIndexes: z.boolean().default(true),
  validateAllTables: z.boolean().default(true),
  tables: z.array(z.object({
    name: z.string(),
    columns: z.array(z.object({
      name: z.string(),
      type: z.string(),
      nullable: z.boolean().optional()
    })),
    indexes: z.array(z.object({
      name: z.string()
    })).optional()
  }))
});

type SyncConfig = z.infer<typeof ConfigSchema>;

// Check if config file exists, otherwise use defaults
const getConfig = (): SyncConfig => {
  const configPath = path.join(rootDir, 'schema-sync-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return ConfigSchema.parse(configData);
    } catch (error) {
      console.error("Error parsing config file:", error);
      process.exit(1);
    }
  } else {
    // If no config file, use DATABASE_URL from env
    if (!process.env.DATABASE_URL) {
      console.error("No DATABASE_URL found in environment variables");
      process.exit(1);
    }

    // Create a default config using database introspection
    return {
      projectName: process.env.PROJECT_NAME || "Default Project",
      databaseUrl: process.env.DATABASE_URL,
      schemaPath: "../src/server/db/schema",
      requireIndexes: true,
      validateAllTables: true,
      tables: [] // Will be filled by introspection
    };
  }
};

// Import schema at runtime to avoid import issues
const getSchema = async (schemaPath: string) => {
  try {
    return await import(schemaPath);
  } catch (error) {
    console.error(`Error importing schema from ${schemaPath}:`, error);
    process.exit(1);
  }
};

// Utility function to format validation output
const formatValidationMessage = (message: string, isError = false) => {
  return isError 
    ? `❌ ${message}` 
    : `✅ ${message}`;
};

// Determine if a column is a primary key
async function getPrimaryKeyColumns(conn: any, tableName: string): Promise<string[]> {
  const primaryKeyQuery = `
    SELECT a.attname
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = '${tableName}'::regclass
    AND i.indisprimary;
  `;
  
  const primaryKeyResults = await conn.unsafe(primaryKeyQuery);
  return primaryKeyResults.map((row: any) => row.attname);
}

// Determine if a column is unique
async function getUniqueColumns(conn: any, tableName: string): Promise<string[]> {
  const uniqueQuery = `
    SELECT a.attname
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = '${tableName}'::regclass
    AND i.indisunique AND NOT i.indisprimary;
  `;
  
  const uniqueResults = await conn.unsafe(uniqueQuery);
  return uniqueResults.map((row: any) => row.attname);
}

async function introspectDatabase(databaseUrl: string): Promise<SyncConfig['tables']> {
  console.log("Introspecting database schema...");
  
  try {
    const connectionConfig = {
      ssl: true,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    };

    const conn = postgres(databaseUrl, connectionConfig);
    
    // Get all tables and columns
    const columns = await conn.unsafe(`
      SELECT table_name, column_name, data_type, is_nullable, 
             column_default, character_maximum_length, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    
    // Group columns by table name
    const tableColumnsMap = new Map();
    columns.forEach((column: any) => {
      if (!tableColumnsMap.has(column.table_name)) {
        tableColumnsMap.set(column.table_name, []);
      }
      tableColumnsMap.get(column.table_name).push({
        name: column.column_name,
        type: column.data_type,
        nullable: column.is_nullable === 'YES',
        default: column.column_default,
        maxLength: column.character_maximum_length,
        precision: column.numeric_precision,
        scale: column.numeric_scale
      });
    });
    
    // Get all indexes
    const indexesResult = await conn.unsafe(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    // Group indexes by table name
    const tableIndexesMap = new Map();
    indexesResult.forEach((index: any) => {
      if (!tableIndexesMap.has(index.tablename)) {
        tableIndexesMap.set(index.tablename, []);
      }
      tableIndexesMap.get(index.tablename).push({
        name: index.indexname,
        definition: index.indexdef
      });
    });
    
    // Build the tables array for the config
    const tables: SyncConfig['tables'] = [];
    for (const [tableName, columns] of tableColumnsMap.entries()) {
      // Get primary keys and unique columns
      const primaryKeys = await getPrimaryKeyColumns(conn, tableName);
      const uniqueColumns = await getUniqueColumns(conn, tableName);
      
      // Enhanced column information
      const enhancedColumns = columns.map((col: any) => {
        return {
          name: col.name,
          type: col.type,
          nullable: col.nullable,
          isPrimaryKey: primaryKeys.includes(col.name),
          isUnique: uniqueColumns.includes(col.name),
          default: col.default
        };
      });
      
      tables.push({
        name: tableName,
        columns: enhancedColumns,
        indexes: tableIndexesMap.get(tableName) || []
      });
    }
    
    await conn.end();
    return tables;
  } catch (error) {
    console.error("Error introspecting database:", error);
    process.exit(1);
  }
}

// Generate a config file from introspection
async function generateConfigFile(databaseUrl: string) {
  console.log("Generating schema sync configuration file...");
  
  const tables = await introspectDatabase(databaseUrl);
  
  const config: SyncConfig = {
    projectName: process.env.PROJECT_NAME || "Default Project",
    databaseUrl: databaseUrl,
    schemaPath: "../src/server/db/schema",
    requireIndexes: true,
    validateAllTables: true,
    tables: tables
  };
  
  const configPath = path.join(rootDir, 'schema-sync-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log(`Configuration file generated at ${configPath}`);
  return config;
}

// Extract schema tables from Drizzle schema
function extractSchemaTablesFromDrizzle(schema: any): Set<string> {
  const schemaTableNames = new Set<string>();
  
  // Look for exported objects that might be tables
  for (const exportName in schema) {
    if (schema[exportName] && typeof schema[exportName] === 'object') {
      // Check for properties that would indicate a Drizzle table
      if (
        schema[exportName].name && 
        typeof schema[exportName].name === 'string' &&
        (schema[exportName].$type === 'table' || schema[exportName]._.columns)
      ) {
        schemaTableNames.add(schema[exportName].name);
      }
    }
  }
  
  return schemaTableNames;
}

async function validateSchema(config: SyncConfig) {
  const { databaseUrl, schemaPath, tables, requireIndexes, validateAllTables } = config;
  
  console.log(`\nValidating schema for ${databaseUrl.replace(/\/\/([^:]+):[^@]+@/, "//***:***@")}`);
  
  // Extract the database name from the URL
  const dbUrlParts = databaseUrl.split('/');
  const dbNameWithParams = dbUrlParts[dbUrlParts.length - 1] || '';
  const dbName = dbNameWithParams.split('?')[0];
  console.log(`Database: ${dbName}`);
  console.log(`Project: ${config.projectName}`);
  
  try {
    // Establish connection
    const connectionConfig = {
      ssl: true,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    };

    const conn = postgres(databaseUrl, connectionConfig);
    const schema = await getSchema(schemaPath);
    const db = drizzle(conn, { schema });
    
    // Extract table names from Drizzle schema
    const schemaTableNames = extractSchemaTablesFromDrizzle(schema);
    console.log(`Found ${schemaTableNames.size} tables in Drizzle schema: ${[...schemaTableNames].join(', ')}`);
    
    // Check if tables exist in the database
    console.log("Checking database schema...");
    const dbTables = await conn.unsafe(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    
    // Group columns by table name
    const tableColumnsMap = new Map();
    dbTables.forEach((column: any) => {
      if (!tableColumnsMap.has(column.table_name)) {
        tableColumnsMap.set(column.table_name, []);
      }
      tableColumnsMap.get(column.table_name).push({
        name: column.column_name,
        type: column.data_type,
        nullable: column.is_nullable === 'YES'
      });
    });
    
    // Output all tables found
    console.log(`Found ${tableColumnsMap.size} tables in database: ${[...tableColumnsMap.keys()].join(', ')}`);
    
    let allValid = true;
    
    // Compare Drizzle schema tables with database tables
    if (validateAllTables) {
      // Check if all tables in Drizzle schema exist in database
      for (const tableName of schemaTableNames) {
        if (!tableColumnsMap.has(tableName)) {
          console.log(formatValidationMessage(`Table ${tableName} defined in schema but missing in database`, true));
          allValid = false;
        }
      }
      
      // Check if all tables in database exist in Drizzle schema
      for (const tableName of tableColumnsMap.keys()) {
        if (!schemaTableNames.has(tableName)) {
          console.log(formatValidationMessage(`Table ${tableName} exists in database but missing in schema`, true));
          allValid = false;
        }
      }
    }
    
    // Validate each table in our configuration
    for (const table of tables) {
      if (tableColumnsMap.has(table.name)) {
        console.log(formatValidationMessage(`Table ${table.name} found`));
        
        const dbColumns = tableColumnsMap.get(table.name);
        
        // Validate each required column
        let columnsValid = true;
        for (const col of table.columns) {
          const dbColumn = dbColumns.find((c: any) => c.name === col.name);
          if (!dbColumn) {
            console.log(formatValidationMessage(`Missing column: ${col.name} in table ${table.name}`, true));
            columnsValid = false;
          } else {
            // For array type, just check if it contains "ARRAY"
            const typeMatches = col.type === 'ARRAY' 
              ? dbColumn.type.includes('ARRAY') 
              : dbColumn.type === col.type;
              
            const nullableMatches = col.nullable === undefined || dbColumn.nullable === col.nullable;
            
            if (typeMatches && nullableMatches) {
              console.log(formatValidationMessage(`Column ${table.name}.${col.name} has correct type and nullability`));
            } else {
              columnsValid = false;
              if (!typeMatches) {
                console.log(formatValidationMessage(`Column ${table.name}.${col.name} has incorrect type: expected ${col.type}, got ${dbColumn.type}`, true));
              }
              if (!nullableMatches) {
                console.log(formatValidationMessage(`Column ${table.name}.${col.name} has incorrect nullability: expected ${col.nullable}, got ${dbColumn.nullable}`, true));
              }
            }
          }
        }
        
        // Check for database columns missing from config
        for (const dbColumn of dbColumns) {
          const configColumn = table.columns.find(c => c.name === dbColumn.name);
          if (!configColumn) {
            console.log(formatValidationMessage(`Extra column in database: ${table.name}.${dbColumn.name} (${dbColumn.type}, nullable: ${dbColumn.nullable})`, true));
            columnsValid = false;
          }
        }
        
        // Check for indexes if required
        let indexesValid = true;
        if (requireIndexes && table.indexes && table.indexes.length > 0) {
          const indexes = await conn.unsafe(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = '${table.name}'
          `);
          
          for (const idx of table.indexes) {
            const dbIndex = indexes.find((i: any) => i.indexname === idx.name);
            if (dbIndex) {
              console.log(formatValidationMessage(`Index ${table.name}.${idx.name} exists`));
            } else {
              console.log(formatValidationMessage(`Missing index: ${table.name}.${idx.name}`, true));
              indexesValid = false;
            }
          }
        }
        
        const isValid = columnsValid && indexesValid;
        console.log(formatValidationMessage(`Table ${table.name} schema is ${isValid ? 'valid' : 'invalid'}`, !isValid));
        if (!isValid) allValid = false;
        
      } else {
        console.log(formatValidationMessage(`Table ${table.name} not found in database`, true));
        allValid = false;
      }
    }
    
    console.log("Schema validation completed");
    await conn.end();
    return allValid;
    
  } catch (error) {
    console.error("Error validating schema:", error);
    return false;
  }
}

// Main function to validate schemas
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  // If --generate flag is present, introspect DB and create config
  if (args.includes('--generate')) {
    if (!process.env.DATABASE_URL) {
      console.error("ERROR: DATABASE_URL environment variable is required for --generate");
      process.exit(1);
    }
    await generateConfigFile(process.env.DATABASE_URL);
    return true;
  }
  
  // Otherwise, run validation using config or environment
  let config = getConfig();
  
  // Override database URL if provided via command line
  if (args.length >= 1 && !args[0].startsWith('--')) {
    config.databaseUrl = args[0];
  }
  
  // If there are no tables in config yet, introspect the database
  if (config.tables.length === 0) {
    console.log("No tables defined in configuration, performing database introspection...");
    config.tables = await introspectDatabase(config.databaseUrl);
  }
  
  // Validate the schema
  const isValid = await validateSchema(config);
  
  return isValid;
}

// Run the validation
main()
  .then(success => {
    if (success) {
      console.log("\n✅ Schema validation successful");
      process.exit(0);
    } else {
      console.error("\n❌ Schema validation failed");
      process.exit(1);
    }
  })
  .catch(error => {
    console.error("Error running schema validation:", error);
    process.exit(1);
  }); 