import mongoose from 'mongoose';

const horseSchema = new mongoose.Schema({
  horseId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  emoji: { type: String, required: true },
  odds: { type: Number, required: true },
  wins: { type: Number, default: 0 },
  races: { type: Number, default: 0 },
  type: { type: String, required: false },
  traits: { type: [String], required: false }
});

export default mongoose.model('Horse', horseSchema);
