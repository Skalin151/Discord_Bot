import { EmbedBuilder } from 'discord.js';

export default {
    name: 'coinflip',
    description: 'Atira uma moeda ao ar! Uso: %coinflip ou %flip',
    async execute(client, message, args) {
        // Animação da moeda
        const flipMsg = await message.reply('🪙 Atirando a moeda...');
        
        // Delay para criar suspense
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Resultado aleatório
        const isHeads = Math.random() < 0.5;
        const result = isHeads ? 'Cara' : 'Coroa';
        const emoji = isHeads ? '👤' : '👑';
        const color = isHeads ? '#e74c3c' : '#f1c40f';
        
        const embed = new EmbedBuilder()
            .setTitle('🪙 Coinflip')
            .setDescription(`${emoji} **${result}**!`)
            .setColor(color)
        await flipMsg.edit({ content: '', embeds: [embed] });
    },
};
