import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { convertUAHtoEUR } from '../utils/currencyUtils.js';

async function getAppId(query) {
  const res = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&cc=eu&l=english`);
  const data = await res.json();
  if (data.items && data.items.length > 0) return data.items[0].id;
  if (/^\d+$/.test(query)) return query;
  return null;
}

async function getGameDetails(appid, cc = 'eu') {
  const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${cc}&l=english`);
  const data = await res.json();
  return data[appid]?.data || null;
}

async function getSteamPrices(appid) {
  const [euData, uaData] = await Promise.all([
    getGameDetails(appid, 'eu'),
    getGameDetails(appid, 'ua')
  ]);
  const euro = euData?.price_overview || null;
  const uah = uaData?.price_overview || null;
  return { euro, uah };
}

const steamSlashCommand = {
  data: new SlashCommandBuilder()
    .setName('steam')
    .setDescription('Mostra informações de um jogo da Steam, incluindo preços em euro e hryvnia (UAH)')
    .addStringOption(option =>
      option.setName('jogo')
        .setDescription('Nome do jogo ou AppID')
        .setRequired(true)
    ),
  async execute(interaction) {
  const query = interaction.options.getString('jogo');
  await interaction.deferReply();
  const appid = await getAppId(query);
  if (!appid) return interaction.editReply('❌ Jogo não encontrado!');

  const details = await getGameDetails(appid);
  if (!details) return interaction.editReply('❌ Não foi possível obter detalhes do jogo.');

  const prices = await getSteamPrices(appid);
  const euro = prices.euro;
  const uah = prices.uah;

  let euroField = { name: '💶 Preço (EUR)', value: 'N/A', inline: true };
  let uahField = { name: '🇺🇦 Preço (UAH)', value: 'N/A', inline: true };
  let conversionField = null;

  if (euro) {
    euroField.value = euro.discount_percent > 0
      ? `~~${(euro.initial / 100).toFixed(2)}€~~ **${(euro.final / 100).toFixed(2)}€** (${euro.discount_percent}% OFF)`
      : `${(euro.final / 100).toFixed(2)}€`;
  }
  if (uah) {
    uahField.value = uah.discount_percent > 0
      ? `~~${(uah.initial / 100).toFixed(2)}₴~~ **${(uah.final / 100).toFixed(2)}₴** (${uah.discount_percent}% OFF)`
      : `${(uah.final / 100).toFixed(2)}₴`;
    let converted = await convertUAHtoEUR(uah.final / 100);
    if (converted && !isNaN(Number(converted))) {
      conversionField = { name: '🇺🇦➔💶 UAH para EUR', value: `~ **${converted}€**`, inline: true };
    } else {
      conversionField = { name: '🇺🇦➔💶 UAH para EUR', value: 'Não foi possível converter.', inline: true };
    }
  }

  const embed = new EmbedBuilder()
    .setTitle(`${details.name}`)
    .setURL(`https://store.steampowered.com/app/${appid}`)
    .setDescription(details.short_description || 'Sem descrição.')
    .setImage(details.header_image)
    .setColor('#1b2836')
    .addFields(
      euroField,
      uahField,
      ...(conversionField ? [conversionField] : []),
      { name: '🆔 AppID', value: String(appid), inline: true }
    );

  if (!euro && !uah) {
    embed.addFields({ name: 'ℹ️ Observação', value: 'Preços não encontrados. O jogo pode não estar disponível nessas regiões ou a Steam pode estar bloqueando a consulta.' });
  }

    await interaction.editReply({ embeds: [embed] });
  }
};

export { steamSlashCommand };
