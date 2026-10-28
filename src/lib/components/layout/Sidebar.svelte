<script lang="ts">
  import { appState, type AppModule } from '../../stores/appState.svelte';
  import Kre8Logo from '../ui/Kre8Logo.svelte';
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
    Plus,
    LogOut,
    Home,
    LogIn
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
      heading: 'Insights',
      items: [
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'goals', label: 'Goals', icon: Target },
        { id: 'settings', label: 'Settings', icon: Settings }
      ]
    }
  ];
</script>

<aside
  class="relative flex flex-col h-screen border-r border-purple-900/30 bg-[#0b0514] transition-all duration-300 z-30 select-none {appState.sidebarOpen ? 'w-60' : 'w-18'}"
>
  <!-- Brand & Logo -->
  <div class="h-16 flex items-center justify-between px-4 border-b border-purple-900/30">
    <button
      onclick={() => appState.setModule('dashboard')}
      class="flex items-center gap-2.5 text-left overflow-hidden group focus:outline-none"
    >
      <Kre8Logo size="md" variant={appState.sidebarOpen ? 'full' : 'icon'} />
    </button>

    <button
      onclick={() => (appState.sidebarOpen = !appState.sidebarOpen)}
      class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-purple-950/60 transition-colors"
      title={appState.sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      {#if appState.sidebarOpen}
        <ChevronLeft class="w-4 h-4" />
      {:else}
        <ChevronRight class="w-4 h-4" />
      {/if}
    </button>
  </div>

  <!-- Quick Capture Button -->
  <div class="p-3">
    <button
      onclick={() => (appState.quickCaptureOpen = true)}
      class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-all shadow-sm"
    >
      <Plus class="w-4 h-4" />
      {#if appState.sidebarOpen}
        <span>Quick Capture</span>
      {/if}
    </button>
  </div>

  <!-- Navigation Links -->
  <nav class="flex-1 overflow-y-auto px-2.5 space-y-4 py-2">
    {#each sections as sec}
      <div class="space-y-0.5">
        {#if appState.sidebarOpen}
          <div class="px-3 pb-1 text-[11px] font-medium text-slate-500">
            {sec.heading}
          </div>
        {/if}

        {#each sec.items as item}
          {@const isActive = appState.activeModule === item.id}
          <button
            onclick={() => appState.setModule(item.id)}
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative {isActive
              ? 'bg-purple-950/70 text-amber-300 font-semibold'
              : 'text-slate-400 hover:text-slate-100 hover:bg-purple-950/30'}"
          >
            <item.icon class="w-4 h-4 shrink-0 transition-transform group-hover:scale-105 {isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}" />
            
            {#if appState.sidebarOpen}
              <span class="flex-1 text-left truncate">{item.label}</span>
              {#if item.badge}
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-semibold">
                  {item.badge}
                </span>
              {/if}
            {/if}
          </button>
        {/each}
      </div>
    {/each}
  </nav>

  <!-- Footer Profile & Home -->
  <div class="p-3 border-t border-purple-900/30 bg-[#0d0617] space-y-2">
    <button
      onclick={() => appState.exitToLanding()}
      class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-purple-950/40 transition-colors"
      title="Return to home page"
    >
      <Home class="w-3.5 h-3.5" />
      {#if appState.sidebarOpen}
        <span>Home page</span>
      {/if}
    </button>

    <div class="flex items-center justify-between p-1">
      <div class="flex items-center gap-2.5 overflow-hidden flex-1">
        <div class="w-7 h-7 rounded-full bg-purple-900/60 border border-purple-600/40 text-amber-300 flex items-center justify-center font-semibold text-xs shrink-0">
          {appState.currentUser?.display_name ? appState.currentUser.display_name.slice(0, 2).toUpperCase() : 'CR'}
        </div>
        {#if appState.sidebarOpen}
          <div class="overflow-hidden flex-1">
            <div class="text-xs font-medium text-white truncate">
              {appState.currentUser?.display_name || 'Guest Creator'}
            </div>
            <div class="text-[11px] text-slate-400 truncate">
              {appState.preferences.primary_niche}
            </div>
          </div>
        {/if}
      </div>

      {#if appState.sidebarOpen}
        {#if appState.currentUser}
          <button
            onclick={() => appState.logout()}
            class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            title="Sign out"
          >
            <LogOut class="w-3.5 h-3.5" />
          </button>
        {:else}
          <button
            onclick={() => appState.openAuth('login')}
            class="p-1.5 rounded-lg text-amber-300 hover:bg-amber-400/10 transition-colors"
            title="Sign in"
          >
            <LogIn class="w-3.5 h-3.5" />
          </button>
        {/if}
      {/if}
    </div>
  </div>
</aside>
