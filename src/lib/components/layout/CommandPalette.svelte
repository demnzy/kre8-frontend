<script lang="ts">
  import { onMount } from 'svelte';
  import { portal } from '../../utils/portal';
  import { appState, type AppModule } from '../../stores/appState.svelte';
  import {
    Search,
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
    ArrowRight,
    Plus,
    Key,
    Sparkles
  } from 'lucide-svelte';

  let query = $state('');

  type CommandItem = {
    label: string;
    category: 'Quick Action' | 'Navigate';
    icon: any;
    run: () => void;
  };

  const commands: CommandItem[] = [
    {
      label: 'Quick Capture (Idea, Task, or Note)',
      category: 'Quick Action',
      icon: Plus,
      run: () => {
        appState.quickCaptureOpen = true;
      }
    },
    {
      label: 'Configure AI Provider & API Key',
      category: 'Quick Action',
      icon: Key,
      run: () => {
        appState.apiKeyModalOpen = true;
      }
    },
    {
      label: 'Draft New Script in Script Studio',
      category: 'Quick Action',
      icon: Sparkles,
      run: () => {
        appState.setModule('scripts');
      }
    },
    { label: 'Go to Dashboard', category: 'Navigate', icon: LayoutDashboard, run: () => appState.setModule('dashboard') },
    { label: 'View Content Pipeline (Kanban & Table)', category: 'Navigate', icon: Video, run: () => appState.setModule('content') },
    { label: 'Open Ideas Bank', category: 'Navigate', icon: Lightbulb, run: () => appState.setModule('ideas') },
    { label: 'Open Script Studio', category: 'Navigate', icon: FileCode, run: () => appState.setModule('scripts') },
    { label: 'Discover Daily News & AI Angles', category: 'Navigate', icon: Compass, run: () => appState.setModule('discover') },
    { label: 'Open Content Calendar', category: 'Navigate', icon: Calendar, run: () => appState.setModule('calendar') },
    { label: 'View Tasks & Checklists', category: 'Navigate', icon: CheckSquare, run: () => appState.setModule('tasks') },
    { label: 'Open Creator Notes', category: 'Navigate', icon: StickyNote, run: () => appState.setModule('notes') },
    { label: 'View Analytics & Performance', category: 'Navigate', icon: BarChart3, run: () => appState.setModule('analytics') },
    { label: 'View Creator Goals', category: 'Navigate', icon: Target, run: () => appState.setModule('goals') },
    { label: 'Change Niche & Settings', category: 'Navigate', icon: Settings, run: () => appState.setModule('settings') }
  ];

  let filtered = $derived(
    commands.filter(c => !query.trim() || c.label.toLowerCase().includes(query.toLowerCase()))
  );

  function handleSelect(cmd: CommandItem) {
    appState.commandPaletteOpen = false;
    query = '';
    cmd.run();
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
  <div use:portal class="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center pt-20 sm:pt-24 pb-16 p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
    <!-- Click backdrop to close -->
    <button
      type="button"
      onclick={() => (appState.commandPaletteOpen = false)}
      class="fixed inset-0 cursor-default"
      aria-label="Close search"
      tabindex="-1"
    ></button>

    <div class="relative w-full max-w-lg rounded-xl border border-purple-800/80 bg-[#10071c] shadow-2xl overflow-hidden z-10 flex flex-col">
      <!-- Search Input -->
      <div class="flex items-center gap-3 px-4 py-3.5 border-b border-purple-900/50 bg-black/60">
        <Search class="w-4 h-4 text-amber-400" />
        <input
          type="text"
          bind:value={query}
          placeholder="Search commands or jump to a section..."
          class="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <kbd class="text-[10px] bg-purple-950 border border-purple-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">Esc</kbd>
      </div>

      <!-- Command List -->
      <div class="p-2 max-h-80 overflow-y-auto space-y-1">
        {#each filtered as cmd}
          <button
            onclick={() => handleSelect(cmd)}
            class="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-purple-900/40 hover:text-amber-300 text-slate-200 text-xs font-medium transition-colors group text-left"
          >
            <div class="flex items-center gap-3">
              <cmd.icon class="w-4 h-4 text-amber-400/80 group-hover:text-amber-400 transition-colors" />
              <span>{cmd.label}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-mono text-slate-500 group-hover:text-purple-300">{cmd.category}</span>
              <ArrowRight class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}
