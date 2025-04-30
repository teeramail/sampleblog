# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
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

This project includes tools for ensuring schema compatibility between your Drizzle ORM definitions and your actual database.

## Schema Sync Tool

The schema sync tool is a flexible, project-agnostic solution for validating that your database schema matches your expectations:

```bash
# Generate a configuration file by inspecting your database
npm run db:schema:generate

# Validate your database against the configuration
npm run db:schema:sync

# Validate a specific database (can be used in any project)
npm run db:schema:sync -- "postgresql://user:password@host:port/database"
```

### How It Works

1. **Configuration-based:** The tool generates a `schema-sync-config.json` file in your project root with table structure information
2. **Database-agnostic:** Works with any PostgreSQL database, regardless of naming
3. **Portable:** Can be used across different projects with different database names
4. **Customizable:** You can manually edit the config file to adjust validation rules

### Example Configuration

```json
{
  "projectName": "My Project",
  "databaseUrl": "postgresql://user:password@host:port/database",
  "schemaPath": "../src/server/db/schema",
  "requireIndexes": true,
  "tables": [
    {
      "name": "customer",
      "columns": [
        { "name": "id", "type": "uuid" },
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

## Legacy Schema Validation

The project also maintains the original schema validation tools:

```bash
# Validate against all three databases
npm run db:validate

# Check specific databases
npm run db:check:keepdoc
npm run db:check:customer
npm run db:check:realsamui
```

## When to Use Each Tool

- **Schema Sync:** For new projects or when adapting this codebase to projects with different database configurations
- **Legacy Validation:** For this specific project with its three-database structure

## Migration Commands

After validating the schema, you can apply necessary changes:

```bash
# Migrate specific databases
npm run db:migrate:keepdoc
npm run db:migrate:customer
npm run db:migrate:realsamui
```

With these tools, you can ensure that your database schema always matches your code expectations, regardless of which project or database you're working with.
