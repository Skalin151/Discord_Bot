import mongoose from 'mongoose';

const userRollsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    rollsRemaining: {
        type: Number,
        default: 3,
        min: 0,
        max: 3
    },
    lastRollHour: {
        type: Number,
        min: 0,
        max: 23
    },
    lastRollDate: {
        type: String // YYYY-MM-DD format
    }
}, {
    timestamps: true
});

// Função estática para obter ou criar dados de rolls do utilizador
userRollsSchema.statics.getOrCreateUserRolls = async function(userId) {
    let userRolls = await this.findOne({ userId });
    
    if (!userRolls) {
        userRolls = await this.create({
            userId,
            rollsRemaining: 3,
            lastRollHour: null,
            lastRollDate: null
        });
    }
    
    return userRolls;
};

// Função estática para verificar e atualizar rolls
userRollsSchema.statics.checkAndUpdateRolls = async function(userId) {
    const userRolls = await this.getOrCreateUserRolls(userId);
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Se é uma nova hora ou novo dia, resetar rolls
    if (userRolls.lastRollHour !== currentHour || userRolls.lastRollDate !== currentDate) {
        userRolls.rollsRemaining = 3;
        userRolls.lastRollHour = currentHour;
        userRolls.lastRollDate = currentDate;
        await userRolls.save();
        
        return { rollsRemaining: 3, isNewHour: true };
    }
    
    return { rollsRemaining: userRolls.rollsRemaining, isNewHour: false };
};

// Função estática para consumir um roll
userRollsSchema.statics.consumeRoll = async function(userId) {
    const rollData = await this.checkAndUpdateRolls(userId);
    
    if (rollData.rollsRemaining <= 0) {
        return { success: false, rollsRemaining: 0 };
    }
    
    const userRolls = await this.findOne({ userId });
    userRolls.rollsRemaining -= 1;
    await userRolls.save();
    
    return { 
        success: true, 
        rollsRemaining: userRolls.rollsRemaining,
        isNewHour: rollData.isNewHour
    };
};

// Função estática para obter próxima hora de reset
userRollsSchema.statics.getNextResetTime = function() {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    return nextHour;
};

// Função estática para obter tempo até próximo reset
userRollsSchema.statics.getTimeUntilReset = function() {
    const now = new Date();
    const nextHour = this.getNextResetTime();
    const diffMs = nextHour - now;
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return { minutes, seconds, totalMs: diffMs };
};

const UserRolls = mongoose.model('UserRolls', userRollsSchema);

export default UserRolls;
