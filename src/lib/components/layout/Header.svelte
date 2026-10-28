<script lang="ts">
  import { appState, type AppModule } from '../../stores/appState.svelte';
  import { getProviderConfig } from '../../utils/aiProviders';
  import { Search, Plus, Sparkles, Key } from 'lucide-svelte';

  const moduleTitles: Record<AppModule, string> = {
    dashboard: 'Dashboard',
    content: 'My Content',
    ideas: 'Ideas Bank',
    scripts: 'Script Studio',
    discover: 'Discover & News',
    calendar: 'Calendar',
    analytics: 'Analytics',
    tasks: 'Tasks',
    notes: 'Notes',
    goals: 'Goals',
    settings: 'Settings'
  };

  let activeTitle = $derived(moduleTitles[appState.activeModule] || 'Workspace');
  let activeProvider = $derived(getProviderConfig(appState.preferences.ai_provider));
</script>

<header class="h-16 border-b border-purple-900/30 bg-[#0a0412]/85 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
  <!-- Left: Clean Page Title & Niche Pill -->
  <div class="flex items-center gap-3">
    <h2 class="text-base font-semibold text-white tracking-tight">
      {activeTitle}
    </h2>
    <span class="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-purple-950/50 border border-purple-800/40 text-purple-200">
      {appState.preferences.primary_niche}
    </span>
  </div>

  <!-- Right: Focused Actions -->
  <div class="flex items-center gap-2.5">
    <!-- Quick Search -->
    <button
      type="button"
      onclick={() => (appState.commandPaletteOpen = true)}
      class="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-black/60 border border-purple-900/50 hover:border-purple-700 text-xs text-slate-400 hover:text-slate-200 transition-all"
    >
      <Search class="w-3.5 h-3.5" />
      <span class="hidden sm:inline">Search...</span>
      <kbd class="hidden md:inline text-[10px] rounded bg-purple-950/60 px-1.5 py-0.5 border border-purple-800/60 text-purple-300">⌘K</kbd>
    </button>

    <!-- AI Provider & API Key Pill -->
    <button
      type="button"
      onclick={() => {
        if (!appState.hasConfiguredApiKey) {
          appState.apiKeyModalOpen = true;
        } else {
          appState.setModule('settings');
        }
      }}
      class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border transition-all text-xs {appState.hasConfiguredApiKey
        ? 'border-purple-900/50 hover:border-amber-400/50 text-slate-200'
        : 'border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15'}"
      title={appState.hasConfiguredApiKey ? 'Active AI model (Click to open AI settings)' : 'Set up your personal AI API key'}
    >
      {#if appState.hasConfiguredApiKey}
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <Sparkles class="w-3.5 h-3.5 text-amber-400" />
        <span class="font-medium">{activeProvider.name}</span>
        <span class="text-slate-400 hidden lg:inline">• {appState.preferences.ai_model || activeProvider.defaultModel}</span>
      {:else}
        <Key class="w-3.5 h-3.5 text-amber-400" />
        <span class="font-medium">Add API Key</span>
      {/if}
    </button>

    <!-- Quick Capture -->
    <button
      type="button"
      onclick={() => (appState.quickCaptureOpen = true)}
      class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold shadow-sm transition-all"
    >
      <Plus class="w-4 h-4" />
      <span class="hidden sm:inline">New</span>
    </button>
  </div>
</header>
