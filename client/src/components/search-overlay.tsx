import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

type SearchOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Search query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: [`/api/search?q=${searchQuery}`],
    enabled: searchQuery.length >= 2,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would navigate to search results page
    console.log("Searching for:", searchQuery);
  };

  const handleAnimeClick = (animeId: number) => {
    setLocation(`/anime/${animeId}`);
    onClose();
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-black bg-opacity-80 z-50 flex items-start pt-24 justify-center transition-opacity duration-300",
        { "opacity-100": isOpen, "opacity-0 pointer-events-none": !isOpen }
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Search Anime</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Input 
                ref={inputRef}
                type="text" 
                placeholder="Search for anime..." 
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-3 px-4 text-white focus:outline-none focus:border-secondary transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit"
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </form>
          
          <div className="mt-4">
            {searchQuery.length >= 2 ? (
              isLoading ? (
                <p className="text-gray-400 text-sm">Searching...</p>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((anime: any) => (
                    <div 
                      key={anime.id}
                      className="flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer"
                      onClick={() => handleAnimeClick(anime.id)}
                    >
                      <img 
                        src={anime.coverImage} 
                        alt={anime.title} 
                        className="w-12 h-16 object-cover rounded mr-3"
                      />
                      <div>
                        <h4 className="font-medium text-white">{anime.title}</h4>
                        <div className="flex items-center mt-1 text-xs text-gray-400">
                          <span>{anime.releaseYear}</span>
                          <span className="mx-2">•</span>
                          <span>{anime.type}</span>
                          <span className="mx-2">•</span>
                          <span>{anime.episodes} Episodes</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No results found</p>
              )
            ) : (
              <p className="text-gray-400 text-sm">
                Try searching: Attack on Titan, My Hero Academia, Demon Slayer
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
