import { config } from '../config/config.js';

export default {
    name: 'messageCreate',
    async execute(message, client) {
        // --- Minijogo de combate por turnos ---
        // Ignorar comandos (mensagens que começam com o prefixo) no contador do minijogo
        if (!message.content.startsWith(config.prefix)) {
            if (!global.turnCombatMsgCount) global.turnCombatMsgCount = {};
            if (!global.turnCombatParticipants) global.turnCombatParticipants = {};
            const channelId = message.channel.id;
            global.turnCombatMsgCount[channelId] = (global.turnCombatMsgCount[channelId] || 0) + 1;
            // Guardar participantes ativos
            if (!global.turnCombatParticipants[channelId]) global.turnCombatParticipants[channelId] = [];
            if (!global.turnCombatParticipants[channelId].includes(message.author.id)) {
                global.turnCombatParticipants[channelId].push(message.author.id);
                // Limitar a 4 participantes recentes
                if (global.turnCombatParticipants[channelId].length > 4) global.turnCombatParticipants[channelId].shift();
            }
            // A cada 5 mensagens, 30% de chance de spawnar monstro
            if (global.turnCombatMsgCount[channelId] >= 50) {
                global.turnCombatMsgCount[channelId] = 0;
                if (Math.random() < 0.3) { //Alterar depois
                    const monsters = (await import('../config/monsters.js')).default;
                    const { spawnMonster } = await import('../minigames/turnCombat.js');
                    // Escolhe monstro aleatório
                    const monster = monsters[Math.floor(Math.random() * monsters.length)];
                    // Passa os frames e hp do monstro
                    spawnMonster(message.channel, [...global.turnCombatParticipants[channelId]], monster);
                    global.turnCombatParticipants[channelId] = [];
                }
            }
        }

        function normalize(str) {
            return str
                .toLowerCase()
                .normalize('NFD')
                .replace(/[^\w\s]/g, '') // remove pontuação
                .replace(/\s+/g, ''); // remove espaços
        }

        const triggers = ['olaamigos', 'lol'];
        const msgNorm = normalize(message.content);
        if (triggers.some(trigger => msgNorm.includes(trigger))) {
            const lolCmd = client.commands?.get('lol');
            if (lolCmd) {
                await lolCmd.execute(client, message);
                return;
            }
        }

        const triggersFantastico = ['fantastico', 'fanstatica', 'fanstastic'];
        const msgNormFantastico = normalize(message.content);
        if (triggersFantastico.some(trigger => msgNormFantastico.includes(trigger))) {
            const fantasticCmd = client.commands?.get('fantastic');
            if (fantasticCmd) {
                await fantasticCmd.execute(client, message);
                return;
            }
        }
        
        // Ignorar bots
        if (message.author.bot) return;

        // Verificar se a mensagem começa com o prefixo
        if (!message.content.startsWith(config.prefix)) return;

        // Extrair o comando e argumentos
        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Buscar o comando na coleção de comandos do client
        const command = client.commands?.get(commandName);

        if (!command) return;

        try {
            // Executar o comando
            await command.execute(client, message, args);
        } catch (error) {
            console.error(`❌ Erro ao executar comando ${commandName}:`, error);

            try {
                await message.reply('❌ Ocorreu um erro ao executar este comando!');
            } catch (replyError) {
                console.error('❌ Erro ao enviar mensagem de erro:', replyError);
            }
        }
    }
};
