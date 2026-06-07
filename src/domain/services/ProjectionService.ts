import type { Transaction } from '../entities/Transaction';
import type { Account } from '../entities/Account';
import type { CreditCard } from '../entities/CreditCard';
import { Money } from '../value-objects/Money';
import { parseISO, isSameMonth, isSameYear, startOfMonth, endOfMonth, isAfter, isBefore } from 'date-fns';

export interface BigNumbers {
  availableCreditCents: number;
  openDebitCents: number;
  finalResultCents: number;
  nextMonthProjectionCents: number;
}

export class ProjectionService {
  /**
   * Calculates the Big Numbers for a given reference date (usually today).
   */
  static calculateBigNumbers(
    accounts: Account[],
    transactions: Transaction[],
    creditCards: CreditCard[],
    referenceDate: Date = new Date()
  ): BigNumbers {
    
    // 1. Available Credit: Sum of Credit Card Limits minus their open invoices (pending transactions)
    const totalCreditLimit = creditCards.reduce((acc, card) => acc + card.limitCents, 0);
    const usedCredit = transactions
      .filter(t => t.creditCardId && t.status === 'PENDING')
      .reduce((acc, t) => acc + t.amountCents, 0);
      
    const availableCreditCents = Math.max(0, totalCreditLimit - usedCredit);

    // 2. Open Debit: Sum of all PENDING expense transactions up to the end of the current month
    // Also include credit card invoices due this month
    const endOfCurrentMonth = endOfMonth(referenceDate);
    
    const openDebitCents = transactions
      .filter(t => 
        t.type === 'EXPENSE' && 
        t.status === 'PENDING' && 
        !isAfter(parseISO(t.date), endOfCurrentMonth)
      )
      .reduce((acc, t) => acc + t.amountCents, 0);

    // 3. Final Result (Current Balance): Sum of all accounts initial balances + income - paid expenses
    let currentBalanceCents = accounts.reduce((acc, accObj) => acc + accObj.initialBalanceCents, 0);
    
    // Add all paid income and subtract all paid expenses
    transactions.filter(t => t.status === 'PAID').forEach(t => {
      if (t.type === 'INCOME') currentBalanceCents += t.amountCents;
      if (t.type === 'EXPENSE') currentBalanceCents -= t.amountCents;
    });
    
    const finalResultCents = currentBalanceCents;

    // 4. Next Month Projection: Current Balance + Expected Income (Next Month) - Expected Expenses (Next Month)
    // Wait, the rule from user: (Current Balance + Expected Income - Fixed Expenses - Card Installments of the month)
    const startOfNextMonthDate = startOfMonth(new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1));
    const endOfNextMonthDate = endOfMonth(startOfNextMonthDate);
    
    let nextMonthIncome = 0;
    let nextMonthExpenses = 0;
    
    transactions.forEach(t => {
      const tDate = parseISO(t.date);
      // If transaction belongs to next month
      if (isSameMonth(tDate, startOfNextMonthDate) && isSameYear(tDate, startOfNextMonthDate)) {
        if (t.type === 'INCOME') nextMonthIncome += t.amountCents;
        if (t.type === 'EXPENSE') nextMonthExpenses += t.amountCents;
      }
    });
    
    // Calculate Projection
    const nextMonthProjectionCents = finalResultCents + nextMonthIncome - nextMonthExpenses;

    return {
      availableCreditCents,
      openDebitCents,
      finalResultCents,
      nextMonthProjectionCents
    };
  }
}
