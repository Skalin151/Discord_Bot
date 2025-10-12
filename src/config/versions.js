// Sistema de Versões do Bot Discord THK
// Formato: MAJOR.MINOR.PATCH (Semantic Versioning)

export const CURRENT_VERSION = '2.3.1';

export const VERSION_HISTORY = [
  {
    version: '2.3.1',
    date: '2025-10-12',
    title: '🔧 Otimizações Gerais',
    type: 'patch',
    changes: [
      '🔧 Melhorias gerais de performance',
      '📱 Logs Melhorados'
    ],
    fixes: [
      '🐛 Corrigidos erros diversos',
      '🔧 Comandos de música em quarentena'
    ]
  },
  {
    version: '2.3.0',
    date: '2025-09-19',
    title: '🎮 Steam Family & Sistema de Versões',
    type: 'major', // major, minor, patch
    changes: [
      '🎮 **Steam Family Integration** - Novo comando `%steamfamily` com integração completa do script Python',
      '📊 **Filtros Interativos** - Lista de jogos com ordenação por alfabético, cópias e proprietário',
      '🔄 **Navegação por Botões** - Interface moderna com botões para navegar entre páginas e filtros',
      '📈 **Estatísticas Detalhadas** - Dashboard completo com dados da Steam Family',
      '🔍 **Sistema de Busca** - Pesquisar jogos específicos na biblioteca compartilhada',
      '🛠️ **Sistema de Versões** - Novo comando `%version` com histórico e patch notes',
      '🏠 **Suporte a Hosting** - Compatibilidade total com Render e outros serviços de hosting'
    ],
    fixes: [
      '🐛 Corrigido erro "Interaction has already been acknowledged" nos botões',
      '🔧 Melhorada gestão de interações no Discord.js',
      '📝 Otimizada edição de embeds para reduzir spam de mensagens'
    ],
    technical: [
      'Adicionado sistema de deferUpdate() para botões',
      'Implementado CSV parsing customizado para dados da Steam',
      'Criado sistema de multi-path para arquivos em diferentes ambientes',
      'Integração com child_process para execução do script Python',
      'Memory Leak no HealthMonitor corrigido'
    ]
  },
  {
    version: '2.2.1',
    date: '2025-09-15',
    title: '🔧 Otimizações Gerais',
    type: 'patch',
    changes: [
      '🔧 Melhorias gerais de performance',
      '📱 Interface mais responsiva'
    ],
    fixes: [
      '🐛 Corrigidos erros diversos',
      '🔧 Resolvidos problemas de lag'
    ]
  },
  {
    version: '2.2.0',
    date: '2025-09-10',
    title: '🐎 Sistema de Corridas Automáticas',
    type: 'minor',
    changes: [
      '🐎 **Auto Racing System** - Corridas de cavalos automáticas a cada 4 horas',
      '💰 **Economia Integrada** - Sistema de apostas e recompensas',
      '📊 **Estatísticas de Cavalos** - Tracking completo de performance',
      '🏆 **Ranking System** - Leaderboards e conquistas'
    ],
    fixes: [
      '🐛 Melhorada performance do sistema de economia',
      '🔧 Otimizado sistema de timers'
    ]
  },
  {
    version: '2.1.5',
    date: '2025-09-05',
    title: '🎮 Novos Minigames',
    type: 'patch',
    changes: [
      '🎲 Novos jogos: Blackjack, Scratch Cards',
      '🎯 Sistema de Turn-Based Combat melhorado',
      '🃏 Mais opções de entretenimento'
    ],
    fixes: [
      '🐛 Corrigidos bugs nos minigames existentes',
      '🔧 Melhorada lógica de RNG'
    ]
  },
  {
    version: '2.1.0',
    date: '2025-09-01',
    title: '💝 Sistema de Marriage Completo',
    type: 'minor',
    changes: [
      '💍 **Marriage System** - Claims, divorces e coleções completas',
      '🎨 **Character Database** - Mais de 1000+ personagens disponíveis',
      '⏰ **Cooldown System** - Sistema de timers para claims',
      '🧹 **Auto Clear** - Limpeza automática de claims expirados'
    ],
    fixes: [
      '🐛 Melhorado sistema de database MongoDB',
      '🔧 Otimizadas queries de personagens'
    ]
  },
  {
    version: '2.0.0',
    date: '2025-08-25',
    title: '🔄 Grande Refatoração',
    type: 'major',
    changes: [
      '🏗️ **Arquitetura Modular** - Sistema completamente refatorado',
      '📊 **Health Monitor** - Sistema de monitoramento em tempo real',
      '🌐 **Web Dashboard** - Interface web para status e estatísticas',
      '🔧 **Event Handlers** - Sistema de eventos melhorado',
      '📱 **Slash Commands** - Suporte completo a comandos slash'
    ],
    technical: [
      'Migração para ES6 modules',
      'Implementado sistema de handlers dinâmicos',
      'Adicionado Express server integrado',
      'Sistema de logging avançado'
    ]
  },
  {
    version: '1.5.2',
    date: '2025-08-15',
    title: '🎫 Sistema de Tickets',
    type: 'patch',
    changes: [
      '🎫 Sistema de suporte com tickets',
      '🛡️ Comandos de moderação aprimorados',
      '📝 Logs detalhados de ações'
    ]
  },
  {
    version: '1.5.0',
    date: '2025-08-10',
    title: '🎵 Sistema de Música',
    type: 'minor',
    changes: [
      '🎵 **Player de Música** - Sistema completo com YouTube',
      '🎶 Queue, skip, pause, resume e shuffle',
      '🔊 Controles de volume e qualidade',
      '📱 Interface com botões interativos'
    ]
  },
  {
    version: '1.4.0',
    date: '2025-08-01',
    title: '💰 Sistema de Economia',
    type: 'minor',
    changes: [
      '💰 **Sistema de Pontos** - Economia completa do servidor',
      '🛒 **Shop System** - Loja com itens e equipamentos',
      '👜 **Inventory** - Sistema de inventário pessoal',
      '💼 **Jobs & Daily** - Trabalhos e recompensas diárias'
    ]
  },
  {
    version: '1.3.0',
    date: '2025-07-20',
    title: '🐾 Sistema de Pets',
    type: 'minor',
    changes: [
      '🐾 **Pet System** - Adote e cuide de pets virtuais',
      '🚶 **Walk System** - Passeie com seus pets',
      '🏪 **Pet Shop** - Compre pets e acessórios'
    ]
  },
  {
    version: '1.2.0',
    date: '2025-07-10',
    title: '🎮 Jogos e Entretenimento',
    type: 'minor',
    changes: [
      '🎲 **Minigames** - Coinflip, Roll, RPS, TicTacToe',
      '🎰 **Casino Games** - Roulette, Horse Racing',
      '❓ **Would You Rather** - Sistema de perguntas'
    ]
  },
  {
    version: '1.1.0',
    date: '2025-07-01',
    title: '🔧 Comandos Utilitários',
    type: 'minor',
    changes: [
      '🧹 **Purge System** - Limpeza massiva de mensagens',
      '📊 **Server Stats** - Estatísticas detalhadas do servidor',
      '⏰ **Uptime Tracking** - Monitoramento de tempo online'
    ]
  },
  {
    version: '1.0.0',
    date: '2025-06-15',
    title: '🚀 Lançamento Inicial',
    type: 'major',
    changes: [
      '🤖 **Bot Base** - Estrutura inicial do Discord Bot',
      '💬 **Comandos Básicos** - Help, ping e comandos essenciais',
      '🗄️ **MongoDB** - Integração com banco de dados',
      '📱 **Discord.js v14** - Framework moderno para Discord'
    ]
  }
];

// Função utilitária para obter versão por número
export function getVersionByNumber(versionNumber) {
  return VERSION_HISTORY.find(v => v.version === versionNumber);
}

// Função para obter versão atual
export function getCurrentVersion() {
  return getVersionByNumber(CURRENT_VERSION);
}

// Função para obter total de versões
export function getTotalVersions() {
  return VERSION_HISTORY.length;
}

// Função para obter versões por tipo
export function getVersionsByType(type) {
  return VERSION_HISTORY.filter(v => v.type === type);
}

// Função para obter próxima/anterior versão
export function getAdjacentVersion(currentVersion, direction = 'next') {
  const currentIndex = VERSION_HISTORY.findIndex(v => v.version === currentVersion);
  
  if (currentIndex === -1) return null;
  
  if (direction === 'next') {
    return currentIndex > 0 ? VERSION_HISTORY[currentIndex - 1] : null;
  } else {
    return currentIndex < VERSION_HISTORY.length - 1 ? VERSION_HISTORY[currentIndex + 1] : null;
  }
}

export default {
  CURRENT_VERSION,
  VERSION_HISTORY,
  getVersionByNumber,
  getCurrentVersion,
  getTotalVersions,
  getVersionsByType,
  getAdjacentVersion
};