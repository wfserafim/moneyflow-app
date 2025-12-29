// Ícones dos principais bancos brasileiros
export const bankIcons = {
  nubank: {
    name: 'Nubank',
    color: '#820AD1',
    emoji: '💜',
    gradient: 'from-purple-600 to-purple-700'
  },
  itau: {
    name: 'Itaú',
    color: '#EC7000',
    emoji: '🟠',
    gradient: 'from-orange-500 to-orange-600'
  },
  santander: {
    name: 'Santander',
    color: '#EC0000',
    emoji: '🔴',
    gradient: 'from-red-600 to-red-700'
  },
  bradesco: {
    name: 'Bradesco',
    color: '#CC092F',
    emoji: '🔴',
    gradient: 'from-red-700 to-red-800'
  },
  bb: {
    name: 'Banco do Brasil',
    color: '#FFF200',
    emoji: '💛',
    gradient: 'from-yellow-400 to-yellow-500'
  },
  inter: {
    name: 'Inter',
    color: '#FF7A00',
    emoji: '🧡',
    gradient: 'from-orange-500 to-orange-600'
  },
  c6: {
    name: 'C6 Bank',
    color: '#000000',
    emoji: '⚫',
    gradient: 'from-gray-800 to-gray-900'
  },
  caixa: {
    name: 'Caixa',
    color: '#0066A1',
    emoji: '🔵',
    gradient: 'from-blue-600 to-blue-700'
  },
  picpay: {
    name: 'PicPay',
    color: '#21C25E',
    emoji: '💚',
    gradient: 'from-green-500 to-green-600'
  },
  mercadopago: {
    name: 'Mercado Pago',
    color: '#00AAFF',
    emoji: '💙',
    gradient: 'from-blue-400 to-blue-500'
  },
  cash: {
    name: 'Dinheiro',
    color: '#10B981',
    emoji: '💵',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  other: {
    name: 'Outro',
    color: '#6B7280',
    emoji: '🏦',
    gradient: 'from-gray-500 to-gray-600'
  }
};

export const getBankIcon = (bankKey) => {
  return bankIcons[bankKey] || bankIcons.other;
};
