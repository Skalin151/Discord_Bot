import { EmbedBuilder } from 'discord.js';

/**
 * Gera uma embed de loja com os itens fornecidos.
 * @param {Array} items - Lista de itens da loja. Cada item deve ter: nome, preco, descricao, icon.
 * @returns {EmbedBuilder}
 */
export function createShopEmbed(items, hasCoupon = false) {
    const embed = new EmbedBuilder()
        .setTitle('🛒 Loja de Itens')
        .setColor('#FFD700');

    embed.setDescription(hasCoupon
        ? '**Cupom ativo: 10% de desconto em todos os itens!**\nUse `%buy <id>` para comprar um item!'
        : 'Use `%buy <id>` para comprar um item!');

    items.forEach((item) => {
        let precoStr = `💰 ${item.preco} pts`;
        if (hasCoupon && item.precoOriginal) {
            precoStr = `~~${item.precoOriginal}~~ ➔ **${item.preco}** pts`;
        }
        embed.addFields({
            name: `${item.icon || ''} [${item.id}] ${item.nome}`,
            value: `${precoStr}\n${item.descricao}`,
            inline: false
        });
    });
    return embed;
}
