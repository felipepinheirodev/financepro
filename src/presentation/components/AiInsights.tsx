import React, { useState } from 'react';
import { Sparkles, Loader2, BrainCircuit, Lightbulb } from 'lucide-react';
import { ApiRepository } from '../../infrastructure/repositories/ApiRepository';
import { useFinanceContext } from '../../application/hooks/useFinanceData';

export const AiInsights: React.FC = () => {
  const { 
    transactions, 
    accounts, 
    categories, 
    selectedMonth, 
    isCategorizing, 
    isClassifying,
    categorizeAllWithAI,
    classifyAllWithAI 
  } = useFinanceContext();
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pré-calcula os totais para a IA não errar a matemática
      const totalsByCategory: Record<string, number> = {};
      let totalIncome = 0;
      let totalExpense = 0;

      transactions.forEach(t => {
        const amount = t.amountCents / 100;
        if (t.type === 'INCOME') {
          totalIncome += amount;
        } else {
          totalExpense += amount;
          const cat = t.category || 'Sem Categoria';
          totalsByCategory[cat] = (totalsByCategory[cat] || 0) + amount;
        }
      });

      const context = {
        month: selectedMonth,
        summary: {
          totalIncome: totalIncome.toFixed(2),
          totalExpense: totalExpense.toFixed(2),
          netResult: (totalIncome - totalExpense).toFixed(2),
          categoriesBreakdown: Object.entries(totalsByCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([name, total]) => ({ name, total: total.toFixed(2) }))
        },
        accounts: accounts.map(a => ({ name: a.name, balance: (a.initialBalanceCents / 100).toFixed(2) })),
        recentTransactions: transactions.slice(-30).map(t => ({
          date: t.date,
          description: t.description,
          amount: (t.amountCents / 100).toFixed(2),
          type: t.type,
          category: t.category
        }))
      };
      const res = await ApiRepository.getAiInsights(JSON.stringify(context));
      setInsights(res.insights);
    } catch (err: any) {
      setError('Erro ao gerar análise: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-500/10 bg-gradient-to-br from-blue-500/10 to-purple-600/5 overflow-hidden shadow-xl shadow-blue-500/5">
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20">
            <BrainCircuit className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Consultor IA</h2>
            <p className="text-xs text-white/40">Insights estratégicos sobre suas finanças</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {transactions.some(t => t.category === 'Importado' || t.category === 'Outros') && !insights && !loading && (
            <button
              onClick={categorizeAllWithAI}
              disabled={isCategorizing || isClassifying}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-semibold transition-all hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {isCategorizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Categorizar Pendentes
            </button>
          )}
          {transactions.some(t => !t.expenseType && t.type === 'EXPENSE') && !insights && !loading && (
            <button
              onClick={classifyAllWithAI}
              disabled={isCategorizing || isClassifying}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 text-sm font-semibold transition-all hover:bg-orange-500/20 disabled:opacity-50"
            >
              {isClassifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Classificar Fixas/Variáveis
            </button>
          )}
          {!insights && !loading && (
            <button
              onClick={generateInsights}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Analisar
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              <div className="absolute inset-0 blur-lg bg-blue-400/20 animate-pulse" />
            </div>
            <p className="text-sm text-white/40 font-medium">Analisando seus dados e preparando dicas...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
            <span className="shrink-0 text-lg">⚠️</span>
            <p>{error}</p>
          </div>
        ) : insights ? (
          <div className="space-y-6">
            <div className="prose prose-invert max-w-none">
              <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-sans bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                {insights}
              </div>
            </div>
            <button
              onClick={generateInsights}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors flex items-center gap-1.5 uppercase tracking-wider px-2 py-1 rounded-lg hover:bg-blue-400/10"
            >
              <Sparkles className="w-3.5 h-3.5" /> Gerar nova análise
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Lightbulb className="w-8 h-8 text-white/10" />
            </div>
            <div className="max-w-xs">
              <p className="text-sm font-medium text-white/50">Pronto para otimizar seus gastos?</p>
              <p className="text-xs text-white/30 mt-1">
                A IA analisará suas transações de {selectedMonth} para sugerir economias e projeções.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
