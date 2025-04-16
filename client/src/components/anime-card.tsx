import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type AnimeCardProps = {
  anime: {
    id: string;
    title: string;
    coverImage: string;
    releaseYear: number;
    episodes?: number | null;
    rating?: string | null;
  };
  onClick?: () => void;
  className?: string;
};

export default function AnimeCard({ anime, onClick, className }: AnimeCardProps) {
  return (
    <div 
      className={cn(
        "video-card group relative rounded-lg overflow-hidden cursor-pointer", 
        className
      )}
      onClick={onClick}
    >
      <div className="aspect-[2/3] bg-gray-800">
        <img 
          src={anime.coverImage} 
          alt={anime.title} 
          className="w-full h-full object-cover"
        />
        <div className="card-overlay absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-70 group-hover:opacity-90 transition duration-200">
          <div className="play-icon absolute top-1/2 left-1/2 h-12 w-12 bg-secondary bg-opacity-80 rounded-full flex items-center justify-center opacity-0 transform -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      <div className="p-2">
        <h3 className="font-medium text-sm mt-2 text-white truncate">{anime.title}</h3>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-400">
            {anime.releaseYear} 
            {anime.episodes ? ` • ${anime.episodes} Episodes` : ''}
          </span>
          {anime.rating && (
            <span className="text-xs text-gray-300 flex items-center">
              <Star className="h-3 w-3 text-yellow-500 mr-1" /> {anime.rating}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
