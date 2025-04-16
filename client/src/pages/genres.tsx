import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn, queryClient } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import AnimeCard from '@/components/anime-card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define interfaces for data types
interface Genre {
  id: string;
  name: string;
}

interface Anime {
  id: string;
  title: string;
  coverImage: string;
  releaseYear: number;
  episodes?: number | null;
  rating?: string | null;
  description: string;
  type: string;
  status: string;
  bannerImage?: string | null;
  studio?: string | null;
}

export default function Genres() {
  const [location, setLocation] = useLocation();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  
  // Parse query parameters when component mounts or location changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const genreId = params.get('id');
    if (genreId) {
      setSelectedGenre(genreId);
    }
  }, [location]);

  const { data: genres = [], isLoading: isLoadingGenres } = useQuery<Genre[]>({
    queryKey: ['/api/genres'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  // Use a custom query function for fetching animes by genre
  const { data: animes = [], isLoading: isLoadingAnimes } = useQuery<Anime[]>({
    queryKey: ['/api/genres', selectedGenre, 'animes'],
    queryFn: async ({ queryKey }) => {
      if (!selectedGenre) return [];
      const response = await fetch(`/api/genres/${selectedGenre}/animes`, {
        credentials: "include"
      });
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error(`Error fetching animes for genre: ${response.statusText}`);
      }
      const data = await response.json();
      // Transform the data to ensure properties match expected format
      return data.map((anime: any) => ({
        ...anime,
        id: anime.id.toString()
      }));
    },
    enabled: !!selectedGenre,
  });

  const handleGenreClick = (genreId: string) => {
    setSelectedGenre(genreId);
    // Update URL to reflect selected genre
    setLocation(`/genres?id=${genreId}`, { replace: true });
  };

  return (
    <div className="container mx-auto px-4 py-28 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Explore Genres</h1>
      
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Select a Genre</h2>
        <div className="flex flex-wrap gap-2">
          {isLoadingGenres ? (
            <div className="flex items-center justify-center w-full py-8">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            genres.map((genre) => (
              <Button
                key={genre.id}
                onClick={() => handleGenreClick(genre.id)}
                variant={selectedGenre === genre.id ? "default" : "outline"}
                className={cn(
                  "transition-all duration-200",
                  selectedGenre === genre.id 
                    ? "bg-accent hover:bg-accent/90 text-white" 
                    : "hover:border-accent hover:text-accent"
                )}
              >
                {genre.name}
              </Button>
            ))
          )}
        </div>
      </div>
      
      {selectedGenre && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {genres.find(g => g.id === selectedGenre)?.name} Anime
          </h2>
          
          {isLoadingAnimes ? (
            <div className="flex items-center justify-center w-full py-16">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : animes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 mb-4">No anime found for this genre.</p>
              <Button onClick={() => setSelectedGenre(null)}>
                Select Another Genre
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {animes.map((anime) => (
                <div 
                  key={anime.id} 
                  className="block cursor-pointer" 
                  onClick={() => window.location.href = `/anime/${anime.id}`}
                >
                  <AnimeCard anime={anime} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}