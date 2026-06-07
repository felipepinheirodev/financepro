import { v4 as uuidv4 } from 'uuid';
import { addMonths, setDate, isAfter, parseISO, format } from 'date-fns';
import type { Transaction } from '../entities/Transaction';
import type { CreditCard } from '../entities/CreditCard';
import { Money } from '../value-objects/Money';

export class InstallmentService {
  /**
   * Generates installment transactions for a credit card purchase.
   * If the purchase date is after the closing date, the first installment
   * goes to the next month's invoice. Otherwise, it goes to the current month's invoice.
   */
  static generateInstallments(
    baseTransaction: Omit<Transaction, 'id' | 'isInstallment' | 'installmentId' | 'currentInstallment' | 'totalInstallments'>,
    creditCard: CreditCard,
    installmentsCount: number,
    interestRatePercent: number = 0
  ): Transaction[] {
    const transactions: Transaction[] = [];
    const purchaseDate = parseISO(baseTransaction.date);
    
    // Calculate total amount with interest (Simple interest for this MVP: amount * (1 + rate * installments))
    // Or just compound: amount * (1 + rate)^installments. Let's use simple compound for prototype.
    const baseAmount = Money.fromCents(baseTransaction.amountCents);
    const rateDecimal = interestRatePercent / 100;
    
    // To simplify: if interest rate is provided, totalAmount = baseAmount * (1 + rateDecimal)^installmentsCount
    // Or usually interest in Brazil is monthly compound. 
    // Let's use a standard approximation: PMT formula or just simple compound on total.
    // For simplicity, let's just calculate total = baseAmount * (1 + rateDecimal)^installmentsCount
    const totalAmountValue = baseAmount.value * Math.pow(1 + rateDecimal, installmentsCount);
    const totalAmount = Money.fromBRL(totalAmountValue);
    
    // Installment value = total / installmentsCount
    const installmentValueCents = Math.round(totalAmount.cents / installmentsCount);
    const installmentId = uuidv4();

    // Determine the invoice month for the first installment
    // If purchase day > closing day, it goes to the invoice of the NEXT month.
    let currentInvoiceDate = purchaseDate;
    if (purchaseDate.getDate() > creditCard.closingDay) {
      currentInvoiceDate = addMonths(currentInvoiceDate, 1);
    }
    
    for (let i = 1; i <= installmentsCount; i++) {
      // Set the date of the transaction to the due date of that month's invoice
      const dueDate = setDate(currentInvoiceDate, creditCard.dueDay);
      
      transactions.push({
        ...baseTransaction,
        id: uuidv4(),
        amountCents: installmentValueCents,
        date: format(dueDate, 'yyyy-MM-dd'),
        isInstallment: true,
        installmentId,
        currentInstallment: i,
        totalInstallments: installmentsCount,
        interestRate: interestRatePercent,
        status: 'PENDING'
      });
      
      // Move to next month for the next installment
      currentInvoiceDate = addMonths(currentInvoiceDate, 1);
    }

    return transactions;
  }
}
