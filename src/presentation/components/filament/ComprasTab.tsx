import React, { useState } from 'react';
import { Money } from '../../../domain/value-objects/Money';
import { Plus, Pencil, Trash2, X, ExternalLink, ShoppingCart, Store } from 'lucide-react';
import { format } from 'date-fns';

interface Supplier { id: string; name: string; url?: string; }

interface Props {
  filaments: any[];
  purchases: any[];
  suppliers: Supplier[];
  addPurchase: (d: any) => Promise<void>;
  updatePurchase: (id: string, d: any) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  addSupplier: (d: { name: string; url?: string }) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
}

export const ComprasTab: React.FC<Props> = ({ filaments, purchases, suppliers, addPurchase, updatePurchase, deletePurchase, addSupplier, deleteSupplier }) => {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [priceDisplay, setPriceDisplay] = useState('0,00');
  const [form, setForm] = useState({ filamentId: '', store: '', quantity: 1, unitPriceCents: 0, purchaseDate: format(new Date(), 'yyyy-MM-dd'), link: '', notes: '' });

  // Supplier quick-add state
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierUrl, setNewSupplierUrl] = useState('');

  const resetForm = () => { setForm({ filamentId: filaments[0]?.id || '', store: '', quantity: 1, unitPriceCents: 0, purchaseDate: format(new Date(), 'yyyy-MM-dd'), link: '', notes: '' }); setPriceDisplay('0,00'); setEditing(null); setShowForm(false); setShowNewSupplier(false); };

  const handlePriceChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const cents = parseInt(digits || '0', 10);
    const reais = (cents / 100).toFixed(2).replace('.', ',');
    setPriceDisplay(reais);
    setForm(f => ({ ...f, unitPriceCents: cents }));
  };

  const handleAddSupplier = async () => {
    if (!newSupplierName.trim()) return;
    await addSupplier({ name: newSupplierName.trim(), url: newSupplierUrl.trim() || undefined });
    setForm(f => ({ ...f, store: newSupplierName.trim() }));
    setNewSupplierName(''); setNewSupplierUrl(''); setShowNewSupplier(false);
  };

  const openNew = () => { resetForm(); setForm(f => ({ ...f, filamentId: filaments[0]?.id || '' })); setShowForm(true); };

  const openEdit = (p: any) => {
    const reais = (p.unitPriceCents / 100).toFixed(2).replace('.', ',');
    setPriceDisplay(reais);
    setForm({ filamentId: p.filamentId, store: p.store, quantity: p.quantity, unitPriceCents: p.unitPriceCents, purchaseDate: p.purchaseDate, link: p.link || '', notes: p.notes || '' });
    setEditing(p); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = form.unitPriceCents * form.quantity;
    const payload = { ...form, totalPriceCents: total, unitPriceCents: form.unitPriceCents, link: form.link || null, notes: form.notes || null };
    if (editing) await updatePurchase(editing.id, payload);
    else await addPurchase(payload);
    resetForm();
  };

  const totalGeral = purchases.reduce((a, p) => a + p.totalPriceCents, 0);
  const totalQtd = purchases.reduce((a, p) => a + p.quantity, 0);
  const mediaUnit = totalQtd > 0 ? Math.round(totalGeral / totalQtd) : 0;

  const getFilamentLabel = (p: any) => {
    const f = p.filament || filaments.find((x: any) => x.id === p.filamentId);
    return f ? `${f.brand} ${f.material} ${f.color}` : '—';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/80">Histórico de Compras</h2>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-all" disabled={filaments.length === 0}>
          <Plus className="w-4 h-4" /> Nova Compra
        </button>
      </div>

      {filaments.length === 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-400 text-sm">
          ⚠️ Cadastre filamentos primeiro na aba "Cadastro de Filamentos" antes de registrar compras.
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={() => resetForm()}>
          <div className="bg-[#0d1527] border border-white/10 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between mb-7">
              <div>
                <h3 className="text-xl font-bold text-white">{editing ? 'Editar' : 'Nova'} Compra</h3>
                <p className="text-sm text-white/40 mt-0.5">Registre uma compra de filamento</p>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-5 h-5 text-white/40" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Filamento */}
              <div>
                <label className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-2 block">Filamento *</label>
                <select value={form.filamentId} onChange={e => setForm({ ...form, filamentId: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500 transition-colors">
                  <option value="">Selecione um filamento...</option>
                  {filaments.map((f: any) => <option key={f.id} value={f.id} className="bg-[#0d1527]">{f.brand} – {f.material} – {f.color}</option>)}
                </select>
              </div>

              {/* Loja e Data */}
              <div>
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3">Compra</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-white/50">Fornecedor *</label>
                      <button type="button" onClick={() => setShowNewSupplier(s => !s)} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                        <Plus className="w-3 h-3" /> Novo
                      </button>
                    </div>
                    <select value={form.store} onChange={e => setForm({ ...form, store: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500 transition-colors">
                      <option value="">Selecione...</option>
                      {suppliers.map(s => <option key={s.id} value={s.name} className="bg-[#0d1527]">{s.name}</option>)}
                    </select>
                    {/* Quick-add supplier */}
                    {showNewSupplier && (
                      <div className="mt-2 p-3 rounded-xl bg-white/5 border border-purple-500/30 space-y-2">
                        <input value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder="Nome do fornecedor *" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none" />
                        <input value={newSupplierUrl} onChange={e => setNewSupplierUrl(e.target.value)} placeholder="URL (opcional)" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none" />
                        <button type="button" onClick={handleAddSupplier} className="w-full py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-semibold hover:bg-purple-500/30 transition-colors">
                          Adicionar Fornecedor
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Data *</label>
                    <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Quantidade e Preço */}
              <div>
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3">Valores</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Quantidade</label>
                    <input type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Preço Unitário</label>
                    <div className="flex items-center rounded-xl bg-white/5 border border-white/10 focus-within:border-purple-500 transition-colors overflow-hidden">
                      <span className="px-3 py-3 text-sm font-semibold text-purple-400 bg-purple-500/10 border-r border-white/10 select-none">R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={priceDisplay}
                        onChange={e => handlePriceChange(e.target.value)}
                        onFocus={e => e.target.select()}
                        className="flex-1 px-4 py-3 bg-transparent text-sm text-white outline-none font-mono tabular-nums"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>

                {/* Total preview */}
                {form.unitPriceCents > 0 && form.quantity > 0 && (
                  <div className="mt-3 flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <span className="text-xs text-white/50">{form.quantity} × {Money.fromCents(form.unitPriceCents).format()}</span>
                    <span className="text-base font-bold text-amber-400 tabular-nums">{Money.fromCents(form.unitPriceCents * form.quantity).format()}</span>
                  </div>
                )}
              </div>

              {/* Link e OBS */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Link da Compra</label>
                  <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500 transition-colors" placeholder="https://shopee.com.br/..." />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Observações</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none resize-none focus:border-purple-500 transition-colors" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={resetForm} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 font-medium text-sm hover:bg-white/5 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20">
                  {editing ? 'Salvar Alterações' : 'Registrar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary row */}
      {purchases.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
            <p className="text-xs text-white/40">Soma</p>
            <p className="text-sm font-bold text-white/80 tabular-nums">{totalQtd} rolos</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
            <p className="text-xs text-white/40">Total Gasto</p>
            <p className="text-sm font-bold text-amber-400 tabular-nums">{Money.fromCents(totalGeral).format()}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
            <p className="text-xs text-white/40">Média/Filamento</p>
            <p className="text-sm font-bold text-blue-400 tabular-nums">{Money.fromCents(mediaUnit).format()}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Loja</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Marca</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Material</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Cor</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white/40 uppercase">Qtd</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase">Preço Unit.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">OBS</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white/40 uppercase">Link</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white/40 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {purchases.map(p => {
                const f = p.filament || filaments.find((x: any) => x.id === p.filamentId);
                return (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-2.5 text-white/60">{p.store}</td>
                    <td className="px-4 py-2.5 text-white/80 font-medium">{f?.brand || '—'}</td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-xs font-medium">{f?.material || '—'}</span></td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {f?.colorHex && <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: f.colorHex }} />}
                        <span className="text-white/60">{f?.color || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center text-white/70 tabular-nums">{p.quantity}</td>
                    <td className="px-4 py-2.5 text-right text-white/60 tabular-nums">{Money.fromCents(p.unitPriceCents).format()}</td>
                    <td className="px-4 py-2.5 text-right text-amber-400 font-semibold tabular-nums">{Money.fromCents(p.totalPriceCents).format()}</td>
                    <td className="px-4 py-2.5 text-white/50 tabular-nums text-xs">{p.purchaseDate.split('-').reverse().join('/')}</td>
                    <td className="px-4 py-2.5 text-white/40 text-xs max-w-[150px] truncate">{p.notes || '—'}</td>
                    <td className="px-4 py-2.5 text-center">
                      {p.link ? (
                        <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300"><ExternalLink className="w-3.5 h-3.5 inline" /></a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={async () => { if(confirm('Excluir?')) await deletePurchase(p.id); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {purchases.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-white/30">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma compra registrada</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
