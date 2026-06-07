export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PENDING' | 'PAID';
export type ExpenseType = 'FIXA' | 'VARIAVEL';

export interface Transaction {
  id: string;
  accountId: string;
  creditCardId?: string;
  categoryId?: string;
  recurringTemplateId?: string;
  description: string;
  amountCents: number;
  type: TransactionType;
  category: string;
  expenseType?: ExpenseType;
  date: string; // ISO string 'YYYY-MM-DD'
  status: TransactionStatus;
  
  // Installment support
  isInstallment: boolean;
  installmentId?: string;
  currentInstallment?: number;
  totalInstallments?: number;
  interestRate?: number;
}
