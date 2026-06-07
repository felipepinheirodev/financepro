import { useState } from 'react';
import { GroqApi } from '../../infrastructure/api/GroqApi';
import { useFinanceContext } from './useFinanceData';

export function useGroqInsights() {
  const { transactions, previousMonthResult } = useFinanceContext();
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const context = JSON.stringify({
        previousMonthResult,
        recentTransactions: transactions.slice(-20) // Only send the last 20 to avoid large payload
      });
      const result = await GroqApi.analyzeFinancialData(context);
      setInsights(result);
    } catch (err: any) {
      setError(err.message || 'Failed to get insights');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    insights,
    isLoading,
    error,
    getInsights
  };
}
