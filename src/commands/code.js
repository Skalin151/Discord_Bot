import { EmbedBuilder } from 'discord.js';
import promoCodes from '../config/promoCodes.js';
import User from '../models/User.js';
import UserCode from '../models/UserCode.js';

export default {
    name: 'code',
    description: 'Permite inserir um código promocional para receber recompensas.',
    async execute(client, message) {
        const embed = new EmbedBuilder()
            .setTitle('🔑 Inserir Código')
            .setDescription('Responda a esta mensagem com o código promocional que deseja usar. Cada código pode ter validade e número de usos limitado!')
            .setColor(0x2ecc71);
        const sentMsg = await message.channel.send({ embeds: [embed] });

        // Coletor para a resposta do usuário
        const filter = m => m.author.id === message.author.id && m.channel.id === message.channel.id;
        const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

        collector.on('collect', async m => {
            const codeInput = m.content.trim();
            const codeObj = promoCodes.find(c => c.code.toLowerCase() === codeInput.toLowerCase());
            if (!codeObj) {
                await message.channel.send({ content: '❌ Código inválido ou não encontrado.' });
                return;
            }
            // Se for o código TestamentV, apaga a mensagem do usuário imediatamente
            if (codeObj.code.toLowerCase() === 'testamentv') {
                try { await m.delete(); } catch (e) { /* ignore */ }
            }
            // Checa se o usuário já usou esse código
            const alreadyUsed = await UserCode.findOne({ userId: message.author.id, code: codeObj.code });
            if (alreadyUsed) {
                await message.channel.send({ content: '❌ Você já usou este código.' });
                return;
            }
            // Checa validade
            if (codeObj.validade) {
                const now = new Date();
                const validade = new Date(codeObj.validade + 'T23:59:59');
                if (now > validade) {
                    await message.channel.send({ content: '❌ Este código já expirou.' });
                    return;
                }
            }
            // Checa usos globais (contagem na base de dados)
            const totalUsos = await UserCode.countDocuments({ code: codeObj.code });
            if (codeObj.usos && totalUsos >= codeObj.usos) {
                await message.channel.send({ content: '❌ Este código já atingiu o número máximo de usos.' });
                return;
            }
            let user = await User.findOne({ userId: message.author.id });
            if (!user) {
                user = new User({ userId: message.author.id, points: 0 });
            }
            let recompensaMsg = '';
            if (codeObj.recompensa && codeObj.recompensa.pontos) {
                user.points += codeObj.recompensa.pontos;
                recompensaMsg += `Recebeste **${codeObj.recompensa.pontos} pontos**!\n`;
            }
            // Se o código for TestamentV, dá o item 6 (Orb of Avarice)
            if (codeObj.code.toLowerCase() === 'testamentv') {
                const UserItem = (await import('../models/UserItem.js')).default;
                let orb = await UserItem.findOne({ userId: message.author.id, itemId: 6 });
                if (!orb) {
                    await UserItem.create({ userId: message.author.id, itemId: 6, quantidade: 1 });
                } else {
                    orb.quantidade += 1;
                    await orb.save();
                }
                recompensaMsg += 'Recebeste o item especial **Orb of Avarice**!';
            }
            await user.save();
            // Registra uso do código
            await UserCode.create({ userId: message.author.id, code: codeObj.code });
            await message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('✅ Código Resgatado!')
                        .setDescription(`${recompensaMsg}\n\nObrigado por participar!`)
                        .setColor(0x27ae60)
                ]
            });
        });
    }
};
