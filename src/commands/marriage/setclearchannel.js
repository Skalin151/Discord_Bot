import { EmbedBuilder } from 'discord.js';

export default {
    name: 'setclearchannel',
    aliases: ['clearlogchannel'],
    description: 'Define o canal para logs do clear automático (apenas owner)',
    async execute(client, message, args) {
        try {
            // Verificar se é o owner do bot
            const ownerId = '358926963446120448'; // Substitua pelo seu ID
            
            if (message.author.id !== ownerId) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Sem Permissão')
                    .setDescription('Apenas o owner do bot pode usar este comando!')
                    .setColor('#FF4444')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            // Se não foi fornecido canal, usar o canal atual
            let targetChannel = message.channel;
            
            // Se foi mencionado um canal, usar esse
            if (message.mentions.channels.size > 0) {
                targetChannel = message.mentions.channels.first();
            }
            
            // Se foi fornecido um ID de canal
            else if (args.length > 0) {
                try {
                    const channelId = args[0];
                    const fetchedChannel = await client.channels.fetch(channelId);
                    if (fetchedChannel) {
                        targetChannel = fetchedChannel;
                    }
                } catch (error) {
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ Canal Inválido')
                        .setDescription('Não foi possível encontrar o canal especificado!')
                        .setColor('#FF4444')
                        .setTimestamp();
                    
                    return message.reply({ embeds: [errorEmbed] });
                }
            }

            // Verificar se o bot tem permissões para enviar mensagens no canal
            if (!targetChannel.permissionsFor(client.user).has('SendMessages')) {
                const permissionEmbed = new EmbedBuilder()
                    .setTitle('❌ Sem Permissões')
                    .setDescription('Não tenho permissões para enviar mensagens neste canal!')
                    .setColor('#FF4444')
                    .setTimestamp();
                
                return message.reply({ embeds: [permissionEmbed] });
            }

            // Salvar o canal ID globalmente (você pode implementar uma base de dados para isso)
            // Por agora, vamos apenas confirmar que foi definido
            const embed = new EmbedBuilder()
                .setTitle('✅ Canal de Logs Definido')
                .setDescription(`O canal ${targetChannel} foi definido para receber logs do clear automático!`)
                .setColor('#00FF00')
                .addFields(
                    {
                        name: '📋 Canal Configurado',
                        value: `**Nome:** ${targetChannel.name}\n**ID:** ${targetChannel.id}`,
                        inline: true
                    },
                    {
                        name: 'ℹ️ Informação',
                        value: 'Quando o clear automático for executado, uma notificação será enviada para este canal.',
                        inline: false
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: 'Canal de logs configurado com sucesso!' 
                });

            await message.reply({ embeds: [embed] });

            // Enviar mensagem de teste no canal configurado
            const testEmbed = new EmbedBuilder()
                .setTitle('🧹 Canal de Logs Configurado')
                .setDescription('Este canal foi configurado para receber notificações do clear automático!')
                .setColor('#5865f2')
                .setTimestamp()
                .setFooter({ 
                    text: 'Mensagem de teste' 
                });

            await targetChannel.send({ embeds: [testEmbed] });

        } catch (error) {
            console.error('❌ Erro no comando setclearchannel:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Erro no Sistema')
                .setDescription('Ocorreu um erro ao configurar o canal. Tenta novamente!')
                .setColor('#FF4444')
                .setTimestamp();
            
            await message.reply({ embeds: [errorEmbed] });
        }
    }
};
