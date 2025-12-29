import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Sparkles, Download, Edit2 } from 'lucide-react';
import { formatBRL } from '../utils/formatters';
import BankLogo from '../components/BankLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState([]);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category_id: '',
    account_id: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txnRes, catRes, accRes] = await Promise.all([
        axios.get(`${API}/transactions`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/accounts`),
      ]);
      setTransactions(txnRes.data);
      setCategories(catRes.data);
      setAccounts(accRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTransaction) {
        // Update existing transaction
        await axios.put(`${API}/transactions/${editingTransaction.id}`, {
          ...formData,
          amount: parseFloat(formData.amount),
        });
      } else {
        // Create new transaction
        await axios.post(`${API}/transactions`, {
          ...formData,
          amount: parseFloat(formData.amount),
        });
      }
      setShowModal(false);
      setEditingTransaction(null);
      setFormData({
        description: '',
        amount: '',
        type: 'expense',
        category_id: '',
        account_id: '',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
      });
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      alert('Erro ao salvar transação');
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      type: transaction.type,
      category_id: transaction.category_id,
      account_id: transaction.account_id,
      date: transaction.date,
      payment_method: transaction.payment_method || 'cash',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta transação?')) return;
    try {
      await axios.delete(`${API}/transactions/${id}`);
      fetchData();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const handleAIExtract = async () => {
    if (!aiText.trim()) return;
    try {
      setAiLoading(true);
      const response = await axios.post(`${API}/ai/extract`, { text: aiText });
      setAiResults(response.data.items || []);
    } catch (error) {
      console.error('Erro na extração IA:', error);
      alert('Erro ao extrair transações. Tente novamente.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAITransaction = async (item) => {
    if (!accounts.length) {
      alert('Crie uma conta primeiro!');
      return;
    }
    try {
      await axios.post(`${API}/transactions`, {
        description: item.description,
        amount: item.amount,
        type: item.type,
        category_id: item.category_id,
        account_id: item.suggested_account_id || accounts[0].id,
        date: item.date || new Date().toISOString().split('T')[0],
        payment_method: item.payment_method || 'cash',
      });
      setAiResults(aiResults.filter((r) => r !== item));
      if (aiResults.length === 1) {
        setShowAIModal(false);
        setAiText('');
        setAiResults([]);
      }
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar transação');
    }
  };

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id === id);
    return cat ? `${cat.icon} ${cat.name}` : 'Sem categoria';
  };

  const getAccountName = (id) => {
    const acc = accounts.find((a) => a.id === id);
    return acc ? acc.name : 'Sem conta';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Transações</h1>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-xl hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors text-sm md:text-base"
          >
            <Sparkles size={18} className="md:w-5 md:h-5" />
            <span className="hidden sm:inline">Extração IA</span>
            <span className="sm:hidden">IA</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors text-sm md:text-base"
          >
            <Plus size={18} className="md:w-5 md:h-5" />
            <span className="hidden sm:inline">Nova Transação</span>
            <span className="sm:hidden">Nova</span>
          </button>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Conta
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    Nenhuma transação encontrada. Adicione sua primeira transação!
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{txn.description}</div>
                      <div className="text-sm text-gray-500">{txn.payment_method}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{getCategoryName(txn.category_id)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BankLogo 
                          bank={accounts.find(a => a.id === txn.account_id)?.bank_icon || 'other'} 
                          size="sm" 
                        />
                        <span className="text-gray-700">{getAccountName(txn.account_id)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${
                          txn.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {txn.type === 'income' ? '+' : '-'} {formatBRL(txn.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{txn.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(txn)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(txn.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Transação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione...</option>
                  {categories
                    .filter((c) => c.type === formData.type)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Conta</label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pagamento
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="cash">Dinheiro</option>
                  <option value="debit">Débito</option>
                  <option value="credit">Crédito</option>
                  <option value="pix">PIX</option>
                </select>
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
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Extração IA */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="text-purple-600" size={28} />
              Extração Inteligente com IA
            </h2>
            <p className="text-gray-600 mb-6">
              Digite ou cole suas transações em texto natural. A IA vai extrair automaticamente os
              detalhes!
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto das transações
                </label>
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="Exemplo: mercado hoje 150 reais débito&#10;uber ontem 25 reais&#10;salário 5000 recebido pix"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32"
                />
              </div>

              <button
                onClick={handleAIExtract}
                disabled={aiLoading || !aiText.trim()}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Extraindo...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Extrair com IA
                  </>
                )}
              </button>

              {/* Resultados da IA */}
              {aiResults.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="font-semibold text-lg">Transações Extraídas:</h3>
                  {aiResults.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-600">
                              {item.category_name} • {item.payment_method}
                            </p>
                            {item.suggested_account_name && (
                              <div className="flex items-center gap-1">
                                <span className="text-gray-400">•</span>
                                <BankLogo bank={item.bank_name || 'other'} size="sm" />
                                <span className="text-sm text-gray-600">{item.suggested_account_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold text-lg ${
                              item.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {item.type === 'income' ? '+' : '-'} {formatBRL(item.amount)}
                          </p>
                          <p className="text-sm text-gray-500">{item.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const updatedResults = [...aiResults];
                            const editItem = updatedResults[index];
                            setFormData({
                              description: editItem.description,
                              amount: editItem.amount.toString(),
                              type: editItem.type,
                              category_id: editItem.category_id,
                              account_id: editItem.suggested_account_id || (accounts.length > 0 ? accounts[0].id : ''),
                              date: editItem.date,
                              payment_method: editItem.payment_method,
                            });
                            setEditingTransaction(editItem);
                            setShowAIModal(false);
                            setShowModal(true);
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <Edit2 size={16} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleSaveAITransaction(item)}
                          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <Download size={16} />
                          Salvar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAIModal(false);
                    setAiText('');
                    setAiResults([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;