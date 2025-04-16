import mongoose from 'mongoose';

export interface IAnimeGenre extends mongoose.Document {
  animeId: mongoose.Schema.Types.ObjectId;
  genreId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnimeGenreSchema = new mongoose.Schema(
  {
    animeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Anime',
      required: true,
    },
    genreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Genre',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Make sure an anime can't have the same genre twice
AnimeGenreSchema.index({ animeId: 1, genreId: 1 }, { unique: true });

const AnimeGenre = mongoose.models.AnimeGenre || mongoose.model<IAnimeGenre>('AnimeGenre', AnimeGenreSchema);

export default AnimeGenre;