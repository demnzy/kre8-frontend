<script lang="ts">
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import { Search, Plus, Sparkles, Database, RotateCcw, Globe, Home } from 'lucide-svelte';

  let isResetting = $state(false);
  let isDemoLoading = $state(false);

  async function handleLoadDemo() {
    try {
      isDemoLoading = true;
      const res = await api.loadDemoData();
      await appState.loadInitialData();
      appState.showToast(res.message || 'Demo data loaded successfully!', 'success');
      const current = appState.activeModule;
      appState.setModule(current);
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to load demo data', 'error');
    } finally {
      isDemoLoading = false;
    }
  }

  async function handleReset() {
    if (!confirm('Are you sure you want to reset workspace to a fresh empty state?')) return;
    try {
      isResetting = true;
      const res = await api.resetWorkspace();
      appState.showToast(res.message || 'Workspace reset!', 'info');
      const current = appState.activeModule;
      appState.setModule(current);
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to reset workspace', 'error');
    } finally {
      isResetting = false;
    }
  }
</script>

<header class="h-16 border-b border-purple-900/40 bg-[#0a0412]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
  <!-- Left: Clean Studio Module Breadcrumb -->
  <div class="flex items-center gap-2">
    <span class="text-xs font-mono uppercase tracking-wider text-slate-400">Kre8 Studio</span>
    <span class="text-xs text-purple-600 font-mono">/</span>
    <span class="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">{appState.activeModule}</span>
  </div>

  <!-- Right: Actions & Tools -->
  <div class="flex items-center gap-3">
    <!-- Quick Search trigger -->
    <button
      onclick={() => (appState.commandPaletteOpen = true)}
      class="flex items-center gap-2 px-3 py-1.5 bg-black border border-purple-900/60 hover:border-amber-400/50 text-xs text-slate-400 hover:text-slate-200 transition-all font-mono"
    >
      <Search class="w-3.5 h-3.5" />
      <span class="hidden sm:inline">Search...</span>
      <kbd class="hidden md:inline text-[10px] bg-purple-950/60 px-1 py-0.2 border border-purple-800 text-purple-300">⌘K</kbd>
    </button>

    <!-- Demo Data Buttons -->
    <div class="hidden lg:flex items-center gap-1.5 border-l border-purple-900/40 pl-3">
      <button
        onclick={handleLoadDemo}
        disabled={isDemoLoading}
        class="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/40 text-amber-300 border border-purple-800 text-xs font-mono uppercase transition-colors"
        title="Populate sample ideas, scripts, and calendar events for testing"
      >
        <Database class="w-3.5 h-3.5 text-amber-400" />
        <span>{isDemoLoading ? 'Loading...' : 'Load Demo'}</span>
      </button>

      <button
        onclick={handleReset}
        disabled={isResetting}
        class="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-purple-950/40 text-slate-400 hover:text-slate-200 border border-purple-900/40 text-xs font-mono uppercase transition-colors"
        title="Reset workspace to fresh empty state"
      >
        <RotateCcw class="w-3.5 h-3.5" />
        <span>Reset</span>
      </button>
    </div>

    <!-- Return to landing page button -->
    <button
      onclick={() => appState.exitToLanding()}
      class="hidden md:flex items-center gap-1 px-3 py-1.5 border border-purple-900/40 hover:border-purple-600 text-purple-300 text-xs font-mono uppercase transition-colors"
      title="Return to Landing Page"
    >
      <Home class="w-3.5 h-3.5" />
      <span>Landing</span>
    </button>

    <!-- User Profile & Logout -->
    {#if appState.currentUser}
      <div class="hidden sm:flex items-center gap-2 pl-2 border-l border-purple-900/40">
        <span class="text-[11px] font-mono text-amber-300/90 max-w-[120px] truncate" title={appState.currentUser.email}>
          {appState.currentUser.display_name}
        </span>
        <button
          onclick={() => appState.logout()}
          class="px-2 py-1 bg-[#10071c] hover:bg-rose-950/40 border border-purple-900/50 hover:border-rose-500/40 text-[10px] font-mono uppercase text-slate-400 hover:text-rose-300 transition-colors"
          title="Sign out of current studio session"
        >
          Logout
        </button>
      </div>
    {:else}
      <button
        onclick={() => appState.openAuth('login')}
        class="hidden sm:flex items-center gap-1 px-2.5 py-1.5 border border-amber-400/50 text-amber-300 text-xs font-mono uppercase hover:bg-amber-400/10 transition-colors"
      >
        Sign In
      </button>
    {/if}

    <!-- Quick Capture (+) -->
    <button
      onclick={() => (appState.quickCaptureOpen = true)}
      class="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 font-display"
    >
      <Plus class="w-4 h-4" />
      <span class="hidden sm:inline">New</span>
    </button>
  </div>
</header>
