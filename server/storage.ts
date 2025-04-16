import { 
  Anime, Episode, Genre, AnimeGenre, User, 
  InsertAnime, InsertEpisode, InsertGenre, InsertAnimeGenre, InsertUser
} from "@shared/schema";
import { animeData, genreData, episodeData } from "@shared/data";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserAdminStatus(id: number, isAdmin: boolean): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Anime methods
  getAllAnimes(): Promise<Anime[]>;
  getAnime(id: number): Promise<Anime | undefined>;
  createAnime(anime: InsertAnime): Promise<Anime>;
  updateAnime(id: number, anime: Partial<InsertAnime>): Promise<Anime | undefined>;
  deleteAnime(id: number): Promise<boolean>;
  
  // Genre methods
  getAllGenres(): Promise<Genre[]>;
  getGenre(id: number): Promise<Genre | undefined>;
  getGenreByName(name: string): Promise<Genre | undefined>;
  createGenre(genre: InsertGenre): Promise<Genre>;
  updateGenre(id: number, genre: Partial<InsertGenre>): Promise<Genre | undefined>;
  deleteGenre(id: number): Promise<boolean>;
  
  // Anime-Genre relationship methods
  getAnimeGenres(animeId: number): Promise<Genre[]>;
  getAnimesByGenre(genreId: number): Promise<Anime[]>;
  addGenreToAnime(animeGenre: InsertAnimeGenre): Promise<AnimeGenre>;
  removeGenreFromAnime(animeId: number, genreId: number): Promise<boolean>;
  
  // Episode methods
  getAllEpisodes(): Promise<Episode[]>;
  getEpisode(id: number): Promise<Episode | undefined>;
  getEpisodesByAnime(animeId: number): Promise<Episode[]>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: number, episode: Partial<InsertEpisode>): Promise<Episode | undefined>;
  deleteEpisode(id: number): Promise<boolean>;
  
  // Search methods
  searchAnimes(query: string): Promise<Anime[]>;
  
  // Get trending/recently added/top rated
  getTrendingAnimes(): Promise<Anime[]>;
  getRecentlyAddedEpisodes(): Promise<{ anime: Anime, episode: Episode }[]>;
  getTopRatedAnimes(): Promise<Anime[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private animes: Map<number, Anime>;
  private genres: Map<number, Genre>;
  private animeGenres: Map<number, AnimeGenre>;
  private episodes: Map<number, Episode>;
  private currentUserId: number;
  private currentAnimeId: number;
  private currentGenreId: number;
  private currentAnimeGenreId: number;
  private currentEpisodeId: number;

  constructor() {
    this.users = new Map();
    this.animes = new Map();
    this.genres = new Map();
    this.animeGenres = new Map();
    this.episodes = new Map();
    this.currentUserId = 1;
    this.currentAnimeId = 1;
    this.currentGenreId = 1;
    this.currentAnimeGenreId = 1;
    this.currentEpisodeId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create admin user
    this.users.set(1, {
      id: 1,
      username: 'admin',
      password: 'admin123', // In a real app, this would be hashed
      isAdmin: true,
      createdAt: new Date()
    });
    this.currentUserId = 2;

    // Initialize genres
    genreData.forEach(genre => {
      this.genres.set(this.currentGenreId, {
        id: this.currentGenreId,
        name: genre.name
      });
      this.currentGenreId++;
    });

    // Initialize animes
    animeData.forEach(anime => {
      const animeId = this.currentAnimeId;
      this.animes.set(animeId, {
        id: animeId,
        title: anime.title,
        description: anime.description,
        coverImage: anime.coverImage,
        bannerImage: anime.bannerImage,
        releaseYear: anime.releaseYear,
        status: anime.status,
        type: anime.type,
        episodes: anime.episodeCount,
        rating: anime.rating,
        studio: anime.studio
      });
      
      // Associate genres with anime
      anime.genres.forEach(genreName => {
        const genre = this.findGenreByName(genreName);
        if (genre) {
          this.animeGenres.set(this.currentAnimeGenreId, {
            id: this.currentAnimeGenreId,
            animeId: animeId,
            genreId: genre.id
          });
          this.currentAnimeGenreId++;
        }
      });
      
      this.currentAnimeId++;
    });

    // Initialize episodes
    episodeData.forEach(episode => {
      this.episodes.set(this.currentEpisodeId, {
        id: this.currentEpisodeId,
        animeId: episode.animeId,
        title: episode.title,
        number: episode.number,
        description: episode.description,
        thumbnail: episode.thumbnail,
        videoUrl: episode.videoUrl,
        duration: episode.duration,
        releaseDate: new Date(episode.releaseDate)
      });
      this.currentEpisodeId++;
    });
  }

  private findGenreByName(name: string): Genre | undefined {
    for (const genre of this.genres.values()) {
      if (genre.name.toLowerCase() === name.toLowerCase()) {
        return genre;
      }
    }
    return undefined;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin || false,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUserAdminStatus(id: number, isAdmin: boolean): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }
    
    const updatedUser = { ...user, isAdmin };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Anime methods
  async getAllAnimes(): Promise<Anime[]> {
    return Array.from(this.animes.values());
  }

  async getAnime(id: number): Promise<Anime | undefined> {
    return this.animes.get(id);
  }

  async createAnime(anime: InsertAnime): Promise<Anime> {
    const id = this.currentAnimeId++;
    const newAnime: Anime = { 
      ...anime, 
      id,
      bannerImage: anime.bannerImage || null,
      episodes: anime.episodes || null,
      rating: anime.rating || null,
      studio: anime.studio || null 
    };
    this.animes.set(id, newAnime);
    return newAnime;
  }
  
  async updateAnime(id: number, anime: Partial<InsertAnime>): Promise<Anime | undefined> {
    const existingAnime = this.animes.get(id);
    if (!existingAnime) {
      return undefined;
    }
    
    const updatedAnime: Anime = { 
      ...existingAnime, 
      ...anime,
      bannerImage: anime.bannerImage !== undefined ? anime.bannerImage || null : existingAnime.bannerImage,
      episodes: anime.episodes !== undefined ? anime.episodes || null : existingAnime.episodes,
      rating: anime.rating !== undefined ? anime.rating || null : existingAnime.rating,
      studio: anime.studio !== undefined ? anime.studio || null : existingAnime.studio
    };
    
    this.animes.set(id, updatedAnime);
    return updatedAnime;
  }
  
  async deleteAnime(id: number): Promise<boolean> {
    // First, delete all associated anime-genre relationships
    for (const [animeGenreId, animeGenre] of this.animeGenres.entries()) {
      if (animeGenre.animeId === id) {
        this.animeGenres.delete(animeGenreId);
      }
    }
    
    // Next, delete all associated episodes
    for (const [episodeId, episode] of this.episodes.entries()) {
      if (episode.animeId === id) {
        this.episodes.delete(episodeId);
      }
    }
    
    // Finally, delete the anime itself
    return this.animes.delete(id);
  }

  // Genre methods
  async getAllGenres(): Promise<Genre[]> {
    return Array.from(this.genres.values());
  }

  async getGenre(id: number): Promise<Genre | undefined> {
    return this.genres.get(id);
  }

  async getGenreByName(name: string): Promise<Genre | undefined> {
    return this.findGenreByName(name);
  }

  async createGenre(genre: InsertGenre): Promise<Genre> {
    const id = this.currentGenreId++;
    const newGenre: Genre = { ...genre, id };
    this.genres.set(id, newGenre);
    return newGenre;
  }
  
  async updateGenre(id: number, genre: Partial<InsertGenre>): Promise<Genre | undefined> {
    const existingGenre = this.genres.get(id);
    if (!existingGenre) {
      return undefined;
    }
    
    const updatedGenre: Genre = { ...existingGenre, ...genre };
    this.genres.set(id, updatedGenre);
    return updatedGenre;
  }
  
  async deleteGenre(id: number): Promise<boolean> {
    // First, delete all anime-genre relationships for this genre
    for (const [animeGenreId, animeGenre] of this.animeGenres.entries()) {
      if (animeGenre.genreId === id) {
        this.animeGenres.delete(animeGenreId);
      }
    }
    
    // Then delete the genre itself
    return this.genres.delete(id);
  }

  // Anime-Genre relationship methods
  async getAnimeGenres(animeId: number): Promise<Genre[]> {
    const genreIds = new Set<number>();
    
    for (const animeGenre of this.animeGenres.values()) {
      if (animeGenre.animeId === animeId) {
        genreIds.add(animeGenre.genreId);
      }
    }
    
    return Array.from(genreIds).map(id => this.genres.get(id)).filter(Boolean) as Genre[];
  }

  async getAnimesByGenre(genreId: number): Promise<Anime[]> {
    const animeIds = new Set<number>();
    
    for (const animeGenre of this.animeGenres.values()) {
      if (animeGenre.genreId === genreId) {
        animeIds.add(animeGenre.animeId);
      }
    }
    
    return Array.from(animeIds).map(id => this.animes.get(id)).filter(Boolean) as Anime[];
  }

  async addGenreToAnime(animeGenre: InsertAnimeGenre): Promise<AnimeGenre> {
    const id = this.currentAnimeGenreId++;
    const newAnimeGenre: AnimeGenre = { ...animeGenre, id };
    this.animeGenres.set(id, newAnimeGenre);
    return newAnimeGenre;
  }
  
  async removeGenreFromAnime(animeId: number, genreId: number): Promise<boolean> {
    let found = false;
    
    for (const [animeGenreId, animeGenre] of this.animeGenres.entries()) {
      if (animeGenre.animeId === animeId && animeGenre.genreId === genreId) {
        this.animeGenres.delete(animeGenreId);
        found = true;
      }
    }
    
    return found;
  }

  // Episode methods
  async getAllEpisodes(): Promise<Episode[]> {
    return Array.from(this.episodes.values());
  }

  async getEpisode(id: number): Promise<Episode | undefined> {
    return this.episodes.get(id);
  }

  async getEpisodesByAnime(animeId: number): Promise<Episode[]> {
    const episodes: Episode[] = [];
    
    for (const episode of this.episodes.values()) {
      if (episode.animeId === animeId) {
        episodes.push(episode);
      }
    }
    
    return episodes.sort((a, b) => a.number - b.number);
  }

  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const id = this.currentEpisodeId++;
    const newEpisode: Episode = { 
      ...episode, 
      id, 
      description: episode.description || null,
      thumbnail: episode.thumbnail || null,
      duration: episode.duration || null,
      releaseDate: episode.releaseDate || new Date()
    };
    this.episodes.set(id, newEpisode);
    return newEpisode;
  }
  
  async updateEpisode(id: number, episode: Partial<InsertEpisode>): Promise<Episode | undefined> {
    const existingEpisode = this.episodes.get(id);
    if (!existingEpisode) {
      return undefined;
    }
    
    const updatedEpisode: Episode = { 
      ...existingEpisode, 
      ...episode,
      description: episode.description !== undefined ? episode.description || null : existingEpisode.description,
      thumbnail: episode.thumbnail !== undefined ? episode.thumbnail || null : existingEpisode.thumbnail,
      duration: episode.duration !== undefined ? episode.duration || null : existingEpisode.duration,
      releaseDate: episode.releaseDate || existingEpisode.releaseDate
    };
    
    this.episodes.set(id, updatedEpisode);
    return updatedEpisode;
  }
  
  async deleteEpisode(id: number): Promise<boolean> {
    return this.episodes.delete(id);
  }

  // Search methods
  async searchAnimes(query: string): Promise<Anime[]> {
    const normalizedQuery = query.toLowerCase();
    const results: Anime[] = [];
    
    for (const anime of this.animes.values()) {
      if (anime.title.toLowerCase().includes(normalizedQuery) || 
          anime.description.toLowerCase().includes(normalizedQuery)) {
        results.push(anime);
      }
    }
    
    return results;
  }

  // Get trending/recently added/top rated
  async getTrendingAnimes(): Promise<Anime[]> {
    // In a real app, this would use metrics like view count
    // For now, just return a subset of anime
    const allAnimes = Array.from(this.animes.values());
    // Sort by newest first (using id as proxy for recency)
    return allAnimes.sort((a, b) => b.id - a.id).slice(0, 6);
  }

  async getRecentlyAddedEpisodes(): Promise<{ anime: Anime, episode: Episode }[]> {
    const allEpisodes = Array.from(this.episodes.values());
    // Sort by release date descending
    const sortedEpisodes = allEpisodes.sort((a, b) => 
      b.releaseDate.getTime() - a.releaseDate.getTime()
    ).slice(0, 4);
    
    const result: { anime: Anime, episode: Episode }[] = [];
    
    for (const episode of sortedEpisodes) {
      const anime = this.animes.get(episode.animeId);
      if (anime) {
        result.push({ anime, episode });
      }
    }
    
    return result;
  }

  async getTopRatedAnimes(): Promise<Anime[]> {
    const allAnimes = Array.from(this.animes.values());
    // Sort by rating (assuming rating is in format like "4.9")
    return allAnimes
      .filter(anime => anime.rating) // Only include animes with ratings
      .sort((a, b) => {
        const ratingA = parseFloat(a.rating || "0");
        const ratingB = parseFloat(b.rating || "0");
        return ratingB - ratingA;
      })
      .slice(0, 6);
  }
}

export const storage = new MemStorage();
