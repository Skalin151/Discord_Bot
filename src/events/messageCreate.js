import { config } from '../config/config.js';

export default {
    name: 'messageCreate',
    async execute(client, message) {
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
