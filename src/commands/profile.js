import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import User from '../models/User.js';
import UserItem from '../models/UserItem.js';
import shopItems from '../config/shopItems.js';

// Mapa para contar execuções seguidas do comando por usuário
const profileUsageMap = new Map();

export default {
    name: 'profile',
    description: 'Mostra informações do utilizador.',
    async execute(client, message) {
        const userId = message.author.id;
        // Atualiza contador de execuções seguidas
        let count = profileUsageMap.get(userId) || 0;
        count++;
        profileUsageMap.set(userId, count);

        // Se não for a terceira vez, mostra embed normal e reseta se outro comando for executado
        if (count < 3) {
            setTimeout(() => {
                // Reseta contador após 60s sem uso
                if (profileUsageMap.get(userId) === count) profileUsageMap.delete(userId);
            }, 60000);
            const user = await User.findOne({ userId });
            const points = user ? user.points : 0;
            const pointsSpent = user ? user.pointsSpent || 0 : 0;
            const createdAt = `<t:${Math.floor(message.author.createdTimestamp / 1000)}:F>`;
            // Busca apenas itens equipados do usuário
            const equippedItems = await UserItem.find({ userId, equipado: true });
            let itemsText = 'Nenhum item equipado.';
            if (equippedItems.length > 0) {
                itemsText = equippedItems.map(ui => {
                    const item = shopItems.find(i => i.id === ui.itemId);
                    if (item) {
                        return `• ${item.icon || ''} **${item.nome}** x${ui.quantidade}`;
                    } else {
                        return `Item #${ui.itemId} x${ui.quantidade}`;
                    }
                }).join('\n');
            }
            const embed = new EmbedBuilder()
                .setTitle(`Perfil de ${message.author.username}`)
                .setThumbnail(message.author.displayAvatarURL())
                .addFields(
                    { name: 'Pontos', value: `${points}`, inline: true },
                    { name: 'Pontos Gastos', value: `${pointsSpent}`, inline: true },
                    { name: 'Data de Criação', value: createdAt, inline: true },
                    { name: `🎒 Itens Equipados [${equippedItems.length}/5]`, value: itemsText, inline: false }
                )
                .setColor(0x9932cc);
            await message.channel.send({ embeds: [embed] });
            return;
        }

        // Terceira vez: perfil "corrompido"
        profileUsageMap.delete(userId);
        // Gera avatar invertido usando serviço externo (ex: some-random-api)
        const avatarUrl = message.author.displayAvatarURL({ extension: 'png', size: 256 });
        const invertedUrl = `https://some-random-api.com/canvas/invert?avatar=${encodeURIComponent(avatarUrl)}`;
        // Texto corrompido
        const glitch = str => str.replace(/./g, c => '▒');
        const embed = new EmbedBuilder()
            .setTitle('▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒')
            .setThumbnail(invertedUrl)
            .addFields(
                { name: '▒▒▒▒▒▒▒▒', value: '▒▒▒▒▒▒▒▒', inline: true },
                { name: '▒▒▒▒▒▒▒▒▒▒▒', value: '▒▒▒▒▒▒▒▒▒▒▒', inline: true },
                { name: '▒▒▒▒▒▒▒▒▒▒▒▒', value: '▒▒▒▒▒▒▒▒▒▒▒▒', inline: true }
            )
            .setColor(0x000000);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('profile_locked')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Secondary)
        );
        const sentMsg = await message.channel.send({ embeds: [embed], components: [row] });

        // Apaga a mensagem corrompida após 30 segundos
        setTimeout(async () => {
            try {
                await sentMsg.delete();
            } catch (e) { /* ignore */ }
        }, 30000);

        // Cria coletor para o botão 🔒
        const filter = (interaction) => interaction.customId === 'profile_locked' && interaction.user.id === userId;
        const collector = sentMsg.createMessageComponentCollector({ filter, time: 30000, max: 1 });

        collector.on('collect', async (interaction) => {
            // Verifica se o usuário tem o item 2 (chave ferrujenta) equipado
            const hasKey = await UserItem.findOne({ userId, itemId: 2, equipado: true });
            if (!hasKey) {
                await interaction.reply({ content: '*É um cadeado velho, cheio de ferrugem, se eu tivesse a chave poderia abri-lo*', flags: 64 });
            } else {
                await interaction.reply({ content: '🔓 Uma mensagem aparece, é longa e confusa, é melhor anotá-la:', flags: 64 });
                await new Promise(resolve => setTimeout(resolve, 3000));
                await interaction.followUp({ content: 'SSBBTSBIT0xMT1cuCgpNWSBNSVNUQUtFUyBMRUFWRSBOT1RISU5HIEJVVCBIQVRFIElOIFRIRUlSCldBS0UsIEFORCBJTkZJTklURSBQQUlOIFRPIEZPTExPVy4uLgoKSSBDQU4nVCBUQUtFIEFOWSBNT1JFIE9GIFRISVMgR1VJTFQgQU5EIFJFR1JFVCwKRk9SIE1FIFRIRVJFIElTIE5PIFRPTU9SUk9XLi4uCgpJIEFNIEhPTExPVy4KCi4uLgoKSSBCRUdBTiBUTyBTRUVLIFRIRSBFTkQgT0YgTVkgREFZUy4KCkJVVCBXSEVOIEkgU1RBUkVEIElOVE8gVEhFIEFCWVNTLi4uCgpUSEUgQUJZU1MgQVZFUlRFRCBJVFMgR0FaRS4=', flags: 64 });
            }
        });
    }
};
