import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

// Define interfaces for the data structure
interface Anime {
  id: string;
  title: string;
  coverImage: string;
  rating?: string | null;
}

interface Episode {
  id: string;
  number: number;
  title: string;
  thumbnail?: string;
  duration: string;
  releaseDate: string;
}

interface RecentEpisode {
  anime: Anime;
  episode: Episode;
}

export default function RecentlyAdded() {
  const [, setLocation] = useLocation();

  // Fetch recently added episodes with type transformations
  const { data: recentEpisodes, isLoading } = useQuery<RecentEpisode[]>({
    queryKey: ['/api/recently-added'],
    select: (data) => data.map((item: any) => ({
      anime: {
        ...item.anime,
        id: item.anime.id.toString()
      },
      episode: {
        ...item.episode,
        id: item.episode.id.toString()
      }
    })),
  });

  return (
    <section className="py-10 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold font-sans">Recently Added</h2>
          <a 
            href="/recently"
            onClick={(e) => {
              e.preventDefault();
              setLocation('/recently');
            }}
            className="flex items-center text-accent hover:text-accent/80 transition duration-200"
          >
            <span>View All</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            // Skeleton loading state
            Array(4).fill(0).map((_, index) => (
              <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
                <Skeleton className="aspect-video w-full bg-gray-700" />
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Skeleton className="h-5 w-36 bg-gray-700" />
                      <Skeleton className="h-4 w-48 bg-gray-700 mt-1" />
                    </div>
                    <Skeleton className="h-4 w-10 bg-gray-700" />
                  </div>
                  <div className="flex items-center mt-2">
                    <Skeleton className="h-3 w-24 bg-gray-700" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            recentEpisodes?.map(({ anime, episode }) => (
              <div 
                key={episode.id}
                className="group cursor-pointer bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-secondary transition duration-200"
                onClick={() => setLocation(`/watch/${episode.id}`)}
              >
                <div className="relative aspect-video bg-gray-700">
                  <img 
                    src={episode.thumbnail || anime.coverImage} 
                    alt={`${anime.title} - Episode ${episode.number}`} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60 group-hover:opacity-80 transition duration-200"></div>
                  <div className="play-icon absolute top-1/2 left-1/2 h-14 w-14 bg-secondary bg-opacity-80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-1 bg-accent rounded text-xs font-medium text-white">NEW</div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-base text-white">{anime.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Episode {episode.number} - {episode.title}
                      </p>
                    </div>
                    <span className="text-xs text-gray-300 flex items-center">
                      <Star className="h-3 w-3 text-yellow-500 mr-1" /> {anime.rating}
                    </span>
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-gray-400">
                      Added {formatDate(episode.releaseDate)}
                    </span>
                    <span className="mx-2 text-gray-600">•</span>
                    <span className="text-xs text-gray-400">{episode.duration}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
