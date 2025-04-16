import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import VideoPlayer from '@/components/video-player';
import EpisodeCard from '@/components/episode-card';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type WatchProps = {
  id: string;
};

export default function Watch({ id }: WatchProps) {
  const [, setLocation] = useLocation();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch episode details
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/episodes/${id}`],
  });

  // Fetch other episodes of the same anime
  const { data: relatedEpisodes } = useQuery({
    queryKey: [`/api/animes/${data?.episode?.animeId}/episodes`],
    enabled: !!data?.episode?.animeId,
  });

  // Scroll to top on mount and when id changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Handle fullscreen toggle
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl text-secondary">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-destructive text-2xl">Error loading episode.</div>
      </div>
    );
  }

  const { episode, anime } = data;
  let nextEpisodes = [];
  
  if (relatedEpisodes) {
    // Filter episodes that come after the current one
    nextEpisodes = relatedEpisodes
      .filter(ep => ep.number > episode.number)
      .sort((a, b) => a.number - b.number)
      .slice(0, 3);
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'pt-16 min-h-screen bg-background'}`}>
      {!isFullscreen && (
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            className="mb-4 text-gray-400 hover:text-white"
            onClick={() => setLocation(`/anime/${anime.id}`)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Anime
          </Button>
        </div>
      )}

      <div className={`container mx-auto px-4 ${isFullscreen ? 'h-full flex items-center' : ''}`}>
        <div className={`w-full ${isFullscreen ? 'max-w-none' : 'max-w-5xl mx-auto'} bg-primary rounded-lg overflow-hidden shadow-xl`}>
          <VideoPlayer 
            videoUrl={episode.videoUrl}
            thumbnail={episode.thumbnail || anime.coverImage}
            title={`${anime.title} - Episode ${episode.number}`}
            isFullscreen={isFullscreen}
            onFullscreenToggle={() => setIsFullscreen(!isFullscreen)}
          />
          
          {!isFullscreen && (
            <>
              <div className="p-4">
                <h3 className="text-xl font-medium mb-2">
                  {anime.title} - Episode {episode.number}: {episode.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {episode.description || `Watch Episode ${episode.number} of ${anime.title}`}
                </p>
              </div>
              
              {nextEpisodes.length > 0 && (
                <div className="p-4 border-t border-gray-800">
                  <h4 className="text-lg font-medium mb-3">Up Next</h4>
                  <div className="flex overflow-x-auto space-x-4 pb-2">
                    {nextEpisodes.map(nextEp => (
                      <EpisodeCard 
                        key={nextEp.id}
                        episode={nextEp}
                        animeCover={anime.coverImage}
                        onClick={() => setLocation(`/watch/${nextEp.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
