import { EmbedBuilder } from 'discord.js';

export default {
    name: 'uptime',
    description: 'Mostra há quanto tempo o bot está online',
    
    async execute(client, message) {
        try {
            // Calcula o uptime em diferentes unidades
            const uptimeMs = client.uptime;
            const uptimeSeconds = Math.floor(uptimeMs / 1000);
            
            // Calcula dias, horas, minutos e segundos
            const days = Math.floor(uptimeSeconds / 86400);
            const hours = Math.floor((uptimeSeconds % 86400) / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = uptimeSeconds % 60;
            
            // Formata a duração
            let duration = '';
            if (days > 0) duration += `\`${days}\` dias, `;
            if (hours > 0) duration += `\`${hours}\` hrs, `;
            if (minutes > 0) duration += `\`${minutes}\` mins, `;
            duration += `\`${seconds}\` secs`;
            
            // Calcula o timestamp de quando o bot foi iniciado
            const startTime = Math.floor((Date.now() - uptimeMs) / 1000);
            
            // Cria o embed
            const uptimeEmbed = new EmbedBuilder()
                .setTitle('⏰ Uptime do Bot')
                .setDescription('Vê há quanto tempo o bot está online')
                .setColor(0x00D4AA)
                .addFields(
                    {
                        name: '⌛┇Uptime',
                        value: duration,
                        inline: true
                    },
                    {
                        name: '⏰┇Online Desde',
                        value: `<t:${startTime}:R>`,
                        inline: true
                    },
                    {
                        name: '📅┇Data Completa',
                        value: `<t:${startTime}:F>`,
                        inline: false
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: `Solicitado por ${message.author.username}`, 
                    iconURL: message.author.displayAvatarURL() 
                });
            
            // Determina a cor baseada no uptime
            if (days >= 7) {
                uptimeEmbed.setColor(0x00FF00); // Verde - Muito estável
            } else if (days >= 1) {
                uptimeEmbed.setColor(0xFFFF00); // Amarelo - Estável
            } else if (hours >= 1) {
                uptimeEmbed.setColor(0xFFA500); // Laranja - Recente
            } else {
                uptimeEmbed.setColor(0xFF0000); // Vermelho - Muito recente
            }
            
            // Envia o embed
            await message.channel.send({ embeds: [uptimeEmbed] });
            
        } catch (error) {
            console.error('Erro ao executar comando uptime:', error);
            await message.channel.send('❌ Ocorreu um erro ao calcular o uptime!');
        }
    }
};
