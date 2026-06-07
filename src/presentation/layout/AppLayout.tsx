import React, { useState } from 'react';
import { Sidebar, type PageId } from './Sidebar';
import { useFinanceData, FinanceContext } from '../../application/hooks/useFinanceData';
import { Dashboard } from '../pages/Dashboard';
import { LancamentosPage } from '../pages/LancamentosPage';
import { CartoesPage } from '../pages/CartoesPage';
import { ContasAPagarPage } from '../pages/ContasAPagarPage';
import { ReceitasPage } from '../pages/ReceitasPage';
import { RelatoriosPage } from '../pages/RelatoriosPage';
import { ConfiguracoesPage } from '../pages/ConfiguracoesPage';
import { ContasBancariasPage } from '../pages/ContasBancariasPage';
import { Estoque3DPage } from '../pages/Estoque3DPage';
import { TransactionModal } from '../components/TransactionModal';
import { Plus } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const financeData = useFinanceData();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'lancamentos': return <LancamentosPage />;
      case 'contas': return <ContasBancariasPage />;
      case 'cartoes': return <CartoesPage />;
      case 'contas-pagar': return <ContasAPagarPage />;
      case 'receitas': return <ReceitasPage />;
      case 'relatorios': return <RelatoriosPage />;
      case 'estoque-3d': return <Estoque3DPage />;
      case 'configuracoes': return <ConfiguracoesPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <FinanceContext.Provider value={financeData}>
      <div className="min-h-screen bg-[#060a13] text-white flex">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0f1c] border-b border-white/5 flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-bold">FinancePro</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => financeData.openNewTransaction()}
              className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"
              title="Novo Lançamento"
            >
              <Plus className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-white/70 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="Refined the Sidebar for mobile use with an overlay and better toggle behavior.0 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>

        <Sidebar
          activePage={activePage}
          onNavigate={(page) => {
            setActivePage(page);
            if (window.innerWidth < 1024) setSidebarCollapsed(true);
          }}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        {/* Overlay for mobile sidebar */}
        {!sidebarCollapsed && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        <main
          className={`flex-1 transition-all duration-300 min-h-screen pt-16 lg:pt-0 ${
            sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
          }`}
        >
          <div className="p-4 md:p-8 max-w-[1400px] mx-auto pb-24 lg:pb-8">
            {renderPage()}
          </div>
        </main>

        {/* Global Floating Action Button (Mobile Only) */}
        <button
          onClick={() => financeData.openNewTransaction()}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-2xl shadow-blue-500/40 flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all"
        >
          <Plus className="w-7 h-7" />
        </button>

        {/* Global Transaction Modal */}
        <TransactionModal 
          isOpen={financeData.isTransactionModalOpen} 
          onClose={() => financeData.setIsTransactionModalOpen(false)} 
          editTransaction={financeData.editingTransaction} 
        />
      </div>
    </FinanceContext.Provider>
  );
};
