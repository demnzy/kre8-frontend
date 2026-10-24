<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import type { ContentItem } from '../../types';
  import {
    Video,
    LayoutGrid,
    List,
    Plus,
    Search,
    Trash2,
    FileCode
  } from 'lucide-svelte';
  import { reveal } from '../../utils/reveal';

  const WORKFLOW_STAGES = [
    'Idea',
    'Researching',
    'Script Writing',
    'Ready to Record',
    'Recorded',
    'Editing',
    'Ready to Publish',
    'Scheduled',
    'Published',
    'Repurposed'
  ] as const;

  let items = $state<ContentItem[]>([]);
  let viewMode = $state<'kanban' | 'table'>('kanban');
  let selectedPlatform = $state<string>('All');
  let searchQuery = $state<string>('');
  let isLoading = $state(false);

  let showCreateModal = $state(false);
  let newTitle = $state('');
  let newPlatform = $state('YouTube');
  let newFormat = $state('Video');
  let newPriority = $state<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  let newDescription = $state('');

  onMount(loadContent);

  async function loadContent() {
    try {
      isLoading = true;
      items = await api.getContentItems();
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to load content items', 'error');
    } finally {
      isLoading = false;
    }
  }

  let filteredItems = $derived(
    items.filter(item => {
      const matchPlat = selectedPlatform === 'All' || item.platform === selectedPlatform;
      const matchQuery = !searchQuery.trim() || item.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPlat && matchQuery;
    })
  );

  async function handleUpdateStatus(id: number, newStatus: any) {
    try {
      const updated = await api.updateContentItem(id, { status: newStatus });
      items = items.map(i => (i.id === id ? updated : i));
      appState.showToast(`Updated to: ${newStatus}`, 'info');
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to update', 'error');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this content record?')) return;
    try {
      await api.deleteContentItem(id);
      items = items.filter(i => i.id !== id);
      appState.showToast('Content item deleted', 'info');
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to delete', 'error');
    }
  }

  async function handleCreateItem(e: Event) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const created = await api.createContentItem({
        title: newTitle,
        description: newDescription,
        platform: newPlatform,
        format: newFormat,
        category: appState.preferences.primary_niche,
        status: 'Idea',
        priority: newPriority
      });
      items = [created, ...items];
      newTitle = '';
      newDescription = '';
      showCreateModal = false;
      appState.showToast(`Added: "${created.title}"`, 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to create item', 'error');
    }
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <!-- Swiss Header -->
  <div class="swiss-card p-6 border border-purple-900/60 bg-[#10071c] space-y-4">
    <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
      <div class="flex items-center gap-2">
        <Video class="w-4 h-4 text-amber-400" />
        <span class="swiss-tag text-amber-400">
          Content Pipeline
        </span>
      </div>
      <span class="swiss-tag text-purple-400 font-mono">
        10 Stages
      </span>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-display">
          Content Production Hub
        </h1>
        <p class="text-xs text-slate-300 mt-1">
          Track each video, short, and carousel from concept through filming, editing, and publishing.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Switcher -->
        <div class="flex items-center p-1 bg-black border border-purple-900/60">
          <button
            onclick={() => (viewMode = 'kanban')}
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase transition-all {viewMode === 'kanban'
              ? 'bg-amber-400 text-black font-bold'
              : 'text-slate-400 hover:text-white'}"
          >
            <LayoutGrid class="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
          <button
            onclick={() => (viewMode = 'table')}
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase transition-all {viewMode === 'table'
              ? 'bg-amber-400 text-black font-bold'
              : 'text-slate-400 hover:text-white'}"
          >
            <List class="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>

        <button
          onclick={() => (showCreateModal = true)}
          class="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-extrabold uppercase font-display tracking-wider transition-all"
        >
          <Plus class="w-4 h-4" />
          <span>New Content</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Filter Bar -->
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0d0617] p-3 border border-purple-900/40">
    <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
      {#each ['All', 'YouTube', 'TikTok', 'LinkedIn', 'Instagram', 'X'] as plat}
        <button
          onclick={() => (selectedPlatform = plat)}
          class="px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all shrink-0 {selectedPlatform === plat
            ? 'bg-amber-400 text-black font-bold'
            : 'text-slate-400 hover:text-white bg-purple-950/30 border border-purple-900/50'}"
        >
          {plat}
        </button>
      {/each}
    </div>

    <div class="relative w-full sm:w-64">
      <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Filter by title..."
        class="w-full pl-9 pr-3.5 py-1.5 bg-black border border-purple-900/60 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
      />
    </div>
  </div>

  <!-- KANBAN VIEW -->
  {#if viewMode === 'kanban'}
    <div class="overflow-x-auto pb-6">
      <div class="flex gap-3 min-w-[2100px]">
        {#each WORKFLOW_STAGES as stage, sIdx}
          {@const stageItems = filteredItems.filter(i => i.status === stage)}
          <div use:reveal={{ delay: Math.min(sIdx * 40, 300) }} class="w-72 shrink-0 flex flex-col swiss-card border border-purple-900/50 bg-[#0d0517] p-3 space-y-3">
            <!-- Header -->
            <div class="flex items-center justify-between px-2 py-1.5 border-b border-purple-900/40">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 {stage === 'Published'
                  ? 'bg-emerald-400'
                  : stage === 'Ready to Record'
                  ? 'bg-amber-400'
                  : stage === 'Script Writing'
                  ? 'bg-purple-400'
                  : 'bg-slate-500'}"></span>
                <span class="text-xs font-bold font-display uppercase tracking-wider text-slate-200">{stage}</span>
              </div>
              <span class="text-[10px] font-mono font-bold px-1.5 bg-purple-950 text-amber-400 border border-purple-800">
                {stageItems.length}
              </span>
            </div>

            <!-- Cards -->
            <div class="flex-1 space-y-2.5 overflow-y-auto max-h-[70vh] pr-1">
              {#each stageItems as item}
                <div class="p-3.5 bg-black/80 border border-purple-950 hover:border-amber-400/50 swiss-card-hover transition-all space-y-2.5 group">
                  <div class="flex items-center justify-between text-[10px] font-mono">
                    <span class="text-amber-400 uppercase font-bold">{item.platform} • {item.format}</span>
                    <span class="px-1.5 py-0.2 uppercase text-[9px] {item.priority === 'Urgent' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-purple-950 text-slate-400'}">
                      {item.priority}
                    </span>
                  </div>

                  <h3 class="text-xs font-bold text-white line-clamp-2 leading-snug font-display">
                    {item.title}
                  </h3>

                  {#if item.description}
                    <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-mono">
                      {item.description}
                    </p>
                  {/if}

                  <!-- Actions / Move stage -->
                  <div class="pt-2 border-t border-purple-950 flex items-center justify-between">
                    <select
                      value={item.status}
                      onchange={(e) => handleUpdateStatus(item.id, e.currentTarget.value)}
                      class="text-[10px] font-mono bg-purple-950/80 border border-purple-900 text-slate-300 px-1 py-0.5 focus:outline-none focus:border-amber-400"
                    >
                      {#each WORKFLOW_STAGES as s}
                        <option value={s}>{s}</option>
                      {/each}
                    </select>

                    <div class="flex items-center gap-1.5">
                      <button
                        onclick={() => {
                          appState.openScriptStudioWithTopic({
                            topic: item.title,
                            format: item.format,
                            autoGenerate: false
                          });
                        }}
                        class="text-purple-400 hover:text-amber-300 transition-colors p-1"
                        title="Open in Script Studio"
                      >
                        <FileCode class="w-3.5 h-3.5" />
                      </button>
                      <button
                        onclick={() => handleDelete(item.id)}
                        class="text-slate-600 hover:text-rose-400 transition-colors p-1"
                        title="Delete"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <!-- TABLE VIEW -->
    <div class="swiss-card border border-purple-900/60 overflow-hidden bg-[#10071c]">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="border-b border-purple-900/40 bg-purple-950/40 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
            <th class="p-3.5">Title</th>
            <th class="p-3.5">Platform</th>
            <th class="p-3.5">Format</th>
            <th class="p-3.5">Status</th>
            <th class="p-3.5">Priority</th>
            <th class="p-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-purple-900/30">
          {#each filteredItems as item}
            <tr class="hover:bg-purple-950/20 transition-colors">
              <td class="p-3.5 font-bold text-white max-w-sm truncate font-display">{item.title}</td>
              <td class="p-3.5 font-mono text-purple-300">{item.platform}</td>
              <td class="p-3.5 font-mono text-slate-400">{item.format}</td>
              <td class="p-3.5">
                <span class="px-2 py-0.5 text-[10px] font-mono uppercase bg-purple-950 text-amber-300 border border-purple-800">
                  {item.status}
                </span>
              </td>
              <td class="p-3.5">
                <span class="px-1.5 py-0.5 text-[9px] font-mono uppercase {item.priority === 'Urgent' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400'}">
                  {item.priority}
                </span>
              </td>
              <td class="p-3.5 text-right">
                <button
                  onclick={() => handleDelete(item.id)}
                  class="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- New Content Modal -->
  {#if showCreateModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div class="relative w-full max-w-md swiss-card border border-purple-800 bg-[#10071c] p-6 space-y-4">
        <h3 class="text-base font-bold text-white uppercase font-display">Create Content Record</h3>
        <form onsubmit={handleCreateItem} class="space-y-3.5">
          <div>
            <label for="new-content-title" class="block swiss-tag text-slate-400 mb-1">Title</label>
            <input
              id="new-content-title"
              type="text"
              bind:value={newTitle}
              placeholder="e.g. Master LLM Agents in 15 Minutes"
              required
              class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label for="new-content-desc" class="block swiss-tag text-slate-400 mb-1">Description / Core Angle</label>
            <textarea
              id="new-content-desc"
              bind:value={newDescription}
              rows={3}
              placeholder="Key talking points..."
              class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="new-content-plat" class="block swiss-tag text-slate-400 mb-1">Platform</label>
              <select
                id="new-content-plat"
                bind:value={newPlatform}
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
              <label for="new-content-fmt" class="block swiss-tag text-slate-400 mb-1">Format</label>
              <select
                id="new-content-fmt"
                bind:value={newFormat}
                class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono"
              >
                <option value="Video">Video</option>
                <option value="Short/Reel">Short/Reel</option>
                <option value="Carousel">Carousel</option>
                <option value="Article">Article</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-purple-900/40">
            <button
              type="button"
              onclick={() => (showCreateModal = false)}
              class="px-4 py-2 text-xs text-slate-400 hover:text-white font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold uppercase font-display"
            >
              Add to Workflow
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
