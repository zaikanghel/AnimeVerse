import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Define the anime structure we expect from the API
interface Anime {
  id: string;
  title: string;
  coverImage: string;
  releaseYear: number;
  episodes?: number | null;
  rating?: string | null;
}

export default function TopRated() {
  const [, setLocation] = useLocation();

  // Fetch top rated anime with type transformation
  const { data: topRatedAnimes, isLoading } = useQuery<Anime[]>({
    queryKey: ['/api/top-rated'],
    select: (data) => data.map((anime: any) => ({
      ...anime,
      id: anime.id.toString(), // Ensure ID is a string
    })),
  });

  return (
    <section className="py-10 bg-gradient-to-r from-background to-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold font-sans">Top Rated Anime</h2>
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
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading ? (
            // Skeleton loading state
            Array(6).fill(0).map((_, index) => (
              <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="relative">
                  <Skeleton className="aspect-[2/3] w-full bg-gray-700" />
                </div>
                <div className="p-3">
                  <Skeleton className="h-4 w-full bg-gray-700" />
                  <Skeleton className="h-3 w-1/2 bg-gray-700 mt-1" />
                </div>
              </div>
            ))
          ) : (
            topRatedAnimes?.map(anime => (
              <div 
                key={anime.id}
                className="group cursor-pointer bg-gray-800 rounded-lg overflow-hidden transition duration-200 hover:transform hover:scale-105"
                onClick={() => setLocation(`/anime/${anime.id}`)}
              >
                <div className="relative">
                  <div className="aspect-[2/3] bg-gray-700">
                    <img 
                      src={anime.coverImage} 
                      alt={anime.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black opacity-80"></div>
                  <div className="absolute bottom-2 left-2 bg-yellow-500 text-gray-900 font-bold rounded px-2 py-1 text-xs flex items-center">
                    <Star className="h-3 w-3 mr-1" /> {anime.rating}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-white truncate">{anime.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{anime.episodes} Episodes</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
