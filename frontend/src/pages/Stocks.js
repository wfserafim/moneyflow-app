import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AssetIcon from '../components/AssetIcon';

// Componente de Gráfico Simples (SVG)
const PerformanceChart = ({ data }) => {
  if (!data) return null;
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow mb-6">
      <h3 className="text-lg font-bold mb-4 dark:text-white">Rentabilidade da Carteira vs CDI</h3>
      <div className="h-48 flex items-end justify-between space-x-2 px-2">
        {data.labels.map((label, idx) => (
          <div key={idx} className="flex flex-col items-center flex-1 group">
            <div className="relative w-full flex justify-center space-x-1 h-40 items-end">
              <div style={{height: `${data.portfolio[idx] * 10}%`}} className="w-3 bg-green-500 rounded-t transition-all group-hover:bg-green-400"></div>
              <div style={{height: `${data.cdi[idx] * 10}%`}} className="w-3 bg-gray-400 rounded-t transition-all"></div>
            </div>
            <span className="text-xs text-gray-500 mt-2">{label}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-center space-x-6 mt-4 text-sm">
        <div className="flex items-center"><span className="w-3 h-3 bg-green-500 mr-2 rounded"></span>Minha Carteira</div>
        <div className="flex items-center"><span className="w-3 h-3 bg-gray-400 mr-2 rounded"></span>CDI</div>
      </div>
    </div>
  );
};

const Stocks = () => {
  const [stocks, setStocks] = useState([]);
  const [groupedStocks, setGroupedStocks] = useState([]);
  const [viewMode, setViewMode] = useState('individual');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Definindo as funções DENTRO do useEffect para evitar erro de dependência
    const fetchStocks = async () => {
      try {
        const response = await fetch('/api/stocks');
        if (response.ok) {
          const data = await response.json();
          setStocks(data);
        }
      } catch (error) {
        console.error("Erro ao buscar ações:", error);
      }
    };
  
    const fetchGroupedStocks = async () => {
      try {
        const response = await fetch('/api/stocks/grouped');
        if (response.ok) {
          const data = await response.json();
          setGroupedStocks(data);
        }
      } catch (error) {
        console.error("Erro ao buscar ações agrupadas:", error);
      }
    };

    const fetchPerformance = async () => {
        try {
            const response = await fetch('/api/stocks/performance');
            if (response.ok) {
                const data = await response.json();
                setChartData(data);
            }
        } catch (error) {
            console.error("Erro performance", error);
        }
    }

    Promise.all([fetchStocks(), fetchGroupedStocks(), fetchPerformance()]).then(() => setLoading(false));
  }, []);

  const renderTable = (data, isGrouped) => (
    <div className="overflow-x-auto rounded-lg shadow">
      <table className="min-w-full bg-white dark:bg-gray-800">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Ativo</th>
            <th className="py-3 px-4 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Qtd</th>
            <th className="py-3 px-4 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">
              {isGrouped ? 'Preço Médio' : 'Preço Pago'}
            </th>
            <th className="py-3 px-4 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-750">
              <td className="py-3 px-4 flex items-center space-x-3">
                <AssetIcon symbol={item.symbol} type={item.asset_type} />
                <div className="flex flex-col">
                    <span className="font-bold dark:text-white">{item.symbol}</span>
                    {!isGrouped && <span className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString('pt-BR')}</span>}
                </div>
              </td>
              <td className="py-3 px-4 text-right dark:text-gray-300">{item.quantity}</td>
              <td className="py-3 px-4 text-right dark:text-gray-300">
                R$ {parseFloat(isGrouped ? item.average_price : item.price).toFixed(2)}
              </td>
              <td className="py-3 px-4 text-right font-bold text-green-600 dark:text-green-400">
                R$ {parseFloat(isGrouped ? (item.average_price * item.quantity) : (item.price * item.quantity)).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Layout>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Investimentos</h1>
        
        {loading && <p className="text-gray-500">Carregando...</p>}

        {/* Gráfico */}
        {chartData && <PerformanceChart data={chartData} />}

        {/* Toggle e Tabela */}
        <div className="flex justify-between items-center mb-4 mt-8">
           <h2 className="text-xl font-semibold dark:text-gray-200">Meus Ativos</h2>
           <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded flex">
             <button onClick={() => setViewMode('individual')} className={`px-3 py-1 rounded text-sm ${viewMode === 'individual' ? 'bg-white dark:bg-gray-600 shadow text-black dark:text-white' : 'text-gray-500'}`}>Individual</button>
             <button onClick={() => setViewMode('grouped')} className={`px-3 py-1 rounded text-sm ${viewMode === 'grouped' ? 'bg-white dark:bg-gray-600 shadow text-black dark:text-white' : 'text-gray-500'}`}>Agrupado</button>
           </div>
        </div>

        {viewMode === 'individual' ? renderTable(stocks, false) : renderTable(groupedStocks, true)}
      </div>
    </Layout>
  );
};

export default Stocks;
