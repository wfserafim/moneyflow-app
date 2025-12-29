import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, CreditCard, Building2, Wallet as WalletIcon, TrendingUp, AlertCircle } from 'lucide-react';
import { bankIcons, getBankIcon } from '../utils/bankIcons';
import BankLogo from '../components/BankLogo';
import { formatBRL } from '../utils/formatters';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    balance: '0',
    currency: 'BRL',
    credit_limit: '0',
    due_day: '10',
    closing_day: '5',
    bank_name: 'other',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/accounts`);
      setAccounts(response.data);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/accounts`, {
        ...formData,
        balance: parseFloat(formData.balance),
        credit_limit: parseFloat(formData.credit_limit),
        due_day: parseInt(formData.due_day),
        closing_day: parseInt(formData.closing_day),
        bank_icon: formData.bank_name,
      });
      setShowModal(false);
      setFormData({
        name: '',
        type: 'bank',
        balance: '0',
        currency: 'BRL',
        credit_limit: '0',
        due_day: '10',
        closing_day: '5',
        bank_name: 'other',
      });
      fetchAccounts();
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      alert('Erro ao criar conta');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta conta?')) return;
    try {
      await axios.delete(`${API}/accounts/${id}`);
      fetchAccounts();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const viewInvoice = async (account) => {
    try {
      const month = new Date().toISOString().slice(0, 7);
      const response = await axios.get(`${API}/accounts/${account.id}/invoice?month=${month}`);
      setSelectedInvoice(response.data);
      setShowInvoiceModal(true);
    } catch (error) {
      console.error('Erro ao buscar fatura:', error);
      alert('Erro ao buscar fatura do cartão');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bank':
        return Building2;
      case 'cash':
        return WalletIcon;
      case 'credit_card':
        return CreditCard;
      default:
        return WalletIcon;
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'bank':
        return 'Conta Bancária';
      case 'cash':
        return 'Dinheiro';
      case 'credit_card':
        return 'Cartão de Crédito';
      default:
        return type;
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => {
    if (acc.type === 'credit_card') {
      return sum + (acc.credit_limit - (acc.current_invoice || 0));
    }
    return sum + acc.balance;
  }, 0);

  const bankAccounts = accounts.filter((a) => a.type === 'bank');
  const creditCards = accounts.filter((a) => a.type === 'credit_card');
  const cashAccounts = accounts.filter((a) => a.type === 'cash');

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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg">
            <WalletIcon className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Minhas Contas</h1>
            <p className="text-gray-600">Gerencie suas contas e cartões</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
        >
          <Plus size={20} />
          Nova Conta
        </button>
      </div>

      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <p className="text-white/80 text-sm font-semibold mb-2">💰 Patrimônio Total</p>
          <h2 className="text-5xl font-black mb-4">{formatBRL(totalBalance)}</h2>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>{accounts.length} conta(s)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>{creditCards.length} cartão(ões)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cartões de Crédito */}
      {creditCards.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="text-purple-600" size={28} />
            Cartões de Crédito
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creditCards.map((acc) => {
              const bank = getBankIcon(acc.bank_icon || 'other');
              const usedCredit = acc.current_invoice || 0;
              const availableCredit = (acc.credit_limit || 0) - usedCredit;
              const usagePercent = acc.credit_limit > 0 ? (usedCredit / acc.credit_limit) * 100 : 0;

              return (
                <div
                  key={acc.id}
                  className={`bg-gradient-to-br ${bank.gradient} rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 relative overflow-hidden group cursor-pointer`}
                  onClick={() => viewInvoice(acc)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <BankLogo bank={acc.bank_icon || 'other'} size="lg" />
                        <div>
                          <p className="text-xs font-semibold opacity-80 mb-1">{bank.name}</p>
                          <h3 className="text-xl font-bold">{acc.name}</h3>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewInvoice(acc);
                          }}
                          className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
                        >
                          <TrendingUp size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(acc.id);
                          }}
                          className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold opacity-80 mb-1">Limite Total</p>
                        <p className="text-2xl font-bold">{formatBRL(acc.credit_limit || 0)}</p>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold opacity-90 mb-2">
                          <span>Disponível: {formatBRL(availableCredit)}</span>
                          <span>{usagePercent.toFixed(0)}% usado</span>
                        </div>
                        <div className="w-full bg-white/30 rounded-full h-2">
                          <div
                            className="bg-white h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm pt-2 border-t border-white/30">
                        <span className="opacity-80">Vencimento</span>
                        <span className="font-bold">Dia {acc.due_day || 10}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contas Bancárias */}
      {bankAccounts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="text-blue-600" size={28} />
            Contas Bancárias
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bankAccounts.map((acc) => {
              const bank = getBankIcon(acc.bank_icon || 'other');
              return (
                <div
                  key={acc.id}
                  className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <BankLogo bank={acc.bank_icon || 'other'} size="lg" />
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">{bank.name}</p>
                        <h3 className="font-bold text-gray-900 text-lg">{acc.name}</h3>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-1 font-semibold">Saldo Disponível</p>
                    <p className="text-3xl font-black text-gray-900">{formatBRL(acc.balance)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dinheiro */}
      {cashAccounts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <WalletIcon className="text-emerald-600" size={28} />
            Dinheiro
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cashAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-2xl shadow-lg">
                      💵
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Dinheiro</p>
                      <h3 className="font-bold text-gray-900 text-lg">{acc.name}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-1 font-semibold">Valor em Mãos</p>
                  <p className="text-3xl font-black text-gray-900">{formatBRL(acc.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {accounts.length === 0 && (
        <div className="bg-white rounded-3xl p-12 shadow-lg border-2 border-gray-100 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WalletIcon className="text-gray-400" size={40} />
          </div>
          <p className="text-gray-500 text-lg font-semibold">Nenhuma conta encontrada</p>
          <p className="text-gray-400 mt-2">Crie sua primeira conta para começar!</p>
        </div>
      )}

      {/* Modal Nova Conta */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold mb-6">Nova Conta</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Conta</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="bank">🏦 Conta Bancária</option>
                  <option value="credit_card">💳 Cartão de Crédito</option>
                  <option value="cash">💵 Dinheiro</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nome da Conta</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Ex: Conta Corrente, Nubank, Carteira"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Banco</label>
                  <select
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    {Object.entries(bankIcons).map(([key, bank]) => (
                      <option key={key} value={key}>
                        {bank.emoji} {bank.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.type !== 'credit_card' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Saldo Inicial (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              )}

              {formData.type === 'credit_card' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Limite Total (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Dia do Fechamento
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.closing_day}
                        onChange={(e) => setFormData({ ...formData, closing_day: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Dia do Vencimento
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.due_day}
                        onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-2xl hover:shadow-lg transition-all font-semibold"
                >
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fatura */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Fatura do Cartão</h2>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white mb-6">
              <p className="text-sm opacity-90 mb-1">{selectedInvoice.account_name}</p>
              <h3 className="text-4xl font-bold mb-4">{formatBRL(selectedInvoice.total)}</h3>
              <div className="flex justify-between text-sm">
                <span>Vencimento: Dia {selectedInvoice.due_day}</span>
                <span>Limite: {formatBRL(selectedInvoice.credit_limit)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-lg mb-3">Transações da Fatura</h3>
              {selectedInvoice.transactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhuma transação nesta fatura</p>
              ) : (
                selectedInvoice.transactions.map((txn, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{txn.description}</p>
                      <p className="text-sm text-gray-500">{txn.date}</p>
                    </div>
                    <p className="font-bold text-red-600">{formatBRL(txn.amount)}</p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowInvoiceModal(false)}
              className="w-full mt-6 px-6 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
