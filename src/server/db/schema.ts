// Customer Management App Schema
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, pgTableCreator } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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
    // Adding new field to mark this as a question post
    isQuestion: d.boolean().default(true).notNull(),
    authorName: d.varchar({ length: 256 }),  // Optional author name
  }),
  (t) => [
    index("post_subject_idx").on(t.subject),
    index("post_created_at_idx").on(t.createdAt),
    index("post_updated_at_idx").on(t.updatedAt)
  ],
);

// New table for answers/responses
export const answers = createTable(
  "answer",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    postId: d.uuid().notNull().references(() => posts.id, { onDelete: "cascade" }),
    content: d.text().notNull(),
    // Define imageUrls as text[] to match PostgreSQL ARRAY type
    imageUrls: d.text().array(),
    authorName: d.varchar({ length: 256 }), // Optional responder name
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    isVerified: d.boolean().default(false).notNull(), // To mark expert/verified answers
  }),
  (t) => [
    index("answer_post_id_idx").on(t.postId),
    index("answer_created_at_idx").on(t.createdAt)
  ],
);

// Establish relationships
export const postsRelations = relations(posts, ({ many }) => ({
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  post: one(posts, {
    fields: [answers.postId],
    references: [posts.id],
  }),
}));
