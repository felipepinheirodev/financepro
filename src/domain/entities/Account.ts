export type AccountType = 'CHECKING' | 'SAVINGS' | 'WALLET' | 'CREDIT_CARD';

export interface Account {
  id: string;
  name: string; // e.g., "Conta Corrente Nubank"
  type: AccountType;
  initialBalanceCents: number; // Balance when created or at the start of a tracking period
  color?: string; // For UI display
}
