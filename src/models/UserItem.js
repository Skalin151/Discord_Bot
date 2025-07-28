import mongoose from 'mongoose';

const UserItemSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    itemId: { type: Number, required: true },
    quantidade: { type: Number, default: 1 },
    compradoEm: { type: Date, default: Date.now }
});

const UserItem = mongoose.model('UserItem', UserItemSchema);
export default UserItem;
