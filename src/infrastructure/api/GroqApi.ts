const API_URL = 'http://localhost:3000/api';

export class GroqApi {
  static async analyzeFinancialData(contextJson: string): Promise<string> {
    const response = await fetch(`${API_URL}/insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contextJson })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to fetch insights from backend');
    }

    const data = await response.json();
    return data.insights;
  }

  static async categorizeTransactions(transactions: any[], categories: string[]): Promise<any[]> {
    const response = await fetch(`${API_URL}/categorize-bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transactions, categories })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to categorize transactions');
    }

    const data = await response.json();
    return data.categorization;
  }
}
