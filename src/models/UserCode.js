import mongoose from 'mongoose';

const UserCodeSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    code: { type: String, required: true },
    usadoEm: { type: Date, default: Date.now }
});

const UserCode = mongoose.model('UserCode', UserCodeSchema);
export default UserCode;
