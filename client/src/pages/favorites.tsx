import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import AnimeCard from '@/components/anime-card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define the anime structure expected by AnimeCard
interface Anime {
  id: string;
  title: string;
  coverImage: string;
  releaseYear: number;
  episodes?: number | null;
  rating?: string | null;
  status?: string;
  type?: string;
  genres?: { id: string; name: string; }[];
}

export default function Favorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: favorites = [], isLoading, error } = useQuery<Anime[]>({
    queryKey: ['/api/favorites'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!user,
    select: (data) => {
      // Handle null or undefined data case
      if (!data) return [];
      
      return data.map((anime: any) => ({
        ...anime,
        id: anime.id.toString(), // Ensure ID is a string
      }));
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (animeId: string) => {
      await apiRequest('DELETE', `/api/favorites/${animeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: 'Success',
        description: 'Anime removed from favorites',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-28 min-h-screen">
        <div className="flex justify-center items-center h-full">
          <div className="animate-pulse text-lg">Loading your favorites...</div>
        </div>
      </div>
    );
  }

  if (error) {
    // Handle 401 errors differently as they're likely caused by not being logged in
    const isAuthError = error.message?.includes('401') || error.message?.includes('authentication');
    
    return (
      <div className="container mx-auto px-4 py-28 min-h-screen">
        <div className="flex flex-col justify-center items-center h-full">
          <div className="text-red-500 mb-4 text-xl">
            {isAuthError ? 'Please log in to view your favorites' : 'Error loading favorites'}
          </div>
          <Button asChild>
            <a href={isAuthError ? '/auth' : '/'}>
              {isAuthError ? 'Login Now' : 'Return Home'}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-28 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">My Favorites</h1>
      
      {favorites.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-400 text-lg mb-4">You haven't added any anime to your favorites yet.</p>
          <Button asChild>
            <a href="/">Browse Anime</a>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favorites.map((anime) => (
            <div key={anime.id} className="relative group">
              <AnimeCard anime={anime} />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFavoriteMutation.mutate(anime.id)}
                disabled={removeFavoriteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}