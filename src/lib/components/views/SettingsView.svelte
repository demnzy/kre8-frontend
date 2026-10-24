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
    Terminal
  } from 'lucide-svelte';

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
    weekly_post_goal: 3
  });

  let isSaving = $state(false);
  let isResetting = $state(false);
  let isDemoLoading = $state(false);

  // Live AI Diagnostics & Playground State
  let isTestingAI = $state(false);
  let aiStatus = $state<AIConnectionStatus | null>(null);
  let testPromptInput = $state('Give me 3 high-retention video hook angles about autonomous AI coding agents.');
  let isRunningPrompt = $state(false);
  let testPromptResult = $state<AIPromptTestResult | null>(null);

  onMount(async () => {
    try {
      if (appState.preferences) {
        prefs = { ...appState.preferences };
      }
      const data = await api.getPreferences();
      if (data) {
        prefs = data;
        appState.preferences = data;
      }
      handleTestAIConnection();
    } catch (e: any) {
      console.error(e);
    }
  });

  async function handleTestAIConnection() {
    isTestingAI = true;
    try {
      const res = await api.testAIConnection(prefs.gemini_api_key);
      aiStatus = res;
      if (res.connected) {
        appState.showToast(`Gemini Live: Connected (${res.latency_ms}ms)`, 'success');
      }
    } catch (e: any) {
      aiStatus = {
        status: 'error',
        connected: false,
        model: 'gemini-2.5-flash',
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
      const res = await api.testAIPrompt(testPromptInput, prefs.gemini_api_key);
      testPromptResult = res;
      if (res.success) {
        appState.showToast(`AI responded in ${res.latency_ms}ms`, 'success');
      } else {
        appState.showToast(res.response, 'error');
      }
    } catch (e: any) {
      testPromptResult = {
        success: false,
        response: e.message || 'Prompt execution failed',
        latency_ms: 0,
        model: 'gemini-2.5-flash'
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
        <h1 class="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-display">
          Creator Preferences
        </h1>
        <p class="text-xs text-slate-300 mt-1">
          Niche targeting keywords for RSS news ingestion, Gemini API keys, and social OAuth credentials.
        </p>
      </div>

      <button
        onclick={handleSavePreferences}
        disabled={isSaving}
        class="flex items-center gap-1.5 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase font-display tracking-wider disabled:opacity-50"
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
        <h2 class="text-sm font-bold uppercase text-white font-display">Niche & Topic Targeting</h2>
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

    <!-- Google Gemini AI Engine & Live Diagnostics -->
    <div class="swiss-card p-6 border border-purple-900/50 bg-[#10071c] space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/40 pb-3">
        <div class="flex items-center gap-2">
          <Key class="w-4 h-4 text-amber-400" />
          <h2 class="text-sm font-bold uppercase text-white font-display">Google Gemini AI Engine</h2>
        </div>

        <!-- Live Status Pill -->
        <div class="flex items-center gap-2">
          {#if aiStatus}
            {#if aiStatus.connected}
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/70 border border-emerald-500/50 text-emerald-400 text-[10px] font-mono uppercase tracking-wider font-bold">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live ({aiStatus.latency_ms}ms)</span>
              </span>
              <span class="px-2 py-1 bg-purple-950/70 border border-purple-700/50 text-purple-300 text-[10px] font-mono">
                {aiStatus.model}
              </span>
            {:else if aiStatus.status === 'missing_key'}
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/60 border border-amber-500/40 text-amber-400 text-[10px] font-mono uppercase tracking-wider">
                <AlertTriangle class="w-3 h-3 text-amber-400" />
                <span>Key Required</span>
              </span>
            {:else}
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/60 border border-rose-500/40 text-rose-400 text-[10px] font-mono uppercase tracking-wider">
                <AlertTriangle class="w-3 h-3 text-rose-400" />
                <span>Error ({aiStatus.latency_ms}ms)</span>
              </span>
            {/if}
          {/if}

          <button
            type="button"
            onclick={handleTestAIConnection}
            disabled={isTestingAI}
            class="flex items-center gap-1 px-3 py-1 bg-black hover:bg-purple-950 text-slate-300 border border-purple-900 text-xs font-mono uppercase tracking-wider disabled:opacity-50 transition-colors"
          >
            <RefreshCw class="w-3 h-3 text-amber-400 {isTestingAI ? 'animate-spin' : ''}" />
            <span>{isTestingAI ? 'Pinging...' : 'Test Connection'}</span>
          </button>
        </div>
      </div>

      <!-- Key Input -->
      <div>
        <label for="swiss-gemini-key" class="block swiss-tag text-slate-400 mb-1">Gemini API Key</label>
        <div class="flex gap-2">
          <input
            id="swiss-gemini-key"
            type="password"
            bind:value={prefs.gemini_api_key}
            placeholder="AIzaSy... (or configure in kre8-backend/.env)"
            class="flex-1 px-3.5 py-2 bg-black border border-purple-900 text-amber-300 text-xs font-mono focus:border-amber-400"
          />
        </div>
        <p class="text-[10px] font-mono text-slate-500 mt-1">
          Keys can be saved here in creator preferences or in <code class="text-amber-400">kre8-backend/.env</code> as <code class="text-amber-400">GEMINI_API_KEY</code>.
        </p>
      </div>

      <!-- Interactive Playground & Diagnostics Box -->
      <div class="p-4 bg-[#0a0412] border border-purple-900/60 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Terminal class="w-3.5 h-3.5 text-amber-400" />
            <span class="text-xs font-bold font-display uppercase text-slate-200">Interactive Gemini Playground</span>
          </div>
          <span class="text-[10px] font-mono text-slate-500">Live Backend Verification</span>
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
            placeholder="Type any test prompt to verify live Google Gemini responses..."
            class="w-full px-3 py-2 bg-black border border-purple-900/80 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400 resize-none"
          ></textarea>

          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono text-slate-500">Model: {aiStatus?.model || 'gemini-2.5-flash'}</span>
            <button
              type="button"
              onclick={handleRunTestPrompt}
              disabled={isRunningPrompt || !testPromptInput.trim()}
              class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display uppercase tracking-wider disabled:opacity-50 transition-colors"
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
                {testPromptResult.success ? '✓ Live Gemini Response' : '✕ Execution Report'}
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
        <h2 class="text-sm font-bold uppercase text-white font-display">Workspace Data Controls</h2>
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onclick={handleLoadDemo}
          disabled={isDemoLoading}
          class="w-full sm:w-auto px-4 py-2 bg-purple-950/60 hover:bg-purple-900/60 text-amber-300 border border-purple-800 text-xs font-mono uppercase font-bold"
        >
          {isDemoLoading ? 'Loading Demo...' : 'Load Sample Creator Records'}
        </button>

        <button
          type="button"
          onclick={handleResetWorkspace}
          disabled={isResetting}
          class="w-full sm:w-auto px-4 py-2 bg-black hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-purple-900/60 text-xs font-mono uppercase"
        >
          {isResetting ? 'Resetting...' : 'Reset to Clean Empty State'}
        </button>
      </div>
    </div>
  </form>
</div>
