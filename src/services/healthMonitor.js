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
    }

    start() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('🔍 Health Monitor iniciado');

        // Monitorar a cada 30 segundos
        this.monitorInterval = setInterval(() => {
            this.checkHealth();
        }, 30000);

        // Monitorar eventos do bot
        this.setupEventListeners();
    }

    stop() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        console.log('🔍 Health Monitor parado');
        
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
    }

    setupEventListeners() {
        // Contar comandos executados
        this.client.on('interactionCreate', () => {
            this.metrics.commands++;
        });

        // Monitorar erros
        this.client.on('error', (error) => {
            this.metrics.errors++;
            this.metrics.lastError = {
                message: error.message,
                timestamp: Date.now()
            };
            console.error('❌ Erro capturado pelo Health Monitor:', error.message);
        });

        // Monitorar desconexões
        this.client.on('disconnect', () => {
            console.warn('⚠️ Bot desconectado do Discord');
        });

        this.client.on('reconnecting', () => {
            console.log('🔄 Bot reconectando ao Discord...');
            this.metrics.restarts++;
        });
    }

    checkHealth() {
        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

        // Log de status básico
        console.log(`🔍 Health Check - Heap: ${heapUsedMB}MB/${heapTotalMB}MB | Ping: ${this.client.ws.ping}ms | Guilds: ${this.client.guilds.cache.size}`);

        // Avisar sobre uso alto de memória
        if (heapUsedMB > 400) { // 400MB
            this.metrics.memoryWarnings++;
            console.warn(`⚠️ Uso alto de memória: ${heapUsedMB}MB`);
        }

        // Avisar sobre ping alto
        if (this.client.ws.ping > 1000) {
            console.warn(`⚠️ Ping alto detectado: ${this.client.ws.ping}ms`);
        }

        // Forçar garbage collection se memória muito alta
        if (heapUsedMB > 500 && global.gc) {
            console.log('🗑️ Executando garbage collection...');
            global.gc();
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

        if (heapUsedMB > 500) {
            status = 'critical';
            issues.push(`Memória crítica: ${heapUsedMB}MB`);
        } else if (heapUsedMB > 400) {
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
