import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Variáveis para health check
let botClient = null;
let lastPingTime = Date.now();
const startTime = Date.now();

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
    uptime: Date.now() - startTime
  });
});

// Endpoint de health check detalhado
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    memory: process.memoryUsage(),
    lastPing: lastPingTime,
    bot: {
      connected: botClient?.isReady() || false,
      guilds: botClient?.guilds?.cache?.size || 0,
      ping: botClient?.ws?.ping || -1,
      user: botClient?.user?.tag || 'Not connected'
    }
  };

  // Verificar se o bot está com problemas
  const isUnhealthy = !botClient?.isReady() || 
                      (botClient?.ws?.ping > 500) ||
                      (process.memoryUsage().heapUsed > 500 * 1024 * 1024); // 500MB

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

  res.json({
    guilds: botClient.guilds.cache.size,
    users: botClient.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
    channels: botClient.channels.cache.size,
    ping: botClient.ws.ping,
    uptime: Date.now() - startTime,
    memory: process.memoryUsage()
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
