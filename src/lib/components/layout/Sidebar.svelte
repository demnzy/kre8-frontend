<script lang="ts">
  import { appState, type AppModule } from '../../stores/appState.svelte';
  import {
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
    ChevronLeft,
    ChevronRight,
    Flame,
    Plus,
    LogOut,
    Home
  } from 'lucide-svelte';

  const sections: {
    heading: string;
    items: { id: AppModule; label: string; icon: any; badge?: string }[];
  }[] = [
    {
      heading: 'Workspace',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'content', label: 'My Content', icon: Video },
        { id: 'ideas', label: 'Ideas Bank', icon: Lightbulb },
        { id: 'scripts', label: 'Script Studio', icon: FileCode }
      ]
    },
    {
      heading: 'Discovery',
      items: [
        { id: 'discover', label: 'Discover & News', icon: Compass, badge: 'AI' }
      ]
    },
    {
      heading: 'Production',
      items: [
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'notes', label: 'Notes', icon: StickyNote }
      ]
    },
    {
      heading: 'Analytics',
      items: [
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'goals', label: 'Goals & Streak', icon: Target },
        { id: 'settings', label: 'Settings', icon: Settings }
      ]
    }
  ];
</script>

<aside
  class="relative flex flex-col h-screen border-r border-purple-900/40 bg-[#0a0412] transition-all duration-300 z-30 select-none {appState.sidebarOpen ? 'w-64' : 'w-20'}"
>
  <!-- Brand & Logo -->
  <div class="h-16 flex items-center justify-between px-4 border-b border-purple-900/40 bg-[#0d0617]">
    <button
      onclick={() => appState.setModule('dashboard')}
      class="flex items-center gap-3 text-left overflow-hidden group"
    >
      <div class="w-8 h-8 bg-amber-400 text-black flex items-center justify-center font-black text-sm tracking-tighter shrink-0 font-display">
        K8
      </div>
      {#if appState.sidebarOpen}
        <div>
          <span class="font-black text-base tracking-tight text-white uppercase font-display">
            KRE<span class="text-amber-400">8</span>
          </span>
          <span class="block swiss-tag text-[9px] text-purple-400 -mt-1 font-mono">
            STUDIO.OS
          </span>
        </div>
      {/if}
    </button>

    <button
      onclick={() => (appState.sidebarOpen = !appState.sidebarOpen)}
      class="p-1 rounded text-slate-400 hover:text-white hover:bg-purple-950/60 transition-colors"
      title={appState.sidebarOpen ? 'Collapse' : 'Expand'}
    >
      {#if appState.sidebarOpen}
        <ChevronLeft class="w-4 h-4" />
      {:else}
        <ChevronRight class="w-4 h-4" />
      {/if}
    </button>
  </div>

  <!-- Quick Action Button -->
  <div class="p-3">
    <button
      onclick={() => (appState.quickCaptureOpen = true)}
      class="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs tracking-wider uppercase transition-all shadow-md font-display active:scale-95"
    >
      <Plus class="w-4 h-4" />
      {#if appState.sidebarOpen}
        <span>+ Quick Capture</span>
      {/if}
    </button>
  </div>

  <!-- Navigation Links -->
  <nav class="flex-1 overflow-y-auto px-2 space-y-4 py-2">
    {#each sections as sec}
      <div class="space-y-1">
        {#if appState.sidebarOpen}
          <div class="px-3 pt-1 text-[9px] font-mono uppercase tracking-widest text-purple-400/80">
            {sec.heading}
          </div>
        {/if}

        {#each sec.items as item}
          {@const isActive = appState.activeModule === item.id}
          <button
            onclick={() => appState.setModule(item.id)}
            class="w-full flex items-center gap-3 px-3 py-2 rounded-none text-xs font-medium transition-all group relative {isActive
              ? 'bg-purple-950/60 text-amber-300 border-l-2 border-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-purple-950/20'}"
          >
            <item.icon class="w-4 h-4 shrink-0 transition-transform group-hover:scale-105 {isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}" />
            
            {#if appState.sidebarOpen}
              <span class="flex-1 text-left truncate">{item.label}</span>
              {#if item.badge}
                <span class="text-[9px] font-mono px-1.5 py-0.2 bg-amber-400 text-black font-bold uppercase">
                  {item.badge}
                </span>
              {/if}
            {/if}
          </button>
        {/each}
      </div>
    {/each}
  </nav>

  <!-- Streak Widget -->
  {#if appState.sidebarOpen}
    <div class="mx-3 my-2 p-3 border border-amber-500/30 bg-purple-950/20">
      <div class="flex items-center gap-2">
        <Flame class="w-4 h-4 text-amber-400 fill-amber-400/20" />
        <div>
          <div class="text-[10px] font-mono uppercase text-amber-400">Streak Status</div>
          <div class="text-xs font-bold text-white font-display">5 Consecutive Days</div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Footer Profile & Return to Landing Page -->
  <div class="p-3 border-t border-purple-900/40 bg-[#0d0617] space-y-2">
    <!-- Exit to Landing Page -->
    <button
      onclick={() => appState.exitToLanding()}
      class="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider text-purple-300 hover:text-amber-400 transition-colors"
      title="Return to the public Landing Page"
    >
      <Home class="w-3.5 h-3.5" />
      {#if appState.sidebarOpen}
        <span>Landing Page</span>
      {/if}
    </button>

    <div class="flex items-center justify-between p-1">
      <div class="flex items-center gap-2.5 overflow-hidden flex-1">
        <div class="w-7 h-7 bg-purple-900/60 border border-purple-600/40 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
          {appState.currentUser?.display_name ? appState.currentUser.display_name.slice(0, 2).toUpperCase() : 'CR'}
        </div>
        {#if appState.sidebarOpen}
          <div class="overflow-hidden flex-1">
            <div class="text-xs font-bold text-white truncate">
              {appState.currentUser?.display_name || 'Creator Studio'}
            </div>
            <div class="text-[10px] text-slate-400 font-mono truncate">
              {appState.preferences.primary_niche}
            </div>
          </div>
        {/if}
      </div>

      {#if appState.sidebarOpen && appState.currentUser}
        <button
          onclick={() => appState.logout()}
          class="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
          title="Log out"
        >
          <LogOut class="w-3.5 h-3.5" />
        </button>
      {/if}
    </div>
  </div>
</aside>
