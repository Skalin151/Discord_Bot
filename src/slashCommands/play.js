import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { QueryType } from 'discord-player';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Toca músicas ou playlists do YouTube')
  .addSubcommand(subcommand =>
    subcommand
      .setName('search')
      .setDescription('Procura uma música e toca')
      .addStringOption(option =>
        option.setName('searchterms').setDescription('Palavras-chave de busca').setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('playlist')
      .setDescription('Toca uma playlist do YouTube')
      .addStringOption(option => option.setName('url').setDescription('URL da playlist').setRequired(true))
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('song')
      .setDescription('Toca uma música do YouTube')
      .addStringOption(option => option.setName('url').setDescription('URL da música').setRequired(true))
  );

export async function execute(interaction) {
  if (!interaction.member.voice.channel) return interaction.reply('❌ Você precisa estar em um canal de voz para tocar música!');

  const queue = await interaction.client.player.createQueue(interaction.guild);
  if (!queue.connection) await queue.connect(interaction.member.voice.channel);

  const embed = new EmbedBuilder();

  if (interaction.options.getSubcommand() === 'song') {
    const url = interaction.options.getString('url');
    const result = await interaction.client.player.search(url, {
      requestedBy: interaction.user,
      searchEngine: QueryType.YOUTUBE_VIDEO
    });
    if (result.tracks.length === 0)
      return interaction.reply('❌ Nenhum resultado encontrado!');
    const song = result.tracks[0];
    await queue.addTrack(song);
    embed.setDescription(`🎵 **[${song.title}](${song.url})** foi adicionada à fila!`)
      .setThumbnail(song.thumbnail)
      .setFooter({ text: `Duração: ${song.duration}` });
  } else if (interaction.options.getSubcommand() === 'playlist') {
    const url = interaction.options.getString('url');
    const result = await interaction.client.player.search(url, {
      requestedBy: interaction.user,
      searchEngine: QueryType.YOUTUBE_PLAYLIST
    });
    if (result.tracks.length === 0)
      return interaction.reply('❌ Nenhuma playlist encontrada!');
    const playlist = result.playlist;
    await queue.addTracks(result.tracks);
    embed.setDescription(`📃 **${result.tracks.length} músicas da playlist [${playlist.title}](${playlist.url})** foram adicionadas à fila!`)
      .setThumbnail(playlist.thumbnail);
  } else if (interaction.options.getSubcommand() === 'search') {
    const searchterms = interaction.options.getString('searchterms');
    const result = await interaction.client.player.search(searchterms, {
      requestedBy: interaction.user,
      searchEngine: QueryType.AUTO
    });
    if (result.tracks.length === 0)
      return interaction.reply('❌ Nenhum resultado encontrado!');
    const song = result.tracks[0];
    await queue.addTrack(song);
    embed.setDescription(`🔎 **[${song.title}](${song.url})** foi adicionada à fila!`)
      .setThumbnail(song.thumbnail)
      .setFooter({ text: `Duração: ${song.duration}` });
  }

  if (!queue.playing) await queue.play();
  await interaction.reply({ embeds: [embed] });
}
