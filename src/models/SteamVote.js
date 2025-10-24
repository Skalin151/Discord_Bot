import mongoose from 'mongoose';

const steamVoteSchema = new mongoose.Schema({
  appid: { type: String, required: true, unique: true },
  gameName: { type: String, required: true },
  headerImage: { type: String },
  priceEUR: { type: Object }, // { final, initial, discount_percent }
  priceUAH: { type: Object }, // { final, initial, discount_percent }
  priceUAHinEUR: { type: String },
  lowestEUR: { type: Number },
  lowestUAH: { type: Number },
  familyInfo: { type: Object },
  supportsFamilySharing: { type: Boolean },
  voters: { type: [String], default: [] }, // Array de user IDs
  noVoters: { type: [String], default: [] }, // Array de user IDs que votaram NÃO
  initiator: { type: String, required: true },
  messageId: { type: String },
  channelId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('SteamVote', steamVoteSchema);
