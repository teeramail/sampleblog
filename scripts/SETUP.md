# Setting Up Schema Validation for New Projects

This guide explains how to use our schema validation tools in any new project, even if it has a different database structure than our current project.

## Prerequisites

- Node.js installed
- PostgreSQL database (local or cloud-hosted)
- Database connection string

## Quick Setup

1. **Copy the relevant files to your project:**
   ```bash
   # Create the scripts directory if it doesn't exist
   mkdir -p scripts
   
   # Copy the schema-sync script
   cp scripts/schema-sync.ts scripts/schema-sync-template.json your-project/scripts/
   ```

2. **Update package.json with the necessary scripts:**
   ```json
   "scripts": {
     "db:schema:sync": "tsx scripts/schema-sync.ts",
     "db:schema:generate": "tsx scripts/schema-sync.ts --generate"
   }
   ```

3. **Install required dependencies:**
   ```bash
   npm install --save-dev drizzle-orm postgres dotenv zod tsx
   ```

4. **Set up your environment variables:**
   Create or update your `.env` file with:
   ```
   DATABASE_URL=postgresql://user:password@host:port/your_database
   PROJECT_NAME=Your Project Name
   ```

5. **Generate a configuration based on your database:**
   ```bash
   npm run db:schema:generate
   ```

6. **Validate your schema:**
   ```bash
   npm run db:schema:sync
   ```

## Understanding the Configuration File

After generating the config, you'll have a `schema-sync-config.json` file with:

```json
{
  "projectName": "Your Project",
  "databaseUrl": "postgresql://user:password@host:port/database",
  "schemaPath": "../src/server/db/schema",
  "requireIndexes": true,
  "tables": [
    {
      "name": "your_table",
      "columns": [
        { "name": "id", "type": "uuid" },
        { "name": "title", "type": "character varying" }
      ],
      "indexes": [
        { "name": "your_table_id_idx" }
      ]
    }
  ]
}
```

You can manually edit this file to:

- Add new tables/columns that haven't been created yet
- Remove tables/columns that are no longer needed
- Adjust expected types or nullability
- Modify index requirements

## CI/CD Integration

Add the schema validation to your CI pipeline:

```yaml
# Example GitHub Actions workflow
validate-schema:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run db:schema:sync
```

## Adapting to Different Projects

The tool is designed to work with any PostgreSQL database structure:

1. **Single Database Projects:**
   - Just use your single database URL in `.env`
   
2. **Projects with Multiple Databases:**
   - Create multiple config files (e.g., `schema-sync-config.app.json`, `schema-sync-config.analytics.json`)
   - Use command-line arguments to specify which database to validate:
     ```bash
     npm run db:schema:sync -- "postgresql://user:password@host:port/app_db"
     npm run db:schema:sync -- "postgresql://user:password@host:port/analytics_db"
     ```

3. **Different Schema Locations:**
   - Edit the `schemaPath` in your config file to point to your Drizzle schema
   - Example: `"schemaPath": "../db/schema"` or `"schemaPath": "../lib/db/schema"`

## Troubleshooting

- **Connection Issues:**
  Ensure your DATABASE_URL is correct and includes SSL settings if needed (`?sslmode=require`)

- **Schema Import Errors:**
  Adjust the `schemaPath` to match your project structure

- **Type Mismatches:**
  PostgreSQL sometimes uses different type names than expected. Edit the config to match the actual types reported in the validation output

## Example: Migrating from the Original Project

If you're adapting our codebase but only need a single database:

1. Copy all the files as described above
2. Generate a config based on your database structure
3. Modify `drizzle.config.ts` to only use your database
4. Remove the multiple database configurations

With these steps, you can easily adapt our robust schema validation to any project structure and database configuration. 