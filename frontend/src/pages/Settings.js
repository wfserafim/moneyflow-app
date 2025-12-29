import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Globe, Palette, Save } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    user_name: '',
    currency: 'BRL',
    theme: 'light',
    language: 'pt-BR',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await axios.put(`${API}/settings`, formData);
      alert('Configurações salvas com sucesso!');
      fetchSettings();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <User className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Personalize sua experiência</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Perfil */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <User className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Perfil</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  value={formData.user_name}
                  onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Digite seu nome"
                />
              </div>
            </div>
          </div>

          {/* Regional */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="text-green-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Regional</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Moeda</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="BRL">Real Brasileiro (R$)</option>
                  <option value="USD">Dólar Americano ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Idioma</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>
            </div>
          </div>

          {/* Aparência */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="text-purple-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Aparência</h2>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tema</label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="p-8 bg-gray-50">
            <button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Informações do App */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl">
        <h3 className="text-xl font-bold mb-2">MoneyFlow v2.0</h3>
        <p className="text-blue-100 mb-4">
          Controle financeiro inteligente com IA integrada
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
            🤖 IA GPT-5.2
          </span>
          <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
            📊 Investimentos B3
          </span>
          <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
            💳 Cartões de Crédito
          </span>
        </div>
      </div>
    </div>
  );
};

export default Settings;
