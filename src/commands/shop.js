import { createShopEmbed } from '../utils/shopUtils.js';
import shopItems from '../config/shopItems.js';

export default {
    name: 'shop',
    description: 'Veja os itens disponíveis na loja.',
    /**
     * @param {import('discord.js').Client} client
     * @param {import('discord.js').Message} message
     * @param {string[]} args
     */
    async execute(client, message, args) {
        const userId = message.author.id;
        const UserItem = (await import('../models/UserItem.js')).default;
        const userUniqueItems = await UserItem.find({ userId });
        const uniqueIds = userUniqueItems.map(i => i.itemId);
        // Verifica se o usuário tem o cupom
        const hasCoupon = userUniqueItems.some(i => i.itemId === 5); // id 5 = Everlasting Coupon
        // Filtrar apenas itens visíveis e únicos que o usuário já não tem
        let filteredShop = shopItems.filter(item => item.visivel && !(item.unico && uniqueIds.includes(item.id)));
        // Se tem cupom, aplica desconto e marca preço riscado
        if (hasCoupon) {
            filteredShop = filteredShop.map(item => {
                if (item.preco && item.id !== 5) {
                    return {
                        ...item,
                        precoOriginal: item.preco,
                        preco: Math.floor(item.preco * 0.9)
                    };
                }
                return item;
            });
        }
        const embed = createShopEmbed(filteredShop, hasCoupon);
        await message.channel.send({ embeds: [embed] });
    }
};
