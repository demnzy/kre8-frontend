<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import LoadError from '../layout/LoadError.svelte';
  import type { ContentIdea, NewsArticle, CreatorWatchlist } from '../../types';
  import {
    Lightbulb,
    Plus,
    Star,
    Video,
    FileCode,
    Sparkles,
    Trash2,
    Search,
    Pencil,
    X,
    Zap,
    ExternalLink,
    Check,
    Bookmark
  } from 'lucide-svelte';
  import { reveal } from '../../utils/reveal';
  import { getProviderInfo } from '../../utils/aiProviders';

  let ideas = $state<ContentIdea[]>([]);
  let searchQuery = $state('');
  let filterPlatform = $state('All');
  let onlyFavorites = $state(false);
  let isLoading = $state(false);

  let showModal = $state(false);
  let editingIdea = $state<ContentIdea | null>(null);
  let formTitle = $state('');
  let formDescription = $state('');
  let formNotes = $state('');
  let formPlatform = $state('YouTube');
  let formPriority = $state<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  let formTags = $state('ai, tutorial');
  let loadError = $state<string | null>(null);

  // AI Brainstorm Hub State
  let showBrainstormModal = $state(false);
  let brainstormMode = $state<'news' | 'watchlist' | 'hybrid' | 'topic'>('news');
  let newsArticles = $state<NewsArticle[]>([]);
  let watchlist = $state<CreatorWatchlist[]>([]);
  let selectedArticleId = $state<number | null>(null);
  let selectedWatchlistId = $state<number | null>(null);
  let customTopicPrompt = $state('');
  let isSynthesizing = $state(false);
  let synthesizedIdeas = $state<ContentIdea[]>([]);

  let activeProvider = $derived(getProviderInfo(appState.preferences.ai_provider));

  onMount(loadIdeas);

  async function loadIdeas() {
    isLoading = true;
    loadError = null;
    try {
      ideas = await api.getIdeas();
      appState.counts.ideas = ideas.length;
    } catch (e: any) {
      loadError = e?.message || "Couldn't load your ideas.";
    } finally {
      isLoading = false;
    }
  }

  function openCreateModal() {
    editingIdea = null;
    formTitle = '';
    formDescription = '';
    formNotes = '';
    formPlatform = 'YouTube';
    formPriority = 'Medium';
    formTags = 'ai, tutorial';
    showModal = true;
  }

  function openEditModal(idea: ContentIdea) {
    editingIdea = idea;
    formTitle = idea.title;
    formDescription = idea.description || '';
    formNotes = idea.notes || '';
    formPlatform = idea.intended_platform || 'YouTube';
    formPriority = idea.priority || 'Medium';
    formTags = (idea.tags || []).join(', ');
    showModal = true;
  }

  let filteredIdeas = $derived(
    ideas.filter(idea => {
      const matchPlat = filterPlatform === 'All' || idea.intended_platform === filterPlatform;
      const matchFav = !onlyFavorites || idea.is_favorite;
      const matchQuery =
        !searchQuery.trim() ||
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (idea.description && idea.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchPlat && matchFav && matchQuery;
    })
  );

  async function toggleFavorite(idea: ContentIdea) {
    try {
      const updated = await api.updateIdea(idea.id, { is_favorite: !idea.is_favorite });
      ideas = ideas.map(i => (i.id === idea.id ? updated : i));
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to update', 'error');
    }
  }

  async function handleConvertToContent(id: number) {
    try {
      const content = await api.convertIdeaToContent(id);
      ideas = ideas.map(i => (i.id === id ? { ...i, status: 'Converted' } : i));
      appState.showToast(`Converted into Content Item: "${content.title}"`, 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Conversion failed', 'error');
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteIdea(id);
      ideas = ideas.filter(i => i.id !== id);
      appState.counts.ideas = ideas.length;
      appState.showToast('Idea removed', 'info');
    } catch (e: any) {
      appState.showToast(e.message || 'Delete failed', 'error');
    }
  }

  async function handleSaveIdea(e: Event) {
    e.preventDefault();
    if (!formTitle.trim()) return;
    const tagsArray = formTags.split(',').map(t => t.trim()).filter(Boolean);
    try {
      if (editingIdea) {
        const updated = await api.updateIdea(editingIdea.id, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          notes: formNotes.trim() || undefined,
          intended_platform: formPlatform,
          priority: formPriority,
          tags: tagsArray
        });
        ideas = ideas.map(i => (i.id === updated.id ? updated : i));
        appState.showToast(`Updated idea: "${updated.title}"`, 'success');
      } else {
        const created = await api.createIdea({
          title: formTitle.trim(),
          description: formDescription.trim(),
          notes: formNotes.trim() || undefined,
          intended_platform: formPlatform,
          priority: formPriority,
          category: appState.preferences.primary_niche,
          tags: tagsArray,
          status: 'Active'
        });
        ideas = [created, ...ideas];
        appState.counts.ideas = ideas.length;
        appState.showToast(`Saved idea: "${created.title}"`, 'success');
      }
      showModal = false;
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to save', 'error');
    }
  }

  async function openBrainstormModal(initialMode: 'news' | 'watchlist' | 'hybrid' | 'topic' = 'news', creatorId?: number) {
    if (!appState.requireApiKey()) return;
    brainstormMode = initialMode;
    synthesizedIdeas = [];
    if (creatorId) selectedWatchlistId = creatorId;

    showBrainstormModal = true;

    // Load news if empty
    if (newsArticles.length === 0) {
      try {
        newsArticles = await api.getDailyNews();
        if (newsArticles.length > 0 && !selectedArticleId) {
          selectedArticleId = newsArticles[0].id;
        }
      } catch (err) {
        console.warn('Could not load news for brainstorm:', err);
      }
    }

    // Load watchlist if empty
    if (watchlist.length === 0) {
      try {
        watchlist = await api.getWatchlist();
        if (watchlist.length > 0 && !selectedWatchlistId) {
          selectedWatchlistId = watchlist[0].id;
        }
      } catch (err) {
        console.warn('Could not load watchlist for brainstorm:', err);
      }
    }
  }

  async function handleRunBrainstorm() {
    if (!appState.requireApiKey()) return;
    isSynthesizing = true;
    try {
      appState.showToast(`Synthesizing tailored angles with ${activeProvider.name}...`, 'info');
      const generated = await api.synthesizeIdeas({
        source_type: brainstormMode,
        news_article_id: (brainstormMode === 'news' || brainstormMode === 'hybrid') ? (selectedArticleId || undefined) : undefined,
        creator_watchlist_id: (brainstormMode === 'watchlist' || brainstormMode === 'hybrid') ? (selectedWatchlistId || undefined) : undefined,
        topic_prompt: customTopicPrompt.trim() || undefined,
        count: 3
      });

      synthesizedIdeas = generated;
      ideas = [...generated, ...ideas];
      appState.counts.ideas = ideas.length;
      appState.showToast(`Synthesized and saved ${generated.length} ideas to your bank!`, 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Brainstorming failed', 'error');
    } finally {
      isSynthesizing = false;
    }
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  {#if loadError}
    <LoadError message={loadError} onRetry={loadIdeas} />
  {/if}
  <!-- Swiss Header -->
  <div class="swiss-card p-6 border border-purple-900/60 bg-[#10071c] space-y-4">
    <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
      <div class="flex items-center gap-2">
        <Lightbulb class="w-4 h-4 text-amber-400" />
        <span class="swiss-tag text-amber-400">
          Creative Ideas
        </span>
      </div>
      <span class="swiss-tag text-purple-400 font-mono">
        Idea Vault
      </span>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
          Ideas Bank
        </h1>
        <p class="text-xs text-slate-300 mt-1">
          Store, organize, and promote creative angles into active Kanban production records.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <button
          onclick={() => appState.setModule('discover')}
          class="flex items-center gap-2 px-3.5 py-2 bg-purple-950/60 hover:bg-purple-900/50 text-slate-300 hover:text-amber-300 border border-purple-700/60 text-xs font-mono transition-all"
          title="Browse daily news articles in Discover"
        >
          <ExternalLink class="w-3.5 h-3.5 text-purple-400" />
          <span>Suggest from News</span>
        </button>

        <button
          onclick={() => openBrainstormModal('news')}
          class="flex items-center gap-2 px-3.5 py-2 bg-purple-900/50 hover:bg-purple-800/60 text-amber-300 border border-purple-700 text-xs font-mono font-bold transition-all"
          title="Synthesize ideas from breaking news or watched creator voices"
        >
          <Sparkles class="w-3.5 h-3.5 text-amber-400" />
          <span>AI Brainstorm Hub</span>
        </button>

        <button
          onclick={openCreateModal}
          class="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display tracking-wider transition-all"
        >
          <Plus class="w-4 h-4" />
          <span>Add Idea</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0d0617] p-3 border border-purple-900/40">
    <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
      {#each ['All', 'YouTube', 'TikTok', 'LinkedIn', 'Instagram', 'X'] as plat}
        <button
          onclick={() => (filterPlatform = plat)}
          class="px-3 py-1.5 text-xs font-mono tracking-wider transition-all shrink-0 {filterPlatform === plat
            ? 'bg-amber-400 text-black font-bold'
            : 'text-slate-400 hover:text-white bg-purple-950/30 border border-purple-900/50'}"
        >
          {plat}
        </button>
      {/each}

      <button
        onclick={() => (onlyFavorites = !onlyFavorites)}
        class="px-3 py-1.5 text-xs font-mono tracking-wider transition-all shrink-0 flex items-center gap-1.5 {onlyFavorites
          ? 'bg-amber-400 text-black font-bold'
          : 'text-slate-400 hover:text-white bg-purple-950/30 border border-purple-900/50'}"
      >
        <Star class="w-3.5 h-3.5 fill-current" />
        <span>Favorites</span>
      </button>
    </div>

    <div class="relative w-full sm:w-64">
      <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search ideas..."
        class="w-full pl-9 pr-3.5 py-1.5 bg-black border border-purple-900/60 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
      />
    </div>
  </div>

  <!-- Ideas Grid -->
  {#if filteredIdeas.length === 0}
    <div class="text-center py-16 swiss-card border border-purple-900/40 text-slate-500 text-xs font-mono">
      No ideas saved yet. Click Add Idea to save your first concept.
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each filteredIdeas as idea, idx}
        <div use:reveal={{ delay: Math.min(idx * 50, 300) }} class="swiss-card swiss-card-hover p-5 border border-purple-900/50 bg-[#10071c] hover:border-amber-400/40 transition-all flex flex-col justify-between space-y-4 group">
          <div class="space-y-3">
            <div class="flex items-center justify-between text-xs font-mono">
              <span class="swiss-tag px-2 py-0.5 bg-purple-950 text-amber-400 border border-purple-800">
                {idea.intended_platform} • {idea.category}
              </span>

              <button
                onclick={() => toggleFavorite(idea)}
                class="p-1 hover:text-amber-400 transition-colors"
                title="Favorite"
              >
                <Star class="w-4 h-4 {idea.is_favorite ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}" />
              </button>
            </div>

            <div>
              <h3 class="font-bold text-white text-base leading-snug group-hover:text-amber-300 transition-colors font-display">
                {idea.title}
              </h3>
              {#if idea.description}
                <p class="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed font-mono">
                  {idea.description}
                </p>
              {/if}
            </div>

            {#if idea.tags && idea.tags.length > 0}
              <div class="flex flex-wrap gap-1.5 pt-1">
                {#each idea.tags as tag}
                  <span class="text-[10px] font-mono px-2 py-0.5 bg-black text-purple-300 border border-purple-900">
                    #{tag}
                  </span>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Bottom Actions -->
          <div class="pt-3 border-t border-purple-900/40 flex items-center justify-between gap-2">
            {#if idea.status !== 'Converted'}
              <button
                onclick={() => handleConvertToContent(idea.id)}
                class="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950 hover:bg-purple-900 text-amber-300 border border-purple-800 text-xs font-mono transition-all"
                title="Convert to Content record in Kanban"
              >
                <Video class="w-3.5 h-3.5" />
                <span>To Content</span>
              </button>
            {:else}
              <span class="text-[10px] font-mono font-bold text-emerald-400">In Production</span>
            {/if}

            <button
              onclick={() => {
                const combinedNotes = [idea.description, idea.notes].filter(Boolean).join('\n\n');
                appState.openScriptStudioWithTopic({
                  topic: idea.title,
                  format: 'Short Video',
                  custom_instructions: combinedNotes || undefined,
                  autoGenerate: true
                });
              }}
              class="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-purple-950 text-slate-300 border border-purple-800 text-xs font-mono transition-all"
            >
              <FileCode class="w-3.5 h-3.5 text-purple-400" />
              <span>Draft Script</span>
            </button>

            <div class="flex items-center gap-1 ml-auto">
              <button
                onclick={() => openEditModal(idea)}
                class="p-1 text-slate-400 hover:text-white transition-colors"
                title="Edit idea"
              >
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button
                onclick={() => handleDelete(idea.id)}
                class="p-1 text-slate-600 hover:text-rose-400 transition-colors"
                title="Delete idea"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Add / Edit Idea Modal -->
  {#if showModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div class="relative w-full max-w-lg swiss-card border border-purple-800 bg-[#10071c] p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <h3 class="text-base font-bold text-white font-display">
            {editingIdea ? 'Edit Idea' : 'Save Idea to Bank'}
          </h3>
          <button
            type="button"
            onclick={() => (showModal = false)}
            class="text-slate-400 hover:text-white p-1"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <form onsubmit={handleSaveIdea} class="space-y-3.5">
          <div>
            <label for="new-idea-title-modal" class="block swiss-tag text-slate-400 mb-1">Title</label>
            <input
              id="new-idea-title-modal"
              type="text"
              bind:value={formTitle}
              placeholder="e.g. 3 Coding habits that 10x your output"
              required
              class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:border-amber-400"
            />
          </div>

          <div>
            <label for="new-idea-desc-modal" class="block swiss-tag text-slate-400 mb-1">Angle / Description</label>
            <textarea
              id="new-idea-desc-modal"
              bind:value={formDescription}
              rows={2}
              placeholder="Why this angle will resonate..."
              class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:border-amber-400"
            ></textarea>
          </div>

          <div>
            <label for="new-idea-notes-modal" class="block swiss-tag text-slate-400 mb-1">Hooks & Talking Points (passed to Script Studio)</label>
            <textarea
              id="new-idea-notes-modal"
              bind:value={formNotes}
              rows={3}
              placeholder="Opening hooks, stats, or bullet points to include when generating the script..."
              class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:border-amber-400"
            ></textarea>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label for="new-idea-plat-modal" class="block swiss-tag text-slate-400 mb-1">Platform</label>
              <select
                id="new-idea-plat-modal"
                bind:value={formPlatform}
                class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono"
              >
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Instagram">Instagram</option>
                <option value="X">X</option>
              </select>
            </div>

            <div>
              <label for="new-idea-prio-modal" class="block swiss-tag text-slate-400 mb-1">Priority</label>
              <select
                id="new-idea-prio-modal"
                bind:value={formPriority}
                class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label for="new-idea-tags-modal" class="block swiss-tag text-slate-400 mb-1">Tags</label>
              <input
                id="new-idea-tags-modal"
                type="text"
                bind:value={formTags}
                placeholder="tech, tips, ai"
                class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-purple-900/40">
            <button
              type="button"
              onclick={() => (showModal = false)}
              class="px-4 py-2 text-xs text-slate-400 hover:text-white font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display"
            >
              {editingIdea ? 'Save Changes' : 'Save Idea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- AI Brainstorm & Cross-Pillar Synthesis Hub Modal -->
  {#if showBrainstormModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div class="relative w-full max-w-2xl swiss-card border border-amber-500/50 bg-[#10071c] p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-purple-900/60 pb-3">
          <div class="flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-amber-400" />
            <h3 class="text-base font-bold text-white font-display">AI Brainstorm & Synthesis Hub</h3>
            <span class="swiss-tag text-[9px] text-amber-400 font-mono">{activeProvider.name}</span>
          </div>
          <button
            onclick={() => (showBrainstormModal = false)}
            class="text-xs font-mono text-slate-400 hover:text-white px-2 py-1"
          >
            ✕
          </button>
        </div>

        <!-- Mode Tabs -->
        <div class="flex items-center gap-2 border-b border-purple-900/40 pb-2 overflow-x-auto">
          {#each [
            { id: 'news', label: 'From Trending News', icon: ExternalLink },
            { id: 'watchlist', label: 'From Creator Voice', icon: Zap },
            { id: 'hybrid', label: 'Hybrid (News + Creator)', icon: Sparkles },
            { id: 'topic', label: 'Custom Topic / Niche', icon: Lightbulb }
          ] as tab}
            {@const Icon = tab.icon}
            <button
              type="button"
              onclick={() => (brainstormMode = tab.id as any)}
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono tracking-wider transition-all border {brainstormMode === tab.id
                ? 'bg-amber-400 text-black font-bold border-amber-400'
                : 'bg-black/60 text-slate-300 border-purple-900/60 hover:border-purple-600'}"
            >
              <Icon class="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          {/each}
        </div>

        <div class="space-y-4">
          <!-- 1. News Picker (if news or hybrid) -->
          {#if brainstormMode === 'news' || brainstormMode === 'hybrid'}
            <div class="space-y-2">
              <label class="block swiss-tag text-slate-300">Select Breaking News Headline</label>
              {#if newsArticles.length === 0}
                <div class="p-4 bg-black/60 border border-purple-900 text-xs font-mono text-slate-400 text-center">
                  Loading trending news stories...
                </div>
              {:else}
                <select
                  value={selectedArticleId ?? ''}
                  onchange={(e) => (selectedArticleId = Number(e.currentTarget.value) || null)}
                  class="w-full p-2.5 bg-black border border-purple-900 text-white text-xs font-mono focus:border-amber-400"
                >
                  {#each newsArticles as article}
                    <option value={article.id}>
                      [{article.source_name || 'News'}] {article.headline}
                    </option>
                  {/each}
                </select>
                {#if selectedArticleId}
                  {@const chosenArt = newsArticles.find(a => a.id === selectedArticleId)}
                  {#if chosenArt}
                    <p class="text-xs text-slate-400 p-2.5 bg-black/40 border border-purple-950 font-mono leading-relaxed line-clamp-2">
                      {chosenArt.summary}
                    </p>
                  {/if}
                {/if}
              {/if}
            </div>
          {/if}

          <!-- 2. Watchlist Creator Picker (if watchlist or hybrid) -->
          {#if brainstormMode === 'watchlist' || brainstormMode === 'hybrid'}
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="block swiss-tag text-slate-300">Select Creator Watchlist Persona</label>
                <button
                  type="button"
                  onclick={() => appState.setModule('discover')}
                  class="text-[10px] font-mono text-amber-400 hover:text-amber-300"
                >
                  + Add Creators in Discover
                </button>
              </div>

              {#if watchlist.length === 0}
                <div class="p-4 bg-black/60 border border-purple-900 text-xs font-mono text-slate-400 text-center space-y-1">
                  <p>Your Watchlist is empty.</p>
                  <p class="text-[11px] text-amber-400">Add admired creators in Discover to brainstorm in their voice and rhythm.</p>
                </div>
              {:else}
                <select
                  value={selectedWatchlistId ?? ''}
                  onchange={(e) => (selectedWatchlistId = Number(e.currentTarget.value) || null)}
                  class="w-full p-2.5 bg-black border border-purple-900 text-white text-xs font-mono focus:border-amber-400"
                >
                  {#each watchlist as creator}
                    <option value={creator.id}>
                      {creator.creator_name} ({creator.handle}) — {creator.pacing_style || creator.platform}
                    </option>
                  {/each}
                </select>

                {#if selectedWatchlistId}
                  {@const chosenCreator = watchlist.find(w => w.id === selectedWatchlistId)}
                  {#if chosenCreator}
                    <div class="p-3 bg-amber-400/10 border border-amber-400/20 text-xs font-mono text-amber-300 space-y-1">
                      <div class="flex items-center justify-between">
                        <span class="font-bold">{chosenCreator.creator_name} ({chosenCreator.handle})</span>
                        <span class="text-[10px] text-purple-300">{chosenCreator.subscriber_count_text || chosenCreator.platform}</span>
                      </div>
                      {#if chosenCreator.pacing_style}
                        <p class="text-[11px] text-slate-300">Pacing: {chosenCreator.pacing_style}</p>
                      {/if}
                      {#if chosenCreator.signature_hooks && chosenCreator.signature_hooks.length > 0}
                        <div class="text-[10px] text-amber-200/80 pt-1">
                          Hook Example: "{chosenCreator.signature_hooks[0]}"
                        </div>
                      {/if}
                    </div>
                  {/if}
                {/if}
              {/if}
            </div>
          {/if}

          <!-- 3. Optional Custom Theme/Prompt -->
          <div class="space-y-1.5">
            <label class="block swiss-tag text-slate-300">
              {brainstormMode === 'topic' ? 'Topic / Focus Theme (Required)' : 'Specific Angle / Custom Directive (Optional)'}
            </label>
            <input
              type="text"
              bind:value={customTopicPrompt}
              placeholder={brainstormMode === 'topic' ? 'e.g. 5 AI workflows saving 10 hours a week' : 'e.g. Focus on practical pitfalls or contrarian takes...'}
              class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <!-- Synthesized Results Display -->
        {#if synthesizedIdeas.length > 0}
          <div class="space-y-3 pt-3 border-t border-purple-900/60">
            <div class="flex items-center justify-between">
              <span class="swiss-tag text-amber-400 font-bold">Generated & Saved into Ideas Bank:</span>
              <span class="text-[10px] font-mono text-slate-400">{synthesizedIdeas.length} ideas banked</span>
            </div>
            <div class="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {#each synthesizedIdeas as idea}
                <div class="p-3 bg-black/80 border border-purple-900/80 flex items-start justify-between gap-3 text-xs font-mono">
                  <div class="space-y-1 flex-1">
                    <h4 class="font-bold text-white text-xs font-display">{idea.title}</h4>
                    {#if idea.description}
                      <p class="text-[11px] text-slate-400 line-clamp-1">{idea.description}</p>
                    {/if}
                  </div>
                  <button
                    type="button"
                    onclick={() => {
                      showBrainstormModal = false;
                      const combinedNotes = [idea.description, idea.notes].filter(Boolean).join('\n\n');
                      appState.openScriptStudioWithTopic({
                        topic: idea.title,
                        format: 'Short Video',
                        custom_instructions: combinedNotes || undefined,
                        creator_watchlist_id: selectedWatchlistId || undefined,
                        autoGenerate: false
                      });
                    }}
                    class="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black text-[10px] font-mono font-bold shrink-0 transition-colors"
                  >
                    Draft Script
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Modal Actions -->
        <div class="flex items-center justify-between pt-3 border-t border-purple-900/40">
          <button
            type="button"
            onclick={() => (showBrainstormModal = false)}
            class="px-4 py-2 text-xs text-slate-400 hover:text-white font-mono"
          >
            {synthesizedIdeas.length > 0 ? 'Done' : 'Cancel'}
          </button>

          <button
            type="button"
            onclick={handleRunBrainstorm}
            disabled={isSynthesizing || (brainstormMode === 'topic' && !customTopicPrompt.trim())}
            class="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display tracking-wider transition-all disabled:opacity-50"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>{isSynthesizing ? `Synthesizing with ${activeProvider.name}...` : `Synthesize 3 Ideas with ${activeProvider.name}`}</span>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
