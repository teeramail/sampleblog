# Database Management Guide

This document provides instructions for managing the database setup in this project.

## Database Configuration

The project is configured to work with multiple PostgreSQL databases hosted on Neon:

1. **keepdoc** - Main database
2. **customer** - Customer-specific database
3. **realsamui** - Customer-specific database for real estate data

## Directory Structure

The database files are organized as follows:

```
├── drizzle/
│   ├── keepdoc/     # Migrations for keepdoc database
│   ├── customer/    # Migrations for customer database
│   ├── realsamui/   # Migrations for realsamui database
│   ├── meta/        # Metadata for migrations
│   └── *.sql        # Migration files
├── src/
│   └── server/
│       └── db/
│           ├── schema.ts    # Database schema definition
│           ├── index.ts     # Database connection
│           └── migrate.ts   # Migration script
└── scripts/
    ├── validate-schema.ts          # Schema validation script
    └── setup-migration-folders.js  # Script to setup migration directories
```

## Configuration Files

The project uses multiple configuration files to manage different databases:

- `drizzle.config.base.ts` - Base configuration shared by all databases
- `drizzle.keepdoc.config.ts` - Configuration for keepdoc database
- `drizzle.customer.config.ts` - Configuration for customer database
- `drizzle.realsamui.config.ts` - Configuration for realsamui database

## Available Commands

### Setup and Validation

- `npm run db:setup:folders` - Create the migration folder structure
- `npm run db:validate` - Validate schema consistency across all databases

### Database-Specific Commands

#### Keepdoc Database

- `npm run db:migrate:keepdoc` - Push schema changes to keepdoc database
- `npm run db:check:keepdoc` - Check schema differences for keepdoc database

#### Customer Database

- `npm run db:migrate:customer` - Push schema changes to customer database
- `npm run db:check:customer` - Check schema differences for customer database

#### Realsamui Database

- `npm run db:migrate:realsamui` - Push schema changes to realsamui database
- `npm run db:check:realsamui` - Check schema differences for realsamui database

### General Commands

- `npm run db:migrate:run` - Run migrations using the `migrate.ts` script
- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Apply migrations
- `npm run db:push` - Push schema changes directly
- `npm run db:studio` - Open Drizzle Studio

## Workflow

1. **Initial Setup**
   - Run `npm run db:setup:folders` to create the migration directories

2. **Validate Schema**
   - Run `npm run db:validate` to check schema consistency

3. **Make Schema Changes**
   - Edit `src/server/db/schema.ts` to define your schema changes

4. **Check Differences**
   - Run the appropriate check command (e.g., `npm run db:check:keepdoc`)

5. **Apply Changes**
   - Run the appropriate migration command (e.g., `npm run db:migrate:keepdoc`)

6. **Validate Again**
   - Run `npm run db:validate` to ensure schema consistency after changes

## Switching Databases

To switch the active database, modify the `DATABASE_URL` in the `.env` file. 

Examples:

```
# For keepdoc database
DATABASE_URL="postgresql://muaythai_owner:npg_uo1cbjDyXRx0@ep-hidden-morning-a134x57e-pooler.ap-southeast-1.aws.neon.tech/keepdoc?sslmode=require"

# For customer database
DATABASE_URL="postgresql://muaythai_owner:npg_uo1cbjDyXRx0@ep-hidden-morning-a134x57e-pooler.ap-southeast-1.aws.neon.tech/customer?sslmode=require"

# For realsamui database
DATABASE_URL="postgresql://muaythai_owner:npg_uo1cbjDyXRx0@ep-hidden-morning-a134x57e-pooler.ap-southeast-1.aws.neon.tech/realsamui?sslmode=require"
```

After changing the active database, run `npm run db:validate` to verify schema consistency. 