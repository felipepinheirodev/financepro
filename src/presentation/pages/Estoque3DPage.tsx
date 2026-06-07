import React, { useState } from 'react';
import { useFilamentData } from '../../application/hooks/useFilamentData';
import { Money } from '../../domain/value-objects/Money';
import { Package, ShoppingCart, Archive, Printer, Plus, Pencil, Trash2, ExternalLink, X, Play } from 'lucide-react';
import { CadastroTab } from '../components/filament/CadastroTab';
import { ComprasTab } from '../components/filament/ComprasTab';
import { EstoqueTab } from '../components/filament/EstoqueTab';
import { ProducaoTab } from '../components/filament/ProducaoTab';

type TabId = 'compras' | 'cadastro' | 'estoque' | 'producao';

export const Estoque3DPage: React.FC = () => {
  const data = useFilamentData();
  const [activeTab, setActiveTab] = useState<TabId>('compras');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'compras', label: 'Dados de Compra', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'cadastro', label: 'Catálogo', icon: <Package className="w-4 h-4" /> },
    { id: 'estoque', label: 'Estoque Atual', icon: <Archive className="w-4 h-4" /> },
    { id: 'producao', label: 'Produção (Jobs)', icon: <Play className="w-4 h-4" /> },
  ];

  const s = data.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Estoque 3D</h1>
              <p className="text-sm text-white/40 mt-0.5">Controle de filamentos e insumos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {s && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-4">
            <p className="text-xs text-purple-400/70 font-medium uppercase">Tipos</p>
            <p className="text-xl font-bold text-purple-400 mt-1 tabular-nums">{s.totalFilamentTypes}</p>
          </div>
          <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
            <p className="text-xs text-blue-400/70 font-medium uppercase">Comprados</p>
            <p className="text-xl font-bold text-blue-400 mt-1 tabular-nums">{s.totalSpoolsPurchased} rolos</p>
          </div>
          <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
            <p className="text-xs text-emerald-400/70 font-medium uppercase">Em Estoque</p>
            <p className="text-xl font-bold text-emerald-400 mt-1 tabular-nums">{s.currentInStock} rolos</p>
          </div>
          <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
            <p className="text-xs text-amber-400/70 font-medium uppercase">Custo Médio</p>
            <p className="text-xl font-bold text-amber-400 mt-1 tabular-nums">{Money.fromCents(s.averagePriceCents).format()}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/10 text-purple-400 shadow-sm'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'compras' && <ComprasTab {...data} />}
      {activeTab === 'cadastro' && <CadastroTab {...data} />}
      {activeTab === 'estoque' && <EstoqueTab {...data} />}
      {activeTab === 'producao' && <ProducaoTab {...data} />}
    </div>
  );
};
