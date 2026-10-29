import type { UserPreferences, ToastMessage, CurrentUser } from '../types';
import { api, authStorage, setUnauthorizedHandler, setApiKeyRequiredHandler } from '../api/client';
import { hasSavedKeyForActiveProvider } from '../utils/aiProviders';

export type AppModule =
  | 'dashboard'
  | 'content'
  | 'ideas'
  | 'scripts'
  | 'discover'
  | 'calendar'
  | 'analytics'
  | 'tasks'
  | 'notes'
  | 'goals'
  | 'settings';

export class AppState {
  // Navigation Flow: Persists workspace view if user has an active token!
  pageView = $state<'landing' | 'workspace'>(authStorage.getToken() ? 'workspace' : 'landing');
  authModalOpen = $state(false);
  authMode = $state<'login' | 'signup'>('signup');
  apiKeyModalOpen = $state(false);

  // Authenticated Creator User: restored immediately from local storage on reload
  currentUser = $state<CurrentUser | null>(authStorage.getUser());
  isAuthenticated = $derived(!!this.currentUser);

  // Workspace Navigation: remembers last active module across reloads
  activeModule = $state<AppModule>(authStorage.getActiveModule());
  sidebarOpen = $state(true);
  quickCaptureOpen = $state(false);
  commandPaletteOpen = $state(false);
  toasts = $state<ToastMessage[]>([]);

  // Interconnected Script Studio Pipeline
  pendingScriptDraft = $state<{
    topic: string;
    format?: string;
    tone?: string;
    hooks?: string[];
    talking_points?: string[];
    custom_instructions?: string;
    content_item_id?: number;
    autoGenerate?: boolean;
    creator_watchlist_id?: number;
    creator_name?: string;
    creator_handle?: string;
    creator_pacing?: string;
    creator_hooks?: string[];
    creator_style?: Record<string, any>;
  } | null>(null);

  // Preferences
  preferences = $state<UserPreferences>({
    id: 1,
    primary_niche: 'Technology',
    sub_niche: 'Artificial Intelligence & Agents',
    search_keywords: 'AI, LLM, autonomous agents, coding, tech news',
    target_audience: 'Developers, tech enthusiasts, and digital creators',
    preferred_tone: 'Informative & Engaging',
    preferred_platforms: ['YouTube', 'LinkedIn', 'TikTok', 'X'],
    weekly_post_goal: 3,
    news_region: 'GLOBAL'
  });

  // Global counts for badges
  counts = $state({
    ideas: 0,
    scripts: 0,
    tasksDueToday: 0,
    activeContent: 0
  });

  isLoading = $state(false);
  refreshKey = $state(0);

  triggerRefresh() {
    this.refreshKey++;
  }

  // Derived labels
  nicheDisplay = $derived(
    `${this.preferences.primary_niche} • ${this.preferences.sub_niche}`
  );
  hasConfiguredApiKey = $derived(hasSavedKeyForActiveProvider(this.preferences));

  setCurrentUser(user: CurrentUser | null) {
    this.currentUser = user;
    if (user) {
      authStorage.setUser(user);
    } else {
      authStorage.removeUser();
    }
  }

  async loadInitialData() {
    try {
      this.isLoading = true;
      const token = authStorage.getToken();
      if (token) {
        try {
          const user = await api.getMe();
          this.setCurrentUser(user);
          if (user.preferences) {
            this.preferences = user.preferences;
          }
          // Authenticated: maintain workspace view on reload
          this.pageView = 'workspace';
        } catch (err: any) {
          // Token expired or invalid
          console.warn('Session verification failed, logging out:', err);
          authStorage.removeToken();
          this.setCurrentUser(null);
          this.pageView = 'landing';
        }
      } else {
        this.setCurrentUser(null);
        this.pageView = 'landing';
      }
      const prefs = await api.getPreferences();
      if (prefs) {
        this.preferences = prefs;
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    } finally {
      this.isLoading = false;
    }
  }

  logout() {
    api.logout();
    this.setCurrentUser(null);
    this.apiKeyModalOpen = false;
    authStorage.removeToken();
    try {
      localStorage.removeItem('kre8_active_module');
    } catch {}
    this.preferences = {
      id: 1,
      primary_niche: 'Technology',
      sub_niche: 'Artificial Intelligence & Agents',
      search_keywords: 'AI, LLM, autonomous agents, coding, tech news',
      target_audience: 'Developers, tech enthusiasts, and digital creators',
      preferred_tone: 'Informative & Engaging',
      preferred_platforms: ['YouTube', 'LinkedIn', 'TikTok', 'X'],
      weekly_post_goal: 3,
      ai_provider: 'gemini',
      ai_model: 'gemini-2.5-flash'
    };
    this.exitToLanding();
    this.showToast('Logged out of Kre8 Studio', 'info');
  }

  enterWorkspace(targetModule?: AppModule) {
    this.pageView = 'workspace';
    if (targetModule) {
      this.setModule(targetModule);
    }
    this.authModalOpen = false;
    if (!this.hasConfiguredApiKey) {
      this.apiKeyModalOpen = true;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  requireApiKey(): boolean {
    if (!this.hasConfiguredApiKey) {
      this.apiKeyModalOpen = true;
      return false;
    }
    return true;
  }

  exitToLanding() {
    this.pageView = 'landing';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openAuth(mode: 'login' | 'signup' = 'signup') {
    this.authMode = mode;
    this.authModalOpen = true;
  }

  setModule(mod: AppModule) {
    this.activeModule = mod;
    authStorage.setActiveModule(mod);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openScriptStudioWithTopic(draft: {
    topic: string;
    format?: string;
    tone?: string;
    hooks?: string[];
    talking_points?: string[];
    custom_instructions?: string;
    content_item_id?: number;
    autoGenerate?: boolean;
    creator_watchlist_id?: number;
    creator_name?: string;
    creator_handle?: string;
    creator_pacing?: string;
    creator_hooks?: string[];
    creator_style?: Record<string, any>;
  }) {
    this.pendingScriptDraft = draft;
    this.setModule('scripts');
  }

  showToast(text: string, type: 'success' | 'error' | 'info' = 'success') {
    // Skip duplicates already on screen (e.g. several requests failing during one outage)
    if (this.toasts.some(t => t.text === text && t.type === type)) return;
    const id = Math.random().toString(36).substring(2, 9);
    this.toasts = [...this.toasts.slice(-3), { id, text, type }];
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, type === 'error' ? 6000 : 4000);
  }

  /** Called by the API client when the stored session token is rejected. */
  handleSessionExpired() {
    this.setCurrentUser(null);
    this.pageView = 'landing';
    this.showToast('Your session expired. Please log in again.', 'info');
    this.openAuth('login');
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}

export const appState = new AppState();
setUnauthorizedHandler(() => appState.handleSessionExpired());
setApiKeyRequiredHandler(() => {
  appState.apiKeyModalOpen = true;
});
