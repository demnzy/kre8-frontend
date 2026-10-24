<script lang="ts">
  import { onMount } from 'svelte';
  import { appState, type AppModule } from '../../stores/appState.svelte';
  import {
    Search,
    X,
    LayoutDashboard,
    Video,
    Lightbulb,
    FileCode,
    Compass,
    Calendar,
    BarChart3,
    CheckSquare,
    StickyNote,
    Target,
    Settings,
    ArrowRight
  } from 'lucide-svelte';

  let query = $state('');

  const commands = [
    { label: 'Go to Dashboard', module: 'dashboard', icon: LayoutDashboard },
    { label: 'View My Content (Kanban)', module: 'content', icon: Video },
    { label: 'Open Ideas Bank', module: 'ideas', icon: Lightbulb },
    { label: 'Open Script Studio', module: 'scripts', icon: FileCode },
    { label: 'Discover Daily News & AI Angles', module: 'discover', icon: Compass },
    { label: 'Open Content Calendar', module: 'calendar', icon: Calendar },
    { label: 'View Tasks & Checklists', module: 'tasks', icon: CheckSquare },
    { label: 'Open Creator Notes', module: 'notes', icon: StickyNote },
    { label: 'View Analytics & Performance', module: 'analytics', icon: BarChart3 },
    { label: 'View Goals & Streak', module: 'goals', icon: Target },
    { label: 'Change Niche & Settings', module: 'settings', icon: Settings }
  ];

  let filtered = $derived(
    commands.filter(c => !query.trim() || c.label.toLowerCase().includes(query.toLowerCase()))
  );

  function handleSelect(mod: AppModule) {
    appState.setModule(mod);
    appState.commandPaletteOpen = false;
    query = '';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      appState.commandPaletteOpen = !appState.commandPaletteOpen;
    } else if (e.key === 'Escape' && appState.commandPaletteOpen) {
      appState.commandPaletteOpen = false;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

{#if appState.commandPaletteOpen}
  <div class="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
    <!-- Click backdrop to close -->
    <button
      type="button"
      onclick={() => (appState.commandPaletteOpen = false)}
      class="absolute inset-0 cursor-default"
      aria-label="Close search"
    ></button>

    <div class="relative w-full max-w-lg glass-panel rounded-2xl border border-slate-700 shadow-2xl overflow-hidden z-10 flex flex-col">
      <!-- Search Input -->
      <div class="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-900/80">
        <Search class="w-4 h-4 text-slate-400" />
        <input
          type="text"
          bind:value={query}
          placeholder="Type a command or jump to module..."
          class="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <kbd class="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">ESC</kbd>
      </div>

      <!-- Command List -->
      <div class="p-2 max-h-72 overflow-y-auto space-y-1">
        {#each filtered as cmd}
          <button
            onclick={() => handleSelect(cmd.module as AppModule)}
            class="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-violet-600/20 hover:text-violet-300 text-slate-300 text-xs font-semibold transition-colors group text-left"
          >
            <div class="flex items-center gap-3">
              <cmd.icon class="w-4 h-4 text-slate-400 group-hover:text-violet-400 transition-colors" />
              <span>{cmd.label}</span>
            </div>
            <ArrowRight class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}
