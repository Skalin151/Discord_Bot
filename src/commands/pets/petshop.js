
import shopItems, { petItems } from '../../config/shopItems.js';
import { createShopEmbed } from '../../utils/shopUtils.js';

export default {
    name: 'petshop',
    description: 'Mostra todos os animais de estimação disponíveis para compra.',
    async execute(client, message) {
        if (!petItems.length) {
            return message.reply('Nenhum pet disponível no momento.');
        }
        // Verifica se o usuário tem o Everlasting Coupon equipado
        const userId = message.author.id;
        const UserItem = (await import('../../models/UserItem.js')).default;
        const hasCoupon = await UserItem.findOne({ userId, itemId: 5, equipado: true }); // id 5 = Everlasting Coupon
        // Busca pets únicos já possuídos
        const userUniqueItems = await UserItem.find({ userId });
        const uniqueIds = userUniqueItems.map(i => i.itemId);
        let filteredPets = petItems.filter(item => item.visivel && !(item.unico && uniqueIds.includes(item.id)));
        if (hasCoupon) {
            filteredPets = filteredPets.map(item => {
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
        const embed = createShopEmbed(filteredPets, hasCoupon);
        embed.setTitle('🐾 Pet Shop');
        await message.channel.send({ embeds: [embed] });
    }
};
