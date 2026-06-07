import React, { useState } from 'react';
import { Plus, Trash2, X, Archive, TrendingDown, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Flame } from 'lucide-react';
import { format } from 'date-fns';

type MovType = 'SAIDA' | 'PERDA';

interface Movement {
  id: string;
  filamentId: string;
  type: string; // ENTRADA | SAIDA | PERDA
  quantityInStock: number; // rolos (positive = entrada, negative = saida/perda)
  usedGrams: number;
  status: string;
  location?: string;
  notes?: string;
  createdAt: string;
  filament?: any;
}

interface Props {
  filaments: any[];
  purchases: any[];
  stocks: Movement[];
  addStock: (d: any) => Promise<void>;
  deleteStock: (id: string) => Promise<void>;
}

// Derive per-filament inventory from purchases + movements
function buildInventory(filaments: any[], purchases: any[], movements: Movement[]) {
  return filaments.map(f => {
    const fPurchases = purchases.filter(p => p.filamentId === f.id);
    const fMovements = movements.filter(m => m.filamentId === f.id);

    const totalPurchased = fPurchases.reduce((a, p) => a + p.quantity, 0);
    const totalSaida = fMovements.filter(m => m.type === 'SAIDA').reduce((a, m) => a + (m.quantityInStock || 0), 0);
    const totalPerda = fMovements.filter(m => m.type === 'PERDA').reduce((a, m) => a + (m.quantityInStock || 0), 0);
    const usedGrams = fMovements.filter(m => m.type === 'SAIDA').reduce((a, m) => a + (m.usedGrams || 0), 0);
    const currentStock = Math.max(0, totalPurchased - totalSaida - totalPerda);
    const totalGrams = totalPurchased * f.weightGrams;
    const usagePercent = totalGrams > 0 ? Math.min(100, Math.round((usedGrams / totalGrams) * 100)) : 0;

    return { filament: f, totalPurchased, totalSaida, totalPerda, usedGrams, currentStock, usagePercent, movements: fMovements };
  }).filter(item => item.totalPurchased > 0 || item.movements.length > 0);
}

const TYPE_MAP = {
  ENTRADA: { label: 'Entrada', color: 'text-emerald-400 bg-emerald-500/10', icon: <ArrowDownCircle className="w-3.5 h-3.5" /> },
  SAIDA:   { label: 'Saída',   color: 'text-blue-400 bg-blue-500/10',    icon: <ArrowUpCircle className="w-3.5 h-3.5" /> },
  PERDA:   { label: 'Perda',   color: 'text-red-400 bg-red-500/10',      icon: <Flame className="w-3.5 h-3.5" /> },
};

export const EstoqueTab: React.FC<Props> = ({ filaments, purchases, stocks, addStock, deleteStock }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedFilament, setSelectedFilament] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ filamentId: '', type: 'SAIDA' as MovType, quantityInStock: 1, usedGrams: 0, notes: '' });

  const resetForm = () => { setForm({ filamentId: filaments[0]?.id || '', type: 'SAIDA', quantityInStock: 1, usedGrams: 0, notes: '' }); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addStock({
      filamentId: form.filamentId,
      type: form.type,
      quantityInStock: form.quantityInStock,
      usedGrams: form.usedGrams,
      status: form.type === 'SAIDA' ? 'EM_USO' : 'ACABOU',
      notes: form.notes || null,
    });
    resetForm();
  };

  const inventory = buildInventory(filaments, purchases, stocks);
  const totalStock = inventory.reduce((a, i) => a + i.currentStock, 0);
  const totalPerdas = inventory.reduce((a, i) => a + i.totalPerda, 0);

  const selectedItem = selectedFilament ? inventory.find(i => i.filament.id === selectedFilament) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/80">Controle de Estoque</h2>
        <button
          onClick={() => { resetForm(); setForm(f => ({ ...f, filamentId: filaments[0]?.id || '' })); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-all"
          disabled={purchases.length === 0}
        >
          <Plus className="w-4 h-4" /> Registrar Saída / Perda
        </button>
      </div>

      {purchases.length === 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-400 text-sm">
          ⚠️ Registre compras primeiro — o estoque é calculado automaticamente a partir delas.
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3 text-center">
          <p className="text-xs text-emerald-400/70">Em Estoque</p>
          <p className="text-xl font-bold text-emerald-400 tabular-nums">{totalStock} rolos</p>
        </div>
        <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-3 text-center">
          <p className="text-xs text-blue-400/70">Tipos com Saldo</p>
          <p className="text-xl font-bold text-blue-400 tabular-nums">{inventory.filter(i => i.currentStock > 0).length}</p>
        </div>
        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-3 text-center">
          <p className="text-xs text-red-400/70">Perdas (rolos)</p>
          <p className="text-xl font-bold text-red-400 tabular-nums">{totalPerdas}</p>
        </div>
      </div>

      {/* Movement Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={resetForm}>
          <div className="bg-[#0d1527] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Registrar Movimentação</h3>
                <p className="text-sm text-white/40 mt-0.5">Saída de uso ou perda de rolo</p>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Filamento *</label>
                <select value={form.filamentId} onChange={e => setForm({ ...form, filamentId: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500 transition-colors">
                  <option value="">Selecione...</option>
                  {filaments.map((f: any) => <option key={f.id} value={f.id} className="bg-[#0d1527]">{f.brand} – {f.material} – {f.color}</option>)}
                </select>
              </div>

              {/* Type toggle */}
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['SAIDA', 'PERDA'] as MovType[]).map(t => (
                    <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${form.type === t ? (t === 'SAIDA' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30') : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>
                      {t === 'SAIDA' ? <ArrowUpCircle className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                      {t === 'SAIDA' ? 'Saída (Uso)' : 'Perda'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Qtd. Rolos</label>
                  <input type="number" min={1} value={form.quantityInStock} onChange={e => setForm({ ...form, quantityInStock: +e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none" />
                </div>
                {form.type === 'SAIDA' && (
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Gramas usados</label>
                    <input type="number" min={0} value={form.usedGrams} onChange={e => setForm({ ...form, usedGrams: +e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Observações</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none" placeholder="Ex: impresso projeto X" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={resetForm} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Per-filament inventory cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map(({ filament: f, totalPurchased, totalSaida, totalPerda, usedGrams, currentStock, usagePercent, movements: movs }) => (
          <div
            key={f.id}
            className={`rounded-2xl border bg-white/[0.02] p-4 space-y-3 transition-all cursor-pointer hover:border-white/10 ${selectedFilament === f.id ? 'border-purple-500/40' : 'border-white/5'}`}
            onClick={() => setSelectedFilament(v => v === f.id ? null : f.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg flex-shrink-0" style={{ backgroundColor: f.colorHex || '#888' }} />
                <div>
                  <p className="text-sm font-semibold text-white/90">{f.brand} <span className="text-purple-400">{f.material}</span></p>
                  <p className="text-xs text-white/50">{f.color}</p>
                </div>
              </div>
              <span className={`text-lg font-bold tabular-nums ${currentStock === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {currentStock} <span className="text-xs font-normal text-white/40">rolos</span>
              </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-1 text-center">
              <div>
                <p className="text-xs text-white/30">Comprado</p>
                <p className="text-xs font-semibold text-white/60">{totalPurchased}</p>
              </div>
              <div>
                <p className="text-xs text-white/30">Saído</p>
                <p className="text-xs font-semibold text-blue-400">{totalSaida}</p>
              </div>
              <div>
                <p className="text-xs text-white/30">Perda</p>
                <p className="text-xs font-semibold text-red-400">{totalPerda}</p>
              </div>
            </div>

            {/* Usage bar */}
            {usedGrams > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-white/30">
                  <span>Gramas usados: {usedGrams}g</span>
                  <span>{usagePercent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${usagePercent}%` }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Movement history for selected filament */}
      {selectedItem && (
        <div className="rounded-2xl border border-purple-500/20 bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <p className="text-sm font-semibold text-purple-400">
              Movimentações — {selectedItem.filament.brand} {selectedItem.filament.material} {selectedItem.filament.color}
            </p>
            <button onClick={() => setSelectedFilament(null)} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-4 h-4 text-white/40" /></button>
          </div>

          {/* Purchases as ENTRADA */}
          {purchases.filter(p => p.filamentId === selectedItem.filament.id).map(p => (
            <div key={`p-${p.id}`} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-emerald-400 bg-emerald-500/10">
                  <ArrowDownCircle className="w-3 h-3" /> Compra
                </span>
                <span className="text-sm text-white/60">{p.store} · {p.purchaseDate.split('-').reverse().join('/')}</span>
              </div>
              <span className="text-sm font-semibold text-emerald-400">+{p.quantity} rolos</span>
            </div>
          ))}

          {/* Manual movements (SAIDA/PERDA) */}
          {selectedItem.movements.map(m => {
            const mt = TYPE_MAP[m.type as keyof typeof TYPE_MAP] || TYPE_MAP.SAIDA;
            return (
              <div key={m.id} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0 group">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${mt.color}`}>
                    {mt.icon} {mt.label}
                  </span>
                  <span className="text-sm text-white/60">{m.notes || '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${m.type === 'PERDA' ? 'text-red-400' : 'text-blue-400'}`}>
                    -{m.quantityInStock} rolos{m.usedGrams ? ` · ${m.usedGrams}g` : ''}
                  </span>
                  {confirmDeleteId === m.id ? (
                    <div className="flex items-center gap-1.5 transition-all">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await deleteStock(m.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold transition-all"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 text-xs transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(m.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all"
                      title="Excluir movimentação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {selectedItem.movements.length === 0 && purchases.filter(p => p.filamentId === selectedItem.filament.id).length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-white/30">Nenhuma movimentação registrada</p>
          )}
        </div>
      )}

      {inventory.length === 0 && purchases.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center text-white/30">
          <Archive className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum filamento com compras registradas</p>
        </div>
      )}
    </div>
  );
};
