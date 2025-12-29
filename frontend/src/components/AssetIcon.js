import React, { useState } from 'react';

// Mapeamento completo de tickers para logos
const getLogoUrl = (symbol, assetType) => {
  // Para ações brasileiras - usar logo.clearbit.com com domínios corretos
  const brDomains = {
    'PETR4': 'petrobras.com.br',
    'PETR3': 'petrobras.com.br',
    'VALE3': 'vale.com',
    'ITUB4': 'itau.com.br',
    'BBDC4': 'bradesco.com.br',
    'BBDC3': 'bradesco.com.br',
    'ABEV3': 'ambev.com.br',
    'MGLU3': 'magazineluiza.com.br',
    'WEGE3': 'weg.net',
    'RENT3': 'localiza.com',
    'B3SA3': 'b3.com.br',
    'SUZB3': 'suzano.com.br',
    'EMBR3': 'embraer.com',
    'GGBR4': 'gerdau.com',
    'CSNA3': 'csn.com.br',
    'AZUL4': 'voeazul.com.br',
    'GOLL4': 'voegol.com.br',
    'CIEL3': 'cielo.com.br',
    'BRFS3': 'brf-global.com',
    'JBSS3': 'jbs.com.br',
  };

  // Para ações americanas
  const usDomains = {
    'AAPL': 'apple.com',
    'GOOGL': 'google.com',
    'GOOG': 'google.com',
    'MSFT': 'microsoft.com',
    'AMZN': 'amazon.com',
    'TSLA': 'tesla.com',
    'META': 'meta.com',
    'NVDA': 'nvidia.com',
    'NFLX': 'netflix.com',
    'AMD': 'amd.com',
    'INTC': 'intel.com',
    'PYPL': 'paypal.com',
    'ADBE': 'adobe.com',
    'CRM': 'salesforce.com',
    'ORCL': 'oracle.com',
    'IBM': 'ibm.com',
    'DIS': 'disney.com',
    'NKE': 'nike.com',
    'MCD': 'mcdonalds.com',
    'SBUX': 'starbucks.com',
    'KO': 'coca-cola.com',
    'PEP': 'pepsi.com',
    'WMT': 'walmart.com',
  };

  // Logos de criptomoedas (CoinGecko)
  const cryptoLogos = {
    'BTC': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    'USDT': 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    'BNB': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    'XRP': 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    'ADA': 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
    'DOGE': 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
    'DOT': 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
    'MATIC': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  };

  if (assetType === 'crypto' && cryptoLogos[symbol]) {
    return cryptoLogos[symbol];
  }

  const domain = assetType === 'us_stock' ? usDomains[symbol] : brDomains[symbol];
  if (domain) {
    return `https://logo.clearbit.com/${domain}`;
  }

  return null;
};

// Cores e estilos por tipo
const getAssetStyle = (assetType) => {
  const styles = {
    br_stock: {
      bg: 'from-green-600 to-green-700',
      text: '🇧🇷',
      shadow: 'shadow-green-200 dark:shadow-green-900/50',
    },
    us_stock: {
      bg: 'from-blue-600 to-blue-700',
      text: '🇺🇸',
      shadow: 'shadow-blue-200 dark:shadow-blue-900/50',
    },
    crypto: {
      bg: 'from-purple-600 to-purple-700',
      text: '₿',
      shadow: 'shadow-purple-200 dark:shadow-purple-900/50',
    },
  };
  return styles[assetType] || styles.br_stock;
};

const AssetIcon = ({ symbol, assetType = 'br_stock', size = 'md' }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg',
  };

  const logoUrl = getLogoUrl(symbol, assetType);
  const style = getAssetStyle(assetType);

  // Se tem logo e não deu erro
  if (logoUrl && !imageError) {
    return (
      <div className={`${sizes[size]} rounded-2xl shadow-lg flex items-center justify-center overflow-hidden bg-white dark:bg-gray-700 p-1.5 relative`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-600 animate-pulse">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <img 
          src={logoUrl}
          alt={symbol}
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

  // Fallback: Box com iniciais
  const initials = symbol.slice(0, Math.min(4, symbol.length));

  return (
    <div
      className={`${sizes[size]} bg-gradient-to-br ${style.bg} rounded-2xl flex flex-col items-center justify-center font-bold text-white shadow-lg ${style.shadow} relative overflow-hidden group`}
      title={symbol}
    >
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200"></div>
      <span className="relative z-10 text-sm font-black tracking-tight">{initials}</span>
      <span className="relative z-10 text-[9px] opacity-70 mt-0.5">{style.text}</span>
    </div>
  );
};

export default AssetIcon;
