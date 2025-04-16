import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Anime } from '@shared/schema';
import { Link } from 'wouter';
import AnimeCard from '@/components/anime-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Loader2, Search, Filter } from 'lucide-react';

type SortOption = 'releaseYear' | 'title' | 'rating';
type SortOrder = 'asc' | 'desc';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('releaseYear');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const { data: allAnimes = [], isLoading } = useQuery<Anime[]>({
    queryKey: ['/api/animes'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  // Apply search filter
  const filteredAnimes = searchQuery.trim() 
    ? allAnimes.filter(anime => 
        anime.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allAnimes;

  // Apply sorting
  const sortedAnimes = [...filteredAnimes].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy === 'releaseYear') {
      comparison = (a.releaseYear || 0) - (b.releaseYear || 0);
    } else if (sortBy === 'rating') {
      const ratingA = a.rating ? parseFloat(a.rating) : 0;
      const ratingB = b.rating ? parseFloat(b.rating) : 0;
      comparison = ratingA - ratingB;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="container mx-auto px-4 py-28 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Explore Anime</h1>
      
      <div className="bg-gray-800 rounded-lg p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Search anime..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400 mr-2">Sort by:</span>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="releaseYear">Year</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="ml-2"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : sortedAnimes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-4">No anime found matching your search.</p>
          {searchQuery && (
            <Button onClick={() => setSearchQuery('')}>Clear Search</Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-gray-400 mb-4">Found {sortedAnimes.length} anime</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {sortedAnimes.map((anime) => (
              <div key={anime.id} className="block cursor-pointer" onClick={() => window.location.href = `/anime/${anime.id}`}>
                <AnimeCard anime={anime} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}