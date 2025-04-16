import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function GenreFilter() {
  const [activeGenres, setActiveGenres] = useState<string[]>([]);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Define type for genre
  interface Genre {
    id: string;
    name: string;
  }

  // Fetch genres
  const { data: genres, isLoading } = useQuery<Genre[]>({
    queryKey: ['/api/genres'],
  });

  const handleGenreClick = (genreId: string) => {
    // Navigate to the genres page with the selected genre
    setLocation(`/genres?id=${genreId}`);
    
    // Also update local state
    setActiveGenres(prev => {
      // If already active, remove it
      if (prev.includes(genreId)) {
        return prev.filter(id => id !== genreId);
      } 
      // Otherwise, add it
      return [...prev, genreId];
    });
  };

  return (
    <section className="bg-gray-900 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold font-sans">Browse by Genre</h2>
          <a 
            href="/genres" 
            onClick={(e) => {
              e.preventDefault();
              setLocation('/genres');
            }}
            className="text-accent hover:text-accent/80 transition duration-200 text-sm"
          >
            View All Genres
          </a>
        </div>
        <div className="flex overflow-x-auto pb-4 gap-3">
          {isLoading ? (
            // Skeleton loading state
            Array(12).fill(0).map((_, index) => (
              <Skeleton 
                key={index}
                className="whitespace-nowrap h-9 w-24 rounded-full bg-gray-800"
              />
            ))
          ) : genres && genres.length > 0 ? (
            genres.map((genre: Genre) => (
              <button 
                key={genre.id}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full text-gray-300 hover:text-white transition duration-200",
                  {
                    "bg-secondary text-white": activeGenres.includes(genre.id),
                    "bg-gray-800": !activeGenres.includes(genre.id)
                  }
                )}
                onClick={() => handleGenreClick(genre.id)}
              >
                {genre.name}
              </button>
            ))
          ) : (
            <p className="text-gray-400">No genres available</p>
          )}
        </div>
      </div>
    </section>
  );
}
