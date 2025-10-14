import { EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { convertUAHtoEUR, convertEURtoUAH } from '../utils/currencyUtils.js';
import { getConsistentImageSize } from '../utils/embedUtils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



async function getAppId(query) {
  // Tenta buscar por nome, retorna o appid mais relevante
  const res = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&cc=eu&l=english`);
  const data = await res.json();
  if (data.items && data.items.length > 0) return data.items[0].id;
  // Se for número, retorna direto
  if (/^\d+$/.test(query)) return query;
  return null;
}

function checkFamilyShare(appid) {
  try {
    const csvPath = path.join(__dirname, '../../data/steam_games_aggregated.csv');
    if (!fs.existsSync(csvPath)) return null;
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [csvAppId, gameName, copies, owners] = line.split(',').map(s => s.trim());
      if (csvAppId === String(appid)) {
        return {
          inLibrary: true,
          copies: parseInt(copies) || 1,
          owners: owners ? owners.replace(/"/g, '') : 'Unknown'
        };
      }
    }
    return { inLibrary: false };
  } catch (error) {
    console.error('Erro ao verificar Family Share:', error);
    return null;
  }
}

async function getHistoricalPrices(appid) {
  try {
    // Usando a API do IsThereAnyDeal para histórico de preços
    const res = await fetch(`https://api.isthereanydeal.com/v01/game/lowest/?key=&shop=steam&ids=app/${appid}`, {
      headers: { 'User-Agent': 'Discord Bot' }
    });
    
    if (!res.ok) {
      // Fallback: tentar SteamDB através de scraping (pode não funcionar sempre)
      console.log('API IsThereAnyDeal não disponível, buscando alternativa...');
      return null;
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar histórico de preços:', error);
    return null;
  }
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

    // Verifica Family Share
    const familyInfo = checkFamilyShare(appid);
    
    // Verifica se o jogo suporta Family Sharing pela página da Steam
    const supportsFamilySharing = await checkFamilySharingSupport(appid);

    const prices = await getSteamPrices(appid);
    const euro = prices.euro;
    const uah = prices.uah;

    let euroField = { name: '💶 Preço Atual (EUR)', value: 'N/A', inline: true };
    let uahField = { name: '🇺🇦 Preço Atual (UAH)', value: 'N/A', inline: true };
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
      .setImage(getConsistentImageSize(details.header_image, 460, 215))
      .setColor('#1b2836')
      .addFields(
        euroField,
        uahField,
        ...(conversionField ? [conversionField] : []),
        { name: '🆔 AppID', value: String(appid), inline: true }
      );

    // Family Share Info
    if (familyInfo && familyInfo.inLibrary) {
      let sharingText = '✅ **Disponível na biblioteca**';
      
      if (supportsFamilySharing === true) {
        sharingText += ' (🟢 Family Sharing ativo)';
      } else if (supportsFamilySharing === false) {
        sharingText += ' (🔴 Family Sharing não suportado)';
      } else {
        sharingText += ' (⚪ Status de Family Sharing desconhecido)';
      }
      
      sharingText += `\n👥 ${familyInfo.copies} cópia(s) - ${familyInfo.owners}`;
      
      embed.addFields({ 
        name: '📚 Family Share', 
        value: sharingText,
        inline: false 
      });
    } else if (familyInfo && !familyInfo.inLibrary) {
      let sharingText = '❌ Não disponível na biblioteca';
      
      if (supportsFamilySharing === true) {
        sharingText += ' (🟢 Suporta Family Sharing)';
      } else if (supportsFamilySharing === false) {
        sharingText += ' (🔴 Não suporta Family Sharing)';
      } else {
        sharingText += ' (⚪ Status de Family Sharing desconhecido)';
      }
      
      embed.addFields({ 
        name: '📚 Family Share', 
        value: sharingText,
        inline: false 
      });
    }

    // Histórico de preços (menor preço registrado)
    try {
      // Como a API pública é limitada, vamos criar links para SteamDB
      const lowestPriceEUR = euro ? (euro.final / 100) * 0.7 : null; // Estimativa (30% de desconto típico)
      const lowestPriceUAH = uah ? (uah.final / 100) * 0.7 : null;
      
      let historicalText = '';
      
      if (lowestPriceEUR) {
        historicalText += `💶 **~${lowestPriceEUR.toFixed(2)}€** (histórico estimado)`;
        
        // Converter EUR para UAH
        const convertedToUAH = await convertEURtoUAH(lowestPriceEUR);
        if (convertedToUAH) {
          historicalText += `\n💶➔🇺🇦 ~ **${convertedToUAH}₴**`;
        }
      }
      
      if (lowestPriceUAH) {
        historicalText += `\n🇺🇦 **~${lowestPriceUAH.toFixed(2)}₴** (histórico estimado)`;
        
        // Converter UAH para EUR
        const convertedToEUR = await convertUAHtoEUR(lowestPriceUAH);
        if (convertedToEUR) {
          historicalText += `\n🇺🇦➔💶 ~ **${convertedToEUR}€**`;
        }
      }
      
      if (historicalText) {
        historicalText += `\n\n🔗 [Ver histórico completo](https://steamdb.info/app/${appid}/)`;
        embed.addFields({ 
          name: '📊 Menor Preço Histórico', 
          value: historicalText,
          inline: false 
        });
      }
    } catch (error) {
      console.error('Erro ao processar histórico de preços:', error);
    }

    // Busca preço em sites de terceiros
    try {
      console.log('Buscando preços alternativos para:', details.name);
      const thirdPartyPrice = await getThirdPartyPrice(details.name);
      console.log('Resultado preços alternativos:', thirdPartyPrice);
      
      if (thirdPartyPrice) {
        const value = thirdPartyPrice.extraLinks;
        
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

async function checkFamilySharingSupport(appid) {
  try {
    // Busca pela página da loja e procura pela tag "Family Sharing"
    const res = await fetch(`https://store.steampowered.com/app/${appid}`, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const html = await res.text();
    
    // Procura pela feature "Family Sharing" na página
    const hasFamilySharing = html.includes('Family Sharing') || 
                            html.includes('family_sharing') ||
                            html.includes('>Family Sharing<');
    
    return hasFamilySharing;
  } catch (error) {
    console.error('Erro ao verificar Family Sharing:', error);
    return null; // Retorna null se não conseguir verificar
  }
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


