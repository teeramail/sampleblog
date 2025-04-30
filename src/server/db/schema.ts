// Customer Management App Schema
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, pgTableCreator } from "drizzle-orm/pg-core";

/**
 * Table creator for the application.
 * Uses direct table names without prefixes.
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

export const posts = createTable(
  "post",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    subject: d.varchar({ length: 256 }).notNull(),
    content: d.text().notNull(),
    thumbnailUrl: d.text().notNull(),
    // Define imageUrls as text[] to match PostgreSQL ARRAY type
    imageUrls: d.text().array(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    isActive: d.boolean().default(true).notNull(),
  }),
  (t) => [
    index("post_subject_idx").on(t.subject),
    index("post_created_at_idx").on(t.createdAt),
    index("post_updated_at_idx").on(t.updatedAt)
  ],
);
