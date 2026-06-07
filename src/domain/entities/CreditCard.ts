export interface CreditCard {
  id: string;
  name: string; // e.g., "Cartão Mercado Livre"
  accountId: string; // The account used to pay this card
  limitCents: number; // Credit limit
  closingDay: number; // Day of the month the invoice closes (e.g., 5)
  dueDay: number; // Day of the month the invoice is due (e.g., 12)
  color?: string; // UI color
}
