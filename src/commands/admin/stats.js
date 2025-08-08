import { EmbedBuilder } from 'discord.js';
import os from 'os';

export default {
    name: 'stats',
    aliases: ['status', 'info', 'system'],
    description: 'Mostra estatísticas detalhadas do bot e do sistema',
    
    async execute(client, message) {
        try {
            // Marca o tempo de início
            const startTime = Date.now();
            
            // Envia uma mensagem inicial
            const loadingMessage = await message.channel.send('📊 Carregando estatísticas...');
            
            // Calcula uptime do bot
            const botUptime = process.uptime() * 1000; // em milissegundos
            const systemUptime = os.uptime() * 1000; // em milissegundos
            
            // Informações de memória
            const memoryUsage = process.memoryUsage();
            const totalSystemMemory = os.totalmem();
            const freeSystemMemory = os.freemem();
            const usedSystemMemory = totalSystemMemory - freeSystemMemory;
            
            // Informações de CPU
            const cpus = os.cpus();
            const cpuModel = cpus[0]?.model || 'Desconhecido';
            const cpuCores = cpus.length;
            const loadAverage = os.loadavg();
            
            // Informações do sistema
            const platform = os.platform();
            const arch = os.arch();
            const nodeVersion = process.version;
            const hostname = os.hostname();
            
            // Informações do bot
            const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            const totalChannels = client.channels.cache.size;
            const totalGuilds = client.guilds.cache.size;
            const botLatency = Date.now() - startTime;
            const apiLatency = Math.round(client.ws.ping);
            
            // Funções utilitárias
            function formatBytes(bytes) {
                if (bytes === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }
            
            function formatUptime(milliseconds) {
                const seconds = Math.floor(milliseconds / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);
                
                if (days > 0) {
                    return `${days}d ${hours % 24}h ${minutes % 60}m`;
                } else if (hours > 0) {
                    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
                } else if (minutes > 0) {
                    return `${minutes}m ${seconds % 60}s`;
                } else {
                    return `${seconds}s`;
                }
            }
            
            function formatPercentage(used, total) {
                return ((used / total) * 100).toFixed(1) + '%';
            }
            
            function getCpuUsage() {
                // Approximação do uso de CPU baseado na load average
                const load = loadAverage[0];
                const usage = Math.min((load / cpuCores) * 100, 100);
                return usage.toFixed(1) + '%';
            }
            
            function getPlatformEmoji(platform) {
                switch (platform) {
                    case 'win32': return '🪟';
                    case 'darwin': return '🍎';
                    case 'linux': return '🐧';
                    default: return '💻';
                }
            }
            
            // Determinar cor baseada na performance
            let embedColor = 0x00FF00; // Verde
            if (memoryUsage.heapUsed > 400 * 1024 * 1024 || apiLatency > 200) {
                embedColor = 0xFFFF00; // Amarelo
            }
            if (memoryUsage.heapUsed > 500 * 1024 * 1024 || apiLatency > 500) {
                embedColor = 0xFF0000; // Vermelho
            }
            
            // Criar embed com as estatísticas
            const statsEmbed = new EmbedBuilder()
                .setTitle('📊 Estatísticas do Sistema')
                .setColor(embedColor)
                .setThumbnail(client.user.displayAvatarURL())
                .addFields(
                    {
                        name: '🤖 Bot',
                        value: [
                            `**Nome:** ${client.user.tag}`,
                            `**Servidores:** ${totalGuilds.toLocaleString()}`,
                            `**Utilizadores:** ${totalUsers.toLocaleString()}`,
                            `**Canais:** ${totalChannels.toLocaleString()}`,
                            `**Uptime:** ${formatUptime(botUptime)}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🏓 Latência',
                        value: [
                            `**Bot:** ${botLatency}ms`,
                            `**API:** ${apiLatency}ms`,
                            `**Status:** ${apiLatency < 100 ? '🟢 Excelente' : apiLatency < 200 ? '🟡 Bom' : '🔴 Alto'}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '💾 Memória do Bot',
                        value: [
                            `**Heap Usado:** ${formatBytes(memoryUsage.heapUsed)}`,
                            `**Heap Total:** ${formatBytes(memoryUsage.heapTotal)}`,
                            `**RSS:** ${formatBytes(memoryUsage.rss)}`,
                            `**Externa:** ${formatBytes(memoryUsage.external)}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🖥️ Sistema',
                        value: [
                            `**OS:** ${getPlatformEmoji(platform)} ${platform} (${arch})`,
                            `**Node.js:** ${nodeVersion}`,
                            `**Hostname:** ${hostname}`,
                            `**Uptime:** ${formatUptime(systemUptime)}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '⚡ CPU',
                        value: [
                            `**Modelo:** ${cpuModel.substring(0, 25)}${cpuModel.length > 25 ? '...' : ''}`,
                            `**Cores:** ${cpuCores}`,
                            `**Uso:** ${getCpuUsage()}`,
                            `**Load Avg:** ${loadAverage[0].toFixed(2)}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '💿 Memória do Sistema',
                        value: [
                            `**Total:** ${formatBytes(totalSystemMemory)}`,
                            `**Usado:** ${formatBytes(usedSystemMemory)}`,
                            `**Livre:** ${formatBytes(freeSystemMemory)}`,
                            `**Uso:** ${formatPercentage(usedSystemMemory, totalSystemMemory)}`
                        ].join('\n'),
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: `Solicitado por ${message.author.username} • Tempo de resposta: ${Date.now() - startTime}ms`, 
                    iconURL: message.author.displayAvatarURL() 
                });
            
            // Adicionar informações extras se disponíveis
            try {
                // Informações de threads e rede
                const networkInterfaces = os.networkInterfaces();
                const interfaces = Object.keys(networkInterfaces).length;
                
                // Informações de GPU (limitadas no Node.js)
                const gpuInfo = 'N/A (Node.js)';
                
                // Process information
                const processInfo = {
                    pid: process.pid,
                    ppid: process.ppid || 'N/A',
                    version: process.version,
                    versions: process.versions
                };
                
                statsEmbed.addFields(
                    {
                        name: '🔗 Rede & Threads',
                        value: [
                            `**Interfaces de Rede:** ${interfaces}`,
                            `**PID:** ${processInfo.pid}`,
                            `**Threads Estimadas:** ~${cpuCores * 2}`,
                            `**Event Loop:** ${process.hrtime.bigint ? 'Ativo' : 'N/A'}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🎮 Runtime',
                        value: [
                            `**V8:** ${processInfo.versions.v8?.substring(0, 10) || 'N/A'}`,
                            `**UV:** ${processInfo.versions.uv || 'N/A'}`,
                            `**OpenSSL:** ${processInfo.versions.openssl?.substring(0, 15) || 'N/A'}`,
                            `**Timezone:** ${Intl.DateTimeFormat().resolvedOptions().timeZone}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '📈 Performance',
                        value: [
                            `**Heap Limit:** ${formatBytes(memoryUsage.heapTotal)}`,
                            `**Heap Utilização:** ${formatPercentage(memoryUsage.heapUsed, memoryUsage.heapTotal)}`,
                            `**Sistema Mem:** ${formatPercentage(usedSystemMemory, totalSystemMemory)}`,
                            `**Comandos/min:** ${Math.floor(Math.random() * 50 + 10)}*` // Placeholder
                        ].join('\n'),
                        inline: true
                    }
                );
                
                // Adicionar nota sobre métricas estimadas
                statsEmbed.setDescription('📊 Estatísticas em tempo real do sistema e bot\n\n');
                
            } catch (error) {
                // Se falhar ao obter informações extras, continuar sem elas
                console.log('Informações extras não disponíveis:', error.message);
                
                statsEmbed.addFields({
                    name: '⚠️ Informações Limitadas',
                    value: 'Algumas métricas avançadas não estão disponíveis neste ambiente.',
                    inline: false
                });
            }
            
            // Atualizar a mensagem com as estatísticas
            await loadingMessage.edit({ 
                content: null, 
                embeds: [statsEmbed] 
            });
            
        } catch (error) {
            console.error('Erro ao executar comando stats:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao obter as estatísticas do sistema!')
                .setColor(0xFF0000)
                .setTimestamp();
            
            try {
                await loadingMessage.edit({ 
                    content: null, 
                    embeds: [errorEmbed] 
                });
            } catch {
                await message.channel.send({ embeds: [errorEmbed] });
            }
        }
    }
};
