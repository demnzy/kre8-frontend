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
    Flame,
    TrendingUp,
    Clock,
    CheckCircle2,
    ArrowRight,
    Radio
  } from 'lucide-svelte';
  import { calculateActivityStreak, formatCompactNumber } from '../../utils/metrics';

  let ideas = $state<ContentIdea[]>([]);
  let contentItems = $state<ContentItem[]>([]);
  let tasks = $state<Task[]>([]);
  let latestNews = $state<NewsArticle[]>([]);
  let analyticsSummary = $state<AnalyticsSummary | null>(null);
  let isLoading = $state(true);

  let activeIdeasCount = $derived(ideas.filter(i => i.status === 'Active').length);
  let inProgressCount = $derived(contentItems.filter(c => c.status !== 'Published' && c.status !== 'Repurposed').length);
  let publishedCount = $derived(contentItems.filter(c => c.status === 'Published').length);
  let pendingTasks = $derived(tasks.filter(t => !t.is_completed));
  let urgentTasks = $derived(pendingTasks.filter(t => t.priority === 'High' || t.priority === 'Urgent'));

  let streakDays = $derived(
    calculateActivityStreak([
      ...contentItems.map(c => c.planned_date || c.created_at),
      ...tasks.filter(t => t.is_completed).map(t => t.created_at)
    ])
  );

  let totalReach = $derived(
    analyticsSummary
      ? (analyticsSummary.total_views > 0 ? analyticsSummary.total_views : analyticsSummary.total_impressions)
      : 0
  );

  onMount(async () => {
    try {
      isLoading = true;
      const [fetchedIdeas, fetchedContent, fetchedTasks, fetchedNews, summary] = await Promise.all([
        api.getIdeas(),
        api.getContentItems(),
        api.getTasks(),
        api.getDailyNews(),
        api.getAnalyticsSummary().catch(() => null)
      ]);
      ideas = fetchedIdeas;
      contentItems = fetchedContent;
      tasks = fetchedTasks;
      latestNews = fetchedNews.slice(0, 3);
      analyticsSummary = summary;
    } catch (e: any) {
      console.error(e);
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="space-y-8 animate-in fade-in duration-300">
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
          class="flex items-center gap-2 px-4 py-2 bg-purple-900/50 hover:bg-purple-800/50 text-purple-200 border border-purple-700/60 text-xs font-medium transition-colors"
        >
          <Radio class="w-3.5 h-3.5 text-amber-400" />
          <span>Latest News</span>
        </button>

        <button
          onclick={() => (appState.quickCaptureOpen = true)}
          class="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition-all font-display shadow-sm active:scale-95"
        >
          <span>+ Quick Capture</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Snapshot Metric Grid -->
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
    <!-- Active Ideas -->
    <div class="swiss-card swiss-card-hover p-4 border border-purple-900/50 bg-[#0f061a] flex flex-col justify-between">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="swiss-tag text-slate-400">01 / IDEAS</span>
        <Lightbulb class="w-4 h-4 text-amber-400" />
      </div>
      <div>
        <div class="text-3xl font-black text-amber-400 font-display">{activeIdeasCount}</div>
        <div class="text-[10px] font-mono text-slate-400 mt-1 uppercase">Ready to draft</div>
      </div>
    </div>

    <!-- In Production -->
    <div class="swiss-card swiss-card-hover p-4 border border-purple-900/50 bg-[#0f061a] flex flex-col justify-between">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="swiss-tag text-slate-400">02 / WORKFLOW</span>
        <Video class="w-4 h-4 text-purple-400" />
      </div>
      <div>
        <div class="text-3xl font-black text-white font-display">{inProgressCount}</div>
        <div class="text-[10px] font-mono text-slate-400 mt-1 uppercase">Active stages</div>
      </div>
    </div>

    <!-- Published -->
    <div class="swiss-card swiss-card-hover p-4 border border-purple-900/50 bg-[#0f061a] flex flex-col justify-between">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="swiss-tag text-slate-400">03 / OUTPUT</span>
        <CheckCircle2 class="w-4 h-4 text-emerald-400" />
      </div>
      <div>
        <div class="text-3xl font-black text-white font-display">{publishedCount}</div>
        <div class="text-[10px] font-mono text-emerald-400 mt-1 uppercase">Published MTD</div>
      </div>
    </div>

    <!-- Streak -->
    <div class="swiss-card swiss-card-hover p-4 border border-amber-500/30 bg-[#12071f] flex flex-col justify-between">
      <div class="flex items-center justify-between text-amber-400 mb-2">
        <span class="swiss-tag text-amber-400">04 / STREAK</span>
        <Flame class="w-4 h-4 text-amber-400" />
      </div>
      <div>
        <div class="text-3xl font-black text-amber-400 font-display">
          {streakDays} {streakDays === 1 ? 'Day' : 'Days'}
        </div>
        <div class="text-[10px] font-mono text-amber-400/80 mt-1 uppercase">
          {streakDays > 0 ? 'Active momentum' : 'Start your streak today'}
        </div>
      </div>
    </div>

    <!-- Pending Tasks -->
    <div class="swiss-card swiss-card-hover p-4 border border-purple-900/50 bg-[#0f061a] flex flex-col justify-between">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="swiss-tag text-slate-400">05 / TASKS</span>
        <Clock class="w-4 h-4 text-purple-400" />
      </div>
      <div>
        <div class="text-3xl font-black text-white font-display">{pendingTasks.length}</div>
        <div class="text-[10px] font-mono text-rose-400 mt-1 uppercase">{urgentTasks.length} High priority</div>
      </div>
    </div>

    <!-- Total Reach -->
    <div class="swiss-card swiss-card-hover p-4 border border-purple-900/50 bg-[#0f061a] flex flex-col justify-between">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="swiss-tag text-slate-400">06 / TELEMETRY</span>
        <TrendingUp class="w-4 h-4 text-amber-400" />
      </div>
      <div>
        <div class="text-3xl font-black text-amber-400 font-display">{formatCompactNumber(totalReach)}</div>
        <div class="text-[10px] font-mono text-slate-400 mt-1 uppercase">
          {analyticsSummary?.connected_accounts_count ? `${analyticsSummary.connected_accounts_count} channels synced` : 'Sync in Analytics'}
        </div>
      </div>
    </div>
  </div>

  <!-- Middle Grid: Priorities & Daily Trend Radar -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Priorities -->
    <div class="lg:col-span-2 swiss-card p-6 border border-purple-900/60 bg-[#10071c] space-y-5">
      <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-purple-400"></span>
          <h2 class="font-black text-sm uppercase text-white font-display tracking-tight">Today's Execution Queue</h2>
        </div>
        <button
          onclick={() => appState.setModule('tasks')}
          class="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 uppercase"
        >
          <span>All Tasks</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>

      {#if pendingTasks.length === 0}
        <div class="text-center py-8 text-slate-500 text-xs">
          No pending tasks right now.
        </div>
      {:else}
        <div class="space-y-2">
          {#each pendingTasks.slice(0, 4) as task}
            <div class="p-3.5 bg-black/60 border border-purple-950 flex items-center justify-between gap-4 hover:border-amber-400/40 transition-colors">
              <div class="flex items-center gap-3 overflow-hidden">
                <span class="px-2 py-0.5 text-[9px] font-mono font-bold uppercase {task.priority === 'Urgent'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : task.priority === 'High'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-purple-950 text-slate-400 border border-purple-900'}">
                  {task.priority}
                </span>
                <span class="text-xs font-bold text-white truncate font-display">{task.title}</span>
              </div>
              <span class="text-[10px] font-mono text-slate-500 shrink-0 uppercase">
                {task.checklist?.length ? `${task.checklist.filter(c => c.done).length}/${task.checklist.length} done` : 'Pending'}
              </span>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Production Awaiting Action -->
      <div class="pt-3 border-t border-purple-900/40">
        <span class="swiss-tag text-slate-400 block mb-2.5">Production Pipeline Waiting:</span>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {#each contentItems.filter(c => c.status === 'Ready to Record' || c.status === 'Editing' || c.status === 'Script Writing').slice(0, 2) as item}
            <button
              onclick={() => appState.setModule('content')}
              class="p-3 bg-purple-950/20 border border-purple-900/60 hover:border-amber-400/50 transition-all text-left flex items-start justify-between"
            >
              <div>
                <span class="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  {item.status} • {item.platform}
                </span>
                <span class="text-xs font-bold text-white line-clamp-1 font-display">{item.title}</span>
              </div>
              <ArrowRight class="w-4 h-4 text-purple-400 shrink-0 mt-1" />
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Daily Trend Radar -->
    <div class="swiss-card p-6 border border-purple-900/60 bg-[#10071c] space-y-4 flex flex-col justify-between">
      <div class="space-y-4">
        <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <div class="flex items-center gap-2">
            <Radio class="w-4 h-4 text-amber-400 animate-pulse" />
            <h2 class="font-black text-sm uppercase text-white font-display tracking-tight">Daily Trend Radar</h2>
          </div>
          <button
            onclick={() => appState.setModule('discover')}
            class="text-[11px] font-mono text-amber-400 hover:text-amber-300 uppercase transition-colors"
          >
            Explore News
          </button>
        </div>

        {#if latestNews.length === 0}
          <div class="text-center py-8 text-slate-500 text-xs font-mono">
            Querying breaking news for {appState.preferences.sub_niche}...
          </div>
        {:else}
          <div class="space-y-3">
            {#each latestNews as news}
              <div class="p-3 bg-black/60 border border-purple-950 space-y-1.5 hover:border-purple-800 transition-all">
                <div class="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span class="text-amber-400 font-bold uppercase">{news.source_name || 'News Wire'}</span>
                  <span>{news.published_date?.slice(0, 16)}</span>
                </div>
                <h3 class="text-xs font-bold text-white line-clamp-2 hover:text-amber-300 transition-colors font-display">
                  {news.headline}
                </h3>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <button
        onclick={() => appState.setModule('discover')}
        class="w-full py-2.5 bg-purple-900/40 hover:bg-purple-900/60 text-amber-300 border border-purple-700/50 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
      >
        <Sparkles class="w-3.5 h-3.5 text-amber-400" />
        <span>Synthesize AI Ideas from News</span>
      </button>
    </div>
  </div>
</div>
