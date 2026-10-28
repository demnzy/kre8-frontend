import type {
  CurrentUser,
  RegisterPayload,
  OnboardingSuggestions,
  LoginPayload,
  AuthResponse,
  UserPreferences,
  NewsArticle,
  NewsAIIdea,
  ContentItem,
  ContentIdea,
  Script,
  ScriptClip,
  Task,
  Note,
  CalendarEvent,
  Goal,
  CreatorWatchlist,
  CreatorInspectResult,
  AnalyticsSummary,
  PlatformChannelDetail,
  RecentUploadItem,
  SocialAccount,
  SocialConnectPayload,
  YouTubeLookupResult,
  AIConnectionStatus,
  AIPromptTestResult,
  AIReviseScriptPayload,
  AIReviseScriptResult
} from '../types';
import { connection } from '../stores/connection.svelte';

// Relative by default so requests go through the Vite dev proxy (works on localhost, 127.0.0.1, or LAN)
const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api';
const TOKEN_KEY = 'kre8_token';
const DEFAULT_TIMEOUT_MS = 20_000;
const AI_TIMEOUT_MS = 90_000;

export type ApiErrorKind = 'network' | 'timeout' | 'http';

export class ApiError extends Error {
  constructor(message: string, public status: number, public kind: ApiErrorKind) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = RequestInit & { timeoutMs?: number; retries?: number };

let unauthorizedHandler: (() => void) | null = null;
/** Register a callback that runs when the server rejects the stored session token. */
export function setUnauthorizedHandler(fn: () => void) {
  unauthorizedHandler = fn;
}

let apiKeyRequiredHandler: (() => void) | null = null;
/** Register a callback that runs when an AI endpoint requires the user to configure their API key. */
export function setApiKeyRequiredHandler(fn: () => void) {
  apiKeyRequiredHandler = fn;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function readErrorDetail(response: Response): Promise<string> {
  const raw = await response.text().catch(() => '');
  if (!raw) return `Request failed (${response.status})`;
  try {
    const json = JSON.parse(raw);
    const detail = json.detail ?? json.message ?? json;
    if (typeof detail === 'string') return detail;
    // FastAPI validation errors: [{loc, msg}, ...]
    if (Array.isArray(detail)) {
      return detail
        .map((d: any) => (d?.loc ? `${d.loc.filter((p: any) => p !== 'body').join('.')}: ${d.msg}` : d?.msg ?? String(d)))
        .join('; ');
    }
    return JSON.stringify(detail);
  } catch {
    return raw.slice(0, 300);
  }
}

export const authStorage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to save token to localStorage', e);
    }
  },
  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to remove token from localStorage', e);
    }
  }
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries, ...init } = options;
  const url = `${API_BASE}${endpoint}`;
  const method = (init.method ?? 'GET').toUpperCase();
  // Only retry idempotent reads automatically
  const maxRetries = retries ?? (method === 'GET' ? 2 : 0);

  for (let attempt = 0; ; attempt++) {
    const token = authStorage.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((init.headers as Record<string, string>) || {})
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      let response: Response;
      try {
        response = await fetch(url, { ...init, headers, signal: ctrl.signal });
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          throw new ApiError('This is taking longer than usual. Please try again.', 0, 'timeout');
        }
        throw new ApiError("Can't reach the Kre8 server. Make sure the backend is running.", 0, 'network');
      }

      // The Vite proxy answers 502/503/504 when the backend is down
      if ([502, 503, 504].includes(response.status)) {
        throw new ApiError("Can't reach the Kre8 server. Make sure the backend is running.", response.status, 'network');
      }

      connection.markOnline();

      if (!response.ok) {
        if (response.status === 401 && token) {
          authStorage.removeToken();
          unauthorizedHandler?.();
        }
        const detail = await readErrorDetail(response);
        if (response.status === 400 && detail.includes('API_KEY_REQUIRED')) {
          apiKeyRequiredHandler?.();
        }
        throw new ApiError(detail.replace(/^API_KEY_REQUIRED:\s*/, ''), response.status, 'http');
      }

      if (response.status === 204) return undefined as T;
      const text = await response.text();
      return (text ? JSON.parse(text) : undefined) as T;
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError((e as Error)?.message || 'Unexpected error', 0, 'http');
      if (err.kind !== 'http' && attempt < maxRetries) {
        await sleep(400 * 2 ** attempt);
        continue;
      }
      if (err.kind === 'network') connection.markOffline();
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

export const api = {
  // Auth & Session
  register: (payload: RegisterPayload) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  login: (payload: LoginPayload) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getMe: () => request<CurrentUser>('/auth/me'),
  logout: () => {
    authStorage.removeToken();
  },
  getOnboardingSuggestions: (niche: string) =>
    request<OnboardingSuggestions>('/ai/onboarding-suggestions', {
      timeoutMs: AI_TIMEOUT_MS,
      method: 'POST',
      body: JSON.stringify({ niche })
    }),

  // Preferences & Niche
  getPreferences: () => request<UserPreferences>('/profile/preferences'),
  updatePreferences: (data: Partial<UserPreferences>) =>
    request<UserPreferences>('/profile/preferences', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Daily News & AI Idea Pipeline
  getDailyNews: (forceRefresh = false) =>
    request<NewsArticle[]>(`/news/daily?force_refresh=${forceRefresh}`, { timeoutMs: 45_000, retries: 0 }),
  synthesizeNewsToIdeas: (articleId?: number) =>
    request<NewsAIIdea[]>(`/news/synthesize${articleId ? `?article_id=${articleId}` : ''}`, {
      method: 'POST',
      timeoutMs: AI_TIMEOUT_MS
    }),
  saveNewsAngleToIdeas: (angleId: number) =>
    request<ContentIdea>(`/news/save-angle-as-idea/${angleId}`, { method: 'POST' }),

  // AI Assistant Services
  generateScript: (payload: {
    topic: string;
    niche?: string;
    platform?: string;
    format?: string;
    tone?: string;
    target_duration_seconds?: number;
    custom_instructions?: string;
  }) =>
    request<{
      title: string;
      hooks: string[];
      ctas: string[];
      full_script: string;
      clips: ScriptClip[];
    }>('/ai/generate-script', {
      timeoutMs: AI_TIMEOUT_MS,
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  breakdownClips: (script_text: string, target_duration = 60) =>
    request<{ clips: ScriptClip[] }>('/ai/breakdown-clips', {
      timeoutMs: AI_TIMEOUT_MS,
      method: 'POST',
      body: JSON.stringify({ script_text, target_duration })
    }),
  getPerformanceReview: (timeframe = 'Last 30 Days') =>
    request<{
      observations: string[];
      patterns: string[];
      action_steps: string[];
      limitations: string[];
    }>('/ai/performance-review', {
      timeoutMs: AI_TIMEOUT_MS,
      method: 'POST',
      body: JSON.stringify({ timeframe })
    }),
  testAIConnection: (provider?: string, model?: string, api_key?: string) =>
    request<AIConnectionStatus>('/ai/test-connection', {
      timeoutMs: AI_TIMEOUT_MS,
      method: 'POST',
      body: JSON.stringify({ provider, model, api_key })
    }),
  testAIPrompt: (prompt: string, provider?: string, model?: string, api_key?: string) =>
    request<AIPromptTestResult>('/ai/test-prompt', {
      timeoutMs: AI_TIMEOUT_MS,
      method: 'POST',
      body: JSON.stringify({ prompt, provider, model, api_key })
    }),
  reviseScript: (payload: AIReviseScriptPayload) =>
    request<AIReviseScriptResult>('/ai/revise-script', {
      timeoutMs: AI_TIMEOUT_MS,
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  listAIModels: (provider?: string, api_key?: string) =>
    request<{ provider: string; default_model: string; models: string[]; live_fetched: boolean }>('/ai/list-models', {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      method: 'POST',
      body: JSON.stringify({ provider, api_key })
    }),

  // Content Items (Kanban & Table)
  getContentItems: (params?: { status?: string; platform?: string; priority?: string; search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string> || {}).toString();
    return request<ContentItem[]>(`/content${query ? `?${query}` : ''}`);
  },
  createContentItem: (item: Partial<ContentItem>) =>
    request<ContentItem>('/content', { method: 'POST', body: JSON.stringify(item) }),
  updateContentItem: (id: number, item: Partial<ContentItem>) =>
    request<ContentItem>(`/content/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteContentItem: (id: number) =>
    request<{ message: string }>(`/content/${id}`, { method: 'DELETE' }),

  // Ideas Bank
  getIdeas: (params?: { status?: string; platform?: string; is_favorite?: boolean; search?: string }) => {
    const query = new URLSearchParams(params as any || {}).toString();
    return request<ContentIdea[]>(`/ideas${query ? `?${query}` : ''}`);
  },
  createIdea: (idea: Partial<ContentIdea>) =>
    request<ContentIdea>('/ideas', { method: 'POST', body: JSON.stringify(idea) }),
  updateIdea: (id: number, idea: Partial<ContentIdea>) =>
    request<ContentIdea>(`/ideas/${id}`, { method: 'PUT', body: JSON.stringify(idea) }),
  deleteIdea: (id: number) =>
    request<{ message: string }>(`/ideas/${id}`, { method: 'DELETE' }),
  convertIdeaToContent: (id: number) =>
    request<ContentItem>(`/ideas/${id}/convert-to-content`, { method: 'POST' }),

  // Scripts
  getScripts: () => request<Script[]>('/scripts'),
  getScript: (id: number) => request<Script>(`/scripts/${id}`),
  createScript: (script: Partial<Script>) =>
    request<Script>('/scripts', { method: 'POST', body: JSON.stringify(script) }),
  updateScript: (id: number, script: Partial<Script>) =>
    request<Script>(`/scripts/${id}`, { method: 'PUT', body: JSON.stringify(script) }),
  deleteScript: (id: number) =>
    request<{ message: string }>(`/scripts/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (params?: { is_completed?: boolean; priority?: string }) => {
    const query = new URLSearchParams(params as any || {}).toString();
    return request<Task[]>(`/tasks${query ? `?${query}` : ''}`);
  },
  createTask: (task: Partial<Task>) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (id: number, task: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(task) }),
  deleteTask: (id: number) =>
    request<{ message: string }>(`/tasks/${id}`, { method: 'DELETE' }),

  // Notes
  getNotes: (params?: { folder?: string; is_pinned?: boolean; search?: string }) => {
    const query = new URLSearchParams(params as any || {}).toString();
    return request<Note[]>(`/notes${query ? `?${query}` : ''}`);
  },
  createNote: (note: Partial<Note>) =>
    request<Note>('/notes', { method: 'POST', body: JSON.stringify(note) }),
  updateNote: (id: number, note: Partial<Note>) =>
    request<Note>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(note) }),
  deleteNote: (id: number) =>
    request<{ message: string }>(`/notes/${id}`, { method: 'DELETE' }),

  // Calendar
  getCalendarEvents: () => request<CalendarEvent[]>('/calendar'),
  createCalendarEvent: (event: Partial<CalendarEvent>) =>
    request<CalendarEvent>('/calendar', { method: 'POST', body: JSON.stringify(event) }),
  updateCalendarEvent: (id: number, event: Partial<CalendarEvent>) =>
    request<CalendarEvent>(`/calendar/${id}`, { method: 'PUT', body: JSON.stringify(event) }),
  deleteCalendarEvent: (id: number) =>
    request<{ message: string }>(`/calendar/${id}`, { method: 'DELETE' }),

  // Goals
  getGoals: () => request<Goal[]>('/goals'),
  createGoal: (goal: Partial<Goal>) =>
    request<Goal>('/goals', { method: 'POST', body: JSON.stringify(goal) }),
  updateGoal: (id: number, goal: Partial<Goal>) =>
    request<Goal>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(goal) }),
  deleteGoal: (id: number) =>
    request<{ message: string }>(`/goals/${id}`, { method: 'DELETE' }),

  // Social & Analytics
  getAnalyticsSummary: () => request<AnalyticsSummary>('/social/analytics/summary'),
  getSocialAccounts: () => request<SocialAccount[]>('/social/accounts'),
  connectAccount: (platform: string, payload?: SocialConnectPayload) =>
    request<{ message: string; account: SocialAccount }>(`/social/connect/${platform}`, {
      method: 'POST',
      body: JSON.stringify(payload || {})
    }),
  updateAccountStats: (accountId: number, stats: Partial<SocialConnectPayload>) =>
    request<{ message: string; snapshot: any }>(`/social/accounts/${accountId}/stats`, {
      method: 'PUT',
      body: JSON.stringify(stats)
    }),
  lookupYouTubeHandle: (handle: string) =>
    request<YouTubeLookupResult>('/social/youtube-lookup', {
      method: 'POST',
      body: JSON.stringify({ handle })
    }),
  syncAccountStats: (accountId: number) =>
    request<{ message: string; success: boolean; telemetry?: any }>(`/social/sync/${accountId}`, {
      method: 'POST'
    }),
  getChannelDetails: (platform: string) =>
    request<PlatformChannelDetail>(`/social/channel/${platform}`),
  disconnectAccount: (accountId: number) =>
    request<{ message: string }>(`/social/disconnect/${accountId}`, { method: 'POST' }),
  // Creator Watchlist & Live Inspection
  inspectCreator: (url_or_handle: string, platform?: string) =>
    request<CreatorInspectResult>('/social/inspect-creator', {
      timeoutMs: AI_TIMEOUT_MS,
      method: 'POST',
      body: JSON.stringify({ url_or_handle, platform })
    }),
  getWatchlist: () => request<CreatorWatchlist[]>('/social/watchlist'),
  addWatchlist: (entry: Partial<CreatorWatchlist>) =>
    request<CreatorWatchlist>('/social/watchlist', { method: 'POST', body: JSON.stringify(entry) }),
  updateWatchlist: (id: number, entry: Partial<CreatorWatchlist>) =>
    request<CreatorWatchlist>(`/social/watchlist/${id}`, { method: 'PUT', body: JSON.stringify(entry) }),
  deleteWatchlist: (id: number) =>
    request<{ message: string }>(`/social/watchlist/${id}`, { method: 'DELETE' }),

  // Seed & Demo
  resetWorkspace: () => request<{ message: string }>('/seed/reset', { method: 'POST' }),
  loadDemoData: () => request<{ message: string }>('/seed/load-demo', { method: 'POST' })
};
