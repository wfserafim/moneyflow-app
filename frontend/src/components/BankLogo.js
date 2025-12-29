import React, { useState } from 'react';

const BankLogo = ({ bank, size = 'md' }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg',
  };

  // Mapeamento de bancos para domínios (Clearbit)
  const bankDomains = {
    nubank: 'nubank.com.br',
    itau: 'itau.com.br',
    santander: 'santander.com.br',
    bradesco: 'bradesco.com.br',
    bb: 'bb.com.br',
    inter: 'bancointer.com.br',
    c6: 'c6bank.com.br',
    caixa: 'caixa.gov.br',
    picpay: 'picpay.com',
    mercadopago: 'mercadopago.com.br',
  };

  const bankStyles = {
    nubank: {
      bg: 'bg-gradient-to-br from-purple-600 to-purple-700',
      text: 'Nu',
      color: 'text-white',
      shadow: 'shadow-purple-200 dark:shadow-purple-900/50',
    },
    itau: {
      bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
      text: 'Itaú',
      color: 'text-white',
      shadow: 'shadow-orange-200 dark:shadow-orange-900/50',
    },
    santander: {
      bg: 'bg-gradient-to-br from-red-600 to-red-700',
      text: 'SAN',
      color: 'text-white',
      shadow: 'shadow-red-200 dark:shadow-red-900/50',
    },
    bradesco: {
      bg: 'bg-gradient-to-br from-red-700 to-red-800',
      text: 'BRA',
      color: 'text-white',
      shadow: 'shadow-red-200 dark:shadow-red-900/50',
    },
    bb: {
      bg: 'bg-gradient-to-br from-yellow-400 to-yellow-500',
      text: 'BB',
      color: 'text-gray-900',
      shadow: 'shadow-yellow-200 dark:shadow-yellow-900/50',
    },
    inter: {
      bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
      text: 'inter',
      color: 'text-white',
      shadow: 'shadow-orange-200 dark:shadow-orange-900/50',
    },
    c6: {
      bg: 'bg-gradient-to-br from-gray-800 to-gray-900',
      text: 'C6',
      color: 'text-white',
      shadow: 'shadow-gray-300 dark:shadow-gray-700/50',
    },
    caixa: {
      bg: 'bg-gradient-to-br from-blue-600 to-blue-700',
      text: 'CEF',
      color: 'text-white',
      shadow: 'shadow-blue-200 dark:shadow-blue-900/50',
    },
    picpay: {
      bg: 'bg-gradient-to-br from-green-500 to-green-600',
      text: 'Pic',
      color: 'text-white',
      shadow: 'shadow-green-200 dark:shadow-green-900/50',
    },
    mercadopago: {
      bg: 'bg-gradient-to-br from-blue-400 to-blue-500',
      text: 'MP',
      color: 'text-white',
      shadow: 'shadow-blue-200 dark:shadow-blue-900/50',
    },
    cash: {
      bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      text: '💵',
      color: 'text-white',
      shadow: 'shadow-emerald-200 dark:shadow-emerald-900/50',
    },
    other: {
      bg: 'bg-gradient-to-br from-gray-500 to-gray-600',
      text: '🏦',
      color: 'text-white',
      shadow: 'shadow-gray-200 dark:shadow-gray-700/50',
    },
  };

  const style = bankStyles[bank] || bankStyles.other;
  const domain = bankDomains[bank];
  const logoUrl = domain ? `https://logo.clearbit.com/${domain}` : null;

  // Tenta mostrar logo real primeiro
  if (logoUrl && !imageError) {
    return (
      <div
        className={`${sizes[size]} ${style.shadow} rounded-2xl flex items-center justify-center shadow-lg bg-white dark:bg-gray-700 p-1.5 relative overflow-hidden`}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-600 animate-pulse">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <img
          src={logoUrl}
          alt={style.text}
          className={`w-full h-full object-contain ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setImageError(true);
            setLoading(false);
          }}
        />
      </div>
    );
  }

  // Fallback: Box colorido com iniciais
  return (
    <div
      className={`${sizes[size]} ${style.bg} ${style.shadow} rounded-2xl flex items-center justify-center font-bold ${style.color} shadow-lg group relative overflow-hidden`}
    >
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200"></div>
      <span className="relative z-10">{style.text}</span>
    </div>
  );
};

export default BankLogo;
