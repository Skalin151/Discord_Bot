export const config = {
    // Prefixo para comandos
    prefix: '%',
    
    // Nome do canal onde os logs serão enviados
    logChannelNames: ['logs', 'audit-logs', 'eventos'],
    
    // Configurações de cores para diferentes tipos de eventos
    colors: {
        success: '#00ff00',
        error: '#ff0000',
        warning: '#ffff00',
        info: '#0099ff',
        voice: '#9c1a5bff',
        member: '#9932cc'
    },
    
    // Eventos que devem ser ignorados (adicione aqui se necessário)
    ignoredEvents: {
        // Ignorar bots em eventos de mensagem
        ignoreBots: true,
        
        // Ignorar canais específicos (adicione IDs se necessário)
        ignoredChannels: [],
        
        // Ignorar usuários específicos (adicione IDs se necessário)
        ignoredUsers: []
    }
};
