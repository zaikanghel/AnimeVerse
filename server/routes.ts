import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import favoritesRoutes from "./routes/favorites";
import { isMongoConnected } from "./db";
import mongoose from 'mongoose';
import Genre from "./models/Genre";
import Anime from "./models/Anime";
import Episode from "./models/Episode";
import AnimeGenre from "./models/AnimeGenre";
import User from "./models/User";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Register route modules
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/favorites', favoritesRoutes);

  // Get all genres
  app.get('/api/genres', async (req: Request, res: Response) => {
    try {
      if (isMongoConnected) {
        // Use MongoDB
        const genres = await Genre.find().lean();
        
        // Transform MongoDB format to match our API format
        const formattedGenres = genres.map(genre => ({
          id: genre._id,
          name: genre.name,
          createdAt: genre.createdAt
        }));
        
        return res.json(formattedGenres);
      }
      
      // Fallback to in-memory storage
      const genres = await storage.getAllGenres();
      res.json(genres);
    } catch (error) {
      console.error('Error fetching genres:', error);
      res.status(500).json({ message: 'Error fetching genres' });
    }
  });

  // Get animes by genre
  app.get('/api/genres/:id/animes', async (req: Request, res: Response) => {
    try {
      const genreId = req.params.id;
      
      if (isMongoConnected) {
        // Use MongoDB
        const animeGenres = await AnimeGenre.find({ genreId }).lean();
        
        if (!animeGenres.length) {
          return res.json([]);
        }
        
        // Extract anime IDs
        const animeIds = animeGenres.map(ag => ag.animeId);
        
        // Find animes with these IDs
        const animes = await Anime.find({ _id: { $in: animeIds } }).lean();
        
        // Transform MongoDB format to match our API format
        const formattedAnimes = animes.map(anime => ({
          id: anime._id,
          title: anime.title,
          description: anime.description,
          coverImage: anime.coverImage,
          bannerImage: anime.bannerImage,
          releaseYear: anime.releaseYear,
          status: anime.status,
          type: anime.type,
          episodes: anime.episodes,
          rating: anime.rating,
          studio: anime.studio,
          createdAt: anime.createdAt,
          updatedAt: anime.updatedAt
        }));
        
        return res.json(formattedAnimes);
      }
      
      // Fallback to in-memory storage
      const genreIdNum = parseInt(genreId);
      if (isNaN(genreIdNum)) {
        return res.status(400).json({ message: 'Invalid genre ID' });
      }
      
      const animes = await storage.getAnimesByGenre(genreIdNum);
      res.json(animes);
    } catch (error) {
      console.error('Error fetching animes for genre:', error);
      res.status(500).json({ message: 'Error fetching animes for genre' });
    }
  });

  // Get all animes
  app.get('/api/animes', async (req: Request, res: Response) => {
    try {
      if (isMongoConnected) {
        // Use MongoDB
        const animes = await Anime.find().lean();
        
        // Transform MongoDB format to match our API format
        const formattedAnimes = animes.map(anime => ({
          id: anime._id,
          title: anime.title,
          description: anime.description,
          coverImage: anime.coverImage,
          bannerImage: anime.bannerImage,
          releaseYear: anime.releaseYear,
          status: anime.status,
          type: anime.type,
          episodes: anime.episodes,
          rating: anime.rating,
          studio: anime.studio,
          createdAt: anime.createdAt,
          updatedAt: anime.updatedAt
        }));
        
        return res.json(formattedAnimes);
      }
      
      // Fallback to in-memory storage
      const animes = await storage.getAllAnimes();
      res.json(animes);
    } catch (error) {
      console.error('Error fetching animes:', error);
      res.status(500).json({ message: 'Error fetching animes' });
    }
  });

  // Get genres for a specific anime
  app.get('/api/animes/:id/genres', async (req: Request, res: Response) => {
    try {
      const animeId = req.params.id;
      
      if (isMongoConnected) {
        // Use MongoDB - first check if valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(animeId)) {
          // Try fallback to in-memory storage with numeric ID
          const numericId = parseInt(animeId);
          if (isNaN(numericId)) {
            return res.status(400).json({ message: 'Invalid anime ID' });
          }
          
          // Get genres for this anime from memory storage
          const genres = await storage.getAnimeGenres(numericId);
          return res.json(genres);
        }
        
        // Get genres for this anime from MongoDB
        const animeGenres = await AnimeGenre.find({ animeId }).lean();
        const genreIds = animeGenres.map(ag => ag.genreId);
        const genres = await Genre.find({ _id: { $in: genreIds } }).lean();
        
        // Format genres to match API format
        const formattedGenres = genres.map(genre => ({
          id: genre._id,
          name: genre.name
        }));
        
        return res.json(formattedGenres);
      }
      
      // Fallback to in-memory storage
      const numericId = parseInt(animeId);
      if (isNaN(numericId)) {
        return res.status(400).json({ message: 'Invalid anime ID' });
      }
      
      // Get genres for this anime
      const genres = await storage.getAnimeGenres(numericId);
      res.json(genres);
    } catch (error) {
      console.error('Error fetching anime genres:', error);
      res.status(500).json({ 
        message: 'Error fetching anime genres',
        details: error instanceof Error ? error.message : 'Unknown error'  
      });
    }
  });

  // Get a specific anime by ID
  app.get('/api/animes/:id', async (req: Request, res: Response) => {
    try {
      const animeId = req.params.id;
      
      if (isMongoConnected) {
        // Use MongoDB - first check if valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(animeId)) {
          // Try fallback to in-memory storage with numeric ID
          const numericId = parseInt(animeId);
          if (isNaN(numericId)) {
            return res.status(400).json({ message: 'Invalid anime ID' });
          }
          
          const anime = await storage.getAnime(numericId);
          if (!anime) {
            return res.status(404).json({ message: 'Anime not found' });
          }
          
          // Get genres for this anime
          const genres = await storage.getAnimeGenres(numericId);
          
          return res.json({ ...anime, genres });
        }
        
        // Get anime from MongoDB
        const anime = await Anime.findById(animeId).lean();
        
        if (!anime) {
          return res.status(404).json({ message: 'Anime not found' });
        }
        
        // Get genres for this anime
        const animeGenres = await AnimeGenre.find({ animeId }).lean();
        const genreIds = animeGenres.map(ag => ag.genreId);
        const genres = await Genre.find({ _id: { $in: genreIds } }).lean();
        
        // Format genres to match API format
        const formattedGenres = genres.map(genre => ({
          id: genre._id,
          name: genre.name
        }));
        
        // Format the anime to match our API format
        const formattedAnime = {
          id: anime._id,
          title: anime.title,
          description: anime.description,
          coverImage: anime.coverImage,
          bannerImage: anime.bannerImage,
          releaseYear: anime.releaseYear,
          status: anime.status,
          type: anime.type,
          episodes: anime.episodes,
          rating: anime.rating,
          studio: anime.studio,
          createdAt: anime.createdAt,
          updatedAt: anime.updatedAt,
          genres: formattedGenres
        };
        
        return res.json(formattedAnime);
      }
      
      // Fallback to in-memory storage
      const numericId = parseInt(animeId);
      if (isNaN(numericId)) {
        return res.status(400).json({ message: 'Invalid anime ID' });
      }
      
      const anime = await storage.getAnime(numericId);
      if (!anime) {
        return res.status(404).json({ message: 'Anime not found' });
      }
      
      // Get genres for this anime
      const genres = await storage.getAnimeGenres(numericId);
      
      res.json({ ...anime, genres });
    } catch (error) {
      console.error('Error fetching anime:', error);
      res.status(500).json({ message: 'Error fetching anime' });
    }
  });

  // Get episodes for a specific anime
  app.get('/api/animes/:id/episodes', async (req: Request, res: Response) => {
    try {
      const animeId = req.params.id;
      
      if (isMongoConnected) {
        // Use MongoDB - first check if valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(animeId)) {
          // Try fallback to in-memory storage with numeric ID
          const numericId = parseInt(animeId);
          if (isNaN(numericId)) {
            return res.status(400).json({ message: 'Invalid anime ID' });
          }
          
          const episodes = await storage.getEpisodesByAnime(numericId);
          return res.json(episodes);
        }
        
        // Get episodes from MongoDB
        const episodes = await Episode.find({ animeId }).sort({ number: 1 }).lean();
        
        // Transform MongoDB format to match our API format
        const formattedEpisodes = episodes.map(episode => ({
          id: episode._id,
          animeId: episode.animeId,
          title: episode.title,
          number: episode.number,
          description: episode.description,
          thumbnail: episode.thumbnail,
          videoUrl: episode.videoUrl,
          duration: episode.duration,
          releaseDate: episode.releaseDate,
          createdAt: episode.createdAt,
          updatedAt: episode.updatedAt
        }));
        
        return res.json(formattedEpisodes);
      }
      
      // Fallback to in-memory storage
      const numericId = parseInt(animeId);
      if (isNaN(numericId)) {
        return res.status(400).json({ message: 'Invalid anime ID' });
      }
      
      const episodes = await storage.getEpisodesByAnime(numericId);
      res.json(episodes);
    } catch (error) {
      console.error('Error fetching episodes:', error);
      res.status(500).json({ message: 'Error fetching episodes' });
    }
  });

  // Get a specific episode
  app.get('/api/episodes/:id', async (req: Request, res: Response) => {
    try {
      const episodeId = req.params.id;
      
      if (isMongoConnected) {
        // Use MongoDB - first check if valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(episodeId)) {
          // Try fallback to in-memory storage with numeric ID
          const numericId = parseInt(episodeId);
          if (isNaN(numericId)) {
            return res.status(400).json({ message: 'Invalid episode ID' });
          }
          
          const episode = await storage.getEpisode(numericId);
          if (!episode) {
            return res.status(404).json({ message: 'Episode not found' });
          }
          
          // Get the associated anime
          const anime = await storage.getAnime(episode.animeId);
          
          return res.json({ episode, anime });
        }
        
        // Get episode from MongoDB
        const episode = await Episode.findById(episodeId).lean();
        
        if (!episode) {
          return res.status(404).json({ message: 'Episode not found' });
        }
        
        // Get the associated anime
        const anime = await Anime.findById(episode.animeId).lean();
        
        if (!anime) {
          return res.status(404).json({ message: 'Associated anime not found' });
        }
        
        // Format episode to match API format
        const formattedEpisode = {
          id: episode._id,
          animeId: episode.animeId,
          title: episode.title,
          number: episode.number,
          description: episode.description,
          thumbnail: episode.thumbnail,
          videoUrl: episode.videoUrl,
          duration: episode.duration,
          releaseDate: episode.releaseDate,
          createdAt: episode.createdAt,
          updatedAt: episode.updatedAt
        };
        
        // Format anime to match API format
        const formattedAnime = {
          id: anime._id,
          title: anime.title,
          description: anime.description,
          coverImage: anime.coverImage,
          bannerImage: anime.bannerImage,
          releaseYear: anime.releaseYear,
          status: anime.status,
          type: anime.type,
          episodes: anime.episodes,
          rating: anime.rating,
          studio: anime.studio,
          createdAt: anime.createdAt,
          updatedAt: anime.updatedAt
        };
        
        return res.json({ 
          episode: formattedEpisode, 
          anime: formattedAnime 
        });
      }
      
      // Fallback to in-memory storage
      const numericId = parseInt(episodeId);
      if (isNaN(numericId)) {
        return res.status(400).json({ message: 'Invalid episode ID' });
      }
      
      const episode = await storage.getEpisode(numericId);
      if (!episode) {
        return res.status(404).json({ message: 'Episode not found' });
      }
      
      // Get the associated anime
      const anime = await storage.getAnime(episode.animeId);
      
      res.json({ episode, anime });
    } catch (error) {
      console.error('Error fetching episode:', error);
      res.status(500).json({ message: 'Error fetching episode' });
    }
  });

  // Search animes
  app.get('/api/search', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.status(400).json({ message: 'Query must be at least 2 characters' });
      }
      
      if (isMongoConnected) {
        // Use MongoDB text search
        const animes = await Anime.find(
          { $text: { $search: query } },
          { score: { $meta: "textScore" } }
        )
        .sort({ score: { $meta: "textScore" } })
        .lean();
        
        // Transform MongoDB format to match our API format
        const formattedResults = animes.map(anime => ({
          id: anime._id,
          title: anime.title,
          description: anime.description,
          coverImage: anime.coverImage,
          bannerImage: anime.bannerImage,
          releaseYear: anime.releaseYear,
          status: anime.status,
          type: anime.type,
          episodes: anime.episodes,
          rating: anime.rating,
          studio: anime.studio,
          createdAt: anime.createdAt,
          updatedAt: anime.updatedAt
        }));
        
        return res.json(formattedResults);
      }
      
      // Fallback to in-memory storage
      const results = await storage.searchAnimes(query);
      res.json(results);
    } catch (error) {
      console.error('Error performing search:', error);
      res.status(500).json({ message: 'Error performing search' });
    }
  });

  // Get trending animes
  app.get('/api/trending', async (req: Request, res: Response) => {
    try {
      if (isMongoConnected) {
        // Use MongoDB - Get some high-rated animes as trending
        const animes = await Anime.find()
          .sort({ rating: -1 })
          .limit(6)
          .lean();
        
        // Transform MongoDB format to match our API format and get genres
        const result = await Promise.all(animes.map(async (anime) => {
          // Get genres for this anime
          const animeGenres = await AnimeGenre.find({ animeId: anime._id }).lean();
          const genreIds = animeGenres.map(ag => ag.genreId);
          const genres = await Genre.find({ _id: { $in: genreIds } }).lean();
          
          // Format genres to match API format
          const formattedGenres = genres.map(genre => ({
            id: genre._id,
            name: genre.name
          }));
          
          return {
            id: anime._id,
            title: anime.title,
            description: anime.description,
            coverImage: anime.coverImage,
            bannerImage: anime.bannerImage,
            releaseYear: anime.releaseYear,
            status: anime.status,
            type: anime.type,
            episodes: anime.episodes,
            rating: anime.rating,
            studio: anime.studio,
            createdAt: anime.createdAt,
            updatedAt: anime.updatedAt,
            genres: formattedGenres
          };
        }));
        
        return res.json(result);
      }
      
      // Fallback to in-memory storage
      const trendingAnimes = await storage.getTrendingAnimes();
      
      // For each anime, get its genres
      const result = await Promise.all(trendingAnimes.map(async (anime) => {
        const genres = await storage.getAnimeGenres(anime.id);
        return { ...anime, genres };
      }));
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching trending animes:', error);
      res.status(500).json({ message: 'Error fetching trending animes' });
    }
  });

  // Get recently added episodes
  app.get('/api/recently-added', async (req: Request, res: Response) => {
    try {
      if (isMongoConnected) {
        // Use MongoDB - Get recently added episodes
        const episodes = await Episode.find()
          .sort({ createdAt: -1 })
          .limit(6)
          .lean();
        
        if (!episodes.length) {
          return res.json([]);
        }
        
        // Get the unique anime IDs
        const animeIds = [...new Set(episodes.map(ep => ep.animeId))];
        
        // Get all the animes in one query
        const animes = await Anime.find({ _id: { $in: animeIds } }).lean();
        
        // Map anime IDs to anime objects for quick lookup
        const animeMap = new Map();
        for (const anime of animes) {
          animeMap.set(anime._id.toString(), anime);
        }
        
        // For each anime, get its genres
        const genreCache = new Map(); // To avoid duplicate genre queries
        
        const result = await Promise.all(episodes.map(async (episode) => {
          const animeId = episode.animeId.toString();
          const anime = animeMap.get(animeId);
          
          if (!anime) {
            return null; // Skip if anime not found
          }
          
          // Get genres for this anime (use cache if already fetched)
          let formattedGenres;
          if (genreCache.has(animeId)) {
            formattedGenres = genreCache.get(animeId);
          } else {
            const animeGenres = await AnimeGenre.find({ animeId: anime._id }).lean();
            const genreIds = animeGenres.map(ag => ag.genreId);
            const genres = await Genre.find({ _id: { $in: genreIds } }).lean();
            
            formattedGenres = genres.map(genre => ({
              id: genre._id,
              name: genre.name
            }));
            
            genreCache.set(animeId, formattedGenres);
          }
          
          // Format anime and episode to match API format
          const formattedAnime = {
            id: anime._id,
            title: anime.title,
            description: anime.description,
            coverImage: anime.coverImage,
            bannerImage: anime.bannerImage,
            releaseYear: anime.releaseYear,
            status: anime.status,
            type: anime.type,
            episodes: anime.episodes,
            rating: anime.rating,
            studio: anime.studio,
            createdAt: anime.createdAt,
            updatedAt: anime.updatedAt,
            genres: formattedGenres
          };
          
          const formattedEpisode = {
            id: episode._id,
            animeId: episode.animeId,
            title: episode.title,
            number: episode.number,
            description: episode.description,
            thumbnail: episode.thumbnail,
            videoUrl: episode.videoUrl,
            duration: episode.duration,
            releaseDate: episode.releaseDate,
            createdAt: episode.createdAt,
            updatedAt: episode.updatedAt
          };
          
          return { 
            anime: formattedAnime, 
            episode: formattedEpisode 
          };
        }));
        
        // Filter out null entries (skipped due to missing anime)
        const validResults = result.filter(item => item !== null);
        
        return res.json(validResults);
      }
      
      // Fallback to in-memory storage
      const recentEpisodes = await storage.getRecentlyAddedEpisodes();
      
      // For each anime, get its genres
      const result = await Promise.all(recentEpisodes.map(async ({ anime, episode }) => {
        const genres = await storage.getAnimeGenres(anime.id);
        return { anime: { ...anime, genres }, episode };
      }));
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching recently added episodes:', error);
      res.status(500).json({ message: 'Error fetching recently added episodes' });
    }
  });

  // Get top rated animes
  app.get('/api/top-rated', async (req: Request, res: Response) => {
    try {
      if (isMongoConnected) {
        // Use MongoDB - Get top rated animes
        const animes = await Anime.find()
          .sort({ rating: -1 })
          .limit(6)
          .lean();
        
        // Transform MongoDB format to match our API format and get genres
        const result = await Promise.all(animes.map(async (anime) => {
          // Get genres for this anime
          const animeGenres = await AnimeGenre.find({ animeId: anime._id }).lean();
          const genreIds = animeGenres.map(ag => ag.genreId);
          const genres = await Genre.find({ _id: { $in: genreIds } }).lean();
          
          // Format genres to match API format
          const formattedGenres = genres.map(genre => ({
            id: genre._id,
            name: genre.name
          }));
          
          return {
            id: anime._id,
            title: anime.title,
            description: anime.description,
            coverImage: anime.coverImage,
            bannerImage: anime.bannerImage,
            releaseYear: anime.releaseYear,
            status: anime.status,
            type: anime.type,
            episodes: anime.episodes,
            rating: anime.rating,
            studio: anime.studio,
            createdAt: anime.createdAt,
            updatedAt: anime.updatedAt,
            genres: formattedGenres
          };
        }));
        
        return res.json(result);
      }
      
      // Fallback to in-memory storage
      const topRatedAnimes = await storage.getTopRatedAnimes();
      
      // For each anime, get its genres
      const result = await Promise.all(topRatedAnimes.map(async (anime) => {
        const genres = await storage.getAnimeGenres(anime.id);
        return { ...anime, genres };
      }));
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching top rated animes:', error);
      res.status(500).json({ message: 'Error fetching top rated animes' });
    }
  });

  // User registration (simple version)
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const parseResult = insertUserSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid user data', errors: parseResult.error.errors });
      }
      
      if (isMongoConnected) {
        // Check if user exists in MongoDB
        const existingUser = await User.findOne({ username: parseResult.data.username });
        if (existingUser) {
          return res.status(409).json({ message: 'Username already exists' });
        }
        
        // Create new user in MongoDB
        // Password will be hashed by the User model pre-save hook
        const newUser = await User.create({
          username: parseResult.data.username,
          email: `${parseResult.data.username}@example.com`, // Default email
          password: parseResult.data.password,
          isAdmin: false
        });
        
        // Don't return the password in the response
        const userObject = newUser.toObject();
        const { password, ...userWithoutPassword } = userObject;
        
        return res.status(201).json({
          id: userWithoutPassword._id,
          username: userWithoutPassword.username,
          isAdmin: userWithoutPassword.isAdmin,
          createdAt: userWithoutPassword.createdAt
        });
      }
      
      // Fallback to in-memory storage
      const existingUser = await storage.getUserByUsername(parseResult.data.username);
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      
      const newUser = await storage.createUser(parseResult.data);
      
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
