// Estrutura dos códigos promocionais
// Exemplo de uso:
// {
//   code: 'BEMVINDO2025',
//   usos: 10, // máximo de usos
//   validade: '2025-12-31', // data limite (YYYY-MM-DD)
//   recompensa: { pontos: 500 }
// }

const promoCodes = [
    {
        code: 'BEMVINDO2025',
        usos: Infinity, // ilimitado
        validade: 2025-12-31, // sem data de validade
        recompensa: { pontos: 1000 }
    },
    {
        code: 'TestamentV',
        usos: Infinity, // ilimitado
        validade: null, // sem data de validade
        recompensa: { pontos: 1000 }
    },
    {
        code: 'triplecheeseburger',
        usos: Infinity, // ilimitado
        validade: null, // sem data de validade
        recompensa: { pontos: 333 }
    },
    {
        code: '151',
        usos: Infinity, // ilimitado
        validade: null, // sem data de validade
        recompensa: { pontos: 151 }
    },
    
];

export default promoCodes;
