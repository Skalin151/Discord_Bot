import { EmbedBuilder } from 'discord.js';

export default {
	name: 'pause',
	description: 'Pausa a música atual',
async execute(client, message) {
	const queue = client.player.nodes.get(message.guild.id);

	if (!queue || !queue.isPlaying()) {
		const embed = new EmbedBuilder()
			.setColor('#ff0000')
			.setDescription('❌ Não há nenhuma música a tocar.');
		return await message.channel.send({ embeds: [embed] });
	}

	await queue.node.setPaused(true);

	const embed = new EmbedBuilder()
		.setColor('#5865f2')
		.setDescription('⏸️ Música pausada com sucesso!');
	await message.channel.send({ embeds: [embed] });
},
};
