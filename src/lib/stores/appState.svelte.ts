import type { UserPreferences, ToastMessage, CurrentUser } from '../types';
import { api, authStorage } from '../api/client';

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
  // Navigation Flow: Starts on Landing Page first!
  pageView = $state<'landing' | 'workspace'>('landing');
  authModalOpen = $state(false);
  authMode = $state<'login' | 'signup'>('signup');

  // Authenticated Creator User
  currentUser = $state<CurrentUser | null>(null);
  isAuthenticated = $derived(!!this.currentUser);

  // Workspace Navigation
  activeModule = $state<AppModule>('dashboard');
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
    autoGenerate?: boolean;
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
    weekly_post_goal: 3
  });

  // Global counts for badges
  counts = $state({
    ideas: 0,
    scripts: 0,
    tasksDueToday: 0,
    activeContent: 0,
    publishingStreak: 5
  });

  isLoading = $state(false);

  // Derived labels
  nicheDisplay = $derived(
    `${this.preferences.primary_niche} • ${this.preferences.sub_niche}`
  );

  async loadInitialData() {
    try {
      this.isLoading = true;
      const token = authStorage.getToken();
      if (token) {
        try {
          const user = await api.getMe();
          this.currentUser = user;
          if (user.preferences) {
            this.preferences = user.preferences;
          }
        } catch {
          // Token expired or invalid
          authStorage.removeToken();
          this.currentUser = null;
        }
      }

      // Refresh preferences from profile endpoint
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
    this.currentUser = null;
    this.exitToLanding();
    this.showToast('Logged out of Kre8 Studio', 'info');
  }

  enterWorkspace(targetModule: AppModule = 'dashboard') {
    this.pageView = 'workspace';
    this.activeModule = targetModule;
    this.authModalOpen = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openScriptStudioWithTopic(draft: {
    topic: string;
    format?: string;
    tone?: string;
    hooks?: string[];
    talking_points?: string[];
    autoGenerate?: boolean;
  }) {
    this.pendingScriptDraft = draft;
    this.setModule('scripts');
  }

  showToast(text: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = Math.random().toString(36).substring(2, 9);
    this.toasts = [...this.toasts, { id, text, type }];
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 4000);
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}

export const appState = new AppState();
