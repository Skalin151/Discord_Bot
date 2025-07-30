import { EmbedBuilder } from 'discord.js';
import UserItem from '../../models/UserItem.js';
import shopItems from '../../config/shopItems.js';

export default {
    name: 'bag',
    description: 'Mostra todos os itens do seu inventário, indicando os equipados.',
    async execute(client, message) {
        const userId = message.author.id;
        let userItems = await UserItem.find({ userId });
        if (userItems.length === 0) {
            return message.reply('O teu inventário está vazio.');
        }
        userItems = userItems.sort((a, b) => a.itemId - b.itemId);
        const lines = userItems.map(ui => {
            const item = shopItems.find(i => i.id === ui.itemId);
            const nome = item ? item.nome : `Item #${ui.itemId}`;
            const icon = item?.icon || '';
            const status = ui.equipado ? '🟢' : '⚪';
            return `${status} [${ui.itemId}] ${icon} **${nome}** x${ui.quantidade}`;
        });
        const equippedCount = userItems.filter(i => i.equipado).length;
        const embed = new EmbedBuilder()
            .setTitle(`🎒 Inventário de ${message.author.username}`)
            .setDescription(lines.join('\n'))
            .setFooter({ text: `Equipados: [${equippedCount}/5]` })
            .setColor(0x2ecc71);
        await message.channel.send({ embeds: [embed] });
    }
};
