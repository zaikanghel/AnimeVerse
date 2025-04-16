import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Play, Plus, Star, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Define types for our data
interface Genre {
  id: string;
  name: string;
}

interface Anime {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  bannerImage?: string;
  releaseYear: number;
  status: string;
  type: string;
  episodes?: number;
  rating?: string;
  studio?: string;
  genres?: Genre[];
}

interface Episode {
  id: string;
  number: number;
  title: string;
  description?: string;
  thumbnail?: string;
  videoUrl: string;
  duration: string;
  releaseDate: string;
}

type AnimeDetailProps = {
  id: string;
};

export default function AnimeDetail({ id }: AnimeDetailProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch anime details
  const { data: anime, isLoading: animeLoading, error: animeError } = useQuery<Anime>({
    queryKey: [`/api/animes/${id}`],
    select: (data: any) => ({
      ...data,
      id: data.id.toString()
    }),
  });

  // Fetch episodes
  const { data: episodes, isLoading: episodesLoading, error: episodesError } = useQuery<Episode[]>({
    queryKey: [`/api/animes/${id}/episodes`],
    select: (data: any[]) => data.map((episode: any) => ({
      ...episode,
      id: episode.id.toString()
    })),
  });

  // Check if we need to show favorite button or add to favorites
  const { data: favorites = [] } = useQuery<Anime[]>({
    queryKey: ['/api/favorites'],
    enabled: !!user, // Only run query if user is logged in
  });
  
  // Check if anime is already in favorites, safely handling null/undefined
  const isInFavorites = user && favorites && favorites.length > 0 
    ? favorites.some(fav => fav.id === id)
    : false;

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      // Try to convert to number if possible, otherwise pass as string for MongoDB IDs
      const animeIdParam = /^\d+$/.test(id) ? Number(id) : id;
      const response = await apiRequest(
        'POST', 
        '/api/favorites', 
        { animeId: animeIdParam },
        2, // retries
        300, // backoffDelay
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to favorites",
        description: "This anime has been added to your favorites",
      });
      // Invalidate favorites query to refresh favorites list
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to favorites",
        variant: "destructive",
      });
    }
  });
  
  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/favorites/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Removed from favorites",
        description: "This anime has been removed from your favorites",
      });
      // Invalidate favorites query to refresh favorites list
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove from favorites",
        variant: "destructive",
      });
    }
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToList = () => {
    // Check if user is logged in
    if (!user) {
      // Redirect to login page if not logged in
      toast({
        title: "Authentication Required",
        description: "Please log in to add anime to your favorites",
        variant: "destructive",
      });
      setLocation('/auth?redirect=' + encodeURIComponent(`/anime/${id}`));
      return;
    }
    
    // If already in favorites, remove it. Otherwise, add it.
    if (isInFavorites) {
      removeFromFavoritesMutation.mutate();
    } else {
      addToFavoritesMutation.mutate();
    }
  };

  if (animeLoading || episodesLoading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl text-secondary">Loading...</div>
      </div>
    );
  }

  if (animeError || episodesError) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-destructive text-2xl">Error loading anime details.</div>
      </div>
    );
  }

  // Add a safety check
  if (!anime) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-destructive text-2xl">Error: Anime data not found</div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
        <img 
          src={anime.bannerImage || anime.coverImage} 
          alt={anime.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6">
          <h2 className="text-3xl font-bold font-sans text-white mb-2">{anime.title}</h2>
          <div className="flex flex-wrap items-center gap-4">
            <span className="px-2 py-1 bg-dark rounded text-sm text-gray-300 flex items-center">
              <Star className="h-3 w-3 text-yellow-500 mr-1" /> {anime.rating}
            </span>
            <span className="px-2 py-1 bg-dark rounded text-sm text-gray-300">{anime.releaseYear}</span>
            <span className="px-2 py-1 bg-dark rounded text-sm text-gray-300">
              {anime.episodes} Episodes
            </span>
            <span className="px-2 py-1 bg-dark rounded text-sm text-gray-300">{anime.rating}</span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Synopsis</h3>
              <p className="text-gray-300 leading-relaxed">
                {anime.description}
              </p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Episodes</h3>
              <div className="space-y-3">
                {episodes && episodes.length > 0 ? (
                  episodes.map((episode) => (
                    <div 
                      key={episode.id}
                      className="group flex gap-4 p-3 bg-dark rounded-lg hover:bg-dark-light cursor-pointer transition duration-200"
                      onClick={() => setLocation(`/watch/${episode.id}`)}
                    >
                      <div className="flex-shrink-0 w-32 aspect-video rounded overflow-hidden">
                        <img 
                          src={episode.thumbnail || anime.coverImage} 
                          alt={episode.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-white">Episode {episode.number}: {episode.title}</h4>
                          <span className="text-sm text-gray-400">{episode.duration}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {episode.description || `Watch Episode ${episode.number} of ${anime.title}`}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No episodes available
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-dark rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3">Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white">{anime.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Episodes:</span>
                  <span className="text-white">{anime.episodes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-white">{anime.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Released:</span>
                  <span className="text-white">{anime.releaseYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Studio:</span>
                  <span className="text-white">{anime.studio}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-dark rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {anime.genres && anime.genres.length > 0 ? (
                  anime.genres.map((genre) => (
                    <Badge key={genre.id} className="px-3 py-1 bg-gray-800 hover:bg-secondary text-sm text-white">
                      {genre.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-400">No genres listed</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="p-6 bg-dark flex justify-center">
        {episodes && episodes.length > 0 ? (
          <Button 
            className="px-8 py-3 bg-secondary hover:bg-secondary/90 rounded-md transition duration-200 font-medium flex items-center"
            onClick={() => setLocation(`/watch/${episodes[0].id}`)}
          >
            <Play className="h-4 w-4 mr-2" />
            <span>Watch Episode {episodes[0].number}</span>
          </Button>
        ) : (
          <Button 
            className="px-8 py-3 bg-secondary hover:bg-secondary/90 rounded-md transition duration-200 font-medium flex items-center"
            disabled
          >
            <Play className="h-4 w-4 mr-2" />
            <span>No Episodes Available</span>
          </Button>
        )}
        
        {/* Favorite button changes based on login status and current favorite state */}
        <Button
          className={`ml-4 px-8 py-3 rounded-md transition duration-200 font-medium flex items-center
            ${isInFavorites 
              ? 'bg-pink-700 hover:bg-pink-800' 
              : 'bg-dark hover:bg-gray-800'}`}
          onClick={handleAddToList}
          disabled={addToFavoritesMutation.isPending || removeFromFavoritesMutation.isPending}
        >
          {addToFavoritesMutation.isPending || removeFromFavoritesMutation.isPending ? (
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
          ) : (
            isInFavorites ? (
              <Heart className="h-4 w-4 mr-2 fill-white" />
            ) : (
              <Heart className="h-4 w-4 mr-2" />
            )
          )}
          <span>
            {isInFavorites 
              ? removeFromFavoritesMutation.isPending 
                ? 'Removing...' 
                : 'In Favorites'
              : addToFavoritesMutation.isPending 
                ? 'Adding...' 
                : 'Add to Favorites'
            }
          </span>
        </Button>
      </div>
    </div>
  );
}
