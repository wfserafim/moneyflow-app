import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { formatBRL } from '../utils/formatters';
import AssetIcon from '../components/AssetIcon';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Stocks = () => {
  const [stocks, setStocks] = useState([]);
  const [groupedStocks, setGroupedStocks] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showGrouped, setShowGrouped] = useState(true);
  const [formData, setFormData] = useState({
    symbol: '',
    quantity: '',
    purchase_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
    asset_type: 'br_stock', // br_stock, us_stock, crypto
  });

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const [stocksRes, groupedRes] = await Promise.all([
        axios.get(`${API}/stocks`),
        axios.get(`${API}/stocks/grouped`)
      ]);
      setStocks(stocksRes.data);
      setGroupedStocks(groupedRes.data);
      
      // Fetch quotes for grouped stocks
      if (groupedRes.data.length > 0) {
        fetchAllQuotes(groupedRes.data.map(g => ({ symbol: g.symbol, asset_type: g.asset_type })));
      }
    } catch (error) {
      console.error('Erro ao buscar ações:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllQuotes = async (stockList) => {
    setQuotesLoading(true);
    const newQuotes = {};
    for (const stock of stockList) {
      try {
        const response = await axios.get(`${API}/stocks/quote/${stock.symbol}`);
        newQuotes[stock.symbol] = response.data;
      } catch (error) {
        console.error(`Erro ao buscar cotação de ${stock.symbol}:`, error);
      }
    }
    setQuotes(newQuotes);
    setQuotesLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/stocks`, {
        ...formData,
        quantity: parseFloat(formData.quantity),
        purchase_price: parseFloat(formData.purchase_price),
      });
      setShowModal(false);
      setFormData({
        symbol: '',
        quantity: '',
        purchase_price: '',
        purchase_date: new Date().toISOString().split('T')[0],
        asset_type: 'br_stock',
      });
      fetchStocks();
    } catch (error) {
      console.error('Erro ao criar ação:', error);
      alert('Erro ao adicionar ação');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente remover esta ação do portfólio?')) return;
    try {
      await axios.delete(`${API}/stocks/${id}`);
      fetchStocks();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const calculateStats = () => {
    const dataToUse = showGrouped ? groupedStocks : stocks;
    let totalInvested = 0;
    let currentValue = 0;

    dataToUse.forEach((item) => {
      if (showGrouped) {
        totalInvested += item.total_invested;
        const quote = quotes[item.symbol];
        if (quote) {
          currentValue += item.total_quantity * quote.price;
        } else {
          currentValue += item.total_invested;
        }
      } else {
        const invested = item.quantity * item.purchase_price;
        totalInvested += invested;
        const quote = quotes[item.symbol];
        if (quote) {
          currentValue += item.quantity * quote.price;
        } else {
          currentValue += invested;
        }
      }
    });

    const profit = currentValue - totalInvested;
    const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

    return { totalInvested, currentValue, profit, profitPercent };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Investimentos (Ações B3)</h1>
        <div className="flex gap-3">
          {stocks.length > 0 && (
            <>
              <button
                onClick={() => setShowGrouped(!showGrouped)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-xl hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
              >
                {showGrouped ? '📊 Agrupadas' : '📋 Individual'}
              </button>
              <button
                onClick={() => fetchAllQuotes(groupedStocks.map(g => ({ symbol: g.symbol, asset_type: g.asset_type })))}
                disabled={quotesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600"
              >
                <RefreshCw size={20} className={quotesLoading ? 'animate-spin' : ''} />
                Atualizar Cotações
              </button>
            </>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
          >
            <Plus size={20} />
            Adicionar Ação
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stocks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Investido</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {formatBRL(stats.totalInvested)}
            </h3>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Valor Atual</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {formatBRL(stats.currentValue)}
            </h3>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Lucro/Prejuízo</p>
            <h3
              className={`text-2xl font-bold ${
                stats.profit >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {stats.profit >= 0 ? '+' : ''}{formatBRL(Math.abs(stats.profit))}
            </h3>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Rentabilidade</p>
            <h3
              className={`text-2xl font-bold ${
                stats.profitPercent >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {stats.profitPercent >= 0 ? '+' : ''}
              {stats.profitPercent.toFixed(2)}%
            </h3>
          </div>
        </div>
      )}

      {/* Lista de Ações */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ativo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Preço Médio
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Cotação Atual
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Variação
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Valor Investido
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Valor Atual
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stocks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    Nenhuma ação no portfólio. Adicione sua primeira ação!
                  </td>
                </tr>
              ) : (
                stocks.map((stock) => {
                  const quote = quotes[stock.symbol];
                  const invested = stock.quantity * stock.purchase_price;
                  const current = quote ? stock.quantity * quote.price : invested;
                  const profit = current - invested;
                  const profitPercent = (profit / invested) * 100;

                  return (
                    <tr key={stock.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <AssetIcon 
                            symbol={stock.symbol} 
                            assetType={stock.asset_type || 'br_stock'} 
                            size="md" 
                          />
                          <div>
                            <div className="font-bold text-gray-900">{stock.symbol}</div>
                            <div className="text-sm text-gray-500">{stock.purchase_date}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{stock.quantity}</td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatBRL(stock.purchase_price)}
                      </td>
                      <td className="px-6 py-4">
                        {quote ? (
                          <div>
                            <div className="font-semibold text-gray-900">
                              {formatBRL(quote.price)}
                            </div>
                            {quote.note && (
                              <div className="text-xs text-gray-500">{quote.note}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-400">Carregando...</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {quote && (
                          <div
                            className={`flex items-center gap-1 ${
                              quote.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {quote.change >= 0 ? (
                              <TrendingUp size={16} />
                            ) : (
                              <TrendingDown size={16} />
                            )}
                            <span className="font-semibold">
                              {quote.change >= 0 ? '+' : ''}
                              {quote.change_percent.toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{formatBRL(invested)}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {formatBRL(current)}
                        </div>
                        <div
                          className={`text-sm ${
                            profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {profit >= 0 ? '+' : ''}{formatBRL(Math.abs(profit))} (
                          {profitPercent.toFixed(2)}%)
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(stock.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Adicionar Ação</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Ativo
                </label>
                <select
                  value={formData.asset_type}
                  onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="br_stock">🇧🇷 Ações Brasileiras (B3)</option>
                  <option value="us_stock">🇺🇸 Ações Internacionais (NYSE, NASDAQ)</option>
                  <option value="crypto">₿ Criptomoedas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.asset_type === 'br_stock' && 'Código da Ação (B3)'}
                  {formData.asset_type === 'us_stock' && 'Ticker (NYSE/NASDAQ)'}
                  {formData.asset_type === 'crypto' && 'Símbolo da Cripto'}
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) =>
                    setFormData({ ...formData, symbol: e.target.value.toUpperCase() })
                  }
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
                  placeholder={
                    formData.asset_type === 'br_stock' ? 'Ex: PETR4, VALE3, ITUB4' :
                    formData.asset_type === 'us_stock' ? 'Ex: AAPL, GOOGL, TSLA' :
                    'Ex: BTC, ETH, SOL'
                  }
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.asset_type === 'br_stock' && 'Digite o código sem o .SA'}
                  {formData.asset_type === 'us_stock' && 'Digite o ticker da ação'}
                  {formData.asset_type === 'crypto' && 'Digite a sigla da criptomoeda'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade
                </label>
                <input
                  type="number"
                  step={formData.asset_type === 'crypto' ? '0.00000001' : '1'}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço de Compra (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) =>
                    setFormData({ ...formData, purchase_price: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data da Compra
                </label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) =>
                    setFormData({ ...formData, purchase_date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stocks;
