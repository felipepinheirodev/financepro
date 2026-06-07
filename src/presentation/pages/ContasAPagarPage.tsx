import React from 'react';
import { useFinanceContext } from '../../application/hooks/useFinanceData';
import { MonthNavigator } from '../components/MonthNavigator';
import { Money } from '../../domain/value-objects/Money';
import { FileText, Check, Clock, CalendarClock, Pencil, Trash2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { format, parseISO, addMonths } from 'date-fns';
import { PaymentModal } from '../components/PaymentModal';

export const ContasAPagarPage: React.FC = () => {
  const {
    transactions,
    categories,
    accounts,
    creditCards,
    selectedMonth,
    setSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    updateTransaction,
    deleteTransaction,
    setIsTransactionModalOpen,
    setEditingTransaction,
  } = useFinanceContext();

  const [showPaymentModal, setShowPaymentModal] = React.useState<{ isOpen: boolean; tx: any | null }>({ isOpen: false, tx: null });
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'asc' });

  const expenses = transactions.filter((t) => t.type === 'EXPENSE');
  const fixas = expenses.filter((t) => t.expenseType === 'FIXA');
  const variaveis = expenses.filter((t) => t.expenseType === 'VARIAVEL');
  const semClassificacao = expenses.filter((t) => !t.expenseType);

  const fixasTotal = fixas.reduce((acc, t) => acc + t.amountCents, 0);
  const variaveisTotal = variaveis.reduce((acc, t) => acc + t.amountCents, 0);
  const semClassTotal = semClassificacao.reduce((acc, t) => acc + t.amountCents, 0);

  const toggleStatus = async (tx: any) => {
    if (tx.status === 'PENDING') {
      setShowPaymentModal({ isOpen: true, tx });
    } else {
      await updateTransaction(tx.id, { status: 'PENDING' });
    }
  };

  const confirmPayment = async (date: string) => {
    // This local function is being replaced by logic inside PaymentModal
  };

  const handlePostpone = async (tx: any) => {
    const date = parseISO(tx.date);
    const newDate = format(addMonths(date, 1), 'yyyy-MM-dd');
    if (confirm(`Adiar "${tx.description}" para o mês seguinte?`)) {
      await updateTransaction(tx.id, { date: newDate });
    }
  };

  const handleEdit = (tx: any) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const getCategoryName = (tx: any) => {
    if (tx.categoryId) {
      const cat = categories.find((c: any) => c.id === tx.categoryId);
      if (cat) return cat.name;
    }
    return tx.category || '—';
  };

  const getPaymentSource = (tx: any) => {
    if (tx.creditCardId) {
      const card = creditCards.find((c: any) => c.id === tx.creditCardId);
      return card?.name || '—';
    }
    const acc = accounts.find((a: any) => a.id === tx.accountId);
    return acc?.name || '—';
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortItems = (items: any[]) => {
    return [...items].sort((a, b) => {
      let valA = a[sortConfig.key as keyof any];
      let valB = b[sortConfig.key as keyof any];
      
      if (sortConfig.key === 'categoryName') { valA = getCategoryName(a); valB = getCategoryName(b); }
      if (sortConfig.key === 'sourceName') { valA = getPaymentSource(a); valB = getPaymentSource(b); }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const renderTable = (title: string, items: typeof expenses, total: number, colorClass: string) => {
    const sortedItems = sortItems(items);
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">{title}</h2>
          <span className={`text-sm font-bold tabular-nums ${colorClass}`}>{Money.fromCents(total).format()}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-white/40 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">Data {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}</div>
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-white/40 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('currentInstallment')}>
                  <div className="flex items-center gap-1">Parcela {sortConfig.key === 'currentInstallment' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}</div>
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-white/40 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('categoryName')}>
                  <div className="flex items-center gap-1">Categoria {sortConfig.key === 'categoryName' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}</div>
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-white/40 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('description')}>
                  <div className="flex items-center gap-1">Descrição {sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}</div>
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-white/40 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('sourceName')}>
                  <div className="flex items-center gap-1">Conta/Cartão {sortConfig.key === 'sourceName' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}</div>
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-white/40 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('amountCents')}>
                  <div className="flex items-center justify-end gap-1">Valor {sortConfig.key === 'amountCents' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}</div>
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-white/40 uppercase cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
                  <div className="flex items-center justify-center gap-1">Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}</div>
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-white/40 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedItems.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-2.5 text-white/60 tabular-nums text-xs">{format(parseISO(tx.date), 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-2.5 text-white/50 text-xs">
                    {tx.isInstallment && tx.currentInstallment && tx.totalInstallments
                      ? `${tx.currentInstallment}|${tx.totalInstallments}`
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-2.5 text-white/60 text-xs">{getCategoryName(tx)}</td>
                  <td className="px-4 py-2.5 text-white/80 font-medium">{tx.description}</td>
                  <td className="px-4 py-2.5 text-white/50 text-xs">{getPaymentSource(tx)}</td>
                  <td className="px-4 py-2.5 text-right text-red-400 font-semibold tabular-nums">{Money.fromCents(tx.amountCents).format()}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => toggleStatus(tx)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                        tx.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                      }`}
                    >
                      {tx.status === 'PAID' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {tx.status === 'PAID' ? 'Pago' : 'Pendente'}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {tx.status === 'PENDING' && (
                        <button onClick={() => handlePostpone(tx)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-white/40 hover:text-blue-400 transition-colors" title="Adiar para mês seguinte">
                          <CalendarClock className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => handleEdit(tx)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors" title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={async () => { if(confirm('Excluir?')) await deleteTransaction(tx.id); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-white/30 text-sm">Nenhum lançamento</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="text-sm text-white/40 mt-1">Fixas e variáveis do mês</p>
        </div>
        <MonthNavigator selectedMonth={selectedMonth} onPrevious={goToPreviousMonth} onNext={goToNextMonth} onToday={goToToday} onChange={setSelectedMonth} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
          <p className="text-xs text-blue-400/70 font-medium uppercase">Fixas</p>
          <p className="text-xl font-bold text-blue-400 mt-1 tabular-nums">{Money.fromCents(fixasTotal).format()}</p>
        </div>
        <div className="rounded-xl border border-orange-500/10 bg-orange-500/5 p-4">
          <p className="text-xs text-orange-400/70 font-medium uppercase">Variáveis</p>
          <p className="text-xl font-bold text-orange-400 mt-1 tabular-nums">{Money.fromCents(variaveisTotal).format()}</p>
        </div>
        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4">
          <p className="text-xs text-red-400/70 font-medium uppercase">Total</p>
          <p className="text-xl font-bold text-red-400 mt-1 tabular-nums">{Money.fromCents(fixasTotal + variaveisTotal + semClassTotal).format()}</p>
        </div>
      </div>

      {renderTable('Contas Fixas', fixas, fixasTotal, 'text-blue-400')}
      {renderTable('Contas Variáveis', variaveis, variaveisTotal, 'text-orange-400')}
      {semClassificacao.length > 0 && renderTable('Sem Classificação', semClassificacao, semClassTotal, 'text-white/60')}


      <PaymentModal
        isOpen={showPaymentModal.isOpen}
        onClose={() => setShowPaymentModal({ isOpen: false, tx: null })}
        transaction={showPaymentModal.tx}
      />
    </div>
  );
};
