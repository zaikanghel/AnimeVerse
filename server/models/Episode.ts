import mongoose from 'mongoose';

export interface IEpisode extends mongoose.Document {
  animeId: mongoose.Schema.Types.ObjectId;
  title: string;
  number: number;
  description?: string;
  thumbnail?: string;
  videoUrl: string;
  duration?: string;
  releaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EpisodeSchema = new mongoose.Schema(
  {
    animeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Anime',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    number: {
      type: Number,
      required: [true, 'Please provide an episode number'],
    },
    description: {
      type: String,
      default: null,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    videoUrl: {
      type: String,
      required: [true, 'Please provide a video URL'],
    },
    duration: {
      type: String,
      default: null,
    },
    releaseDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Make sure an anime can't have duplicate episode numbers
EpisodeSchema.index({ animeId: 1, number: 1 }, { unique: true });

const Episode = mongoose.models.Episode || mongoose.model<IEpisode>('Episode', EpisodeSchema);

export default Episode;