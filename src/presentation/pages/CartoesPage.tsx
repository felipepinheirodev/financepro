import React, { useState } from 'react';
import { useFinanceContext } from '../../application/hooks/useFinanceData';
import { MonthNavigator } from '../components/MonthNavigator';
import { Money } from '../../domain/value-objects/Money';
import { CreditCard as CreditCardIcon, ChevronDown, ChevronUp, Upload, CheckCircle, Pencil, Trash2, Check, Clock, CalendarClock, Plus, Copy, TrendingDown, Wallet } from 'lucide-react';
import { format, parseISO, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ImportTransactionsModal } from '../components/ImportTransactionsModal';
import { PaymentModal } from '../components/PaymentModal';

export const CartoesPage: React.FC = () => {
  const {
    creditCards,
    transactions,
    allTransactions,
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

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState<{ isOpen: boolean; tx: any | null; cardInvoice?: { cardId: string; name: string } }>({ isOpen: false, tx: null });
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'asc' });

  const handleCopyTransactions = (txs: any[], cardName: string) => {
    const text = txs.map(tx => {
      const date = format(parseISO(tx.date), 'dd/MM/yyyy');
      const amount = Money.fromCents(tx.amountCents).format();
      const type = tx.type === 'INCOME' ? 'Receita' : 'Despesa';
      const status = tx.status === 'PAID' ? 'Pago' : 'Pendente';
      return `${date} | ${tx.description} | ${amount} | ${type} | ${status}`;
    }).join('\n');
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 15);
    navigator.clipboard.writeText(`Extrato ${cardName} - ${format(date, 'MMMM/yyyy', { locale: ptBR })}:\n${text}`);
  };

  const getCardTransactions = (cardId: string) =>
    transactions.filter((t) => t.creditCardId === cardId);

  const getCardTotal = (cardId: string) =>
    getCardTransactions(cardId).reduce((acc, t) => {
      return t.type === 'INCOME' ? acc - t.amountCents : acc + t.amountCents;
    }, 0);

  const getCardUsedCredit = (cardId: string) =>
    allTransactions
      .filter((t) => t.creditCardId === cardId && t.status === 'PENDING')
      .reduce((acc, t) => {
        return t.type === 'INCOME' ? acc - t.amountCents : acc + t.amountCents;
      }, 0);

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const handleEdit = (tx: any) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const toggleStatus = async (tx: any) => {
    if (tx.status === 'PENDING') {
      setShowPaymentModal({ isOpen: true, tx });
    } else {
      await updateTransaction(tx.id, { status: 'PENDING' });
    }
  };

  const handlePostpone = async (tx: any) => {
    const date = parseISO(tx.date);
    const newDate = format(addMonths(date, 1), 'yyyy-MM-dd');
    if (confirm(`Mover "${tx.description}" para o mês seguinte (${format(addMonths(date, 1), 'MMMM', { locale: ptBR })})?`)) {
      await updateTransaction(tx.id, { date: newDate });
    }
  };

  const confirmPayment = async (date: string) => {
    if (showPaymentModal.tx) {
      await updateTransaction(showPaymentModal.tx.id, {
        status: 'PAID',
        date: date,
      });
      setShowPaymentModal({ isOpen: false, tx: null });
    }
  };

  const handlePayFullBill = async (cardId: string, cardName: string) => {
    const pendingTxs = getCardTransactions(cardId).filter(t => t.status === 'PENDING');
    if (pendingTxs.length === 0) {
      alert('Não há lançamentos pendentes nesta fatura.');
      return;
    }

    setShowPaymentModal({ isOpen: true, tx: null, cardInvoice: { cardId, name: cardName } });
  };

  const totalInvoices = creditCards.reduce((acc, card) => acc + getCardTotal(card.id), 0);
  const totalUsed = creditCards.reduce((acc, card) => acc + getCardUsedCredit(card.id), 0);
  const totalLimit = creditCards.reduce((acc, card) => acc + card.limitCents, 0);
  const totalAvailable = Math.max(0, totalLimit - totalUsed);
  const totalPending = transactions
    .filter(t => t.creditCardId && t.status === 'PENDING')
    .reduce((acc, t) => t.type === 'INCOME' ? acc - t.amountCents : acc + t.amountCents, 0);

  const bigCards = [
    {
      label: 'Total das Faturas',
      value: totalInvoices,
      icon: <Wallet className="w-6 h-6" />,
      gradient: 'from-blue-500/20 to-blue-600/5',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      valueColor: 'text-blue-400',
    },
    {
      label: 'Crédito Disponível',
      value: totalAvailable,
      icon: <CreditCardIcon className="w-6 h-6" />,
      gradient: 'from-emerald-500/20 to-emerald-600/5',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      valueColor: 'text-emerald-400',
    },
    {
      label: 'Limite Total',
      value: totalLimit,
      icon: <Plus className="w-6 h-6" />,
      gradient: 'from-purple-500/20 to-purple-600/5',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      valueColor: 'text-purple-400',
    },
    {
      label: 'A Pagar no Mês',
      value: totalPending,
      icon: <TrendingDown className="w-6 h-6" />,
      gradient: 'from-red-500/20 to-red-600/5',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      valueColor: 'text-red-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cartões de Crédito</h1>
          <p className="text-sm text-white/40 mt-1">Faturas por mês e por cartão</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition-all"
          >
            <Upload className="w-4 h-4" /> Importar
          </button>
          <MonthNavigator selectedMonth={selectedMonth} onPrevious={goToPreviousMonth} onNext={goToNextMonth} onToday={goToToday} onChange={setSelectedMonth} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bigCards.map((card) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${card.gradient} p-5`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/50 font-medium uppercase tracking-wider">{card.label}</p>
                <h3 className={`text-2xl font-bold mt-2 ${card.valueColor}`}>
                  {Money.fromCents(card.value).format()}
                </h3>
              </div>
              <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                <span className={card.iconColor}>{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {creditCards.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <CreditCardIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/30">Nenhum cartão cadastrado</p>
          <p className="text-white/20 text-sm mt-1">Vá em Configurações para cadastrar seus cartões</p>
        </div>
      ) : (
        <div className="space-y-4">
          {creditCards.map((card) => {
            const cardTxs = getCardTransactions(card.id);
            const cardTotal = getCardTotal(card.id);
            const usedCredit = getCardUsedCredit(card.id);
            const available = Math.max(0, card.limitCents - usedCredit);
            const isExpanded = expandedCard === card.id;
            const usagePct = card.limitCents > 0 ? Math.min(100, (usedCredit / card.limitCents) * 100) : 0;
            const hasPending = cardTxs.some(t => t.status === 'PENDING');

            return (
              <div key={card.id} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between hover:bg-white/[0.01] transition-colors border-b border-white/5">
                  <button
                    onClick={() => toggleCard(card.id)}
                    className="flex-1 px-5 py-4 flex items-center gap-4 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (card.color || '#6B7280') + '20' }}>
                      <CreditCardIcon className="w-5 h-5" style={{ color: card.color || '#6B7280' }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white/90">{card.name}</h3>
                      <p className="text-xs text-white/40">
                        Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                      </p>
                    </div>
                  </button>

                  <div className="px-5 py-4 flex items-center gap-6 bg-white/[0.01] sm:bg-transparent">
                    <div className="text-right">
                      <p className="text-xs text-white/40">Fatura do mês</p>
                      <p className="text-lg font-bold text-red-400 tabular-nums">
                        {Money.fromCents(cardTotal).format()}
                      </p>
                    </div>
                    
                    {hasPending && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePayFullBill(card.id, card.name); }}
                        className="flex items-center gap-2 h-9 px-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Pagar Fatura
                      </button>
                    )}

                    <button
                     onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingTransaction({ 
                          creditCardId: card.id, 
                          type: 'EXPENSE', 
                          date: new Date().toISOString().split('T')[0],
                          status: 'PENDING'
                        } as any); 
                        setIsTransactionModalOpen(true); 
                      }}
                      className="flex items-center gap-2 h-9 px-3 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all border border-blue-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" /> Nova
                    </button>

                    <div className="text-right hidden md:block">
                      <p className="text-xs text-white/40">Disponível</p>
                      <p className="text-sm font-semibold text-emerald-400 tabular-nums">
                        {Money.fromCents(available).format()}
                      </p>
                    </div>
                    <button onClick={() => toggleCard(card.id)} className="p-2">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-white/30" /> : <ChevronDown className="w-5 h-5 text-white/30" />}
                    </button>
                  </div>
                </div>

                <div className="px-5 pb-3">
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${usagePct}%`,
                        backgroundColor: usagePct > 80 ? '#EF4444' : usagePct > 50 ? '#F59E0B' : card.color || '#3B82F6',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-white/30">Usado: {Money.fromCents(usedCredit).format()}</span>
                    <span className="text-[10px] text-white/30">Limite: {Money.fromCents(card.limitCents).format()}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/5 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-5 py-3 text-left text-xs font-semibold text-white/40 uppercase">Data</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-white/40 uppercase">Parcela</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-white/40 uppercase">Descrição</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-white/40 uppercase">Valor</th>
                          <th className="px-5 py-3 text-center text-xs font-semibold text-white/40 uppercase">Status</th>
                          <th className="px-5 py-3 text-center text-xs font-semibold text-white/40 uppercase">
                            <div className="flex items-center justify-center gap-2">
                              Ações
                              <button 
                                onClick={() => handleCopyTransactions(cardTxs, card.name)}
                                className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-blue-400 transition-all"
                                title="Copiar transações para LLM"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {cardTxs.map((tx) => (
                          <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-5 py-3 text-white/60 tabular-nums text-xs">
                              {format(parseISO(tx.date), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-5 py-3 text-white/50 text-xs">
                              {tx.isInstallment && tx.currentInstallment && tx.totalInstallments
                                ? `${tx.currentInstallment}|${tx.totalInstallments}`
                                : '1|1'}
                            </td>
                            <td className="px-5 py-3 text-white/80 font-medium">{tx.description}</td>
                            <td className={`px-5 py-3 text-right font-semibold tabular-nums ${
                              tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {tx.type === 'INCOME' ? '+' : '-'}{Money.fromCents(tx.amountCents).format()}
                            </td>
                            <td className="px-5 py-3 text-center">
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
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handlePostpone(tx)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-white/40 hover:text-blue-400 transition-colors" title="Adiar para mês seguinte">
                                  <CalendarClock className="w-3.5 h-3.5" />
                                </button>
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
                        {cardTxs.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-5 py-8 text-center text-white/30 text-sm">
                              Nenhum lançamento neste mês
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ImportTransactionsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />


      <PaymentModal
        isOpen={showPaymentModal.isOpen}
        onClose={() => setShowPaymentModal({ isOpen: false, tx: null })}
        transaction={showPaymentModal.tx}
        cardInvoice={showPaymentModal.cardInvoice}
      />
    </div>
  );
};
