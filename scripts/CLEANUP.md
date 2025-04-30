# Scripts Cleanup Guide

After analyzing the scripts folder, several redundant or duplicate scripts were identified. This document suggests which scripts to keep and which to remove for better maintainability.

## Scripts to Keep

1. **create-tables.mjs** - Used for direct table creation from SQL files
2. **setup-customer-db.ts** - TypeScript implementation for customer DB setup
3. **migrate-db.mjs** - Used for running migrations
4. **validate-schema.ts** - New schema validation script
5. **setup-migration-folders.js** - Script to create migration folder structure
6. **prd.txt** and **example_prd.txt** - PRD documentation (not scripts but useful)

## Scripts to Delete (Redundant/Duplicates)

These scripts can be safely removed as their functionality has been incorporated into other scripts or replaced by better alternatives:

1. **setup-db.js** - Redundant with setup-db.mjs (same functionality but different format)
2. **setup-db.mjs** - Replaced by setup-customer-db.ts which has better TypeScript implementation
3. **simple-drop-tables.mjs** - Functionality now incorporated in other scripts
4. **check-tables.mjs** - Replaced by the new validation script
5. **push-schema.mjs** - Replaced by drizzle-kit commands in package.json
6. **fix-db-schema.mjs** - No longer needed with the improved setup

## New Development Workflow

With the updated configuration, follow these steps for database management:

1. Run `npm run db:setup:folders` to set up the migration directory structure
2. Run `npm run db:validate` to check schema consistency across databases
3. Use the database-specific migration commands:
   - `npm run db:migrate:keepdoc` - For the keepdoc database
   - `npm run db:migrate:customer` - For the customer database
   - `npm run db:migrate:realsamui` - For the realsamui database
4. Use the database-specific check commands to verify schema:
   - `npm run db:check:keepdoc` - For the keepdoc database
   - `npm run db:check:customer` - For the customer database
   - `npm run db:check:realsamui` - For the realsamui database 