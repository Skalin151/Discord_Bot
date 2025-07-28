import { createShopEmbed } from '../../utils/shopUtils.js';
import shopItems from '../../config/shopItems.js';

export default {
    name: 'shop',
    description: 'Veja os itens disponíveis na loja.',
    /**
     * @param {import('discord.js').Client} client
     * @param {import('discord.js').Message} message
     * @param {string[]} args
     */
    async execute(client, message, args) {
        const embed = createShopEmbed(shopItems);
        await message.channel.send({ embeds: [embed] });
    }
};
