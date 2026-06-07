import React, { useState } from 'react';
import { Play, CheckCircle, Clock, AlertCircle, Plus, X, Printer, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Money } from '../../../domain/value-objects/Money';

interface Props {
  filaments: any[];
  printers: any[];
  jobs: any[];
  addJob: (d: any) => Promise<void>;
  completeJob: (id: string) => Promise<void>;
}

export const ProducaoTab: React.FC<Props> = ({ filaments, printers, jobs, addJob, completeJob }) => {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    printerId: '',
    filamentId: '',
    pieceName: '',
    quantity: 1,
    gramsPerPiece: 0,
    printTimeHours: 0,
    nozzleTemp: 0,
    bedTemp: 0,
  });

  const resetForm = () => {
    setForm({ printerId: printers[0]?.id || '', filamentId: '', pieceName: '', quantity: 1, gramsPerPiece: 0, printTimeHours: 0, nozzleTemp: 0, bedTemp: 0 });
    setShowForm(false);
  };

  // Quando escolhe o filamento, já puxa as temperaturas padrão cadastradas
  const handleFilamentSelect = (id: string) => {
    const fil = filaments.find(f => f.id === id);
    if (fil) {
      setForm(prev => ({
        ...prev,
        filamentId: id,
        nozzleTemp: fil.printTempMin || 200,
        bedTemp: fil.bedTempMin || 60
      }));
    } else {
      setForm(prev => ({ ...prev, filamentId: id }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addJob(form);
    resetForm();
  };

  const handleComplete = async (jobId: string) => {
    if (confirm('Confirmar conclusão? Isso dará baixa automática no estoque e calculará os custos reais.')) {
      setIsSubmitting(true);
      try {
        await completeJob(jobId);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const pendingJobs = jobs.filter(j => j.status === 'PENDING');
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/80">Fila de Produção</h2>
        <button 
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" /> Novo Job
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={resetForm}>
          <div className="bg-[#0d1527] border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Novo Job de Impressão</h3>
                <p className="text-sm text-white/40 mt-0.5">Adicione uma peça à fila</p>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-5 h-5 text-white/40" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Impressora *</label>
                  <select value={form.printerId} onChange={e => setForm({ ...form, printerId: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500">
                    <option value="">Selecione...</option>
                    {printers.map(p => <option key={p.id} value={p.id} className="bg-[#0d1527]">{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Filamento *</label>
                  <select value={form.filamentId} onChange={e => handleFilamentSelect(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500">
                    <option value="">Selecione...</option>
                    {filaments.map(f => <option key={f.id} value={f.id} className="bg-[#0d1527]">{f.brand} - {f.material} ({f.color})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Nome da Peça / Projeto *</label>
                <input value={form.pieceName} onChange={e => setForm({ ...form, pieceName: e.target.value })} required placeholder="Ex: Placas de Aniversário Alvaro" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Quantidade *</label>
                  <input type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Peso por peça (g) *</label>
                  <input type="number" min={0.1} step="0.1" value={form.gramsPerPiece || ''} onChange={e => setForm({ ...form, gramsPerPiece: +e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Tempo Estimado (h) *</label>
                  <input type="number" min={0.1} step="0.1" value={form.printTimeHours || ''} onChange={e => setForm({ ...form, printTimeHours: +e.target.value })} required placeholder="Ex: 2.5" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Nozzle Temp (°C)</label>
                  <input type="number" value={form.nozzleTemp} onChange={e => setForm({ ...form, nozzleTemp: +e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Bed Temp (°C)</label>
                  <input type="number" value={form.bedTemp} onChange={e => setForm({ ...form, bedTemp: +e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none" />
                </div>
              </div>

              {form.quantity > 0 && form.gramsPerPiece > 0 && (
                <div className="p-3 mt-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <p className="text-xs text-blue-400">Total estimado para baixa no estoque</p>
                  <p className="text-lg font-bold text-blue-300 tabular-nums">{form.quantity * form.gramsPerPiece}g</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold text-sm hover:opacity-90">Enviar para Fila</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fila de Pendentes */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/50 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Imprimindo / Fila ({pendingJobs.length})
        </h3>
        {pendingJobs.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center text-white/30">
            <p className="text-sm">Nenhum job na fila no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingJobs.map(job => (
              <div key={job.id} className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400">Pendente</span>
                    <span className="text-xs text-white/40">{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-white font-semibold truncate">{job.quantity}x {job.pieceName}</h4>
                  <p className="text-xs text-white/60 mt-1">{job.printer?.name || 'Impressora Indefinida'}</p>
                  <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: job.filament?.colorHex || '#ccc' }} />
                    {job.filament?.brand} {job.filament?.material}
                  </p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                  <div className="text-xs text-white/40">
                    <p>{job.totalGrams}g total</p>
                    <p>~{job.printTimeHours}h</p>
                  </div>
                  <button 
                    onClick={() => handleComplete(job.id)}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Concluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico Concluído */}
      <div className="space-y-3 pt-6">
        <h3 className="text-sm font-medium text-white/50 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Histórico Recente
        </h3>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase">Peça</th>
                <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase">Filamento</th>
                <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase">Custo Fil.</th>
                <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase">Custo Energia</th>
                <th className="px-4 py-3 text-xs font-semibold text-white/40 uppercase">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {completedJobs.slice(0, 10).map(job => (
                <tr key={job.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-white/80">{job.quantity}x {job.pieceName}</td>
                  <td className="px-4 py-3 text-white/60">{job.filament?.material} {job.filament?.color}</td>
                  <td className="px-4 py-3 text-amber-400 tabular-nums">{Money.fromCents(job.filamentCostCents || 0).format()}</td>
                  <td className="px-4 py-3 text-emerald-400 tabular-nums">{Money.fromCents(job.energyCostCents || 0).format()}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{new Date(job.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
