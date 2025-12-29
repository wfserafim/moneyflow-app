import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowUp, ArrowDown, Wallet, TrendingUp, TrendingDown, DollarSign, Eye, EyeOff } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatBRL } from '../utils/formatters';
import AssetIcon from '../components/AssetIcon';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [hideValues, setHideValues] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, stocksRes] = await Promise.all([
        axios.get(`${API}/dashboard/summary`),
        axios.get(`${API}/stocks`),
      ]);
      setSummary(summaryRes.data);
      setStocks(stocksRes.data);
      
      // Fetch quotes for top 3 stocks
      if (stocksRes.data.length > 0) {
        const top3 = stocksRes.data.slice(0, 3);
        const newQuotes = {};
        for (const stock of top3) {
          try {
            const res = await axios.get(`${API}/stocks/quote/${stock.symbol}?asset_type=${stock.asset_type || 'br_stock'}`);
            newQuotes[stock.symbol] = res.data;
          } catch (error) {
            console.error(`Erro ao buscar ${stock.symbol}:`, error);
          }
        }
        setQuotes(newQuotes);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateInvestmentsTotal = () => {
    let totalInvested = 0;
    let currentValue = 0;

    stocks.forEach((stock) => {
      const invested = stock.quantity * stock.purchase_price;
      totalInvested += invested;

      const quote = quotes[stock.symbol];
      if (quote) {
        currentValue += stock.quantity * quote.price;
      } else {
        currentValue += invested;
      }
    });

    const profit = currentValue - totalInvested;
    const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

    return { totalInvested, currentValue, profit, profitPercent };
  };

  const investments = calculateInvestmentsTotal();

  const chartData = summary?.expense_by_category
    ? Object.entries(summary.expense_by_category).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const formatValue = (value) => {
    if (hideValues) return 'R$ ••••••';
    return formatBRL(value || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">
              Olá! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg">Aqui está um resumo das suas finanças</p>
          </div>
          <button
            onClick={() => setHideValues(!hideValues)}
            className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-gray-100 dark:border-gray-700 self-start md:self-auto"
          >
            {hideValues ? <Eye size={24} className="text-gray-600 dark:text-gray-300" /> : <EyeOff size={24} className="text-gray-600 dark:text-gray-300" />}
          </button>
        </div>

        {/* Main Balance Card - Super Premium */}
        <div className="bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-3xl p-6 md:p-10 text-white shadow-2xl relative overflow-hidden mb-6 md:mb-8">
          <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-white/10 rounded-full -mr-32 md:-mr-48 -mt-32 md:-mt-48"></div>
          <div className="absolute bottom-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-white/10 rounded-full -ml-24 md:-ml-32 -mb-24 md:-mb-32"></div>
          
          <div className="relative z-10">
            <p className="text-white/80 text-xs md:text-sm font-semibold mb-2 md:mb-3 uppercase tracking-wide">💰 Patrimônio Total</p>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 md:mb-8">
              {formatValue(summary?.balance + investments.currentValue)}
            </h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4">
                <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                  <ArrowUp size={14} className="md:w-4 md:h-4" />
                  <p className="text-[10px] md:text-xs font-semibold opacity-90">Receitas</p>
                </div>
                <p className="text-base md:text-xl lg:text-2xl font-bold">{formatValue(summary?.total_income)}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDown size={16} />
                  <p className="text-xs font-semibold opacity-90">Despesas</p>
                </div>
                <p className="text-xl md:text-2xl font-bold">{formatValue(summary?.total_expense)}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={16} />
                  <p className="text-xs font-semibold opacity-90">Saldo</p>
                </div>
                <p className="text-xl md:text-2xl font-bold">{formatValue(summary?.balance)}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} />
                  <p className="text-xs font-semibold opacity-90">Investimentos</p>
                </div>
                <p className="text-xl md:text-2xl font-bold">{formatValue(investments.currentValue)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investimentos Section - Premium Style */}
      {stocks.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">Meus Investimentos</h2>
            <a
              href="/stocks"
              className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl md:rounded-2xl hover:shadow-xl hover:scale-105 transition-all font-semibold text-sm md:text-base text-center"
            >
              Ver Todos
            </a>
          </div>

          {/* Investment Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <DollarSign className="text-blue-600" size={24} />
                </div>
                <p className="text-sm text-gray-600 font-semibold">Total Investido</p>
              </div>
              <p className="text-3xl font-black text-gray-900">{formatValue(investments.totalInvested)}</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="text-emerald-600" size={24} />
                </div>
                <p className="text-sm text-gray-600 font-semibold">Valor Atual</p>
              </div>
              <p className="text-3xl font-black text-gray-900">{formatValue(investments.currentValue)}</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  investments.profit >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {investments.profit >= 0 ? (
                    <TrendingUp className="text-green-600" size={24} />
                  ) : (
                    <TrendingDown className="text-red-600" size={24} />
                  )}
                </div>
                <p className="text-sm text-gray-600 font-semibold">Lucro/Prejuízo</p>
              </div>
              <p className={`text-3xl font-black ${
                investments.profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {investments.profit >= 0 ? '+' : ''}{formatValue(Math.abs(investments.profit))}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  investments.profitPercent >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <TrendingUp className={investments.profitPercent >= 0 ? 'text-green-600' : 'text-red-600'} size={24} />
                </div>
                <p className="text-sm text-gray-600 font-semibold">Rentabilidade</p>
              </div>
              <p className={`text-3xl font-black ${
                investments.profitPercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {investments.profitPercent >= 0 ? '+' : ''}{investments.profitPercent.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Top Investments */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stocks.slice(0, 3).map((stock) => {
              const quote = quotes[stock.symbol];
              const invested = stock.quantity * stock.purchase_price;
              const current = quote ? stock.quantity * quote.price : invested;
              const profit = current - invested;
              const profitPercent = (profit / invested) * 100;
              
              const getAssetEmoji = (type) => {
                if (type === 'crypto') return '₿';
                if (type === 'us_stock') return '🇺🇸';
                return '🇧🇷';
              };

              return (
                <div
                  key={stock.id}
                  className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <AssetIcon 
                        symbol={stock.symbol} 
                        assetType={stock.asset_type || 'br_stock'} 
                        size="lg" 
                      />
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{stock.symbol}</h3>
                        <p className="text-xs text-gray-500">{stock.quantity} {stock.asset_type === 'crypto' ? 'unidades' : 'ações'}</p>
                      </div>
                    </div>
                    {quote && (
                      <div className={`flex items-center gap-1 ${
                        quote.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {quote.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span className="font-bold text-sm">{quote.change_percent.toFixed(2)}%</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valor Atual</span>
                      <span className="font-bold text-gray-900">{formatValue(current)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Lucro/Prejuízo</span>
                      <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profit >= 0 ? '+' : ''}{formatValue(Math.abs(profit))} ({profitPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Despesas por Categoria - Visual Moderno */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border-2 border-gray-100 dark:border-gray-700">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8">Despesas por Categoria</h2>
          
          <div className="space-y-4">
            {chartData.map((item, index) => {
              const percentage = (item.value / summary.total_expense) * 100;
              const color = COLORS[index % COLORS.length];
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full shadow-lg"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="font-semibold text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">{formatValue(item.value)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="relative h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 shadow-lg"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}40`
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Total */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900 dark:text-white">Total de Despesas</span>
              <span className="text-2xl font-black text-red-600 dark:text-red-400">
                {formatValue(summary.total_expense)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {summary?.transactions_count === 0 && stocks.length === 0 && (
        <div className="bg-white rounded-3xl p-16 shadow-lg border-2 border-gray-100 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="text-gray-400" size={48} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Comece sua jornada financeira!</h3>
          <p className="text-gray-500 text-lg mb-6">
            Adicione suas primeiras transações e investimentos para visualizar seu progresso.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/transactions"
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all font-semibold"
            >
              Adicionar Transação
            </a>
            <a
              href="/stocks"
              className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl hover:shadow-lg hover:scale-105 transition-all font-semibold"
            >
              Adicionar Investimento
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
