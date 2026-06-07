import type { Account } from '../../domain/entities/Account';
import type { Transaction } from '../../domain/entities/Transaction';
import type { CreditCard } from '../../domain/entities/CreditCard';
import type { Category } from '../../domain/entities/Category';
import type { RecurringTemplate } from '../../domain/entities/RecurringTemplate';
import type { PasswordVaultEntry } from '../../domain/entities/PasswordVault';

const API_URL = '/api';

export type AiProvider = 'groq' | 'alibaba' | 'openai' | 'google';
export type AiTask = 'insights' | 'extraction' | 'categorization' | 'classification';

export interface AiTaskConfig {
  provider: AiProvider;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface AiConfig {
  defaultProvider: AiProvider;
  providers: Record<AiProvider, { baseUrl: string }>;
  tasks: Record<AiTask, AiTaskConfig>;
  apiKeys: Record<AiProvider, boolean>;
  apiKeyStatus: Record<AiProvider, 'configured' | 'demo' | 'missing'>;
  demoMode: boolean;
}

export interface AiUsageSummary {
  aggregate: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    byTask: Record<string, { calls: number; totalTokens: number }>;
    byProvider: Record<string, { calls: number; totalTokens: number }>;
  };
  logs: Array<{
    id: string;
    createdAt: string;
    task: AiTask;
    provider: AiProvider;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimated: boolean;
    latencyMs: number;
    success: boolean;
    error?: string;
  }>;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

const jsonHeaders = { 'Content-Type': 'application/json' };

export class ApiRepository {
  // ========== ACCOUNTS ==========
  static async getAccounts(): Promise<Account[]> {
    return request(`${API_URL}/accounts`);
  }

  static async saveAccount(account: Account): Promise<Account> {
    return request(`${API_URL}/accounts`, {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify(account),
    });
  }

  static async updateAccount(id: string, data: Partial<Account>): Promise<Account> {
    return request(`${API_URL}/accounts/${id}`, {
      method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async deleteAccount(id: string): Promise<void> {
    return request(`${API_URL}/accounts/${id}`, { method: 'DELETE' });
  }

  // ========== TRANSACTIONS ==========
  static async getTransactions(month?: string): Promise<Transaction[]> {
    const url = month ? `${API_URL}/transactions?month=${month}` : `${API_URL}/transactions`;
    return request(url);
  }

  static async getAllTransactions(): Promise<Transaction[]> {
    return request(`${API_URL}/transactions/all`);
  }

  static async saveTransaction(transaction: Partial<Transaction>): Promise<Transaction> {
    return request(`${API_URL}/transactions`, {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify(transaction),
    });
  }

  static async saveTransactionsBulk(transactions: Partial<Transaction>[]): Promise<Transaction[]> {
    return request(`${API_URL}/transactions/bulk`, {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify(transactions),
    });
  }

  static async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
    return request(`${API_URL}/transactions/${id}`, {
      method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async deleteTransaction(id: string): Promise<void> {
    return request(`${API_URL}/transactions/${id}`, { method: 'DELETE' });
  }

  // ========== CREDIT CARDS ==========
  static async getCreditCards(): Promise<CreditCard[]> {
    return request(`${API_URL}/credit-cards`);
  }

  static async saveCreditCard(card: CreditCard): Promise<CreditCard> {
    return request(`${API_URL}/credit-cards`, {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify(card),
    });
  }

  static async updateCreditCard(id: string, data: Partial<CreditCard>): Promise<CreditCard> {
    return request(`${API_URL}/credit-cards/${id}`, {
      method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async deleteCreditCard(id: string): Promise<void> {
    return request(`${API_URL}/credit-cards/${id}`, { method: 'DELETE' });
  }

  // ========== CATEGORIES ==========
  static async getCategories(): Promise<Category[]> {
    return request(`${API_URL}/categories`);
  }

  static async saveCategory(category: Partial<Category>): Promise<Category> {
    return request(`${API_URL}/categories`, {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify(category),
    });
  }

  static async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    return request(`${API_URL}/categories/${id}`, {
      method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async deleteCategory(id: string): Promise<void> {
    return request(`${API_URL}/categories/${id}`, { method: 'DELETE' });
  }

  // ========== RECURRING TEMPLATES ==========
  static async getRecurringTemplates(): Promise<RecurringTemplate[]> {
    return request(`${API_URL}/recurring-templates`);
  }

  static async saveRecurringTemplate(template: Partial<RecurringTemplate>): Promise<RecurringTemplate> {
    return request(`${API_URL}/recurring-templates`, {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify(template),
    });
  }

  static async updateRecurringTemplate(id: string, data: Partial<RecurringTemplate>): Promise<RecurringTemplate> {
    return request(`${API_URL}/recurring-templates/${id}`, {
      method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async deleteRecurringTemplate(id: string): Promise<void> {
    return request(`${API_URL}/recurring-templates/${id}`, { method: 'DELETE' });
  }

  static async generateRecurringBatch(id: string, untilDate: string): Promise<{ generated: number }> {
    return request(`${API_URL}/recurring-templates/${id}/generate`, {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify({ untilDate }),
    });
  }

  static async batchUpdateRecurring(id: string, updateData: Record<string, unknown>, scope: 'ALL' | 'FUTURE_ONLY'): Promise<{ updated: number }> {
    return request(`${API_URL}/recurring-templates/${id}/batch-update`, {
      method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ updateData, scope }),
    });
  }

  static async batchDeleteRecurring(id: string, scope: 'ALL' | 'FUTURE_ONLY'): Promise<{ deleted: number }> {
    return request(`${API_URL}/recurring-templates/${id}/batch-delete?scope=${scope}`, {
      method: 'DELETE',
    });
  }

  // ========== PASSWORD VAULT ==========
  static async getPasswordVault(): Promise<PasswordVaultEntry[]> {
    return request(`${API_URL}/password-vault`);
  }

  static async savePasswordVaultEntry(entry: PasswordVaultEntry): Promise<PasswordVaultEntry> {
    return request(`${API_URL}/password-vault`, {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify(entry),
    });
  }

  static async updatePasswordVaultEntry(id: string, data: Partial<PasswordVaultEntry>): Promise<PasswordVaultEntry> {
    return request(`${API_URL}/password-vault/${id}`, {
      method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }


  static async deletePasswordVaultEntry(id: string): Promise<void> {
    return request(`${API_URL}/password-vault/${id}`, { method: 'DELETE' });
  }

  // ========== INSIGHTS (AI) ==========
  static async getAiInsights(contextJson: string, image?: string): Promise<{ insights: string }> {
    return request(`${API_URL}/insights`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ contextJson, image }),
    });
  }

  static async categorizeTransactions(transactions: any[], categories: string[]): Promise<{ categorization: { id: string, category: string }[] }> {
    return request(`${API_URL}/categorize-bulk`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ transactions, categories }),
    });
  }

  static async classifyTransactions(transactions: any[]): Promise<{ classification: { id: string, expenseType: string }[] }> {
    return request(`${API_URL}/classify-bulk`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ transactions }),
    });
  }

  static async getAiConfig(): Promise<AiConfig> {
    return request(`${API_URL}/ai/config`);
  }

  static async updateAiConfig(config: Omit<AiConfig, 'apiKeys' | 'apiKeyStatus' | 'demoMode'>): Promise<AiConfig> {
    return request(`${API_URL}/ai/config`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(config),
    });
  }

  static async getAiUsage(limit = 100): Promise<AiUsageSummary> {
    return request(`${API_URL}/ai/usage?limit=${limit}`);
  }

  static async clearAiUsage(): Promise<void> {
    return request(`${API_URL}/ai/usage`, { method: 'DELETE' });
  }

  // ========== 3D FILAMENT INVENTORY ==========

  // --- Filaments (Catalog) ---
  static async getFilaments(): Promise<any[]> {
    return request(`${API_URL}/filaments`);
  }

  static async saveFilament(data: any): Promise<any> {
    return request(`${API_URL}/filaments`, {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async updateFilament(id: string, data: any): Promise<any> {
    return request(`${API_URL}/filaments/${id}`, {
      method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async deleteFilament(id: string): Promise<void> {
    return request(`${API_URL}/filaments/${id}`, { method: 'DELETE' });
  }

  // --- Filament Purchases ---
  static async getFilamentPurchases(): Promise<any[]> {
    return request(`${API_URL}/filament-purchases`);
  }

  static async saveFilamentPurchase(data: any): Promise<any> {
    return request(`${API_URL}/filament-purchases`, {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async updateFilamentPurchase(id: string, data: any): Promise<any> {
    return request(`${API_URL}/filament-purchases/${id}`, {
      method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async deleteFilamentPurchase(id: string): Promise<void> {
    return request(`${API_URL}/filament-purchases/${id}`, { method: 'DELETE' });
  }

  // --- Filament Stock ---
  static async getFilamentStocks(): Promise<any[]> {
    return request(`${API_URL}/filament-stocks`);
  }

  static async saveFilamentStock(data: any): Promise<any> {
    return request(`${API_URL}/filament-stocks`, {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async updateFilamentStock(id: string, data: any): Promise<any> {
    return request(`${API_URL}/filament-stocks/${id}`, {
      method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async deleteFilamentStock(id: string): Promise<void> {
    return request(`${API_URL}/filament-stocks/${id}`, { method: 'DELETE' });
  }

  // --- Filament Summary ---
  static async getFilamentSummary(): Promise<any> {
    return request(`${API_URL}/filament-summary`);
  }

  // --- Suppliers ---
  static async getSuppliers(): Promise<any[]> {
    return request(`${API_URL}/suppliers`);
  }

  static async saveSupplier(data: { name: string; url?: string }): Promise<any> {
    return request(`${API_URL}/suppliers`, {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async deleteSupplier(id: string): Promise<void> {
    return request(`${API_URL}/suppliers/${id}`, { method: 'DELETE' });
  }

  // --- Printers ---
  static async getPrinters(): Promise<any[]> {
    return request(`${API_URL}/printers`);
  }

  static async savePrinter(data: any): Promise<any> {
    return request(`${API_URL}/printers`, {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async updatePrinter(id: string, data: any): Promise<any> {
    return request(`${API_URL}/printers/${id}`, {
      method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async deletePrinter(id: string): Promise<void> {
    return request(`${API_URL}/printers/${id}`, { method: 'DELETE' });
  }

  // --- Accessories ---
  static async getAccessories(): Promise<any[]> {
    return request(`${API_URL}/accessories`);
  }

  static async saveAccessory(data: any): Promise<any> {
    return request(`${API_URL}/accessories`, {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async updateAccessory(id: string, data: any): Promise<any> {
    return request(`${API_URL}/accessories/${id}`, {
      method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async deleteAccessory(id: string): Promise<void> {
    return request(`${API_URL}/accessories/${id}`, { method: 'DELETE' });
  }

  // --- Print Jobs ---
  static async getPrintJobs(): Promise<any[]> {
    return request(`${API_URL}/print-jobs`);
  }

  static async savePrintJob(data: any): Promise<any> {
    return request(`${API_URL}/print-jobs`, {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async updatePrintJob(id: string, data: any): Promise<any> {
    return request(`${API_URL}/print-jobs/${id}`, {
      method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data),
    });
  }

  static async completePrintJob(id: string): Promise<any> {
    return request(`${API_URL}/print-jobs/${id}/complete`, {
      method: 'PUT', headers: jsonHeaders,
    });
  }

  static async deletePrintJob(id: string): Promise<void> {
    return request(`${API_URL}/print-jobs/${id}`, { method: 'DELETE' });
  }
}
