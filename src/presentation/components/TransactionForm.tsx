import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Account } from '../../domain/entities/Account';
import type { CreditCard } from '../../domain/entities/CreditCard';
import type { Transaction } from '../../domain/entities/Transaction';
import { InstallmentService } from '../../domain/services/InstallmentService';

interface Props {
  accounts: Account[];
  creditCards: CreditCard[];
  onSubmit: (transaction: Transaction, additionalTransactions: Transaction[]) => void;
}

export const TransactionForm: React.FC<Props> = ({ accounts, creditCards, onSubmit }) => {
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  
  // Installments logic
  const [isInstallment, setIsInstallment] = useState(false);
  const [creditCardId, setCreditCardId] = useState(creditCards[0]?.id || '');
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [interestRate, setInterestRate] = useState(0);
  
  // Sync defaults when accounts/cards load
  React.useEffect(() => {
    if (!accountId && accounts.length > 0) setAccountId(accounts[0].id);
    if (!creditCardId && creditCards.length > 0) setCreditCardId(creditCards[0].id);
  }, [accounts, creditCards]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      alert('Por favor, preencha a descrição.');
      return;
    }

    if (!amountStr || isNaN(parseFloat(amountStr.replace(',', '.')))) {
      alert('Por favor, informe um valor válido.');
      return;
    }

    // Parse amount from string like "100.50" to cents 10050
    const amountCents = Math.round(parseFloat(amountStr.replace(',', '.')) * 100);
    
    const baseTransaction: Omit<Transaction, 'id' | 'isInstallment' | 'installmentId' | 'currentInstallment' | 'totalInstallments'> = {
      description,
      amountCents,
      type,
      accountId,
      date,
      category,
      status: 'PENDING',
    };

    if (isInstallment && type === 'EXPENSE') {
      const card = creditCards.find(c => c.id === creditCardId);
      if (!card) {
        alert('Cartão não selecionado!');
        return;
      }
      
      const generatedTransactions = InstallmentService.generateInstallments(
        { ...baseTransaction, creditCardId: card.id },
        card,
        installmentsCount,
        interestRate
      );

      // We pass the first one as the main, and the rest as additional
      const mainTx = generatedTransactions[0];
      const restTx = generatedTransactions.slice(1);
      onSubmit(mainTx, restTx);

    } else {
      // Normal transaction
      const tx: Transaction = {
        ...baseTransaction,
        id: uuidv4(),
        isInstallment: false
      };
      onSubmit(tx, []);
    }

    // Reset
    setDescription('');
    setAmountStr('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border">
      <h3 className="text-lg font-semibold mb-4">Novo Lançamento</h3>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Descrição</label>
          <input 
            required 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Ex: Supermercado"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Valor (R$)</label>
          <input 
            required 
            type="number"
            step="0.01"
            value={amountStr} 
            onChange={(e) => setAmountStr(e.target.value)} 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            placeholder="0.00"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Tipo</label>
          <select value={type} onChange={(e) => setType(e.target.value as 'INCOME'|'EXPENSE')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="EXPENSE">Despesa</option>
            <option value="INCOME">Receita</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Conta</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Data</label>
          <input 
            required 
            type="date"
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {type === 'EXPENSE' && (
        <div className="mt-4 flex items-center gap-2">
          <input 
            type="checkbox" 
            id="isInstallment" 
            checked={isInstallment} 
            onChange={(e) => setIsInstallment(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="isInstallment" className="text-sm font-medium">É parcelado no Cartão de Crédito?</label>
        </div>
      )}

      {isInstallment && type === 'EXPENSE' && (
        <div className="mt-4 grid gap-4 md:grid-cols-3 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Cartão</label>
            <select value={creditCardId} onChange={(e) => setCreditCardId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Parcelas</label>
            <input 
              required 
              type="number"
              min="2"
              value={installmentsCount} 
              onChange={(e) => setInstallmentsCount(parseInt(e.target.value))} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Juros a.m. (%)</label>
            <input 
              type="number"
              step="0.01"
              min="0"
              value={interestRate} 
              onChange={(e) => setInterestRate(parseFloat(e.target.value))} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      <button type="submit" className="mt-6 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
        Adicionar Lançamento
      </button>
    </form>
  );
};
