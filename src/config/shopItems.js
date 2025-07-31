

// Estrutura dos itens da loja
const shopItems = [
    {
        id: 1,
        nome: 'Rotten Eggs',
        preco: 100,
        descricao: '[5] Emite um cheiro peculiar, talvez os monstros gostem.',
        icon: '🥚',
        quantidade: 5,
        unico: false,
        visivel: true,
        equipavel: false
    },
    {
        id: 2,
        equipavel: true,
        nome: 'Rusty Key',
        preco: 250,
        descricao: 'Uma chave velha e enferrujada, aparentemente inútil.',
        icon: '🗝️',
        quantidade: 1,
        unico: true,
        visivel: true
    },
    {
        id: 3,
        equipavel: true,
        nome: 'Monster Spawner',
        preco: 15000,
        descricao: 'Habilidade de iniciar combat encounters quando quiser, por um preço.',
        icon: '📦',
        quantidade: 1,
        unico: true,
        visivel: true
    },
    {
        id: 4,
        equipavel: true,
        nome: 'Golden Horseshow',
        preco: 10000,
        descricao: 'Podes iniciar corridas de cavalos quando quiseres.',
        icon: '🪙',
        quantidade: 1,
        unico: true,
        visivel: true
    },
    {
        id: 5,
        equipavel: true,
        nome: 'Everlasting Coupon',
        preco: 5000,
        descricao: 'Desconto 10% permanente na loja.',
        icon: '📂',
        quantidade: 1,
        unico: true,
        visivel: true
    },
    {
        id: 6,
        equipavel: true,
        nome: 'VIP Card',
        preco: 20000,
        descricao: 'Os ricos ficam mais ricos.',
        icon: '💳',
        quantidade: 1,
        unico: true,
        visivel: true
    },
    {
        id: 98,
        equipavel: true,
        nome: 'Glass Sword',
        preco: 5000,
        descricao: 'Dás o dobro do dano físico, mas também o recebes.',
        icon: '🥛',
        quantidade: 1,
        unico: true,
        visivel: false
    },
    {
        id: 99,
        equipavel: true,
        nome: 'Orb of Avarice',
        preco: 5000,
        descricao: 'Dobro do custo de spells, mas 4x o dano.',
        icon: '🔮',
        quantidade: 1,
        unico: true,
        visivel: false
    },
];

// Lista de pets, não aparecem no comando !bag
const petItems = [

    {
        id: 100,
        nome: 'Pedra',
        preco: 2000,
        descricao: 'O melhor amigo do homem.',
        icon: '🪨',
        quantidade: 1,
        unico: true,
        visivel: true
    },
    {
        id: 101,
        nome: 'Peixe',
        preco: 2000,
        descricao: 'Fih.',
        icon: '🐟',
        quantidade: 1,
        unico: true,
        visivel: true
    },
    {
        id: 102,
        nome: 'Gato Preto',
        preco: 2000,
        descricao: 'Não te deixa saír à noite.',
        icon: '🐈‍⬛',
        quantidade: 1,
        unico: true,
        visivel: true
    },
    {
        id: 103,
        nome: 'Pequeno Robô',
        preco: 2000,
        descricao: 'Usa sangue como combustível.',
        icon: '🩸',
        quantidade: 1,
        unico: true,
        visivel: true
    },
]


export default shopItems;
export {petItems};