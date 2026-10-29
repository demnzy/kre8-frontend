<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import { resolveAvatarUrl, resolveMediaUrl, handleAvatarError, handleThumbnailError } from '../../utils/avatar';
  import LoadError from '../layout/LoadError.svelte';
  import type { NewsArticle, NewsAIIdea, CreatorWatchlist, NewsRegion } from '../../types';
  import {
    Compass,
    Radio,
    Sparkles,
    ExternalLink,
    FileCode,
    RefreshCw,
    Bookmark,
    Plus,
    Trash2,
    Users,
    Pencil,
    Lightbulb,
    Search,
    Copy,
    Check,
    Zap,
    UserCheck,
    Globe,
    SlidersHorizontal
  } from 'lucide-svelte';
  import { reveal } from '../../utils/reveal';
  import { getProviderInfo } from '../../utils/aiProviders';
  import { formatNewsDate } from '../../utils/formatDate';

  type DiscoverTab = 'news' | 'watchlist';
  let activeTab = $state<DiscoverTab>('news');

  let newsArticles = $state<NewsArticle[]>([]);
  let newsSearch = $state('');
  let selectedSource = $state('All');
  let selectedRegion = $state<string>(appState.preferences.news_region || 'GLOBAL');
  let selectedCategory = $state<string>('all');
  let aiIdeas = $state<NewsAIIdea[]>([]);
  let watchlist = $state<CreatorWatchlist[]>([]);
  let isLoadingNews = $state(false);
  let isSynthesizing = $state(false);
  let synthesizingArticleId = $state<number | null>(null);
  let selectedSynthesisCreatorId = $state<number | null>(null);

  let availableRegions = $state<NewsRegion[]>([
    { code: 'GLOBAL', label: 'Global', flag: '🌐', description: 'Worldwide headlines & trends' },
    { code: 'NG', label: 'Nigeria', flag: '🇳🇬', description: 'Nigerian tech & creator economy' },
    { code: 'US', label: 'United States', flag: '🇺🇸', description: 'US media & Silicon Valley' },
    { code: 'UK', label: 'United Kingdom', flag: '🇬🇧', description: 'UK media, tech & Europe' },
    { code: 'CA', label: 'Canada', flag: '🇨🇦', description: 'Canadian innovation & startups' },
    { code: 'IN', label: 'India', flag: '🇮🇳', description: 'Indian creator & startup ecosystem' },
    { code: 'ZA', label: 'South Africa', flag: '🇿🇦', description: 'Southern African business & media' },
    { code: 'KE', label: 'Kenya', flag: '🇰🇪', description: 'East African Silicon Savannah' },
    { code: 'EU', label: 'Europe', flag: '🇪🇺', description: 'European tech & AI innovation' }
  ]);

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'creator', label: 'Creator Economy' },
    { id: 'technology', label: 'Tech & AI' },
    { id: 'business', label: 'Business & Startups' },
    { id: 'gaming', label: 'Gaming' },
    { id: 'science', label: 'Science & Health' },
    { id: 'design', label: 'Design' }
  ];

  let activeProvider = $derived(getProviderInfo(appState.preferences.ai_provider));
  let selectedSynthesisCreator = $derived(
    selectedSynthesisCreatorId ? (watchlist.find(w => w.id === selectedSynthesisCreatorId) || null) : null
  );

  let currentRegionInfo = $derived(
    availableRegions.find(r => r.code.toUpperCase() === selectedRegion.toUpperCase()) || availableRegions[0]
  );

  let availableSources = $derived.by(() => {
    const set = new Set<string>();
    newsArticles.forEach(a => {
      if (a.source_name) set.add(a.source_name.trim());
    });
    return ['All', ...Array.from(set).slice(0, 8)];
  });

  let filteredNewsArticles = $derived(
    newsArticles.filter(art => {
      const matchSource = selectedSource === 'All' || (art.source_name && art.source_name.trim() === selectedSource);
      const matchCategory = selectedCategory === 'all' || (art.category && art.category.toLowerCase() === selectedCategory.toLowerCase());
      const matchQuery =
        !newsSearch.trim() ||
        art.headline.toLowerCase().includes(newsSearch.toLowerCase()) ||
        (art.summary && art.summary.toLowerCase().includes(newsSearch.toLowerCase()));
      return matchSource && matchCategory && matchQuery;
    })
  );

  let showAddWatchlist = $state(false);
  let editingWatchlistId = $state<number | null>(null);
  let watchlistStep = $state<1 | 2 | 3>(1);
  let scannerInput = $state('');
  let isScanningCreator = $state(false);
  let scanError = $state<string | null>(null);

  let newCreatorName = $state('');
  let newCreatorHandle = $state('');
  let newCreatorPlatform = $state('YouTube');
  let newCreatorUrl = $state('');
  let newCreatorAvatar = $state('');
  let newCreatorSubs = $state('');
  let newCreatorTopicNiche = $state('');
  let newCreatorPacing = $state('');
  let newCreatorHooks = $state<string[]>([]);
  let newHookInput = $state('');
  let newCreatorNotes = $state('');
  let newCreatorAngles = $state('');
  let inspectedRecentTitles = $state<string[]>([]);
  let copiedHookId = $state<string | null>(null);
  let newsError = $state<string | null>(null);

  onMount(async () => {
    try {
      const regList = await api.getNewsRegions();
      if (regList && regList.length > 0) {
        availableRegions = regList;
      }
    } catch {}
    loadDailyNews();
    loadWatchlist();
  });

  async function loadDailyNews(forceRefresh = false) {
    isLoadingNews = true;
    newsError = null;
    try {
      newsArticles = await api.getDailyNews(forceRefresh, selectedRegion, selectedCategory);
    } catch (e: any) {
      newsError = e?.message || "Couldn't fetch today's news.";
      if (forceRefresh) appState.showToast(newsError, 'error');
    } finally {
      isLoadingNews = false;
    }
  }

  function handleSelectRegion(code: string) {
    if (selectedRegion === code) return;
    selectedRegion = code;
    selectedSource = 'All';
    loadDailyNews(false);
  }

  function handleSelectCategory(catId: string) {
    if (selectedCategory === catId) return;
    selectedCategory = catId;
    loadDailyNews(false);
  }

  function formatRegionBadge(code?: string): string {
    if (!code) return '🌐 Global';
    const reg = availableRegions.find(r => r.code.toUpperCase() === code.toUpperCase());
    return reg ? `${reg.flag} ${reg.label}` : code;
  }

  async function handleSynthesizeAI(articleId?: number) {
    if (!appState.requireApiKey()) return;
    try {
      isSynthesizing = true;
      if (articleId) synthesizingArticleId = articleId;
      const voiceLabel = selectedSynthesisCreator ? ` in ${selectedSynthesisCreator.creator_name}'s voice` : '';
      const regLabel = selectedRegion !== 'GLOBAL' ? ` (${currentRegionInfo.label})` : '';
      appState.showToast(`Synthesizing angles${voiceLabel}${regLabel} with ${activeProvider.name}...`, 'info');
      aiIdeas = await api.synthesizeNewsToIdeas(articleId, selectedSynthesisCreatorId || undefined, selectedRegion);
      newsArticles = await api.getDailyNews(false, selectedRegion, selectedCategory);
      appState.showToast(`Synthesized content angles & hooks${voiceLabel}!`, 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'AI generation failed', 'error');
    } finally {
      isSynthesizing = false;
      synthesizingArticleId = null;
    }
  }

  async function handleSaveAngleToIdeas(angleId: number) {
    try {
      const idea = await api.saveNewsAngleToIdeas(angleId);
      appState.showToast(`Saved to Ideas Bank: "${idea.title}"`, 'success');
      newsArticles = newsArticles.map(art => ({
        ...art,
        ai_ideas: art.ai_ideas.map(a => a.id === angleId ? { ...a, is_saved_to_ideas: true } : a)
      }));
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to save idea', 'error');
    }
  }

  async function loadWatchlist() {
    try {
      watchlist = await api.getWatchlist();
    } catch (e) {
      console.error(e);
    }
  }

  function deriveProfileUrl(handle: string, platform: string, customUrl: string): string {
    if (customUrl.trim()) return customUrl.trim();
    const clean = handle.trim().replace(/^@/, '');
    if (!clean) return '';
    const p = platform.toLowerCase();
    if (p === 'youtube') return `https://youtube.com/@${clean}`;
    if (p === 'tiktok') return `https://tiktok.com/@${clean}`;
    if (p === 'instagram') return `https://instagram.com/${clean}`;
    if (p === 'x') return `https://x.com/${clean}`;
    if (p === 'linkedin') return `https://linkedin.com/in/${clean}`;
    return '';
  }

  function openAddWatchlistModal() {
    editingWatchlistId = null;
    watchlistStep = 1;
    scannerInput = '';
    scanError = null;
    newCreatorName = '';
    newCreatorHandle = '';
    newCreatorPlatform = 'YouTube';
    newCreatorUrl = '';
    newCreatorAvatar = '';
    newCreatorSubs = '';
    newCreatorTopicNiche = '';
    newCreatorPacing = '';
    newCreatorHooks = [];
    newHookInput = '';
    newCreatorNotes = '';
    newCreatorAngles = '';
    inspectedRecentTitles = [];
    showAddWatchlist = true;
  }

  function openEditWatchlistModal(creator: CreatorWatchlist) {
    editingWatchlistId = creator.id;
    watchlistStep = 2;
    scannerInput = creator.profile_url || creator.handle;
    scanError = null;
    newCreatorName = creator.creator_name;
    newCreatorHandle = creator.handle;
    newCreatorPlatform = creator.platform || 'YouTube';
    newCreatorUrl = creator.profile_url || '';
    newCreatorAvatar = creator.avatar_url || '';
    newCreatorSubs = creator.subscriber_count_text || '';
    newCreatorTopicNiche = creator.topic_niche || '';
    newCreatorPacing = creator.pacing_style || '';
    newCreatorHooks = creator.signature_hooks ? [...creator.signature_hooks] : [];
    newHookInput = '';
    newCreatorNotes = creator.personal_notes || '';
    newCreatorAngles = creator.original_angles || '';
    inspectedRecentTitles = [];
    showAddWatchlist = true;
  }

  async function handleScanCreator() {
    const input = scannerInput.trim();
    if (!input) {
      scanError = 'Please enter a profile link or handle';
      return;
    }
    scanError = null;
    isScanningCreator = true;
    try {
      appState.showToast(`Inspecting creator profile...`, 'info');
      const res = await api.inspectCreator(input, newCreatorPlatform);
      if (res) {
        newCreatorName = res.creator_name || newCreatorName;
        newCreatorHandle = res.handle || newCreatorHandle;
        newCreatorPlatform = res.platform || newCreatorPlatform;
        newCreatorUrl = res.profile_url || newCreatorUrl;
        newCreatorAvatar = res.avatar_url || '';
        newCreatorSubs = res.subscriber_count_text || '';
        newCreatorTopicNiche = res.topic_niche || newCreatorTopicNiche;
        newCreatorPacing = res.pacing_style || '';
        newCreatorNotes = res.personal_notes || '';
        newCreatorAngles = res.original_angles || '';
        newCreatorHooks = res.signature_hooks && res.signature_hooks.length > 0 ? res.signature_hooks : newCreatorHooks;
        inspectedRecentTitles = res.recent_titles || [];
        appState.showToast(`Found ${res.creator_name}!`, 'success');
        watchlistStep = 2;
      }
    } catch (e: any) {
      scanError = e.message || 'Inspection failed. Please fill details manually.';
      appState.showToast(scanError || 'Inspection failed', 'error');
    } finally {
      isScanningCreator = false;
    }
  }

  function addHookFormula() {
    if (!newHookInput.trim()) return;
    newCreatorHooks = [...newCreatorHooks, newHookInput.trim()];
    newHookInput = '';
  }

  function removeHookFormula(index: number) {
    newCreatorHooks = newCreatorHooks.filter((_, i) => i !== index);
  }

  function copyHookToClipboard(hook: string, idStr: string) {
    try {
      navigator.clipboard.writeText(hook);
      copiedHookId = idStr;
      appState.showToast('Copied hook formula to clipboard', 'info');
      setTimeout(() => {
        if (copiedHookId === idStr) copiedHookId = null;
      }, 2000);
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }
  }

  async function handleSaveWatchlist() {
    if (!newCreatorName.trim() || !newCreatorHandle.trim()) {
      appState.showToast('Please provide creator name and handle', 'error');
      return;
    }
    const formattedHandle = newCreatorHandle.trim().startsWith('@')
      ? newCreatorHandle.trim()
      : `@${newCreatorHandle.trim()}`;
    const resolvedUrl = deriveProfileUrl(formattedHandle, newCreatorPlatform, newCreatorUrl);

    try {
      if (editingWatchlistId) {
        const updated = await api.updateWatchlist(editingWatchlistId, {
          creator_name: newCreatorName.trim(),
          handle: formattedHandle,
          platform: newCreatorPlatform,
          profile_url: resolvedUrl || undefined,
          avatar_url: newCreatorAvatar.trim() || undefined,
          subscriber_count_text: newCreatorSubs.trim() || undefined,
          topic_niche: newCreatorTopicNiche.trim() || appState.preferences.sub_niche,
          pacing_style: newCreatorPacing.trim() || undefined,
          signature_hooks: newCreatorHooks,
          personal_notes: newCreatorNotes.trim(),
          original_angles: newCreatorAngles.trim()
        });
        watchlist = watchlist.map(w => (w.id === updated.id ? updated : w));
        appState.showToast(`Updated ${updated.creator_name}`, 'success');
      } else {
        const entry = await api.addWatchlist({
          creator_name: newCreatorName.trim(),
          handle: formattedHandle,
          platform: newCreatorPlatform,
          profile_url: resolvedUrl || undefined,
          avatar_url: newCreatorAvatar.trim() || undefined,
          subscriber_count_text: newCreatorSubs.trim() || undefined,
          topic_niche: newCreatorTopicNiche.trim() || appState.preferences.sub_niche,
          pacing_style: newCreatorPacing.trim() || undefined,
          signature_hooks: newCreatorHooks,
          personal_notes: newCreatorNotes.trim(),
          original_angles: newCreatorAngles.trim()
        });
        watchlist = [...watchlist, entry];
        appState.showToast(`Added ${entry.creator_name} to watchlist`, 'success');
      }
      showAddWatchlist = false;
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to save creator', 'error');
    }
  }

  function handleDraftInCreatorStyle(creator: CreatorWatchlist) {
    const instructions = [
      `Adopt the delivery rhythm and pacing style of ${creator.creator_name} (${creator.handle}).`,
      creator.pacing_style ? `Pacing & Rhythm: ${creator.pacing_style}` : '',
      creator.personal_notes ? `Style Notes: ${creator.personal_notes}` : '',
      creator.original_angles ? `Emulation Guidance: ${creator.original_angles}` : ''
    ].filter(Boolean).join('\n\n');

    appState.openScriptStudioWithTopic({
      topic: `${appState.preferences.sub_niche || appState.preferences.primary_niche} in the style of ${creator.creator_name}`,
      format: creator.platform === 'YouTube' ? 'Short Video' : 'Video',
      tone: creator.pacing_style || 'Engaging & Direct',
      hooks: creator.signature_hooks && creator.signature_hooks.length > 0 ? creator.signature_hooks : undefined,
      custom_instructions: instructions,
      creator_watchlist_id: creator.id,
      creator_name: creator.creator_name,
      creator_handle: creator.handle,
      creator_pacing: creator.pacing_style,
      creator_hooks: creator.signature_hooks,
      autoGenerate: true
    });
    appState.showToast(`Drafting script in ${creator.creator_name}'s style in Script Studio!`, 'info');
  }

  async function handleDeleteWatchlist(id: number) {
    try {
      await api.deleteWatchlist(id);
      watchlist = watchlist.filter(w => w.id !== id);
      appState.showToast('Removed from watchlist', 'info');
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to delete', 'error');
    }
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  {#if newsError}
    <LoadError message={newsError} onRetry={() => loadDailyNews(false)} />
  {/if}
  <!-- Swiss Header -->
  <div class="swiss-card p-6 border border-purple-900/60 bg-[#10071c] space-y-4">
    <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
      <div class="flex items-center gap-2">
        <Radio class="w-4 h-4 text-amber-400 animate-pulse" />
        <span class="swiss-tag text-amber-400">
          Real-Time Trend Radar
        </span>
      </div>
      <span class="swiss-tag text-purple-400 font-mono">
        NICHE: {appState.preferences.primary_niche} • {appState.preferences.sub_niche} • {currentRegionInfo.flag} {currentRegionInfo.code}
      </span>
    </div>

    <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 min-w-0">
      <div class="min-w-0">
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
          Discover & Daily News
        </h1>
        <p class="text-xs text-slate-300 mt-1">
          Real-time verified news tailored to your niche, ready for AI content angle synthesis.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0">
        {#if watchlist.length > 0}
          <div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-black border border-purple-900/60 text-xs font-mono max-w-full">
            <UserCheck class="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span class="text-slate-400 shrink-0">Voice:</span>
            <select
              value={selectedSynthesisCreatorId ?? ''}
              onchange={(e) => (selectedSynthesisCreatorId = Number(e.currentTarget.value) || null)}
              class="bg-transparent text-amber-300 font-mono text-xs focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
            >
              <option value="" class="bg-[#10071c] text-slate-300">Default (Direct & Sharp)</option>
              {#each watchlist as creator}
                <option value={creator.id} class="bg-[#10071c] text-amber-300">
                  {creator.creator_name} ({creator.handle})
                </option>
              {/each}
            </select>
          </div>
        {/if}

        <button
          onclick={() => loadDailyNews(true)}
          disabled={isLoadingNews}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-purple-950 text-slate-300 border border-purple-900/60 text-xs font-mono tracking-wider transition-all disabled:opacity-50 shrink-0"
        >
          <RefreshCw class="w-3.5 h-3.5 text-amber-400 {isLoadingNews ? 'animate-spin' : ''} shrink-0" />
          <span>Refresh</span>
        </button>

        <button
          onclick={() => handleSynthesizeAI()}
          disabled={isSynthesizing}
          class="flex items-center gap-2 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold tracking-wider transition-all font-display shadow-md disabled:opacity-50 shrink-0"
        >
          <Sparkles class="w-3.5 h-3.5 shrink-0" />
          <span class="truncate">
            {isSynthesizing && !synthesizingArticleId
              ? 'Synthesizing...'
              : selectedSynthesisCreator
              ? 'Synthesize in Voice'
              : 'Synthesize Angles'}
          </span>
        </button>
      </div>
    </div>
  </div>

  <!-- Sub-Tabs Navigation -->
  <div class="flex border-b border-purple-900/40 gap-6">
    <button
      onclick={() => (activeTab = 'news')}
      class="pb-3 text-xs font-mono tracking-wider transition-colors flex items-center gap-2 relative {activeTab === 'news'
        ? 'text-amber-400 font-bold'
        : 'text-slate-400 hover:text-slate-200'}"
    >
      <Radio class="w-3.5 h-3.5" />
      <span>Daily News & AI Angles</span>
      {#if activeTab === 'news'}
        <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"></div>
      {/if}
    </button>

    <button
      onclick={() => (activeTab = 'watchlist')}
      class="pb-3 text-xs font-mono tracking-wider transition-colors flex items-center gap-2 relative {activeTab === 'watchlist'
        ? 'text-amber-400 font-bold'
        : 'text-slate-400 hover:text-slate-200'}"
    >
      <Users class="w-3.5 h-3.5" />
      <span>Creator Watchlist ({watchlist.length})</span>
      {#if activeTab === 'watchlist'}
        <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"></div>
      {/if}
    </button>
  </div>

  <!-- TAB 1: DAILY NEWS & AI ANGLES -->
  {#if activeTab === 'news'}
    <div class="space-y-4">
      <!-- Geographic Region & Localization Selector -->
      <div class="bg-[#0b0513] p-3.5 border border-purple-900/60 space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Globe class="w-4 h-4 text-amber-400 shrink-0" />
            <span class="text-xs font-mono font-bold text-white uppercase tracking-wider">Region Focus</span>
            <span class="text-[11px] font-mono text-amber-300/90 hidden sm:inline">({currentRegionInfo.label} — {currentRegionInfo.description})</span>
          </div>
          <span class="text-[10px] font-mono text-purple-400">Localized RSS & Regional Wire</span>
        </div>

        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {#each availableRegions as reg}
            <button
              type="button"
              onclick={() => handleSelectRegion(reg.code)}
              class="px-2.5 py-1 text-xs font-mono transition-all flex items-center gap-1.5 shrink-0 rounded {selectedRegion.toUpperCase() === reg.code.toUpperCase()
                ? 'bg-amber-400 text-black font-bold shadow-sm'
                : 'bg-purple-950/40 text-slate-300 border border-purple-900/50 hover:text-white hover:border-purple-700'}"
              title={reg.description}
            >
              <span>{reg.flag}</span>
              <span>{reg.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Category Filter Pills Bar -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        {#each categories as cat}
          <button
            type="button"
            onclick={() => handleSelectCategory(cat.id)}
            class="px-3 py-1 text-xs font-mono transition-all shrink-0 rounded {selectedCategory === cat.id
              ? 'bg-purple-600 text-white font-bold'
              : 'bg-[#10071c] text-slate-400 border border-purple-900/40 hover:text-slate-200'}"
          >
            {cat.label}
          </button>
        {/each}
      </div>

      {#if newsArticles.length > 0}
        <!-- Filter & Search Bar for Expanded News Pool -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d0617] p-3 border border-purple-900/40">
          <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {#each availableSources as src}
              <button
                type="button"
                onclick={() => (selectedSource = src)}
                class="px-2.5 py-1 text-xs font-mono transition-all shrink-0 {selectedSource === src
                  ? 'bg-amber-400 text-black font-bold'
                  : 'text-slate-400 hover:text-white bg-black/60 border border-purple-900/50'}"
              >
                {src}
              </button>
            {/each}
          </div>

          <div class="w-full sm:w-64">
            <input
              type="text"
              bind:value={newsSearch}
              placeholder="Filter headlines..."
              class="w-full px-3 py-1.5 bg-black border border-purple-900/60 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      {/if}

      {#if isLoadingNews}
        <div class="text-center py-16 text-slate-500 text-xs font-mono animate-pulse">
          Ingesting latest daily news and headlines for {currentRegionInfo.label} • {appState.preferences.sub_niche}...
        </div>
      {:else if filteredNewsArticles.length === 0}
        <div class="text-center py-16 text-slate-500 text-xs font-mono">
          {newsArticles.length === 0
            ? `No news cached for ${currentRegionInfo.label} yet. Click Refresh to ingest breaking stories.`
            : 'No articles match your active filter.'}
        </div>
      {:else}
        <div class="grid grid-cols-1 gap-5">
          {#each filteredNewsArticles as article, idx}
            <div use:reveal={{ delay: Math.min(idx * 75, 400) }} class="swiss-card swiss-card-hover p-6 border border-purple-900/50 bg-[#10071c] hover:border-amber-400/40 transition-all space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {#if article.image_url}
                  <img
                    src={resolveMediaUrl(article.image_url, 'thumbnail')}
                    alt={article.headline}
                    referrerpolicy="no-referrer"
                    onerror={(e) => handleThumbnailError(e, article.headline)}
                    class="w-full sm:w-32 h-20 object-cover border border-purple-900/60 shrink-0 bg-black/60"
                    loading="lazy"
                  />
                {/if}
                <div class="space-y-1.5 flex-1">
                  <div class="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span class="px-2 py-0.5 bg-purple-950 text-amber-400 border border-purple-800 font-bold text-[10px]">
                      {article.source_name || 'News Wire'}
                    </span>
                    {#if article.region}
                      <span class="px-2 py-0.5 bg-black text-amber-300 border border-purple-900/60 font-mono text-[10px]">
                        {formatRegionBadge(article.region)}
                      </span>
                    {/if}
                    {#if article.category && article.category !== 'general'}
                      <span class="px-2 py-0.5 bg-purple-900/30 text-purple-300 border border-purple-800/40 font-mono text-[10px] capitalize">
                        {article.category}
                      </span>
                    {/if}
                    <span class="text-slate-500">•</span>
                    <span class="text-slate-300 font-bold text-[11px]">{formatNewsDate(article.published_date)}</span>
                  </div>
                  <h2 class="text-lg font-bold text-white hover:text-amber-300 transition-colors font-display">
                    <a href={article.source_url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-2">
                      <span>{article.headline}</span>
                      <ExternalLink class="w-3.5 h-3.5 shrink-0 opacity-60 text-amber-400" />
                    </a>
                  </h2>
                </div>
              </div>

              <p class="text-xs text-slate-300 leading-relaxed max-w-3xl">
                {article.summary}
              </p>

              <!-- AI Synthesized Content Angles Section -->
              {#if article.ai_ideas && article.ai_ideas.length > 0}
                <div class="mt-4 pt-4 border-t border-purple-900/40 space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <Sparkles class="w-3.5 h-3.5 text-amber-400" />
                      <span class="swiss-tag text-amber-400">
                        {activeProvider.name} Content Angles & Hooks
                      </span>
                    </div>
                    <button
                      onclick={() => handleSynthesizeAI(article.id)}
                      disabled={isSynthesizing}
                      class="text-[11px] font-mono text-slate-400 hover:text-amber-300 flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw class="w-3 h-3 {synthesizingArticleId === article.id ? 'animate-spin text-amber-400' : ''}" />
                      <span>{synthesizingArticleId === article.id ? 'Refreshing...' : 'Regenerate'}</span>
                    </button>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each article.ai_ideas as angle}
                      <div class="p-4 bg-black/60 border border-purple-900 space-y-3 flex flex-col justify-between">
                        <div class="space-y-2">
                          <div class="flex items-center justify-between">
                            <span class="swiss-tag text-[9px] px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800">
                              {angle.recommended_format}
                            </span>
                            {#if angle.is_saved_to_ideas}
                              <span class="text-[10px] font-mono font-bold text-amber-400">
                                Saved in Ideas
                              </span>
                            {/if}
                          </div>

                          <h3 class="text-sm font-bold text-white font-display">
                            {angle.topic_angle}
                          </h3>

                          {#if angle.why_it_matters}
                            <p class="text-xs text-slate-300 italic">
                              "{angle.why_it_matters}"
                            </p>
                          {/if}

                          {#if angle.viral_hooks && angle.viral_hooks.length > 0}
                            <div class="space-y-1">
                              <span class="swiss-tag text-slate-400 block text-[9px]">3-Second Viral Hooks:</span>
                              {#each angle.viral_hooks as hook}
                                <div class="text-xs text-amber-300 bg-purple-950/40 p-2 border border-purple-900/60 font-mono">
                                  "{hook}"
                                </div>
                              {/each}
                            </div>
                          {/if}
                        </div>

                        <!-- 1-Click Action Buttons -->
                        <div class="pt-3 border-t border-purple-900/50 flex items-center gap-2">
                          {#if !angle.is_saved_to_ideas}
                            <button
                              onclick={() => handleSaveAngleToIdeas(angle.id)}
                              class="flex-1 py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold tracking-wider font-display transition-all flex items-center justify-center gap-1.5"
                            >
                              <Bookmark class="w-3.5 h-3.5" />
                              <span>Save to Ideas Bank</span>
                            </button>
                          {/if}

                          <button
                            onclick={() => {
                              const chosenCreator = selectedSynthesisCreator;
                              appState.openScriptStudioWithTopic({
                                topic: angle.topic_angle,
                                format: angle.recommended_format,
                                hooks: angle.viral_hooks,
                                talking_points: angle.talking_points,
                                creator_watchlist_id: selectedSynthesisCreatorId || undefined,
                                creator_name: chosenCreator?.creator_name,
                                creator_handle: chosenCreator?.handle,
                                creator_pacing: chosenCreator?.pacing_style,
                                creator_hooks: chosenCreator?.signature_hooks,
                                autoGenerate: true
                              });
                            }}
                            class="py-1.5 px-3 bg-black hover:bg-purple-950 text-slate-200 text-xs font-mono tracking-wider border border-purple-800 transition-all flex items-center gap-1.5"
                          >
                            <FileCode class="w-3.5 h-3.5 text-purple-400" />
                            <span>Draft Script</span>
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {:else}
                <div class="pt-3 border-t border-purple-900/40 flex flex-wrap items-center justify-between gap-2">
                  <span class="text-xs text-slate-500 font-mono truncate max-w-[240px]">
                    {#if selectedSynthesisCreator}
                      Voice: <span class="text-amber-400 font-bold">{selectedSynthesisCreator.creator_name}</span>
                    {:else}
                      No angles generated for this article yet.
                    {/if}
                  </span>
                  <button
                    onclick={() => handleSynthesizeAI(article.id)}
                    disabled={isSynthesizing}
                    class="text-xs font-mono tracking-wider text-amber-400 hover:text-amber-300 flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    <Sparkles class="w-3.5 h-3.5 {synthesizingArticleId === article.id ? 'animate-spin' : ''} shrink-0" />
                    <span>
                      {synthesizingArticleId === article.id
                        ? 'Synthesizing...'
                        : selectedSynthesisCreator
                        ? 'Synthesize in Voice'
                        : 'Synthesize Angles'}
                    </span>
                  </button>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- TAB 2: CREATOR WATCHLIST -->
  {#if activeTab === 'watchlist'}
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-white font-display">Creator Inspiration & Competitive Watchlist</h2>
          <p class="text-xs text-slate-400">Track admired peers to dissect storytelling mechanisms and viral angles.</p>
        </div>
        <button
          onclick={openAddWatchlistModal}
          class="flex items-center gap-2 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display tracking-wider"
        >
          <Plus class="w-4 h-4" />
          <span>Add Creator</span>
        </button>
      </div>

      {#if showAddWatchlist}
        <div class="p-6 swiss-card border border-purple-700 bg-[#120822] space-y-5 animate-in fade-in duration-200">
          <!-- Step Header & Step Indicator -->
          <div class="flex items-center justify-between border-b border-purple-900/60 pb-3">
            <div>
              <h3 class="font-bold text-base text-white font-display">
                {editingWatchlistId ? 'Edit Creator Profile' : 'Add Creator to Watchlist'}
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                {#if watchlistStep === 1}
                  Enter a channel URL or handle and choose a platform to auto-populate profile telemetry.
                {:else if watchlistStep === 2}
                  Review auto-populated creator profile information, niche, and pacing style.
                {:else}
                  Review signature hook formulas and customized emulation angles for your niche.
                {/if}
              </p>
            </div>

            <!-- Step Progress Indicator -->
            <div class="flex items-center gap-1.5">
              {#each [1, 2, 3] as s}
                <button
                  type="button"
                  onclick={() => {
                    if (editingWatchlistId || s === 1 || (s === 2 && (newCreatorName || scannerInput)) || (s === 3 && newCreatorName)) {
                      watchlistStep = s as 1 | 2 | 3;
                    }
                  }}
                  class="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded transition-all {watchlistStep === s ? 'bg-amber-400 text-black font-bold' : 'bg-purple-950/60 text-slate-400 hover:text-white'}"
                >
                  <span>{s}</span>
                  <span class="hidden sm:inline">
                    {s === 1 ? 'Link' : s === 2 ? 'Profile' : 'Hooks'}
                  </span>
                </button>
              {/each}
              <button
                onclick={() => (showAddWatchlist = false)}
                class="ml-2 text-xs font-mono text-slate-400 hover:text-white px-2 py-1"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- STEP 1: Link & Platform -->
          {#if watchlistStep === 1}
            <div class="space-y-5 py-2">
              <!-- Platform Selection Cards -->
              <div class="space-y-1.5">
                <label class="block text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                  1. Platform
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {#each ['YouTube', 'X', 'TikTok', 'LinkedIn', 'Instagram'] as plat}
                    <button
                      type="button"
                      onclick={() => (newCreatorPlatform = plat)}
                      class="py-2.5 px-3 text-xs font-mono font-medium border text-center transition-all {newCreatorPlatform === plat ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-sm' : 'bg-black/60 border-purple-900/80 text-slate-300 hover:border-purple-600'}"
                    >
                      {plat === 'X' ? 'X (Twitter)' : plat}
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Channel URL or Handle Input -->
              <div class="space-y-1.5">
                <label class="block text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                  2. Channel URL or Handle
                </label>
                <div class="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    bind:value={scannerInput}
                    placeholder={newCreatorPlatform === 'YouTube' ? 'e.g. youtube.com/channel/UC... or @fireship' : 'e.g. https://... or @handle'}
                    class="flex-1 px-3.5 py-2.5 bg-black border border-purple-900 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                    onkeydown={(e) => e.key === 'Enter' && handleScanCreator()}
                  />
                  <button
                    type="button"
                    onclick={handleScanCreator}
                    disabled={isScanningCreator}
                    class="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-mono tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    {#if isScanningCreator}
                      <RefreshCw class="w-4 h-4 animate-spin text-black" />
                      <span>Analyzing Profile...</span>
                    {:else}
                      <Search class="w-4 h-4 text-black" />
                      <span>Analyze Creator →</span>
                    {/if}
                  </button>
                </div>
                {#if scanError}
                  <p class="text-xs text-rose-400 font-mono mt-1">{scanError}</p>
                {/if}
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-purple-900/40 text-xs font-mono text-slate-500">
                <span>Auto-populates avatar, verified handle, recent uploads, and pacing style</span>
                <button
                  type="button"
                  onclick={() => (watchlistStep = 2)}
                  class="text-purple-300 hover:text-amber-400 hover:underline"
                >
                  Skip analysis and fill manually →
                </button>
              </div>
            </div>

          <!-- STEP 2: Review Profile & Telemetry -->
          {:else if watchlistStep === 2}
            <div class="space-y-4 py-2">
              <!-- Populated Creator Header Preview -->
              {#if newCreatorAvatar || newCreatorSubs || newCreatorName}
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-purple-950/40 border border-purple-800/60 rounded">
                  <div class="flex items-center gap-3.5">
                    {#if newCreatorAvatar}
                      <img
                        src={resolveAvatarUrl(newCreatorAvatar)}
                        alt={newCreatorName || 'Creator Avatar'}
                        referrerpolicy="no-referrer"
                        onerror={(e) => handleAvatarError(e, newCreatorName)}
                        class="w-12 h-12 rounded-full border border-purple-500 object-cover shrink-0"
                      />
                    {:else}
                      <div class="w-12 h-12 rounded-full bg-purple-900 border border-purple-700 flex items-center justify-center text-amber-300 font-bold font-display text-base shrink-0">
                        {(newCreatorName || 'C').charAt(0).toUpperCase()}
                      </div>
                    {/if}
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-white text-sm font-display">{newCreatorName || 'Creator'}</span>
                        {#if newCreatorSubs}
                          <span class="px-2 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-mono">
                            {newCreatorSubs}
                          </span>
                        {/if}
                        <span class="px-1.5 py-0.5 bg-purple-900/60 text-purple-200 text-[10px] font-mono">
                          {newCreatorPlatform}
                        </span>
                      </div>
                      <span class="text-xs text-purple-300 font-mono">{newCreatorHandle || '@handle'}</span>
                    </div>
                  </div>

                  {#if inspectedRecentTitles.length > 0}
                    <div class="text-left sm:text-right">
                      <span class="text-[11px] font-mono text-emerald-400">✓ {inspectedRecentTitles.length} Recent Uploads Scanned</span>
                      <span class="block text-[10px] font-mono text-slate-500 truncate max-w-[280px]">Latest: "{inspectedRecentTitles[0]}"</span>
                    </div>
                  {/if}
                </div>
              {/if}

              <!-- Editable Form Fields -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[11px] font-mono text-slate-400 mb-1">Creator Name</label>
                  <input
                    type="text"
                    bind:value={newCreatorName}
                    placeholder="e.g. Daniel Bourke"
                    class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-mono text-slate-400 mb-1">Handle</label>
                  <input
                    type="text"
                    bind:value={newCreatorHandle}
                    placeholder="e.g. @mrdbourke"
                    class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-mono text-slate-400 mb-1">Public Profile Link</label>
                  <input
                    type="url"
                    bind:value={newCreatorUrl}
                    placeholder="https://youtube.com/@handle"
                    class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-mono text-slate-400 mb-1">Followers / Subscribers</label>
                  <input
                    type="text"
                    bind:value={newCreatorSubs}
                    placeholder="e.g. 253K subscribers"
                    class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-mono text-slate-400 mb-1">Topic Niche</label>
                  <input
                    type="text"
                    bind:value={newCreatorTopicNiche}
                    placeholder="e.g. Machine Learning & Engineering"
                    class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-mono text-slate-400 mb-1">Pacing & Rhythm Style</label>
                  <input
                    type="text"
                    bind:value={newCreatorPacing}
                    placeholder="e.g. Fast sprints, whiteboard diagrams, high density"
                    class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <!-- Navigation Actions -->
              <div class="flex items-center justify-between pt-3 border-t border-purple-900/60">
                <button
                  type="button"
                  onclick={() => (watchlistStep = 1)}
                  class="px-4 py-2 bg-black border border-purple-900 hover:border-purple-700 text-xs text-slate-300 font-mono"
                >
                  ← Back to Link
                </button>
                <button
                  type="button"
                  onclick={() => (watchlistStep = 3)}
                  class="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-mono tracking-wider"
                >
                  Next: Signature Hooks & Angles →
                </button>
              </div>
            </div>

          <!-- STEP 3: Signature Hooks & Strategy -->
          {:else if watchlistStep === 3}
            <div class="space-y-4 py-2">
              <!-- Signature Hook Formulas -->
              <div class="space-y-2 p-3.5 bg-black/50 border border-purple-900/70">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                    Signature Hook Formulas
                  </label>
                  <span class="text-[11px] font-mono text-slate-500">Auto-extracted from top videos</span>
                </div>
                <div class="flex gap-2">
                  <input
                    type="text"
                    bind:value={newHookInput}
                    placeholder="Add hook formula (e.g. 'X is dead. Here is what actually replaced it.')"
                    class="flex-1 px-3 py-1.5 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                    onkeydown={(e) => e.key === 'Enter' && addHookFormula()}
                  />
                  <button
                    type="button"
                    onclick={addHookFormula}
                    class="px-3.5 py-1.5 bg-purple-900 text-amber-300 hover:bg-purple-800 text-xs font-mono font-bold"
                  >
                    + Add Hook
                  </button>
                </div>
                {#if newCreatorHooks.length > 0}
                  <div class="space-y-1.5 pt-1">
                    {#each newCreatorHooks as hook, idx}
                      <div class="flex items-center justify-between gap-2 p-2 bg-black border border-purple-900/80 text-xs font-mono text-slate-200">
                        <span class="truncate">"{hook}"</span>
                        <button
                          type="button"
                          onclick={() => removeHookFormula(idx)}
                          class="text-slate-500 hover:text-rose-400 text-xs px-1"
                          title="Remove hook"
                        >
                          ✕
                        </button>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>

              <!-- Notes & Angles -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-mono text-slate-400 mb-1">Observed Techniques & Storytelling Notes</label>
                  <textarea
                    bind:value={newCreatorNotes}
                    placeholder="Observed techniques: Pacing, video hooks, retention tricks, audio setup..."
                    rows={3}
                    class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  ></textarea>
                </div>

                <div>
                  <label class="block text-[11px] font-mono text-slate-400 mb-1">How to Emulate in Your Niche (Original Angles)</label>
                  <textarea
                    bind:value={newCreatorAngles}
                    placeholder="How to adapt their rhythm or style without copying content topics..."
                    rows={3}
                    class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  ></textarea>
                </div>
              </div>

              <!-- Final Save Actions -->
              <div class="flex items-center justify-between pt-3 border-t border-purple-900/60">
                <button
                  type="button"
                  onclick={() => (watchlistStep = 2)}
                  class="px-4 py-2 bg-black border border-purple-900 hover:border-purple-700 text-xs text-slate-300 font-mono"
                >
                  ← Back to Profile
                </button>
                <div class="flex items-center gap-2.5">
                  <button
                    type="button"
                    onclick={() => (showAddWatchlist = false)}
                    class="px-3.5 py-2 text-xs text-slate-400 hover:text-white font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onclick={handleSaveWatchlist}
                    class="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-mono tracking-wider shadow-sm"
                  >
                    {editingWatchlistId ? 'Save Changes' : 'Save Creator to Watchlist'}
                  </button>
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/if}

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each watchlist as creator}
          {@const resolvedLink = creator.profile_url || deriveProfileUrl(creator.handle, creator.platform, '')}
          <div class="swiss-card p-5 border border-purple-900/50 bg-[#10071c] space-y-4 flex flex-col justify-between hover:border-purple-700/70 transition-all">
            <div class="space-y-3">
              <!-- Creator Header -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  {#if creator.avatar_url}
                    <img
                      src={resolveAvatarUrl(creator.avatar_url)}
                      alt={creator.creator_name}
                      referrerpolicy="no-referrer"
                      onerror={(e) => handleAvatarError(e, creator.creator_name)}
                      class="w-10 h-10 rounded-full border border-purple-600 object-cover shrink-0"
                    />
                  {:else}
                    <div class="w-10 h-10 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center text-amber-400 font-bold font-display text-sm shrink-0">
                      {creator.creator_name.charAt(0).toUpperCase()}
                    </div>
                  {/if}
                  <div>
                    <h4 class="font-bold text-white text-sm font-display leading-tight">{creator.creator_name}</h4>
                    <span class="text-xs text-purple-300 font-mono">{creator.handle}</span>
                  </div>
                </div>

                <div class="flex items-center gap-1 shrink-0">
                  <button
                    onclick={() => openEditWatchlistModal(creator)}
                    class="text-slate-400 hover:text-white transition-colors p-1"
                    title="Edit creator"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    onclick={() => handleDeleteWatchlist(creator.id)}
                    class="text-slate-600 hover:text-rose-400 transition-colors p-1"
                    title="Remove from watchlist"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Badges -->
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="swiss-tag text-[9px] px-2 py-0.5 bg-purple-950 text-amber-400 border border-purple-800">
                  {creator.platform}
                </span>
                {#if creator.subscriber_count_text}
                  <span class="swiss-tag text-[9px] px-2 py-0.5 bg-black text-slate-300 border border-purple-900">
                    {creator.subscriber_count_text}
                  </span>
                {/if}
                {#if creator.topic_niche}
                  <span class="swiss-tag text-[9px] px-2 py-0.5 bg-purple-950/60 text-purple-300 border border-purple-900">
                    {creator.topic_niche}
                  </span>
                {/if}
              </div>

              <!-- Pacing Style -->
              {#if creator.pacing_style}
                <div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-400/10 border border-amber-400/20 text-xs font-mono text-amber-300">
                  <Zap class="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span class="truncate">{creator.pacing_style}</span>
                </div>
              {/if}

              <!-- Personal Notes -->
              {#if creator.personal_notes}
                <div class="p-3 bg-black/60 border border-purple-950 text-xs text-slate-300 leading-relaxed font-mono">
                  {creator.personal_notes}
                </div>
              {/if}

              <!-- Signature Hooks Bank -->
              {#if creator.signature_hooks && creator.signature_hooks.length > 0}
                <div class="space-y-1.5 pt-1">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] uppercase font-mono tracking-wider text-purple-300 font-semibold">Signature Hooks</span>
                    <span class="text-[10px] font-mono text-slate-500">{creator.signature_hooks.length} formulas</span>
                  </div>
                  <div class="space-y-1">
                    {#each creator.signature_hooks as hook, hIdx}
                      {@const hookKey = `${creator.id}-${hIdx}`}
                      <div class="flex items-center justify-between gap-2 p-2 bg-black/80 border border-purple-900/60 text-xs font-mono text-amber-200/90 group">
                        <span class="truncate text-[11px]">"{hook}"</span>
                        <button
                          onclick={() => copyHookToClipboard(hook, hookKey)}
                          class="shrink-0 p-1 text-slate-400 hover:text-amber-300 transition-colors"
                          title="Copy hook formula"
                        >
                          {#if copiedHookId === hookKey}
                            <Check class="w-3.5 h-3.5 text-emerald-400" />
                          {:else}
                            <Copy class="w-3.5 h-3.5" />
                          {/if}
                        </button>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Original Angle Emulation Tip -->
              {#if creator.original_angles}
                <div class="p-2.5 bg-purple-950/40 border border-purple-800/40 text-[11px] text-slate-300 font-mono leading-relaxed">
                  <span class="text-amber-400 font-bold block mb-0.5">Emulation Angle:</span>
                  {creator.original_angles}
                </div>
              {/if}
            </div>

            <!-- Card Actions -->
            <div class="pt-3 border-t border-purple-900/40 flex items-center justify-between gap-3">
              <button
                onclick={() => handleDraftInCreatorStyle(creator)}
                class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display tracking-wider transition-all"
                title="Draft a script in this creator's pacing and hook style"
              >
                <FileCode class="w-3.5 h-3.5 text-black" />
                <span>Draft in this Style</span>
              </button>

              {#if resolvedLink}
                <a
                  href={resolvedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-1.5 px-3 py-2 bg-black hover:bg-purple-950 text-slate-300 border border-purple-900/60 text-xs font-mono transition-colors shrink-0"
                >
                  <span>Visit Profile</span>
                  <ExternalLink class="w-3 h-3 text-amber-400" />
                </a>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
