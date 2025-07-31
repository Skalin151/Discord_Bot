// Estrutura dos itens da loja
// Você pode expandir conforme necessário
const shopItems = [
    {
        id: 1,
        nome: 'Rotten Eggs',
        preco: 100,
        descricao: '[5] Emite um cheiro peculiar, talvez os monstros gostem.',
        icon: '🥚',
        quantidade: 5, // Quantidade recebida por compra
        unico: false,   // Pode comprar várias vezes
        visivel: true
    },
    {
        id: 2,
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
        nome: 'Glass Sword',
        preco: 5000,
        descricao: '?.',
        icon: '🥛',
        quantidade: 1,
        unico: true,
        visivel: false
    },
    {
        id: 99,
        nome: 'Orb of Avarice',
        preco: 5000,
        descricao: '?.',
        icon: '🔮',
        quantidade: 1,
        unico: true,
        visivel: false
    },
];

export default shopItems;
