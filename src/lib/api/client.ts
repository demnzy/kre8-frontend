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
  AnalyticsSummary,
  SocialAccount,
  SocialConnectPayload,
  YouTubeLookupResult,
  AIConnectionStatus,
  AIPromptTestResult
} from '../types';

const API_BASE = 'http://127.0.0.1:8000/api';
const TOKEN_KEY = 'kre8_token';

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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    if (response.status === 401 && token) {
      authStorage.removeToken();
    }
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `API Error [${response.status}]`);
  }

  return response.json();
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
    request<NewsArticle[]>(`/news/daily?force_refresh=${forceRefresh}`),
  synthesizeNewsToIdeas: () =>
    request<NewsAIIdea[]>('/news/synthesize', { method: 'POST' }),
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
  }) =>
    request<{
      title: string;
      hooks: string[];
      ctas: string[];
      full_script: string;
      clips: ScriptClip[];
    }>('/ai/generate-script', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  breakdownClips: (script_text: string, target_duration = 60) =>
    request<{ clips: ScriptClip[] }>('/ai/breakdown-clips', {
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
      method: 'POST',
      body: JSON.stringify({ timeframe })
    }),
  testAIConnection: (api_key?: string) =>
    request<AIConnectionStatus>('/ai/test-connection', {
      method: 'POST',
      body: JSON.stringify({ api_key })
    }),
  testAIPrompt: (prompt: string, api_key?: string) =>
    request<AIPromptTestResult>('/ai/test-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt, api_key })
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
  disconnectAccount: (accountId: number) =>
    request<{ message: string }>(`/social/disconnect/${accountId}`, { method: 'POST' }),
  getWatchlist: () => request<CreatorWatchlist[]>('/social/watchlist'),
  addWatchlist: (entry: Partial<CreatorWatchlist>) =>
    request<CreatorWatchlist>('/social/watchlist', { method: 'POST', body: JSON.stringify(entry) }),
  deleteWatchlist: (id: number) =>
    request<{ message: string }>(`/social/watchlist/${id}`, { method: 'DELETE' }),

  // Seed & Demo
  resetWorkspace: () => request<{ message: string }>('/seed/reset', { method: 'POST' }),
  loadDemoData: () => request<{ message: string }>('/seed/load-demo', { method: 'POST' })
};
