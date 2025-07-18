import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const purgeSlashCommand = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Apaga mensagens do canal atual')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Número de mensagens para apagar (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false),
    
    async execute(interaction) {
        try {
            // Verificar se o usuário tem permissão para gerenciar mensagens
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ 
                    content: '❌ Você não tem permissão para usar este comando!', 
                    ephemeral: true 
                });
            }

            // Verificar se o bot tem permissão para gerenciar mensagens
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ 
                    content: '❌ Eu não tenho permissão para gerenciar mensagens neste canal!', 
                    ephemeral: true 
                });
            }

            // Obter o número de mensagens para apagar (padrão: 100)
            const amount = interaction.options.getInteger('quantidade') ?? 100;

            // Responder imediatamente para evitar timeout
            await interaction.deferReply({ ephemeral: true });

            // Buscar mensagens para apagar
            const messages = await interaction.channel.messages.fetch({ 
                limit: amount 
            });

            // Filtrar mensagens que não são muito antigas (Discord só permite apagar mensagens de até 14 dias)
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const filteredMessages = messages.filter(msg => msg.createdTimestamp > twoWeeksAgo);

            if (filteredMessages.size === 0) {
                return interaction.editReply('❌ Não há mensagens válidas para apagar (mensagens devem ter menos de 14 dias).');
            }

            // Apagar as mensagens
            await interaction.channel.bulkDelete(filteredMessages, true);

            // Confirmar a ação
            await interaction.editReply(`✅ **${filteredMessages.size} mensagem(s) apagada(s) com sucesso!**`);

            // Apagar a resposta após alguns segundos
            setTimeout(async () => {
                try {
                    await interaction.deleteReply();
                } catch (error) {
                    console.log('Não foi possível apagar a resposta da interação:', error.message);
                }
            }, 3000);

        } catch (error) {
            console.error('Erro ao executar comando slash purge:', error);
            
            const errorMessage = error.code === 50034 
                ? '❌ Só posso apagar mensagens de até 14 dias!'
                : error.code === 50013 
                ? '❌ Não tenho permissão para apagar mensagens neste canal!'
                : '❌ Ocorreu um erro ao tentar apagar as mensagens.';
            
            try {
                if (interaction.deferred) {
                    await interaction.editReply(errorMessage);
                } else {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                }
            } catch (replyError) {
                console.error('Erro ao enviar resposta de erro:', replyError);
            }
        }
    }
};
