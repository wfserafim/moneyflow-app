import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, CreditCard, Tag, Wallet, TrendingUp, Menu, X, Settings, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Layout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Início', color: 'text-blue-600' },
    { path: '/transactions', icon: CreditCard, label: 'Transações', color: 'text-purple-600' },
    { path: '/categories', icon: Tag, label: 'Categorias', color: 'text-pink-600' },
    { path: '/accounts', icon: Wallet, label: 'Contas', color: 'text-emerald-600' },
    { path: '/stocks', icon: TrendingUp, label: 'Investimentos', color: 'text-orange-600' },
    { path: '/settings', icon: Settings, label: 'Configurações', color: 'text-gray-600' },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-72 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-xl">
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                MoneyFlow
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Seu dinheiro sob controle</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50 scale-105'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-105'
                }`}
              >
                <Icon size={22} className={isActive ? 'text-white' : item.color} />
                <span className={`font-semibold ${isActive ? 'text-white' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            <span className="font-semibold">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 text-white">
            <p className="text-xs font-semibold opacity-90">💡 Dica do Dia</p>
            <p className="text-sm mt-1">Use a IA para extrair transações automaticamente!</p>
          </div>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white/95 backdrop-blur-xl shadow-2xl">
            <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <h1 className="text-xl font-black bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
                    MoneyFlow
                  </h1>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-semibold">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Mobile */}
        <header className="md:hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center">
              <span className="text-lg">💰</span>
            </div>
            <h1 className="text-lg font-black bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
              MoneyFlow
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
