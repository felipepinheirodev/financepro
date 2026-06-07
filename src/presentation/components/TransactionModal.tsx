import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useFinanceContext } from '../../application/hooks/useFinanceData';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, setDate as setDateFns, format, parseISO } from 'date-fns';
import type { Transaction } from '../../domain/entities/Transaction';
import { InstallmentService } from '../../domain/services/InstallmentService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<Props> = ({ isOpen, onClose, editTransaction }) => {
  const { accounts, creditCards, categories, addTransaction, addTransactionsBulk, updateTransaction } = useFinanceContext();

  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [expenseType, setExpenseType] = useState<'FIXA' | 'VARIAVEL' | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CONTA' | 'CARTAO'>('CONTA');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'PENDING' | 'PAID'>('PENDING');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [currentInstallment, setCurrentInstallment] = useState(1);
  const [interestRate, setInterestRate] = useState(0);

  useEffect(() => {
    if (editTransaction) {
      setDescription(editTransaction.description);
      setAmountStr((editTransaction.amountCents / 100).toFixed(2));
      setType(editTransaction.type as 'INCOME' | 'EXPENSE');
      setExpenseType((editTransaction.expenseType as 'FIXA' | 'VARIAVEL') || '');
      setCategoryId(editTransaction.categoryId || '');
      setAccountId(editTransaction.accountId);
      setCreditCardId(editTransaction.creditCardId || '');
      setPaymentMethod(editTransaction.creditCardId ? 'CARTAO' : 'CONTA');
      
      setDate(editTransaction.date.split('T')[0]);
      
      setStatus(editTransaction.status as 'PENDING' | 'PAID');
      setIsInstallment(editTransaction.isInstallment);
      setInstallmentsCount(editTransaction.totalInstallments || 2);
      setCurrentInstallment(editTransaction.currentInstallment || 1);
    } else {
      resetForm();
    }
  }, [editTransaction, isOpen]);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id);
    if (creditCards.length > 0 && !creditCardId) setCreditCardId(creditCards[0].id);
  }, [accounts, creditCards]);

  function resetForm() {
    setDescription('');
    setAmountStr('');
    setType('EXPENSE');
    setExpenseType('');
    setCategoryId('');
    setAccountId(accounts[0]?.id || '');
    setCreditCardId(creditCards[0]?.id || '');
    setPaymentMethod('CONTA');
    setDate(new Date().toISOString().split('T')[0]);
    setStatus('PENDING');
    setIsInstallment(false);
    setInstallmentsCount(2);
    setCurrentInstallment(1);
    setInterestRate(0);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) { alert('Por favor, informe a descrição.'); return; }
    if (!amountStr || parseFloat(amountStr.replace(',', '.')) <= 0) { alert('Por favor, informe um valor maior que zero.'); return; }
    if (type === 'EXPENSE' && !expenseType) { alert('Por favor, selecione se a despesa é Fixa ou Variável.'); return; }
    if (!categoryId) { alert('Por favor, selecione uma categoria.'); return; }

    const amountCents = Math.round(parseFloat(amountStr.replace(',', '.')) * 100);
    const selectedCategory = categories.find((c) => c.id === categoryId);

    const baseData: Partial<Transaction> = {
      description,
      amountCents,
      type,
      expenseType: type === 'EXPENSE' ? (expenseType || undefined) : undefined,
      categoryId: categoryId || undefined,
      category: selectedCategory?.name || description,
      accountId: paymentMethod === 'CONTA' ? accountId : (creditCards.find(c => c.id === creditCardId)?.accountId || accounts[0]?.id),
      creditCardId: paymentMethod === 'CARTAO' ? creditCardId : undefined,
      date,
      status,
      isInstallment: isInstallment,
    };

    if (isInstallment && type === 'EXPENSE') {
      const card = paymentMethod === 'CARTAO' ? creditCards.find((c) => c.id === creditCardId) : null;
      const installmentId = editTransaction?.installmentId || uuidv4();
      
      // 1. Salva/Atualiza a parcela ATUAL
      const currentData = { 
        ...baseData, 
        id: editTransaction?.id || uuidv4(),
        isInstallment: true,
        installmentId,
        currentInstallment,
        totalInstallments: installmentsCount
      };

      if (editTransaction?.id) {
        await updateTransaction(editTransaction.id, currentData as Transaction);
      } else {
        await addTransaction(currentData as Transaction);
      }

      // 2. Gera as parcelas FUTURAS (se houver)
      // Só gera se for um novo lançamento OU se estiver sendo convertido em parcelado agora
      const isNewOrConverting = !editTransaction?.id || !editTransaction?.isInstallment;

      if (isNewOrConverting && currentInstallment < installmentsCount) {
        const futureTxs: Transaction[] = [];
        
        // Garante que temos um objeto Date válido para começar
        const baseDate = typeof date === 'string' ? parseISO(date) : (date as any instanceof Date ? date : new Date());
        
        if (isNaN((baseDate as any).getTime())) {
          console.error('Invalid base date for installments:', date);
          return;
        }

        let currentRefDate = baseDate as Date;
        
        for (let i = currentInstallment + 1; i <= installmentsCount; i++) {
          currentRefDate = addMonths(currentRefDate, 1);
          
          let dueDate;
          if (paymentMethod === 'CARTAO' && card) {
            const dueDay = card.dueDay || currentRefDate.getDate();
            dueDate = setDateFns(currentRefDate, dueDay);
          } else {
            // Se for conta bancária, mantém o mesmo dia do lançamento original
            dueDate = currentRefDate;
          }

          if (!dueDate || isNaN(dueDate.getTime())) continue;

          futureTxs.push({
            ...baseData,
            id: uuidv4(),
            isInstallment: true,
            installmentId,
            currentInstallment: i,
            totalInstallments: installmentsCount,
            date: format(dueDate, 'yyyy-MM-dd'),
            status: 'PENDING'
          } as Transaction);
        }

        await addTransactionsBulk(futureTxs);
      }
    } else if (editTransaction?.id) {
      await updateTransaction(editTransaction.id, baseData);
    } else {
      await addTransaction({ ...baseData, id: uuidv4() } as Transaction);
    }

    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const inputCls = 'w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all';
  const labelCls = 'text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-[#0d1527] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold">
            {editTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Description + Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Descrição</label>
              <input required value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="Ex: Supermercado" />
            </div>
            <div>
              <label className={labelCls}>Valor (R$)</label>
              <input required type="number" step="0.01" min="0.01" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} className={inputCls} placeholder="0,00" />
            </div>
          </div>

          {/* Type + ExpenseType */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tipo</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setType('EXPENSE')}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${type === 'EXPENSE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>
                  Despesa
                </button>
                <button type="button" onClick={() => setType('INCOME')}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>
                  Receita
                </button>
              </div>
            </div>
            {type === 'EXPENSE' && (
              <div>
                <label className={labelCls}>Classificação</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setExpenseType('FIXA')}
                    className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${expenseType === 'FIXA' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>
                    Fixa
                  </button>
                  <button type="button" onClick={() => setExpenseType('VARIAVEL')}
                    className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${expenseType === 'VARIAVEL' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>
                    Variável
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Categoria</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              <option value="">Selecione...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className={labelCls}>Forma de Pagamento</label>
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => setPaymentMethod('CONTA')}
                className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${paymentMethod === 'CONTA' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>
                Conta Bancária
              </button>
              <button type="button" onClick={() => setPaymentMethod('CARTAO')}
                className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${paymentMethod === 'CARTAO' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>
                Cartão de Crédito
              </button>
            </div>
            {paymentMethod === 'CONTA' ? (
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputCls}>
                {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
              </select>
            ) : (
              <select value={creditCardId} onChange={(e) => setCreditCardId(e.target.value)} className={inputCls}>
                {creditCards.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            )}
          </div>

          {/* Installment Toggle */}
          {type === 'EXPENSE' && (
            <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-10 h-6 rounded-full relative transition-all ${isInstallment ? (paymentMethod === 'CARTAO' ? 'bg-cyan-500' : 'bg-purple-500') : 'bg-white/10'}`}
                    onClick={() => setIsInstallment(!isInstallment)}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isInstallment ? 'left-5' : 'left-1'}`} />
                  </div>
                  <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors uppercase tracking-widest">
                    Parcelar Lançamento
                  </span>
                </label>
                {isInstallment && (
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="1" 
                      max="72" 
                      value={currentInstallment || 1} 
                      onChange={(e) => setCurrentInstallment(parseInt(e.target.value) || 1)} 
                      className={`w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-center font-bold focus:outline-none ${paymentMethod === 'CARTAO' ? 'text-cyan-400 focus:border-cyan-500/50' : 'text-purple-400 focus:border-purple-500/50'}`} 
                      title="Parcela Atual"
                    />
                    <span className="text-white/20 text-xs font-bold uppercase">de</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="72" 
                      value={installmentsCount || 1} 
                      onChange={(e) => setInstallmentsCount(parseInt(e.target.value) || 1)} 
                      className={`w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-center font-bold focus:outline-none ${paymentMethod === 'CARTAO' ? 'text-cyan-400 focus:border-cyan-500/50' : 'text-purple-400 focus:border-purple-500/50'}`} 
                      title="Total de Parcelas"
                    />
                  </div>
                )}
              </div>

              {isInstallment && (
                <div className="pt-2">
                  <p className="text-[10px] text-white/30 italic leading-relaxed">
                    {currentInstallment < installmentsCount 
                      ? `Este é o lançamento ${currentInstallment} de ${installmentsCount}. Serão criadas automaticamente as ${installmentsCount - currentInstallment} parcelas restantes para os meses futuros.`
                      : `Este é o lançamento final (${currentInstallment} de ${installmentsCount}). Nenhuma parcela futura será gerada.`
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Date + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Data</label>
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStatus('PENDING')}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>
                  Pendente
                </button>
                <button type="button" onClick={() => setStatus('PAID')}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>
                  Pago
                </button>
              </div>
            </div>
          </div>



          <button type="submit"
            className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20">
            {editTransaction ? 'Salvar Alterações' : 'Adicionar Lançamento'}
          </button>
        </form>
      </div>
    </div>
  );
};
