/**
 * Serviço de monitoramento de saúde do bot
 * Monitora recursos e performance do bot
 */

export class HealthMonitor {
    constructor(client) {
        this.client = client;
        this.metrics = {
            startTime: Date.now(),
            errors: 0,
            commands: 0,
            restarts: 0,
            lastError: null,
            memoryWarnings: 0
        };
        this.isMonitoring = false;
        this.listeners = {}; // Armazena referências aos listeners
    }

    start() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('🔍 Health Monitor iniciado');

        // Monitorar a cada 60 segundos 
        this.monitorInterval = setInterval(() => {
            this.checkHealth();
        }, 60000);

        // Monitorar eventos do bot
        this.setupEventListeners();
    }

    stop() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        console.log('🔍 Health Monitor parado');
        
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }

        // CRITICAL: Remover todos os event listeners
        this.removeEventListeners();
    }

    setupEventListeners() {
        // CRITICAL: Remover listeners antigos antes de adicionar novos
        this.removeEventListeners();

        // Contar comandos executados
        this.listeners.interactionCreate = () => {
            this.metrics.commands++;
        };

        // Monitorar erros
        this.listeners.error = (error) => {
            this.metrics.errors++;
            this.metrics.lastError = {
                message: error.message,
                timestamp: Date.now()
            };
            console.error('❌ Erro capturado pelo Health Monitor:', error.message);
        };

        // Monitorar desconexões
        this.listeners.disconnect = () => {
            console.warn('⚠️ Bot desconectado do Discord');
        };

        this.listeners.reconnecting = () => {
            console.log('🔄 Bot reconectando ao Discord...');
            this.metrics.restarts++;
        };

        // Adicionar listeners
        this.client.on('interactionCreate', this.listeners.interactionCreate);
        this.client.on('error', this.listeners.error);
        this.client.on('disconnect', this.listeners.disconnect);
        this.client.on('reconnecting', this.listeners.reconnecting);
    }

    removeEventListeners() {
        // CRITICAL: Remover todos os listeners para evitar memory leaks
        if (this.listeners.interactionCreate) {
            this.client.removeListener('interactionCreate', this.listeners.interactionCreate);
        }
        if (this.listeners.error) {
            this.client.removeListener('error', this.listeners.error);
        }
        if (this.listeners.disconnect) {
            this.client.removeListener('disconnect', this.listeners.disconnect);
        }
        if (this.listeners.reconnecting) {
            this.client.removeListener('reconnecting', this.listeners.reconnecting);
        }
        
        this.listeners = {};
    }

    checkHealth() {
        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

        // Log de status básico (apenas em ambiente de desenvolvimento)
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 Health Check - Heap: ${heapUsedMB}MB/${heapTotalMB}MB | Ping: ${this.client.ws.ping}ms | Guilds: ${this.client.guilds.cache.size}`);
        }

        // AGRESSIVO: Limpar caches mais cedo para Render Free
        if (heapUsedMB > 200) {
            this.metrics.memoryWarnings++;
            if (heapUsedMB > 250) {
                console.warn(`⚠️ Uso alto de memória: ${heapUsedMB}MB - LIMPANDO CACHES`);
            }
            
            // Limpar caches do Discord.js
            this.cleanupCaches();
        }

        // Avisar sobre ping alto
        if (this.client.ws.ping > 1000) {
            console.warn(`⚠️ Ping alto detectado: ${this.client.ws.ping}ms`);
        }

        // Forçar garbage collection mais agressivo
        if (heapUsedMB > 300 && global.gc) {
            console.log('🗑️ Executando garbage collection...');
            global.gc();
        }
    }

    cleanupCaches() {
        // Limpar caches desnecessários do Discord.js para liberar memória - AGRESSIVO
        try {
            let cleaned = 0;
            
            // Limitar tamanho de cache de mensagens - MAIS AGRESSIVO
            this.client.channels.cache.forEach(channel => {
                if (channel.messages) {
                    // Manter apenas as últimas 5 mensagens em cache (reduzido de 10)
                    if (channel.messages.cache.size > 5) {
                        const messages = Array.from(channel.messages.cache.values());
                        messages.slice(0, -5).forEach(msg => {
                            channel.messages.cache.delete(msg.id);
                            cleaned++;
                        });
                    }
                }
            });

            // Limpar membros desnecessários
            this.client.guilds.cache.forEach(guild => {
                if (guild.members.cache.size > 50) {
                    const members = Array.from(guild.members.cache.values())
                        .filter(m => m.id !== this.client.user.id); // Não remover o próprio bot
                    
                    members.slice(0, -50).forEach(member => {
                        guild.members.cache.delete(member.id);
                        cleaned++;
                    });
                }
            });

            // Limpar usuários desnecessários
            if (this.client.users.cache.size > 50) {
                const users = Array.from(this.client.users.cache.values())
                    .filter(u => u.id !== this.client.user.id);
                
                users.slice(0, -50).forEach(user => {
                    this.client.users.cache.delete(user.id);
                    cleaned++;
                });
            }

            if (cleaned > 0) {
                console.log(`🧹 ${cleaned} itens removidos do cache para liberar memória`);
            }
        } catch (error) {
            console.error('Erro ao limpar caches:', error.message);
        }
    }

    getMetrics() {
        return {
            ...this.metrics,
            uptime: Date.now() - this.metrics.startTime,
            memory: process.memoryUsage(),
            bot: {
                ping: this.client.ws.ping,
                guilds: this.client.guilds.cache.size,
                ready: this.client.isReady()
            }
        };
    }

    getHealthStatus() {
        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        
        let status = 'healthy';
        let issues = [];

        // Verificar problemas
        if (!this.client.isReady()) {
            status = 'critical';
            issues.push('Bot não conectado');
        }

        if (this.client.ws.ping > 1000) {
            status = status === 'healthy' ? 'warning' : status;
            issues.push(`Ping alto: ${this.client.ws.ping}ms`);
        }

        // Limites ajustados para Render Free (512MB max)
        if (heapUsedMB > 400) {
            status = 'critical';
            issues.push(`Memória crítica: ${heapUsedMB}MB`);
        } else if (heapUsedMB > 300) {
            status = status === 'healthy' ? 'warning' : status;
            issues.push(`Memória alta: ${heapUsedMB}MB`);
        }

        if (this.metrics.errors > 10) {
            status = status === 'healthy' ? 'warning' : status;
            issues.push(`Muitos erros: ${this.metrics.errors}`);
        }

        return {
            status,
            issues,
            timestamp: new Date().toISOString()
        };
    }
}

export default HealthMonitor;
