<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import type { Note } from '../../types';
  import {
    StickyNote,
    Plus,
    Pin,
    Folder,
    Tag,
    Trash2,
    Sparkles,
    Search,
    Save
  } from 'lucide-svelte';

  let notes = $state<Note[]>([]);
  let activeNote = $state<Note | null>(null);
  let searchQuery = $state('');
  let selectedFolder = $state('All');
  let isLoading = $state(false);

  onMount(loadNotes);

  async function loadNotes() {
    try {
      isLoading = true;
      notes = await api.getNotes();
      if (notes.length > 0) {
        activeNote = notes[0];
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      isLoading = false;
    }
  }

  let folders = $derived([
    'All',
    ...Array.from(new Set(notes.map(n => n.folder || 'General')))
  ]);

  let filteredNotes = $derived(
    notes.filter(n => {
      const matchFolder = selectedFolder === 'All' || n.folder === selectedFolder;
      const matchSearch =
        !searchQuery.trim() ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFolder && matchSearch;
    })
  );

  async function handleCreateNewNote() {
    try {
      const created = await api.createNote({
        title: 'Untitled Note',
        content: '',
        folder: selectedFolder === 'All' ? 'General' : selectedFolder
      });
      notes = [created, ...notes];
      activeNote = created;
      appState.showToast('New note created', 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to create note', 'error');
    }
  }

  async function handleSaveActiveNote() {
    if (!activeNote) return;
    try {
      const updated = await api.updateNote(activeNote.id, activeNote);
      notes = notes.map(n => (n.id === updated.id ? updated : n));
      activeNote = updated;
      appState.showToast('Note saved!', 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Save failed', 'error');
    }
  }

  async function togglePin(note: Note) {
    try {
      const updated = await api.updateNote(note.id, { is_pinned: !note.is_pinned });
      notes = notes.map(n => (n.id === note.id ? updated : n));
      if (activeNote?.id === note.id) activeNote = updated;
    } catch (e: any) {
      console.error(e);
    }
  }

  async function handleDeleteNote(id: number) {
    try {
      await api.deleteNote(id);
      notes = notes.filter(n => n.id !== id);
      activeNote = notes.length > 0 ? notes[0] : null;
      appState.showToast('Note deleted', 'info');
    } catch (e: any) {
      appState.showToast(e.message || 'Delete failed', 'error');
    }
  }

  async function handleTurnNoteIntoIdeas() {
    if (!activeNote?.content) return;
    try {
      const created = await api.createIdea({
        title: activeNote.title,
        description: activeNote.content.slice(0, 300),
        category: activeNote.folder || 'Notes',
        status: 'Active'
      });
      appState.showToast(`Converted note into Idea: "${created.title}"!`, 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Conversion failed', 'error');
    }
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <!-- Swiss Header -->
  <div class="p-6 bg-[#10071c] border border-purple-900/30 relative">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <span class="font-mono text-[10px] tracking-widest text-amber-400 uppercase">Research Archive</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display flex items-center gap-2.5">
          <StickyNote class="w-6 h-6 text-amber-400" />
          <span>Creator Notes & Research Archive</span>
        </h1>
        <p class="text-xs text-slate-400 mt-1 max-w-xl">
          Capture competitor formulas, study references, and promote raw thoughts into structured scripts.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          onclick={handleCreateNewNote}
          class="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold font-mono tracking-wider uppercase transition-all shadow-md shadow-amber-500/10"
        >
          <Plus class="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Two Pane Layout -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
    <!-- Left Pane: Notes List (4 cols) -->
    <div class="lg:col-span-4 bg-[#10071c] border border-purple-900/30 p-4 space-y-4 flex flex-col justify-between">
      <div class="space-y-3">
        <!-- Search & Folder filter -->
        <div class="relative">
          <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/60" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search notes archive..."
            class="w-full pl-9 pr-3.5 py-1.5 bg-[#08040d] border border-purple-900/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        <!-- Folder Tabs -->
        <div class="flex gap-1.5 overflow-x-auto pb-1 font-mono text-[10px] uppercase tracking-wider">
          {#each folders as folder}
            <button
              onclick={() => (selectedFolder = folder)}
              class="px-2.5 py-1 border transition-all shrink-0 {selectedFolder === folder
                ? 'bg-amber-400 text-black border-amber-400 font-bold'
                : 'bg-[#08040d] text-slate-400 border-purple-900/30 hover:text-white'}"
            >
              {folder}
            </button>
          {/each}
        </div>

        <!-- Notes Items -->
        <div class="space-y-2 overflow-y-auto max-h-[520px] pr-1">
          {#each filteredNotes as note}
            {@const isSelected = activeNote?.id === note.id}
            <button
              onclick={() => (activeNote = note)}
              class="w-full p-3 border text-left transition-all flex flex-col gap-1.5 {isSelected
                ? 'bg-purple-950/40 border-amber-400/70 shadow-md shadow-amber-500/5'
                : 'bg-[#08040d]/80 border-purple-900/25 hover:border-purple-700/50'}"
            >
              <div class="flex items-center justify-between font-mono text-[10px]">
                <span class="text-amber-400 uppercase tracking-widest truncate">{note.folder}</span>
                <div class="flex items-center gap-1">
                  {#if note.is_pinned}
                    <Pin class="w-3 h-3 text-amber-400 fill-amber-400" />
                  {/if}
                </div>
              </div>

              <h4 class="text-xs font-bold font-display text-white line-clamp-1">{note.title}</h4>
              <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
                {note.content || 'Empty note...'}
              </p>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Right Pane: Active Note Editor (8 cols) -->
    <div class="lg:col-span-8 bg-[#10071c] border border-purple-900/30 p-6 space-y-4 flex flex-col justify-between">
      {#if activeNote}
        <div class="space-y-4 flex-1 flex flex-col">
          <!-- Editor Header -->
          <div class="flex items-center justify-between gap-3 pb-3 border-b border-purple-900/30">
            <input
              type="text"
              bind:value={activeNote.title}
              class="text-xl font-bold font-display text-white bg-transparent border-none focus:outline-none w-full tracking-tight"
              placeholder="Note Title..."
            />

            <div class="flex items-center gap-2 shrink-0 font-mono text-xs">
              <button
                onclick={() => activeNote && togglePin(activeNote)}
                class="p-2 bg-[#08040d] border border-purple-900/40 hover:text-amber-400 text-slate-400 transition-colors"
                title="Pin note"
              >
                <Pin class="w-4 h-4 {activeNote.is_pinned ? 'text-amber-400 fill-amber-400' : ''}" />
              </button>

              <button
                onclick={handleTurnNoteIntoIdeas}
                class="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/50 text-purple-300 border border-purple-700/40 text-[11px] font-semibold hover:border-amber-400/50 transition-all uppercase tracking-wider"
                title="Convert note into Ideas Bank entry"
              >
                <Sparkles class="w-3 h-3 text-amber-400" />
                <span>Turn to Idea</span>
              </button>

              <button
                onclick={handleSaveActiveNote}
                class="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm"
              >
                <Save class="w-3 h-3" />
                <span>Save</span>
              </button>

              <button
                onclick={() => activeNote && handleDeleteNote(activeNote.id)}
                class="p-2 text-slate-600 hover:text-rose-400 transition-colors"
                title="Delete note"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Note Content Area -->
          <div class="flex-1 flex flex-col">
            <textarea
              bind:value={activeNote.content}
              rows={17}
              placeholder="Record deep observations, viral hook structures, or raw creative transcriptions..."
              class="w-full flex-1 p-4 bg-[#08040d] border border-purple-900/30 text-slate-100 text-sm leading-relaxed focus:outline-none focus:border-amber-400 font-sans"
            ></textarea>
          </div>
        </div>
      {:else}
        <div class="flex items-center justify-center h-full text-slate-500 font-mono text-xs uppercase tracking-wider">
          Select or initialize a note to edit.
        </div>
      {/if}
    </div>
  </div>
</div>
