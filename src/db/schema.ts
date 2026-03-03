import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  sort_order: integer('sort_order').notNull().default(0),
});

export const techItems = sqliteTable('tech_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  url: text('url'),
  category_id: integer('category_id').references(() => categories.id),
  introduced_at: text('introduced_at').notNull(),
  created_at: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const sourceVideos = sqliteTable('source_videos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  url: text('url').notNull().unique(),
  title: text('title').notNull(),
  published_at: text('published_at').notNull(),
  analyzed: integer('analyzed').notNull().default(0),
  created_at: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const techItemVideos = sqliteTable(
  'tech_item_videos',
  {
    tech_item_id: integer('tech_item_id')
      .notNull()
      .references(() => techItems.id),
    source_video_id: integer('source_video_id')
      .notNull()
      .references(() => sourceVideos.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.tech_item_id, table.source_video_id] }),
  }),
);

export const extractionJobs = sqliteTable('extraction_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  status: text('status').notNull().default('pending'),
  video_urls: text('video_urls').notNull(),
  result: text('result'),
  error_message: text('error_message'),
  created_at: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  completed_at: text('completed_at'),
});

export const screenshots = sqliteTable('screenshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tech_item_id: integer('tech_item_id').notNull().references(() => techItems.id).unique(),
  blob_url: text('blob_url').notNull(),
  blob_pathname: text('blob_pathname').notNull(),
  width: integer('width').notNull().default(1280),
  height: integer('height').notNull().default(800),
  captured_at: text('captured_at').notNull(),
  status: text('status').notNull().default('pending'),
  error_message: text('error_message'),
  created_at: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const categoriesRelations = relations(categories, ({ many }) => ({
  techItems: many(techItems),
}));

export const techItemsRelations = relations(techItems, ({ one, many }) => ({
  category: one(categories, {
    fields: [techItems.category_id],
    references: [categories.id],
  }),
  techItemVideos: many(techItemVideos),
  screenshot: one(screenshots, {
    fields: [techItems.id],
    references: [screenshots.tech_item_id],
  }),
}));

export const screenshotsRelations = relations(screenshots, ({ one }) => ({
  techItem: one(techItems, {
    fields: [screenshots.tech_item_id],
    references: [techItems.id],
  }),
}));

export const sourceVideosRelations = relations(sourceVideos, ({ many }) => ({
  techItemVideos: many(techItemVideos),
}));

export const techItemVideosRelations = relations(techItemVideos, ({ one }) => ({
  techItem: one(techItems, {
    fields: [techItemVideos.tech_item_id],
    references: [techItems.id],
  }),
  sourceVideo: one(sourceVideos, {
    fields: [techItemVideos.source_video_id],
    references: [sourceVideos.id],
  }),
}));
