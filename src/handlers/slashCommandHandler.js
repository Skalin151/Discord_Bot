import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { REST, Routes } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadSlashCommands(client) {
    const slashCommands = new Map();
    const commandsPath = join(__dirname, '..', 'slashCommands');
    
    try {
        // Criar diretório se não existir
        const fs = await import('fs');
        if (!fs.existsSync(commandsPath)) {
            fs.mkdirSync(commandsPath, { recursive: true });
        }
        
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = join(commandsPath, file);
            const commandModule = await import(`file://${filePath}`);
            
            // Buscar por exports que terminam com 'SlashCommand'
            for (const [exportName, exportValue] of Object.entries(commandModule)) {
                if (exportName.endsWith('SlashCommand') && exportValue.data && exportValue.execute) {
                    slashCommands.set(exportValue.data.name, exportValue);
                    console.log(`✅ Comando slash carregado: ${exportValue.data.name}`);
                }
            }
        }
        
        console.log(`📦 Total de comandos slash carregados: ${slashCommands.size}`);
        return slashCommands;
    } catch (error) {
        console.error('❌ Erro ao carregar comandos slash:', error);
        return new Map();
    }
}

export async function registerSlashCommands(client, guildId = null) {
    const slashCommands = client.slashCommands;
    if (!slashCommands || slashCommands.size === 0) {
        console.log('📝 Nenhum comando slash para registrar');
        return;
    }
    
    const commandsData = Array.from(slashCommands.values()).map(command => command.data.toJSON());
    
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('🔄 Registrando comandos slash...');
        
        if (guildId) {
            // Registrar para um servidor específico (mais rápido para desenvolvimento)
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, guildId),
                { body: commandsData }
            );
            console.log(`✅ Comandos slash registrados para o servidor ${guildId}`);
        } else {
            // Registrar globalmente (pode demorar até 1 hora para aparecer)
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commandsData }
            );
            console.log('✅ Comandos slash registrados globalmente');
        }
    } catch (error) {
        console.error('❌ Erro ao registrar comandos slash:', error);
    }
}
