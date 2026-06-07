import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Package } from 'lucide-react';

const MATERIALS = ['PLA', 'PLA+', 'PETG', 'ABS', 'TPU', 'ASA', 'NYLON', 'PC', 'SILK', 'WOOD', 'CF', 'OUTRO'];

interface Props {
  filaments: any[];
  addFilament: (d: any) => Promise<void>;
  updateFilament: (id: string, d: any) => Promise<void>;
  deleteFilament: (id: string) => Promise<void>;
}

export const CadastroTab: React.FC<Props> = ({ filaments, addFilament, updateFilament, deleteFilament }) => {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ brand: '', material: 'PETG', color: '', colorHex: '#ffffff', weightGrams: 1000, diameterMm: 1.75, printTempMin: 0, printTempMax: 0, bedTempMin: 0, bedTempMax: 0, notes: '' });

  const resetForm = () => { setForm({ brand: '', material: 'PETG', color: '', colorHex: '#ffffff', weightGrams: 1000, diameterMm: 1.75, printTempMin: 0, printTempMax: 0, bedTempMin: 0, bedTempMax: 0, notes: '' }); setEditing(null); setShowForm(false); };

  const openEdit = (f: any) => {
    setForm({ brand: f.brand, material: f.material, color: f.color, colorHex: f.colorHex || '#ffffff', weightGrams: f.weightGrams, diameterMm: f.diameterMm, printTempMin: f.printTempMin || 0, printTempMax: f.printTempMax || 0, bedTempMin: f.bedTempMin || 0, bedTempMax: f.bedTempMax || 0, notes: f.notes || '' });
    setEditing(f);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, printTempMin: form.printTempMin || null, printTempMax: form.printTempMax || null, bedTempMin: form.bedTempMin || null, bedTempMax: form.bedTempMax || null, notes: form.notes || null, colorHex: form.colorHex || null };
    if (editing) { await updateFilament(editing.id, payload); }
    else { await addFilament(payload); }
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/80">Catálogo de Filamentos</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-all">
          <Plus className="w-4 h-4" /> Novo Filamento
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={() => resetForm()}>
          <div className="bg-[#0d1527] border border-white/10 rounded-3xl p-8 w-full max-w-8xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between mb-7">
              <div>
                <h3 className="text-xl font-bold text-white">{editing ? 'Editar' : 'Novo'} Filamento</h3>
                <p className="text-sm text-white/40 mt-0.5">Preencha as informações do filamento abaixo</p>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-5 h-5 text-white/40" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Identificação */}
              <div>
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3">Identificação</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Marca *</label>
                    <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-purple-500 focus:bg-white/8 outline-none transition-colors" placeholder="Ex: SUNLU, Bambu, Polymaker" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Material *</label>
                    <select value={form.material} onChange={e => setForm({ ...form, material: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-purple-500 outline-none transition-colors appearance-none cursor-pointer">
                      {MATERIALS.map(m => <option key={m} value={m} className="bg-[#0d1527]">{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Diâmetro (mm)</label>
                    <select value={form.diameterMm} onChange={e => setForm({ ...form, diameterMm: +e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none transition-colors appearance-none cursor-pointer">
                      <option value={1.75} className="bg-[#0d1527]">1.75 mm</option>
                      <option value={2.85} className="bg-[#0d1527]">2.85 mm</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cor */}
              <div>
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3">Cor</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="text-xs text-white/50 mb-1.5 block">Nome da Cor *</label>
                    <input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-purple-500 outline-none transition-colors" placeholder="Ex: Preto, Vermelho" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-white/50 mb-1.5 block">Cor Hex</label>
                    <div className="flex gap-3 items-center">
                      <input type="color" value={form.colorHex} onChange={e => setForm({ ...form, colorHex: e.target.value })} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border border-white/10 p-1" />
                      <input value={form.colorHex} onChange={e => setForm({ ...form, colorHex: e.target.value })} className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none font-mono" placeholder="#000000" />
                      <div className="w-12 h-12 rounded-xl border border-white/10 flex-shrink-0" style={{ backgroundColor: form.colorHex }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Peso e Temperaturas */}
              <div>
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3">Especificações Técnicas</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Peso (g)</label>
                    <input type="number" value={form.weightGrams} onChange={e => setForm({ ...form, weightGrams: +e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Temp. Nozzle (°C)</label>
                    <div className="flex gap-2">
                      <input type="number" value={form.printTempMin || ''} onChange={e => setForm({ ...form, printTempMin: +e.target.value })} placeholder="Min" className="flex-1 px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none" />
                      <input type="number" value={form.printTempMax || ''} onChange={e => setForm({ ...form, printTempMax: +e.target.value })} placeholder="Max" className="flex-1 px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Temp. Mesa (°C)</label>
                    <div className="flex gap-2">
                      <input type="number" value={form.bedTempMin || ''} onChange={e => setForm({ ...form, bedTempMin: +e.target.value })} placeholder="Min" className="flex-1 px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none" />
                      <input type="number" value={form.bedTempMax || ''} onChange={e => setForm({ ...form, bedTempMax: +e.target.value })} placeholder="Max" className="flex-1 px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Observações</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none resize-none focus:border-purple-500 transition-colors" placeholder="Notas sobre o filamento, qualidade, fornecedor preferido..." />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={resetForm} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 font-medium text-sm hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20">
                  {editing ? 'Salvar Alterações' : 'Cadastrar Filamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Cor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Marca</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Material</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Cor Nome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Peso</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Diâmetro</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Temp. Nozzle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase">Observações</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white/40 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filaments.map(f => (
                <tr key={f.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-2.5"><div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: f.colorHex || '#888' }} /></td>
                  <td className="px-4 py-2.5 text-white/80 font-medium">{f.brand}</td>
                  <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-xs font-medium">{f.material}</span></td>
                  <td className="px-4 py-2.5 text-white/60">{f.color}</td>
                  <td className="px-4 py-2.5 text-white/50 tabular-nums">{f.weightGrams}g</td>
                  <td className="px-4 py-2.5 text-white/50 tabular-nums">{f.diameterMm}mm</td>
                  <td className="px-4 py-2.5 text-white/50 text-xs tabular-nums">
                    {f.printTempMin && f.printTempMax ? `${f.printTempMin}-${f.printTempMax}°C` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-white/40 text-xs max-w-[200px] truncate">{f.notes || '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { if (confirm('Excluir filamento?')) await deleteFilament(f.id); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filaments.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-white/30">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum filamento cadastrado</p>
                  <p className="text-xs mt-1">Clique em "Novo Filamento" para começar</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
