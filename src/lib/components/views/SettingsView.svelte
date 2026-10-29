<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import type { UserPreferences, AIConnectionStatus, AIPromptTestResult } from '../../types';
  import {
    Settings,
    Save,
    Key,
    Share2,
    Database,
    RotateCcw,
    Globe,
    Sparkles,
    Activity,
    CheckCircle2,
    AlertTriangle,
    Play,
    RefreshCw,
    Terminal,
    Cpu,
    Eye,
    EyeOff,
    ExternalLink,
    Radio
  } from 'lucide-svelte';
  import LoadError from '../layout/LoadError.svelte';
  import { AI_PROVIDERS, type AIProviderConfig, getSavedKeyForProvider } from '../../utils/aiProviders';

  const POPULAR_NICHES = [
    {
      niche: 'Technology',
      subNiches: ['Artificial Intelligence & Agents', 'Web Development & Svelte', 'Cybersecurity', 'SaaS & Indie Hacking', 'Gadgets & Hardware']
    },
    {
      niche: 'Finance & Business',
      subNiches: ['Personal Finance & Investing', 'Crypto & Web3', 'Startup Growth & Marketing', 'Real Estate', 'Side Hustles']
    },
    {
      niche: 'Fitness & Health',
      subNiches: ['Strength & Hypertrophy', 'Calisthenics', 'Biohacking & Longevity', 'Nutrition & Meal Prep', 'Mental Health']
    },
    {
      niche: 'Creative & Media',
      subNiches: ['Video Editing & VFX', 'Graphic Design & Branding', 'Photography & Gear', 'Writing & Storytelling', 'Music Production']
    }
  ];

  let prefs = $state<UserPreferences>({
    id: 1,
    primary_niche: 'Technology',
    sub_niche: 'Artificial Intelligence & Agents',
    search_keywords: 'AI, LLM, autonomous agents, coding, tech news',
    target_audience: 'Developers, tech enthusiasts, and digital creators',
    preferred_tone: 'Informative & Engaging',
    preferred_platforms: ['YouTube', 'LinkedIn', 'TikTok', 'X'],
    weekly_post_goal: 3,
    ai_provider: 'gemini',
    ai_model: 'gemini-2.5-flash',
    news_region: 'GLOBAL'
  });

  let showKeyPassword = $state(false);
  let showNewsKeyPassword = $state(false);
  let isSaving = $state(false);
  let isSavingNewsKey = $state(false);
  let isResetting = $state(false);
  let isDemoLoading = $state(false);

  // Live AI Diagnostics & Playground State
  let isTestingAI = $state(false);
  let isSavingKey = $state(false);
  let isFetchingModels = $state(false);
  let liveProviderModels = $state<Record<string, string[]>>({});
  let aiStatus = $state<AIConnectionStatus | null>(null);
  let testPromptInput = $state('Give me 3 high-retention video hook angles about autonomous AI coding agents.');
  let isRunningPrompt = $state(false);
  let testPromptResult = $state<AIPromptTestResult | null>(null);
  let loadError = $state<string | null>(null);

  let currentProvider = $derived(
    AI_PROVIDERS.find(p => p.id === (prefs.ai_provider || 'gemini')) || AI_PROVIDERS[0]
  );

  let currentProviderModels = $derived(
    liveProviderModels[currentProvider.id] || currentProvider.models
  );

  let activeKeyForCurrentProvider = $derived(
    ((prefs[currentProvider.keyField] as string) || '').trim()
  );

  let savedKeyInStore = $derived(
    getSavedKeyForProvider(appState.preferences, currentProvider.id)
  );

  let currentNewsKeyInput = $derived(
    ((prefs.news_api_key as string) || '').trim()
  );

  let savedNewsKeyInStore = $derived(
    ((appState.preferences?.news_api_key as string) || '').trim()
  );

  async function loadPreferences() {
    loadError = null;
    try {
      if (appState.preferences) {
        prefs = { ...appState.preferences };
      }
      const data = await api.getPreferences();
      if (data) {
        prefs = data;
        appState.preferences = data;
      }
    } catch (e: any) {
      loadError = e?.message || "Couldn't load your settings.";
    }
  }

  onMount(loadPreferences);

  function selectProvider(providerId: AIProviderConfig['id']) {
    prefs.ai_provider = providerId;
    const prov = AI_PROVIDERS.find(p => p.id === providerId);
    const models = (prov && liveProviderModels[prov.id]) || prov?.models || [];
    if (prov && (!prefs.ai_model || !models.includes(prefs.ai_model))) {
      prefs.ai_model = prov.defaultModel;
    }
    // Clear previous provider status; connection test runs on explicit button click
    aiStatus = null;
    testPromptResult = null;
  }

  async function handleRefreshModels() {
    isFetchingModels = true;
    try {
      const activeKey = activeKeyForCurrentProvider || undefined;
      const res = await api.listAIModels(prefs.ai_provider, activeKey);
      if (res.models && res.models.length > 0) {
        liveProviderModels = { ...liveProviderModels, [currentProvider.id]: res.models };
        if (!res.models.includes(prefs.ai_model || '')) {
          prefs.ai_model = res.default_model || res.models[0];
        }
        appState.showToast(`Loaded ${res.models.length} valid models for ${currentProvider.name}`, 'info');
      }
    } catch (e: any) {
      appState.showToast(e.message || 'Could not refresh models', 'error');
    } finally {
      isFetchingModels = false;
    }
  }

  async function handleSaveNewsKey() {
    const trimmed = currentNewsKeyInput;
    if (!trimmed) {
      appState.showToast('Please enter your NewsAPI key first.', 'error');
      return;
    }
    try {
      isSavingNewsKey = true;
      prefs.news_api_key = trimmed;
      const updated = await api.updatePreferences(prefs);
      prefs = updated;
      appState.preferences = updated;
      appState.showToast('NewsAPI key saved to your account!', 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to save News key', 'error');
    } finally {
      isSavingNewsKey = false;
    }
  }

  async function handleSaveApiKey() {
    const trimmed = activeKeyForCurrentProvider;
    if (!trimmed) {
      appState.showToast(`Please enter your ${currentProvider.name} API key first.`, 'error');
      return;
    }
    try {
      isSavingKey = true;
      prefs[currentProvider.keyField] = trimmed;
      const updated = await api.updatePreferences(prefs);
      prefs = updated;
      appState.preferences = updated;
      appState.showToast(`${currentProvider.name} API key saved to your account!`, 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to save API key', 'error');
    } finally {
      isSavingKey = false;
    }
  }

  async function handleTestAIConnection() {
    isTestingAI = true;
    try {
      const activeKey = activeKeyForCurrentProvider || undefined;
      // If a key is present, save it to preferences first so it persists across logins
      if (activeKey) {
        const updated = await api.updatePreferences(prefs);
        prefs = updated;
        appState.preferences = updated;
      }
      const res = await api.testAIConnection(prefs.ai_provider, prefs.ai_model, activeKey);
      aiStatus = res;
      if (res.connected) {
        appState.showToast(`${currentProvider.name} connected (${res.latency_ms}ms) & key saved`, 'success');
      }
    } catch (e: any) {
      aiStatus = {
        status: 'error',
        connected: false,
        provider: prefs.ai_provider,
        model: prefs.ai_model || 'default',
        latency_ms: 0,
        message: e.message || 'Connection test failed'
      };
    } finally {
      isTestingAI = false;
    }
  }

  async function handleRunTestPrompt() {
    if (!testPromptInput.trim()) return;
    isRunningPrompt = true;
    try {
      const activeKey = prefs[currentProvider.keyField] as string | undefined;
      const res = await api.testAIPrompt(testPromptInput, prefs.ai_provider, prefs.ai_model, activeKey);
      testPromptResult = res;
      if (res.success) {
        appState.showToast(`AI responded in ${res.latency_ms}ms (${res.model})`, 'success');
      } else {
        appState.showToast(res.response, 'error');
      }
    } catch (e: any) {
      testPromptResult = {
        success: false,
        response: e.message || 'Prompt execution failed',
        latency_ms: 0,
        model: prefs.ai_model || 'default',
        provider: prefs.ai_provider
      };
    } finally {
      isRunningPrompt = false;
    }
  }

  async function handleSavePreferences(e: Event) {
    e.preventDefault();
    try {
      isSaving = true;
      const updated = await api.updatePreferences(prefs);
      prefs = updated;
      appState.preferences = updated;
      appState.showToast('Settings saved!', 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to save', 'error');
    } finally {
      isSaving = false;
    }
  }

  async function handleLoadDemo() {
    try {
      isDemoLoading = true;
      const res = await api.loadDemoData();
      await appState.loadInitialData();
      appState.showToast(res.message || 'Demo data loaded successfully!', 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to load demo', 'error');
    } finally {
      isDemoLoading = false;
    }
  }

  async function handleResetWorkspace() {
    if (!confirm('Warning: Clear all workspace records?')) return;
    try {
      isResetting = true;
      const res = await api.resetWorkspace();
      appState.showToast(res.message || 'Workspace reset!', 'info');
    } catch (e: any) {
      appState.showToast(e.message || 'Reset failed', 'error');
    } finally {
      isResetting = false;
    }
  }
</script>

<div class="space-y-8 animate-in fade-in duration-300 max-w-4xl pb-12">
  {#if loadError}
    <LoadError message={loadError} onRetry={loadPreferences} />
  {/if}
  <!-- Swiss Header -->
  <div class="swiss-card p-6 border border-purple-900/60 bg-[#10071c] space-y-4">
    <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
      <div class="flex items-center gap-2">
        <Settings class="w-4 h-4 text-amber-400" />
        <span class="swiss-tag text-amber-400">
          Workspace Settings
        </span>
      </div>
      <span class="swiss-tag text-purple-400 font-mono">
        Preferences
      </span>
    </div>

    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
          Creator Preferences
        </h1>
        <p class="text-xs text-slate-300 mt-1">
          Niche targeting keywords for news ingestion, AI model keys, and social account credentials.
        </p>
      </div>

      <button
        onclick={handleSavePreferences}
        disabled={isSaving}
        class="flex items-center gap-1.5 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display tracking-wider disabled:opacity-50"
      >
        <Save class="w-4 h-4" />
        <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
      </button>
    </div>
  </div>

  <form onsubmit={handleSavePreferences} class="space-y-6">
    <!-- Niche Section -->
    <div class="swiss-card p-6 border border-purple-900/50 bg-[#10071c] space-y-4">
      <div class="flex items-center gap-2 border-b border-purple-900/40 pb-3">
        <Globe class="w-4 h-4 text-amber-400" />
        <h2 class="text-sm font-bold text-white font-display">Niche & Topic Targeting</h2>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="swiss-primary-niche" class="block swiss-tag text-slate-400 mb-1">Primary Niche</label>
          <input
            id="swiss-primary-niche"
            type="text"
            bind:value={prefs.primary_niche}
            placeholder="e.g. Technology, AI Agents, Woodworking, Finance"
            required
            class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:border-amber-400"
          />
          <div class="flex flex-wrap gap-1.5 mt-2">
            {#each POPULAR_NICHES as p}
              <button
                type="button"
                onclick={() => { prefs.primary_niche = p.niche; }}
                class="text-[10px] font-mono px-2 py-0.5 border transition-colors {prefs.primary_niche === p.niche
                  ? 'bg-amber-400 text-black border-amber-400 font-bold'
                  : 'bg-purple-950/40 text-slate-400 border-purple-900/60 hover:text-white'}"
              >
                {p.niche}
              </button>
            {/each}
          </div>
        </div>

        <div>
          <label for="swiss-sub-niche" class="block swiss-tag text-slate-400 mb-1">Sub-Niche Specialization</label>
          <input
            id="swiss-sub-niche"
            type="text"
            bind:value={prefs.sub_niche}
            placeholder="e.g. Artificial Intelligence & Agents"
            required
            class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:border-amber-400"
          />
        </div>
      </div>

      <div>
        <label for="swiss-keywords" class="block swiss-tag text-slate-400 mb-1">Search Keywords for Daily News</label>
        <input
          id="swiss-keywords"
          type="text"
          bind:value={prefs.search_keywords}
          placeholder="AI, LLM, autonomous agents, coding, tech news"
          class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:border-amber-400"
        />
      </div>
    </div>

    <!-- Live News Feeds & NewsAPI Configuration -->
    <div class="swiss-card p-6 border border-purple-900/50 bg-[#10071c] space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/40 pb-3">
        <div>
          <div class="flex items-center gap-2">
            <Radio class="w-4 h-4 text-amber-400" />
            <h2 class="text-sm font-bold text-white font-display">News Sources & NewsAPI Key (Optional)</h2>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Configure how Kre8 discovers breaking stories in your niche.
          </p>
        </div>

        <a
          href="https://newsapi.org/register"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[11px] font-mono text-amber-400/90 hover:text-amber-300 flex items-center gap-1 self-start sm:self-auto"
        >
          <span>Get Free Key from NewsAPI.org</span>
          <ExternalLink class="w-3 h-3" />
        </a>
      </div>

      <div class="space-y-4">
        <!-- Default Geographic News Region -->
        <div>
          <label for="swiss-news-region" class="block swiss-tag text-slate-400 mb-1">
            Default Geographic News Region
          </label>
          <select
            id="swiss-news-region"
            bind:value={prefs.news_region}
            class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:border-amber-400 cursor-pointer"
          >
            <option value="GLOBAL">🌐 Global (Worldwide Headlines & Trends)</option>
            <option value="NG">🇳🇬 Nigeria (West Africa, Startups, Creators & Tech)</option>
            <option value="US">🇺🇸 United States (Silicon Valley, Media & Culture)</option>
            <option value="UK">🇬🇧 United Kingdom (UK Media, Tech & Europe)</option>
            <option value="CA">🇨🇦 Canada (Canadian Innovation & Startups)</option>
            <option value="IN">🇮🇳 India (Creator Economy, AI & Venture)</option>
            <option value="ZA">🇿🇦 South Africa (Southern African Media & Business)</option>
            <option value="KE">🇰🇪 Kenya (East African Silicon Savannah)</option>
            <option value="EU">🇪🇺 Europe (European Tech & AI Policy)</option>
          </select>
          <span class="text-[10px] font-mono text-slate-500 mt-1 block">
            Sets the default regional feed in the Discover tab. You can also switch regions instantly on the fly.
          </span>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label for="swiss-news-api-key" class="swiss-tag text-slate-400">
              News API Key (NewsAPI.org, GNews.io, or NewsData.io)
            </label>
            <span class="text-[10px] font-mono text-slate-500">Optional key</span>
          </div>

          <div class="flex items-center gap-2">
            <div class="relative flex-1 flex items-center">
              <input
                id="swiss-news-api-key"
                type={showNewsKeyPassword ? 'text' : 'password'}
                bind:value={prefs.news_api_key}
                placeholder="Paste your NewsAPI.org, GNews.io, or NewsData.io key..."
                class="w-full pl-3.5 pr-10 py-2 bg-black border border-purple-900 text-amber-300 text-xs font-mono focus:border-amber-400"
              />
              <button
                type="button"
                onclick={() => (showNewsKeyPassword = !showNewsKeyPassword)}
                class="absolute right-2.5 text-slate-400 hover:text-white"
                title={showNewsKeyPassword ? 'Hide key' : 'Show key'}
              >
                {#if showNewsKeyPassword}
                  <EyeOff class="w-3.5 h-3.5" />
                {:else}
                  <Eye class="w-3.5 h-3.5" />
                {/if}
              </button>
            </div>

            <button
              type="button"
              onclick={handleSaveNewsKey}
              disabled={isSavingNewsKey || !currentNewsKeyInput || (savedNewsKeyInStore === currentNewsKeyInput)}
              class="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display tracking-wider shrink-0 flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              <Save class="w-3.5 h-3.5" />
              <span>{isSavingNewsKey ? 'Saving...' : savedNewsKeyInStore === currentNewsKeyInput && savedNewsKeyInStore ? 'Saved' : 'Save News Key'}</span>
            </button>
          </div>
        </div>

        {#if savedNewsKeyInStore && savedNewsKeyInStore === currentNewsKeyInput}
          <div class="p-3 bg-emerald-950/30 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Commercial News API key active. Blending live API wire feeds with localized Google News and curated regional publications.</span>
          </div>
        {:else if currentNewsKeyInput}
          <div class="p-3 bg-amber-950/30 border border-amber-500/40 text-[11px] font-mono text-amber-300 flex items-center gap-2">
            <Key class="w-4 h-4 text-amber-400 shrink-0" />
            <span>Unsaved changes — click <strong>Save News Key</strong> so your key is saved and used when you next sign in.</span>
          </div>
        {:else}
          <div class="p-3 bg-black/60 border border-purple-900/60 text-[11px] font-mono text-slate-300 space-y-1">
            <div class="text-amber-400 font-bold">Standard Diverse & Localized Feeds Active (No key required)</div>
            <p class="text-slate-400 leading-relaxed">
              Kre8 automatically pulls real-time verified stories via localized Google News RSS and authoritative direct feeds (TechCabal, Techpoint, Rest of World, Tubefilter, Digiday, Sifted, YourStory, TechCrunch, The Verge, CNBC, ScienceDaily) based on your chosen region and niche. Adding a third-party key is completely optional.
            </p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Multi-Provider AI Engine & BYOK Settings -->
    <div class="swiss-card p-6 border border-purple-900/50 bg-[#10071c] space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/40 pb-4">
        <div>
          <div class="flex items-center gap-2">
            <Cpu class="w-4 h-4 text-amber-400" />
            <h2 class="text-sm font-bold text-white font-display">AI Engine & Model Provider (BYOK)</h2>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Choose your preferred intelligence provider and bring your own API key to power all scripts, ideation, and research.
          </p>
        </div>

        <!-- Live Status Pill & Ping -->
        <div class="flex items-center gap-2">
          {#if aiStatus}
            {#if aiStatus.connected}
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/70 border border-emerald-500/50 text-emerald-400 text-[10px] font-mono tracking-wider font-bold">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live ({aiStatus.latency_ms}ms)</span>
              </span>
              <span class="px-2 py-1 bg-purple-950/70 border border-purple-700/50 text-purple-300 text-[10px] font-mono">
                {aiStatus.model}
              </span>
            {:else if aiStatus.status === 'missing_key'}
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/60 border border-amber-500/40 text-amber-400 text-[10px] font-mono tracking-wider">
                <AlertTriangle class="w-3 h-3 text-amber-400" />
                <span>Key Required</span>
              </span>
            {:else}
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/60 border border-rose-500/40 text-rose-400 text-[10px] font-mono tracking-wider">
                <AlertTriangle class="w-3 h-3 text-rose-400" />
                <span>Error ({aiStatus.latency_ms}ms)</span>
              </span>
            {/if}
          {/if}

          <button
            type="button"
            onclick={handleTestAIConnection}
            disabled={isTestingAI}
            class="flex items-center gap-1 px-3 py-1 bg-black hover:bg-purple-950 text-slate-300 border border-purple-900 text-xs font-mono tracking-wider disabled:opacity-50 transition-colors"
          >
            <RefreshCw class="w-3 h-3 text-amber-400 {isTestingAI ? 'animate-spin' : ''}" />
            <span>{isTestingAI ? 'Pinging...' : 'Test Connection'}</span>
          </button>
        </div>
      </div>

      <!-- Provider Selector Grid -->
      <div class="space-y-2">
        <span class="block swiss-tag text-slate-400">Select AI Provider</span>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {#each AI_PROVIDERS as prov}
            {@const hasKeySaved = getSavedKeyForProvider(appState.preferences, prov.id).length > 0}
            <button
              type="button"
              onclick={() => selectProvider(prov.id)}
              class="p-4 text-left border transition-all relative {prefs.ai_provider === prov.id
                ? 'bg-purple-950/50 border-amber-400 shadow-md ring-1 ring-amber-400/30'
                : 'bg-black/60 border-purple-900/60 hover:border-purple-700/80'}"
            >
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-bold font-display tracking-wider text-white">
                  {prov.name}
                </span>
                {#if hasKeySaved}
                  <span class="text-[9px] font-mono px-1.5 py-0.5 border bg-emerald-950/80 text-emerald-300 border-emerald-500/50 font-bold">
                    Key Saved
                  </span>
                {:else}
                  <span class="text-[9px] font-mono px-1.5 py-0.5 border bg-purple-950/80 text-purple-300 border-purple-800">
                    {prov.defaultModel}
                  </span>
                {/if}
              </div>
              <p class="text-[11px] text-slate-400 leading-snug">
                {prov.tagline}
              </p>
              {#if prefs.ai_provider === prov.id}
                <div class="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono text-amber-400 font-bold">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Selected Provider</span>
                </div>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <!-- Model Selection & Key Input for Active Provider -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <!-- Model Selection -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label for="swiss-ai-model" class="swiss-tag text-slate-400">
              {currentProvider.name} Model
            </label>
            <button
              type="button"
              onclick={handleRefreshModels}
              disabled={isFetchingModels}
              class="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw class="w-2.5 h-2.5 {isFetchingModels ? 'animate-spin' : ''}" />
              <span>{isFetchingModels ? 'Refreshing...' : 'Refresh Models'}</span>
            </button>
          </div>
          <div class="space-y-1.5">
            <select
              id="swiss-ai-model"
              bind:value={prefs.ai_model}
              class="w-full px-3.5 py-2 bg-black border border-purple-900 text-amber-300 text-xs font-mono focus:border-amber-400"
            >
              {#each currentProviderModels as m}
                <option value={m}>{m}</option>
              {/each}
            </select>
            <div class="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Verified 2026 models</span>
              <button
                type="button"
                onclick={() => {
                  const custom = prompt('Enter custom model identifier:', prefs.ai_model || currentProvider.defaultModel);
                  if (custom) prefs.ai_model = custom.trim();
                }}
                class="text-amber-400/80 hover:text-amber-300 underline"
              >
                Custom Model...
              </button>
            </div>
          </div>
        </div>

        <!-- API Key for Active Provider -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label for="swiss-provider-key" class="swiss-tag text-slate-400">
              {currentProvider.name} API Key
            </label>
            <a
              href={currentProvider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="text-[10px] font-mono text-amber-400/90 hover:text-amber-300 flex items-center gap-1"
            >
              <span>{currentProvider.docsLabel}</span>
              <ExternalLink class="w-2.5 h-2.5" />
            </a>
          </div>

          <div class="flex items-center gap-2">
            <div class="relative flex-1 flex items-center">
              <input
                id="swiss-provider-key"
                type={showKeyPassword ? 'text' : 'password'}
                bind:value={prefs[currentProvider.keyField]}
                placeholder={currentProvider.keyPlaceholder}
                class="w-full pl-3.5 pr-10 py-2 bg-black border border-purple-900 text-amber-300 text-xs font-mono focus:border-amber-400"
              />
              <button
                type="button"
                onclick={() => (showKeyPassword = !showKeyPassword)}
                class="absolute right-2.5 text-slate-400 hover:text-white"
                title={showKeyPassword ? 'Hide key' : 'Show key'}
              >
                {#if showKeyPassword}
                  <EyeOff class="w-3.5 h-3.5" />
                {:else}
                  <Eye class="w-3.5 h-3.5" />
                {/if}
              </button>
            </div>

            <button
              type="button"
              onclick={handleSaveApiKey}
              disabled={isSavingKey || !activeKeyForCurrentProvider}
              class="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display tracking-wider shrink-0 flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              <Save class="w-3.5 h-3.5" />
              <span>{isSavingKey ? 'Saving...' : 'Save Key'}</span>
            </button>
          </div>

          <div class="mt-1.5">
            {#if savedKeyInStore && savedKeyInStore === activeKeyForCurrentProvider}
              <p class="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 class="w-3 h-3 text-emerald-400" />
                <span>API key saved to your account. Used automatically whenever you sign in.</span>
              </p>
            {:else if activeKeyForCurrentProvider}
              <p class="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                <Key class="w-3 h-3 text-amber-400" />
                <span>Unsaved changes — click Save Key so your key persists when you next sign in.</span>
              </p>
            {:else}
              <div class="p-2 bg-amber-950/30 border border-amber-500/40 text-[10px] font-mono text-amber-300 leading-relaxed">
                Enter your personal {currentProvider.name} API key and click Save Key to enable AI script generation, revisions, and news ideation.
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Interactive Playground & Diagnostics Box -->
      <div class="p-4 bg-[#0a0412] border border-purple-900/60 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Terminal class="w-3.5 h-3.5 text-amber-400" />
            <span class="text-xs font-bold font-display text-slate-200">
              Interactive {currentProvider.name} Playground
            </span>
          </div>
          <span class="text-[10px] font-mono text-slate-500">Live Provider Verification</span>
        </div>

        <!-- Quick prompts -->
        <div class="flex flex-wrap gap-1.5">
          <button
            type="button"
            onclick={() => (testPromptInput = 'Generate 3 high-retention video hook angles for a tutorial about autonomous AI coding agents.')}
            class="px-2 py-0.5 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 text-[10px] font-mono border border-purple-800/40"
          >
            + Video Hooks Prompt
          </button>
          <button
            type="button"
            onclick={() => (testPromptInput = 'Breakdown a 60-second short video on "Why PostgreSQL with pgvector beats traditional vector DBs" into 3 scene cues.')}
            class="px-2 py-0.5 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 text-[10px] font-mono border border-purple-800/40"
          >
            + Scene Breakdown Prompt
          </button>
          <button
            type="button"
            onclick={() => (testPromptInput = 'Synthesize: Google Gemini 2.5 Flash released with sub-second latency. What is the contrarian angle for creators?')}
            class="px-2 py-0.5 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 text-[10px] font-mono border border-purple-800/40"
          >
            + News Angle Prompt
          </button>
        </div>

        <div class="space-y-2">
          <textarea
            bind:value={testPromptInput}
            rows={2}
            placeholder={`Type any test prompt to verify live ${currentProvider.name} responses...`}
            class="w-full px-3 py-2 bg-black border border-purple-900/80 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400 resize-none"
          ></textarea>

          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono text-slate-500">
              Provider: <span class="text-amber-400">{currentProvider.name}</span> • Model: <span class="text-purple-300">{prefs.ai_model || currentProvider.models[0]}</span>
            </span>
            <button
              type="button"
              onclick={handleRunTestPrompt}
              disabled={isRunningPrompt || !testPromptInput.trim()}
              class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display tracking-wider disabled:opacity-50 transition-colors"
            >
              <Play class="w-3 h-3 fill-current" />
              <span>{isRunningPrompt ? 'Executing...' : 'Run Live Prompt'}</span>
            </button>
          </div>
        </div>

        <!-- Live Output Preview -->
        {#if testPromptResult}
          <div class="mt-3 p-3 bg-black/90 border {testPromptResult.success ? 'border-amber-500/40' : 'border-rose-500/40'} space-y-2">
            <div class="flex items-center justify-between text-[10px] font-mono">
              <span class="{testPromptResult.success ? 'text-amber-400' : 'text-rose-400'} font-bold">
                {testPromptResult.success ? `✓ Live ${currentProvider.name} Response` : '✕ Execution Report'}
              </span>
              <span class="text-slate-400">{testPromptResult.latency_ms}ms • {testPromptResult.model}</span>
            </div>
            <pre class="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">{testPromptResult.response}</pre>
          </div>
        {/if}
      </div>
    </div>

    <!-- Workspace Controls -->
    <div class="swiss-card p-6 border border-purple-900/50 bg-[#10071c] space-y-4">
      <div class="flex items-center gap-2 border-b border-purple-900/40 pb-3">
        <Database class="w-4 h-4 text-amber-400" />
        <h2 class="text-sm font-bold text-white font-display">Workspace Data Controls</h2>
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onclick={handleLoadDemo}
          disabled={isDemoLoading}
          class="w-full sm:w-auto px-4 py-2 bg-purple-950/60 hover:bg-purple-900/60 text-amber-300 border border-purple-800 text-xs font-mono font-bold"
        >
          {isDemoLoading ? 'Loading Demo...' : 'Load Sample Creator Records'}
        </button>

        <button
          type="button"
          onclick={handleResetWorkspace}
          disabled={isResetting}
          class="w-full sm:w-auto px-4 py-2 bg-black hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-purple-900/60 text-xs font-mono"
        >
          {isResetting ? 'Resetting...' : 'Reset to Clean Empty State'}
        </button>
      </div>
    </div>
  </form>
</div>
