import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import Favorite from '../models/Favorite';
import { storage } from '../storage';
import mongoose from 'mongoose';

// Extend the Express Request interface to include our helper
declare global {
  namespace Express {
    interface Request {
      getUserId?: () => string;
    }
  }
}

const router = Router();

// Helper function to extract user ID safely
const getUserId = (user: any): string => {
  // For MongoDB documents
  if (user._id) {
    // If it's a MongoDB ObjectId that has a toString method
    if (typeof user._id.toString === 'function') {
      return user._id.toString();
    }
    // Otherwise use it directly
    return user._id;
  }
  
  // For in-memory storage or plain objects
  return user.id;
};

// Authentication check middleware using passport session
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    console.log('User is authenticated via passport session:', req.user?.username);
    // Add a helper to extract user ID consistently
    req.getUserId = () => getUserId(req.user);
    return next();
  }
  
  // Fallback to token auth if passport session fails
  return auth(req, res, next);
};

// GET /api/favorites - Get user's favorites
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get userId consistently using our helper
    const userId = getUserId(req.user);
    console.log('Getting favorites for user ID:', userId);
    
    // If using MongoDB
    const favorites = await Favorite.find({ userId });
    const animeIds = favorites.map(fav => fav.animeId);
    
    // Get full anime details for each favorite
    const animes = await Promise.all(
      animeIds.map(async (animeId) => {
        // Check if MongoDB ID
        if (mongoose.Types.ObjectId.isValid(animeId)) {
          try {
            const mongoAnime = await mongoose.model('Anime').findById(animeId).lean();
            if (mongoAnime) {
              // Format to match API format
              const anime = {
                id: mongoAnime._id,
                title: mongoAnime.title,
                description: mongoAnime.description,
                coverImage: mongoAnime.coverImage,
                bannerImage: mongoAnime.bannerImage,
                releaseYear: mongoAnime.releaseYear,
                status: mongoAnime.status,
                type: mongoAnime.type,
                episodes: mongoAnime.episodes,
                rating: mongoAnime.rating,
                studio: mongoAnime.studio,
                createdAt: mongoAnime.createdAt,
                updatedAt: mongoAnime.updatedAt
              };
              
              // Get genres for MongoDB anime
              const animeGenres = await mongoose.model('AnimeGenre').find({ animeId }).lean();
              const genreIds = animeGenres.map(ag => ag.genreId);
              const genres = await mongoose.model('Genre').find({ _id: { $in: genreIds } }).lean();
              const formattedGenres = genres.map(genre => ({
                id: genre._id,
                name: genre.name
              }));
              
              return { ...anime, genres: formattedGenres };
            }
          } catch (err) {
            console.error('Error finding MongoDB anime:', err);
          }
        }
        
        // Fallback to in-memory storage for numeric IDs
        if (/^\d+$/.test(animeId.toString())) {
          const numericId = parseInt(animeId.toString());
          const anime = await storage.getAnime(numericId);
          if (anime) {
            const genres = await storage.getAnimeGenres(numericId);
            return { ...anime, genres };
          }
        }
        
        return null;
      })
    );
    
    // Filter out any nulls (in case an anime was deleted)
    const validAnimes = animes.filter(Boolean);
    
    res.json(validAnimes);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Error fetching favorites' });
  }
});

// POST /api/favorites - Add to favorites
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { animeId } = req.body;
    
    if (!animeId) {
      return res.status(400).json({ message: 'Anime ID is required' });
    }
    
    // Check if anime exists (handle both MongoDB ObjectId and numeric IDs)
    let anime = null;
    
    // For MongoDB ObjectId, use Mongoose findById
    if (mongoose.Types.ObjectId.isValid(animeId)) {
      try {
        const mongoAnime = await mongoose.model('Anime').findById(animeId).lean();
        if (mongoAnime) {
          // Format to match API format
          anime = {
            id: mongoAnime._id,
            title: mongoAnime.title,
            description: mongoAnime.description,
            coverImage: mongoAnime.coverImage,
            bannerImage: mongoAnime.bannerImage,
            releaseYear: mongoAnime.releaseYear,
            status: mongoAnime.status,
            type: mongoAnime.type,
            episodes: mongoAnime.episodes,
            rating: mongoAnime.rating,
            studio: mongoAnime.studio,
            createdAt: mongoAnime.createdAt,
            updatedAt: mongoAnime.updatedAt
          };
        }
      } catch (err) {
        console.error('Error finding MongoDB anime:', err);
      }
    } 
    
    // Fallback to in-memory storage for numeric IDs
    if (!anime && /^\d+$/.test(animeId)) {
      anime = await storage.getAnime(parseInt(animeId));
    }
    
    if (!anime) {
      return res.status(404).json({ message: 'Anime not found' });
    }
    
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get userId consistently using our helper
    const userId = getUserId(req.user);
    console.log('Adding to favorites for user ID:', userId);
    
    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({
      userId,
      animeId: animeId
    });
    
    if (existingFavorite) {
      return res.status(409).json({ message: 'Anime already in favorites' });
    }
    
    // Add to favorites
    const favorite = new Favorite({
      userId,
      animeId: animeId
    });
    
    await favorite.save();
    
    // Return the anime details
    const genres = await storage.getAnimeGenres(animeId);
    
    res.status(201).json({ 
      message: 'Added to favorites',
      anime: { ...anime, genres }
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ message: 'Error adding to favorites' });
  }
});

// DELETE /api/favorites/:animeId - Remove from favorites
router.delete('/:animeId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get userId consistently using our helper
    const userId = getUserId(req.user);
    console.log('Removing from favorites for user ID:', userId);
    const animeId = req.params.animeId;
    
    // MongoDB ObjectId check - if the ID is numeric, use it directly
    // Otherwise, assume it's a MongoDB ObjectId
    const query = {
      userId,
      animeId: /^\d+$/.test(animeId) ? parseInt(animeId) : animeId
    };
    
    // Delete from favorites
    const result = await Favorite.deleteOne(query);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Favorite not found' });
    }
    
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ message: 'Error removing from favorites' });
  }
});

export default router;