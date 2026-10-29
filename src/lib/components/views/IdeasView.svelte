<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import { portal } from '../../utils/portal';
  import LoadError from '../layout/LoadError.svelte';
  import type { ContentIdea } from '../../types';
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
    X
  } from 'lucide-svelte';
  import { reveal } from '../../utils/reveal';

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

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
      <div class="min-w-0">
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
          Ideas Bank
        </h1>
        <p class="text-xs text-slate-300 mt-1">
          Store, organize, and promote creative angles into active Kanban production records.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <button
          onclick={() => appState.setModule('discover')}
          class="flex items-center gap-1.5 px-3.5 py-2 bg-purple-950/60 hover:bg-purple-900/50 text-slate-300 hover:text-white border border-purple-800 text-xs font-mono transition-all"
        >
          <Sparkles class="w-3.5 h-3.5 text-amber-400" />
          <span>Suggest from News</span>
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
    <div use:portal class="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 pb-16 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <button
        type="button"
        onclick={() => (showModal = false)}
        class="fixed inset-0 cursor-default"
        aria-label="Close modal"
        tabindex="-1"
      ></button>

      <div class="relative w-full max-w-lg swiss-card border border-purple-800 bg-[#10071c] p-6 space-y-4 shadow-2xl z-10 modal-spring">
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
</div>
