import React from 'react';
import { useFinanceContext } from '../../application/hooks/useFinanceData';
import { MonthNavigator } from '../components/MonthNavigator';
import { Money } from '../../domain/value-objects/Money';
import { DollarSign, ArrowUpRight, Wallet, TrendingUp, PiggyBank, ArrowUpDown, ChevronUp, ChevronDown, Trash2, Check, Clock, Pencil, Upload } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ImportTransactionsModal } from '../components/ImportTransactionsModal';
import type { Transaction } from '../../domain/entities/Transaction';

export const ReceitasPage: React.FC = () => {
  const {
    accounts,
    transactions,
    categories,
    selectedMonth,
    setSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    updateTransaction,
    deleteTransaction,
    previousMonthResult,
    setIsTransactionModalOpen,
    setEditingTransaction,
  } = useFinanceContext();

  const [showImportModal, setShowImportModal] = React.useState(false);
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const incomeTransactions = transactions.filter((t) => t.type === 'INCOME');
  const totalIncome = incomeTransactions.reduce((acc, t) => acc + t.amountCents, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amountCents, 0);
  const monthResult = previousMonthResult + totalIncome - totalExpenses;

  const totalAccounts = accounts.reduce((acc, a) => acc + a.initialBalanceCents, 0);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleStatus = async (tx: any) => {
    const newStatus = tx.status === 'PAID' ? 'PENDING' : 'PAID';
    await updateTransaction(tx.id, { status: newStatus });
  };

  const getCategoryName = (tx: any) => {
    if (tx.categoryId) {
      const cat = categories.find((c: any) => c.id === tx.categoryId);
      if (cat) return cat.name;
    }
    return tx.category || '—';
  };

  const sortedIncome = React.useMemo(() => {
    return [...incomeTransactions].sort((a, b) => {
      const getValue = (tx: Transaction): string | number | boolean => {
        if (sortConfig.key === 'categoryName') return getCategoryName(tx);
        const value = tx[sortConfig.key as keyof Transaction];
        return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : '';
      };

      const valA = getValue(a);
      const valB = getValue(b);

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [incomeTransactions, sortConfig]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Receitas</h1>
          <p className="text-sm text-white/40 mt-1">Entradas e saldos do mês</p>
        </div>
        <div className="flex items-center gap-4">
          <MonthNavigator selectedMonth={selectedMonth} onPrevious={goToPreviousMonth} onNext={goToNextMonth} onToday={goToToday} onChange={setSelectedMonth} />
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition-all"
          >
            <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Importar Holerite</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-emerald-500/20"><ArrowUpRight className="w-5 h-5 text-emerald-400" /></div>
            <span className="text-xs text-white/50 uppercase font-medium">Total Recebido</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 tabular-nums">{Money.fromCents(totalIncome).format()}</p>
        </div>

        <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-purple-500/20"><PiggyBank className="w-5 h-5 text-purple-400" /></div>
            <span className="text-xs text-white/50 uppercase font-medium">Saldo Mês Anterior</span>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${previousMonthResult >= 0 ? 'text-purple-400' : 'text-orange-400'}`}>
            {Money.fromCents(previousMonthResult).format()}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-500/10 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-blue-500/20"><Wallet className="w-5 h-5 text-blue-400" /></div>
            <span className="text-xs text-white/50 uppercase font-medium">Contas Correntes</span>
          </div>
          <p className="text-2xl font-bold text-blue-400 tabular-nums">{Money.fromCents(totalAccounts).format()}</p>
        </div>

        <div className={`rounded-2xl border p-5 ${monthResult >= 0 ? 'border-emerald-500/10 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5' : 'border-red-500/10 bg-gradient-to-br from-red-500/10 to-red-600/5'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-xl ${monthResult >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              <TrendingUp className={`w-5 h-5 ${monthResult >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
            <span className="text-xs text-white/50 uppercase font-medium">Resultado Final</span>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${monthResult >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {Money.fromCents(monthResult).format()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Saldo Contas</h2>
          </div>
          <div className="divide-y divide-white/5 flex-1">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color || '#6B7280' }} />
                  <span className="text-sm text-white/70">{acc.name}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums">{Money.fromCents(acc.initialBalanceCents).format()}</span>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="px-5 py-8 text-center text-white/30 text-sm">Nenhuma conta cadastrada</div>
            )}
          </div>
          <div className="flex items-center justify-between px-5 py-3.5 bg-white/[0.02] border-t border-white/5">
            <span className="text-sm font-semibold text-white/80">Total</span>
            <span className="text-sm font-bold text-blue-400 tabular-nums">{Money.fromCents(totalAccounts).format()}</span>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Receitas do Mês</h2>
            </div>
            <span className="text-sm font-bold text-emerald-400 tabular-nums">{Money.fromCents(totalIncome).format()}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">Data {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}</div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('categoryName')}>
                    <div className="flex items-center gap-1">Categoria {sortConfig.key === 'categoryName' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}</div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('description')}>
                    <div className="flex items-center gap-1">Descrição {sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}</div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('amountCents')}>
                    <div className="flex items-center justify-end gap-1">Valor {sortConfig.key === 'amountCents' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}</div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white/40 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
                    <div className="flex items-center justify-center gap-1">Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}</div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white/40 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedIncome.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3 text-white/60 tabular-nums text-xs">{format(parseISO(tx.date), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 text-white/60 text-xs">{getCategoryName(tx)}</td>
                    <td className="px-4 py-3 text-white/80 font-medium">{tx.description}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-semibold tabular-nums">{Money.fromCents(tx.amountCents).format()}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleStatus(tx)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                          tx.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                        }`}
                      >
                        {tx.status === 'PAID' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {tx.status === 'PAID' ? 'Recebido' : 'Pendente'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingTransaction(tx); setIsTransactionModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors" title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={async () => { if(confirm('Excluir?')) await deleteTransaction(tx.id); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors" title="Excluir">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {incomeTransactions.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-white/30 text-sm">Nenhuma receita neste mês</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ImportTransactionsModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)}
        defaultDestinationType="ACCOUNT"
      />
    </div>
  );
};
