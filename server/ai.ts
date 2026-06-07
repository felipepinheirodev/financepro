import fs from 'fs';
import path from 'path';

export type AiProvider = 'groq' | 'alibaba' | 'openai' | 'google';
export type AiTask = 'insights' | 'extraction' | 'categorization' | 'classification';

export type AiChatMessage = {
  role: 'system' | 'user';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
};

export type AiTaskConfig = {
  provider: AiProvider;
  model: string;
  temperature: number;
  maxTokens: number;
};

export type AiConfig = {
  defaultProvider: AiProvider;
  tasks: Record<AiTask, AiTaskConfig>;
  providers: Record<AiProvider, {
    baseUrl: string;
  }>;
};

export type SafeAiConfig = AiConfig & {
  apiKeys: Record<AiProvider, boolean>;
  apiKeyStatus: Record<AiProvider, 'configured' | 'demo' | 'missing'>;
  demoMode: boolean;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

type AiCallParams = {
  task: AiTask;
  messages: AiChatMessage[];
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
};

export type AiCallResult = {
  content: string;
  provider: AiProvider;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimated: boolean;
  };
};

export type AiUsageLog = {
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
};

const configPath = path.resolve(process.cwd(), 'ai-config.local.json');
const usagePath = path.resolve(process.cwd(), 'ai-usage.local.json');

const taskLabels: AiTask[] = ['insights', 'extraction', 'categorization', 'classification'];

function envProvider(value?: string): AiProvider {
  if (value === 'google') return 'google';
  if (value === 'openai') return 'openai';
  return value === 'alibaba' ? 'alibaba' : 'groq';
}

function isAiDemoMode() {
  return process.env.AI_DEMO_MODE === 'true';
}

function defaultConfig(): AiConfig {
  const defaultProvider = envProvider(process.env.AI_PROVIDER_DEFAULT);
  const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const groqVisionModel = process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision';
  const alibabaModel = process.env.ALIBABA_MODEL || process.env.QWEN_MODEL || 'qwen-plus';
  const alibabaVisionModel = process.env.ALIBABA_VISION_MODEL || process.env.QWEN_VISION_MODEL || alibabaModel;
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const openaiVisionModel = process.env.OPENAI_VISION_MODEL || openaiModel;
  const googleModel = process.env.GOOGLE_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const googleVisionModel = process.env.GOOGLE_GEMINI_VISION_MODEL || process.env.GEMINI_VISION_MODEL || googleModel;
  const modelByProvider: Record<AiProvider, string> = {
    groq: groqModel,
    alibaba: alibabaModel,
    openai: openaiModel,
    google: googleModel,
  };
  const visionModelByProvider: Record<AiProvider, string> = {
    groq: groqVisionModel,
    alibaba: alibabaVisionModel,
    openai: openaiVisionModel,
    google: googleVisionModel,
  };

  return {
    defaultProvider,
    providers: {
      groq: {
        baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
      },
      alibaba: {
        baseUrl: process.env.ALIBABA_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
      },
      openai: {
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      },
      google: {
        baseUrl: process.env.GOOGLE_GEMINI_BASE_URL || process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai',
      },
    },
    tasks: {
      insights: {
        provider: envProvider(process.env.AI_PROVIDER_INSIGHTS || defaultProvider),
        model: process.env.AI_MODEL_INSIGHTS || modelByProvider[defaultProvider],
        temperature: 0.7,
        maxTokens: 4096,
      },
      extraction: {
        provider: envProvider(process.env.AI_PROVIDER_EXTRACTION || defaultProvider),
        model: process.env.AI_MODEL_EXTRACTION || visionModelByProvider[defaultProvider],
        temperature: 0.1,
        maxTokens: 4096,
      },
      categorization: {
        provider: envProvider(process.env.AI_PROVIDER_CATEGORIZATION || defaultProvider),
        model: process.env.AI_MODEL_CATEGORIZATION || modelByProvider[defaultProvider],
        temperature: 0.1,
        maxTokens: 4096,
      },
      classification: {
        provider: envProvider(process.env.AI_PROVIDER_CLASSIFICATION || defaultProvider),
        model: process.env.AI_MODEL_CLASSIFICATION || modelByProvider[defaultProvider],
        temperature: 0.1,
        maxTokens: 4096,
      },
    },
  };
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(filePath: string, data: T) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function normalizeConfig(config: AiConfig): AiConfig {
  const defaults = defaultConfig();
  return {
    defaultProvider: config.defaultProvider || defaults.defaultProvider,
    providers: {
      groq: {
        baseUrl: config.providers?.groq?.baseUrl || defaults.providers.groq.baseUrl,
      },
      alibaba: {
        baseUrl: config.providers?.alibaba?.baseUrl || defaults.providers.alibaba.baseUrl,
      },
      openai: {
        baseUrl: config.providers?.openai?.baseUrl || defaults.providers.openai.baseUrl,
      },
      google: {
        baseUrl: config.providers?.google?.baseUrl || defaults.providers.google.baseUrl,
      },
    },
    tasks: taskLabels.reduce((acc, task) => {
      acc[task] = {
        provider: config.tasks?.[task]?.provider || defaults.tasks[task].provider,
        model: config.tasks?.[task]?.model || defaults.tasks[task].model,
        temperature: Number.isFinite(config.tasks?.[task]?.temperature) ? config.tasks[task].temperature : defaults.tasks[task].temperature,
        maxTokens: Number.isFinite(config.tasks?.[task]?.maxTokens) ? config.tasks[task].maxTokens : defaults.tasks[task].maxTokens,
      };
      return acc;
    }, {} as Record<AiTask, AiTaskConfig>),
  };
}

export function getAiConfig(): SafeAiConfig {
  const config = normalizeConfig(readJson<AiConfig>(configPath, defaultConfig()));
  const demoMode = isAiDemoMode();
  const groqKeyConfigured = Boolean(process.env.GROQ_API_KEY);
  const alibabaKeyConfigured = Boolean(process.env.ALIBABA_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY);
  const openaiKeyConfigured = Boolean(process.env.OPENAI_API_KEY);
  const googleKeyConfigured = Boolean(process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY);

  return {
    ...config,
    apiKeys: {
      groq: groqKeyConfigured,
      alibaba: alibabaKeyConfigured || demoMode,
      openai: openaiKeyConfigured,
      google: googleKeyConfigured,
    },
    apiKeyStatus: {
      groq: groqKeyConfigured ? 'configured' : 'missing',
      alibaba: alibabaKeyConfigured ? 'configured' : demoMode ? 'demo' : 'missing',
      openai: openaiKeyConfigured ? 'configured' : 'missing',
      google: googleKeyConfigured ? 'configured' : 'missing',
    },
    demoMode,
  };
}

export function saveAiConfig(config: AiConfig): SafeAiConfig {
  const normalized = normalizeConfig(config);
  writeJson(configPath, normalized);
  return getAiConfig();
}

function getProviderApiKey(provider: AiProvider): string | undefined {
  if (provider === 'alibaba') {
    return process.env.ALIBABA_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
  }

  if (provider === 'openai') {
    return process.env.OPENAI_API_KEY;
  }

  if (provider === 'google') {
    return process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  }

  return process.env.GROQ_API_KEY;
}

function estimateTokens(messages: AiChatMessage[], content: string) {
  const input = messages.map((message) => JSON.stringify(message.content)).join('\n');
  const promptTokens = Math.ceil(input.length / 4);
  const completionTokens = Math.ceil(content.length / 4);
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    estimated: true,
  };
}

function readUsageLogs(): AiUsageLog[] {
  return readJson<AiUsageLog[]>(usagePath, []);
}

function appendUsageLog(log: AiUsageLog) {
  const logs = readUsageLogs();
  logs.unshift(log);
  writeJson(usagePath, logs.slice(0, 1000));
}

function logUsage(log: Omit<AiUsageLog, 'id' | 'createdAt'>) {
  appendUsageLog({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...log,
  });
}

function getDemoUsageLogs(): AiUsageLog[] {
  const now = Date.now();
  return [
    {
      id: 'demo-alibaba-insights',
      createdAt: new Date(now - 12 * 60_000).toISOString(),
      task: 'insights',
      provider: 'alibaba',
      model: process.env.ALIBABA_MODEL || process.env.QWEN_MODEL || 'qwen-plus',
      promptTokens: 1840,
      completionTokens: 920,
      totalTokens: 2760,
      estimated: false,
      latencyMs: 1280,
      success: true,
    },
    {
      id: 'demo-alibaba-extraction',
      createdAt: new Date(now - 38 * 60_000).toISOString(),
      task: 'extraction',
      provider: 'alibaba',
      model: process.env.ALIBABA_VISION_MODEL || process.env.QWEN_VISION_MODEL || 'qwen-plus',
      promptTokens: 3120,
      completionTokens: 640,
      totalTokens: 3760,
      estimated: false,
      latencyMs: 1710,
      success: true,
    },
    {
      id: 'demo-alibaba-classification',
      createdAt: new Date(now - 74 * 60_000).toISOString(),
      task: 'classification',
      provider: 'alibaba',
      model: process.env.ALIBABA_MODEL || process.env.QWEN_MODEL || 'qwen-plus',
      promptTokens: 720,
      completionTokens: 160,
      totalTokens: 880,
      estimated: false,
      latencyMs: 920,
      success: true,
    },
  ];
}

export function getAiUsageSummary(limit = 100) {
  const logs = isAiDemoMode() ? [...getDemoUsageLogs(), ...readUsageLogs()] : readUsageLogs();
  const aggregate = logs.reduce((acc, log) => {
    acc.totalCalls += 1;
    acc.totalTokens += log.totalTokens;
    acc.promptTokens += log.promptTokens;
    acc.completionTokens += log.completionTokens;
    acc.successfulCalls += log.success ? 1 : 0;
    acc.failedCalls += log.success ? 0 : 1;

    const task = acc.byTask[log.task] || { calls: 0, totalTokens: 0 };
    task.calls += 1;
    task.totalTokens += log.totalTokens;
    acc.byTask[log.task] = task;

    const provider = acc.byProvider[log.provider] || { calls: 0, totalTokens: 0 };
    provider.calls += 1;
    provider.totalTokens += log.totalTokens;
    acc.byProvider[log.provider] = provider;

    return acc;
  }, {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    byTask: {} as Record<string, { calls: number; totalTokens: number }>,
    byProvider: {} as Record<string, { calls: number; totalTokens: number }>,
  });

  return {
    aggregate,
    logs: logs.slice(0, limit),
  };
}

export function clearAiUsage() {
  writeJson(usagePath, []);
}

export async function callAi(params: AiCallParams): Promise<AiCallResult> {
  const startedAt = Date.now();
  const config = getAiConfig();
  const taskConfig = config.tasks[params.task];
  const provider = taskConfig.provider;
  const apiKey = getProviderApiKey(provider);

  if (!apiKey) {
    throw new Error(`${provider} API key not configured`);
  }

  const model = taskConfig.model;
  const baseUrl = config.providers[provider].baseUrl.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
      temperature: params.temperature ?? taskConfig.temperature,
      max_tokens: params.maxTokens ?? taskConfig.maxTokens,
      ...(params.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logUsage({
      task: params.task,
      provider,
      model,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimated: true,
      latencyMs: Date.now() - startedAt,
      success: false,
      error: errorBody.slice(0, 500),
    });
    throw new Error(`${provider} API error: ${response.status}`);
  }

  const data = await response.json() as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content || '';
  const estimated = estimateTokens(params.messages, content);
  const usage = data.usage ? {
    promptTokens: data.usage.prompt_tokens ?? estimated.promptTokens,
    completionTokens: data.usage.completion_tokens ?? estimated.completionTokens,
    totalTokens: data.usage.total_tokens ?? estimated.totalTokens,
    estimated: !data.usage.total_tokens,
  } : estimated;

  logUsage({
    task: params.task,
    provider,
    model,
    ...usage,
    latencyMs: Date.now() - startedAt,
    success: true,
  });

  return {
    content,
    provider,
    model,
    usage,
  };
}
