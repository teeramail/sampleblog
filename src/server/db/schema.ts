// Customer Management App Schema with Forum Feature
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
    title: d.varchar({ length: 256 }).notNull(),
    content: d.text().notNull(),
    // customer_id column has been removed from the actual database
    // Database uses snake_case for column names
    image_urls: d.text().array(),
    created_at: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
    updated_at: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
    is_active: d.boolean().default(true).notNull(),
    is_question: d.boolean().default(true).notNull(),
    author_name: d.varchar({ length: 256 }),
  }),
  (t) => [
    index("post_title_idx").on(t.title),
    index("post_created_at_idx").on(t.created_at),
    index("post_updated_at_idx").on(t.updated_at)
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

// Forum feature schema
export const topics = createTable(
  "topics",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    subject: d.varchar({ length: 256 }).notNull(),
    thumbnailUrl: d.text().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdBy: d.uuid().notNull(),
    isActive: d.boolean().default(true).notNull(),
  }),
  (t) => [
    index("topics_subject_idx").on(t.subject),
    index("topics_created_by_idx").on(t.createdBy),
    index("topics_created_at_idx").on(t.createdAt),
    index("topics_updated_at_idx").on(t.updatedAt)
  ],
);

export const forumPosts = createTable(
  "forum_posts",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    topicId: d.uuid().notNull().references(() => topics.id, { onDelete: "cascade" }),
    content: d.text().notNull(),
    imageUrls: d.text().array(),
    authorId: d.uuid().notNull(),
    authorName: d.varchar({ length: 256 }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    isDeleted: d.boolean().default(false).notNull(),
  }),
  (t) => [
    index("forum_posts_topic_id_idx").on(t.topicId),
    index("forum_posts_author_id_idx").on(t.authorId),
    index("forum_posts_created_at_idx").on(t.createdAt)
  ],
);

// Establish relationships
// New table for content sections
export const contentSections = createTable(
  "content_sections",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    post_id: d.uuid().notNull().references(() => posts.id, { onDelete: "cascade" }),
    content: d.text().notNull(),
    created_at: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    order_index: d.integer().notNull(),
  }),
  (t) => [
    index("content_sections_post_id_idx").on(t.post_id),
    index("content_sections_created_at_idx").on(t.created_at),
  ],
);

// New table for section images
export const sectionImages = createTable(
  "section_images",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    section_id: d.uuid().notNull().references(() => contentSections.id, { onDelete: "cascade" }),
    image_url: d.text().notNull(),
    order_index: d.integer().notNull(),
  }),
  (t) => [
    index("section_images_section_id_idx").on(t.section_id),
  ],
);

export const postsRelations = relations(posts, ({ many }) => ({
  answers: many(answers),
  contentSections: many(contentSections),
}));

export const contentSectionsRelations = relations(contentSections, ({ one, many }) => ({
  post: one(posts, {
    fields: [contentSections.post_id],
    references: [posts.id],
  }),
  images: many(sectionImages),
}));

export const sectionImagesRelations = relations(sectionImages, ({ one }) => ({
  section: one(contentSections, {
    fields: [sectionImages.section_id],
    references: [contentSections.id],
  }),
}));

// Forum relationships
export const topicsRelations = relations(topics, ({ many }) => ({
  posts: many(forumPosts),
}));

export const forumPostsRelations = relations(forumPosts, ({ one }) => ({
  topic: one(topics, {
    fields: [forumPosts.topicId],
    references: [topics.id],
  }),
}));
