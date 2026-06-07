import React from 'react';
import { Money } from '../../domain/value-objects/Money';
import type { BigNumbers } from '../../domain/services/ProjectionService';
import { CreditCard, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  data: BigNumbers;
}

export const BigNumbersCards: React.FC<Props> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      
      {/* Available Credit */}
      <div className="bg-card text-card-foreground rounded-xl p-6 shadow-sm border border-border flex items-center space-x-4">
        <div className="p-3 bg-primary/10 rounded-full">
          <CreditCard className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium">Crédito Disponível</p>
          <h3 className="text-2xl font-bold">{Money.fromCents(data.availableCreditCents).format()}</h3>
        </div>
      </div>

      {/* Open Debit */}
      <div className="bg-card text-card-foreground rounded-xl p-6 shadow-sm border border-border flex items-center space-x-4">
        <div className="p-3 bg-destructive/10 rounded-full">
          <TrendingDown className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium">Débito em Aberto</p>
          <h3 className="text-2xl font-bold text-destructive">{Money.fromCents(data.openDebitCents).format()}</h3>
        </div>
      </div>

      {/* Final Result */}
      <div className="bg-card text-card-foreground rounded-xl p-6 shadow-sm border border-border flex items-center space-x-4">
        <div className="p-3 bg-green-500/10 rounded-full">
          <Wallet className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium">Resultado Final</p>
          <h3 className="text-2xl font-bold text-green-500">{Money.fromCents(data.finalResultCents).format()}</h3>
        </div>
      </div>

      {/* Next Month Projection */}
      <div className="bg-card text-card-foreground rounded-xl p-6 shadow-sm border border-border flex items-center space-x-4">
        <div className="p-3 bg-blue-500/10 rounded-full">
          <TrendingUp className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium">Projeção Mês Seguinte</p>
          <h3 className="text-2xl font-bold text-blue-500">{Money.fromCents(data.nextMonthProjectionCents).format()}</h3>
        </div>
      </div>

    </div>
  );
};
