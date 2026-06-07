import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { Account } from '../../domain/entities/Account';
import type { Transaction } from '../../domain/entities/Transaction';
import type { CreditCard } from '../../domain/entities/CreditCard';
import type { Category } from '../../domain/entities/Category';
import type { RecurringTemplate } from '../../domain/entities/RecurringTemplate';
import { ApiRepository } from '../../infrastructure/repositories/ApiRepository';
import { format, subMonths, addMonths } from 'date-fns';

export interface FinanceContextData {
  // Data
  accounts: Account[];
  transactions: Transaction[];
  allTransactions: Transaction[];
  creditCards: CreditCard[];
  categories: Category[];
  recurringTemplates: RecurringTemplate[];
  
  // Month navigation
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  
  // Computed
  previousMonthResult: number; // carryover in cents
  
  // Actions
  addTransaction: (t: Partial<Transaction>) => Promise<void>;
  addTransactionsBulk: (txs: Partial<Transaction>[]) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addAccount: (acc: Account) => Promise<void>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addCreditCard: (card: CreditCard) => Promise<void>;
  updateCreditCard: (id: string, data: Partial<CreditCard>) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
  addCategory: (cat: Partial<Category>) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addRecurringTemplate: (tpl: Partial<RecurringTemplate>) => Promise<void>;
  updateRecurringTemplate: (id: string, data: Partial<RecurringTemplate>) => Promise<void>;
  generateRecurringBatch: (id: string, untilDate: string) => Promise<void>;
  batchUpdateRecurring: (id: string, updateData: Record<string, unknown>, scope: 'ALL' | 'FUTURE_ONLY') => Promise<void>;
  batchDeleteRecurring: (id: string, scope: 'ALL' | 'FUTURE_ONLY') => Promise<void>;
  
  updatePasswordVaultEntry: (id: string, data: Partial<any>) => Promise<void>;

  reload: () => Promise<void>;
  isLoading: boolean;
  isCategorizing: boolean;
  isClassifying: boolean;
  categorizeAllWithAI: () => Promise<void>;
  classifyAllWithAI: () => Promise<void>;
  
  // UI Global State
  isTransactionModalOpen: boolean;
  setIsTransactionModalOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (t: Transaction | null) => void;
  openNewTransaction: () => void;
  
  // Credit Payment Logic
  payTransactionWithCredit: (tx: Transaction, cardId: string, feeCents: number, iofCents: number, date: string) => Promise<void>;
  payFullBillWithCredit: (cardId: string, targetCardId: string, feeCents: number, iofCents: number, date: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextData | null>(null);

export function useFinanceContext() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinanceContext must be used within FinanceProvider');
  return ctx;
}

export { FinanceContext };

export function useFinanceData(): FinanceContextData {
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [previousMonthResult, setPreviousMonthResult] = useState(0);

  // Global UI state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const openNewTransaction = useCallback(() => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  }, []);

  const loadData = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const [accs, txs, allTxs, cards, cats, templates] = await Promise.all([
        ApiRepository.getAccounts(),
        ApiRepository.getTransactions(selectedMonth),
        ApiRepository.getAllTransactions(),
        ApiRepository.getCreditCards(),
        ApiRepository.getCategories(),
        ApiRepository.getRecurringTemplates(),
      ]);

      setAccounts(accs);
      setTransactions(txs);
      setAllTransactions(allTxs);
      setCreditCards(cards);
      setCategories(cats);
      setRecurringTemplates(templates);

      // Calculate carryover: result of all months BEFORE selectedMonth
      const carryover = calculateCarryover(accs, allTxs, selectedMonth);
      setPreviousMonthResult(carryover);
    } catch (error) {
      console.error('useFinanceData: Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const goToPreviousMonth = useCallback(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 15);
    setSelectedMonth(format(subMonths(date, 1), 'yyyy-MM'));
  }, [selectedMonth]);

  const goToNextMonth = useCallback(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 15);
    setSelectedMonth(format(addMonths(date, 1), 'yyyy-MM'));
  }, [selectedMonth]);

  const goToToday = useCallback(() => {
    setSelectedMonth(format(new Date(), 'yyyy-MM'));
  }, []);

  // CRUD wrappers
  const addTransaction = async (t: Partial<Transaction>) => {
    await ApiRepository.saveTransaction(t);
    await loadData();
  };

  const addTransactionsBulk = async (txs: Partial<Transaction>[]) => {
    await ApiRepository.saveTransactionsBulk(txs);
    await loadData();
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    await ApiRepository.updateTransaction(id, data);
    await loadData();
  };

  const deleteTransaction = async (id: string) => {
    await ApiRepository.deleteTransaction(id);
    await loadData();
  };

  const addAccount = async (acc: Account) => {
    await ApiRepository.saveAccount(acc);
    await loadData();
  };

  const updateAccount = async (id: string, data: Partial<Account>) => {
    await ApiRepository.updateAccount(id, data);
    await loadData();
  };

  const deleteAccount = async (id: string) => {
    await ApiRepository.deleteAccount(id);
    await loadData();
  };

  const addCreditCard = async (card: CreditCard) => {
    await ApiRepository.saveCreditCard(card);
    await loadData();
  };

  const updateCreditCard = async (id: string, data: Partial<CreditCard>) => {
    await ApiRepository.updateCreditCard(id, data);
    await loadData();
  };

  const deleteCreditCard = async (id: string) => {
    await ApiRepository.deleteCreditCard(id);
    await loadData();
  };

  const addCategory = async (cat: Partial<Category>) => {
    await ApiRepository.saveCategory(cat);
    await loadData();
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    await ApiRepository.updateCategory(id, data);
    await loadData();
  };

  const deleteCategory = async (id: string) => {
    await ApiRepository.deleteCategory(id);
    await loadData();
  };

  const addRecurringTemplate = async (tpl: Partial<RecurringTemplate>) => {
    await ApiRepository.saveRecurringTemplate(tpl);
    await loadData();
  };

  const updateRecurringTemplate = async (id: string, data: Partial<RecurringTemplate>) => {
    await ApiRepository.updateRecurringTemplate(id, data);
    await loadData();
  };

  const generateRecurringBatch = async (id: string, untilDate: string) => {
    await ApiRepository.generateRecurringBatch(id, untilDate);
    await loadData();
  };

  const batchUpdateRecurring = async (id: string, updateData: Record<string, unknown>, scope: 'ALL' | 'FUTURE_ONLY') => {
    await ApiRepository.batchUpdateRecurring(id, updateData, scope);
    await loadData();
  };

  const batchDeleteRecurring = async (id: string, scope: 'ALL' | 'FUTURE_ONLY') => {
    await ApiRepository.batchDeleteRecurring(id, scope);
    await loadData();
  };

  const updatePasswordVaultEntry = async (id: string, data: Partial<any>) => {
    await ApiRepository.updatePasswordVaultEntry(id, data);
    await loadData();
  };

  const [isCategorizing, setIsCategorizing] = useState(false);

  const categorizeAllWithAI = async () => {
    const targetTxs = allTransactions.filter(t => t.category === 'Importado' || t.category === 'Outros');
    if (targetTxs.length === 0) return;

    setIsCategorizing(true);
    try {
      const categoryNames = categories.map(c => c.name);
      
      // Batch in groups of 20 to avoid large payload/timeout
      for (let i = 0; i < targetTxs.length; i += 20) {
        const batch = targetTxs.slice(i, i + 20);
        const result = await ApiRepository.categorizeTransactions(
          batch.map(t => ({ id: t.id, description: t.description })),
          categoryNames
        );

        const items = result.categorization;
        if (items && Array.isArray(items)) {
          for (const item of items) {
            await ApiRepository.updateTransaction(item.id, { category: item.category });
          }
        }
      }
      
      await loadData();
    } catch (error) {
      console.error('Failed to categorize with AI:', error);
      throw error;
    } finally {
      setIsCategorizing(false);
    }
  };

  const [isClassifying, setIsClassifying] = useState(false);

  const classifyAllWithAI = async () => {
    // Busca transações que não têm expenseType (Fixa/Variável) definido
    const unclassifiedTxs = allTransactions.filter(t => !t.expenseType && t.type === 'EXPENSE');
    if (unclassifiedTxs.length === 0) return;

    setIsClassifying(true);
    try {
      // Batch in groups of 20
      for (let i = 0; i < unclassifiedTxs.length; i += 20) {
        const batch = unclassifiedTxs.slice(i, i + 20);
        const result = await ApiRepository.classifyTransactions(
          batch.map(t => ({ 
            id: t.id, 
            description: t.description,
            isCredit: !!t.creditCardId 
          }))
        );

        const items = result.classification;
        if (items && Array.isArray(items)) {
          for (const item of items) {
            await ApiRepository.updateTransaction(item.id, { expenseType: item.expenseType as any });
          }
        }
      }
      
      await loadData();
    } catch (error) {
      console.error('Failed to classify with AI:', error);
      throw error;
    } finally {
      setIsClassifying(false);
    }
  };

  const payTransactionWithCredit = async (tx: Transaction, cardId: string, feeCents: number, iofCents: number, date: string) => {
    try {
      const extraTransactions: Partial<Transaction>[] = [];
      const card = creditCards.find(c => c.id === cardId);
      const cardName = card?.name || 'Cartão';

      // 1. Update original transaction
      await ApiRepository.updateTransaction(tx.id, {
        status: 'PAID',
        date: date,
        creditCardId: cardId,
        accountId: undefined // Ensure it's linked to the card now
      });

      // 2. Create Fee transaction if any
      if (feeCents > 0) {
        extraTransactions.push({
          description: `Taxa de Serviço: ${tx.description}`,
          amountCents: feeCents,
          type: 'EXPENSE',
          date: date,
          creditCardId: cardId,
          category: 'Encargos',
          status: 'PAID',
          expenseType: 'VARIAVEL'
        });
      }

      // 3. Create IOF transaction if any
      if (iofCents > 0) {
        extraTransactions.push({
          description: `IOF: ${tx.description}`,
          amountCents: iofCents,
          type: 'EXPENSE',
          date: date,
          creditCardId: cardId,
          category: 'Imposto',
          status: 'PAID',
          expenseType: 'VARIAVEL'
        });
      }

      if (extraTransactions.length > 0) {
        await ApiRepository.saveTransactionsBulk(extraTransactions);
      }

      await loadData();
    } catch (error) {
      console.error('payTransactionWithCredit: Failed:', error);
      throw error;
    }
  };

  const payFullBillWithCredit = async (sourceCardId: string, targetCardId: string, feeCents: number, iofCents: number, date: string) => {
    try {
      const sourceCard = creditCards.find(c => c.id === sourceCardId);
      const targetCard = creditCards.find(c => c.id === targetCardId);
      
      // Get all pending transactions for the source card in the selected month
      const pendingTxs = transactions.filter(t => t.creditCardId === sourceCardId && t.status === 'PENDING');
      const totalAmount = pendingTxs.reduce((acc, t) => acc + t.amountCents, 0);

      if (pendingTxs.length === 0) return;

      // 1. Mark all pending as PAID
      for (const tx of pendingTxs) {
        await ApiRepository.updateTransaction(tx.id, { status: 'PAID' });
      }

      // 2. Create the main payment transaction on the target card
      const extraTransactions: Partial<Transaction>[] = [
        {
          description: `Pagto Fatura: ${sourceCard?.name || 'Cartão'}`,
          amountCents: totalAmount,
          type: 'EXPENSE',
          date: date,
          creditCardId: targetCardId,
          category: 'Pagamento Cartão',
          status: 'PAID',
          expenseType: 'VARIAVEL'
        }
      ];

      // 3. Create Fee transaction if any
      if (feeCents > 0) {
        extraTransactions.push({
          description: `Taxa de Serviço: Fatura ${sourceCard?.name}`,
          amountCents: feeCents,
          type: 'EXPENSE',
          date: date,
          creditCardId: targetCardId,
          category: 'Encargos',
          status: 'PAID',
          expenseType: 'VARIAVEL'
        });
      }

      // 4. Create IOF transaction if any
      if (iofCents > 0) {
        extraTransactions.push({
          description: `IOF: Fatura ${sourceCard?.name}`,
          amountCents: iofCents,
          type: 'EXPENSE',
          date: date,
          creditCardId: targetCardId,
          category: 'Imposto',
          status: 'PAID',
          expenseType: 'VARIAVEL'
        });
      }

      await ApiRepository.saveTransactionsBulk(extraTransactions);
      await loadData();
    } catch (error) {
      console.error('payFullBillWithCredit: Failed:', error);
      throw error;
    }
  };

  return {
    accounts,
    transactions,
    allTransactions,
    creditCards,
    categories,
    recurringTemplates,
    selectedMonth,
    setSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    previousMonthResult,
    addTransaction,
    addTransactionsBulk,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    addCategory,
    updateCategory,
    deleteCategory,
    addRecurringTemplate,
    updateRecurringTemplate,
    generateRecurringBatch,
    batchUpdateRecurring,
    batchDeleteRecurring,
    updatePasswordVaultEntry,
    reload: loadData,
    isLoading,
    isCategorizing,
    isClassifying,
    categorizeAllWithAI,
    classifyAllWithAI,
    isTransactionModalOpen,
    setIsTransactionModalOpen,
    editingTransaction,
    setEditingTransaction,
    openNewTransaction,
    payTransactionWithCredit,
    payFullBillWithCredit,
  };
}

/**
 * Calculate carryover: sum of all account initial balances +
 * income - expenses for all transactions BEFORE the given month.
 */
function calculateCarryover(accounts: Account[], allTransactions: Transaction[], currentMonth: string): number {
  let balance = accounts.reduce((acc, a) => acc + a.initialBalanceCents, 0);
  
  for (const tx of allTransactions) {
    // Only consider transactions before the current month
    if (tx.date < currentMonth) {
      if (tx.type === 'INCOME') balance += tx.amountCents;
      if (tx.type === 'EXPENSE') balance -= tx.amountCents;
    }
  }
  
  return balance;
}
