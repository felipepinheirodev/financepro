export interface RecurringTemplate {
  id: string;
  description: string;
  amountCents: number;
  type: 'INCOME' | 'EXPENSE';
  expenseType?: 'FIXA' | 'VARIAVEL';
  categoryId?: string;
  accountId?: string;
  creditCardId?: string;
  frequency: string;
  dayOfMonth?: number;
  isActive: boolean;
  transactions?: { id: string; date: string; status: string }[];
}
