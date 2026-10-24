<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from './lib/stores/appState.svelte';

  // Landing Page & Auth Modal
  import LandingPage from './lib/components/landing/LandingPage.svelte';
  import AuthModal from './lib/components/landing/AuthModal.svelte';

  // Workspace Layout components
  import Sidebar from './lib/components/layout/Sidebar.svelte';
  import Header from './lib/components/layout/Header.svelte';
  import ToastContainer from './lib/components/layout/ToastContainer.svelte';
  import QuickCaptureModal from './lib/components/layout/QuickCaptureModal.svelte';
  import CommandPalette from './lib/components/layout/CommandPalette.svelte';

  // Feature Views
  import DashboardView from './lib/components/views/DashboardView.svelte';
  import ContentView from './lib/components/views/ContentView.svelte';
  import IdeasView from './lib/components/views/IdeasView.svelte';
  import ScriptStudioView from './lib/components/views/ScriptStudioView.svelte';
  import DiscoverView from './lib/components/views/DiscoverView.svelte';
  import CalendarView from './lib/components/views/CalendarView.svelte';
  import AnalyticsView from './lib/components/views/AnalyticsView.svelte';
  import TasksView from './lib/components/views/TasksView.svelte';
  import NotesView from './lib/components/views/NotesView.svelte';
  import GoalsView from './lib/components/views/GoalsView.svelte';
  import SettingsView from './lib/components/views/SettingsView.svelte';

  onMount(async () => {
    await appState.loadInitialData();
  });
</script>

{#if appState.pageView === 'landing'}
  <!-- PUBLIC LANDING PAGE (DEFAULT INITIAL ENTRY) -->
  <LandingPage />
{:else}
  <!-- CREATOR WORKSPACE -->
  <div class="flex h-screen w-screen overflow-hidden bg-[#08040d] text-slate-100 font-sans selection:bg-amber-400 selection:text-black">
    <!-- Collapsible Swiss Navigation Sidebar -->
    <Sidebar />

    <!-- Main Workspace Container -->
    <div class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
      <!-- Top Swiss Header -->
      <Header />

      <!-- Scrollable View Container -->
      <main class="flex-1 overflow-y-auto px-6 py-8 md:px-10 lg:px-12 swiss-grid scroll-smooth">
        <div class="max-w-7xl mx-auto">
          {#key appState.activeModule}
            <div class="view-enter">
              {#if appState.activeModule === 'dashboard'}
                <DashboardView />
              {:else if appState.activeModule === 'content'}
                <ContentView />
              {:else if appState.activeModule === 'ideas'}
                <IdeasView />
              {:else if appState.activeModule === 'scripts'}
                <ScriptStudioView />
              {:else if appState.activeModule === 'discover'}
                <DiscoverView />
              {:else if appState.activeModule === 'calendar'}
                <CalendarView />
              {:else if appState.activeModule === 'analytics'}
                <AnalyticsView />
              {:else if appState.activeModule === 'tasks'}
                <TasksView />
              {:else if appState.activeModule === 'notes'}
                <NotesView />
              {:else if appState.activeModule === 'goals'}
                <GoalsView />
              {:else if appState.activeModule === 'settings'}
                <SettingsView />
              {/if}
            </div>
          {/key}
        </div>
      </main>
    </div>

    <!-- Global Overlays & Toasts -->
    <QuickCaptureModal />
    <CommandPalette />
  </div>
{/if}

<!-- Modals & Feedback Notifications -->
<AuthModal />
<ToastContainer />
