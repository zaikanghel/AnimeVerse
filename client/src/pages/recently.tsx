import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Anime, Episode } from '@shared/schema';
import { Link } from 'wouter';
import { Loader2, Calendar, Clock } from 'lucide-react';
import { formatDate, formatDuration, truncateText } from '@/lib/utils';

interface RecentlyAddedItem {
  anime: Anime;
  episode: Episode;
}

export default function RecentlyAdded() {
  const { data: recentlyAdded = [], isLoading } = useQuery<RecentlyAddedItem[]>({
    queryKey: ['/api/recently-added'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  return (
    <div className="container mx-auto px-4 py-28 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Recently Added Episodes</h1>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : recentlyAdded.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No recently added episodes found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {recentlyAdded.map(({ anime, episode }) => (
            <div 
              key={episode.id} 
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/4 lg:w-1/5">
                  <div className="relative aspect-video md:aspect-square bg-gray-900">
                    <img 
                      src={episode.thumbnail ? episode.thumbnail : anime.coverImage} 
                      alt={`${anime.title} - Episode ${episode.number}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                      <span className="inline-block bg-accent text-white text-xs px-2 py-1 rounded">
                        EP {episode.number}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 md:w-3/4 lg:w-4/5">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <span 
                        className="text-accent hover:underline font-medium cursor-pointer"
                        onClick={() => window.location.href = `/anime/${anime.id}`}
                      >
                        {anime.title}
                      </span>
                      <h3 className="text-lg font-bold mt-1 mb-2">
                        <span 
                          className="hover:text-accent transition-colors cursor-pointer"
                          onClick={() => window.location.href = `/watch/${episode.id}`}
                        >
                          Episode {episode.number}: {episode.title}
                        </span>
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        {episode.description 
                          ? truncateText(episode.description, 150) 
                          : `Watch episode ${episode.number} of ${anime.title}`}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(episode.releaseDate)}</span>
                      </div>
                      {episode.duration && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{formatDuration(episode.duration)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}