import { EmbedBuilder } from 'discord.js';

export default {
    name: 'ping',
    description: 'Mostra a latência do bot e da API do Discord',
    
    async execute(client, message) {
        try {
            // Marca o tempo de início
            const startTime = Date.now();
            
            // Envia uma mensagem inicial
            const pingMessage = await message.channel.send('🏓 Calculando ping...');
            
            // Calcula a latência da mensagem (bot latency)
            const endTime = Date.now();
            const botLatency = endTime - startTime;
            
            // Latência da WebSocket (API do Discord)
            const apiLatency = Math.round(client.ws.ping);
            
            // Cria o embed com as informações
            const pingEmbed = new EmbedBuilder()
                .setTitle('🏓 Pong!')
                .setColor(0x00FF00)
                .addFields(
                    { 
                        name: '📡 Latência do Bot', 
                        value: `${botLatency}ms`, 
                        inline: true 
                    },
                    { 
                        name: '🌐 Latência da API', 
                        value: `${apiLatency}ms`, 
                        inline: true 
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: `Solicitado por ${message.author.username}`, 
                    iconURL: message.author.displayAvatarURL() 
                });
            
            // Determina a cor baseada na latência
            if (botLatency < 100 && apiLatency < 100) {
                pingEmbed.setColor(0x00FF00); // Verde - Excelente
            } else if (botLatency < 200 && apiLatency < 200) {
                pingEmbed.setColor(0xFFFF00); // Amarelo - Bom
            } else {
                pingEmbed.setColor(0xFF0000); // Vermelho - Ruim
            }
            
            // Atualiza a mensagem com o embed
            await pingMessage.edit({ 
                content: null, 
                embeds: [pingEmbed] 
            });
            
        } catch (error) {
            console.error('Erro ao executar comando ping:', error);
            await message.channel.send('❌ Ocorreu um erro ao calcular o ping!');
        }
    }
};
