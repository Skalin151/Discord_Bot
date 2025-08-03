import mongoose from 'mongoose';

const userClaimSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    characterName: {
        type: String,
        required: true
    },
    claimedAt: {
        type: Date,
        default: Date.now
    },
    lastClaimTime: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index composto para otimizar buscas
userClaimSchema.index({ userId: 1, characterName: 1 }, { unique: true });
userClaimSchema.index({ characterName: 1 });
userClaimSchema.index({ userId: 1 });

// Função estática para verificar se um personagem está claimed
userClaimSchema.statics.isCharacterClaimed = async function(characterName) {
    const claim = await this.findOne({ characterName });
    return claim ? { claimed: true, owner: claim.userId, claimedAt: claim.claimedAt } : { claimed: false };
};

// Função estática para verificar se o utilizador pode fazer claim (cooldown)
userClaimSchema.statics.canUserClaim = async function(userId) {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // 3 horas atrás
    
    const lastClaim = await this.findOne({ 
        userId, 
        lastClaimTime: { $gt: threeHoursAgo } 
    }).sort({ lastClaimTime: -1 });
    
    if (lastClaim) {
        const timeLeft = new Date(lastClaim.lastClaimTime.getTime() + (3 * 60 * 60 * 1000)) - now;
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        return { 
            canClaim: false, 
            timeLeft: { hours: hoursLeft, minutes: minutesLeft, totalMs: timeLeft }
        };
    }
    
    return { canClaim: true };
};

// Função estática para fazer claim de um personagem
userClaimSchema.statics.claimCharacter = async function(userId, characterName) {
    // Verificar cooldown
    const claimCheck = await this.canUserClaim(userId);
    if (!claimCheck.canClaim) {
        return { 
            success: false, 
            reason: 'cooldown', 
            timeLeft: claimCheck.timeLeft 
        };
    }
    
    // Verificar se o personagem já está claimed
    const existingClaim = await this.findOne({ characterName });
    if (existingClaim) {
        return { 
            success: false, 
            reason: 'already_claimed', 
            owner: existingClaim.userId 
        };
    }
    
    // Fazer claim
    const newClaim = await this.create({
        userId,
        characterName,
        claimedAt: new Date(),
        lastClaimTime: new Date()
    });
    
    return { success: true, claim: newClaim };
};

// Função estática para obter personagens claimed pelo utilizador
userClaimSchema.statics.getUserClaims = async function(userId) {
    return await this.find({ userId }).sort({ claimedAt: -1 });
};

// Função estática para obter total de claims
userClaimSchema.statics.getTotalClaims = async function() {
    return await this.countDocuments();
};

// Função estática para fazer divorce de um personagem
userClaimSchema.statics.divorceCharacter = async function(userId, characterName) {
    // Procurar o claim do utilizador (case insensitive)
    const userClaim = await this.findOne({ 
        userId, 
        characterName: { $regex: new RegExp(`^${characterName}$`, 'i') }
    });

    if (!userClaim) {
        return { 
            success: false, 
            reason: 'not_claimed',
            message: 'Não tens este personagem na tua coleção!'
        };
    }

    // Remover o claim
    await this.deleteOne({ _id: userClaim._id });

    return { 
        success: true, 
        claim: userClaim,
        characterName: userClaim.characterName 
    };
};

const UserClaim = mongoose.model('UserClaim', userClaimSchema);

export default UserClaim;
