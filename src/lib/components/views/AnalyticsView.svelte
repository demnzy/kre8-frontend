<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import LoadError from '../layout/LoadError.svelte';
  import type {
    AnalyticsSummary,
    SocialAccount,
    SocialConnectPayload,
    PlatformChannelDetail,
    RecentUploadItem
  } from '../../types';
  import {
    BarChart3,
    Sparkles,
    Users,
    Eye,
    TrendingUp,
    Heart,
    CheckCircle2,
    ShieldAlert,
    Search,
    Edit3,
    X,
    ExternalLink,
    RefreshCw,
    Plus,
    FileCode,
    Video,
    Zap,
    Flame,
    ArrowUpRight,
    Lightbulb
  } from 'lucide-svelte';
  import { reveal } from '../../utils/reveal';
  import { getProviderInfo } from '../../utils/aiProviders';
  import { formatNewsDate } from '../../utils/formatDate';

  type AnalyticsTab = 'all' | 'youtube' | 'x' | 'tiktok' | 'instagram';
  let activeTab = $state<AnalyticsTab>('all');

  let activeProvider = $derived(getProviderInfo(appState.preferences.ai_provider));

  let summary = $state<AnalyticsSummary>({
    total_followers: 0,
    total_views: 0,
    total_impressions: 0,
    total_interactions: 0,
    engagement_rate: 0,
    connected_accounts_count: 0,
    platforms: []
  });

  let accounts = $state<SocialAccount[]>([]);
  let channelDetails = $state<Record<string, PlatformChannelDetail>>({});

  let aiReview = $state<{
    observations: string[];
    patterns: string[];
    action_steps: string[];
    limitations: string[];
  } | null>(null);

  let isAnalyzing = $state(false);
  let isLoading = $state(false);
  let isSyncing = $state(false);

  // Connect / Edit Stats Modal state
  let showModal = $state(false);
  let selectedPlatform = $state('youtube');
  let channelHandle = $state('');
  let channelFollowers = $state<number>(0);
  let channelViews = $state<number>(0);
  let channelImpressions = $state<number>(0);
  let channelEngagement = $state<number>(3.5);
  let channelTotalVideos = $state<number>(0);
  let channelTotalLikes = $state<number>(0);
  let channelFollowing = $state<number>(0);
  let channelPostsCount = $state<number>(0);
  let channelConnections = $state<number>(0);
  let channelReactions = $state<number>(0);
  let channelAvatar = $state('');
  let inspectedRecentVideos = $state<RecentUploadItem[]>([]);

  let isLookingUp = $state(false);
  let lookupMessage = $state('');
  let editingAccountId = $state<number | null>(null);
  let loadError = $state<string | null>(null);

  onMount(async () => {
    await loadData();
    // Preload YouTube channel details if connected
    if (accounts.some(a => a.platform.toLowerCase() === 'youtube' && a.is_connected)) {
      await loadChannelDetails('youtube');
    }
  });

  async function loadData() {
    isLoading = true;
    loadError = null;
    const [sumRes, accsRes] = await Promise.allSettled([
      api.getAnalyticsSummary(),
      api.getSocialAccounts()
    ]);
    if (sumRes.status === 'fulfilled') summary = sumRes.value;
    if (accsRes.status === 'fulfilled') accounts = accsRes.value;
    const rejected = [sumRes, accsRes].find((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (rejected) {
      loadError = rejected.reason?.message || "Couldn't load analytics.";
    }
    isLoading = false;
  }

  async function loadChannelDetails(platform: string) {
    try {
      const details = await api.getChannelDetails(platform);
      channelDetails = { ...channelDetails, [platform.toLowerCase()]: details };
    } catch (err) {
      console.error(`Error loading channel details for ${platform}:`, err);
    }
  }

  async function switchTab(tab: AnalyticsTab) {
    activeTab = tab;
    if (tab !== 'all' && !channelDetails[tab]) {
      await loadChannelDetails(tab);
    }
  }

  function openConnectModal(platform: string, existingAccount?: SocialAccount) {
    selectedPlatform = platform.toLowerCase();
    lookupMessage = '';
    channelAvatar = '';
    inspectedRecentVideos = [];

    if (existingAccount) {
      editingAccountId = existingAccount.id;
      channelHandle = existingAccount.account_name;
      const pStats = summary.platforms.find(p => p.platform.toLowerCase() === selectedPlatform);
      channelFollowers = pStats ? pStats.followers : 0;
      channelViews = pStats ? pStats.views : 0;
      channelImpressions = pStats ? (pStats.impressions || pStats.views * 2) : 0;
      channelEngagement = pStats ? pStats.engagement_rate : 3.5;
      channelTotalVideos = existingAccount.total_videos_count || (pStats ? pStats.total_videos || 0 : 0);
      channelAvatar = existingAccount.avatar_url || '';
    } else {
      editingAccountId = null;
      channelHandle = '';
      channelFollowers = 0;
      channelViews = 0;
      channelImpressions = 0;
      channelEngagement = 3.5;
      channelTotalVideos = 0;
      channelTotalLikes = 0;
      channelFollowing = 0;
      channelPostsCount = 0;
      channelConnections = 0;
      channelReactions = 0;
    }

    showModal = true;
  }

  async function handleUniversalLookup() {
    if (!channelHandle.trim()) {
      lookupMessage = `Please enter a ${selectedPlatform.toUpperCase()} handle or channel URL`;
      return;
    }
    try {
      isLookingUp = true;
      const platLabel = selectedPlatform === 'youtube'
        ? 'YouTube'
        : selectedPlatform === 'x'
        ? 'X / Twitter'
        : selectedPlatform === 'tiktok'
        ? 'TikTok'
        : 'Instagram';
      lookupMessage = `Inspecting ${platLabel}...`;

      const res = await api.lookupPlatformHandle(selectedPlatform, channelHandle);
      if (res && res.success) {
        channelHandle = res.handle || channelHandle;
        channelFollowers = res.followers || 0;
        channelAvatar = res.avatar_url || '';
        channelViews = res.total_tracked_views || 0;
        channelTotalVideos = res.total_videos || 0;
        channelEngagement = res.avg_engagement || 3.5;
        inspectedRecentVideos = res.recent_videos || [];

        if (res.raw_metrics) {
          if (res.raw_metrics.total_likes !== undefined) channelTotalLikes = res.raw_metrics.total_likes;
          if (res.raw_metrics.following !== undefined) channelFollowing = res.raw_metrics.following;
          if (res.raw_metrics.posts_count !== undefined) channelPostsCount = res.raw_metrics.posts_count;
        }

        lookupMessage = `Found ${res.channel_title}${res.subscribers_text ? ` (${res.subscribers_text})` : ''} • ${res.followers.toLocaleString()} followers • ${inspectedRecentVideos.length} recent posts/videos with live telemetry`;
      } else {
        lookupMessage = res?.message || `Could not auto-fetch ${platLabel}. You can manually enter your metrics below.`;
      }
    } catch (e: any) {
      lookupMessage = e?.message || 'Could not fetch public stats. You can manually enter your metrics below.';
    } finally {
      isLookingUp = false;
    }
  }

  async function handleSaveChannel() {
    if (!channelHandle.trim()) {
      appState.showToast('Please provide your channel handle or account name.', 'error');
      return;
    }

    try {
      const payload: SocialConnectPayload = {
        account_name: channelHandle.trim(),
        avatar_url: channelAvatar || undefined,
        followers: Number(channelFollowers) || 0,
        views: Number(channelViews) || 0,
        impressions: Number(channelImpressions) || (Number(channelViews) * 2),
        engagement_rate: Number(channelEngagement) || 0.0,
        total_videos: Number(channelTotalVideos) || undefined,
        recent_videos: inspectedRecentVideos.length > 0 ? inspectedRecentVideos : undefined,
        raw_data: {
          total_likes: Number(channelTotalLikes) || undefined,
          following: Number(channelFollowing) || undefined,
          posts_count: Number(channelPostsCount) || undefined,
          connections: Number(channelConnections) || undefined,
          reactions: Number(channelReactions) || undefined
        }
      };

      if (editingAccountId) {
        await api.updateAccountStats(editingAccountId, payload);
        appState.showToast(`Updated ${selectedPlatform.toUpperCase()} statistics!`, 'success');
      } else {
        const res = await api.connectAccount(selectedPlatform, payload);
        appState.showToast(res.message || `Connected ${selectedPlatform}!`, 'success');
      }

      showModal = false;
      await loadData();
      if (activeTab === selectedPlatform) {
        await loadChannelDetails(selectedPlatform);
      }
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to save channel', 'error');
    }
  }

  async function handleSyncChannel(platform: string) {
    const acc = accounts.find(a => a.platform.toLowerCase() === platform.toLowerCase() && a.is_connected);
    if (!acc) {
      openConnectModal(platform);
      return;
    }

    isSyncing = true;
    appState.showToast(`Syncing live telemetry for ${acc.account_name}...`, 'info');
    try {
      const res = await api.syncAccountStats(acc.id);
      appState.showToast(res.message || `Synchronized ${platform}!`, 'success');
      await loadData();
      await loadChannelDetails(platform);
    } catch (e: any) {
      appState.showToast(e.message || 'Sync failed', 'error');
    } finally {
      isSyncing = false;
    }
  }

  async function handleDisconnect(accountId: number) {
    try {
      await api.disconnectAccount(accountId);
      appState.showToast('Account disconnected', 'info');
      await loadData();
      if (activeTab !== 'all') {
        await loadChannelDetails(activeTab);
      }
    } catch (e: any) {
      appState.showToast(e.message || 'Disconnect failed', 'error');
    }
  }

  async function handleReviewPerformance() {
    if (!appState.requireApiKey()) return;
    try {
      isAnalyzing = true;
      appState.showToast('Analyzing verified channel uploads & cadence...', 'info');
      aiReview = await api.getPerformanceReview('Last 30 Days');
      appState.showToast('Performance review complete!', 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Analysis failed', 'error');
    } finally {
      isAnalyzing = false;
    }
  }

  async function handleAddActionToTasks(stepText: string) {
    try {
      await api.createTask({
        title: stepText,
        priority: 'High',
        is_completed: false,
        checklist: []
      });
      appState.showToast('Added action step to Tasks!', 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Could not add task', 'error');
    }
  }

  function handleDraftFromUpload(upload: RecentUploadItem) {
    appState.openScriptStudioWithTopic({
      topic: `Follow-up to "${upload.title}"`,
      format: 'Video',
      tone: 'Engaging & Direct',
      custom_instructions: `Build a high-retention follow-up or breakdown angle expanding on the audience response to "${upload.title}". Adopt high-curiosity opening hooks and clear scene transitions.`,
      autoGenerate: false
    });
    appState.showToast(`Loaded "${upload.title}" into Script Studio!`, 'info');
  }

  async function handleSaveFollowupIdea(upload: RecentUploadItem) {
    try {
      const idea = await api.createIdea({
        title: `Follow-up to "${upload.title}"`,
        description: `Expanding on top audience response (${formatCount(upload.views)} views, ${upload.engagement_rate || 0}% engagement).`,
        category: appState.preferences.primary_niche,
        intended_platform: activeTab === 'all' ? 'YouTube' : activeTab.toUpperCase(),
        priority: 'High',
        tags: ['telemetry-proven', 'follow-up', activeTab],
        status: 'Active',
        notes: `Telemetry Source:\nOriginal Video: ${upload.title}\nViews: ${formatCount(upload.views)}\nEngagement: ${upload.engagement_rate || 0}%\nPublished: ${upload.published_at}`
      });
      appState.counts.ideas = (appState.counts.ideas || 0) + 1;
      appState.showToast(`Saved follow-up idea to Ideas Bank: "${idea.title}"`, 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Could not save idea', 'error');
    }
  }

  function formatCount(num?: number | null): string {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  {#if loadError}
    <LoadError message={loadError} onRetry={loadData} />
  {/if}

  <!-- Header -->
  <div class="swiss-card p-6 border border-purple-900/60 bg-[#10071c] space-y-4">
    <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
      <div class="flex items-center gap-2">
        <BarChart3 class="w-4 h-4 text-amber-400" />
        <span class="swiss-tag text-amber-400">
          Live Social Telemetry
        </span>
      </div>
      <span class="swiss-tag text-purple-400 font-mono">
        NICHE: {appState.preferences.primary_niche} • {appState.preferences.sub_niche}
      </span>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
          Social Telemetry & Analytics
        </h1>
        <p class="text-xs text-slate-300 mt-1">
          Verified live channel metrics, recent uploads telemetry, and data-grounded performance intelligence.
        </p>
      </div>

      <div class="flex items-center gap-2.5 shrink-0">
        <button
          onclick={handleReviewPerformance}
          disabled={isAnalyzing}
          class="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display tracking-wider transition-all disabled:opacity-50"
        >
          <Sparkles class="w-4 h-4" />
          <span>{isAnalyzing ? `Analyzing with ${activeProvider.name}...` : `Review with ${activeProvider.name}`}</span>
        </button>
      </div>
    </div>

    <!-- Platform Selector Tabs -->
    <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-900/40">
      <button
        onclick={() => switchTab('all')}
        class="px-3.5 py-1.5 text-xs font-mono font-bold tracking-wider transition-all border {activeTab === 'all'
          ? 'bg-amber-400 text-black border-amber-400'
          : 'bg-black/60 text-slate-300 border-purple-900/70 hover:border-purple-600'}"
      >
        All Channels
      </button>

      {#each ['youtube', 'x', 'tiktok', 'instagram'] as plat}
        {@const isConnected = accounts.some(a => a.platform.toLowerCase() === plat && a.is_connected)}
        <button
          onclick={() => switchTab(plat as AnalyticsTab)}
          class="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold tracking-wider transition-all border {activeTab === plat
            ? 'bg-amber-400 text-black border-amber-400'
            : 'bg-black/60 text-slate-300 border-purple-900/70 hover:border-purple-600'}"
        >
          <span>{plat.toUpperCase()}</span>
          {#if isConnected}
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- TAB 1: ALL CHANNELS OVERVIEW -->
  {#if activeTab === 'all'}
    <!-- Big Numbers -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div use:reveal={{ delay: 50 }} class="swiss-card swiss-card-hover p-5 border border-purple-900/50 bg-[#10071c]">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="swiss-tag text-slate-400">Total Followers</span>
          <Users class="w-4 h-4 text-amber-400" />
        </div>
        <div class="text-3xl font-bold text-amber-400 font-display">{formatCount(summary.total_followers)}</div>
        <div class="text-[10px] font-mono text-slate-400 mt-1">{summary.connected_accounts_count} channels connected</div>
      </div>

      <div use:reveal={{ delay: 100 }} class="swiss-card swiss-card-hover p-5 border border-purple-900/50 bg-[#10071c]">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="swiss-tag text-slate-400">Tracked Views</span>
          <Eye class="w-4 h-4 text-purple-400" />
        </div>
        <div class="text-3xl font-bold text-white font-display">{formatCount(summary.total_views)}</div>
        <div class="text-[10px] font-mono text-purple-300 mt-1">Ingested from verified feeds</div>
      </div>

      <div use:reveal={{ delay: 150 }} class="swiss-card swiss-card-hover p-5 border border-purple-900/50 bg-[#10071c]">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="swiss-tag text-slate-400">Total Impressions</span>
          <TrendingUp class="w-4 h-4 text-amber-400" />
        </div>
        <div class="text-3xl font-bold text-amber-400 font-display">{formatCount(summary.total_impressions)}</div>
        <div class="text-[10px] font-mono text-slate-400 mt-1">Cross-platform reach</div>
      </div>

      <div use:reveal={{ delay: 200 }} class="swiss-card swiss-card-hover p-5 border border-purple-900/50 bg-[#10071c]">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="swiss-tag text-slate-400">Engagement</span>
          <Heart class="w-4 h-4 text-rose-400" />
        </div>
        <div class="text-3xl font-bold text-white font-display">{summary.engagement_rate}%</div>
        <div class="text-[10px] font-mono text-emerald-400 mt-1">Interaction velocity</div>
      </div>
    </div>

    <!-- AI Review Card -->
    {#if aiReview}
      <div class="swiss-card p-6 border border-amber-500/40 bg-[#12071d] space-y-5 animate-in fade-in">
        <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <div class="flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-amber-400" />
            <h2 class="text-sm font-bold text-white font-display">{activeProvider.name} Performance Intelligence</h2>
          </div>
          <span class="swiss-tag text-amber-400 font-mono">Data-Grounded Critique</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 bg-black/60 border border-purple-900/60 space-y-2">
            <span class="swiss-tag text-amber-400 block font-bold">Observed Telemetry Patterns:</span>
            <ul class="space-y-1.5 text-xs text-slate-300 font-mono">
              {#each aiReview.observations as obs}
                <li class="flex items-start gap-2">
                  <span class="text-amber-400 shrink-0">•</span>
                  <span>{obs}</span>
                </li>
              {/each}
            </ul>
          </div>

          <div class="p-4 bg-black/60 border border-purple-900/60 space-y-2">
            <span class="swiss-tag text-purple-300 block font-bold">Actionable Next Steps:</span>
            <ul class="space-y-2 text-xs text-slate-300 font-mono">
              {#each aiReview.action_steps as step}
                <li class="flex items-start justify-between gap-2 p-2 bg-purple-950/20 border border-purple-900/40">
                  <div class="flex items-start gap-2">
                    <CheckCircle2 class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                  <button
                    type="button"
                    onclick={() => handleAddActionToTasks(step)}
                    class="px-2 py-0.5 bg-purple-950 hover:bg-amber-400 hover:text-black text-amber-300 border border-purple-800 text-[10px] font-mono shrink-0 flex items-center gap-1 transition-colors"
                  >
                    <Plus class="w-2.5 h-2.5" />
                    <span>Add Task</span>
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        </div>

        <div class="p-3 bg-purple-950/20 border border-purple-900/40 text-[11px] text-slate-400 font-mono flex items-center gap-2">
          <ShieldAlert class="w-4 h-4 text-amber-400 shrink-0" />
          <span>{aiReview.limitations}</span>
        </div>
      </div>
    {/if}

    <!-- Connected Platforms Matrix -->
    <div class="swiss-card p-6 border border-purple-900/60 bg-[#10071c] space-y-4">
      <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
        <div>
          <h2 class="text-sm font-bold text-white font-display">Connected Social Platforms</h2>
          <p class="text-xs text-slate-400 mt-0.5">Manage channel connections and live data synchronization</p>
        </div>
        <button
          onclick={() => appState.setModule('settings')}
          class="text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
        >
          API Settings
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {#each ['youtube', 'x', 'tiktok', 'instagram'] as p}
          {@const account = accounts.find(acc => acc.platform.toLowerCase() === p && acc.is_connected)}
          {@const pStats = summary.platforms.find(acc => acc.platform.toLowerCase() === p)}
          <div class="p-4 bg-black/60 border border-purple-950 flex flex-col justify-between space-y-4 hover:border-purple-800 transition-colors">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold font-display text-white">
                {p.toUpperCase()}
              </span>
              {#if account}
                <span class="px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-400 text-black">
                  Active
                </span>
              {:else}
                <span class="px-2 py-0.5 text-[9px] font-mono bg-purple-950 text-slate-400">
                  Disconnected
                </span>
              {/if}
            </div>

            {#if account}
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  {#if account.avatar_url}
                    <img src={account.avatar_url} alt={account.account_name} class="w-7 h-7 rounded-full border border-purple-700 object-cover shrink-0" />
                  {/if}
                  <div class="text-sm font-bold text-white font-display truncate">{account.account_name}</div>
                </div>
                <div class="text-xs text-purple-300 font-mono">
                  {formatCount(pStats ? pStats.followers : 0)} Followers / Subs
                </div>
                {#if pStats && pStats.views > 0}
                  <div class="text-[10px] text-slate-400 font-mono">
                    {formatCount(pStats.views)} Views • {pStats.engagement_rate}% Eng.
                  </div>
                {/if}
                {#if pStats && pStats.avg_views}
                  <div class="text-[10px] text-amber-400/90 font-mono">
                    ~{formatCount(pStats.avg_views)} avg / upload
                  </div>
                {/if}
              </div>
            {:else}
              <div class="text-xs text-slate-500 font-mono py-2">
                No channel connected. Connect to track verified metrics.
              </div>
            {/if}

            <div class="space-y-2 pt-2 border-t border-purple-900/30">
              {#if account}
                <div class="flex items-center gap-2">
                  <button
                    onclick={() => switchTab(p as AnalyticsTab)}
                    class="flex-1 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-mono font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>View Telemetry</span>
                    <ArrowUpRight class="w-3 h-3" />
                  </button>
                  <button
                    onclick={() => openConnectModal(p, account)}
                    title="Update stats"
                    class="p-1.5 text-slate-400 hover:text-white border border-purple-900/60 bg-black transition-colors"
                  >
                    <Edit3 class="w-3 h-3" />
                  </button>
                  <button
                    onclick={() => handleDisconnect(account.id)}
                    title="Disconnect account"
                    class="p-1.5 text-slate-400 hover:text-rose-400 border border-purple-900/60 bg-black transition-colors"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
              {:else}
                <button
                  onclick={() => openConnectModal(p)}
                  class="w-full py-1.5 bg-purple-900/60 hover:bg-purple-800 text-amber-300 border border-purple-700 text-xs font-mono font-bold transition-colors"
                >
                  Connect {p}
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- TAB 2: SPECIFIC PLATFORM TELEMETRY (YOUTUBE / X / TIKTOK / INSTAGRAM) -->
  {#if activeTab !== 'all'}
    {@const currentDetail = channelDetails[activeTab]}
    {@const currentAcc = accounts.find(a => a.platform.toLowerCase() === activeTab && a.is_connected)}

    <div class="space-y-6 animate-in fade-in">
      <!-- Platform Channel Banner -->
      <div class="swiss-card p-6 border border-purple-800 bg-[#12071f] space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            {#if currentDetail?.avatar_url || currentAcc?.avatar_url}
              <img
                src={currentDetail?.avatar_url || currentAcc?.avatar_url}
                alt={currentDetail?.account_name || activeTab}
                class="w-14 h-14 rounded-full border-2 border-amber-400 object-cover shadow-lg shrink-0"
              />
            {:else}
              <div class="w-14 h-14 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center text-amber-400 font-bold font-display text-xl shrink-0">
                {activeTab.charAt(0).toUpperCase()}
              </div>
            {/if}

            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-bold text-white font-display">
                  {currentDetail?.account_name || currentAcc?.account_name || `${activeTab.toUpperCase()} Channel`}
                </h2>
                {#if currentAcc}
                  <span class="px-2 py-0.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px] font-mono flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Live Synced
                  </span>
                {:else}
                  <span class="px-2 py-0.5 bg-purple-950 border border-purple-800 text-slate-400 text-[10px] font-mono">
                    Not Connected
                  </span>
                {/if}
              </div>
              <p class="text-xs text-slate-400 font-mono mt-0.5">
                {#if currentAcc?.last_synced_at}
                  Last synced: {formatNewsDate(currentAcc.last_synced_at)}
                {:else}
                  Connect to ingest live telemetry, recent uploads, and engagement velocity.
                {/if}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2.5">
            {#if currentAcc}
              <button
                onclick={() => handleSyncChannel(activeTab)}
                disabled={isSyncing}
                class="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-amber-300 border border-purple-700 hover:border-amber-400 text-xs font-mono font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw class="w-3.5 h-3.5 {isSyncing ? 'animate-spin text-amber-400' : ''}" />
                <span>{isSyncing ? 'Syncing...' : 'Sync Live Telemetry'}</span>
              </button>
              <button
                onclick={() => openConnectModal(activeTab, currentAcc)}
                class="px-3 py-2 bg-black hover:bg-purple-950 text-slate-300 border border-purple-900 text-xs font-mono"
              >
                Edit
              </button>
            {:else}
              <button
                onclick={() => openConnectModal(activeTab)}
                class="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-mono tracking-wider"
              >
                Connect {activeTab.toUpperCase()}
              </button>
            {/if}
          </div>
        </div>
      </div>

      <!-- Platform-Semantic KPI Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Tile 1: Subscribers / Followers -->
        <div class="swiss-card p-5 border border-purple-900/50 bg-[#10071c]">
          <div class="flex items-center justify-between text-slate-400 mb-2">
            <span class="swiss-tag text-slate-400">
              {activeTab === 'youtube' ? 'Subscribers' : 'Followers'}
            </span>
            <Users class="w-4 h-4 text-amber-400" />
          </div>
          <div class="text-3xl font-bold text-amber-400 font-display">
            {formatCount(currentDetail?.followers || 0)}
          </div>
          <div class="text-[10px] font-mono text-slate-400 mt-1">Verified audience size</div>
        </div>

        <!-- Tile 2: Total Content Count -->
        <div class="swiss-card p-5 border border-purple-900/50 bg-[#10071c]">
          <div class="flex items-center justify-between text-slate-400 mb-2">
            <span class="swiss-tag text-slate-400">
              {activeTab === 'youtube' ? 'Total Uploads' : activeTab === 'tiktok' ? 'Total Videos' : 'Posts Count'}
            </span>
            <Video class="w-4 h-4 text-purple-400" />
          </div>
          <div class="text-3xl font-bold text-white font-display">
            {formatCount(currentDetail?.total_videos || 0)}
          </div>
          <div class="text-[10px] font-mono text-purple-300 mt-1">
            {activeTab === 'youtube' ? 'Published videos' : 'Published content'}
          </div>
        </div>

        <!-- Tile 3: Avg Views / Video or Interactions -->
        <div class="swiss-card p-5 border border-purple-900/50 bg-[#10071c]">
          <div class="flex items-center justify-between text-slate-400 mb-2">
            <span class="swiss-tag text-slate-400">
              {activeTab === 'youtube' ? 'Avg Views / Video' : activeTab === 'tiktok' ? 'Total Likes' : 'Tracked Volume'}
            </span>
            <Eye class="w-4 h-4 text-amber-400" />
          </div>
          <div class="text-3xl font-bold text-amber-400 font-display">
            {formatCount(currentDetail?.avg_views || currentDetail?.views || 0)}
          </div>
          <div class="text-[10px] font-mono text-slate-400 mt-1">
            {activeTab === 'youtube' ? 'Calculated across recent uploads' : 'Tracked engagement'}
          </div>
        </div>

        <!-- Tile 4: Upload Cadence or Engagement Rate -->
        <div class="swiss-card p-5 border border-purple-900/50 bg-[#10071c]">
          <div class="flex items-center justify-between text-slate-400 mb-2">
            <span class="swiss-tag text-slate-400">
              {activeTab === 'youtube' ? 'Upload Cadence' : 'Engagement Rate'}
            </span>
            <Zap class="w-4 h-4 text-rose-400" />
          </div>
          <div class="text-3xl font-bold text-white font-display">
            {#if activeTab === 'youtube' && currentDetail?.cadence_weekly}
              {currentDetail.cadence_weekly} <span class="text-xs text-purple-300 font-mono">/wk</span>
            {:else}
              {currentDetail?.engagement_rate || 0}%
            {/if}
          </div>
          <div class="text-[10px] font-mono text-emerald-400 mt-1">
            {activeTab === 'youtube' ? 'Publishing frequency' : 'Interaction ratio'}
          </div>
        </div>
      </div>

      <!-- View Trajectory Trend Chart (YouTube / Video channels) -->
      {#if currentDetail?.recent_videos && currentDetail.recent_videos.length > 0}
        {@const vids = currentDetail.recent_videos}
        {@const maxViews = Math.max(...vids.map(v => v.views), 1)}

        <div class="swiss-card p-6 border border-purple-900/60 bg-[#10071c] space-y-4">
          <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
            <div>
              <div class="flex items-center gap-2">
                <TrendingUp class="w-4 h-4 text-amber-400" />
                <h3 class="text-sm font-bold text-white font-display">Uploads View Trajectory</h3>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">Real view performance across the latest {vids.length} uploads</p>
            </div>
            {#if currentDetail.top_video}
              <div class="text-right">
                <span class="text-[10px] font-mono text-slate-400 block">Peak Performer:</span>
                <span class="text-xs font-mono text-amber-400 font-bold">{formatCount(currentDetail.top_video.views)} views</span>
              </div>
            {/if}
          </div>

          <!-- Chart Bar Canvas -->
          <div class="pt-4 pb-2">
            <div class="flex items-end gap-2 h-36 w-full px-2 border-b border-purple-900/60">
              {#each vids.slice().reverse() as vid}
                {@const heightPercent = Math.max(8, Math.round((vid.views / maxViews) * 100))}
                {@const isTop = currentDetail.top_video && vid.video_id === currentDetail.top_video.video_id}
                <div class="flex-1 flex flex-col items-center gap-1.5 group relative h-full justify-end">
                  <!-- Tooltip -->
                  <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col p-2 bg-black/95 border border-amber-400/80 text-[10px] font-mono text-white z-20 w-44 shadow-2xl pointer-events-none">
                    <span class="font-bold text-amber-300 truncate">{vid.title}</span>
                    <span class="text-slate-300 mt-0.5">{formatCount(vid.views)} views</span>
                    <span class="text-slate-400">{formatCount(vid.likes)} likes ({vid.engagement_rate || 0}%)</span>
                    <span class="text-purple-400 text-[9px] mt-0.5">{formatNewsDate(vid.published_at)}</span>
                  </div>

                  <!-- Bar -->
                  <div
                    style="height: {heightPercent}%;"
                    class="w-full transition-all duration-300 cursor-pointer {isTop
                      ? 'bg-amber-400 hover:bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                      : 'bg-purple-700/70 hover:bg-purple-500'}"
                  ></div>
                </div>
              {/each}
            </div>
            <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2 px-2">
              <span>Oldest ({vids.length} uploads ago)</span>
              <span>Latest Upload</span>
            </div>
          </div>
        </div>

        <!-- Recent Uploads Telemetry Table & Video Cards -->
        <div class="swiss-card p-6 border border-purple-900/60 bg-[#10071c] space-y-4">
          <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
            <div>
              <h3 class="text-sm font-bold text-white font-display">Recent Video Uploads & Telemetry</h3>
              <p class="text-xs text-slate-400 mt-0.5">Verified view counts, likes, and 1-click Script Studio creation</p>
            </div>
            <span class="swiss-tag text-purple-300 font-mono">{vids.length} Uploads Tracked</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each vids as vid}
              {@const isTop = currentDetail.top_video && vid.video_id === currentDetail.top_video.video_id}
              <div class="p-4 bg-black/60 border {isTop ? 'border-amber-400/70 bg-amber-950/10' : 'border-purple-950'} flex flex-col justify-between space-y-3 hover:border-purple-800 transition-colors">
                <div class="space-y-2.5">
                  <!-- Thumbnail & Badges -->
                  <div class="relative aspect-video w-full overflow-hidden bg-purple-950 border border-purple-900/50">
                    {#if vid.thumbnail_url}
                      <img src={vid.thumbnail_url} alt={vid.title} class="w-full h-full object-cover" />
                    {/if}
                    {#if isTop}
                      <span class="absolute top-2 left-2 px-2 py-0.5 bg-amber-400 text-black font-bold font-mono text-[9px] flex items-center gap-1 shadow-md">
                        <Flame class="w-3 h-3 fill-current" />
                        Top Performer
                      </span>
                    {/if}
                    <span class="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 font-mono text-[9px] text-slate-300">
                      {formatNewsDate(vid.published_at)}
                    </span>
                  </div>

                  <!-- Title -->
                  <h4 class="text-xs font-bold text-white font-display line-clamp-2 leading-snug" title={vid.title}>
                    {vid.title}
                  </h4>

                  <!-- Metrics -->
                  <div class="grid grid-cols-3 gap-2 py-2 border-y border-purple-900/40 text-center font-mono">
                    <div>
                      <span class="text-[9px] text-slate-400 block">Views</span>
                      <span class="text-xs font-bold text-amber-400">{formatCount(vid.views)}</span>
                    </div>
                    <div>
                      <span class="text-[9px] text-slate-400 block">Likes</span>
                      <span class="text-xs font-bold text-white">{formatCount(vid.likes)}</span>
                    </div>
                    <div>
                      <span class="text-[9px] text-slate-400 block">Rate</span>
                      <span class="text-xs font-bold text-emerald-400">{vid.engagement_rate || 0}%</span>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 pt-1">
                  <button
                    onclick={() => handleDraftFromUpload(vid)}
                    class="flex-1 py-1.5 px-2 bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                    title="Draft a follow-up or breakdown script inspired by this video"
                  >
                    <FileCode class="w-3 h-3 text-black" />
                    <span>Draft Script</span>
                  </button>

                  <button
                    onclick={() => handleSaveFollowupIdea(vid)}
                    class="p-1.5 bg-purple-950 hover:bg-purple-900 text-amber-300 border border-purple-800 transition-colors"
                    title="Save follow-up angle to Ideas Bank"
                  >
                    <Lightbulb class="w-3.5 h-3.5" />
                  </button>

                  {#if vid.url}
                    <a
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="p-1.5 text-slate-400 hover:text-white border border-purple-900/60 bg-black transition-colors"
                      title="Watch on YouTube"
                    >
                      <ExternalLink class="w-3.5 h-3.5" />
                    </a>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <!-- Empty / Guide state -->
        <div class="swiss-card p-10 border border-purple-900/60 bg-[#10071c] text-center space-y-4">
          <div class="w-12 h-12 mx-auto rounded-full bg-purple-950 flex items-center justify-center text-amber-400">
            <Video class="w-6 h-6" />
          </div>
          <div class="max-w-md mx-auto space-y-1">
            <h3 class="text-base font-bold text-white font-display">No Video Telemetry Ingested Yet</h3>
            <p class="text-xs text-slate-400 font-mono">
              {#if currentAcc}
                Click "Sync Live Telemetry" above to scrape the latest 15 uploads, verified view counts, and engagement velocity.
              {:else}
                Connect your channel using your @handle to automatically pull your real subscribers and video uploads.
              {/if}
            </p>
          </div>
          <div>
            {#if currentAcc}
              <button
                onclick={() => handleSyncChannel(activeTab)}
                disabled={isSyncing}
                class="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-mono tracking-wider transition-all"
              >
                {isSyncing ? 'Syncing...' : 'Sync Live Telemetry Now'}
              </button>
            {:else}
              <button
                onclick={() => openConnectModal(activeTab)}
                class="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-mono tracking-wider transition-all"
              >
                Connect {activeTab.toUpperCase()} Channel
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Modal: Connect Channel / Platform-Semantic Stats -->
{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
    <div class="swiss-card w-full max-w-lg p-6 border border-amber-400/60 bg-[#12071f] space-y-5 shadow-2xl">
      <div class="flex items-center justify-between border-b border-purple-900/50 pb-3">
        <div class="flex items-center gap-2">
          <BarChart3 class="w-4 h-4 text-amber-400" />
          <h3 class="text-sm font-bold tracking-wide text-white font-display">
            {editingAccountId ? `Update ${selectedPlatform.toUpperCase()} Stats` : `Connect ${selectedPlatform.toUpperCase()} Channel`}
          </h3>
        </div>
        <button
          onclick={() => showModal = false}
          class="text-slate-400 hover:text-white p-1"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-4 text-xs font-mono">
        <!-- Platform info -->
        <div>
          <span class="block text-slate-400 text-[10px] mb-1">Platform</span>
          <div class="p-2 bg-purple-950/40 border border-purple-900 text-amber-400 font-bold uppercase tracking-wider">
            {selectedPlatform}
          </div>
        </div>

        <!-- Handle input & Universal Live Lookup -->
        <div>
          <label for="channel-handle-input" class="block text-slate-400 text-[10px] mb-1">
            {selectedPlatform === 'youtube'
              ? 'YouTube Channel Handle or URL'
              : selectedPlatform === 'x'
              ? 'X / Twitter Handle or Profile URL'
              : selectedPlatform === 'tiktok'
              ? 'TikTok Username or Profile URL'
              : 'Instagram Username or Profile URL'}
          </label>
          <div class="flex items-center gap-2">
            <input
              id="channel-handle-input"
              type="text"
              bind:value={channelHandle}
              placeholder={selectedPlatform === 'youtube'
                ? '@mkbhd or @fireship'
                : selectedPlatform === 'x'
                ? '@mkbhd or x.com/mkbhd'
                : selectedPlatform === 'tiktok'
                ? '@creator or tiktok.com/@creator'
                : '@creator or instagram.com/creator'}
              class="flex-1 p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
              onkeydown={(e) => e.key === 'Enter' && handleUniversalLookup()}
            />
            <button
              onclick={handleUniversalLookup}
              disabled={isLookingUp}
              type="button"
              class="px-3.5 py-2 bg-purple-900 hover:bg-purple-800 text-amber-300 border border-purple-700 text-[11px] font-bold disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {#if isLookingUp}
                <RefreshCw class="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Inspecting...</span>
              {:else}
                <Search class="w-3.5 h-3.5 text-amber-400" />
                <span>Inspect Channel</span>
              {/if}
            </button>
          </div>
          {#if lookupMessage}
            <div class="text-[11px] mt-1.5 text-amber-300 leading-relaxed">
              {lookupMessage}
            </div>
          {/if}
        </div>

        <!-- Platform-Semantic Metric Inputs -->
        {#if selectedPlatform === 'youtube'}
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-purple-900/40">
            <div>
              <label for="channel-followers-input" class="block text-slate-400 text-[10px] mb-1">Subscribers</label>
              <input
                id="channel-followers-input"
                type="number"
                bind:value={channelFollowers}
                min="0"
                class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label for="channel-videos-input" class="block text-slate-400 text-[10px] mb-1">Total Uploads</label>
              <input
                id="channel-videos-input"
                type="number"
                bind:value={channelTotalVideos}
                min="0"
                class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label for="channel-views-input" class="block text-slate-400 text-[10px] mb-1">Recent Views</label>
              <input
                id="channel-views-input"
                type="number"
                bind:value={channelViews}
                min="0"
                class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        {:else if selectedPlatform === 'tiktok'}
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-purple-900/40">
            <div>
              <label for="tt-followers" class="block text-slate-400 text-[10px] mb-1">Followers</label>
              <input
                id="tt-followers"
                type="number"
                bind:value={channelFollowers}
                min="0"
                class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label for="tt-likes" class="block text-slate-400 text-[10px] mb-1">Total Likes</label>
              <input
                id="tt-likes"
                type="number"
                bind:value={channelTotalLikes}
                min="0"
                class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label for="tt-vids" class="block text-slate-400 text-[10px] mb-1">Video Count</label>
              <input
                id="tt-vids"
                type="number"
                bind:value={channelTotalVideos}
                min="0"
                class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        {:else if selectedPlatform === 'x'}
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-purple-900/40">
            <div>
              <label for="x-followers" class="block text-slate-400 text-[10px] mb-1">Followers</label>
              <input
                id="x-followers"
                type="number"
                bind:value={channelFollowers}
                min="0"
                class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label for="x-following" class="block text-slate-400 text-[10px] mb-1">Following</label>
              <input
                id="x-following"
                type="number"
                bind:value={channelFollowing}
                min="0"
                class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label for="x-posts" class="block text-slate-400 text-[10px] mb-1">Posts Count</label>
              <input
                id="x-posts"
                type="number"
                bind:value={channelPostsCount}
                min="0"
                class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        {:else}
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-purple-900/40">
            <div>
              <label for="ig-followers" class="block text-slate-400 text-[10px] mb-1">Followers</label>
              <input
                id="ig-followers"
                type="number"
                bind:value={channelFollowers}
                min="0"
                class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label for="ig-posts" class="block text-slate-400 text-[10px] mb-1">Posts Count</label>
              <input
                id="ig-posts"
                type="number"
                bind:value={channelPostsCount}
                min="0"
                class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label for="ig-eng" class="block text-slate-400 text-[10px] mb-1">Engagement %</label>
              <input
                id="ig-eng"
                type="number"
                step="0.1"
                bind:value={channelEngagement}
                min="0"
                max="100"
                class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        {/if}
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-purple-900/40">
        <button
          onclick={() => showModal = false}
          type="button"
          class="px-4 py-2 border border-purple-900 text-slate-400 hover:text-white text-xs font-mono"
        >
          Cancel
        </button>
        <button
          onclick={handleSaveChannel}
          type="button"
          class="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-mono transition-colors"
        >
          {editingAccountId ? 'Save Stats' : 'Connect Channel'}
        </button>
      </div>
    </div>
  </div>
{/if}
