import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getAllCommandFiles(dir) {
    let results = [];
    const list = readdirSync(dir);
    for (const file of list) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(await getAllCommandFiles(filePath));
        } else if (file.endsWith('.js')) {
            results.push(filePath);
        }
    }
    return results;
}

export async function loadCommands() {
    const commands = new Map();
    const commandsPath = join(__dirname, '..', 'commands');
    try {
        const commandFiles = await getAllCommandFiles(commandsPath);
        for (const filePath of commandFiles) {
            const commandModule = await import(pathToFileURL(filePath).href);
            // Suporta export default ou module.exports
            const command = commandModule.default || commandModule;
            if (command && command.name && typeof command.execute === 'function') {
                commands.set(command.name, command);
                console.log(`✅ Comando carregado: ${command.name}`);
                
                // Registrar aliases se existirem
                if (command.aliases && Array.isArray(command.aliases)) {
                    for (const alias of command.aliases) {
                        commands.set(alias, command);
                        console.log(`✅ Alias carregado: ${alias} -> ${command.name}`);
                    }
                }
            } else {
                // Suporte para múltiplos exports (ex: { playCommand, stopCommand })
                for (const [exportName, exportValue] of Object.entries(commandModule)) {
                    if (exportValue && exportValue.name && typeof exportValue.execute === 'function') {
                        commands.set(exportValue.name, exportValue);
                        console.log(`✅ Comando carregado: ${exportValue.name}`);
                        
                        // Registrar aliases se existirem
                        if (exportValue.aliases && Array.isArray(exportValue.aliases)) {
                            for (const alias of exportValue.aliases) {
                                commands.set(alias, exportValue);
                                console.log(`✅ Alias carregado: ${alias} -> ${exportValue.name}`);
                            }
                        }
                    }
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
