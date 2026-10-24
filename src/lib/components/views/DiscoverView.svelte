<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import type { NewsArticle, NewsAIIdea, CreatorWatchlist } from '../../types';
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
    Users
  } from 'lucide-svelte';
  import { reveal } from '../../utils/reveal';

  type DiscoverTab = 'news' | 'watchlist';
  let activeTab = $state<DiscoverTab>('news');

  let newsArticles = $state<NewsArticle[]>([]);
  let aiIdeas = $state<NewsAIIdea[]>([]);
  let watchlist = $state<CreatorWatchlist[]>([]);
  let isLoadingNews = $state(false);
  let isSynthesizing = $state(false);

  let showAddWatchlist = $state(false);
  let newCreatorName = $state('');
  let newCreatorHandle = $state('');
  let newCreatorPlatform = $state('YouTube');
  let newCreatorNotes = $state('');

  onMount(async () => {
    await loadDailyNews();
    await loadWatchlist();
  });

  async function loadDailyNews(forceRefresh = false) {
    try {
      isLoadingNews = true;
      newsArticles = await api.getDailyNews(forceRefresh);
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to fetch news', 'error');
    } finally {
      isLoadingNews = false;
    }
  }

  async function handleSynthesizeAI() {
    try {
      isSynthesizing = true;
      appState.showToast('Gemini is synthesizing viral angles from headlines...', 'info');
      aiIdeas = await api.synthesizeNewsToIdeas();
      newsArticles = await api.getDailyNews();
      appState.showToast('Synthesized fresh content angles & hooks from breaking news!', 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'AI generation failed', 'error');
    } finally {
      isSynthesizing = false;
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

  async function handleAddWatchlist() {
    if (!newCreatorName || !newCreatorHandle) return;
    try {
      const entry = await api.addWatchlist({
        creator_name: newCreatorName,
        handle: newCreatorHandle,
        platform: newCreatorPlatform,
        topic_niche: appState.preferences.sub_niche,
        personal_notes: newCreatorNotes
      });
      watchlist = [...watchlist, entry];
      newCreatorName = '';
      newCreatorHandle = '';
      newCreatorNotes = '';
      showAddWatchlist = false;
      appState.showToast('Added creator to watchlist', 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to add creator', 'error');
    }
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
        NICHE: {appState.preferences.primary_niche} • {appState.preferences.sub_niche}
      </span>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-display">
          Discover & Trend Intelligence
        </h1>
        <p class="text-xs text-slate-300 mt-1">
          Daily RSS search querying news matching your niche, synthesized into high-retention content angles by Gemini.
        </p>
      </div>

      <div class="flex items-center gap-2.5 shrink-0">
        <button
          onclick={() => loadDailyNews(true)}
          disabled={isLoadingNews}
          class="flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-purple-950 text-slate-300 border border-purple-900/60 text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-50"
        >
          <RefreshCw class="w-3.5 h-3.5 text-amber-400 {isLoadingNews ? 'animate-spin' : ''}" />
          <span>Refresh News</span>
        </button>

        <button
          onclick={handleSynthesizeAI}
          disabled={isSynthesizing}
          class="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-extrabold uppercase tracking-wider transition-all font-display shadow-md disabled:opacity-50"
        >
          <Sparkles class="w-4 h-4" />
          <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize AI Ideas'}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Sub-Tabs Navigation -->
  <div class="flex border-b border-purple-900/40 gap-6">
    <button
      onclick={() => (activeTab = 'news')}
      class="pb-3 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-2 relative {activeTab === 'news'
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
      class="pb-3 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-2 relative {activeTab === 'watchlist'
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
    <div class="space-y-6">
      {#if isLoadingNews}
        <div class="text-center py-16 text-slate-500 text-xs font-mono animate-pulse">
          Ingesting latest daily news and headlines for {appState.preferences.sub_niche}...
        </div>
      {:else if newsArticles.length === 0}
        <div class="text-center py-16 text-slate-500 text-xs font-mono">
          No news articles cached yet. Click Refresh News above to fetch the latest stories.
        </div>
      {:else}
        <div class="grid grid-cols-1 gap-5">
          {#each newsArticles as article, idx}
            <div use:reveal={{ delay: Math.min(idx * 75, 400) }} class="swiss-card swiss-card-hover p-6 border border-purple-900/50 bg-[#10071c] hover:border-amber-400/40 transition-all space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {#if article.image_url}
                  <img
                    src={article.image_url}
                    alt={article.headline}
                    class="w-full sm:w-32 h-20 object-cover border border-purple-900/60 shrink-0 bg-black/60"
                    loading="lazy"
                    onerror={(e) => ((e.currentTarget as HTMLElement).style.display = 'none')}
                  />
                {/if}
                <div class="space-y-1 flex-1">
                  <div class="flex items-center gap-2 text-xs font-mono">
                    <span class="px-2 py-0.5 bg-purple-950 text-amber-400 border border-purple-800 font-bold text-[10px] uppercase">
                      {article.source_name || 'News Wire'}
                    </span>
                    <span class="text-slate-500">•</span>
                    <span class="text-slate-400 text-[11px]">{article.published_date}</span>
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

              <!-- Gemini Synthesized Content Angles Section -->
              {#if article.ai_ideas && article.ai_ideas.length > 0}
                <div class="mt-4 pt-4 border-t border-purple-900/40 space-y-3">
                  <div class="flex items-center gap-2">
                    <Sparkles class="w-3.5 h-3.5 text-amber-400" />
                    <span class="swiss-tag text-amber-400">
                      GEMINI AI CONTENT ANGLES & VIRAL HOOKS:
                    </span>
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
                              class="flex-1 py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold uppercase tracking-wider font-display transition-all flex items-center justify-center gap-1.5"
                            >
                              <Bookmark class="w-3.5 h-3.5" />
                              <span>Save to Ideas Bank</span>
                            </button>
                          {/if}

                          <button
                            onclick={() => {
                              appState.openScriptStudioWithTopic({
                                topic: angle.topic_angle,
                                format: angle.recommended_format,
                                hooks: angle.viral_hooks,
                                talking_points: angle.talking_points,
                                autoGenerate: true
                              });
                            }}
                            class="py-1.5 px-3 bg-black hover:bg-purple-950 text-slate-200 text-xs font-mono uppercase tracking-wider border border-purple-800 transition-all flex items-center gap-1.5"
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
                <div class="pt-3 border-t border-purple-900/40 flex items-center justify-between">
                  <span class="text-xs text-slate-500 font-mono">No angles generated for this article yet.</span>
                  <button
                    onclick={handleSynthesizeAI}
                    class="text-xs font-mono uppercase tracking-wider text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <span>Synthesize with Gemini</span> <Sparkles class="w-3 h-3" />
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
          <h2 class="text-lg font-bold text-white font-display uppercase">Creator Inspiration & Competitive Watchlist</h2>
          <p class="text-xs text-slate-400">Track admired peers to dissect storytelling mechanisms and viral angles.</p>
        </div>
        <button
          onclick={() => (showAddWatchlist = true)}
          class="flex items-center gap-2 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display uppercase tracking-wider"
        >
          <Plus class="w-4 h-4" />
          <span>Add Creator</span>
        </button>
      </div>

      {#if showAddWatchlist}
        <div class="p-6 swiss-card border border-purple-800 bg-[#10071c] space-y-4">
          <h3 class="font-bold text-sm text-white uppercase font-display">Add Creator to Watchlist</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              bind:value={newCreatorName}
              placeholder="Creator Name"
              class="px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
            />
            <input
              type="text"
              bind:value={newCreatorHandle}
              placeholder="Handle (e.g. @fireship)"
              class="px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
            />
            <select
              bind:value={newCreatorPlatform}
              class="px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
            >
              <option value="YouTube">YouTube</option>
              <option value="TikTok">TikTok</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Instagram">Instagram</option>
              <option value="X">X (Twitter)</option>
            </select>
          </div>
          <textarea
            bind:value={newCreatorNotes}
            placeholder="Observed techniques: Pacing, video hooks, audio setups, etc."
            rows={2}
            class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
          ></textarea>
          <div class="flex justify-end gap-2">
            <button
              onclick={() => (showAddWatchlist = false)}
              class="px-3 py-1.5 text-xs text-slate-400 hover:text-white font-mono"
            >
              Cancel
            </button>
            <button
              onclick={handleAddWatchlist}
              class="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display uppercase tracking-wider"
            >
              Save Creator
            </button>
          </div>
        </div>
      {/if}

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each watchlist as creator}
          <div class="swiss-card p-5 border border-purple-900/50 bg-[#10071c] space-y-3 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="swiss-tag text-[9px] px-2 py-0.5 bg-purple-950 text-amber-400 border border-purple-800">
                  {creator.platform}
                </span>
                <button
                  onclick={() => handleDeleteWatchlist(creator.id)}
                  class="text-slate-600 hover:text-rose-400 transition-colors p-1"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h4 class="font-bold text-white text-base font-display">{creator.creator_name}</h4>
                <span class="text-xs text-purple-300 font-mono">{creator.handle}</span>
              </div>

              {#if creator.personal_notes}
                <div class="p-3 bg-black/60 border border-purple-950 text-xs text-slate-300 leading-relaxed font-mono">
                  {creator.personal_notes}
                </div>
              {/if}
            </div>

            {#if creator.profile_url}
              <a
                href={creator.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                class="pt-3 border-t border-purple-900/40 flex items-center justify-between text-xs font-mono uppercase text-amber-400 hover:text-amber-300"
              >
                <span>Visit Profile</span>
                <ExternalLink class="w-3.5 h-3.5" />
              </a>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
