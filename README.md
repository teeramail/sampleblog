# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

# Database Schema Validation

This project includes a powerful, adaptable schema validation tool that ensures compatibility between your Drizzle ORM definitions and your actual database.

## Single Database Configuration

This project is configured to use a single database. The database URL is set in the `.env` file, and all database operations are performed against this database. This simplifies configuration and ensures consistency.

## Schema Sync Tool

The schema sync tool is designed to work with any project and any PostgreSQL database name:

```bash
# Generate a configuration file by inspecting your database
npm run db:schema:generate

# Validate your database against the configuration
npm run db:schema:sync

# Validate a specific database (useful for projects that adapt this codebase)
npm run db:schema:sync -- "postgresql://user:password@host:port/your_database_name"
```

### How It Works

1. **Table Detection:** The tool automatically detects all tables in both your Drizzle schema and your database
2. **Complete Validation:** Checks all tables, columns, types, nullability, and indexes
3. **Database-agnostic:** Works with any PostgreSQL database, regardless of naming
4. **Portable:** Can be easily copied to other projects with different database structures
5. **Configuration-based:** Uses a JSON config file that can be version-controlled and customized

### Example Configuration

The `schema-sync-config.json` file is automatically generated based on your database structure:

```json
{
  "projectName": "My Project",
  "databaseUrl": "postgresql://user:password@host:port/database",
  "schemaPath": "../src/server/db/schema",
  "requireIndexes": true,
  "validateAllTables": true,
  "tables": [
    {
      "name": "customer",
      "columns": [
        { "name": "id", "type": "uuid", "isPrimaryKey": true },
        { "name": "name", "type": "character varying" },
        { "name": "email", "type": "character varying" }
      ],
      "indexes": [
        { "name": "customer_name_idx" }
      ]
    }
  ]
}
```

## Adapting to New Projects

This project serves as a model for other projects:

1. When starting a new project, copy the schema validation tools
2. Update the DATABASE_URL in your .env file to point to your new database
3. Run `npm run db:schema:generate` to create a configuration for your database
4. Use `npm run db:schema:sync` to validate your schema

The tool will automatically adapt to different:
- Database names
- Table structures
- Column types
- Index configurations

## Migration Commands

After validating the schema, you can apply necessary changes:

```bash
# Check for differences between schema and database
npm run db:generate

# Apply changes to the database
npm run db:migrate
```

See [SETUP.md](scripts/SETUP.md) for detailed instructions on adapting this codebase to new projects.
