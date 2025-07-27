// src/config/horseConfig.js
// Centraliza dados de cavalos, tipos, clima, eventos extremos, pistas e mensagens temáticas

const horselist = [
    { horseId: 1, name: 'Thunder Bolt', emoji: '⚡', odds: 2.5 },
    { horseId: 2, name: 'Earth Mover', emoji: '🪨', odds: 3.2 },
    { horseId: 3, name: 'Fire Storm', emoji: '🔥', odds: 2.8 },
    { horseId: 4, name: 'Wind Waker', emoji: '💨', odds: 4.1 },
    { horseId: 5, name: 'Shadow Dash', emoji: '🌙', odds: 3.7 },
    { horseId: 6, name: 'Golden Wind', emoji: '⭐', odds: 5.2 },
    { horseId: 7, name: 'Silver Arrow', emoji: '🏹', odds: 3.9 },
    { horseId: 8, name: 'Blizzard Mane', emoji: '❄️', odds: 4.5 },
    { horseId: 9, name: 'Emerald Runner', emoji: '💚', odds: 4.8 },
    { horseId: 10, name: 'Ruby Flash', emoji: '❤️', odds: 3.6 },
    { horseId: 11, name: 'Sonic Boom', emoji: '💥', odds: 4.3 },
    { horseId: 12, name: 'Ocean Wave', emoji: '🌊', odds: 3.4 },
    { horseId: 13, name: 'Lightning Strike', emoji: '⚡️', odds: 4.9 },
    { horseId: 14, name: 'Crystal Hoof', emoji: '🔮', odds: 5.0 },
    { horseId: 15, name: 'Bronze Blaze', emoji: '🐤', odds: 3.8 }
];

const horsetypes = {
    1: { type: 'velocista', traits: ['rápido', 'sensível'] },
    2: { type: 'resistente', traits: ['forte', 'durável'] },
    3: { type: 'elite', traits: ['versátil', 'caro'] },
    4: { type: 'aerodinâmico', traits: ['leve', 'ágil'] },
    5: { type: 'misterioso', traits: ['imprevisível'] },
    6: { type: 'equilibrado', traits: ['consistente'] },
    7: { type: 'velocista', traits: ['rápido', 'sensível'] },
    8: { type: 'resistente', traits: ['forte', 'durável'] },
    9: { type: 'elite', traits: ['versátil', 'caro'] },
    10: { type: 'equilibrado', traits: ['consistente'] },
    11: { type: 'velocista', traits: ['rápido', 'sensível'] },
    12: { type: 'aerodinâmico', traits: ['leve', 'ágil'] },
    13: { type: 'elite', traits: ['versátil', 'caro'] },
    14: { type: 'misterioso', traits: ['imprevisível'] },
    15: { type: 'resistente', traits: ['forte', 'durável'] }
};

const extremeWeatherEvents = [
    { name: "TORNADO", emoji: "🌪️", description: "Um tornado embaralha as posições!", frequency: 0.5, effect: "shuffle" },
    { name: "RAIO", emoji: "⚡", description: "Um raio dá super velocidade a um cavalo!", frequency: 0.3, effect: "boost_random" },
    { name: "ARCO-ÍRIS", emoji: "🌈", description: "Sorte para todos! Bónus especial!", frequency: 0.2, effect: "everyone_wins" },
    { name: "ERUPÇÃO VULCÂNICA", emoji: "🌋", description: "Cinzas cobrem a pista, todos ficam mais lentos!", frequency: 0.15, effect: "slow_all" },
    { name: "GRANIZO", emoji: "🧊", description: "Granizo atinge um cavalo, ele perde velocidade!", frequency: 0.18, effect: "slow_random" },
    { name: "NEVOEIRO", emoji: "🌫️", description: "Nevoeiro denso, todos perdem estabilidade!", frequency: 0.12, effect: "unstable_all" },
    { name: "INUNDAÇÃO", emoji: "💧", description: "Água invade a pista, todos avançam menos!", frequency: 0.14, effect: "retreat_all" }
];

const weatherConditions = [
    {
        name: 'Ensolarado',
        emoji: '☀️',
        description: 'Pista seca, condições ideais',
        frequency: 40,
        effects: {
            global: { speedMod: 1.0, stability: 1.0 },
            velocista: { speedMod: 1.0, oddsMod: 0 },
            equilibrado: { speedMod: 1.0, oddsMod: 0 },
            resistente: { speedMod: 1.0, oddsMod: 0 },
            aerodinâmico: { speedMod: 1.0, oddsMod: 0 },
            misterioso: { speedMod: 1.0, oddsMod: 0 },
            elite: { speedMod: 1.0, oddsMod: 0 }
        }
    },
    {
        name: 'Chuva',
        emoji: '🌧️',
        description: 'Pista molhada, cavalos resistentes favorecidos',
        frequency: 25,
        effects: {
            global: { speedMod: 0.85, stability: 0.8 },
            velocista: { speedMod: 0.9, oddsMod: 0.3 },
            equilibrado: { speedMod: 0.95, oddsMod: 0.1 },
            resistente: { speedMod: 1.2, oddsMod: -0.5 },
            aerodinâmico: { speedMod: 0.92, oddsMod: 0.2 },
            misterioso: { speedMod: 1.1, oddsMod: -0.2 },
            elite: { speedMod: 1.05, oddsMod: -0.1 }
        }
    },
    {
        name: 'Vento Forte',
        emoji: '🌪️',
        description: 'Ventos fortes, maior imprevisibilidade',
        frequency: 15,
        effects: {
            global: { speedMod: 1.0, stability: 0.6 },
            velocista: { speedMod: 0.95, oddsMod: 0.2 },
            equilibrado: { speedMod: 1.0, oddsMod: 0.1 },
            resistente: { speedMod: 0.98, oddsMod: 0.1 },
            aerodinâmico: { speedMod: 1.15, oddsMod: -0.3 },
            misterioso: { speedMod: 1.05, oddsMod: -0.1 },
            elite: { speedMod: 1.02, oddsMod: 0 }
        }
    },
    {
        name: 'Frio',
        emoji: '❄️',
        description: 'Temperatura baixa, arranque mais lento',
        frequency: 10,
        effects: {
            global: { speedMod: 0.9, stability: 0.9 },
            velocista: { speedMod: 0.85, oddsMod: 0.4 },
            equilibrado: { speedMod: 0.95, oddsMod: 0.1 },
            resistente: { speedMod: 1.25, oddsMod: -0.7 },
            aerodinâmico: { speedMod: 0.88, oddsMod: 0.3 },
            misterioso: { speedMod: 1.0, oddsMod: 0 },
            elite: { speedMod: 1.1, oddsMod: -0.2 }
        }
    },
    {
        name: 'Calor Extremo',
        emoji: '🔥',
        description: 'Muito quente, cavalos cansam mais rápido',
        frequency: 10,
        effects: {
            global: { speedMod: 0.95, stability: 0.85 },
            velocista: { speedMod: 0.8, oddsMod: 0.5 },
            equilibrado: { speedMod: 0.95, oddsMod: 0.1 },
            resistente: { speedMod: 1.15, oddsMod: -0.4 },
            aerodinâmico: { speedMod: 0.9, oddsMod: 0.2 },
            misterioso: { speedMod: 1.05, oddsMod: -0.1 },
            elite: { speedMod: 1.08, oddsMod: -0.15 }
        }
    }
];

const trackOptions = [
    { name: 'Short Race', length: 50 },
    { name: 'Medium Race', length: 75 },
    { name: 'Long Race', length: 100 },
    { name: 'Marathon', length: 150 },
    { name: 'Steel Ball Run', length: 300 }
];

const weatherMessages = {
    'Ensolarado': [
        "☀️ Que dia perfeito para corridas!",
        "☀️ O sol brilha sobre a pista!",
        "☀️ Condições ideais para os cavalos!"
    ],
    'Chuva': [
        "🌧️ A chuva está a dificultar a corrida!",
        "🌧️ Os cavalos resistentes estão a destacar-se!",
        "🌧️ Cuidado com a lama na pista!"
    ],
    'Vento Forte': [
        "🌪️ O vento está a baralhar tudo!",
        "🌪️ Rajadas fortes afetam os cavalos!",
        "🌪️ Os cavalos aerodinâmicos têm vantagem!"
    ],
    'Frio': [
        "❄️ Brrr! Os cavalos estão com frio!",
        "❄️ O frio torna o arranque mais difícil!",
        "❄️ Cavalos resistentes não se importam!"
    ],
    'Calor Extremo': [
        "🔥 Que calor! Os cavalos estão a suar!",
        "🔥 O calor está a cansar os velocistas!",
        "🔥 Cavalos resistentes aguentam melhor!"
    ]
};

export { horselist, horsetypes, extremeWeatherEvents, weatherConditions, trackOptions, weatherMessages };
