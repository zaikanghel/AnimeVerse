import mongoose from 'mongoose';

export interface IAnime extends mongoose.Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const AnimeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    coverImage: {
      type: String,
      required: [true, 'Please provide a cover image URL'],
    },
    bannerImage: {
      type: String,
      default: null,
    },
    releaseYear: {
      type: Number,
      required: [true, 'Please provide a release year'],
    },
    status: {
      type: String,
      required: [true, 'Please provide a status'],
      enum: ['Ongoing', 'Completed', 'Announced', 'Cancelled'],
    },
    type: {
      type: String,
      required: [true, 'Please provide a type'],
      enum: ['TV', 'TV Series', 'Movie', 'OVA', 'Special', 'ONA'],
    },
    episodes: {
      type: Number,
      default: null,
    },
    rating: {
      type: String,
      default: null,
    },
    studio: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for search
AnimeSchema.index({ title: 'text', description: 'text' });

const Anime = mongoose.models.Anime || mongoose.model<IAnime>('Anime', AnimeSchema);

export default Anime;