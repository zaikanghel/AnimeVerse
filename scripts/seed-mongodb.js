/**
 * Script to seed the MongoDB database with initial data
 * Run with: node scripts/seed-mongodb.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Define MongoDB models inline for the script
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const AnimeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    coverImage: { type: String, required: true },
    bannerImage: { type: String },
    releaseYear: { type: Number, required: true },
    status: { type: String, required: true },
    type: { type: String, required: true },
    episodes: { type: Number },
    rating: { type: String },
    studio: { type: String },
  },
  { timestamps: true }
);

const GenreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const AnimeGenreSchema = new mongoose.Schema(
  {
    animeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Anime', required: true },
    genreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Genre', required: true },
  },
  { timestamps: true }
);

AnimeGenreSchema.index({ animeId: 1, genreId: 1 }, { unique: true });

const EpisodeSchema = new mongoose.Schema(
  {
    animeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Anime', required: true },
    title: { type: String, required: true },
    number: { type: Number, required: true },
    description: { type: String },
    thumbnail: { type: String },
    videoUrl: { type: String, required: true },
    duration: { type: String },
    releaseDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Register models
const User = mongoose.model('User', UserSchema);
const Anime = mongoose.model('Anime', AnimeSchema);
const Genre = mongoose.model('Genre', GenreSchema);
const AnimeGenre = mongoose.model('AnimeGenre', AnimeGenreSchema);
const Episode = mongoose.model('Episode', EpisodeSchema);

// Load initial data
const initialData = require('../shared/data');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animeverse';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return false;
  }
}

// Seed the database with initial data
async function seedDatabase() {
  try {
    // Create admin user
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@animeverse.com',
        password: 'admin123',
        isAdmin: true,
      });
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }

    // Create genres
    const genreIds = {};
    for (const genre of initialData.genreData) {
      const existingGenre = await Genre.findOne({ name: genre.name });
      if (existingGenre) {
        genreIds[genre.id] = existingGenre._id;
        console.log(`Genre ${genre.name} already exists`);
      } else {
        const newGenre = await Genre.create({ name: genre.name });
        genreIds[genre.id] = newGenre._id;
        console.log(`Created genre: ${genre.name}`);
      }
    }

    // Create animes
    const animeIds = {};
    for (const anime of initialData.animeData) {
      const existingAnime = await Anime.findOne({ title: anime.title });
      if (existingAnime) {
        animeIds[anime.id] = existingAnime._id;
        console.log(`Anime ${anime.title} already exists`);
      } else {
        const newAnime = await Anime.create({
          title: anime.title,
          description: anime.description,
          coverImage: anime.coverImage,
          bannerImage: anime.bannerImage || null,
          releaseYear: anime.releaseYear,
          status: anime.status,
          type: anime.type,
          episodes: anime.episodeCount,
          rating: anime.rating,
          studio: anime.studio,
        });
        animeIds[anime.id] = newAnime._id;
        console.log(`Created anime: ${anime.title}`);

        // Create anime-genre relationships
        for (const genreName of anime.genres) {
          const genre = await Genre.findOne({ name: genreName });
          if (genre) {
            await AnimeGenre.create({
              animeId: newAnime._id,
              genreId: genre._id,
            });
            console.log(`Linked ${anime.title} with genre ${genreName}`);
          }
        }
      }
    }

    // Create episodes
    for (const episode of initialData.episodeData) {
      const animeId = animeIds[episode.animeId];
      if (!animeId) {
        console.log(`Skipping episode: Anime ID ${episode.animeId} not found`);
        continue;
      }

      const existingEpisode = await Episode.findOne({ 
        animeId: animeId,
        number: episode.number
      });

      if (existingEpisode) {
        console.log(`Episode ${episode.number} for anime ID ${episode.animeId} already exists`);
      } else {
        await Episode.create({
          animeId: animeId,
          title: episode.title,
          number: episode.number,
          description: episode.description,
          thumbnail: episode.thumbnail || null,
          videoUrl: episode.videoUrl,
          duration: episode.duration,
          releaseDate: new Date(episode.releaseDate),
        });
        console.log(`Created episode ${episode.number}: ${episode.title}`);
      }
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Main function
async function main() {
  try {
    const connected = await connectToDatabase();
    if (!connected) {
      console.error('Failed to connect to MongoDB. Exiting...');
      process.exit(1);
    }
    
    await seedDatabase();
    console.log('Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
}

// Run the script
main();