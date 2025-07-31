// Exemplo de configuração de monstros para o minijogo de combate por turnos
// Adiciona mais monstros conforme necessário
const monsters = [
    {
        id: 1,
        nome: 'Fada Brilhante',
        hp: 30,
        frames: [
            `\u200b\n\u0060\u0060\u0060\n   .'.         .'.\n   |  \\       /  |\n   '.  \\  |  /  .'\n     '. \\|// .'\n       '-- --'\n       .'/|\'.\n      '..'|'..'\n   \u0060\u0060\u0060\n\n\`HP: {hp}\``,
            `\u200b\n\u0060\u0060\u0060\n   .'.         .'.\n   |  \\       /  |\n   '.  \\  |  /  .'\n     '. \\|// .'\n       '-- --'\n       .'/|\'.\n      '..'|'..'\n   \u200b\n   \u0060\u0060\u0060\n\n\`HP: {hp}\``
        ],
        ataques: [
            { nome: 'Pó Mágico', tipo: 'magico', dano: [5, 10] },
            { nome: 'Brilho Explosivo', tipo: 'magico', dano: [3, ], efeito: 'area' }, // Dano a todos
            { nome: 'Luz Curativa', tipo: 'defesa', cura: [8, 15] } // Novo ataque de cura
        ]
    },


{
        id: 2,
        nome: 'Aranha Gigante',
        hp: 50,
        frames: [
            // Frame padrão
            `\u200b\n\u0060\u0060\u0060\n / | \\\n\\_\\(_)/_/\n _//"\\\\_\n  /   \\\n\u0060\u0060\u0060\n\n\`HP: {hp}\``,
            // Subindo/descendo na teia (com |)
            `\u200b\n\u0060\u0060\u0060\n  |\n / | \\\n\\_\\(_)/_/\n _//"\\\\_\n  /   \\\n\u0060\u0060\u0060\n\n\`HP: {hp}\``,
            `\u200b\n\u0060\u0060\u0060\n  |\n / | \\\n\\_\\(_)/_/\n _//"\\\\_\n  /   \\\n\u0060\u0060\u0060\n\n\`HP: {hp}\``
        ],
        ataques: [
            { nome: 'Teia Pegajosa', tipo: 'especial', dano: [6, 10]},
            { nome: 'Salto Surpresa', tipo: 'fisico', dano: [12, 18]},
            { nome: 'Bolha de ácido', tipo: 'fisico', dano: [10, 15], efeito: 'area' },
        ]
    },
    {
        id: 3,
        nome: 'Fantasma Flutuante',
        hp: 40,
        frames: [
            `\u200b\n\u0060\u0060\u0060\n        ___\n      _/ ..\\\n     ( \\  0/__\n      \\    \\__)\n      /     \\ \n     /      _\\\n    \\"\"\"\"\"\`\`\n\u0060\u0060\u0060\n\n\`HP: {hp}\``,
            `\u200b\n\u0060\u0060\u0060\n        ___\n      _/ oo\\\n     ( \\  -/__\n      \\    \\__)\n      /     \\ \n     /      _\\\n    \\"\"\"\"\"\`\`\n\u0060\u0060\u0060\n\n\`HP: {hp}\``,
            `\u200b\n\u0060\u0060\u0060\n        ___\n      _/ @@\\\n     ( \\  O/__\n      \\    \\__)\n      /     \\ \n     /      _\\\n    \\"\"\"\"\"\`\`\n\u0060\u0060\u0060\n\n\`HP: {hp}\``,
            `\u200b\n\u0060\u0060\u0060\n        ___\n      _/ 66\\\n     ( \\  ^/__\n      \\    \\__)\n      /     \\ \n     /      _\\\n    \\"\"\"\"\"\`\`\n\u0060\u0060\u0060\n\n\`HP: {hp}\``,
            `\u200b\n\u0060\u0060\u0060\n        ___\n      _/  "\\\n     ( \\  ~/__\n      \\    \\__)\n      /     \\ \n     /      _\\\n    \\"\"\"\"\"\`\`\n\u0060\u0060\u0060\n\n\`HP: {hp}\``
        ],
        ataques: [
            { nome: 'Toque Etéreo', tipo: 'magico', dano: [6, 12] },
            { nome: 'Assombração', tipo: 'especial', dano: [8, 14], efeito: 'confusao' }
        ]
    },
    {
        id: 4,
        nome: 'Cavaleiro',
        hp: 70,
        frames: [
            `\u200b\n\u0060\u0060\u0060\n              /\n       ,~~   /\n   _  <=)  _/_\n  /I\\.="==.{>\n  \\I/-\\T/-'\n      /_\\\n     // \\_\n    _I    /\n\u0060\u0060\u0060\n\n\`HP: {hp}\``,
            `\u200b\n\u0060\u0060\u0060\n            |\n       ,~~  |\n   _  <=)  _|_\n  /I\\.="==.{>\n  \\I/-\\T/-'\n      /_\\\n     // \\_\n    _I    /\n\u0060\u0060\u0060\n\n\`HP: {hp}\``
        ],
        ataques: [
            { nome: 'Slash Vertical', tipo: 'fisico', dano: [5, 10] },
            { nome: 'Slash Horizontal', tipo: 'fisico', dano: [8, 12], efeito: 'area' },
            { nome: 'Luz Divina', tipo: 'defesa', cura: [10, 20] }
        ]
    },
    // Adiciona outros monstros aqui
];

export default monsters;



