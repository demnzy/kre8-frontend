<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import type { ContentItem, ContentIdea, Task, NewsArticle, AnalyticsSummary } from '../../types';
  import {
    Sparkles,
    Lightbulb,
    Video,
    Calendar,
    TrendingUp,
    Clock,
    CheckCircle2,
    ArrowRight,
    Radio
  } from 'lucide-svelte';
  import { formatCompactNumber } from '../../utils/metrics';
  import LoadError from '../layout/LoadError.svelte';

  let ideas = $state<ContentIdea[]>([]);
  let contentItems = $state<ContentItem[]>([]);
  let tasks = $state<Task[]>([]);
  let latestNews = $state<NewsArticle[]>([]);
  let analyticsSummary = $state<AnalyticsSummary | null>(null);
  let isLoading = $state(true);
  let loadError = $state<string | null>(null);
  let newsLoading = $state(true);
  let newsError = $state<string | null>(null);

  let activeIdeasCount = $derived(ideas.filter(i => i.status === 'Active').length);
  let inProgressCount = $derived(contentItems.filter(c => c.status !== 'Published' && c.status !== 'Repurposed').length);
  let publishedCount = $derived(contentItems.filter(c => c.status === 'Published').length);
  let pendingTasks = $derived(tasks.filter(t => !t.is_completed));
  let urgentTasks = $derived(pendingTasks.filter(t => t.priority === 'High' || t.priority === 'Urgent'));

  let totalReach = $derived(
    analyticsSummary
      ? (analyticsSummary.total_views > 0 ? analyticsSummary.total_views : analyticsSummary.total_impressions)
      : 0
  );

  async function loadCore() {
    isLoading = true;
    loadError = null;
    const [ideasRes, contentRes, tasksRes, summaryRes] = await Promise.allSettled([
      api.getIdeas(),
      api.getContentItems(),
      api.getTasks(),
      api.getAnalyticsSummary()
    ]);

    if (ideasRes.status === 'fulfilled') ideas = ideasRes.value;
    if (contentRes.status === 'fulfilled') contentItems = contentRes.value;
    if (tasksRes.status === 'fulfilled') tasks = tasksRes.value;
    if (summaryRes.status === 'fulfilled') analyticsSummary = summaryRes.value;

    const firstRejected = [ideasRes, contentRes, tasksRes].find(
      (r): r is PromiseRejectedResult => r.status === 'rejected'
    );
    if (firstRejected) {
      loadError = firstRejected.reason?.message || "Couldn't load your workspace overview.";
    }
    isLoading = false;
  }

  async function loadNews() {
    newsLoading = true;
    newsError = null;
    try {
      const fetchedNews = await api.getDailyNews();
      latestNews = fetchedNews.slice(0, 3);
    } catch (e: any) {
      newsError = e?.message || "Couldn't load today's news.";
    } finally {
      newsLoading = false;
    }
  }

  onMount(() => {
    loadCore();
    loadNews();
  });
</script>

<div class="space-y-8 animate-in fade-in duration-300">
  {#if loadError}
    <LoadError message={loadError} onRetry={loadCore} />
  {/if}
  <!-- Swiss Hero Welcome Banner -->
  <div class="relative swiss-card p-8 border border-purple-900/60 bg-[#10071c] space-y-6">
    <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 bg-amber-400 rounded-full"></span>
        <span class="text-xs font-semibold text-amber-300">
          Studio Overview
        </span>
      </div>
      <span class="text-xs text-purple-300">
        {appState.preferences.primary_niche}
      </span>
    </div>

    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-2">
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
          Welcome back, {appState.currentUser?.display_name || 'Creator'}
        </h1>
        <p class="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Your workspace for {appState.preferences.primary_niche}. Turn daily news into video scripts and track your publishing pipeline.
        </p>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <button
          onclick={() => appState.setModule('discover')}
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-900/40 hover:bg-purple-800/50 text-purple-200 border border-purple-700/50 text-xs font-medium transition-colors"
        >
          <Radio class="w-3.5 h-3.5 text-amber-400" />
          <span>Latest News</span>
        </button>

        <button
          onclick={() => (appState.quickCaptureOpen = true)}
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-all shadow-sm"
        >
          <span>+ Quick Capture</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Snapshot Metric Grid -->
  <div class="grid grid-cols-2 md:grid-cols-5 gap-3.5">
    <!-- Active Ideas -->
    <button
      type="button"
      onclick={() => appState.setModule('ideas')}
      class="swiss-card swiss-card-hover p-4 border border-purple-900/40 bg-[#0f061a] flex flex-col justify-between text-left"
    >
      <div class="flex items-center justify-between w-full text-slate-400 mb-2">
        <span class="text-xs font-medium text-slate-400">Saved Ideas</span>
        <Lightbulb class="w-4 h-4 text-amber-400" />
      </div>
      <div>
        <div class="text-2xl font-bold text-amber-400">{activeIdeasCount}</div>
        <div class="text-xs text-slate-400 mt-1">Ready to draft</div>
      </div>
    </button>

    <!-- In Production -->
    <button
      type="button"
      onclick={() => appState.setModule('content')}
      class="swiss-card swiss-card-hover p-4 border border-purple-900/40 bg-[#0f061a] flex flex-col justify-between text-left"
    >
      <div class="flex items-center justify-between w-full text-slate-400 mb-2">
        <span class="text-xs font-medium text-slate-400">In Production</span>
        <Video class="w-4 h-4 text-purple-400" />
      </div>
      <div>
        <div class="text-2xl font-bold text-white">{inProgressCount}</div>
        <div class="text-xs text-slate-400 mt-1">Active videos</div>
      </div>
    </button>

    <!-- Published -->
    <button
      type="button"
      onclick={() => appState.setModule('content')}
      class="swiss-card swiss-card-hover p-4 border border-purple-900/40 bg-[#0f061a] flex flex-col justify-between text-left"
    >
      <div class="flex items-center justify-between w-full text-slate-400 mb-2">
        <span class="text-xs font-medium text-slate-400">Published</span>
        <CheckCircle2 class="w-4 h-4 text-emerald-400" />
      </div>
      <div>
        <div class="text-2xl font-bold text-white">{publishedCount}</div>
        <div class="text-xs text-emerald-400 mt-1">Completed videos</div>
      </div>
    </button>

    <!-- Pending Tasks -->
    <button
      type="button"
      onclick={() => appState.setModule('tasks')}
      class="swiss-card swiss-card-hover p-4 border border-purple-900/40 bg-[#0f061a] flex flex-col justify-between text-left"
    >
      <div class="flex items-center justify-between w-full text-slate-400 mb-2">
        <span class="text-xs font-medium text-slate-400">Open Tasks</span>
        <Clock class="w-4 h-4 text-purple-400" />
      </div>
      <div>
        <div class="text-2xl font-bold text-white">{pendingTasks.length}</div>
        <div class="text-xs text-rose-300 mt-1">{urgentTasks.length} high priority</div>
      </div>
    </button>

    <!-- Total Reach -->
    <button
      type="button"
      onclick={() => appState.setModule('analytics')}
      class="swiss-card swiss-card-hover p-4 border border-purple-900/40 bg-[#0f061a] flex flex-col justify-between text-left col-span-2 md:col-span-1"
    >
      <div class="flex items-center justify-between w-full text-slate-400 mb-2">
        <span class="text-xs font-medium text-slate-400">Total Reach</span>
        <TrendingUp class="w-4 h-4 text-amber-400" />
      </div>
      <div>
        <div class="text-2xl font-bold text-amber-400">{formatCompactNumber(totalReach)}</div>
        <div class="text-xs text-slate-400 mt-1">
          {analyticsSummary?.connected_accounts_count ? `${analyticsSummary.connected_accounts_count} channels synced` : 'Connect in Analytics'}
        </div>
      </div>
    </button>
  </div>

  <!-- Middle Grid: Priorities & Daily News -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Priorities -->
    <div class="lg:col-span-2 swiss-card p-6 border border-purple-900/40 bg-[#10071c] space-y-5">
      <div class="flex items-center justify-between border-b border-purple-900/30 pb-3">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-purple-400"></span>
          <h2 class="font-semibold text-base text-white">Up Next Today</h2>
        </div>
        <button
          onclick={() => appState.setModule('tasks')}
          class="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
        >
          <span>View all tasks</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>

      {#if pendingTasks.length === 0}
        <div class="text-center py-8 text-slate-500 text-xs">
          You're all caught up on tasks for today.
        </div>
      {:else}
        <div class="space-y-2">
          {#each pendingTasks.slice(0, 4) as task}
            <div class="p-3.5 rounded-lg bg-black/50 border border-purple-950 flex items-center justify-between gap-4 hover:border-amber-400/40 transition-colors">
              <div class="flex items-center gap-3 overflow-hidden">
                <span class="px-2 py-0.5 rounded text-[11px] font-medium {task.priority === 'Urgent'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : task.priority === 'High'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-purple-950 text-slate-400 border border-purple-900'}">
                  {task.priority}
                </span>
                <span class="text-xs font-medium text-white truncate">{task.title}</span>
              </div>
              <span class="text-xs text-slate-500 shrink-0">
                {task.checklist?.length ? `${task.checklist.filter(c => c.done).length}/${task.checklist.length} done` : 'To do'}
              </span>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Production Awaiting Action -->
      <div class="pt-3 border-t border-purple-900/30">
        <span class="text-xs font-medium text-slate-400 block mb-2.5">In your content pipeline</span>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {#each contentItems.filter(c => c.status === 'Ready to Record' || c.status === 'Editing' || c.status === 'Script Writing').slice(0, 2) as item}
            <button
              onclick={() => appState.setModule('content')}
              class="p-3.5 rounded-lg bg-purple-950/20 border border-purple-900/50 hover:border-amber-400/50 transition-all text-left flex items-start justify-between"
            >
              <div>
                <span class="text-[11px] font-medium text-amber-400 block mb-1">
                  {item.status} • {item.platform}
                </span>
                <span class="text-xs font-semibold text-white line-clamp-1">{item.title}</span>
              </div>
              <ArrowRight class="w-4 h-4 text-purple-400 shrink-0 mt-1" />
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Daily News Feed -->
    <div class="swiss-card p-6 border border-purple-900/40 bg-[#10071c] space-y-4 flex flex-col justify-between">
      <div class="space-y-4">
        <div class="flex items-center justify-between border-b border-purple-900/30 pb-3">
          <div class="flex items-center gap-2">
            <Radio class="w-4 h-4 text-amber-400" />
            <h2 class="font-semibold text-base text-white">Trending in Your Niche</h2>
          </div>
          <button
            onclick={() => appState.setModule('discover')}
            class="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
          >
            See all
          </button>
        </div>

        {#if newsError && latestNews.length === 0}
          <LoadError message={newsError} onRetry={loadNews} compact />
        {:else if newsLoading && latestNews.length === 0}
          <div class="text-center py-8 text-slate-500 text-xs">
            Loading latest stories for {appState.preferences.sub_niche}...
          </div>
        {:else if latestNews.length === 0}
          <div class="text-center py-8 text-slate-500 text-xs">
            No recent stories for {appState.preferences.sub_niche} yet.
          </div>
        {:else}
          <div class="space-y-3">
            {#each latestNews as news}
              <div class="p-3.5 rounded-lg bg-black/50 border border-purple-950 space-y-1.5 hover:border-purple-800 transition-all">
                <div class="flex items-center justify-between text-[11px] text-slate-400">
                  <span class="text-amber-400 font-medium">{news.source_name || 'News'}</span>
                  <span>{news.published_date?.slice(0, 16)}</span>
                </div>
                <h3 class="text-xs font-medium text-white line-clamp-2 hover:text-amber-300 transition-colors leading-relaxed">
                  {news.headline}
                </h3>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <button
        onclick={() => appState.setModule('discover')}
        class="w-full py-2.5 rounded-lg bg-purple-900/40 hover:bg-purple-900/60 text-amber-300 border border-purple-700/50 text-xs font-semibold transition-all flex items-center justify-center gap-2"
      >
        <Sparkles class="w-3.5 h-3.5 text-amber-400" />
        <span>Generate Video Ideas from News</span>
      </button>
    </div>
  </div>
</div>
