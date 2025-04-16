import mongoose from 'mongoose';

export interface IFavorite extends mongoose.Document {
  userId: mongoose.Schema.Types.ObjectId;
  animeId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
}

const FavoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    animeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Anime',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Make sure a user can't favorite the same anime twice
FavoriteSchema.index({ userId: 1, animeId: 1 }, { unique: true });

const Favorite = mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema);

export default Favorite;