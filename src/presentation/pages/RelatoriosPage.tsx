import React, { useMemo } from 'react';
import { useFinanceContext } from '../../application/hooks/useFinanceData';
import { Money } from '../../domain/value-objects/Money';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const RelatoriosPage: React.FC = () => {
  const { allTransactions, accounts, creditCards } = useFinanceContext();
  const formatChartMoney = (value: unknown) => Money.fromCents(Math.round(Number(value || 0) * 100)).format();

  // 1. Processar dados dos últimos 6 meses para Fluxo de Caixa
  const cashFlowData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        name: format(date, 'MMM', { locale: ptBR }),
        rawDate: date,
        receitas: 0,
        despesas: 0,
        resultado: 0
      };
    });

    allTransactions.forEach(tx => {
      const txDate = parseISO(tx.date);
      months.forEach(m => {
        if (isWithinInterval(txDate, { start: startOfMonth(m.rawDate), end: endOfMonth(m.rawDate) })) {
          if (tx.type === 'INCOME') m.receitas += tx.amountCents / 100;
          else m.despesas += tx.amountCents / 100;
        }
      });
    });

    return months.map(m => ({
      ...m,
      resultado: m.receitas - m.despesas
    }));
  }, [allTransactions]);

  // 2. Gastos por Categoria (Mês Atual)
  const categoryData = useMemo(() => {
    const now = new Date();
    const data: Record<string, number> = {};
    
    allTransactions.forEach(tx => {
      const txDate = parseISO(tx.date);
      if (tx.type === 'EXPENSE' && isWithinInterval(txDate, { start: startOfMonth(now), end: endOfMonth(now) })) {
        const cat = tx.category || 'Outros';
        data[cat] = (data[cat] || 0) + tx.amountCents / 100;
      }
    });

    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allTransactions]);

  // 3. Fixo vs Variável
  const typeData = useMemo(() => {
    const now = new Date();
    let fixo = 0;
    let variavel = 0;

    allTransactions.forEach(tx => {
      const txDate = parseISO(tx.date);
      if (tx.type === 'EXPENSE' && isWithinInterval(txDate, { start: startOfMonth(now), end: endOfMonth(now) })) {
        if (tx.expenseType === 'FIXA') fixo += tx.amountCents / 100;
        else variavel += tx.amountCents / 100;
      }
    });

    return [
      { name: 'Fixo', value: fixo },
      { name: 'Variável', value: variavel }
    ];
  }, [allTransactions]);

  // 4. Totais Gerais
  const totalReceitas = cashFlowData[5].receitas;
  const totalDespesas = cashFlowData[5].despesas;
  const savingsRate = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 : 0;

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#6366f1'];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios Estratégicos</h1>
        <p className="text-sm text-white/40 mt-1">Análise detalhada da sua saúde financeira</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <ArrowUpCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Receita (Mês)</span>
          </div>
          <p className="text-xl font-bold tabular-nums">R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
          <div className="flex items-center gap-2 text-red-400">
            <ArrowDownCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Despesa (Mês)</span>
          </div>
          <p className="text-xl font-bold tabular-nums">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
          <div className="flex items-center gap-2 text-blue-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Taxa de Poupança</span>
          </div>
          <p className="text-xl font-bold tabular-nums">{savingsRate.toFixed(1)}%</p>
        </div>
        <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
          <div className="flex items-center gap-2 text-purple-400">
            <Wallet className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Resultado Líquido</span>
          </div>
          <p className="text-xl font-bold tabular-nums">R$ {(totalReceitas - totalDespesas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fluxo de Caixa */}
        <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-white/80">Fluxo de Caixa (6 meses)</h2>
          </div>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#ffffff40" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1527', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                  formatter={formatChartMoney}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categorias */}
        <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold text-white/80">Gastos por Categoria</h2>
          </div>
          <div className="h-[300px] w-full min-w-0 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1527', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  formatter={formatChartMoney}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-2">
              {categoryData.slice(0, 5).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-xs text-white/60 truncate max-w-[80px]">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-white/80">{Money.fromCents(Math.round(item.value * 100)).format()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fixo vs Variável */}
        <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
          <h2 className="text-sm font-semibold text-white/60 uppercase mb-6 tracking-wider">Fixo vs Variável</h2>
          <div className="h-[200px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  innerRadius={50}
                  outerRadius={70}
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f97316" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1527', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  formatter={formatChartMoney}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] text-white/40">Fixo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-[10px] text-white/40">Variável</span>
            </div>
          </div>
        </div>

        {/* Evolução de Resultado */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
          <h2 className="text-sm font-semibold text-white/60 uppercase mb-6 tracking-wider">Desempenho Líquido</h2>
          <div className="h-[200px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#ffffff40" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1527', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  formatter={formatChartMoney}
                />
                <Area type="monotone" dataKey="resultado" name="Resultado" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
