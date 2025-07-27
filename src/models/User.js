import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  points: { type: Number, default: 0 },
  pointsSpent: { type: Number, default: 0 },
  lastDaily: { type: String, default: null }, // YYYY-MM-DD
});

const User = mongoose.model('User', userSchema);
export default User;
