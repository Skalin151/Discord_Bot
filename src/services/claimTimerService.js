/**
 * Serviço para gerenciar timers de claim de personagens
 * Fornece countdown visual e notificações de expiração
 */

export class ClaimTimerService {
    constructor() {
        this.activeTimers = new Map();
    }

    /**
     * Inicia um timer visual para um claim de personagem
     * @param {Object} rollMessage - Mensagem do Discord
     * @param {Object} embed - Embed original
     * @param {Object} character - Dados do personagem
     * @param {Object} rollResult - Resultado do roll
     * @param {string} commandTitle - Título do comando
     * @param {number} duration - Duração em milissegundos (padrão: 5 minutos)
     */
    startClaimTimer(rollMessage, embed, character, rollResult, commandTitle, duration = 300000) {
        const timerId = rollMessage.id;
        const startTime = Date.now();
        const endTime = startTime + duration;

        // Limpar timer existente se houver
        this.clearTimer(timerId);

        // Função para atualizar o countdown
        const updateCountdown = () => {
            const now = Date.now();
            const timeLeft = endTime - now;

            if (timeLeft <= 0) {
                // Timer expirado
                this.clearTimer(timerId);
                return;
            }

            // Calcular minutos e segundos restantes
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);

            // Criar footer atualizado
            let footerText = `⏰ ${minutes}:${seconds.toString().padStart(2, '0')} restantes | `;
            footerText += `Rolls restantes: ${rollResult.rollsRemaining}/3 | `;
            footerText += `Género: ${character.gender === 'female' ? 'Feminino' : 'Masculino'}`;

            // Atualizar embed com novo footer
            const updatedEmbed = embed.setFooter({ text: footerText });

            // Atualizar mensagem (silenciosamente para não spammar)
            rollMessage.edit({ embeds: [updatedEmbed] }).catch(() => {
                // Se falhar ao editar, limpar o timer
                this.clearTimer(timerId);
            });
        };

        // Atualizar imediatamente
        updateCountdown();

        // Configurar intervalo para atualizar a cada 10 segundos
        const interval = setInterval(updateCountdown, 10000);

        // Armazenar timer
        this.activeTimers.set(timerId, {
            interval,
            startTime,
            endTime,
            messageId: rollMessage.id
        });

        return timerId;
    }

    /**
     * Para um timer específico
     * @param {string} timerId - ID do timer
     */
    clearTimer(timerId) {
        const timer = this.activeTimers.get(timerId);
        if (timer) {
            clearInterval(timer.interval);
            this.activeTimers.delete(timerId);
        }
    }

    /**
     * Para todos os timers ativos
     */
    clearAllTimers() {
        for (const [timerId] of this.activeTimers) {
            this.clearTimer(timerId);
        }
    }

    /**
     * Obtém informações sobre um timer específico
     * @param {string} timerId - ID do timer
     * @returns {Object|null} Informações do timer ou null se não existir
     */
    getTimerInfo(timerId) {
        const timer = this.activeTimers.get(timerId);
        if (!timer) return null;

        const now = Date.now();
        const timeLeft = timer.endTime - now;
        const elapsed = now - timer.startTime;

        return {
            timeLeft: Math.max(0, timeLeft),
            elapsed,
            isExpired: timeLeft <= 0,
            progress: elapsed / (timer.endTime - timer.startTime)
        };
    }

    /**
     * Lista todos os timers ativos
     * @returns {Array} Array com informações de todos os timers
     */
    listActiveTimers() {
        const timers = [];
        for (const [timerId, timer] of this.activeTimers) {
            timers.push({
                id: timerId,
                messageId: timer.messageId,
                ...this.getTimerInfo(timerId)
            });
        }
        return timers;
    }

    /**
     * Limpa timers expirados automaticamente
     */
    cleanupExpiredTimers() {
        const now = Date.now();
        for (const [timerId, timer] of this.activeTimers) {
            if (now >= timer.endTime) {
                this.clearTimer(timerId);
            }
        }
    }
}

// Instância global do serviço
export const claimTimerService = new ClaimTimerService();

// Cleanup automático a cada minuto
setInterval(() => {
    claimTimerService.cleanupExpiredTimers();
}, 60000);

export default ClaimTimerService;
