import express from 'express';
import os from 'os';

const app = express();
const PORT = process.env.PORT || 3000;

// Variáveis para health check
let botClient = null;
let lastPingTime = Date.now();
const startTime = Date.now();

// Funções utilitárias para formatação
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function formatMemory(memoryUsage) {
  return {
    rss: formatBytes(memoryUsage.rss),
    heapTotal: formatBytes(memoryUsage.heapTotal),
    heapUsed: formatBytes(memoryUsage.heapUsed),
    external: formatBytes(memoryUsage.external),
    arrayBuffers: formatBytes(memoryUsage.arrayBuffers),
    raw: memoryUsage // Manter valores originais para debugging
  };
}

function formatLastPing(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) { // Menos de 1 minuto
    return `${Math.floor(diff / 1000)}s ago`;
  } else if (diff < 3600000) { // Menos de 1 hora
    return `${Math.floor(diff / 60000)}m ago`;
  } else {
    return new Date(timestamp).toISOString();
  }
}

// Middleware para logs de requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} from ${req.ip}`);
  lastPingTime = Date.now();
  next();
});

// Endpoint principal - redirect para status
app.get('/', (req, res) => {
  res.redirect('/status');
});

// Endpoint simples de ping para keep-alive (sempre retorna 200)
app.get('/ping', (req, res) => {
  res.status(200).json({ 
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: formatUptime(Date.now() - startTime)
  });
});

// Endpoint unificado de status com todas as informações
app.get('/status', (req, res) => {
  try {
    const uptimeMs = Date.now() - startTime;
    const systemUptime = os.uptime() * 1000;
    const memoryUsage = process.memoryUsage();
    const totalSystemMemory = os.totalmem();
    const freeSystemMemory = os.freemem();
    const usedSystemMemory = totalSystemMemory - freeSystemMemory;
    
    // Informações de CPU
    const cpus = os.cpus();
    const loadAverage = os.loadavg();
    
    // Detectar ambiente
    const isRender = process.env.RENDER === 'true' || process.env.RENDER_SERVICE_ID;
    const isLinuxContainer = os.platform() === 'linux' && process.env.container;
    const platform = os.platform();
    
    // Determinar health status
    const botConnected = botClient?.isReady() || false;
    const botPing = botClient?.ws?.ping || 0;
    const memoryThreshold = isLinuxContainer ? 512 * 1024 * 1024 : 500 * 1024 * 1024; // 512MB para containers
    
    const isUnhealthy = !botConnected || 
                        (botPing > 500) ||
                        (memoryUsage.heapUsed > memoryThreshold);
    
    const healthScore = () => {
      let score = 100;
      if (!botConnected) score -= 50;
      if (botPing > 200) score -= 20;
      if (botPing > 500) score -= 30;
      if (memoryUsage.heapUsed > memoryThreshold) score -= 25;
      if (usedSystemMemory / totalSystemMemory > 0.9) score -= 15;
      return Math.max(score, 0);
    };
    
    const health = healthScore();
    const environmentInfo = isRender ? 'Render Cloud' : 
                           isLinuxContainer ? 'Linux Container' :
                           platform === 'win32' ? 'Windows' :
                           platform === 'darwin' ? 'macOS' : 
                           'Linux';
    
    // Bot statistics
    const totalUsers = botClient?.guilds?.cache?.reduce((acc, guild) => acc + guild.memberCount, 0) || 0;
    
    const statusData = {
      // Status geral
      status: isUnhealthy ? 'unhealthy' : 'healthy',
      health: {
        score: health,
        status: health >= 80 ? 'Excelente' : health >= 60 ? 'Bom' : health >= 40 ? 'Atenção' : 'Crítico'
      },
      timestamp: new Date().toISOString(),
      
      // Informações do bot
      bot: {
        name: botClient?.user?.tag || 'Disconnected',
        id: botClient?.user?.id || null,
        connected: botConnected,
        uptime: {
          formatted: formatUptime(uptimeMs),
          milliseconds: uptimeMs,
          since: new Date(startTime).toISOString()
        },
        performance: {
          ping: botPing > 0 ? `${botPing}ms` : 'N/A',
          responseTime: `${Date.now() - lastPingTime}ms`
        },
        discord: {
          guilds: botClient?.guilds?.cache?.size || 0,
          users: totalUsers.toLocaleString(),
          channels: botClient?.channels?.cache?.size || 0
        }
      },
      
      // Informações do sistema
      system: {
        environment: environmentInfo,
        platform: platform,
        architecture: os.arch(),
        hostname: os.hostname(),
        nodeVersion: process.version,
        uptime: {
          formatted: formatUptime(systemUptime),
          milliseconds: systemUptime
        },
        cpu: {
          model: cpus[0]?.model?.split(' ')[0] || 'Unknown',
          cores: cpus.length || 1,
          architecture: cpus[0]?.model || 'Unknown',
          loadAverage: loadAverage.map(avg => parseFloat(avg.toFixed(2)))
        }
      },
      
      // Informações de memória
      memory: {
        bot: {
          rss: formatBytes(memoryUsage.rss),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          heapUsed: formatBytes(memoryUsage.heapUsed),
          external: formatBytes(memoryUsage.external),
          arrayBuffers: formatBytes(memoryUsage.arrayBuffers),
          usage: `${formatBytes(memoryUsage.heapUsed)} / ${formatBytes(memoryUsage.heapTotal)}`
        },
        system: {
          total: formatBytes(totalSystemMemory),
          used: formatBytes(usedSystemMemory),
          free: formatBytes(freeSystemMemory),
          usage: `${formatBytes(usedSystemMemory)} / ${formatBytes(totalSystemMemory)}`,
          percentage: Math.round((usedSystemMemory / totalSystemMemory) * 100)
        }
      },
      
      // Monitoring info
      monitoring: {
        lastPing: {
          formatted: formatLastPing(lastPingTime),
          timestamp: new Date(lastPingTime).toISOString(),
          ago: Date.now() - lastPingTime
        },
        endpoints: {
          status: '/status',
          health: '/status (unified)',
          stats: '/status (unified)'
        }
      }
    };
    
    // Sempre retorna 200 OK, mas com status "unhealthy" no JSON
    // Isso permite que monitoring services vejam o estado real sem erro HTTP
    res.status(200).json(statusData);
    
  } catch (error) {
    console.error('❌ Erro no endpoint status:', error);
    res.status(500).json({
      status: 'error',
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
      message: error.message
    });
  }
});

// Endpoints legados (redirecionam para /status)
app.get('/health', (req, res) => {
  res.redirect('/status');
});

app.get('/stats', (req, res) => {
  res.redirect('/status');
});

// Função para registrar o cliente do bot
export function setBotClient(client) {
  botClient = client;
  console.log('🤖 Bot client registrado no servidor de ping');
}

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('❌ Erro no servidor de ping:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, encerrando servidor de ping...');
  server.close(() => {
    console.log('✅ Servidor de ping encerrado');
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recebido, encerrando servidor de ping...');
  server.close(() => {
    console.log('✅ Servidor de ping encerrado');
    process.exit(0);
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Servidor de ping rodando na porta ${PORT}`);
  console.log(`📊 Endpoint principal:`);
  console.log(`   GET /status  - Status completo e unificado`);
  console.log(`   GET /        - Redireciona para /status`);
  console.log(`   GET /health  - Redireciona para /status (legacy)`);
  console.log(`   GET /stats   - Redireciona para /status (legacy)`);
});
