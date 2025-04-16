import { formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';

type EpisodeCardProps = {
  episode: {
    id: number;
    number: number;
    title: string;
    thumbnail?: string;
    duration: string;
    description?: string;
  };
  animeCover: string;
  onClick?: () => void;
  className?: string;
};

export default function EpisodeCard({ episode, animeCover, onClick, className }: EpisodeCardProps) {
  return (
    <div 
      className={cn(
        "video-card flex-shrink-0 w-64 cursor-pointer bg-gray-800 rounded overflow-hidden",
        className
      )}
      onClick={onClick}
    >
      <div className="relative aspect-video">
        <img 
          src={episode.thumbnail || animeCover} 
          alt={`Episode ${episode.number}`} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-xs px-2 py-1 rounded">
          {formatDuration(episode.duration)}
        </div>
      </div>
      <div className="p-2">
        <p className="text-sm font-medium text-white line-clamp-1">
          Episode {episode.number}: {episode.title}
        </p>
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
          {episode.description || `Watch Episode ${episode.number}`}
        </p>
      </div>
    </div>
  );
}
