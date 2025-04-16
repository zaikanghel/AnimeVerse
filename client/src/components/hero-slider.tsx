import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Play, Star, Calendar, Clock, Film, ChevronLeft, ChevronRight, Heart, Pause } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Define interfaces for our data structure
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

const SLIDE_INTERVAL = 7000; // 7 seconds
const SLIDE_TRANSITION_DURATION = 600; // 600ms

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user
  const sliderRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch trending anime for the slider
  const { data: trendingAnimes, isLoading } = useQuery<Anime[]>({
    queryKey: ['/api/trending'],
  });

  // Function to advance to the next slide
  const nextSlide = useCallback(() => {
    if (!trendingAnimes || trendingAnimes.length === 0 || isTransitioning || isPaused) return;
    
    setIsTransitioning(true);
    setCurrentSlide((prevSlide) => (prevSlide + 1) % trendingAnimes.length);
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, SLIDE_TRANSITION_DURATION);
  }, [trendingAnimes, isTransitioning, isPaused]);

  // Function to go to the previous slide
  const prevSlide = useCallback(() => {
    if (!trendingAnimes || trendingAnimes.length === 0 || isTransitioning || isPaused) return;
    
    setIsTransitioning(true);
    setCurrentSlide((prevSlide) => 
      prevSlide === 0 ? trendingAnimes.length - 1 : prevSlide - 1
    );
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, SLIDE_TRANSITION_DURATION);
  }, [trendingAnimes, isTransitioning, isPaused]);

  // Auto-advance slides
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(nextSlide, SLIDE_INTERVAL);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [nextSlide, isPaused]);

  // Handle mouse enter/leave for pausing
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Check if we need to show favorite button
  const { data: favorites = [] } = useQuery<Anime[]>({
    queryKey: ['/api/favorites'],
    enabled: !!user, // Only run query if user is logged in
  });
  
  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async (animeId: string) => {
      const response = await apiRequest(
        'POST', 
        '/api/favorites', 
        { animeId },
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
    mutationFn: async (animeId: string) => {
      const response = await apiRequest('DELETE', `/api/favorites/${animeId}`);
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

  // Handle favorite toggle
  const handleFavorite = (animeId: string) => {
    // Check if user is logged in
    if (!user) {
      // Redirect to login page if not logged in
      toast({
        title: "Authentication Required",
        description: "Please log in to add anime to your favorites",
        variant: "destructive",
      });
      setLocation('/auth?redirect=' + encodeURIComponent('/'));
      return;
    }
    
    // Check if already in favorites
    const isInFavorites = favorites.some(fav => fav.id === animeId);
    
    // If already in favorites, remove it. Otherwise, add it.
    if (isInFavorites) {
      removeFromFavoritesMutation.mutate(animeId);
    } else {
      addToFavoritesMutation.mutate(animeId);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nextSlide, prevSlide]);

  if (isLoading || !trendingAnimes || trendingAnimes.length === 0) {
    return (
      <section className="relative h-[75vh] max-h-[800px] overflow-hidden bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-2xl text-white">Loading featured anime...</div>
        </div>
      </section>
    );
  }

  // Take first 5 items for the slider (or fewer if less are available)
  const featuredAnimes = trendingAnimes.slice(0, Math.min(5, trendingAnimes.length));
  const currentAnime = featuredAnimes[currentSlide];
  
  // Calculate progress percentage for the progress bar
  const progressPercentage = isPaused ? 0 : ((SLIDE_INTERVAL - (isTransitioning ? SLIDE_TRANSITION_DURATION : 0)) / SLIDE_INTERVAL) * 100;

  return (
    <section 
      className="relative h-[75vh] max-h-[800px] overflow-hidden group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={sliderRef}
    >
      {/* Hero Slider */}
      <div id="hero-slider" className="relative h-full">
        {featuredAnimes.map((anime: Anime, index: number) => (
          <div 
            key={anime.id}
            className={cn(
              "hero-slide absolute inset-0 transition-all",
              { 
                "opacity-100 z-10 scale-100 duration-700": index === currentSlide, 
                "opacity-0 z-0 scale-105 duration-500": index !== currentSlide 
              }
            )}
          >
            {/* Dark overlay with animated gradient for better text contrast */}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            
            {/* Background image */}
            <img 
              src={anime.bannerImage || anime.coverImage} 
              alt={anime.title} 
              className="h-full w-full object-cover"
            />
            
            {/* Content overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end">
              <div className="container mx-auto px-6 py-16">
                <div className="max-w-3xl">
                  {/* Badge label */}
                  <div className="mb-3">
                    <span className={cn(
                      "inline-block px-4 py-1.5 text-white text-sm font-bold tracking-wider rounded-md",
                      index % 3 === 0 ? "bg-red-600" : 
                      index % 3 === 1 ? "bg-blue-600" : "bg-purple-600"
                    )}>
                      {index === 0 ? "FEATURED" : index === 1 ? "TRENDING" : "NEW SEASON"}
                    </span>
                  </div>
                  
                  {/* Title with animation */}
                  <h1 className={cn(
                    "text-4xl md:text-6xl font-bold mb-4 text-white tracking-tight",
                    { "animate-slideInUp": index === currentSlide }
                  )}>
                    {anime.title}
                  </h1>
                  
                  {/* Description with animation */}
                  <p className={cn(
                    "text-gray-200 text-lg mb-8 line-clamp-3 max-w-xl",
                    { "animate-fadeIn": index === currentSlide }
                  )}>
                    {anime.description}
                  </p>
                  
                  {/* Info badges */}
                  <div className="flex flex-wrap items-center gap-4 mb-8">
                    {anime.rating && (
                      <span className="px-3 py-1.5 bg-black bg-opacity-60 backdrop-blur-sm rounded-full text-white flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-2" /> {anime.rating}
                      </span>
                    )}
                    <span className="px-3 py-1.5 bg-black bg-opacity-60 backdrop-blur-sm rounded-full text-white flex items-center">
                      <Calendar className="h-4 w-4 text-blue-400 mr-2" /> {anime.releaseYear}
                    </span>
                    {anime.episodes && (
                      <span className="px-3 py-1.5 bg-black bg-opacity-60 backdrop-blur-sm rounded-full text-white flex items-center">
                        <Film className="h-4 w-4 text-purple-400 mr-2" /> {anime.episodes} Episodes
                      </span>
                    )}
                    {anime.type && (
                      <span className="px-3 py-1.5 bg-black bg-opacity-60 backdrop-blur-sm rounded-full text-white flex items-center">
                        <Clock className="h-4 w-4 text-green-400 mr-2" /> {anime.type}
                      </span>
                    )}
                  </div>
                  
                  {/* Genres */}
                  <div className="flex flex-wrap gap-3 mb-8">
                    {anime.genres?.slice(0, 4).map((genre: Genre) => (
                      <Badge 
                        key={genre.id}
                        className="px-4 py-1.5 bg-black bg-opacity-60 backdrop-blur-sm hover:bg-gray-800 rounded-full text-white border border-gray-700"
                      >
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      className="flex items-center gap-2 px-6 py-6 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all duration-300 shadow-lg hover:shadow-red-500/30"
                      onClick={() => setLocation(`/anime/${anime.id}`)}
                    >
                      <Play className="h-5 w-5" />
                      <span className="font-semibold">Watch Now</span>
                    </Button>
                    
                    {/* Favorite button with dynamic styling based on favorite status */}
                    <Button 
                      className={cn(
                        "flex items-center gap-2 px-6 py-6 text-white rounded-md transition-all duration-300 border",
                        favorites?.some(fav => fav.id === anime.id)
                          ? "bg-rose-600 hover:bg-rose-700 border-rose-500"
                          : "bg-gray-800 hover:bg-gray-700 border-gray-700"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        handleFavorite(anime.id);
                      }}
                      disabled={addToFavoritesMutation.isPending || removeFromFavoritesMutation.isPending}
                    >
                      <Heart className={cn(
                        "h-5 w-5",
                        favorites?.some(fav => fav.id === anime.id) ? "fill-white text-white" : "text-red-500"
                      )} />
                      <span className="font-semibold">
                        {favorites?.some(fav => fav.id === anime.id) ? "Remove Favorite" : "Add to Favorites"}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Slide Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
        {featuredAnimes.map((_: Anime, index: number) => (
          <button 
            key={index}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300 border border-white/30", 
              { 
                "bg-red-600 w-8": index === currentSlide, 
                "bg-white/30 hover:bg-white/60": index !== currentSlide 
              }
            )}
            onClick={() => {
              setIsTransitioning(true);
              setCurrentSlide(index);
              setTimeout(() => setIsTransitioning(false), SLIDE_TRANSITION_DURATION);
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Progress bar at bottom */}
      {!isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 z-20">
          <div 
            className="h-full bg-red-600 transition-all duration-100 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}
      
      {/* Previous/Next buttons */}
      <button 
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60"
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-7 w-7" />
      </button>
      <button 
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        <ChevronRight className="h-7 w-7" />
      </button>
      
      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute top-6 right-6 z-20 flex items-center gap-2 px-3 py-2 bg-black/50 rounded-md text-white text-sm">
          <Pause className="h-4 w-4" />
          <span>Paused</span>
        </div>
      )}
    </section>
  );
}
