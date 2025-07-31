import { EmbedBuilder } from 'discord.js';
import shopItems, { petItems } from '../../config/shopItems.js';
import UserItem from '../../models/UserItem.js';

export default {
  name: 'item',
  description: 'Mostra informações detalhadas de um item pelo id. Uso: %item <id>',
  async execute(client, message, args) {
    const id = parseInt(args[0], 10);
    if (isNaN(id)) {
      return message.reply('❌ Indica o ID do item. Exemplo: %item 2');
    }
    // Procura o item na loja ou nos pets
    const item = shopItems.find(i => i.id === id) || petItems.find(i => i.id === id);
    if (!item) {
      return message.reply('❌ Item não encontrado.');
    }
    // Verifica se o usuário possui o item
    const userId = message.author.id;
    const userItem = await UserItem.findOne({ userId, itemId: id });
    const quantidade = userItem ? userItem.quantidade : 0;
    const embed = new EmbedBuilder()
      .setTitle(`${item.icon || ''} ${item.nome}`)
      .setColor('#636e72')
      .setDescription(item.descricao)
      .addFields(
        { name: 'ID', value: String(item.id), inline: true },
        { name: 'Preço', value: `${item.preco} pontos`, inline: true },
        { name: 'Único', value: item.unico ? 'Sim' : 'Não', inline: true },
        { name: 'Equipável', value: item.equipavel ? 'Sim' : 'Não', inline: true },
        { name: 'Visível', value: item.visivel ? 'Sim' : 'Não', inline: true },
        { name: 'Quantidade', value: String(quantidade), inline: true }
      );
    await message.channel.send({ embeds: [embed] });
  },
};
