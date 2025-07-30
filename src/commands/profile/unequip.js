import UserItem from '../../models/UserItem.js';
import shopItems from '../../config/shopItems.js';

export default {
    name: 'unequip',
    description: 'Desequipe um item do inventário pelo id. Uso: !unequip <id>',
    async execute(client, message, args) {
        const userId = message.author.id;
        const itemId = parseInt(args[0]);
        if (isNaN(itemId)) {
            return message.reply('Por favor, especifique o id do item para desequipar. Ex: !unequip 2');
        }
        const userItem = await UserItem.findOne({ userId, itemId });
        if (!userItem) {
            return message.reply('Você não possui esse item no inventário.');
        }
        if (!userItem.equipado) {
            return message.reply('Esse item já está desequipado.');
        }
        userItem.equipado = false;
        await userItem.save();
        await message.react('✅');
        return;
    }
};
