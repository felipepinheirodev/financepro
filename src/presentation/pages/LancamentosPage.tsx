import React, { useState } from 'react';
import { useFinanceContext } from '../../application/hooks/useFinanceData';
import { MonthNavigator } from '../components/MonthNavigator';
import { Money } from '../../domain/value-objects/Money';
import type { Transaction } from '../../domain/entities/Transaction';
import { Plus, Pencil, Trash2, Check, Clock, Filter, CalendarClock, CheckCircle, CalendarDays, CreditCard as CreditCardIcon, ChevronUp, ChevronDown, ArrowUpDown, Upload } from 'lucide-react';
import { ImportTransactionsModal } from '../components/ImportTransactionsModal';
import { format, parseISO, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PaymentModal } from '../components/PaymentModal';

type TabFilter = 'ALL' | 'EXPENSE' | 'INCOME' | 'CARTAO';

export const LancamentosPage: React.FC = () => {
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
    deleteTransaction,
    updateTransaction,
    setIsTransactionModalOpen,
    setEditingTransaction,
    openNewTransaction,
  } = useFinanceContext();

  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [showImportModal, setShowImportModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSource, setFilterSource] = useState(''); // Account or Card ID
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState<{ isOpen: boolean; tx: Transaction | null }>({ isOpen: false, tx: null });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction | 'accountName' | 'categoryName'; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const handleSort = (key: keyof Transaction | 'accountName' | 'categoryName') => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortedTransactions = (txs: Transaction[]) => {
    return [...txs].sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof Transaction];
      let valB: any = b[sortConfig.key as keyof Transaction];

      if (sortConfig.key === 'categoryName') {
        valA = getCategoryName(a);
        valB = getCategoryName(b);
      } else if (sortConfig.key === 'accountName') {
        const cardA = a.creditCardId ? creditCards.find(c => c.id === a.creditCardId) : null;
        const accA = !a.creditCardId ? accounts.find(acc => acc.id === a.accountId) : null;
        valA = cardA?.name || accA?.name || '';

        const cardB = b.creditCardId ? creditCards.find(c => c.id === b.creditCardId) : null;
        const accB = !b.creditCardId ? accounts.find(acc => acc.id === b.accountId) : null;
        valB = cardB?.name || accB?.name || '';
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredTransactions = transactions.filter((t) => {
    if (activeTab === 'EXPENSE' && t.type !== 'EXPENSE') return false;
    if (activeTab === 'INCOME' && t.type !== 'INCOME') return false;
    if (activeTab === 'CARTAO' && !t.creditCardId) return false;
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterSource) {
      if (t.creditCardId) {
        if (t.creditCardId !== filterSource) return false;
      } else {
        if (t.accountId !== filterSource) return false;
      }
    }
    return true;
  });

  const sortedTransactions = getSortedTransactions(filteredTransactions);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredTransactions.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (confirm(`Excluir ${selectedIds.length} lançamentos selecionados?`)) {
      for (const id of selectedIds) {
        await deleteTransaction(id);
      }
      setSelectedIds([]);
    }
  };

  const handleBatchMoveMonth = async (monthsToAdd: number) => {
    if (confirm(`Mover ${selectedIds.length} lançamentos para o mês ${monthsToAdd > 0 ? 'seguinte' : 'anterior'}?`)) {
      for (const id of selectedIds) {
        const tx = transactions.find(t => t.id === id);
        if (tx) {
          const newDate = format(addMonths(parseISO(tx.date), monthsToAdd), 'yyyy-MM-dd');
          await updateTransaction(id, { date: newDate });
        }
      }
      setSelectedIds([]);
    }
  };

  const handleBatchChangeCard = async (cardId: string) => {
    if (confirm(`Alterar o cartão/conta de ${selectedIds.length} lançamentos?`)) {
      for (const id of selectedIds) {
        const card = creditCards.find(c => c.id === cardId);
        const account = accounts.find(a => a.id === cardId);
        
        if (card) {
          await updateTransaction(id, { creditCardId: cardId, accountId: card.accountId });
        } else if (account) {
          await updateTransaction(id, { accountId: cardId, creditCardId: undefined });
        }
      }
      setSelectedIds([]);
    }
  };

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amountCents, 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amountCents, 0);

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const handleDelete = async (tx: Transaction) => {
    if (confirm(`Deletar "${tx.description}"?`)) {
      await deleteTransaction(tx.id);
    }
  };

  const toggleStatus = async (tx: Transaction) => {
    if (tx.status === 'PENDING') {
      // Quando for pagar, pergunta se quer escolher a data ou usar hoje
      setShowPaymentModal({ isOpen: true, tx });
    } else {
      await updateTransaction(tx.id, {
        status: 'PENDING',
      });
    }
  };

  const handlePostpone = async (tx: Transaction) => {
    const date = parseISO(tx.date);
    const newDate = format(addMonths(date, 1), 'yyyy-MM-dd');
    if (confirm(`Mover "${tx.description}" para o mês seguinte (${format(addMonths(date, 1), 'MMMM', { locale: ptBR })})?`)) {
      await updateTransaction(tx.id, { date: newDate });
    }
  };

  const confirmPayment = async (date: string) => {
    // Replaced by PaymentModal logic
  };

  const tabs: { id: TabFilter; label: string }[] = [
    { id: 'ALL', label: 'Todos' },
    { id: 'EXPENSE', label: 'Despesas' },
    { id: 'INCOME', label: 'Receitas' },
    { id: 'CARTAO', label: 'Cartão' },
  ];

  const getCategoryName = (tx: Transaction) => {
    if (tx.categoryId) {
      const cat = categories.find((c) => c.id === tx.categoryId);
      if (cat) return cat.name;
    }
    return tx.category || '—';
  };

  const formatInstallment = (tx: Transaction) => {
    if (tx.isInstallment && tx.currentInstallment && tx.totalInstallments) {
      return `${tx.currentInstallment}|${tx.totalInstallments}`;
    }
    return 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lançamentos</h1>
          <p className="text-sm text-white/40 mt-1">Gerencie seus lançamentos mês a mês</p>
        </div>
        <div className="flex items-center gap-4">
          <MonthNavigator
            selectedMonth={selectedMonth}
            onPrevious={goToPreviousMonth}
            onNext={goToNextMonth}
            onToday={goToToday}
            onChange={setSelectedMonth}
          />
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition-all"
          >
            <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Importar</span>
          </button>
          <button
            onClick={() => openNewTransaction()}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Novo
          </button>
        </div>
      </div>

      {/* Tabs + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/30" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 rounded-lg border border-white/10 bg-[#0d1527] px-3 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none pr-8 relative"
          >
            <option value="" className="bg-[#0d1527]">Todas categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name} className="bg-[#0d1527] text-white">{c.name}</option>
            ))}
          </select>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="h-9 rounded-lg border border-white/10 bg-[#0d1527] px-3 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none pr-8 relative"
          >
            <option value="" className="bg-[#0d1527]">Todas as Contas/Cartões</option>
            <option disabled className="bg-[#0d1527] text-white/20">—— Contas ——</option>
            {accounts.map((a) => <option key={a.id} value={a.id} className="bg-[#0d1527] text-white">{a.name}</option>)}
            <option disabled className="bg-[#0d1527] text-white/20">—— Cartões ——</option>
            {creditCards.map((c) => <option key={c.id} value={c.id} className="bg-[#0d1527] text-white">{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Transactions List / Table */}
      <div className="space-y-4">
        {/* Mobile List View */}
        <div className="md:hidden space-y-3">
          {sortedTransactions.map((tx) => (
            <div 
              key={tx.id} 
              className={`p-4 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col gap-3 ${selectedIds.includes(tx.id) ? 'border-blue-500/50 bg-blue-500/[0.03]' : ''}`}
              onClick={() => handleSelectOne(tx.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(tx.id)}
                    onChange={(e) => { e.stopPropagation(); handleSelectOne(tx.id); }}
                    className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                  />
                  <span className="text-xs text-white/40 tabular-nums">
                    {format(parseISO(tx.date), 'dd/MM/yyyy')}
                  </span>
                </div>
                <div className={`text-sm font-bold tabular-nums ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'INCOME' ? '+' : '-'}{Money.fromCents(tx.amountCents).format()}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-white/90">{tx.description}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-white/40 px-1.5 py-0.5 rounded bg-white/5">{getCategoryName(tx)}</span>
                  {(() => {
                    const card = tx.creditCardId ? creditCards.find(c => c.id === tx.creditCardId) : null;
                    const account = !tx.creditCardId ? accounts.find(a => a.id === tx.accountId) : null;
                    const entity = card || account;
                    return <span className="text-[10px] text-white/40">{entity?.name}</span>;
                  })()}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleStatus(tx); }}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    tx.status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {tx.status === 'PAID' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {tx.status === 'PAID' ? 'Pago' : 'Pendente'}
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(tx); }} className="p-2 rounded-lg hover:bg-white/5 text-white/40"><Pencil className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(tx); }} className="p-2 rounded-lg hover:bg-red-500/5 text-white/40 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {sortedTransactions.length === 0 && (
            <div className="py-12 text-center text-white/30 text-sm">Nenhum lançamento encontrado</div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left w-10">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedIds.length === sortedTransactions.length && sortedTransactions.length > 0}
                      className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/50" 
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">
                      Data {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('currentInstallment')}>
                    <div className="flex items-center gap-1">
                      Parcela {sortConfig.key === 'currentInstallment' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('type')}>
                    <div className="flex items-center gap-1">
                      Tipo {sortConfig.key === 'type' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('categoryName')}>
                    <div className="flex items-center gap-1">
                      Categoria {sortConfig.key === 'categoryName' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('description')}>
                    <div className="flex items-center gap-1">
                      Descrição {sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('accountName')}>
                    <div className="flex items-center gap-1">
                      Conta/Cartão {sortConfig.key === 'accountName' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('amountCents')}>
                    <div className="flex items-center justify-end gap-1">
                      Valor {sortConfig.key === 'amountCents' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white/40 uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center justify-center gap-1">
                      Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-20" />}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white/40 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedTransactions.map((tx) => (
                  <tr key={tx.id} className={`hover:bg-white/[0.02] transition-colors group ${selectedIds.includes(tx.id) ? 'bg-blue-500/[0.03]' : ''}`}>
                    <td className="px-4 py-3 text-left">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(tx.id)}
                        onChange={() => handleSelectOne(tx.id)}
                        className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                      />
                    </td>
                    <td className="px-4 py-3 text-white/60 tabular-nums">
                      {tx.date.includes('T')
                        ? format(parseISO(tx.date), 'dd/MM/yyyy HH:mm')
                        : format(parseISO(tx.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">{formatInstallment(tx)}</td>
                    <td className="px-4 py-3">
                      {tx.expenseType ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          tx.expenseType === 'FIXA'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {tx.expenseType === 'FIXA' ? 'Fixa' : 'Variável'}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          tx.type === 'INCOME'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-white/5 text-white/40'
                        }`}>
                          {tx.type === 'INCOME' ? 'Receita' : 'Despesa'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs">{getCategoryName(tx)}</td>
                    <td className="px-4 py-3 text-white/80 font-medium">{tx.description}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const card = tx.creditCardId ? creditCards.find(c => c.id === tx.creditCardId) : null;
                        const account = !tx.creditCardId ? accounts.find(a => a.id === tx.accountId) : null;
                        const entity = card || account;
                        const color = entity?.color || '#6B7280';
                        
                        return (
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border"
                            style={{ 
                              backgroundColor: color + '15', 
                              color: color,
                              borderColor: color + '30'
                            }}
                          >
                            {entity?.name || '—'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${
                      tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{Money.fromCents(tx.amountCents).format()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleStatus(tx)} title="Alternar status"
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                          tx.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                        }`}>
                        {tx.status === 'PAID' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {tx.status === 'PAID' ? 'Pago' : 'Pendente'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {tx.status === 'PENDING' && (
                          <button onClick={() => handlePostpone(tx)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-white/40 hover:text-blue-400 transition-colors" title="Adiar para mês seguinte">
                            <CalendarClock className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleEdit(tx)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors" title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(tx)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors" title="Excluir">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-white/30">
                      Nenhum lançamento encontrado neste mês
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Totals */}
          <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
            <span className="text-xs text-white/40">{filteredTransactions.length} lançamentos</span>
            <div className="flex gap-6">
              <span className="text-xs text-emerald-400 font-semibold tabular-nums">
                Receitas: {Money.fromCents(totalIncome).format()}
              </span>
              <span className="text-xs text-red-400 font-semibold tabular-nums">
                Despesas: {Money.fromCents(totalExpense).format()}
              </span>
            </div>
          </div>
        </div>
      </div>

        {/* Floating Batch Actions */}
        {selectedIds.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-[#161e31] border border-blue-500/50 rounded-2xl shadow-2xl shadow-blue-500/20 animate-in fade-in slide-in-from-bottom-4">
            <div className="px-3 border-r border-white/10">
              <span className="text-xs font-bold text-blue-400">{selectedIds.length} selecionados</span>
            </div>
            
            <div className="flex items-center gap-1 p-1">
              <button 
                onClick={() => handleBatchMoveMonth(1)}
                className="flex items-center gap-2 h-9 px-3 rounded-xl hover:bg-white/5 text-white/70 text-xs font-semibold transition-all"
                title="Mover para mês seguinte"
              >
                <CalendarDays className="w-3.5 h-3.5" /> Mês Seguinte
              </button>

              <div className="w-px h-4 bg-white/10 mx-1" />

              <div className="relative group">
                <button className="flex items-center gap-2 h-9 px-3 rounded-xl hover:bg-white/5 text-white/70 text-xs font-semibold transition-all">
                  <CreditCardIcon className="w-3.5 h-3.5" /> Trocar Cartão
                </button>
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 bg-[#0d1527] border border-white/10 rounded-xl shadow-2xl p-2 z-[100]">
                  <p className="text-[10px] font-bold text-white/30 uppercase px-2 mb-1">Escolha o destino</p>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    {accounts.map(a => (
                      <button key={a.id} onClick={() => handleBatchChangeCard(a.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-white/70 truncate">
                        {a.name}
                      </button>
                    ))}
                    <div className="h-px bg-white/5 my-1" />
                    {creditCards.map(c => (
                      <button key={c.id} onClick={() => handleBatchChangeCard(c.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-white/70 truncate">
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-px h-4 bg-white/10 mx-1" />

              <button 
                onClick={handleBatchDelete}
                className="flex items-center gap-2 h-9 px-3 rounded-xl hover:bg-red-500/10 text-red-400 text-xs font-semibold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>

              <div className="w-px h-4 bg-white/10 mx-1" />

              <button 
                onClick={() => setSelectedIds([])}
                className="h-9 px-3 rounded-xl hover:bg-white/5 text-white/40 text-xs font-semibold transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      

      <PaymentModal
        isOpen={showPaymentModal.isOpen}
        onClose={() => setShowPaymentModal({ isOpen: false, tx: null })}
        transaction={showPaymentModal.tx}
      />

      <ImportTransactionsModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)}
        defaultDestinationType="ACCOUNT"
      />
    </div>
  );
};
