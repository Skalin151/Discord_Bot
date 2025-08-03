import { EmbedBuilder, AuditLogEvent } from 'discord.js';

/**
 * Converte uma URL de imagem para ter tamanho consistente (Discord proxy)
 * @param {string} imageUrl - URL original da imagem
 * @param {number} width - Largura desejada (padrão: 400)
 * @param {number} height - Altura desejada (padrão: 400)
 * @returns {string} - URL da imagem redimensionada
 */
export function getConsistentImageSize(imageUrl, width = 400, height = 400) {
    if (!imageUrl || !imageUrl.startsWith('http')) {
        return imageUrl;
    }
    
    // Para URLs do Discord, usar parâmetros de redimensionamento
    if (imageUrl.includes('cdn.discordapp.com') || imageUrl.includes('media.discordapp.net')) {
        const separator = imageUrl.includes('?') ? '&' : '?';
        return `${imageUrl}${separator}width=${width}&height=${height}`;
    }
    
    // Para outras URLs, adicionar parâmetros de redimensionamento se suportado
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}width=${width}&height=${height}`;
}

/**
 * Cria um embed simples 
 * @param {string} title - Título do embed
 * @param {string} description - Descrição do evento
 * @param {string} color - Cor do embed (hex)
 * @param {Object} user - Utilizador que executou a acção (opcional)
 * @returns {EmbedBuilder}
 */
export function createSimpleLogEmbed(title, description, color = '#0099ff', user = null) {
    const embed = new EmbedBuilder()
        .setDescription(`${title}\n${description}`)
        .setColor(color)
        .setTimestamp();

    if (user) {
        embed.setAuthor({ 
            name: user.tag, 
            iconURL: user.displayAvatarURL({ dynamic: true }) 
        });
    }

    return embed;
}

/**
 * Busca quem executou uma acção usando o Audit Log
 * @param {Guild} guild - Servidor Discord
 * @param {string} action - Tipo de acção do audit log
 * @param {string} targetId - ID do alvo da acção
 * @returns {User|null} - Utilizador que executou a acção
 */
export async function getActionExecutor(guild, action, targetId = null) {
    try {
        const auditLogs = await guild.fetchAuditLogs({
            type: action,
            limit: 10
        });

        const auditEntry = auditLogs.entries.find(entry => {
            const timeDiff = Date.now() - entry.createdTimestamp;
            if (targetId) {
                return entry.target?.id === targetId && timeDiff < 10000; // 10 segundos
            }
            return timeDiff < 3000; // 3 segundos para outros eventos
        });

        return auditEntry?.executor || null;
    } catch (error) {
        console.error('Erro ao buscar audit log:', error);
        return null;
    }
}

/**
 * Envia o embed para o canal de logs configurado
 * @param {Guild} guild - Servidor Discord
 * @param {EmbedBuilder} embed - Embed a ser enviado
 */
export async function sendLogEmbed(guild, embed) {
    const logChannel = guild.channels.cache.find(channel => 
        channel.name === 'logs' || channel.name === 'audit-logs' || channel.name === 'eventos'
    );

    if (logChannel) {
        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erro ao enviar log:', error);
        }
    }
}

/**
 * Cores predefinidas para diferentes tipos de eventos
 */
export const LOG_COLORS = {
    JOIN: '#00ff00',      // Verde
    LEAVE: '#ff0000',     // Vermelho
    UPDATE: '#ffaa00',    // Laranja
    DELETE: '#ff4444',    // Vermelho claro
    CREATE: '#44ff44',    // Verde claro
    BAN: '#8b0000',       // Vermelho escuro
    UNBAN: '#32cd32',     // Verde lima
    TIMEOUT: '#ffa500',   // Laranja
    ROLE: '#9932cc',      // Roxo
    CHANNEL: '#5865f2',   // Azul Discord
    VOICE: '#ff69b4',     // Rosa
    MESSAGE: '#36393f'    // Cinza Discord
};
