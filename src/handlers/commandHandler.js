import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadCommands() {
    const commands = new Map();
    const commandsPath = join(__dirname, '..', 'commands');
    
    try {
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = join(commandsPath, file);
            const commandModule = await import(`file://${filePath}`);
            
            // Buscar por exports que terminam com 'Command'
            for (const [exportName, exportValue] of Object.entries(commandModule)) {
                if (exportName.endsWith('Command') && exportValue.name && exportValue.execute) {
                    commands.set(exportValue.name, exportValue);
                    console.log(`✅ Comando carregado: ${exportValue.name}`);
                }
            }
        }
        
        console.log(`📦 Total de comandos carregados: ${commands.size}`);
        return commands;
    } catch (error) {
        console.error('❌ Erro ao carregar comandos:', error);
        return new Map();
    }
}
