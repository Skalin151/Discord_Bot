// Estrutura dos itens da loja
// Você pode expandir conforme necessário
const shopItems = [
    {
        id: 1,
        nome: 'Poção de Velocidade',
        preco: 100,
        descricao: 'Aumenta a velocidade do seu cavalo por 1 corrida.',
        icon: '🏇',
        quantidade: 1, // Quantidade recebida por compra
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
        nome: 'Upgrade Premium',
        preco: 1000,
        descricao: 'Desbloqueia um upgrade permanente para sua conta.',
        icon: '💎',
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
