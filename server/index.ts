import express from 'express';
import cors from 'cors';
import { Prisma, PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  callAi,
  clearAiUsage,
  getAiConfig,
  getAiUsageSummary,
  saveAiConfig,
  type AiProvider,
  type AiTask,
} from './ai';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

type GroqMessageContent = string | Array<{
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}>;

type GroqMessage = {
  role: 'system' | 'user';
  content: GroqMessageContent;
};

type GroqChatCompletion = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
};

app.disable('x-powered-by');

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
}));
app.use('/api', rateLimit({
  windowMs: 60_000,
  limit: Number(process.env.RATE_LIMIT_PER_MINUTE) || 120,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '5mb' }));

const requiredString = z.string().trim().min(1).max(255);
const optionalString = z.string().trim().max(1000).optional();
const optionalUrl = z.string().trim().url().max(2000).optional();
const optionalUuid = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.string().uuid().optional()
);
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const cents = z.coerce.number().int().safe();
const positiveInt = z.coerce.number().int().positive();
const nonNegativeInt = z.coerce.number().int().nonnegative();
const positiveNumber = z.coerce.number().positive();
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).optional();

const categorySchema = z.object({
  id: optionalUuid,
  name: requiredString,
  color: hexColor,
  icon: z.string().trim().min(1).max(80).optional(),
});

const accountSchema = z.object({
  id: optionalUuid,
  name: requiredString,
  type: z.enum(['CHECKING', 'SAVINGS', 'WALLET']),
  initialBalanceCents: cents,
  color: hexColor,
});

const creditCardSchema = z.object({
  id: optionalUuid,
  name: requiredString,
  accountId: z.string().uuid(),
  limitCents: nonNegativeInt,
  closingDay: z.coerce.number().int().min(1).max(31),
  dueDay: z.coerce.number().int().min(1).max(31),
  color: hexColor,
});

const transactionSchema = z.object({
  id: optionalUuid,
  accountId: z.string().uuid(),
  creditCardId: optionalUuid,
  categoryId: optionalUuid,
  recurringTemplateId: optionalUuid,
  description: requiredString,
  amountCents: nonNegativeInt,
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().trim().min(1).max(255),
  expenseType: z.enum(['FIXA', 'VARIAVEL']).optional(),
  date: dateString,
  status: z.enum(['PENDING', 'PAID']),
  isInstallment: z.boolean().optional(),
  installmentId: optionalUuid,
  currentInstallment: positiveInt.optional(),
  totalInstallments: positiveInt.optional(),
  interestRate: z.coerce.number().min(0).max(1000).optional(),
});

const recurringTemplateSchema = z.object({
  id: optionalUuid,
  description: requiredString,
  amountCents: nonNegativeInt,
  type: z.enum(['INCOME', 'EXPENSE']),
  expenseType: z.enum(['FIXA', 'VARIAVEL']).optional(),
  categoryId: optionalUuid,
  accountId: optionalUuid,
  creditCardId: optionalUuid,
  frequency: z.enum(['MONTHLY', 'WEEKLY', 'DAILY', 'YEARLY']).optional(),
  dayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
  isActive: z.boolean().optional(),
});

const passwordVaultSchema = z.object({
  id: optionalUuid,
  bankName: requiredString,
  login: optionalString,
  encryptedPassword: optionalString,
});

const supplierSchema = z.object({
  id: optionalUuid,
  name: requiredString,
  url: optionalUrl,
  notes: optionalString,
});

const filamentSchema = z.object({
  id: optionalUuid,
  brand: requiredString,
  material: requiredString,
  color: requiredString,
  colorHex: hexColor,
  weightGrams: positiveInt.optional(),
  diameterMm: positiveNumber.optional(),
  printTempMin: nonNegativeInt.optional(),
  printTempMax: nonNegativeInt.optional(),
  bedTempMin: nonNegativeInt.optional(),
  bedTempMax: nonNegativeInt.optional(),
  notes: optionalString,
});

const filamentPurchaseSchema = z.object({
  id: optionalUuid,
  filamentId: z.string().uuid(),
  store: requiredString,
  quantity: positiveInt,
  unitPriceCents: nonNegativeInt,
  totalPriceCents: nonNegativeInt,
  purchaseDate: dateString,
  link: optionalUrl,
  notes: optionalString,
});

const filamentStockSchema = z.object({
  id: optionalUuid,
  filamentId: z.string().uuid(),
  type: z.enum(['ENTRADA', 'SAIDA', 'PERDA']).optional(),
  quantityInStock: nonNegativeInt.optional(),
  usedGrams: nonNegativeInt.optional(),
  status: z.enum(['DISPONIVEL', 'EM_USO', 'ACABOU']).optional(),
  location: optionalString,
  notes: optionalString,
});

const printerSchema = z.object({
  id: optionalUuid,
  name: requiredString,
  powerWatts: positiveInt.optional(),
});

const accessorySchema = z.object({
  id: optionalUuid,
  name: requiredString,
  costCents: nonNegativeInt,
  stock: nonNegativeInt.optional(),
});

const printJobSchema = z.object({
  id: optionalUuid,
  printerId: z.string().uuid(),
  filamentId: z.string().uuid(),
  pieceName: requiredString,
  quantity: positiveInt,
  gramsPerPiece: positiveInt,
  totalGrams: positiveInt.optional(),
  printTimeHours: positiveNumber,
  nozzleTemp: positiveInt,
  bedTemp: nonNegativeInt,
  speedMmS: positiveInt.optional(),
  retractionMm: z.coerce.number().min(0).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
  energyCostCents: nonNegativeInt.optional(),
  filamentCostCents: nonNegativeInt.optional(),
});

const aiTransactionInputSchema = z.object({
  id: z.string().min(1).max(100),
  description: requiredString,
  isCredit: z.boolean().optional(),
});

const aiProviderSchema = z.enum(['groq', 'alibaba', 'openai', 'google']);
const aiTaskSchema = z.enum(['insights', 'extraction', 'categorization', 'classification']);
const aiTaskConfigSchema = z.object({
  provider: aiProviderSchema,
  model: requiredString,
  temperature: z.coerce.number().min(0).max(2),
  maxTokens: z.coerce.number().int().min(1).max(100000),
});
const aiConfigSchema = z.object({
  defaultProvider: aiProviderSchema,
  providers: z.object({
    groq: z.object({ baseUrl: z.string().url() }),
    alibaba: z.object({ baseUrl: z.string().url() }),
    openai: z.object({ baseUrl: z.string().url() }),
    google: z.object({ baseUrl: z.string().url() }),
  }),
  tasks: z.object({
    insights: aiTaskConfigSchema,
    extraction: aiTaskConfigSchema,
    categorization: aiTaskConfigSchema,
    classification: aiTaskConfigSchema,
  }),
});

const validationRules = [
  { method: 'POST', path: /^\/categories$/, schema: categorySchema },
  { method: 'PUT', path: /^\/categories\/[^/]+$/, schema: categorySchema.partial() },
  { method: 'POST', path: /^\/accounts$/, schema: accountSchema },
  { method: 'PUT', path: /^\/accounts\/[^/]+$/, schema: accountSchema.partial() },
  { method: 'POST', path: /^\/credit-cards$/, schema: creditCardSchema },
  { method: 'PUT', path: /^\/credit-cards\/[^/]+$/, schema: creditCardSchema.partial() },
  { method: 'POST', path: /^\/transactions$/, schema: transactionSchema },
  { method: 'POST', path: /^\/transactions\/bulk$/, schema: z.array(transactionSchema).min(1).max(200) },
  { method: 'PUT', path: /^\/transactions\/[^/]+$/, schema: transactionSchema.partial() },
  { method: 'POST', path: /^\/recurring-templates$/, schema: recurringTemplateSchema },
  { method: 'PUT', path: /^\/recurring-templates\/[^/]+$/, schema: recurringTemplateSchema.partial() },
  {
    method: 'PUT',
    path: /^\/recurring-templates\/[^/]+\/batch-update$/,
    schema: z.object({
      updateData: transactionSchema.partial(),
      scope: z.enum(['ALL', 'FUTURE_ONLY']),
    }),
  },
  {
    method: 'POST',
    path: /^\/recurring-templates\/[^/]+\/generate$/,
    schema: z.object({ untilDate: dateString }),
  },
  { method: 'POST', path: /^\/password-vault$/, schema: passwordVaultSchema },
  { method: 'PUT', path: /^\/password-vault\/[^/]+$/, schema: passwordVaultSchema.partial() },
  {
    method: 'POST',
    path: /^\/insights$/,
    schema: z.object({
      contextJson: z.string().min(1).max(250_000),
      image: z.string().startsWith('data:image/').max(4_000_000).optional(),
    }),
  },
  {
    method: 'POST',
    path: /^\/categorize-bulk$/,
    schema: z.object({
      transactions: z.array(aiTransactionInputSchema.pick({ id: true, description: true })).min(1).max(50),
      categories: z.array(requiredString).min(1).max(100),
    }),
  },
  {
    method: 'POST',
    path: /^\/classify-bulk$/,
    schema: z.object({
      transactions: z.array(aiTransactionInputSchema).min(1).max(50),
    }),
  },
  { method: 'PUT', path: /^\/ai\/config$/, schema: aiConfigSchema },
  { method: 'POST', path: /^\/suppliers$/, schema: supplierSchema },
  { method: 'PUT', path: /^\/suppliers\/[^/]+$/, schema: supplierSchema.partial() },
  { method: 'POST', path: /^\/filaments$/, schema: filamentSchema },
  { method: 'PUT', path: /^\/filaments\/[^/]+$/, schema: filamentSchema.partial() },
  { method: 'POST', path: /^\/filament-purchases$/, schema: filamentPurchaseSchema },
  { method: 'PUT', path: /^\/filament-purchases\/[^/]+$/, schema: filamentPurchaseSchema.partial() },
  { method: 'POST', path: /^\/filament-stocks$/, schema: filamentStockSchema },
  { method: 'PUT', path: /^\/filament-stocks\/[^/]+$/, schema: filamentStockSchema.partial() },
  { method: 'POST', path: /^\/printers$/, schema: printerSchema },
  { method: 'POST', path: /^\/accessories$/, schema: accessorySchema },
  { method: 'POST', path: /^\/print-jobs$/, schema: printJobSchema },
];

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected server error';
}

function sendServerError(res: express.Response, error: unknown) {
  console.error(getErrorMessage(error));
  res.status(500).json({ error: 'Internal server error' });
}

app.use('/api', (req, res, next) => {
  const rule = validationRules.find((candidate) => (
    candidate.method === req.method && candidate.path.test(req.path)
  ));

  if (!rule) {
    next();
    return;
  }

  const parsed = rule.schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request body',
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  req.body = parsed.data;
  next();
});

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// ========== CATEGORIES ==========

const DEFAULT_CATEGORIES = [
  { name: 'Casa', color: '#F59E0B', icon: 'Home' },
  { name: 'Alimentação', color: '#EF4444', icon: 'UtensilsCrossed' },
  { name: 'Gasolina', color: '#8B5CF6', icon: 'Fuel' },
  { name: 'Saúde', color: '#10B981', icon: 'Heart' },
  { name: 'Imposto', color: '#6B7280', icon: 'Receipt' },
  { name: 'Lazer', color: '#EC4899', icon: 'PartyPopper' },
  { name: 'Vestuário', color: '#14B8A6', icon: 'Shirt' },
  { name: 'Eletrônico', color: '#3B82F6', icon: 'Smartphone' },
  { name: 'Educação', color: '#8B5CF6', icon: 'GraduationCap' },
  { name: 'Carro', color: '#F97316', icon: 'Car' },
  { name: 'Assinatura', color: '#06B6D4', icon: 'CreditCard' },
  { name: 'Pg Conta', color: '#A855F7', icon: 'Banknote' },
  { name: 'Compra Terceiros', color: '#F43F5E', icon: 'Users' },
  { name: 'Cidadania', color: '#22C55E', icon: 'Flag' },
  { name: 'Estúdio', color: '#D946EF', icon: 'Palette' },
  { name: 'Cartão', color: '#0EA5E9', icon: 'CreditCard' },
  { name: 'Telefonia', color: '#64748B', icon: 'Phone' },
  { name: 'Casa Reforma', color: '#CA8A04', icon: 'Hammer' },
  { name: 'Roupas', color: '#E11D48', icon: 'Shirt' },
  { name: 'Impressão 3D', color: '#7C3AED', icon: 'Printer' },
  { name: 'Academia', color: '#059669', icon: 'Dumbbell' },
  { name: 'Seguro', color: '#475569', icon: 'Shield' },
  { name: 'Salário', color: '#16A34A', icon: 'DollarSign' },
  { name: 'Benefício', color: '#2563EB', icon: 'Gift' },
  { name: 'Outros', color: '#9CA3AF', icon: 'Tag' },
];

// Seed categories on startup
async function seedCategories() {
  const count = await prisma.category.count();
  if (count === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await prisma.category.create({ data: cat });
    }
    console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories.`);
  }
}

app.get('/api/categories', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const category = await prisma.category.create({ data: req.body });
    res.json(category);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(category);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// ========== ACCOUNTS ==========

app.get('/api/accounts', async (_req, res) => {
  try {
    const accounts = await prisma.account.findMany({ orderBy: { name: 'asc' } });
    res.json(accounts);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    const account = await prisma.account.create({ data: req.body });
    res.json(account);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.put('/api/accounts/:id', async (req, res) => {
  try {
    const account = await prisma.account.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(account);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  try {
    await prisma.account.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// ========== CREDIT CARDS ==========

app.get('/api/credit-cards', async (_req, res) => {
  try {
    const cards = await prisma.creditCard.findMany({ orderBy: { name: 'asc' } });
    res.json(cards);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.post('/api/credit-cards', async (req, res) => {
  try {
    const card = await prisma.creditCard.create({ data: req.body });
    res.json(card);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.put('/api/credit-cards/:id', async (req, res) => {
  try {
    const card = await prisma.creditCard.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(card);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.delete('/api/credit-cards/:id', async (req, res) => {
  try {
    await prisma.creditCard.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// ========== TRANSACTIONS ==========

app.get('/api/transactions', async (req, res) => {
  try {
    const { month } = req.query; // format: YYYY-MM
    const where: Prisma.TransactionWhereInput = {};
    
    if (month && typeof month === 'string') {
      // Filter transactions by month prefix in date string
      where.date = {
        startsWith: month
      };
    }
    
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' }
    });
    res.json(transactions);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.get('/api/transactions/all', async (_req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(transactions);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const transaction = await prisma.transaction.create({ data: req.body });
    res.json(transaction);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.post('/api/transactions/bulk', async (req, res) => {
  const transactions = req.body;
  if (!Array.isArray(transactions)) return res.status(400).json({ error: 'Expected array' });
  
  try {
    const created = await prisma.$transaction(
      transactions.map((t) => prisma.transaction.create({ data: t }))
    );
    res.json(created);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(transaction);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// ========== RECURRING TEMPLATES ==========

app.get('/api/recurring-templates', async (_req, res) => {
  try {
    const templates = await prisma.recurringTemplate.findMany({
      include: { transactions: { select: { id: true, date: true, status: true } } },
      orderBy: { description: 'asc' }
    });
    res.json(templates);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.post('/api/recurring-templates', async (req, res) => {
  try {
    const template = await prisma.recurringTemplate.create({ data: req.body });
    res.json(template);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.put('/api/recurring-templates/:id', async (req, res) => {
  try {
    const template = await prisma.recurringTemplate.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(template);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// Update batch of recurring transactions
app.put('/api/recurring-templates/:id/batch-update', async (req, res) => {
  const { id } = req.params;
  const { updateData, scope } = req.body; 
  // scope: 'ALL' | 'FUTURE_ONLY'
  // updateData: fields to update on transactions
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const where: Prisma.TransactionWhereInput = { recurringTemplateId: id };
    
    if (scope === 'FUTURE_ONLY') {
      where.date = { gte: today };
    }
    
    const result = await prisma.transaction.updateMany({
      where,
      data: updateData
    });
    
    res.json({ updated: result.count });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// Delete batch of recurring transactions
app.delete('/api/recurring-templates/:id/batch-delete', async (req, res) => {
  const { id } = req.params;
  const { scope } = req.query;
  // scope: 'ALL' | 'FUTURE_ONLY'
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const where: Prisma.TransactionWhereInput = { recurringTemplateId: id };
    
    if (scope === 'FUTURE_ONLY') {
      where.date = { gte: today };
    }
    
    const result = await prisma.transaction.deleteMany({ where });
    
    // If deleting all, also delete the template
    if (scope === 'ALL') {
      await prisma.recurringTemplate.delete({ where: { id } });
    }
    
    res.json({ deleted: result.count });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.delete('/api/recurring-templates/:id', async (req, res) => {
  try {
    await prisma.recurringTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// Generate batch of transactions from recurring template
app.post('/api/recurring-templates/:id/generate', async (req, res) => {
  const { id } = req.params;
  const { untilDate } = req.body; // YYYY-MM-DD
  
  try {
    const template = await prisma.recurringTemplate.findUnique({ where: { id } });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    
    // Find last generated transaction for this template
    const lastTx = await prisma.transaction.findFirst({
      where: { recurringTemplateId: id },
      orderBy: { date: 'desc' }
    });
    
    const startDate = lastTx 
      ? new Date(lastTx.date) 
      : new Date();
    
    const endDate = new Date(untilDate);
    const transactions: Prisma.TransactionUncheckedCreateInput[] = [];
    let accountId = template.accountId;

    if (!accountId && template.creditCardId) {
      const card = await prisma.creditCard.findUnique({
        where: { id: template.creditCardId },
        select: { accountId: true },
      });
      accountId = card?.accountId ?? null;
    }

    if (!accountId) {
      return res.status(400).json({ error: 'Template must be linked to an account or a credit card with an account' });
    }
    
    // Start from next month after last transaction (or current month if none)
    const currentDate = new Date(startDate);
    if (lastTx) {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    if (template.dayOfMonth) {
      currentDate.setDate(template.dayOfMonth);
    }
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      transactions.push({
        accountId,
        creditCardId: template.creditCardId || undefined,
        categoryId: template.categoryId || undefined,
        recurringTemplateId: template.id,
        description: template.description,
        amountCents: template.amountCents,
        type: template.type,
        category: template.description, // legacy
        expenseType: template.expenseType,
        date: dateStr,
        status: 'PENDING',
        isInstallment: false
      });
      
      // Next month
      currentDate.setMonth(currentDate.getMonth() + 1);
      if (template.dayOfMonth) {
        currentDate.setDate(template.dayOfMonth);
      }
    }
    
    if (transactions.length === 0) {
      return res.json({ generated: 0, transactions: [] });
    }
    
    const created = await prisma.$transaction(
      transactions.map((t) => prisma.transaction.create({ data: t }))
    );
    
    res.json({ generated: created.length, transactions: created });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// ========== PASSWORD VAULT ==========

app.get('/api/password-vault', async (_req, res) => {
  try {
    const entries = await prisma.passwordVaultEntry.findMany();
    res.json(entries);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.post('/api/password-vault', async (req, res) => {
  try {
    const entry = await prisma.passwordVaultEntry.create({ data: req.body });
    res.json(entry);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.put('/api/password-vault/:id', async (req, res) => {
  try {
    const entry = await prisma.passwordVaultEntry.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(entry);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});


app.delete('/api/password-vault/:id', async (req, res) => {
  try {
    await prisma.passwordVaultEntry.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// ========== INSIGHTS (AI) ==========

app.get('/api/ai/config', (_req, res) => {
  res.json(getAiConfig());
});

app.put('/api/ai/config', (req, res) => {
  try {
    res.json(saveAiConfig(req.body));
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.get('/api/ai/usage', (req, res) => {
  const limit = Number(req.query.limit || 100);
  res.json(getAiUsageSummary(Number.isFinite(limit) ? limit : 100));
});

app.delete('/api/ai/usage', (_req, res) => {
  clearAiUsage();
  res.json({ success: true });
});

app.post('/api/insights', async (req, res) => {
  const { contextJson, image } = req.body; // image: data:image/jpeg;base64,...

  try {
    const isExtraction = !!image || contextJson.includes("extrato") || contextJson.includes("Extraia");
    
    let systemPrompt = 'Você é um consultor financeiro pessoal de elite. Analise os dados do usuário e forneça insights acionáveis, dicas de economia e uma visão geral da saúde financeira. Use markdown (negrito, listas, emojis) para uma resposta elegante. Seja amigável e direto em português do Brasil. Analise gastos excessivos, categorias com maior impacto e sugira metas.';
    
    if (isExtraction) {
      systemPrompt = 'Você é um extrator de dados bancários. Extraia as transações (data, descrição, valor). Retorne OBRIGATORIAMENTE um JSON no formato { "transactions": [ { "date": "YYYY-MM-DD", "description": "...", "amountCents": 123, "type": "EXPENSE" } ] }. Determine se é "EXPENSE" ou "INCOME". Retorne APENAS o JSON, sem textos explicativos.';
    }

    const messages: GroqMessage[] = [{ role: 'system', content: systemPrompt }];

    if (image) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: contextJson || 'Extraia as transações desta imagem de extrato bancário.' },
          { type: 'image_url', image_url: { url: image } }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: contextJson
      });
    }

    const aiResult = await callAi({
      task: isExtraction ? 'extraction' : 'insights',
      messages,
      jsonMode: isExtraction,
    });
    res.json({ insights: aiResult.content, usage: aiResult.usage, provider: aiResult.provider, model: aiResult.model });
  } catch (error: unknown) {
    console.error('Error proxying to AI provider:', getErrorMessage(error));
    sendServerError(res, error);
  }
});

app.post('/api/categorize-bulk', async (req, res) => {
  const { transactions, categories } = req.body; 
  // transactions: [{ id: string, description: string }]
  // categories: string[]

  try {
    const systemPrompt = `Você é um assistente financeiro especialista em categorização de extratos bancários.
    Receba uma lista de descrições de transações e uma lista de categorias permitidas.
    Sua tarefa é mapear OBRIGATORIAMENTE cada transação para a categoria mais adequada da lista fornecida.
    Se não houver nenhuma minimamente adequada, use "Outros".
    Retorne OBRIGATORIAMENTE um JSON no formato: { "categorization": [ { "id": "id_da_transacao", "category": "nome_da_categoria" } ] }.
    Retorne APENAS o JSON.`;

    const userPrompt = `Categorias permitidas: ${categories.join(', ')}\n\nTransações:\n${JSON.stringify(transactions)}`;

    const aiResult = await callAi({
      task: 'categorization',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      jsonMode: true,
    });
    const result = JSON.parse(aiResult.content);
    res.json({ ...result, usage: aiResult.usage, provider: aiResult.provider, model: aiResult.model });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.post('/api/classify-bulk', async (req, res) => {
  const { transactions } = req.body; 
  // transactions: [{ id: string, description: string, isCredit: boolean }]

  try {
    const systemPrompt = `Você é um assistente financeiro especialista em organizar orçamentos domésticos.
    Sua tarefa é classificar cada transação como "FIXA" ou "VARIAVEL".
    REGRAS:
    - FIXA: Contas de sobrevivência e recorrência (Aluguel, Condomínio, Luz, Água, Internet, Telefonia, Assinaturas, Escola, Academia).
    - VARIAVEL: Consumo volátil e compras eventuais (Supermercado, Restaurante, Combustível, Farmácia, Roupas, Eletrônicos, Lazer).
    - Se a transação foi feita no CARTÃO DE CRÉDITO e não parece uma conta recorrente, classifique como VARIAVEL.
    Retorne OBRIGATORIAMENTE um JSON no formato: { "classification": [ { "id": "id_da_transacao", "expenseType": "FIXA" | "VARIAVEL" } ] }.
    Retorne APENAS o JSON.`;

    const userPrompt = `Transações para classificar:\n${JSON.stringify(transactions)}`;

    const aiResult = await callAi({
      task: 'classification',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      jsonMode: true,
    });
    const result = JSON.parse(aiResult.content);
    res.json({ ...result, usage: aiResult.usage, provider: aiResult.provider, model: aiResult.model });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// ========== SUPPLIERS ==========

const DEFAULT_SUPPLIERS = [
  { name: 'Shopee', url: 'https://shopee.com.br' },
  { name: 'Mercado Livre', url: 'https://mercadolivre.com.br' },
  { name: 'AliExpress', url: 'https://aliexpress.com' },
  { name: 'Amazon', url: 'https://amazon.com.br' },
];

async function seedSuppliers() {
  for (const s of DEFAULT_SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }
  console.log('Suppliers seeded.');
}

app.get('/api/suppliers', async (_req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    res.json(suppliers);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const supplier = await prisma.supplier.create({ data: req.body });
    res.json(supplier);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: req.body });
    res.json(supplier);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    await prisma.supplier.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// ========== 3D FILAMENT INVENTORY ==========

// --- Filaments (Catalog) ---
app.get('/api/filaments', async (_req, res) => {
  try {
    const filaments = await prisma.filament.findMany({
      orderBy: { brand: 'asc' },
      include: { purchases: true, stocks: true }
    });
    res.json(filaments);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.post('/api/filaments', async (req, res) => {
  try {
    const filament = await prisma.filament.create({ data: req.body });
    res.json(filament);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.put('/api/filaments/:id', async (req, res) => {
  try {
    const filament = await prisma.filament.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(filament);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.delete('/api/filaments/:id', async (req, res) => {
  try {
    await prisma.filament.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// --- Filament Purchases ---
app.get('/api/filament-purchases', async (_req, res) => {
  try {
    const purchases = await prisma.filamentPurchase.findMany({
      orderBy: { purchaseDate: 'desc' },
      include: { filament: true }
    });
    res.json(purchases);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.post('/api/filament-purchases', async (req, res) => {
  try {
    const purchase = await prisma.filamentPurchase.create({
      data: req.body,
      include: { filament: true }
    });
    res.json(purchase);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.put('/api/filament-purchases/:id', async (req, res) => {
  try {
    const purchase = await prisma.filamentPurchase.update({
      where: { id: req.params.id },
      data: req.body,
      include: { filament: true }
    });
    res.json(purchase);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.delete('/api/filament-purchases/:id', async (req, res) => {
  try {
    await prisma.filamentPurchase.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// --- Filament Stock ---
app.get('/api/filament-stocks', async (_req, res) => {
  try {
    const stocks = await prisma.filamentStock.findMany({
      orderBy: { createdAt: 'desc' },
      include: { filament: true }
    });
    res.json(stocks);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.post('/api/filament-stocks', async (req, res) => {
  try {
    const stock = await prisma.filamentStock.create({
      data: req.body,
      include: { filament: true }
    });
    res.json(stock);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.put('/api/filament-stocks/:id', async (req, res) => {
  try {
    const stock = await prisma.filamentStock.update({
      where: { id: req.params.id },
      data: req.body,
      include: { filament: true }
    });
    res.json(stock);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.delete('/api/filament-stocks/:id', async (req, res) => {
  try {
    await prisma.filamentStock.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// --- Filament Summary / Dashboard ---
app.get('/api/filament-summary', async (_req, res) => {
  try {
    const [filaments, purchases, stocks] = await Promise.all([
      prisma.filament.count(),
      prisma.filamentPurchase.findMany(),
      prisma.filamentStock.findMany(),
    ]);

    const totalSpent = purchases.reduce((acc, p) => acc + p.totalPriceCents, 0);
    const totalSpools = purchases.reduce((acc, p) => acc + p.quantity, 0);

    // Calculate physical stock per filament (capped at 0) to stay perfectly in sync with frontend
    const filamentIds = Array.from(new Set(purchases.map(p => p.filamentId)));
    let inStock = 0;
    for (const fid of filamentIds) {
      const fPurchased = purchases.filter(p => p.filamentId === fid).reduce((acc, p) => acc + p.quantity, 0);
      const fSaida = stocks.filter(s => s.filamentId === fid && s.type === 'SAIDA').reduce((acc, s) => acc + s.quantityInStock, 0);
      const fPerda = stocks.filter(s => s.filamentId === fid && s.type === 'PERDA').reduce((acc, s) => acc + s.quantityInStock, 0);
      inStock += Math.max(0, fPurchased - fSaida - fPerda);
    }

    const avgPrice = totalSpools > 0 ? Math.round(totalSpent / totalSpools) : 0;

    res.json({
      totalFilamentTypes: filaments,
      totalSpoolsPurchased: totalSpools,
      totalSpentCents: totalSpent,
      currentInStock: inStock,
      averagePriceCents: avgPrice,
    });
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// ========== MÓDULO 3D PRINTING FILAMENT INVENTORY & JOBS ==========

// Tarifa estimada de energia por kWh (Ex: Cemig residencial ~ R$ 0,95)
const ENERGY_TARIFF_KWH = Number(process.env.ENERGY_TARIFF_KWH) || 0.95;

// --- IMPRESSORAS ---
app.get('/api/printers', async (req, res) => {
  try {
    const printers = await prisma.printer.findMany({ where: { tenantId: "default-tenant" } });
    res.json(printers);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.post('/api/printers', async (req, res) => {
  try {
    const printer = await prisma.printer.create({ data: { ...req.body, tenantId: "default-tenant" } });
    res.json(printer);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// --- ACESSÓRIOS ---
app.get('/api/accessories', async (req, res) => {
  try {
    const accessories = await prisma.accessory.findMany({ where: { tenantId: "default-tenant" } });
    res.json(accessories);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

app.post('/api/accessories', async (req, res) => {
  try {
    const accessory = await prisma.accessory.create({ data: { ...req.body, tenantId: "default-tenant" } });
    res.json(accessory);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// --- PRINT JOBS (PRODUÇÃO) ---
app.get('/api/print-jobs', async (req, res) => {
  try {
    const jobs = await prisma.printJob.findMany({
      where: { tenantId: "default-tenant" },
      include: { printer: true, filament: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// Criar o Job pendente (Registrar na fila ou no fatiador)
app.post('/api/print-jobs', async (req, res) => {
  try {
    const { quantity, gramsPerPiece } = req.body;
    const totalGrams = quantity * gramsPerPiece;

    const job = await prisma.printJob.create({
      data: {
        ...req.body,
        totalGrams,
        tenantId: "default-tenant"
      }
    });
    res.json(job);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// CONCLUIR JOB: O coração da regra de negócio (Baixa automática + Cálculo de Custo bruto)
app.put('/api/print-jobs/:id/complete', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buscar dados do Job, Impressora e Compras do filamento
      const job = await tx.printJob.findUnique({
        where: { id },
        include: { printer: true, filament: { include: { purchases: true } } }
      });

      if (!job) throw new Error('Job não encontrado');
      if (job.status === 'COMPLETED') throw new Error('Este job já foi concluído');

      // 2. Calcular Custo de Energia Elétrica
      // Fórmula: (Watts / 1000) * Horas * Tarifa_KWh * 100 (para centavos)
      const kwhConsumed = (job.printer.powerWatts / 1000) * job.printTimeHours;
      const energyCostCents = Math.round(kwhConsumed * ENERGY_TARIFF_KWH * 100);

      // 3. Calcular Custo Bruto do Filamento gasto
      // Busca o preço médio pago pelo carretel específico
      const totalPurchasedGrams = job.filament.purchases.reduce((acc, p) => acc + (p.quantity * job.filament.weightGrams), 0);
      const totalSpentCents = job.filament.purchases.reduce((acc, p) => acc + p.totalPriceCents, 0);
      
      const costPerGram = totalPurchasedGrams > 0 ? (totalSpentCents / totalPurchasedGrams) : 0;
      const filamentCostCents = Math.round(job.totalGrams * costPerGram);

      // 4. Atualizar o Status do Job e salvar os custos reais calculados
      const updatedJob = await tx.printJob.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          energyCostCents,
          filamentCostCents
        }
      });

      // 5. Deduzir do Estoque criando uma movimentação automática de SAÍDA em gramas
      // Como a sua tabela `FilamentStock` atual usa quantidadeInStock para rolos inteiros,
      // injetamos a redução granular no campo `usedGrams`.
      await tx.filamentStock.create({
        data: {
          filamentId: job.filamentId,
          type: 'SAIDA',
          quantityInStock: 0, // Não saiu um rolo inteiro, saíram apenas gramas
          usedGrams: job.totalGrams,
          status: 'EM_USO',
          notes: `Baixa automática: ${job.quantity}x ${job.pieceName}`,
          tenantId: "default-tenant"
        }
      });

      return updatedJob;
    });

    res.json(result);
  } catch (error: unknown) {
    sendServerError(res, error);
  }
});

// ========== START ==========

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

Promise.all([seedCategories(), seedSuppliers()])
  .then(() => {
    app.listen(Number(PORT), HOST, () => {
      console.log(`Backend server running on http://${HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Seed error:', err);
    app.listen(Number(PORT), HOST, () => {
      console.log(`Backend server running on http://${HOST}:${PORT}`);
    });
  });
