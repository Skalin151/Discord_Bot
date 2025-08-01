import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    guildId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['feedback', 'bug', 'suggestion', 'other'],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    attachments: [{
        url: String,
        filename: String
    }],
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    closedAt: {
        type: Date
    },
    closedBy: {
        type: String
    }
});

// Método para gerar ID único do ticket
ticketSchema.statics.generateTicketId = async function() {
    const count = await this.countDocuments();
    return (count + 1).toString();
};

export default mongoose.model('Ticket', ticketSchema);
