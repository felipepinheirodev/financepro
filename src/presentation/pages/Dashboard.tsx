import React from 'react';
import { useFinanceContext } from '../../application/hooks/useFinanceData';
import { MonthNavigator } from '../components/MonthNavigator';
import { Money } from '../../domain/value-objects/Money';
import {
  CreditCard,
  TrendingDown,
  TrendingUp,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Plus,
} from 'lucide-react';
import { AiInsights } from '../components/AiInsights';
import { ImportTransactionsModal } from '../components/ImportTransactionsModal';
import { Upload } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    accounts,
    transactions,
    allTransactions,
    creditCards,
    categories,
    selectedMonth,
    setSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    previousMonthResult,
    openNewTransaction,
  } = useFinanceContext();

  const [showImportModal, setShowImportModal] = React.useState(false);

  // Calculate month-specific big numbers
  const monthIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amountCents, 0);

  const monthExpenses = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amountCents, 0);

  const monthResult = previousMonthResult + monthIncome - monthExpenses;

  const openDebit = transactions
    .filter((t) => t.type === 'EXPENSE' && t.status === 'PENDING')
    .reduce((acc, t) => acc + t.amountCents, 0);

  const totalCreditLimit = creditCards.reduce((acc, c) => acc + c.limitCents, 0);
  const usedCredit = allTransactions
    .filter((t) => t.creditCardId && t.status === 'PENDING')
    .reduce((acc, t) => {
      return t.type === 'INCOME' ? acc - t.amountCents : acc + t.amountCents;
    }, 0);
  const availableCredit = Math.max(0, totalCreditLimit - usedCredit);

  // Calculate current balance per account
  const getAccountBalance = (accountId: string, initialBalance: number) => {
    const accountTxs = allTransactions.filter(t => t.accountId === accountId && !t.creditCardId);
    const balance = accountTxs.reduce((acc, t) => {
      return t.type === 'INCOME' ? acc + t.amountCents : acc - t.amountCents;
    }, initialBalance);
    return balance;
  };

  // Expenses by category
  const expByCategory = new Map<string, number>();
  transactions
    .filter((t) => t.type === 'EXPENSE')
    .forEach((t) => {
      const catName = t.category || 'Outros';
      expByCategory.set(catName, (expByCategory.get(catName) || 0) + t.amountCents);
    });
  const sortedCategories = [...expByCategory.entries()].sort((a, b) => b[1] - a[1]);
  const maxCatValue = sortedCategories[0]?.[1] || 1;

  // Fixed vs Variable
  const fixedTotal = transactions
    .filter((t) => t.type === 'EXPENSE' && t.expenseType === 'FIXA')
    .reduce((acc, t) => acc + t.amountCents, 0);
  const variableTotal = transactions
    .filter((t) => t.type === 'EXPENSE' && t.expenseType === 'VARIAVEL')
    .reduce((acc, t) => acc + t.amountCents, 0);
  const uncategorizedTotal = monthExpenses - fixedTotal - variableTotal;

  const bigCards = [
    {
      label: 'Crédito Disponível',
      value: availableCredit,
      icon: <CreditCard className="w-6 h-6" />,
      gradient: 'from-blue-500/20 to-blue-600/5',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      valueColor: 'text-blue-400',
    },
    {
      label: 'Débito em Aberto',
      value: openDebit,
      icon: <TrendingDown className="w-6 h-6" />,
      gradient: 'from-red-500/20 to-red-600/5',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      valueColor: 'text-red-400',
    },
    {
      label: 'Resultado do Mês',
      value: monthResult,
      icon: <Wallet className="w-6 h-6" />,
      gradient: monthResult >= 0 ? 'from-emerald-500/20 to-emerald-600/5' : 'from-orange-500/20 to-orange-600/5',
      iconBg: monthResult >= 0 ? 'bg-emerald-500/20' : 'bg-orange-500/20',
      iconColor: monthResult >= 0 ? 'text-emerald-400' : 'text-orange-400',
      valueColor: monthResult >= 0 ? 'text-emerald-400' : 'text-orange-400',
    },
    {
      label: 'Saldo Mês Anterior',
      value: previousMonthResult,
      icon: <PiggyBank className="w-6 h-6" />,
      gradient: 'from-purple-500/20 to-purple-600/5',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      valueColor: 'text-purple-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Visão geral das suas finanças</p>
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
            <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Holerite</span>
          </button>
          <button
            onClick={() => openNewTransaction()}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* Big Number Cards */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts Balance */}
        <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Saldo Contas</h2>
          </div>
          <div className="divide-y divide-white/5">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: acc.color || '#6B7280' }} />
                  <span className="text-sm text-white/70">{acc.name}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums">{Money.fromCents(getAccountBalance(acc.id, acc.initialBalanceCents)).format()}</span>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="px-5 py-8 text-center text-white/30 text-sm">Nenhuma conta cadastrada</div>
            )}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-white/40" />
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Gastos por Categoria</h2>
          </div>
          <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
            {sortedCategories.map(([catName, amount]) => {
              const cat = categories.find((c) => c.name === catName);
              const pct = (amount / maxCatValue) * 100;
              return (
                <div key={catName}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/60">{catName}</span>
                    <span className="text-xs font-semibold text-white/80 tabular-nums">
                      {Money.fromCents(amount).format()}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: cat?.color || '#6B7280',
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {sortedCategories.length === 0 && (
              <div className="text-center text-white/30 text-sm py-8">Sem despesas no mês</div>
            )}
          </div>
        </div>

        {/* Fixed vs Variable Summary */}
        <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Resumo do Mês</h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Income */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-3">
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-white/70">Receitas</span>
              </div>
              <span className="text-sm font-bold text-emerald-400 tabular-nums">
                {Money.fromCents(monthIncome).format()}
              </span>
            </div>

            {/* Fixed Expenses */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
              <div className="flex items-center gap-3">
                <ArrowDownRight className="w-5 h-5 text-red-400" />
                <span className="text-sm text-white/70">Despesas Fixas</span>
              </div>
              <span className="text-sm font-bold text-red-400 tabular-nums">
                {Money.fromCents(fixedTotal).format()}
              </span>
            </div>

            {/* Variable Expenses */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
              <div className="flex items-center gap-3">
                <ArrowDownRight className="w-5 h-5 text-orange-400" />
                <span className="text-sm text-white/70">Despesas Variáveis</span>
              </div>
              <span className="text-sm font-bold text-orange-400 tabular-nums">
                {Money.fromCents(variableTotal).format()}
              </span>
            </div>

            {uncategorizedTotal > 0 && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <ArrowDownRight className="w-5 h-5 text-white/40" />
                  <span className="text-sm text-white/70">Sem classificação</span>
                </div>
                <span className="text-sm font-bold text-white/60 tabular-nums">
                  {Money.fromCents(uncategorizedTotal).format()}
                </span>
              </div>
            )}

            {/* Divider + Total */}
            <div className="border-t border-white/5 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white/80">Total Despesas</span>
                <span className="text-base font-bold text-red-400 tabular-nums">
                  {Money.fromCents(monthExpenses).format()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      <AiInsights />
      <ImportTransactionsModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)}
        defaultDestinationType="ACCOUNT"
      />
    </div>
  );
};
