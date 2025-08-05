import { EmbedBuilder } from 'discord.js';
import { claimTimerService } from '../../services/claimTimerService.js';

export default {
    name: 'timers',
    aliases: ['activetimers', 'claimtimers'],
    description: 'Mostra os timers de claim ativos (apenas para debugging)',
    async execute(client, message, args) {
        try {
            // Apenas o owner pode usar este comando
            if (message.author.id !== '263048286026031104') {
                return message.reply('❌ Este comando é apenas para debugging!');
            }

            const activeTimers = claimTimerService.listActiveTimers();
            
            if (activeTimers.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('⏰ Timers de Claim Ativos')
                    .setDescription('Nenhum timer ativo no momento.')
                    .setColor('#808080')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }

            let description = '';
            activeTimers.forEach((timer, index) => {
                const timeLeftMs = timer.timeLeft;
                const minutes = Math.floor(timeLeftMs / 60000);
                const seconds = Math.floor((timeLeftMs % 60000) / 1000);
                const progress = Math.round(timer.progress * 100);
                
                description += `**${index + 1}.** Timer ID: \`${timer.id.slice(-8)}\`\n`;
                description += `⏰ Tempo restante: **${minutes}:${seconds.toString().padStart(2, '0')}**\n`;
                description += `📊 Progresso: **${progress}%**\n`;
                description += `${timer.isExpired ? '❌ Expirado' : '✅ Ativo'}\n\n`;
            });

            const embed = new EmbedBuilder()
                .setTitle('⏰ Timers de Claim Ativos')
                .setDescription(description)
                .setColor('#00FF00')
                .addFields(
                    {
                        name: '📊 Estatísticas',
                        value: `**${activeTimers.length}** timers ativos`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: 'Comando de debugging' });

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Erro no comando timers:', error);
            await message.reply('❌ Ocorreu um erro ao verificar os timers!');
        }
    }
};
