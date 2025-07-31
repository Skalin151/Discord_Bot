import UserItem from '../../models/UserItem.js';
import shopItems from '../../config/shopItems.js';

export default {
    name: 'equip',
    description: 'Equipe um item do inventário pelo id. Uso: %equip <id>',
    async execute(client, message, args) {
        const userId = message.author.id;
        const itemId = parseInt(args[0]);
        if (isNaN(itemId)) {
            return message.reply('Por favor, especifique o id do item para equipar. Ex: !equip 2');
        }
        const userItem = await UserItem.findOne({ userId, itemId });
        if (!userItem) {
            return message.reply('Você não possui esse item no inventário.');
        }
        // Verifica se o item é equipável
        const itemConfig = shopItems.find(i => i.id === itemId);
        if (!itemConfig || itemConfig.equipavel === false) {
            return message.reply('Este item não pode ser equipado.');
        }
        if (userItem.equipado) {
            return message.reply('Esse item já está equipado.');
        }
        const equippedCount = await UserItem.countDocuments({ userId, equipado: true });
        if (equippedCount >= 5) {
            return message.reply('Você já tem 5 itens equipados. Desequipe algum antes de equipar outro.');
        }
        userItem.equipado = true;
        await userItem.save();
        await message.react('✅');
        return;
    }
};
