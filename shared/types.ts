export interface AnimeData {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  bannerImage?: string;
  releaseYear: number;
  status: string;
  type: string;
  episodeCount: number;
  rating: string;
  studio: string;
  genres: string[];
}

export interface EpisodeData {
  id: number;
  animeId: number;
  title: string;
  number: number;
  description: string;
  thumbnail?: string;
  videoUrl: string;
  duration: string;
  releaseDate: string;
}

export interface GenreData {
  id: number;
  name: string;
}
