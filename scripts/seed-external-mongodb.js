/**
 * Script to seed an external MongoDB database with initial data
 * Run with: node scripts/seed-external-mongodb.js
 * 
 * This script connects to the configured MongoDB (using environment variables)
 * and populates it with the same sample data used in the in-memory fallback.
 */

import mongoose from 'mongoose';
import { genreData, animeData, episodeData } from '../shared/data.js';
import bcrypt from 'bcryptjs';
import readline from 'readline';

// Get MongoDB connection details from environment variables with fallbacks
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animeverse';
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'animeverse';

// Schema definitions (simplified versions of the actual models)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const genreSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
}, { timestamps: true });

const animeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  coverImage: { type: String, required: true },
  bannerImage: { type: String },
  releaseYear: { type: Number, required: true },
  status: { type: String, required: true },
  type: { type: String, required: true },
  episodes: { type: Number },
  rating: { type: String },
  studio: { type: String }
}, { timestamps: true });

const episodeSchema = new mongoose.Schema({
  animeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Anime', 
    required: true 
  },
  title: { type: String, required: true },
  number: { type: Number, required: true },
  description: { type: String },
  thumbnail: { type: String },
  videoUrl: { type: String, required: true },
  duration: { type: String },
  releaseDate: { type: Date, default: Date.now }
}, { timestamps: true });

const animeGenreSchema = new mongoose.Schema({
  animeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Anime', 
    required: true 
  },
  genreId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Genre', 
    required: true 
  }
}, { timestamps: true });

// Create models
const User = mongoose.model('User', userSchema);
const Genre = mongoose.model('Genre', genreSchema);
const Anime = mongoose.model('Anime', animeSchema);
const Episode = mongoose.model('Episode', episodeSchema);
const AnimeGenre = mongoose.model('AnimeGenre', animeGenreSchema);

/**
 * Connect to MongoDB using environment variables
 */
async function connectToMongoDB() {
  try {
    // Build connection URI with credentials if provided
    let connectionUri = MONGODB_URI;
    if (MONGODB_USER && MONGODB_PASSWORD && !MONGODB_URI.includes('@')) {
      // Extract protocol and host
      const uriParts = MONGODB_URI.split('//');
      if (uriParts.length > 1) {
        connectionUri = `${uriParts[0]}//${MONGODB_USER}:${encodeURIComponent(MONGODB_PASSWORD)}@${uriParts[1]}`;
        console.log('Using MongoDB with provided credentials');
      }
    }
    
    // Ensure the database name is included in URI
    if (!connectionUri.includes('/')) {
      connectionUri = `${connectionUri}/${MONGODB_DB_NAME}`;
    }
    
    // Display masked URI for security
    const displayUri = connectionUri.replace(/\/\/.*@/, '//****:****@');
    console.log(`Connecting to MongoDB at ${displayUri}`);
    
    // Connect with appropriate options
    await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    
    console.log('Successfully connected to MongoDB');
    return true;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    return false;
  }
}

/**
 * Seed the database with initial data
 */
async function seedDatabase() {
  console.log('Seeding database with initial data...');
  
  try {
    // Check if database is empty
    const genreCount = await Genre.countDocuments();
    const animeCount = await Anime.countDocuments();
    
    if (genreCount > 0 || animeCount > 0) {
      const response = await new Promise(resolve => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        rl.question('Database already contains data. Clear all existing data and reseed? (y/n): ', answer => {
          rl.close();
          resolve(answer.toLowerCase());
        });
      });
      
      if (response !== 'y') {
        console.log('Seeding cancelled. Exiting...');
        return false;
      }
      
      // Clear existing data
      console.log('Clearing existing data...');
      await AnimeGenre.deleteMany({});
      await Episode.deleteMany({});
      await Anime.deleteMany({});
      await Genre.deleteMany({});
      console.log('Existing data cleared');
    }
    
    // Create admin user if it doesn't exist
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        isAdmin: true
      });
      await admin.save();
      console.log('Admin user created');
    }
    
    // Seed genres
    const genreMap = new Map(); // To store id mappings
    for (const genreItem of genreData) {
      const genre = new Genre({
        name: genreItem.name
      });
      const savedGenre = await genre.save();
      genreMap.set(genreItem.id, savedGenre._id);
      console.log(`Created genre: ${genreItem.name}`);
    }
    
    // Seed animes
    const animeMap = new Map(); // To store id mappings
    for (const animeItem of animeData) {
      const anime = new Anime({
        title: animeItem.title,
        description: animeItem.description,
        coverImage: animeItem.coverImage,
        bannerImage: animeItem.bannerImage,
        releaseYear: animeItem.releaseYear,
        status: animeItem.status,
        type: animeItem.type,
        episodes: animeItem.episodeCount,
        rating: animeItem.rating,
        studio: animeItem.studio
      });
      const savedAnime = await anime.save();
      animeMap.set(animeItem.id, savedAnime._id);
      console.log(`Created anime: ${animeItem.title}`);
      
      // Create genre relationships
      for (const genreName of animeItem.genres) {
        // Find the genre id from our initial data
        const genreItem = genreData.find(g => g.name === genreName);
        if (genreItem && genreMap.has(genreItem.id)) {
          const animeGenre = new AnimeGenre({
            animeId: savedAnime._id,
            genreId: genreMap.get(genreItem.id)
          });
          await animeGenre.save();
        }
      }
    }
    
    // Seed episodes
    for (const episodeItem of episodeData) {
      if (animeMap.has(episodeItem.animeId)) {
        const episode = new Episode({
          animeId: animeMap.get(episodeItem.animeId),
          title: episodeItem.title,
          number: episodeItem.number,
          description: episodeItem.description,
          thumbnail: episodeItem.thumbnail,
          videoUrl: episodeItem.videoUrl,
          duration: episodeItem.duration,
          releaseDate: new Date(episodeItem.releaseDate)
        });
        await episode.save();
        console.log(`Created episode ${episodeItem.number}: ${episodeItem.title}`);
      }
    }
    
    console.log('Database seeding completed successfully');
    return true;
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    if (error.stack) console.error(error.stack);
    return false;
  }
}

/**
 * Main function to run the script
 */
async function main() {
  try {
    // Connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('Failed to connect to MongoDB. Exiting...');
      process.exit(1);
    }
    
    // Seed the database
    const seeded = await seedDatabase();
    if (!seeded) {
      console.log('Database seeding failed or was cancelled.');
    } else {
      console.log('Database has been successfully seeded with initial data!');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.stack) console.error(error.stack);
  } finally {
    // Disconnect from MongoDB
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
    
    process.exit(0);
  }
}

// Run the script
main();