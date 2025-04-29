// Customer Management App Schema
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, pgTableCreator, uuid, varchar, timestamp, text } from "drizzle-orm/pg-core";

/**
 * Flexible table creator that adapts to different database environments.
 * This allows the schema to work with any database name without hardcoding.
 * 
 * The schema will use table names directly without any prefix, making it
 * compatible with different database environments.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `${name}`);

export const customers = createTable(
  "customer",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    name: d.varchar({ length: 256 }).notNull(),
    email: d.varchar({ length: 256 }).notNull(),
    phone: d.varchar({ length: 50 }),
    thumbnailUrl: d.text(),
    // Define imageUrls as text[] to match PostgreSQL ARRAY type
    imageUrls: d.text().array(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    // Using default CURRENT_TIMESTAMP to match PostgreSQL schema
    // Note: $onUpdate is a Drizzle ORM feature, not a database trigger
    // It only works when updating through Drizzle ORM
    updatedAt: d.timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("customer_name_idx").on(t.name),
    index("customer_email_idx").on(t.email),
    index("customer_updated_at_idx").on(t.updatedAt)
  ],
);
