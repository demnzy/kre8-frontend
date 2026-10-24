<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import type { AnalyticsSummary, SocialAccount, SocialConnectPayload } from '../../types';
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
    RefreshCw
  } from 'lucide-svelte';
  import { reveal } from '../../utils/reveal';

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
  let aiReview = $state<{
    observations: string[];
    patterns: string[];
    action_steps: string[];
    limitations: string[];
  } | null>(null);

  let isAnalyzing = $state(false);
  let isLoading = $state(false);

  // Connect / Edit Stats Modal state
  let showModal = $state(false);
  let selectedPlatform = $state('youtube');
  let channelHandle = $state('');
  let channelFollowers = $state<number>(0);
  let channelViews = $state<number>(0);
  let channelImpressions = $state<number>(0);
  let channelEngagement = $state<number>(3.5);
  let channelAvatar = $state('');
  let isLookingUp = $state(false);
  let lookupMessage = $state('');
  let editingAccountId = $state<number | null>(null);

  onMount(loadData);

  async function loadData() {
    try {
      isLoading = true;
      const [sum, accs] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getSocialAccounts()
      ]);
      summary = sum;
      accounts = accs;
    } catch (e: any) {
      console.error(e);
    } finally {
      isLoading = false;
    }
  }

  function openConnectModal(platform: string, existingAccount?: SocialAccount) {
    selectedPlatform = platform.toLowerCase();
    lookupMessage = '';
    channelAvatar = '';

    if (existingAccount) {
      editingAccountId = existingAccount.id;
      channelHandle = existingAccount.account_name;
      const pStats = summary.platforms.find(p => p.platform.toLowerCase() === selectedPlatform);
      channelFollowers = pStats ? pStats.followers : 0;
      channelViews = pStats ? pStats.views : 0;
      channelImpressions = channelViews * 2;
      channelEngagement = pStats ? pStats.engagement_rate : 3.5;
    } else {
      editingAccountId = null;
      channelHandle = '';
      channelFollowers = 0;
      channelViews = 0;
      channelImpressions = 0;
      channelEngagement = 3.5;
    }

    showModal = true;
  }

  async function handleYouTubeLookup() {
    if (!channelHandle.trim()) {
      lookupMessage = 'Please enter a YouTube handle (e.g. @mkbhd or your channel handle)';
      return;
    }
    try {
      isLookingUp = true;
      lookupMessage = 'Inspecting public YouTube channel data...';
      const res = await api.lookupYouTubeHandle(channelHandle);
      if (res.success) {
        channelHandle = res.handle;
        if (res.followers > 0) {
          channelFollowers = res.followers;
        }
        if (res.avatar_url) {
          channelAvatar = res.avatar_url;
        }
        lookupMessage = `Found ${res.channel_title}${res.subscribers_text ? ` (${res.subscribers_text})` : ''}`;
      } else {
        lookupMessage = res.message || 'Could not auto-fetch channel. You can manually enter your metrics below.';
      }
    } catch (e: any) {
      lookupMessage = 'Could not fetch public stats. You can manually enter your metrics below.';
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
        engagement_rate: Number(channelEngagement) || 0.0
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
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to save channel', 'error');
    }
  }

  async function handleDisconnect(accountId: number) {
    try {
      await api.disconnectAccount(accountId);
      appState.showToast('Account disconnected', 'info');
      await loadData();
    } catch (e: any) {
      appState.showToast(e.message || 'Disconnect failed', 'error');
    }
  }

  async function handleReviewPerformance() {
    try {
      isAnalyzing = true;
      appState.showToast('Gemini is analyzing metric trends, patterns & bottlenecks...', 'info');
      aiReview = await api.getPerformanceReview('Last 30 Days');
      appState.showToast('Performance review complete!', 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Analysis failed', 'error');
    } finally {
      isLookingUp = false;
      isAnalyzing = false;
    }
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <!-- Swiss Header -->
  <div class="swiss-card p-6 border border-purple-900/60 bg-[#10071c] space-y-4">
    <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
      <div class="flex items-center gap-2">
        <BarChart3 class="w-4 h-4 text-amber-400" />
        <span class="swiss-tag text-amber-400">
          Social Telemetry
        </span>
      </div>
      <span class="swiss-tag text-purple-400 font-mono">
        Overview
      </span>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-display">
          Social Telemetry & Analytics
        </h1>
        <p class="text-xs text-slate-300 mt-1">
          Real creator metrics, channel baselines, and Gemini AI performance analysis.
        </p>
      </div>

      <button
        onclick={handleReviewPerformance}
        disabled={isAnalyzing}
        class="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase font-display tracking-wider transition-all disabled:opacity-50 shrink-0"
      >
        <Sparkles class="w-4 h-4" />
        <span>{isAnalyzing ? 'Analyzing...' : 'Review Performance (AI)'}</span>
      </button>
    </div>
  </div>

  <!-- Big Numbers -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div use:reveal={{ delay: 50 }} class="swiss-card swiss-card-hover p-5 border border-purple-900/50 bg-[#10071c]">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="swiss-tag text-slate-400">Total Followers</span>
        <Users class="w-4 h-4 text-amber-400" />
      </div>
      <div class="text-3xl font-black text-amber-400 font-display">{summary.total_followers.toLocaleString()}</div>
      <div class="text-[10px] font-mono text-slate-400 mt-1 uppercase">{summary.connected_accounts_count} accounts connected</div>
    </div>

    <div use:reveal={{ delay: 100 }} class="swiss-card swiss-card-hover p-5 border border-purple-900/50 bg-[#10071c]">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="swiss-tag text-slate-400">Total Views</span>
        <Eye class="w-4 h-4 text-purple-400" />
      </div>
      <div class="text-3xl font-black text-white font-display">{summary.total_views.toLocaleString()}</div>
      <div class="text-[10px] font-mono text-purple-300 mt-1 uppercase">Across connected channels</div>
    </div>

    <div use:reveal={{ delay: 150 }} class="swiss-card swiss-card-hover p-5 border border-purple-900/50 bg-[#10071c]">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="swiss-tag text-slate-400">Impressions</span>
        <TrendingUp class="w-4 h-4 text-amber-400" />
      </div>
      <div class="text-3xl font-black text-amber-400 font-display">{summary.total_impressions.toLocaleString()}</div>
      <div class="text-[10px] font-mono text-slate-400 mt-1 uppercase">Estimated reach</div>
    </div>

    <div use:reveal={{ delay: 200 }} class="swiss-card swiss-card-hover p-5 border border-purple-900/50 bg-[#10071c]">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="swiss-tag text-slate-400">Engagement</span>
        <Heart class="w-4 h-4 text-rose-400" />
      </div>
      <div class="text-3xl font-black text-white font-display">{summary.engagement_rate}%</div>
      <div class="text-[10px] font-mono text-emerald-400 mt-1 uppercase">Calculated rate</div>
    </div>
  </div>

  <!-- AI Review Card -->
  {#if aiReview}
    <div class="swiss-card p-6 border border-amber-500/40 bg-[#12071d] space-y-5 animate-in fade-in">
      <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
        <div class="flex items-center gap-2">
          <Sparkles class="w-4 h-4 text-amber-400" />
          <h2 class="text-sm font-bold uppercase text-white font-display">Gemini Performance Critique & Observations</h2>
        </div>
        <span class="swiss-tag text-amber-400 font-mono">Performance Review</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-black/60 border border-purple-900/60 space-y-2">
          <span class="swiss-tag text-amber-400 block">Observed Patterns:</span>
          <ul class="space-y-1.5 text-xs text-slate-300 font-mono">
            {#each aiReview.observations as obs}
              <li class="flex items-start gap-2">
                <span class="text-amber-400">•</span>
                <span>{obs}</span>
              </li>
            {/each}
          </ul>
        </div>

        <div class="p-4 bg-black/60 border border-purple-900/60 space-y-2">
          <span class="swiss-tag text-purple-300 block">Recommended Action Items:</span>
          <ul class="space-y-1.5 text-xs text-slate-300 font-mono">
            {#each aiReview.action_steps as step}
              <li class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{step}</span>
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

  <!-- Connected Accounts -->
  <div class="swiss-card p-6 border border-purple-900/60 bg-[#10071c] space-y-4">
    <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
      <div>
        <h2 class="text-sm font-bold uppercase text-white font-display">Connected Social Platforms</h2>
        <p class="text-xs text-slate-400 mt-0.5">Manage real channel baselines and synchronized metrics</p>
      </div>
      <button
        onclick={() => appState.setModule('settings')}
        class="text-xs font-mono text-amber-400 hover:text-amber-300 uppercase transition-colors"
      >
        API & Settings
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each ['youtube', 'linkedin', 'tiktok', 'instagram'] as p}
        {@const account = accounts.find(acc => acc.platform.toLowerCase() === p && acc.is_connected)}
        {@const platformStats = summary.platforms.find(acc => acc.platform.toLowerCase() === p)}
        <div class="p-4 bg-black/60 border border-purple-950 flex flex-col justify-between space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase font-display text-white">
              {p.toUpperCase()}
            </span>
            {#if account}
              <span class="px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-400 text-black uppercase">
                Active
              </span>
            {:else}
              <span class="px-2 py-0.5 text-[9px] font-mono bg-purple-950 text-slate-400 uppercase">
                Disconnected
              </span>
            {/if}
          </div>

          {#if account}
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                {#if account.avatar_url}
                  <img src={account.avatar_url} alt={account.account_name} class="w-6 h-6 rounded-full border border-purple-800 object-cover" />
                {/if}
                <div class="text-sm font-bold text-white font-display truncate">{account.account_name}</div>
              </div>
              <div class="text-xs text-purple-300 font-mono">
                {platformStats ? platformStats.followers.toLocaleString() : 0} Followers
              </div>
              {#if platformStats && platformStats.views > 0}
                <div class="text-[10px] text-slate-400 font-mono">
                  {platformStats.views.toLocaleString()} Views • {platformStats.engagement_rate}% Eng.
                </div>
              {/if}
            </div>
          {:else}
            <div class="text-xs text-slate-500 font-mono py-2">
              No account connected. Connect to track live stats.
            </div>
          {/if}

          <div class="space-y-2 pt-2 border-t border-purple-900/30">
            {#if account}
              <div class="flex items-center gap-2">
                <button
                  onclick={() => openConnectModal(p, account)}
                  class="flex-1 py-1.5 bg-purple-950 hover:bg-purple-900 text-slate-200 border border-purple-800 text-xs font-mono uppercase flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit3 class="w-3 h-3" />
                  <span>Update Stats</span>
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
                class="w-full py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-mono uppercase font-bold transition-colors"
              >
                Connect {p}
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- Modal: Connect Channel / Baseline Stats -->
{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
    <div class="swiss-card w-full max-w-md p-6 border border-amber-400/60 bg-[#12071f] space-y-5 shadow-2xl">
      <div class="flex items-center justify-between border-b border-purple-900/50 pb-3">
        <div class="flex items-center gap-2">
          <BarChart3 class="w-4 h-4 text-amber-400" />
          <h3 class="text-sm font-bold uppercase tracking-wide text-white font-display">
            {editingAccountId ? 'Update Channel Stats' : `Connect ${selectedPlatform.toUpperCase()} Channel`}
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
          <span class="block text-slate-400 uppercase text-[10px] mb-1">Platform</span>
          <div class="p-2 bg-purple-950/40 border border-purple-900 text-white font-bold uppercase">
            {selectedPlatform}
          </div>
        </div>

        <!-- Handle input -->
        <div>
          <label for="channel-handle-input" class="block text-slate-400 uppercase text-[10px] mb-1">Channel Handle or Account Name</label>
          <div class="flex items-center gap-2">
            <input
              id="channel-handle-input"
              type="text"
              bind:value={channelHandle}
              placeholder={selectedPlatform === 'youtube' ? '@mkbhd or your handle' : '@yourhandle'}
              class="flex-1 p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
            />
            {#if selectedPlatform === 'youtube'}
              <button
                onclick={handleYouTubeLookup}
                disabled={isLookingUp}
                type="button"
                class="px-3 py-2 bg-purple-900 hover:bg-purple-800 text-white text-[11px] font-bold uppercase disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                <Search class="w-3 h-3" />
                <span>{isLookingUp ? 'Checking...' : 'Lookup'}</span>
              </button>
            {/if}
          </div>
          {#if lookupMessage}
            <div class="text-[11px] mt-1.5 text-amber-300">
              {lookupMessage}
            </div>
          {/if}
        </div>

        <!-- Baseline metrics -->
        <div class="grid grid-cols-2 gap-3 pt-2 border-t border-purple-900/40">
          <div>
            <label for="channel-followers-input" class="block text-slate-400 uppercase text-[10px] mb-1">Followers / Subs</label>
            <input
              id="channel-followers-input"
              type="number"
              bind:value={channelFollowers}
              min="0"
              class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label for="channel-views-input" class="block text-slate-400 uppercase text-[10px] mb-1">Recent Views</label>
            <input
              id="channel-views-input"
              type="number"
              bind:value={channelViews}
              min="0"
              class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label for="channel-impressions-input" class="block text-slate-400 uppercase text-[10px] mb-1">Total Impressions</label>
            <input
              id="channel-impressions-input"
              type="number"
              bind:value={channelImpressions}
              min="0"
              class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label for="channel-engagement-input" class="block text-slate-400 uppercase text-[10px] mb-1">Engagement %</label>
            <input
              id="channel-engagement-input"
              type="number"
              step="0.1"
              bind:value={channelEngagement}
              min="0"
              max="100"
              class="w-full p-2 bg-black border border-purple-900 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-purple-900/40">
        <button
          onclick={() => showModal = false}
          type="button"
          class="px-4 py-2 border border-purple-900 text-slate-400 hover:text-white text-xs font-mono uppercase"
        >
          Cancel
        </button>
        <button
          onclick={handleSaveChannel}
          type="button"
          class="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold uppercase font-mono transition-colors"
        >
          {editingAccountId ? 'Save Stats' : 'Connect Channel'}
        </button>
      </div>
    </div>
  </div>
{/if}
