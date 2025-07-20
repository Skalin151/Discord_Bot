import { QueryType } from 'discord-player';

export const name = 'play';
export const description = 'Toca músicas ou playlists do YouTube';
export const usage = '!play <url|palavras-chave>';

export async function execute(message, args) {
  if (!message.member.voice.channel) return message.reply('❌ Você precisa estar em um canal de voz para tocar música!');

  const queue = await message.client.player.createQueue(message.guild);
  if (!queue.connection) await queue.connect(message.member.voice.channel);

  let tipo = 'search';
  let termo = args.join(' ');
  if (args[0] && args[0].startsWith('https://')) {
    if (args[0].includes('list=')) tipo = 'playlist';
    else tipo = 'song';
    termo = args[0];
  }

  let embed = {
    color: 0x1DB954,
    description: '',
    thumbnail: { url: '' },
    footer: { text: '' }
  };

  if (tipo === 'song') {
    const result = await message.client.player.search(termo, {
      requestedBy: message.author,
      searchEngine: QueryType.YOUTUBE_VIDEO
    });
    if (result.tracks.length === 0)
      return message.reply('❌ Nenhum resultado encontrado!');
    const song = result.tracks[0];
    await queue.addTrack(song);
    embed.description = `🎵 **[${song.title}](${song.url})** foi adicionada à fila!`;
    embed.thumbnail.url = song.thumbnail;
    embed.footer.text = `Duração: ${song.duration}`;
  } else if (tipo === 'playlist') {
    const result = await message.client.player.search(termo, {
      requestedBy: message.author,
      searchEngine: QueryType.YOUTUBE_PLAYLIST
    });
    if (result.tracks.length === 0)
      return message.reply('❌ Nenhuma playlist encontrada!');
    const playlist = result.playlist;
    await queue.addTracks(result.tracks);
    embed.description = `📃 **${result.tracks.length} músicas da playlist [${playlist.title}](${playlist.url})** foram adicionadas à fila!`;
    embed.thumbnail.url = playlist.thumbnail;
  } else {
    const result = await message.client.player.search(termo, {
      requestedBy: message.author,
      searchEngine: QueryType.AUTO
    });
    if (result.tracks.length === 0)
      return message.reply('❌ Nenhum resultado encontrado!');
    const song = result.tracks[0];
    await queue.addTrack(song);
    embed.description = `🔎 **[${song.title}](${song.url})** foi adicionada à fila!`;
    embed.thumbnail.url = song.thumbnail;
    embed.footer.text = `Duração: ${song.duration}`;
  }

  if (!queue.playing) await queue.play();
  await message.channel.send({ embeds: [embed] });
}
