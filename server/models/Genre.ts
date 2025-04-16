import mongoose from 'mongoose';

export interface IGenre extends mongoose.Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const GenreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a genre name'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Genre = mongoose.models.Genre || mongoose.model<IGenre>('Genre', GenreSchema);

export default Genre;