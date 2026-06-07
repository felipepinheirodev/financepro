import React, { useState, useEffect } from 'react';
import { useFinanceContext } from '../../application/hooks/useFinanceData';
import { ApiRepository, type AiConfig, type AiProvider, type AiTask, type AiUsageSummary } from '../../infrastructure/repositories/ApiRepository';
import { CryptoService } from '../../infrastructure/security/CryptoService';
import { Money } from '../../domain/value-objects/Money';
import { v4 as uuidv4 } from 'uuid';
import {
  Settings, Landmark, CreditCard, Tag, Repeat, Lock,
  Plus, Trash2, Eye, EyeOff, Key, Calendar, Pencil, Check, Brain, Save, RefreshCw, BarChart3
} from 'lucide-react';
import type { PasswordVaultEntry } from '../../domain/entities/PasswordVault';
import type { Account, AccountType } from '../../domain/entities/Account';

type ConfigTab = 'contas' | 'cartoes' | 'categorias' | 'recorrentes' | 'cofre' | 'ia';

export const ConfiguracoesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('contas');

  const tabs: { id: ConfigTab; label: string; icon: React.ReactNode }[] = [
    { id: 'contas', label: 'Contas', icon: <Landmark className="w-4 h-4" /> },
    { id: 'cartoes', label: 'Cartões', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'categorias', label: 'Categorias', icon: <Tag className="w-4 h-4" /> },
    { id: 'recorrentes', label: 'Recorrentes', icon: <Repeat className="w-4 h-4" /> },
    { id: 'cofre', label: 'Cofre', icon: <Lock className="w-4 h-4" /> },
    { id: 'ia', label: 'IA', icon: <Brain className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Settings className="w-6 h-6 text-white/40" /> Configurações
        </h1>
        <p className="text-sm text-white/40 mt-1">Gerencie contas, cartões, categorias e mais</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'contas' && <ContasTab />}
      {activeTab === 'cartoes' && <CartoesTab />}
      {activeTab === 'categorias' && <CategoriasTab />}
      {activeTab === 'recorrentes' && <RecorrentesTab />}
      {activeTab === 'cofre' && <CofreTab />}
      {activeTab === 'ia' && <IaTab />}
    </div>
  );
};

// ========== CONTAS TAB ==========
function ContasTab() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useFinanceContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const inputCls = 'w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50';
  const labelCls = 'text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5';

  const handleSave = async () => {
    if (!name.trim()) { alert('Por favor, informe o nome da conta.'); return; }
    if (!balance) { alert('Por favor, informe o saldo inicial.'); return; }
    const initialBalanceCents = Math.round(parseFloat(balance.replace(',', '.')) * 100);
    
    if (editingId) {
      await updateAccount(editingId, { name, type, initialBalanceCents, color });
    } else {
      await addAccount({ id: uuidv4(), name, type, initialBalanceCents, color });
    }
    reset();
  };

  const reset = () => {
    setEditingId(null); setName(''); setBalance(''); setType('CHECKING'); setColor('#3B82F6');
  };

  const handleEdit = (acc: Account) => {
    setEditingId(acc.id);
    setName(acc.name);
    setType(acc.type);
    setBalance((acc.initialBalanceCents / 100).toFixed(2));
    setColor(acc.color || '#3B82F6');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deletar esta conta? Lançamentos associados podem ser afetados.')) {
      await deleteAccount(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white/70">{editingId ? 'Editar Conta' : 'Nova Conta'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div><label className={labelCls}>Nome</label><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ex: Conta Nubank" /></div>
          <div><label className={labelCls}>Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value as AccountType)} className={inputCls}>
              <option value="CHECKING">Conta Corrente</option>
              <option value="SAVINGS">Poupança</option>
              <option value="WALLET">Carteira</option>
            </select>
          </div>
          <div><label className={labelCls}>Saldo Inicial (R$)</label><input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} className={inputCls} placeholder="0,00" /></div>
          <div className="flex items-end gap-2">
            <div className="flex-1"><label className={labelCls}>Cor</label><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-10 rounded-xl border border-white/10 bg-white/5 cursor-pointer" /></div>
            <button onClick={handleSave} className="h-10 px-4 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors">
              {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
            {editingId && <button onClick={reset} className="h-10 px-4 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 transition-colors">Cancelar</button>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
        {accounts.map((acc) => (
          <div key={acc.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color || '#6B7280' }} />
              <div>
                <p className="text-sm font-medium text-white/80">{acc.name}</p>
                <p className="text-xs text-white/40">{acc.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold tabular-nums">{Money.fromCents(acc.initialBalanceCents).format()}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(acc)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/80 transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(acc.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {accounts.length === 0 && <div className="px-5 py-8 text-center text-white/30 text-sm">Nenhuma conta cadastrada</div>}
      </div>
    </div>
  );
}

// ========== CARTOES TAB ==========
function CartoesTab() {
  const { accounts, creditCards, addCreditCard, updateCreditCard, deleteCreditCard } = useFinanceContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [limitStr, setLimitStr] = useState('');
  const [closingDay, setClosingDay] = useState(5);
  const [dueDay, setDueDay] = useState(12);
  const [color, setColor] = useState('#8A05BE');

  const inputCls = 'w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50';
  const labelCls = 'text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5';

  useEffect(() => {
    if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id);
  }, [accounts]);

  const handleSave = async () => {
    if (!name.trim()) { alert('Por favor, informe o nome do cartão.'); return; }
    if (!limitStr) { alert('Por favor, informe o limite do cartão.'); return; }
    if (!accountId) { alert('Por favor, selecione uma conta vinculada.'); return; }
    const limitCents = Math.round(parseFloat(limitStr.replace(',', '.')) * 100);
    
    if (editingId) {
      await updateCreditCard(editingId, { name, accountId, limitCents, closingDay, dueDay, color });
    } else {
      await addCreditCard({ id: uuidv4(), name, accountId, limitCents, closingDay, dueDay, color });
    }
    reset();
  };

  const reset = () => {
    setEditingId(null); setName(''); setLimitStr(''); setClosingDay(5); setDueDay(12); setColor('#8A05BE');
  };

  const handleEdit = (card: any) => {
    setEditingId(card.id);
    setName(card.name);
    setAccountId(card.accountId);
    setLimitStr((card.limitCents / 100).toFixed(2));
    setClosingDay(card.closingDay);
    setDueDay(card.dueDay);
    setColor(card.color || '#8A05BE');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deletar este cartão?')) {
      await deleteCreditCard(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white/70">{editingId ? 'Editar Cartão' : 'Novo Cartão de Crédito'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className={labelCls}>Nome</label><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ex: Itaú 2887" /></div>
          <div><label className={labelCls}>Conta Vinculada</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputCls}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Limite (R$)</label><input type="number" step="0.01" value={limitStr} onChange={(e) => setLimitStr(e.target.value)} className={inputCls} placeholder="0,00" /></div>
          <div><label className={labelCls}>Dia Fechamento</label><input type="number" min={1} max={31} value={closingDay} onChange={(e) => setClosingDay(parseInt(e.target.value))} className={inputCls} /></div>
          <div><label className={labelCls}>Dia Vencimento</label><input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(parseInt(e.target.value))} className={inputCls} /></div>
          <div className="flex items-end gap-2">
            <div className="flex-1"><label className={labelCls}>Cor</label><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-10 rounded-xl border border-white/10 bg-white/5 cursor-pointer" /></div>
            <button onClick={handleSave} className="h-10 px-4 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors">
              {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
            {editingId && <button onClick={reset} className="h-10 px-4 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 transition-colors">Cancelar</button>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
        {creditCards.map((card) => (
          <div key={card.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color || '#6B7280' }} />
              <div>
                <p className="text-sm font-medium text-white/80">{card.name}</p>
                <p className="text-xs text-white/40">Fecha dia {card.closingDay} · Vence dia {card.dueDay}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold tabular-nums">{Money.fromCents(card.limitCents).format()}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(card)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/80 transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(card.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {creditCards.length === 0 && <div className="px-5 py-8 text-center text-white/30 text-sm">Nenhum cartão cadastrado</div>}
      </div>
    </div>
  );
}

// ========== CATEGORIAS TAB ==========
function CategoriasTab() {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinanceContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const inputCls = 'w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50';
  const labelCls = 'text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5';

  const handleSave = async () => {
    if (!name.trim()) { alert('Por favor, informe o nome da categoria.'); return; }
    if (editingId) {
      await updateCategory(editingId, { name, color });
    } else {
      await addCategory({ name, color, icon: 'Tag' });
    }
    reset();
  };

  const reset = () => {
    setEditingId(null); setName(''); setColor('#3B82F6');
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setColor(cat.color || '#3B82F6');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white/70">{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className={labelCls}>Nome</label><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ex: Alimentação" /></div>
          <div><label className={labelCls}>Cor</label><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-10 rounded-xl border border-white/10 bg-white/5 cursor-pointer" /></div>
          <div className="flex items-end gap-2">
            <button onClick={handleSave} className="h-10 px-6 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2">
              {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingId ? 'Salvar' : 'Adicionar'}
            </button>
            {editingId && <button onClick={reset} className="h-10 px-4 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 transition-colors">Cancelar</button>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0 divide-x divide-y divide-white/5">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-sm text-white/70">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(cat)} className="p-1 rounded-lg hover:bg-white/10 text-white/20 hover:text-white/80 transition-colors"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => deleteCategory(cat.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== RECORRENTES TAB ==========
function RecorrentesTab() {
  const { accounts, creditCards, categories, recurringTemplates, addRecurringTemplate, updateRecurringTemplate, generateRecurringBatch, batchDeleteRecurring } = useFinanceContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [expenseType, setExpenseType] = useState<'FIXA' | 'VARIAVEL'>('FIXA');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState(1);

  const inputCls = 'w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50';
  const labelCls = 'text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5';

  useEffect(() => {
    if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id);
  }, [accounts]);

  const handleSave = async () => {
    if (!description.trim()) { alert('Por favor, informe a descrição do recorrente.'); return; }
    if (!amountStr) { alert('Por favor, informe o valor.'); return; }
    if (!accountId) { alert('Por favor, selecione uma conta.'); return; }
    const data = {
      description,
      amountCents: Math.round(parseFloat(amountStr.replace(',', '.')) * 100),
      type,
      expenseType: type === 'EXPENSE' ? expenseType : undefined,
      categoryId: categoryId || undefined,
      accountId,
      frequency: 'MONTHLY',
      dayOfMonth,
      isActive: true,
    };

    if (editingId) {
      await updateRecurringTemplate(editingId, data);
    } else {
      await addRecurringTemplate(data);
    }
    reset();
  };

  const reset = () => {
    setEditingId(null); setDescription(''); setAmountStr(''); setDayOfMonth(1); setType('EXPENSE'); setExpenseType('FIXA'); setCategoryId('');
  };

  const handleEdit = (tpl: any) => {
    setEditingId(tpl.id);
    setDescription(tpl.description);
    setAmountStr((tpl.amountCents / 100).toFixed(2));
    setType(tpl.type);
    setExpenseType(tpl.expenseType || 'FIXA');
    setCategoryId(tpl.categoryId || '');
    setAccountId(tpl.accountId || (accounts[0]?.id || ''));
    setDayOfMonth(tpl.dayOfMonth || 1);
  };

  const handleGenerate = async (id: string) => {
    const until = prompt('Gerar lançamentos até qual data? (YYYY-MM-DD)', '2026-12-31');
    if (!until) return;
    await generateRecurringBatch(id, until);
    alert('Lançamentos gerados com sucesso!');
  };

  const handleBatchDelete = async (id: string) => {
    const scope = confirm('Deletar TODOS os lançamentos deste recorrente?\n\nOK = Todos\nCancelar = Apenas futuros')
      ? 'ALL' : 'FUTURE_ONLY';
    await batchDeleteRecurring(id, scope);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white/70">{editingId ? 'Editar Template Recorrente' : 'Novo Template Recorrente'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className={labelCls}>Descrição</label><input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="Ex: Aluguel" /></div>
          <div><label className={labelCls}>Valor (R$)</label><input type="number" step="0.01" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} className={inputCls} placeholder="0,00" /></div>
          <div><label className={labelCls}>Dia do Mês</label><input type="number" min={1} max={31} value={dayOfMonth} onChange={(e) => setDayOfMonth(parseInt(e.target.value))} className={inputCls} /></div>
          <div><label className={labelCls}>Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value as 'INCOME' | 'EXPENSE')} className={inputCls}>
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>
          </div>
          {type === 'EXPENSE' && (
            <div><label className={labelCls}>Classificação</label>
              <select value={expenseType} onChange={(e) => setExpenseType(e.target.value as 'FIXA' | 'VARIAVEL')} className={inputCls}>
                <option value="FIXA">Fixa</option>
                <option value="VARIAVEL">Variável</option>
              </select>
            </div>
          )}
          <div><label className={labelCls}>Categoria</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              <option value="">Nenhuma</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Conta</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputCls}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={handleSave} className="h-10 px-6 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2">
              {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingId ? 'Salvar' : 'Criar'}
            </button>
            {editingId && <button onClick={reset} className="h-10 px-4 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 transition-colors">Cancelar</button>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
        {recurringTemplates.map((tpl) => (
          <div key={tpl.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors group">
            <div>
              <p className="text-sm font-medium text-white/80">{tpl.description}</p>
              <p className="text-xs text-white/40">
                {tpl.type === 'INCOME' ? 'Receita' : `Despesa ${tpl.expenseType || ''}`} · Dia {tpl.dayOfMonth} · {tpl.transactions?.length || 0} lançamentos gerados
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold tabular-nums ${tpl.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                {Money.fromCents(tpl.amountCents).format()}
              </span>
              <button onClick={() => handleGenerate(tpl.id)} className="h-8 px-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors flex items-center gap-1"><Calendar className="w-3 h-3" /> Gerar Lote</button>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(tpl)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/80 transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleBatchDelete(tpl.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {recurringTemplates.length === 0 && <div className="px-5 py-8 text-center text-white/30 text-sm">Nenhum recorrente cadastrado</div>}
      </div>
    </div>
  );
}

// ========== COFRE TAB ==========
function CofreTab() {
  const { updatePasswordVaultEntry } = useFinanceContext();
  const [entries, setEntries] = useState<PasswordVaultEntry[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [bankName, setBankName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const inputCls = 'w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50';
  const labelCls = 'text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5';

  const loadEntries = async () => {
    const data = await ApiRepository.getPasswordVault();
    setEntries(data);
  };

  useEffect(() => { loadEntries(); }, []);

  const handleSave = async () => {
    if (!bankName.trim()) { alert('Por favor, informe o nome do banco ou serviço.'); return; }
    if (!password) { alert('Por favor, informe a senha.'); return; }
    const data = {
      bankName,
      login: login || undefined,
      encryptedPassword: CryptoService.encrypt(password),
    };

    if (editingId) {
      await updatePasswordVaultEntry(editingId, data);
    } else {
      await ApiRepository.savePasswordVaultEntry({ id: uuidv4(), ...data });
    }
    reset();
    await loadEntries();
  };

  const reset = () => {
    setEditingId(null); setBankName(''); setLogin(''); setPassword('');
  };

  const handleEdit = (entry: any) => {
    setEditingId(entry.id);
    setBankName(entry.bankName);
    setLogin(entry.login || '');
    setPassword(CryptoService.decrypt(entry.encryptedPassword || ''));
  };

  const deleteEntry = async (id: string) => {
    if (confirm('Deletar esta senha?')) {
      await ApiRepository.deletePasswordVaultEntry(id);
      setEntries(entries.filter((e) => e.id !== id));
    }
  };

  const toggleVisible = (id: string) => {
    const next = new Set(visibleIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setVisibleIds(next);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white/70">{editingId ? 'Editar Senha' : 'Nova Senha'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className={labelCls}>Banco/Serviço</label><input value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputCls} placeholder="Ex: Itaú" /></div>
          <div><label className={labelCls}>Login</label><input value={login} onChange={(e) => setLogin(e.target.value)} className={inputCls} placeholder="Opcional" /></div>
          <div><label className={labelCls}>Senha</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" /></div>
          <div className="flex items-end gap-2">
            <button onClick={handleSave} className="h-10 px-6 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2">
              {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingId ? 'Salvar' : 'Adicionar'}
            </button>
            {editingId && <button onClick={reset} className="h-10 px-4 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 transition-colors">Cancelar</button>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between px-5 py-3.5 group transition-colors hover:bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg"><Key className="w-4 h-4 text-white/40" /></div>
              <div>
                <p className="text-sm font-medium text-white/80">{entry.bankName}</p>
                {entry.login && <p className="text-xs text-white/40">Login: {entry.login}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 tracking-wider">
                {visibleIds.has(entry.id) ? CryptoService.decrypt(entry.encryptedPassword || '') : '••••••••••'}
              </span>
              <button onClick={() => toggleVisible(entry.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-colors">
                {visibleIds.has(entry.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(entry)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/80 transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => deleteEntry(entry.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {entries.length === 0 && <div className="px-5 py-8 text-center text-white/30 text-sm">Nenhuma senha salva</div>}
      </div>
    </div>
  );
}

// ========== IA TAB ==========
function IaTab() {
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const inputCls = 'w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50';
  const labelCls = 'text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5';
  const taskLabels: Record<AiTask, string> = {
    insights: 'Insights financeiros',
    extraction: 'Extração de extratos',
    categorization: 'Categorização',
    classification: 'Fixa vs Variável',
  };
  const providerLabels: Record<AiProvider, string> = {
    groq: 'Groq',
    alibaba: 'Alibaba/Qwen',
    openai: 'OpenAI',
    google: 'Google Gemini',
  };
  const providers: AiProvider[] = ['groq', 'alibaba', 'openai', 'google'];
  const tasks: AiTask[] = ['insights', 'extraction', 'categorization', 'classification'];

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [nextConfig, nextUsage] = await Promise.all([
        ApiRepository.getAiConfig(),
        ApiRepository.getAiUsage(100),
      ]);
      setConfig(nextConfig);
      setUsage(nextUsage);
    } catch (error) {
      setMessage('Não foi possível carregar a configuração de IA.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const updateTask = (task: AiTask, patch: Partial<AiConfig['tasks'][AiTask]>) => {
    if (!config) return;
    setConfig({
      ...config,
      tasks: {
        ...config.tasks,
        [task]: {
          ...config.tasks[task],
          ...patch,
        },
      },
    });
  };

  const updateProviderBaseUrl = (provider: AiProvider, baseUrl: string) => {
    if (!config) return;
    setConfig({
      ...config,
      providers: {
        ...config.providers,
        [provider]: {
          ...config.providers[provider],
          baseUrl,
        },
      },
    });
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const { apiKeys, apiKeyStatus, demoMode, ...payload } = config;
      const saved = await ApiRepository.updateAiConfig(payload);
      setConfig(saved);
      setMessage('Configuração de IA salva.');
    } catch (error) {
      setMessage('Erro ao salvar configuração de IA.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearUsage = async () => {
    if (!confirm('Limpar histórico local de consumo de tokens?')) return;
    await ApiRepository.clearAiUsage();
    await loadData();
  };

  const totalTokens = usage?.aggregate.totalTokens || 0;
  const promptTokens = usage?.aggregate.promptTokens || 0;
  const completionTokens = usage?.aggregate.completionTokens || 0;

  if (!config) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-sm text-white/40">
        {isLoading ? 'Carregando configurações de IA...' : 'Configuração de IA indisponível.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-400" /> Configuração de modelos
            </h3>
            <p className="text-xs text-white/40 mt-1">As chaves ficam no backend via .env; esta tela configura provider, modelo e consumo.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="h-10 px-4 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Atualizar
            </button>
            <button onClick={handleSave} disabled={isSaving} className="h-10 px-5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-60">
              <Save className="w-4 h-4" /> {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        {message && <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">{message}</div>}
        {config.demoMode && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            Modo demo ativo: o status do Alibaba/Qwen e parte do consumo de tokens estão simulados para apresentação.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Provider padrão</label>
            <select value={config.defaultProvider} onChange={(e) => setConfig({ ...config, defaultProvider: e.target.value as AiProvider })} className={inputCls}>
              {providers.map(provider => <option key={provider} value={provider} className="bg-[#0d1527]">{providerLabels[provider]}</option>)}
            </select>
          </div>
          {providers.map(provider => (
            <div key={provider} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase text-white/50">{providerLabels[provider]}</span>
                <span className={`text-[10px] px-2 py-1 rounded-full ${getProviderStatusClass(config.apiKeyStatus?.[provider] || (config.apiKeys[provider] ? 'configured' : 'missing'))}`}>
                  {getProviderStatusLabel(config.apiKeyStatus?.[provider] || (config.apiKeys[provider] ? 'configured' : 'missing'))}
                </span>
              </div>
              <input value={config.providers[provider].baseUrl} onChange={(e) => updateProviderBaseUrl(provider, e.target.value)} className={inputCls} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {tasks.map(task => (
            <div key={task} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white/70">{taskLabels[task]}</h4>
                <span className="text-[10px] uppercase text-white/30">{task}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Provider</label>
                  <select value={config.tasks[task].provider} onChange={(e) => updateTask(task, { provider: e.target.value as AiProvider })} className={inputCls}>
                    {providers.map(provider => <option key={provider} value={provider} className="bg-[#0d1527]">{providerLabels[provider]}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Modelo</label>
                  <input value={config.tasks[task].model} onChange={(e) => updateTask(task, { model: e.target.value })} className={inputCls} placeholder="qwen-plus" />
                </div>
                <div>
                  <label className={labelCls}>Temperatura</label>
                  <input type="number" min="0" max="2" step="0.1" value={config.tasks[task].temperature} onChange={(e) => updateTask(task, { temperature: Number(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Max tokens</label>
                  <input type="number" min="1" step="1" value={config.tasks[task].maxTokens} onChange={(e) => updateTask(task, { maxTokens: Number(e.target.value) })} className={inputCls} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" /> Consumo de tokens
            </h3>
            <p className="text-xs text-white/40 mt-1">Histórico local dos últimos usos, sem armazenar prompts ou respostas.</p>
          </div>
          <button onClick={handleClearUsage} className="h-10 px-4 rounded-xl bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors text-sm">
            Limpar histórico
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Chamadas" value={String(usage?.aggregate.totalCalls || 0)} />
          <MetricCard label="Tokens totais" value={totalTokens.toLocaleString('pt-BR')} />
          <MetricCard label="Entrada" value={promptTokens.toLocaleString('pt-BR')} />
          <MetricCard label="Saída" value={completionTokens.toLocaleString('pt-BR')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <UsageBreakdown title="Por provider" data={usage?.aggregate.byProvider || {}} />
          <UsageBreakdown title="Por tarefa" data={usage?.aggregate.byTask || {}} />
        </div>

        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-6 gap-2 px-4 py-2 bg-white/[0.03] text-[10px] uppercase text-white/30 font-semibold">
            <span>Quando</span>
            <span>Tarefa</span>
            <span>Provider</span>
            <span>Modelo</span>
            <span>Tokens</span>
            <span>Status</span>
          </div>
          {(usage?.logs || []).slice(0, 20).map(log => (
            <div key={log.id} className="grid grid-cols-6 gap-2 px-4 py-2 border-t border-white/5 text-xs text-white/60">
              <span>{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
              <span>{taskLabels[log.task]}</span>
              <span>{log.provider}</span>
              <span className="truncate">{log.model}</span>
              <span>{log.totalTokens.toLocaleString('pt-BR')}{log.estimated ? ' *' : ''}</span>
              <span className={log.success ? 'text-emerald-400' : 'text-red-400'}>{log.success ? 'ok' : 'erro'}</span>
            </div>
          ))}
          {(usage?.logs || []).length === 0 && <div className="px-5 py-8 text-center text-white/30 text-sm">Nenhum consumo registrado ainda</div>}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <p className="text-[10px] uppercase text-white/30 font-semibold">{label}</p>
      <p className="text-xl font-bold text-white/80 mt-1 tabular-nums">{value}</p>
    </div>
  );
}

function getProviderStatusLabel(status: 'configured' | 'demo' | 'missing') {
  if (status === 'configured') return 'chave ok';
  if (status === 'demo') return 'demo ativo';
  return 'sem chave';
}

function getProviderStatusClass(status: 'configured' | 'demo' | 'missing') {
  if (status === 'configured') return 'bg-emerald-500/10 text-emerald-400';
  if (status === 'demo') return 'bg-amber-400/10 text-amber-300';
  return 'bg-red-500/10 text-red-400';
}

function UsageBreakdown({ title, data }: { title: string; data: Record<string, { calls: number; totalTokens: number }> }) {
  const entries = Object.entries(data);
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
      <h4 className="text-sm font-semibold text-white/70">{title}</h4>
      {entries.map(([key, item]) => (
        <div key={key} className="flex items-center justify-between text-sm">
          <span className="text-white/50">{key}</span>
          <span className="text-white/80 tabular-nums">{item.calls} chamadas · {item.totalTokens.toLocaleString('pt-BR')} tokens</span>
        </div>
      ))}
      {entries.length === 0 && <p className="text-sm text-white/30">Sem dados ainda</p>}
    </div>
  );
}
