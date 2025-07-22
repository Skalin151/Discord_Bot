import { EmbedBuilder } from 'discord.js';

export default {
	name: 'exit',
	description: 'Remove o bot do canal de voz e limpa a fila',
	async execute(client, message) {
		const queue = client.player.getQueue(message.guild.id);

		if (!queue) {
			const embed = new EmbedBuilder()
				.setColor('#ff0000')
				.setDescription('❌ Não há músicas na fila.');
			return await message.channel.send({ embeds: [embed] });
		}

		queue.destroy();

		const embed = new EmbedBuilder()
			.setColor('#5865f2')
			.setDescription('👋 O bot saiu do canal de voz e a fila foi limpa!');
		await message.channel.send({ embeds: [embed] });
	},
};
