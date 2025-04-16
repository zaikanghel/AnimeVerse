/**
 * Script to check MongoDB connection and document counts
 * Run with: node scripts/check-mongodb-counts.js
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models
import AnimeModel from '../server/models/Anime.js';
import EpisodeModel from '../server/models/Episode.js';
import GenreModel from '../server/models/Genre.js';
import UserModel from '../server/models/User.js';

// Get model defaults
const Anime = AnimeModel;
const Episode = EpisodeModel;
const Genre = GenreModel;
const User = UserModel;

// Get MongoDB connection details from environment variables with fallbacks
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animeverse';
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'animeverse';

async function connectToMongoDB() {
  try {
    // Prepare connection options
    const options = {
      serverSelectionTimeoutMS: 5000,  // Timeout after 5 seconds
      connectTimeoutMS: 10000,         // Timeout after 10 seconds
      socketTimeoutMS: 30000,          // Close sockets after 30 seconds of inactivity
      maxPoolSize: 50,                 // Maintain up to 50 socket connections
      family: 4                        // Use IPv4, skip trying IPv6
    };
    
    // Build connection URI with credentials if provided
    let connectionUri = MONGODB_URI;
    if (MONGODB_USER && MONGODB_PASSWORD && !MONGODB_URI.includes('@')) {
      // Extract protocol and host
      const uriParts = MONGODB_URI.split('//');
      if (uriParts.length > 1) {
        // Insert credentials into URI
        connectionUri = `${uriParts[0]}//${MONGODB_USER}:${encodeURIComponent(MONGODB_PASSWORD)}@${uriParts[1]}`;
        console.log('Using MongoDB with provided credentials');
      }
    }
    
    // Ensure the database name is included in URI
    if (!connectionUri.includes('/')) {
      connectionUri = `${connectionUri}/${MONGODB_DB_NAME}`;
    }
    
    // Attempt connection to MongoDB
    console.log(`Connecting to MongoDB at ${connectionUri.replace(/\/\/.*@/, '//****:****@')}`);
    await mongoose.connect(connectionUri, options);
    
    console.log('Successfully connected to MongoDB');
    return true;
  } catch (error) {
    console.error(`MongoDB connection error: ${error}`);
    return false;
  }
}

async function getCounts() {
  try {
    console.log('Fetching collection counts...');
    
    // Get counts from MongoDB collections
    const animeCount = await Anime.countDocuments();
    const episodeCount = await Episode.countDocuments();
    const genreCount = await Genre.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log('MongoDB Collection Counts:');
    console.log(`- Anime: ${animeCount}`);
    console.log(`- Episodes: ${episodeCount}`);
    console.log(`- Genres: ${genreCount}`);
    console.log(`- Users: ${userCount}`);
    
    return {
      animeCount,
      episodeCount,
      genreCount,
      userCount
    };
  } catch (error) {
    console.error(`Error fetching counts: ${error}`);
    return null;
  }
}

async function main() {
  try {
    const connected = await connectToMongoDB();
    if (connected) {
      await getCounts();
    }
  } catch (error) {
    console.error(`Script error: ${error}`);
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the script
main();