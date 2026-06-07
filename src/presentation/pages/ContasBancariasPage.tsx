import React, { useState } from 'react';
import { useFinanceContext } from '../../application/hooks/useFinanceData';
import { MonthNavigator } from '../components/MonthNavigator';
import { Money } from '../../domain/value-objects/Money';
import { Landmark, ChevronDown, ChevronUp, Upload, Pencil, Trash2, Check, Clock, Plus, Copy, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ImportTransactionsModal } from '../components/ImportTransactionsModal';
import { PaymentModal } from '../components/PaymentModal';

export const ContasBancariasPage: React.FC = () => {
  const {
    accounts,
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

  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState<{ isOpen: boolean; tx: any | null }>({ isOpen: false, tx: null });

  const bankAccounts = accounts.filter(acc => acc.type !== 'CREDIT_CARD');

  const handleCopyTransactions = (txs: any[], accountName: string) => {
    const text = txs.map(tx => {
      const date = format(parseISO(tx.date), 'dd/MM/yyyy');
      const amount = Money.fromCents(tx.amountCents).format();
      const type = tx.type === 'INCOME' ? 'Receita' : 'Despesa';
      const status = tx.status === 'PAID' ? 'Pago' : 'Pendente';
      return `${date} | ${tx.description} | ${amount} | ${type} | ${status}`;
    }).join('\n');
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 15);
    navigator.clipboard.writeText(`Extrato ${accountName} - ${format(date, 'MMMM/yyyy', { locale: ptBR })}:\n${text}`);
  };

  const getAccountTransactions = (accountId: string) =>
    transactions.filter((t) => t.accountId === accountId && !t.creditCardId);

  const getAccountBalanceAtMonth = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 0;

    let balance = account.initialBalanceCents;
    
    // Sum all transactions BEFORE or IN the current month
    const monthStr = selectedMonth;
    
    allTransactions.forEach(t => {
      if (t.accountId === accountId && !t.creditCardId && t.date <= `${monthStr}-31`) {
        if (t.type === 'INCOME') balance += t.amountCents;
        else balance -= t.amountCents;
      }
    });

    return balance;
  };

  const toggleAccount = (accountId: string) => {
    setExpandedAccount(expandedAccount === accountId ? null : accountId);
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

  const confirmPayment = async (date: string) => {
    // Replaced by PaymentModal
  };

  const totalBalance = bankAccounts.reduce((acc, acc_item) => acc + getAccountBalanceAtMonth(acc_item.id), 0);
  const monthIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amountCents, 0);
  const monthExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amountCents, 0);
  const monthResult = monthIncome - monthExpenses;

  const bigCards = [
    {
      label: 'Saldo Total',
      value: totalBalance,
      icon: <Landmark className="w-6 h-6" />,
      gradient: totalBalance >= 0 ? 'from-emerald-500/20 to-emerald-600/5' : 'from-red-500/20 to-red-600/5',
      iconBg: totalBalance >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20',
      iconColor: totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400',
      valueColor: totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: 'Receitas no Mês',
      value: monthIncome,
      icon: <TrendingUp className="w-6 h-6" />,
      gradient: 'from-blue-500/20 to-blue-600/5',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      valueColor: 'text-blue-400',
    },
    {
      label: 'Despesas no Mês',
      value: monthExpenses,
      icon: <TrendingDown className="w-6 h-6" />,
      gradient: 'from-orange-500/20 to-orange-600/5',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      valueColor: 'text-orange-400',
    },
    {
      label: 'Resultado',
      value: monthResult,
      icon: <Wallet className="w-6 h-6" />,
      gradient: monthResult >= 0 ? 'from-emerald-500/20 to-emerald-600/5' : 'from-red-500/20 to-red-600/5',
      iconBg: monthResult >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20',
      iconColor: monthResult >= 0 ? 'text-emerald-400' : 'text-red-400',
      valueColor: monthResult >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas Bancárias</h1>
          <p className="text-sm text-white/40 mt-1">Saldos e lançamentos por conta</p>
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

      {bankAccounts.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <Landmark className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/30">Nenhuma conta cadastrada</p>
          <p className="text-white/20 text-sm mt-1">Vá em Configurações para cadastrar suas contas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bankAccounts.map((account) => {
            const accountTxs = getAccountTransactions(account.id);
            const balance = getAccountBalanceAtMonth(account.id);
            const isExpanded = expandedAccount === account.id;

            return (
              <div key={account.id} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between hover:bg-white/[0.01] transition-colors border-b border-white/5">
                  <button
                    onClick={() => toggleAccount(account.id)}
                    className="flex-1 px-5 py-4 flex items-center gap-4 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (account.color || '#6B7280') + '20' }}>
                      <Landmark className="w-5 h-5" style={{ color: account.color || '#6B7280' }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white/90">{account.name}</h3>
                      <p className="text-xs text-white/40">
                        {account.type === 'CHECKING' ? 'Conta Corrente' : account.type === 'SAVINGS' ? 'Poupança' : 'Carteira'}
                      </p>
                    </div>
                  </button>

                  <div className="px-5 py-4 flex items-center gap-6 bg-white/[0.01] sm:bg-transparent">
                    <div className="text-right">
                      <p className="text-xs text-white/40">Saldo no período</p>
                      <p className={`text-lg font-bold tabular-nums ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {Money.fromCents(balance).format()}
                      </p>
                    </div>
                    
                    <button
                     onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingTransaction({ 
                          accountId: account.id, 
                          type: 'EXPENSE', 
                          date: new Date().toISOString().split('T')[0],
                          status: 'PAID'
                        } as any); 
                        setIsTransactionModalOpen(true); 
                      }}
                      className="flex items-center gap-2 h-9 px-3 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all border border-blue-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" /> Nova
                    </button>

                    <button onClick={() => toggleAccount(account.id)} className="p-2">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-white/30" /> : <ChevronDown className="w-5 h-5 text-white/30" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/5 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-5 py-3 text-left text-xs font-semibold text-white/40 uppercase">Data</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-white/40 uppercase">Descrição</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-white/40 uppercase">Valor</th>
                          <th className="px-5 py-3 text-center text-xs font-semibold text-white/40 uppercase">Status</th>
                          <th className="px-5 py-3 text-center text-xs font-semibold text-white/40 uppercase">
                            <div className="flex items-center justify-center gap-2">
                              Ações
                              <button 
                                onClick={() => handleCopyTransactions(accountTxs, account.name)}
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
                        {accountTxs.map((tx) => (
                          <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-5 py-3 text-white/60 tabular-nums text-xs">
                              {format(parseISO(tx.date), 'dd/MM/yyyy')}
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
                                <button onClick={() => handleEdit(tx)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 text-white/80 transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={async () => { if(confirm('Excluir?')) await deleteTransaction(tx.id); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors" title="Excluir">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {accountTxs.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-5 py-8 text-center text-white/30 text-sm">
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
      />
    </div>
  );
};
