// Comando separado para !spawn
import { config } from '../config/config.js';

export default async function handleSpawn(message) {
    // Verifica se o user tem Monster Spawner (id 3) equipado
    const UserItem = (await import('../models/UserItem.js')).default;
    const spawner = await UserItem.findOne({ userId: message.author.id, itemId: 3, equipado: true });
    if (!spawner) {
        await message.reply('❌ Precisas de ter o item "Monster Spawner" equipado para executar esta ação.');
        return;
    }
    // Verifica se o user tem Rotten Eggs (id 1) na bag
    const rottenEgg = await UserItem.findOne({ userId: message.author.id, itemId: 1 });
    if (!rottenEgg || rottenEgg.quantidade < 1) {
        await message.reply('❌ Precisas de pelo menos 1 Rotten Egg na bag para spawnar um monstro.');
        return;
    }
    // Subtrai 1 Rotten Egg
    rottenEgg.quantidade -= 1;
    if (rottenEgg.quantidade <= 0) {
        await rottenEgg.deleteOne();
    } else {
        await rottenEgg.save();
    }
    const monsters = (await import('../config/monsters.js')).default;
    const { spawnMonster } = await import('../minigames/turnCombat.js');
    // Participantes: quem usou o comando + até 3 últimos do canal
    let participantes = [message.author.id];
    if (global.turnCombatParticipants && global.turnCombatParticipants[message.channel.id]) {
        for (const id of global.turnCombatParticipants[message.channel.id]) {
            if (!participantes.includes(id)) participantes.push(id);
            if (participantes.length >= 4) break;
        }
    }
    const monster = monsters[Math.floor(Math.random() * monsters.length)];
    await spawnMonster(message.channel, participantes, monster, true); // força ignorar cooldown
    await message.reply('Combate iniciado manualmente! (1 Rotten Egg consumido)');
}
