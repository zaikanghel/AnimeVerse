import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { log } from './vite';
import { genreData, animeData, episodeData } from '../shared/data';
import Anime from './models/Anime';
import Genre from './models/Genre';
import Episode from './models/Episode';
import AnimeGenre from './models/AnimeGenre';
import User from './models/User';

let mongoServer: MongoMemoryServer;
let isMemoryServerConnected = false;

export async function startMongoMemoryServer() {
  try {
    log('Starting MongoDB Memory Server...', 'mongodb');
    
    // Create a new MongoDB memory server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the memory server
    await mongoose.connect(mongoUri);
    isMemoryServerConnected = true;
    
    log(`Connected to MongoDB Memory Server at ${mongoUri}`, 'mongodb');
    
    // Seed the database with initial data
    await seedDatabase();
    
    return true;
  } catch (error) {
    log(`Error starting MongoDB Memory Server: ${error}`, 'mongodb');
    return false;
  }
}

export async function stopMongoMemoryServer() {
  if (mongoServer) {
    await mongoose.disconnect();
    await mongoServer.stop();
    log('MongoDB Memory Server stopped', 'mongodb');
  }
}

async function seedDatabase() {
  try {
    log('Seeding database with initial data...', 'mongodb');
    
    // Create admin user
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@animeverse.com',
        password: 'admin123',
        isAdmin: true,
      });
      log('Admin user created', 'mongodb');
    } else {
      log('Admin user already exists', 'mongodb');
    }
    
    // Create genres
    const genreIds: Record<number, mongoose.Types.ObjectId> = {};
    for (const genre of genreData) {
      const existingGenre = await Genre.findOne({ name: genre.name });
      if (existingGenre) {
        genreIds[genre.id] = existingGenre._id;
      } else {
        const newGenre = await Genre.create({ name: genre.name });
        genreIds[genre.id] = newGenre._id;
        log(`Created genre: ${genre.name}`, 'mongodb');
      }
    }
    
    // Create animes
    const animeIds: Record<number, mongoose.Types.ObjectId> = {};
    for (const anime of animeData) {
      const existingAnime = await Anime.findOne({ title: anime.title });
      if (existingAnime) {
        animeIds[anime.id] = existingAnime._id;
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
        log(`Created anime: ${anime.title}`, 'mongodb');
        
        // Create anime-genre relationships
        for (const genreName of anime.genres) {
          const genre = await Genre.findOne({ name: genreName });
          if (genre) {
            await AnimeGenre.create({
              animeId: newAnime._id,
              genreId: genre._id,
            });
          }
        }
      }
    }
    
    // Create episodes
    for (const episode of episodeData) {
      const animeId = animeIds[episode.animeId];
      if (!animeId) continue;
      
      const existingEpisode = await Episode.findOne({
        animeId: animeId,
        number: episode.number,
      });
      
      if (!existingEpisode) {
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
        log(`Created episode ${episode.number}: ${episode.title}`, 'mongodb');
      }
    }
    
    log('Database seeding completed', 'mongodb');
  } catch (error) {
    log(`Error seeding database: ${error}`, 'mongodb');
  }
}

export function isConnected() {
  return isMemoryServerConnected;
}