import shopItems from '../../config/shopItems.js';
import UserItem from '../../models/UserItem.js';

export default {
    name: 'buy',
    description: 'Compra um item da loja pelo ID. Uso: !buy [id]',
    /**
     * @param {import('discord.js').Client} client
     * @param {import('discord.js').Message} message
     * @param {string[]} args
     */
    async execute(client, message, args) {
        const userId = message.author.id;
        const itemId = parseInt(args[0], 10);
        if (isNaN(itemId)) {
            return message.reply('Por favor, forneça o ID do item que deseja comprar. Ex: !buy 2');
        }
        const item = shopItems.find(i => i.id === itemId);
        if (!item) {
            return message.reply('Item não encontrado. Use !shop para ver os itens disponíveis.');
        }

        // Verifica se o item é único e se o usuário já possui
        if (item.unico) {
            const jaTem = await UserItem.findOne({ userId, itemId: item.id });
            if (jaTem) {
                return message.reply('Você já possui este item único e não pode comprá-lo novamente.');
            }
        }

        // Verifica saldo do usuário
        const User = (await import('../../models/User.js')).default;
        let user = await User.findOne({ userId });
        if (!user) {
            user = await User.create({ userId });
        }

        // Verifica se o usuário tem o Everlasting Coupon
        const hasCoupon = await UserItem.findOne({ userId, itemId: 5 });
        let precoFinal = item.preco;
        let precoOriginal = null;
        if (hasCoupon && item.id !== 5) {
            precoOriginal = item.preco;
            precoFinal = Math.floor(item.preco * 0.9);
        }

        if (user.points < precoFinal) {
            return message.reply('Você não tem pontos suficientes para comprar este item.');
        }

        // Desconta pontos e salva o item na coleção do usuário
        user.points -= precoFinal;
        user.pointsSpent = (user.pointsSpent || 0) + precoFinal;
        await user.save();

        // Checa quantos itens equipados o usuário já tem
        const equippedCount = await UserItem.countDocuments({ userId, equipado: true });
        let equipado = false;
        let equipMsg = '';
        if (equippedCount < 5) {
            equipado = true;
            equipMsg = ' (equipado automaticamente)';
        } else {
            equipMsg = ' (adicionado à bag, pois já tem 5 itens equipados)';
        }
        await UserItem.findOneAndUpdate(
            { userId, itemId: item.id },
            { $inc: { quantidade: item.quantidade || 1 }, $setOnInsert: { compradoEm: new Date() }, $set: { equipado } },
            { upsert: true, new: true }
        );

        let precoMsg = precoFinal;
        if (precoOriginal) {
            precoMsg = `~~${precoOriginal}~~ ➔ **${precoFinal}**`;
        }
        return message.reply(`Compraste ${item.icon || ''} **${item.nome}** por ${precoMsg} pontos!${equipMsg}`);
    }
};
