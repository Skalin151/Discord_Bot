import UserClaim from '../models/UserClaim.js';
import User from '../models/User.js';
import charactersData from '../config/characters.js';
import { EmbedBuilder } from 'discord.js';

class AutoClearService {
    constructor(client) {
        this.client = client;
        this.isRunning = false;
        this.lastCheckDate = null;
        this.logChannelId = null; // Definir o ID do canal para logs (opcional)
    }

    // Iniciar o serviço
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('🧹 AutoClear Service iniciado');
        
        // Verificar imediatamente
        this.checkForClear();
        
        // Verificar a cada hora
        setInterval(() => {
            this.checkForClear();
        }, 60 * 60 * 1000); // 1 hora
    }

    // Parar o serviço
    stop() {
        this.isRunning = false;
        console.log('🧹 AutoClear Service parado');
    }

    // Verificar se é o último dia do mês
    checkForClear() {
        if (!this.isRunning) return;

        const now = new Date();
        const today = now.toDateString();
        
        // Evitar verificações múltiplas no mesmo dia
        if (this.lastCheckDate === today) return;
        this.lastCheckDate = today;

        // Verificar se é o último dia do mês
        if (this.isLastDayOfMonth(now)) {
            console.log('🧹 Último dia do mês detectado - iniciando auto clear');
            this.performAutoClear();
        }
    }

    // Verificar se é o último dia do mês
    isLastDayOfMonth(date) {
        const tomorrow = new Date(date);
        tomorrow.setDate(date.getDate() + 1);
        return tomorrow.getMonth() !== date.getMonth();
    }

    // Executar o clear automático
    async performAutoClear() {
        try {
            console.log('🧹 Iniciando auto clear...');
            
            // Obter todos os claims
            const allClaims = await UserClaim.find({});
            
            if (allClaims.length === 0) {
                console.log('🧹 Nenhum claim encontrado para clear automático');
                return;
            }

            // Calcular pontos por utilizador
            const userPoints = new Map();
            let totalClaims = 0;
            let totalPoints = 0;

            for (const claim of allClaims) {
                const character = charactersData.find(char => 
                    char.name.toLowerCase() === claim.characterName.toLowerCase()
                );
                
                const points = character ? (character.points || 0) : 0;
                
                if (!userPoints.has(claim.userId)) {
                    userPoints.set(claim.userId, {
                        userId: claim.userId,
                        points: 0,
                        claimsCount: 0
                    });
                }
                
                const userData = userPoints.get(claim.userId);
                userData.points += points;
                userData.claimsCount += 1;
                
                totalClaims += 1;
                totalPoints += points;
            }

            // Atribuir pontos aos utilizadores
            let usersUpdated = 0;
            let totalPointsDistributed = 0;

            for (const [userId, userData] of userPoints) {
                try {
                    // Obter ou criar utilizador
                    let user = await User.findOne({ userId });
                    if (!user) {
                        user = new User({ userId, points: 0 });
                    }

                    // Adicionar pontos
                    user.points += userData.points;
                    await user.save();

                    usersUpdated++;
                    totalPointsDistributed += userData.points;

                } catch (error) {
                    console.error(`❌ Erro ao atualizar utilizador ${userId}:`, error);
                }
            }

            // Remover todos os claims
            const deleteResult = await UserClaim.deleteMany({});
            const claimsRemoved = deleteResult.deletedCount;

            console.log(`🧹 Auto clear concluído: ${claimsRemoved} claims removidos, ${usersUpdated} utilizadores atualizados, ${totalPointsDistributed} pontos distribuídos`);

            // Enviar notificação para o canal de logs (se configurado)
            if (this.logChannelId) {
                await this.sendClearNotification({
                    claimsRemoved,
                    usersUpdated,
                    totalPointsDistributed,
                    userPoints
                });
            }

        } catch (error) {
            console.error('❌ Erro no auto clear:', error);
        }
    }

    // Enviar notificação do clear
    async sendClearNotification(results) {
        try {
            const channel = await this.client.channels.fetch(this.logChannelId);
            if (!channel) return;

            const embed = new EmbedBuilder()
                .setTitle('🧹 Clear Automático Executado')
                .setDescription('O clear mensal foi executado automaticamente!')
                .setColor('#00FF00')
                .addFields(
                    { 
                        name: '📊 Resultados', 
                        value: `**Claims removidos:** ${results.claimsRemoved}\n**Utilizadores afetados:** ${results.usersUpdated}\n**Pontos distribuídos:** ${results.totalPointsDistributed}`, 
                        inline: false 
                    },
                    {
                        name: '📅 Data',
                        value: new Date().toLocaleDateString('pt-PT'),
                        inline: true
                    },
                    {
                        name: '✅ Status',
                        value: 'Todos os personagens estão agora disponíveis para claim!',
                        inline: false
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: 'Clear automático mensal' 
                });

            await channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Erro ao enviar notificação de clear:', error);
        }
    }

    // Definir canal de logs
    setLogChannel(channelId) {
        this.logChannelId = channelId;
        console.log(`🧹 Canal de logs definido: ${channelId}`);
    }

    // Executar clear manual (usado pelo comando)
    static async performManualClear(userPoints) {
        let claimsRemoved = 0;
        let usersUpdated = 0;
        let totalPointsDistributed = 0;

        // Atribuir pontos aos utilizadores
        for (const [userId, userData] of userPoints) {
            try {
                // Obter ou criar utilizador
                let user = await User.findOne({ userId });
                if (!user) {
                    user = new User({ userId, points: 0 });
                }

                // Adicionar pontos
                user.points += userData.points;
                await user.save();

                usersUpdated++;
                totalPointsDistributed += userData.points;

            } catch (error) {
                console.error(`❌ Erro ao atualizar utilizador ${userId}:`, error);
            }
        }

        // Remover todos os claims
        const deleteResult = await UserClaim.deleteMany({});
        claimsRemoved = deleteResult.deletedCount;

        return {
            claimsRemoved,
            usersUpdated,
            totalPointsDistributed
        };
    }
}

export default AutoClearService;
