import { EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { convertUAHtoEUR } from '../utils/currencyUtils.js';



async function getAppId(query) {
  // Tenta buscar por nome, retorna o appid mais relevante
  const res = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&cc=eu&l=english`);
  const data = await res.json();
  if (data.items && data.items.length > 0) return data.items[0].id;
  // Se for número, retorna direto
  if (/^\d+$/.test(query)) return query;
  return null;
}


export default {
  name: 'steam',
  description: 'Mostra informações de um jogo da Steam, incluindo preços em euro e hryvnia (UAH)',
  usage: '%steam <nome do jogo | appid>',
  async execute(client, message, args) {
    if (!args.length) return await message.channel.send('❌ Use: !steam <nome do jogo | appid>');
    const query = args.join(' ');
    const appid = await getAppId(query);
    if (!appid) return await message.channel.send('❌ Jogo não encontrado!');

    const details = await getGameDetails(appid);
    if (!details) return await message.channel.send('❌ Não foi possível obter detalhes do jogo.');

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
      // Conversão para euro
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

    // Busca preço em sites de terceiros
    try {
      console.log('Buscando preços alternativos para:', details.name);
      const thirdPartyPrice = await getThirdPartyPrice(details.name);
      console.log('Resultado preços alternativos:', thirdPartyPrice);
      
      if (thirdPartyPrice) {
        const value = thirdPartyPrice.extraLinks 
        
        embed.addFields({ 
          name: '🛒 Comparação de Preços', 
          value: value,
          inline: false 
        });
      }
    } catch (error) {
      console.error('Erro ao buscar preços alternativos:', error);
    }

    if (!euro && !uah) {
      embed.addFields({ name: 'ℹ️ Observação', value: 'Preços não encontrados. O jogo pode não estar disponível nessas regiões ou a Steam pode estar bloqueando a consulta.' });
    }

    await message.channel.send({ embeds: [embed] });
  }
};


async function getGameDetails(appid, cc = 'eu') {
  const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${cc}&l=english`);
  const data = await res.json();
  return data[appid]?.data || null;
}

async function getSteamPrices(appid) {
  // Busca preço em euro (cc=eu) e hryvnia (cc=ua)
  const [euData, uaData] = await Promise.all([
    getGameDetails(appid, 'eu'),
    getGameDetails(appid, 'ua')
  ]);
  const euro = euData?.price_overview || null;
  const uah = uaData?.price_overview || null;
  return { euro, uah };
}

async function getThirdPartyPrice(gameName) {
  try {
    console.log('Criando links de comparação para:', gameName);
    
    // Lista de sites de comparação populares
    const comparisonSites = [
      {
        name: 'IsThereAnyDeal',
        url: `https://isthereanydeal.com/search/?q=${encodeURIComponent(gameName)}`
      },
      {
        name: 'AllKeyShop',
        url: `https://www.allkeyshop.com/blog/catalogue/search-${encodeURIComponent(gameName.replace(/\s+/g, '-'))}/`
      },
      {
        name: 'GG.deals',
        url: `https://gg.deals/games/?title=${encodeURIComponent(gameName)}`
      }
    ];
    
    // Retorna o primeiro site como principal e lista os outros
    const mainSite = comparisonSites[0];
    const otherSites = comparisonSites.slice(1).map(site => `[${site.name}](${site.url})`).join(' • ');
    
    return {
      price: 'Comparar',
      store: mainSite.name,
      url: mainSite.url,
      extraLinks: otherSites
    };
    
  } catch (error) {
    console.error('Erro ao criar links de comparação:', error);
    
    // Fallback básico
    return {
      price: 'Buscar',
      store: 'Sites de Comparação',
      url: `https://www.google.com/search?q=${encodeURIComponent(gameName + ' price comparison steam key')}`
    };
  }
}


