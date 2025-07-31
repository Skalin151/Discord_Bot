import mongoose from 'mongoose';

const UserItemSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    itemId: { type: Number, required: true },
    quantidade: { type: Number, default: 1 },
    compradoEm: { type: Date, default: Date.now },
    equipado: { type: Boolean, default: false },
    // Para pets: guarda a última vez que foi passeado
    lastWalked: { type: Date, default: null },
    // Para itens de trabalho: guarda a última vez que foi usado para trabalhar
    lastWorked: { type: Date, default: null }
});

const UserItem = mongoose.model('UserItem', UserItemSchema);
export default UserItem;
