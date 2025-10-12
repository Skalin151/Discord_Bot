import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadEvents(client) {
    const eventsPath = path.join(__dirname, '../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        try {
            const filePath = path.join(eventsPath, file);
            const fileURL = pathToFileURL(filePath).href;
            const eventModule = await import(fileURL);
            const event = eventModule.default;

            // Verificar se o evento tem as propriedades necessárias
            if (!event || !event.name || typeof event.execute !== 'function') {
                console.log(`⚠️ Evento ignorado ${file}: estrutura inválida`);
                continue;
            }

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
            console.log(`✅ Evento carregado: ${event.name}`);
        } catch (error) {
            console.error(`❌ Erro ao carregar evento ${file}:`, error);
        }
    }
}
