import express from 'express';

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

// Endpoint principal - health check básico
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: formatUptime(Date.now() - startTime)
  });
});

// Endpoint de health check detalhado
app.get('/health', (req, res) => {
  const uptimeMs = Date.now() - startTime;
  const memoryUsage = process.memoryUsage();
  
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: {
      formatted: formatUptime(uptimeMs),
      milliseconds: uptimeMs
    },
    memory: formatMemory(memoryUsage),
    lastPing: {
      formatted: formatLastPing(lastPingTime),
      timestamp: new Date(lastPingTime).toISOString()
    },
    bot: {
      connected: botClient?.isReady() || false,
      guilds: botClient?.guilds?.cache?.size || 0,
      ping: botClient?.ws?.ping ? `${botClient.ws.ping}ms` : 'N/A',
      user: botClient?.user?.tag || 'Not connected'
    }
  };

  // Verificar se o bot está com problemas
  const isUnhealthy = !botClient?.isReady() || 
                      (botClient?.ws?.ping > 500) ||
                      (memoryUsage.heapUsed > 500 * 1024 * 1024); // 500MB

  if (isUnhealthy) {
    healthStatus.status = 'unhealthy';
    res.status(503);
  }

  res.json(healthStatus);
});

// Endpoint para estatísticas do bot
app.get('/stats', (req, res) => {
  if (!botClient?.isReady()) {
    return res.status(503).json({ error: 'Bot not connected' });
  }

  const uptimeMs = Date.now() - startTime;
  const memoryUsage = process.memoryUsage();
  const totalUsers = botClient.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

  res.json({
    bot: {
      name: botClient.user.tag,
      id: botClient.user.id,
      connected: true
    },
    servers: {
      count: botClient.guilds.cache.size,
      users: totalUsers.toLocaleString(),
      channels: botClient.channels.cache.size.toLocaleString()
    },
    performance: {
      ping: `${botClient.ws.ping}ms`,
      uptime: {
        formatted: formatUptime(uptimeMs),
        since: new Date(startTime).toISOString()
      },
      memory: formatMemory(memoryUsage)
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  });
});

// Endpoint para forçar restart (apenas local/desenvolvimento)
app.post('/restart', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Restart not allowed in production' });
  }
  
  console.log('🔄 Restart solicitado via API');
  res.json({ message: 'Restarting...' });
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
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
  console.log(`📊 Endpoints disponíveis:`);
  console.log(`   GET /        - Health check básico`);
  console.log(`   GET /health  - Health check detalhado`);
  console.log(`   GET /stats   - Estatísticas do bot`);
});
