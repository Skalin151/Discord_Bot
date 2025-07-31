import { petItems } from '../../config/shopItems.js';
import UserItem from '../../models/UserItem.js';
import { EmbedBuilder } from 'discord.js';

const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 horas

export default {
    name: 'walk',
    description: 'Leva um pet para passear (cooldown de 2 horas por pet). Uso: !walk <id>',
    async execute(client, message, args) {
        const userId = message.author.id;
        const petId = parseInt(args[0], 10);
        if (isNaN(petId)) {
            return message.reply('Indica o ID do pet que queres passear. Ex: !walk 100');
        }
        // Verifica se o user tem o pet
        const userPet = await UserItem.findOne({ userId, itemId: petId });
        if (!userPet) {
            return message.reply('Não tens esse pet!');
        }
        const pet = petItems.find(p => p.id === petId);
        if (!pet) {
            return message.reply('Pet inválido.');
        }
        // Cooldown persistente por user+pet
        const now = Date.now();
        if (userPet.lastWalked && now - userPet.lastWalked.getTime() < COOLDOWN_MS) {
            const mins = Math.ceil((COOLDOWN_MS - (now - userPet.lastWalked.getTime())) / 60000);
            return message.reply(`Esse pet só pode passear novamente em ${mins} minutos.`);
        }
        userPet.lastWalked = new Date();
        await userPet.save();

        // Recompensa aleatória: 40% pontos, 10% item não equipável, 50% nada
        let rewardMsg = '';
        const rand = Math.random();
        if (rand < 0.4) {
            // Ganha pontos (entre 50 e 150)
            const points = 50 + Math.floor(Math.random() * 101);
            const User = (await import('../../models/User.js')).default;
            await User.findOneAndUpdate(
                { userId },
                { $inc: { points } },
                { upsert: true }
            );
            rewardMsg = `\n🎁 O teu pet encontrou ${points} pontos!`;
        } else if (rand < 0.5) {
            // Ganha item não equipável aleatório
            const { default: shopItems } = await import('../../config/shopItems.js');
            const nonEquipItems = shopItems.filter(i => i.equipavel === false);
            if (nonEquipItems.length > 0) {
                const foundItem = nonEquipItems[Math.floor(Math.random() * nonEquipItems.length)];
                const UserItem = (await import('../../models/UserItem.js')).default;
                await UserItem.findOneAndUpdate(
                    { userId, itemId: foundItem.id },
                    { $inc: { quantidade: foundItem.quantidade || 1 }, $setOnInsert: { compradoEm: new Date() } },
                    { upsert: true, new: true }
                );
                rewardMsg = `\n🎁 O teu pet encontrou ${foundItem.icon || ''} **${foundItem.nome}**!`;
            }
        }
        // Mensagem de passeio
        const embed = new EmbedBuilder()
            .setTitle(`🐾 Passeio com ${pet.nome}`)
            .setDescription(`${pet.icon} ${pet.nome} adorou o passeio! Volta daqui a 2 horas para passear de novo.${rewardMsg}`)
            .setColor(0x27ae60);
        await message.channel.send({ embeds: [embed] });
    }
};
