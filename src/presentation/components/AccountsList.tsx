import React from 'react';
import type { Account } from '../../domain/entities/Account';
import { Money } from '../../domain/value-objects/Money';

interface Props {
  accounts: Account[];
  allTransactions: any[];
}

export const AccountsList: React.FC<Props> = ({ accounts, allTransactions }) => {
  const getAccountBalance = (accountId: string, initialBalance: number) => {
    const accountTxs = allTransactions.filter(t => t.accountId === accountId && !t.creditCardId);
    return accountTxs.reduce((acc, t) => {
      return t.type === 'INCOME' ? acc + t.amountCents : acc - t.amountCents;
    }, initialBalance);
  };
  
  return (
    <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold">Saldo Contas</h2>
      </div>
      <div className="p-0">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
            <tr>
              <th className="px-6 py-3">Tipo de Conta</th>
              <th className="px-6 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, index) => (
              <tr key={acc.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 font-medium flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: acc.color || '#ccc' }}
                  />
                  {acc.name}
                </td>
                <td className="px-6 py-4 text-right">
                  {Money.fromCents(getAccountBalance(acc.id, acc.initialBalanceCents)).format()}
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-muted-foreground">
                  Nenhuma conta cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
