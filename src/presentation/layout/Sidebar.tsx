import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  FileText,
  DollarSign,
  Settings,
  Wallet,
  BarChart3,
  Printer,
} from 'lucide-react';

export type PageId = 'dashboard' | 'lancamentos' | 'contas' | 'cartoes' | 'contas-pagar' | 'receitas' | 'relatorios' | 'estoque-3d' | 'configuracoes';

interface Props {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const navItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'lancamentos', label: 'Lançamentos', icon: <Receipt className="w-5 h-5" /> },
  { id: 'contas', label: 'Contas', icon: <Wallet className="w-5 h-5" /> },
  { id: 'cartoes', label: 'Cartões', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'contas-pagar', label: 'Contas a Pagar', icon: <FileText className="w-5 h-5" /> },
  { id: 'receitas', label: 'Receitas', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'relatorios', label: 'Relatórios', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'estoque-3d', label: 'Estoque 3D', icon: <Printer className="w-5 h-5" /> },
  { id: 'configuracoes', label: 'Configurações', icon: <Settings className="w-5 h-5" /> },
];

export const Sidebar: React.FC<Props> = ({ activePage, onNavigate, isCollapsed, onToggle }) => {
  return (
    <aside
      className={`fixed top-0 lg:left-0 h-screen bg-gradient-to-b from-[#0a0f1c] to-[#0d1527] border-r border-white/5 flex flex-col z-50 transition-all duration-300 ${
        isCollapsed 
          ? 'w-[72px] -left-[72px] lg:left-0' 
          : 'w-[260px] left-0'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[72px] border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-white tracking-tight">FinancePro</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Dashboard</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/10 text-blue-400 shadow-sm shadow-blue-500/5'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={`shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-white/40 group-hover:text-white/70'}`}>
                {item.icon}
              </span>
              {!isCollapsed && <span>{item.label}</span>}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
        >
          {isCollapsed ? '»' : '« Recolher'}
        </button>
      </div>
    </aside>
  );
};
