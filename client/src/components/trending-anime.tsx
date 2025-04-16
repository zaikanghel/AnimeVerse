import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AnimeCard from '@/components/anime-card';

// Define the anime type expected by AnimeCard
interface Anime {
  id: string;
  title: string;
  coverImage: string;
  releaseYear: number;
  episodes?: number | null;
  rating?: string | null;
}

export default function TrendingAnime() {
  const [, setLocation] = useLocation();

  // Fetch trending anime with type transformation
  const { data: trendingAnimes, isLoading } = useQuery<Anime[]>({
    queryKey: ['/api/trending'],
    select: (data) => data.map((anime: any) => ({
      ...anime,
      id: anime.id.toString(), // Ensure ID is a string
    })),
  });

  return (
    <section className="py-10 bg-gradient-to-r from-gray-900 to-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold font-sans">Trending Now</h2>
          <a 
            href="/explore"
            onClick={(e) => {
              e.preventDefault();
              setLocation('/explore');
            }}
            className="flex items-center text-accent hover:text-accent/80 transition duration-200"
          >
            <span>View All</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {isLoading ? (
            // Skeleton loading state
            Array(6).fill(0).map((_, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <Skeleton className="aspect-[2/3] w-full bg-gray-800" />
                <div className="p-2">
                  <Skeleton className="h-5 w-3/4 bg-gray-800" />
                  <div className="flex justify-between items-center mt-1">
                    <Skeleton className="h-4 w-1/2 bg-gray-800" />
                    <Skeleton className="h-4 w-14 bg-gray-800" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            trendingAnimes?.map(anime => (
              <AnimeCard 
                key={anime.id}
                anime={anime}
                onClick={() => setLocation(`/anime/${anime.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
