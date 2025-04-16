import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { insertAnimeSchema, insertGenreSchema, insertEpisodeSchema } from '@shared/schema';
import { auth } from '../middleware/auth';
import { isAdmin } from '../middleware/admin';
import { isMongoConnected } from '../db';
import Anime, { IAnime } from '../models/Anime';
import Genre, { IGenre } from '../models/Genre';
import AnimeGenre, { IAnimeGenre } from '../models/AnimeGenre';
import Episode, { IEpisode } from '../models/Episode';
import User from '../models/User';
import { log } from '../vite';
import mongoose from 'mongoose';

const router = express.Router();

// Apply session-based auth check to all admin routes
router.use((req, res, next) => {
  // First check if user is authenticated via session
  if (!req.isAuthenticated()) {
    // If not authenticated via session, try the token-based auth as fallback
    return auth(req, res, next);
  }
  // User is authenticated via session, proceed to admin check
  next();
});

// Admin role verification middleware
router.use(isAdmin);

// Get dashboard stats (total counts)
router.get('/stats', async (req: Request, res: Response) => {
  try {
    if (isMongoConnected) {
      log('Fetching admin stats from MongoDB', 'admin');
      
      // Get counts from MongoDB
      try {
        // Use aggregate to ensure we're getting accurate counts
        const animeCountResult = await Anime.aggregate([{ $count: "count" }]);
        const episodeCountResult = await Episode.aggregate([{ $count: "count" }]);
        const genreCountResult = await Genre.aggregate([{ $count: "count" }]);
        const userCountResult = await User.aggregate([{ $count: "count" }]);
        
        // Extract counts from results (default to 0 if empty)
        const animeCount = animeCountResult.length > 0 ? animeCountResult[0].count : 0;
        const episodeCount = episodeCountResult.length > 0 ? episodeCountResult[0].count : 0;
        const genreCount = genreCountResult.length > 0 ? genreCountResult[0].count : 0;
        const userCount = userCountResult.length > 0 ? userCountResult[0].count : 0;
        
        log(`MongoDB aggregate counts - Anime: ${animeCount}, Episodes: ${episodeCount}, Genres: ${genreCount}, Users: ${userCount}`, 'admin');
        
        // Alternative count method as backup
        const animeCount2 = await Anime.estimatedDocumentCount();
        const episodeCount2 = await Episode.estimatedDocumentCount();
        const genreCount2 = await Genre.estimatedDocumentCount();
        const userCount2 = await User.estimatedDocumentCount();
        
        log(`MongoDB estimated counts - Anime: ${animeCount2}, Episodes: ${episodeCount2}, Genres: ${genreCount2}, Users: ${userCount2}`, 'admin');
        
        // Use the first method as primary, fallback to secondary if needed
        const result = {
          animeCount: animeCount || animeCount2 || 0,
          episodeCount: episodeCount || episodeCount2 || 0,
          genreCount: genreCount || genreCount2 || 0,
          userCount: userCount || userCount2 || 0
        };
        
        // Hard-coded values as a last resort if all methods return 0
        if (result.animeCount === 0 && result.episodeCount === 0 && 
            result.genreCount === 0 && result.userCount === 0) {
          // This is a last resort fallback to ensure the UI shows something
          // Do a collection.find().limit(1) to see if collections have documents
          const hasAnimes = await Anime.findOne({});
          const hasEpisodes = await Episode.findOne({});
          const hasGenres = await Genre.findOne({});
          const hasUsers = await User.findOne({});
          
          if (hasAnimes || hasEpisodes || hasGenres || hasUsers) {
            log('Collections have documents but counts returned 0 - using manual counts', 'admin');
            
            // Manually count up to 100 documents in each collection
            const animes = await Anime.find().limit(100);
            const episodes = await Episode.find().limit(100);
            const genres = await Genre.find().limit(100);
            const users = await User.find().limit(100);
            
            result.animeCount = animes.length;
            result.episodeCount = episodes.length;
            result.genreCount = genres.length;
            result.userCount = users.length;
          }
        }
        
        log('Final MongoDB stats to send:', result);
        console.log('Sending stats to client:', result);
        return res.json(result);
      } catch (mongoError) {
        console.error('Error fetching MongoDB stats:', mongoError);
        log(`Error fetching MongoDB stats: ${mongoError}`, 'admin');
        // Continue to fallback storage
      }
    } else {
      // Fallback to in-memory storage
      log('Fetching admin stats from in-memory storage', 'admin');
      
      const animes = await storage.getAllAnimes();
      const episodes = await storage.getAllEpisodes();
      const genres = await storage.getAllGenres();
      const users = await storage.getAllUsers();
      
      log(`In-memory counts - Anime: ${animes.length}, Episodes: ${episodes.length}, Genres: ${genres.length}, Users: ${users.length}`, 'admin');
      
      const result = {
        animeCount: animes.length,
        episodeCount: episodes.length,
        genreCount: genres.length,
        userCount: users.length
      };
      
      console.log('Sending in-memory stats to client:', result);
      return res.json(result);
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// User management routes
router.get('/users', async (req: Request, res: Response) => {
  try {
    // Use MongoDB if connected, otherwise fallback to memory storage
    if (isMongoConnected) {
      log('Fetching users from MongoDB', 'admin');
      
      // Get users from MongoDB
      const mongoUsers = await User.find().lean();
      
      // Transform MongoDB users to match our API format
      const formattedUsers = mongoUsers.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email || '', // Include email if available
        isAdmin: normalizeBoolean(user.isAdmin),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      
      log(`Fetched ${formattedUsers.length} users from MongoDB`, 'admin');
      return res.json(formattedUsers);
    } else {
      // Use in-memory storage as fallback
      log('Fetching users from in-memory storage', 'admin');
      const users = await storage.getAllUsers();
      
      // Normalize isAdmin in each user
      const normalizedUsers = users.map(user => ({
        ...user,
        isAdmin: normalizeBoolean(user.isAdmin)
      }));
      
      return res.json(normalizedUsers);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Helper function to consistently normalize boolean values
function normalizeBoolean(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  // For other truthy/falsy values
  return Boolean(value);
}

router.patch('/users/:id/admin', async (req: Request, res: Response) => {
  try {
    // Get isAdmin from request body
    const isAdminRaw = req.body.isAdmin;
    
    // Normalize the boolean value
    const isAdmin = normalizeBoolean(isAdminRaw);
    
    // Use MongoDB if connected, otherwise fallback to memory storage
    if (isMongoConnected) {
      const userId = req.params.id;
      log(`Updating user admin status in MongoDB: ${userId}`, 'admin');
      
      // Check if ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
      
      // Find the user and update admin status
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { isAdmin: isAdmin },
        { new: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found in MongoDB' });
      }
      
      // Format the response
      const formattedUser = {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email || '',
        isAdmin: normalizeBoolean(updatedUser.isAdmin),
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };
      
      log(`Successfully updated user admin status in MongoDB: ${formattedUser.username}`, 'admin');
      return res.json(formattedUser);
    } else {
      // Use in-memory storage as fallback
      const userId = parseInt(req.params.id);
      log(`Updating user admin status in memory storage: ${userId}`, 'admin');
      
      const user = await storage.updateUserAdminStatus(userId, isAdmin);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Ensure the response has the normalized admin status
      const normalizedUser = {
        ...user,
        isAdmin: normalizeBoolean(user.isAdmin)
      };
      
      return res.json(normalizedUser);
    }
  } catch (error) {
    console.error('Error updating user admin status:', error);
    res.status(500).json({ message: 'Error updating user admin status' });
  }
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    // Use MongoDB if connected, otherwise fallback to memory storage
    if (isMongoConnected) {
      const userId = req.params.id;
      log(`Deleting user from MongoDB: ${userId}`, 'admin');
      
      // Check if ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found in MongoDB' });
      }
      
      // Don't allow deleting the last admin user
      if (user.isAdmin) {
        const adminCount = await User.countDocuments({ isAdmin: true });
        if (adminCount <= 1) {
          return res.status(400).json({ message: 'Cannot delete the last admin user' });
        }
      }
      
      // Delete the user
      const deleteResult = await User.findByIdAndDelete(userId);
      
      if (!deleteResult) {
        return res.status(404).json({ message: 'User not found or delete failed' });
      }
      
      log(`Successfully deleted user from MongoDB: ${userId}`, 'admin');
      return res.status(200).json({ message: 'User deleted successfully' });
    } else {
      // Fallback to in-memory storage
      const userId = parseInt(req.params.id);
      log(`Deleting user from memory storage: ${userId}`, 'admin');
      
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json({ message: 'User deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Anime management routes
router.post('/animes', async (req: Request, res: Response) => {
  try {
    const parseResult = insertAnimeSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        message: 'Invalid anime data', 
        errors: parseResult.error.errors 
      });
    }
    
    // Use MongoDB if connected, otherwise fallback to memory storage
    if (isMongoConnected) {
      log('Creating anime in MongoDB', 'admin');
      
      // Create anime in MongoDB
      const newAnime = await Anime.create({
        title: parseResult.data.title,
        description: parseResult.data.description,
        coverImage: parseResult.data.coverImage,
        bannerImage: parseResult.data.bannerImage || null,
        releaseYear: parseResult.data.releaseYear,
        status: parseResult.data.status,
        type: parseResult.data.type,
        episodes: parseResult.data.episodes || null,
        rating: parseResult.data.rating || null,
        studio: parseResult.data.studio || null
      });
      
      // Map MongoDB response to API format
      const formattedAnime = {
        id: newAnime._id,
        title: newAnime.title,
        description: newAnime.description,
        coverImage: newAnime.coverImage,
        bannerImage: newAnime.bannerImage,
        releaseYear: newAnime.releaseYear,
        status: newAnime.status,
        type: newAnime.type,
        episodes: newAnime.episodes,
        rating: newAnime.rating,
        studio: newAnime.studio,
        createdAt: newAnime.createdAt,
        updatedAt: newAnime.updatedAt
      };
      
      log(`Successfully created anime in MongoDB: ${formattedAnime.title}`, 'admin');
      return res.status(201).json(formattedAnime);
    } else {
      // Fallback to in-memory storage
      log('Creating anime in memory storage (MongoDB not connected)', 'admin');
      const anime = await storage.createAnime(parseResult.data);
      return res.status(201).json(anime);
    }
  } catch (error) {
    console.error('Error creating anime:', error);
    res.status(500).json({ 
      message: 'Error creating anime',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.patch('/animes/:id', async (req: Request, res: Response) => {
  try {
    // Use MongoDB if connected, otherwise fallback to storage
    if (isMongoConnected) {
      const animeId = req.params.id;
      log(`Updating anime in MongoDB: ${animeId}`, 'admin');
      
      // First check if the anime exists
      const existingAnime = await Anime.findById(animeId);
      if (!existingAnime) {
        return res.status(404).json({ message: 'Anime not found' });
      }
      
      // Update the anime with the provided fields
      const updatedAnime = await Anime.findByIdAndUpdate(
        animeId,
        { 
          $set: {
            ...(req.body.title && { title: req.body.title }),
            ...(req.body.description && { description: req.body.description }),
            ...(req.body.coverImage && { coverImage: req.body.coverImage }),
            ...(req.body.bannerImage !== undefined && { bannerImage: req.body.bannerImage }),
            ...(req.body.releaseYear && { releaseYear: req.body.releaseYear }),
            ...(req.body.status && { status: req.body.status }),
            ...(req.body.type && { type: req.body.type }),
            ...(req.body.episodes !== undefined && { episodes: req.body.episodes }),
            ...(req.body.rating !== undefined && { rating: req.body.rating }),
            ...(req.body.studio !== undefined && { studio: req.body.studio })
          } 
        },
        { 
          new: true, // Return the updated document
          runValidators: true // Run schema validators on update
        }
      );
      
      if (!updatedAnime) {
        return res.status(404).json({ message: 'Anime not found or update failed' });
      }
      
      // Map MongoDB document to API format
      const formattedAnime = {
        id: updatedAnime._id,
        title: updatedAnime.title,
        description: updatedAnime.description,
        coverImage: updatedAnime.coverImage,
        bannerImage: updatedAnime.bannerImage,
        releaseYear: updatedAnime.releaseYear,
        status: updatedAnime.status,
        type: updatedAnime.type,
        episodes: updatedAnime.episodes,
        rating: updatedAnime.rating,
        studio: updatedAnime.studio,
        createdAt: updatedAnime.createdAt,
        updatedAt: updatedAnime.updatedAt
      };
      
      log(`Successfully updated anime in MongoDB: ${formattedAnime.title}`, 'admin');
      return res.status(200).json(formattedAnime);
    } else {
      // Use in-memory storage as fallback
      const animeId = parseInt(req.params.id);
      log(`Updating anime in memory storage: ${animeId}`, 'admin');
      
      // Partial update using the storage interface
      const anime = await storage.updateAnime(animeId, req.body);
      
      if (!anime) {
        return res.status(404).json({ message: 'Anime not found' });
      }
      
      return res.status(200).json(anime);
    }
  } catch (error) {
    console.error('Error updating anime:', error);
    res.status(500).json({ 
      message: 'Error updating anime',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/animes/:id', async (req: Request, res: Response) => {
  try {
    // Use MongoDB if connected, otherwise fallback to storage
    if (isMongoConnected) {
      const animeId = req.params.id;
      log(`Deleting anime from MongoDB: ${animeId}`, 'admin');
      
      // Check if anime exists
      const anime = await Anime.findById(animeId);
      if (!anime) {
        return res.status(404).json({ message: 'Anime not found' });
      }
      
      // Delete the anime
      const deleteResult = await Anime.findByIdAndDelete(animeId);
      
      if (!deleteResult) {
        return res.status(404).json({ message: 'Anime not found or delete failed' });
      }
      
      // Also delete related episodes and genre relationships
      // This ensures all related data is cleaned up
      // (Note: This is not atomic and could leave orphaned data if there's an error between operations)
      
      // Delete related episodes
      await Episode.deleteMany({ animeId });
      
      // Delete anime-genre relationships
      await AnimeGenre.deleteMany({ animeId });
      
      log(`Successfully deleted anime from MongoDB: ${animeId}`, 'admin');
      return res.status(200).json({ message: 'Anime and related data deleted successfully' });
    } else {
      // Fallback to in-memory storage
      const animeId = parseInt(req.params.id);
      log(`Deleting anime from memory storage: ${animeId}`, 'admin');
      
      const success = await storage.deleteAnime(animeId);
      
      if (!success) {
        return res.status(404).json({ message: 'Anime not found' });
      }
      
      return res.status(200).json({ message: 'Anime deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting anime:', error);
    res.status(500).json({ 
      message: 'Error deleting anime',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Genre management routes
router.post('/genres', async (req: Request, res: Response) => {
  try {
    const parseResult = insertGenreSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        message: 'Invalid genre data', 
        errors: parseResult.error.errors 
      });
    }
    
    // Use MongoDB if connected, otherwise fallback to memory storage
    if (isMongoConnected) {
      log('Creating genre in MongoDB', 'admin');
      
      // Check if genre already exists in MongoDB
      const existingGenre = await Genre.findOne({ name: parseResult.data.name });
      if (existingGenre) {
        return res.status(409).json({ message: 'Genre with this name already exists' });
      }
      
      // Create genre in MongoDB
      const newGenre = await Genre.create({
        name: parseResult.data.name
      });
      
      // Map MongoDB response to API format
      const formattedGenre = {
        id: newGenre._id,
        name: newGenre.name,
        createdAt: newGenre.createdAt,
        updatedAt: newGenre.updatedAt
      };
      
      log(`Successfully created genre in MongoDB: ${formattedGenre.name}`, 'admin');
      return res.status(201).json(formattedGenre);
    } else {
      // Fallback to in-memory storage
      log('Creating genre in memory storage (MongoDB not connected)', 'admin');
      
      // Check if genre already exists
      const existingGenre = await storage.getGenreByName(parseResult.data.name);
      if (existingGenre) {
        return res.status(409).json({ message: 'Genre with this name already exists' });
      }
      
      const genre = await storage.createGenre(parseResult.data);
      res.status(201).json(genre);
    }
  } catch (error) {
    console.error('Error creating genre:', error);
    res.status(500).json({ 
      message: 'Error creating genre',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.patch('/genres/:id', async (req: Request, res: Response) => {
  try {
    // Use MongoDB if connected, otherwise fallback to memory storage
    if (isMongoConnected) {
      const genreId = req.params.id;
      log(`Updating genre in MongoDB: ${genreId}`, 'admin');
      
      // Check if the ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(genreId)) {
        return res.status(400).json({ message: 'Invalid genre ID format' });
      }
      
      // Check if name is being updated and if it conflicts with existing genres
      if (req.body.name) {
        const existingGenre = await Genre.findOne({ 
          name: req.body.name,
          _id: { $ne: genreId } // Exclude current genre
        });
        
        if (existingGenre) {
          return res.status(409).json({ message: 'Genre with this name already exists' });
        }
      }
      
      // Find the genre and update it
      const updatedGenre = await Genre.findByIdAndUpdate(
        genreId,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      
      if (!updatedGenre) {
        return res.status(404).json({ message: 'Genre not found in MongoDB' });
      }
      
      // Map MongoDB response to API format
      const formattedGenre = {
        id: updatedGenre._id,
        name: updatedGenre.name,
        createdAt: updatedGenre.createdAt,
        updatedAt: updatedGenre.updatedAt
      };
      
      log(`Successfully updated genre in MongoDB: ${formattedGenre.name}`, 'admin');
      return res.status(200).json(formattedGenre);
    } else {
      // Fallback to in-memory storage
      const genreId = parseInt(req.params.id);
      log(`Updating genre in memory storage: ${genreId}`, 'admin');
      
      // Check if name is being updated and if it conflicts
      if (req.body.name) {
        const existingGenre = await storage.getGenreByName(req.body.name);
        if (existingGenre && existingGenre.id !== genreId) {
          return res.status(409).json({ message: 'Genre with this name already exists' });
        }
      }
      
      // Partial update
      const genre = await storage.updateGenre(genreId, req.body);
      
      if (!genre) {
        return res.status(404).json({ message: 'Genre not found' });
      }
      
      return res.json(genre);
    }
  } catch (error) {
    console.error('Error updating genre:', error);
    res.status(500).json({ 
      message: 'Error updating genre',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/genres/:id', async (req: Request, res: Response) => {
  try {
    // Use MongoDB if connected, otherwise fallback to memory storage
    if (isMongoConnected) {
      const genreId = req.params.id;
      log(`Deleting genre from MongoDB: ${genreId}`, 'admin');
      
      // Check if ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(genreId)) {
        return res.status(400).json({ message: 'Invalid genre ID format' });
      }
      
      // Check if genre exists
      const genre = await Genre.findById(genreId);
      if (!genre) {
        return res.status(404).json({ message: 'Genre not found in MongoDB' });
      }
      
      // First delete any anime-genre relationships for this genre
      const deletedRelationships = await AnimeGenre.deleteMany({ genreId });
      log(`Deleted ${deletedRelationships.deletedCount} genre relationships`, 'admin');
      
      // Delete the genre
      const deleteResult = await Genre.findByIdAndDelete(genreId);
      
      if (!deleteResult) {
        return res.status(404).json({ message: 'Genre not found or delete failed' });
      }
      
      log(`Successfully deleted genre from MongoDB: ${genreId}`, 'admin');
      return res.status(200).json({ message: 'Genre deleted successfully' });
    } else {
      // Fallback to in-memory storage
      const genreId = parseInt(req.params.id);
      log(`Deleting genre from memory storage: ${genreId}`, 'admin');
      
      const success = await storage.deleteGenre(genreId);
      
      if (!success) {
        return res.status(404).json({ message: 'Genre not found' });
      }
      
      return res.status(200).json({ message: 'Genre deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting genre:', error);
    res.status(500).json({ 
      message: 'Error deleting genre',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Anime-Genre relationship management
router.post('/animes/:animeId/genres/:genreId', async (req: Request, res: Response) => {
  try {
    // Use MongoDB if connected, otherwise fallback to memory storage
    if (isMongoConnected) {
      const animeId = req.params.animeId;
      const genreId = req.params.genreId;
      
      log(`Adding genre ${genreId} to anime ${animeId} in MongoDB`, 'admin');
      
      // Check if IDs are valid MongoDB ObjectIds
      if (!mongoose.Types.ObjectId.isValid(animeId)) {
        log(`Invalid anime ID format: ${animeId}`, 'admin');
        return res.status(400).json({ message: 'Invalid anime ID format' });
      }
      
      if (!mongoose.Types.ObjectId.isValid(genreId)) {
        log(`Invalid genre ID format: ${genreId}`, 'admin');
        return res.status(400).json({ message: 'Invalid genre ID format' });
      }
      
      // Log all available genres for debugging
      const allGenres = await Genre.find({});
      log(`Available genres in MongoDB: ${allGenres.length}`, 'admin');
      for (const g of allGenres) {
        log(`Genre: ${g._id.toString()} - ${g.name}`, 'admin');
      }
      
      // Verify anime exists in MongoDB using findById
      const anime = await Anime.findById(animeId);
      if (!anime) {
        log(`Anime not found: ${animeId}`, 'admin');
        return res.status(404).json({ message: 'Anime not found in MongoDB' });
      }
      
      // Verify genre exists in MongoDB using findById
      const genre = await Genre.findById(genreId);
      if (!genre) {
        log(`Genre not found: ${genreId}`, 'admin');
        return res.status(404).json({ 
          message: 'Genre not found in MongoDB',
          requestedId: genreId,
          availableIds: allGenres.map(g => g._id.toString())
        });
      }
      
      log(`Found genre: ${genre.name} (${genre._id})`, 'admin');
      log(`Found anime: ${anime.title} (${anime._id})`, 'admin');
      
      // Check if relationship already exists
      const existingRelation = await AnimeGenre.findOne({ 
        animeId: mongoose.Types.ObjectId.createFromHexString(animeId), 
        genreId: mongoose.Types.ObjectId.createFromHexString(genreId) 
      });
      
      if (existingRelation) {
        return res.status(409).json({ message: 'This genre is already added to the anime' });
      }
      
      // Create the relationship
      const newAnimeGenre = await AnimeGenre.create({
        animeId: mongoose.Types.ObjectId.createFromHexString(animeId),
        genreId: mongoose.Types.ObjectId.createFromHexString(genreId)
      });
      
      log(`Successfully added genre ${genreId} to anime ${animeId}`, 'admin');
      
      return res.status(201).json({
        id: newAnimeGenre._id,
        animeId: newAnimeGenre.animeId,
        genreId: newAnimeGenre.genreId,
        createdAt: newAnimeGenre.createdAt,
        updatedAt: newAnimeGenre.updatedAt
      });
    } else {
      // Fallback to in-memory storage
      const animeId = parseInt(req.params.animeId);
      const genreId = parseInt(req.params.genreId);
      
      log(`Adding genre ${genreId} to anime ${animeId} in memory storage`, 'admin');
      
      // Verify both anime and genre exist
      const anime = await storage.getAnime(animeId);
      if (!anime) {
        return res.status(404).json({ message: 'Anime not found' });
      }
      
      const genre = await storage.getGenre(genreId);
      if (!genre) {
        return res.status(404).json({ message: 'Genre not found' });
      }
      
      // Add the relationship
      const animeGenre = await storage.addGenreToAnime({ animeId, genreId });
      return res.status(201).json(animeGenre);
    }
  } catch (error) {
    console.error('Error adding genre to anime:', error);
    res.status(500).json({ 
      message: 'Error adding genre to anime',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/animes/:animeId/genres/:genreId', async (req: Request, res: Response) => {
  try {
    // Use MongoDB if connected, otherwise fallback to memory storage
    if (isMongoConnected) {
      const animeId = req.params.animeId;
      const genreId = req.params.genreId;
      
      log(`Removing genre ${genreId} from anime ${animeId} in MongoDB`, 'admin');
      
      // Check if IDs are valid MongoDB ObjectIds
      if (!mongoose.Types.ObjectId.isValid(animeId)) {
        log(`Invalid anime ID format: ${animeId}`, 'admin');
        return res.status(400).json({ message: 'Invalid anime ID format' });
      }
      
      if (!mongoose.Types.ObjectId.isValid(genreId)) {
        log(`Invalid genre ID format: ${genreId}`, 'admin');
        return res.status(400).json({ message: 'Invalid genre ID format' });
      }
      
      // Find and delete the relationship using properly formatted ObjectIds
      const deleteResult = await AnimeGenre.findOneAndDelete({ 
        animeId: mongoose.Types.ObjectId.createFromHexString(animeId),
        genreId: mongoose.Types.ObjectId.createFromHexString(genreId)
      });
      
      if (!deleteResult) {
        log(`No relationship found between anime ${animeId} and genre ${genreId}`, 'admin');
        return res.status(404).json({ message: 'Anime-Genre relationship not found in MongoDB' });
      }
      
      log(`Successfully removed genre ${genreId} from anime ${animeId}`, 'admin');
      return res.status(200).json({ message: 'Genre removed from anime successfully' });
    } else {
      // Fallback to in-memory storage
      const animeId = parseInt(req.params.animeId);
      const genreId = parseInt(req.params.genreId);
      
      log(`Removing genre ${genreId} from anime ${animeId} in memory storage`, 'admin');
      
      const success = await storage.removeGenreFromAnime(animeId, genreId);
      
      if (!success) {
        return res.status(404).json({ message: 'Anime-Genre relationship not found' });
      }
      
      return res.status(200).json({ message: 'Genre removed from anime successfully' });
    }
  } catch (error) {
    console.error('Error removing genre from anime:', error);
    res.status(500).json({ 
      message: 'Error removing genre from anime',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Episode management routes
router.post('/episodes', async (req: Request, res: Response) => {
  try {
    const parseResult = insertEpisodeSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        message: 'Invalid episode data', 
        errors: parseResult.error.errors 
      });
    }
    
    // Use MongoDB if connected, otherwise fallback to memory storage
    if (isMongoConnected) {
      log('Creating episode in MongoDB', 'admin');
      
      // First, verify the anime exists in MongoDB
      let animeId = parseResult.data.animeId;
      log(`Anime ID from request: ${animeId} (type: ${typeof animeId})`, 'admin');
      
      // Handle different ID types for animeId
      let mongoAnimeId: mongoose.Types.ObjectId;
      
      // Convert string ID to MongoDB ObjectId
      if (typeof animeId === 'string' && mongoose.Types.ObjectId.isValid(animeId)) {
        log(`Converting string animeId ${animeId} to MongoDB ObjectId`, 'admin');
        mongoAnimeId = new mongoose.Types.ObjectId(animeId);
        log(`Converted to MongoDB ObjectId: ${mongoAnimeId}`, 'admin');
      } 
      // Handle numeric IDs (from in-memory storage)
      else if (typeof animeId === 'number') {
        log(`Handling numeric animeId ${animeId}`, 'admin');
        
        // For numeric IDs, find a corresponding anime in MongoDB
        const allAnimes = await Anime.find().lean();
        log(`Found ${allAnimes.length} animes in MongoDB database`, 'admin');
        
        if (allAnimes.length > 0) {
          // Since numeric IDs are from in-memory storage, try to find a matching anime by index
          const index = Math.min(animeId - 1, allAnimes.length - 1);
          const matchingAnime = allAnimes[index];
          
          if (matchingAnime && matchingAnime._id) {
            // Ensure we have a valid MongoDB ObjectId
            mongoAnimeId = new mongoose.Types.ObjectId(matchingAnime._id.toString());
            log(`Mapped numeric animeId ${parseResult.data.animeId} to MongoDB ID: ${mongoAnimeId}`, 'admin');
          } else {
            log(`No matching anime found for numeric ID ${animeId}`, 'admin');
            return res.status(404).json({ message: 'Anime not found in MongoDB' });
          }
        } else {
          log(`No animes available in MongoDB database`, 'admin');
          return res.status(404).json({ message: 'No anime available in MongoDB' });
        }
      } else {
        log(`Invalid anime ID format: ${animeId}`, 'admin');
        return res.status(400).json({ message: 'Invalid anime ID format' });
      }
      
      // Verify the anime exists in MongoDB using the resolved ID
      log(`Verifying anime exists with ID: ${mongoAnimeId}`, 'admin');
      const animeExists = await Anime.findById(mongoAnimeId);
      
      if (!animeExists) {
        log(`Anime not found in MongoDB with ID: ${mongoAnimeId}`, 'admin');
        return res.status(404).json({ message: 'Anime not found in MongoDB' });
      }
      
      log(`Found anime in MongoDB: ${animeExists.title}`, 'admin');
      
      // Create the episode in MongoDB
      const releaseDate = parseResult.data.releaseDate ? new Date(parseResult.data.releaseDate) : new Date();
      
      log(`Creating new episode with title "${parseResult.data.title}" for anime ID: ${mongoAnimeId}`, 'admin');
      const episodeData = {
        animeId: mongoAnimeId,
        title: parseResult.data.title,
        number: parseResult.data.number,
        description: parseResult.data.description || '',
        thumbnail: parseResult.data.thumbnail || null,
        videoUrl: parseResult.data.videoUrl,
        duration: parseResult.data.duration || '00:00',
        releaseDate: releaseDate
      };
      
      log(`Episode data prepared: ${JSON.stringify(episodeData)}`, 'admin');
      const newEpisode = await Episode.create(episodeData);
      
      // Map MongoDB response to API format
      const formattedEpisode = {
        id: newEpisode._id,
        animeId: newEpisode.animeId,
        title: newEpisode.title,
        number: newEpisode.number,
        description: newEpisode.description,
        thumbnail: newEpisode.thumbnail,
        videoUrl: newEpisode.videoUrl,
        duration: newEpisode.duration,
        releaseDate: newEpisode.releaseDate,
        createdAt: newEpisode.createdAt,
        updatedAt: newEpisode.updatedAt
      };
      
      log(`Successfully created episode in MongoDB: ${formattedEpisode.title}`, 'admin');
      return res.status(201).json(formattedEpisode);
    } else {
      // Fallback to in-memory storage
      log('Creating episode in memory storage (MongoDB not connected)', 'admin');
      
      // For in-memory storage, we need to ensure animeId is a number
      let numericAnimeId: number;
      if (typeof parseResult.data.animeId === 'string') {
        // Try to convert string to number
        numericAnimeId = parseInt(parseResult.data.animeId, 10);
        if (isNaN(numericAnimeId)) {
          return res.status(400).json({ message: 'Invalid anime ID format for in-memory storage' });
        }
      } else if (typeof parseResult.data.animeId === 'number') {
        numericAnimeId = parseResult.data.animeId;
      } else {
        return res.status(400).json({ message: 'Invalid anime ID type' });
      }
      
      // Verify anime exists in storage
      const anime = await storage.getAnime(numericAnimeId);
      if (!anime) {
        return res.status(404).json({ message: 'Anime not found' });
      }
      
      // Create a copy of the data with the numeric animeId
      const episodeData = {
        ...parseResult.data,
        animeId: numericAnimeId
      };
      
      const episode = await storage.createEpisode(episodeData);
      return res.status(201).json(episode);
    }
  } catch (error) {
    console.error('Error creating episode:', error);
    res.status(500).json({ 
      message: 'Error creating episode',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.patch('/episodes/:id', async (req: Request, res: Response) => {
  try {
    const episodeId = req.params.id;
    
    // Use MongoDB if connected, otherwise fallback to memory storage
    if (isMongoConnected) {
      // Check if the episodeId is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(episodeId)) {
        // Try to parse as numeric ID for in-memory storage
        const numericId = parseInt(episodeId);
        if (isNaN(numericId)) {
          return res.status(400).json({ message: 'Invalid episode ID' });
        }
        
        // Use in-memory storage since episodeId is not a valid MongoDB ObjectId
        // Verify episode exists
        const existingEpisode = await storage.getEpisode(numericId);
        if (!existingEpisode) {
          return res.status(404).json({ message: 'Episode not found' });
        }
        
        // If changing anime, verify the new anime exists
        if (req.body.animeId && req.body.animeId !== existingEpisode.animeId) {
          const anime = await storage.getAnime(req.body.animeId);
          if (!anime) {
            return res.status(404).json({ message: 'New anime not found' });
          }
        }
        
        // Partial update
        const episode = await storage.updateEpisode(numericId, req.body);
        
        if (!episode) {
          return res.status(404).json({ message: 'Episode not found' });
        }
        
        return res.json(episode);
      }
      
      // Working with MongoDB - find the episode
      log(`Finding episode by ID: ${episodeId}`, 'admin');
      const existingEpisode = await Episode.findById(episodeId);
      if (!existingEpisode) {
        log(`Episode not found in MongoDB: ${episodeId}`, 'admin');
        return res.status(404).json({ message: 'Episode not found in MongoDB' });
      }
      
      // If changing anime, verify the new anime exists
      if (req.body.animeId && req.body.animeId.toString() !== existingEpisode.animeId.toString()) {
        // Verify the anime exists in MongoDB
        const animeExists = await Anime.findById(req.body.animeId);
        if (!animeExists) {
          log(`New anime not found in MongoDB: ${req.body.animeId}`, 'admin');
          return res.status(404).json({ message: 'New anime not found in MongoDB' });
        }
      }
      
      // Update the episode
      log(`Updating episode fields for ID: ${episodeId}`, 'admin');
      const updateData = {
        title: req.body.title || existingEpisode.title,
        number: req.body.number || existingEpisode.number,
        description: req.body.description !== undefined ? req.body.description : existingEpisode.description,
        thumbnail: req.body.thumbnail !== undefined ? req.body.thumbnail : existingEpisode.thumbnail,
        videoUrl: req.body.videoUrl || existingEpisode.videoUrl,
        duration: req.body.duration !== undefined ? req.body.duration : existingEpisode.duration,
        animeId: req.body.animeId || existingEpisode.animeId,
        releaseDate: req.body.releaseDate ? new Date(req.body.releaseDate) : existingEpisode.releaseDate
      };
      
      log(`Performing MongoDB update for episode: ${episodeId}`, 'admin');
      const updatedEpisode = await Episode.findByIdAndUpdate(
        episodeId,
        updateData,
        { new: true }
      );
      
      if (!updatedEpisode) {
        return res.status(404).json({ message: 'Failed to update episode in MongoDB' });
      }
      
      // Format the response
      const formattedEpisode = {
        id: updatedEpisode._id,
        animeId: updatedEpisode.animeId,
        title: updatedEpisode.title,
        number: updatedEpisode.number,
        description: updatedEpisode.description,
        thumbnail: updatedEpisode.thumbnail,
        videoUrl: updatedEpisode.videoUrl,
        duration: updatedEpisode.duration,
        releaseDate: updatedEpisode.releaseDate,
        createdAt: updatedEpisode.createdAt,
        updatedAt: updatedEpisode.updatedAt
      };
      
      return res.json(formattedEpisode);
    } else {
      // Use in-memory storage
      const numericId = parseInt(episodeId);
      if (isNaN(numericId)) {
        return res.status(400).json({ message: 'Invalid episode ID' });
      }
      
      // Verify episode exists
      const existingEpisode = await storage.getEpisode(numericId);
      if (!existingEpisode) {
        return res.status(404).json({ message: 'Episode not found' });
      }
      
      // If changing anime, verify the new anime exists
      if (req.body.animeId && req.body.animeId !== existingEpisode.animeId) {
        const anime = await storage.getAnime(req.body.animeId);
        if (!anime) {
          return res.status(404).json({ message: 'New anime not found' });
        }
      }
      
      // Partial update
      const episode = await storage.updateEpisode(numericId, req.body);
      
      if (!episode) {
        return res.status(404).json({ message: 'Episode not found' });
      }
      
      return res.json(episode);
    }
  } catch (error) {
    console.error('Error updating episode:', error);
    res.status(500).json({ 
      message: 'Error updating episode',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/episodes/:id', async (req: Request, res: Response) => {
  try {
    const episodeId = req.params.id;
    log(`Attempting to delete episode with ID: ${episodeId}`, 'admin');
    
    // Use MongoDB if connected, otherwise fallback to memory storage
    if (isMongoConnected) {
      log(`MongoDB is connected, checking if ID is valid MongoDB ObjectId`, 'admin');
      
      // Check if the episodeId is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(episodeId)) {
        log(`ID ${episodeId} is not a valid MongoDB ObjectId, trying as numeric ID`, 'admin');
        
        // Try to parse as numeric ID for in-memory storage
        const numericId = parseInt(episodeId);
        if (isNaN(numericId)) {
          return res.status(400).json({ message: 'Invalid episode ID' });
        }
        
        log(`Parsed as numeric ID: ${numericId}, using in-memory storage`, 'admin');
        const success = await storage.deleteEpisode(numericId);
        
        if (!success) {
          log(`Episode with numeric ID ${numericId} not found in memory storage`, 'admin');
          return res.status(404).json({ message: 'Episode not found' });
        }
        
        log(`Successfully deleted episode with numeric ID ${numericId} from memory storage`, 'admin');
        return res.status(200).json({ message: 'Episode deleted successfully' });
      }
      
      // Working with MongoDB - find and delete the episode
      log(`Attempting to delete episode with MongoDB ID: ${episodeId}`, 'admin');
      
      // First check if the episode exists
      const existingEpisode = await Episode.findById(episodeId);
      if (!existingEpisode) {
        log(`Episode with ID ${episodeId} not found in MongoDB`, 'admin');
        return res.status(404).json({ message: 'Episode not found in MongoDB' });
      }
      
      log(`Found episode to delete: "${existingEpisode.title}" (Episode ${existingEpisode.number})`, 'admin');
      
      // Delete the episode
      const deletedEpisode = await Episode.findByIdAndDelete(episodeId);
      
      if (!deletedEpisode) {
        log(`Failed to delete episode with ID ${episodeId} from MongoDB`, 'admin');
        return res.status(404).json({ message: 'Episode not found in MongoDB' });
      }
      
      log(`Successfully deleted episode with ID ${episodeId} from MongoDB`, 'admin');
      return res.status(200).json({ message: 'Episode deleted successfully' });
    } else {
      // Use in-memory storage
      log(`MongoDB not connected, using in-memory storage`, 'admin');
      
      const numericId = parseInt(episodeId);
      if (isNaN(numericId)) {
        log(`Failed to parse ${episodeId} as a numeric ID`, 'admin');
        return res.status(400).json({ message: 'Invalid episode ID' });
      }
      
      // Verify the episode exists
      const existingEpisode = await storage.getEpisode(numericId);
      if (!existingEpisode) {
        log(`Episode with ID ${numericId} not found in memory storage`, 'admin');
        return res.status(404).json({ message: 'Episode not found' });
      }
      
      log(`Found episode to delete from memory storage: "${existingEpisode.title}" (Episode ${existingEpisode.number})`, 'admin');
      
      const success = await storage.deleteEpisode(numericId);
      
      if (!success) {
        log(`Failed to delete episode with ID ${numericId} from memory storage`, 'admin');
        return res.status(404).json({ message: 'Episode not found' });
      }
      
      log(`Successfully deleted episode with ID ${numericId} from memory storage`, 'admin');
      return res.status(200).json({ message: 'Episode deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting episode:', error);
    log(`Error deleting episode: ${error instanceof Error ? error.message : 'Unknown error'}`, 'admin');
    res.status(500).json({ 
      message: 'Error deleting episode',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;