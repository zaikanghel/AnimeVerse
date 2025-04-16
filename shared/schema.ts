import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

export const animes = pgTable("animes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  coverImage: text("cover_image").notNull(),
  bannerImage: text("banner_image"),
  releaseYear: integer("release_year").notNull(),
  status: text("status").notNull(),
  type: text("type").notNull(),
  episodes: integer("episodes"),
  rating: text("rating"),
  studio: text("studio"),
});

export const insertAnimeSchema = createInsertSchema(animes).omit({
  id: true,
});

export const genres = pgTable("genres", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertGenreSchema = createInsertSchema(genres).omit({
  id: true,
});

export const animeGenres = pgTable("anime_genres", {
  id: serial("id").primaryKey(),
  animeId: integer("anime_id").notNull(),
  genreId: integer("genre_id").notNull(),
});

export const insertAnimeGenreSchema = createInsertSchema(animeGenres).omit({
  id: true,
});

export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  animeId: integer("anime_id").notNull(),
  title: text("title").notNull(),
  number: integer("number").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  videoUrl: text("video_url").notNull(),
  duration: text("duration"),
  releaseDate: timestamp("release_date").defaultNow().notNull(),
});

// Create the base insert schema
const baseEpisodeSchema = createInsertSchema(episodes).omit({
  id: true,
});

// Create a modified schema that supports MongoDB ObjectIDs for animeId
export const insertEpisodeSchema = baseEpisodeSchema.extend({
  animeId: z.union([z.number(), z.string()]), // Accept either number (in-memory) or string (MongoDB ObjectID)
  releaseDate: z.union([z.string(), z.date()]).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAnime = z.infer<typeof insertAnimeSchema>;
export type Anime = typeof animes.$inferSelect;

export type InsertGenre = z.infer<typeof insertGenreSchema>;
export type Genre = typeof genres.$inferSelect;

export type InsertAnimeGenre = z.infer<typeof insertAnimeGenreSchema>;
export type AnimeGenre = typeof animeGenres.$inferSelect;

export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Episode = typeof episodes.$inferSelect;
