import { petItems } from '../../config/shopItems.js';
import UserItem from '../../models/UserItem.js';
import { EmbedBuilder } from 'discord.js';

export default {
    name: 'pets',
    description: 'Mostra todos os pets que você possui.',
    async execute(client, message) {
        const userId = message.author.id;
        // Busca pets do usuário na base de dados
        const userPets = await UserItem.find({ userId, itemId: { $gte: 100 } });
        if (!userPets.length) {
            return message.reply('Você não possui nenhum pet ainda. Compre um no !petshop!');
        }
        // Monta lista de pets do usuário
        const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 horas
        const now = Date.now();
        const lines = userPets.map(ui => {
            const pet = petItems.find(p => p.id === ui.itemId);
            if (!pet) return `Pet #${ui.itemId}`;
            let sleep = '';
            if (ui.lastWalked && now - ui.lastWalked.getTime() < COOLDOWN_MS) {
                sleep = ' 💤';
            }
            return `[${pet.id}] ${pet.icon} **${pet.nome}**${sleep} — ${pet.descricao}`;
        });
        const embed = new EmbedBuilder()
            .setTitle(`🐾 Pets de ${message.author.username}`)
            .setDescription(lines.join('\n'))
            .setColor(0x8e44ad);
        await message.channel.send({ embeds: [embed] });
    }
};
