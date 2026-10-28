<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import LoadError from '../layout/LoadError.svelte';
  import type { Note } from '../../types';
  import { marked } from 'marked';
  import {
    StickyNote,
    Plus,
    Pin,
    Folder,
    Tag,
    Trash2,
    Sparkles,
    Search,
    Save,
    FileCode,
    Check,
    X,
    Eye,
    Pencil,
    Columns,
    Bold,
    Italic,
    List,
    ListOrdered,
    CheckSquare,
    Code,
    Quote,
    Heading1,
    Heading2,
    Heading3,
    Link as LinkIcon,
    Minus
  } from 'lucide-svelte';

  const DEFAULT_FOLDERS = ['General', 'Research', 'Script Drafts', 'Competitors', 'Sponsors'];

  // Markdown configuration
  marked.setOptions({
    gfm: true,
    breaks: true
  });

  let notes = $state<Note[]>([]);
  let activeNote = $state<Note | null>(null);
  let searchQuery = $state('');
  let selectedFolder = $state('All');
  let isLoading = $state(false);
  let loadError = $state<string | null>(null);

  // View mode: 'edit' | 'preview' | 'split'
  let viewMode = $state<'edit' | 'preview' | 'split'>('edit');

  // Textarea DOM reference for formatting insertions
  let textareaEl = $state<HTMLTextAreaElement | null>(null);

  // Save state & auto-save timer
  let saveState = $state<'saved' | 'dirty' | 'saving'>('saved');
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  // Tag & custom folder inputs
  let newTagInput = $state('');
  let isAddingCustomFolder = $state(false);
  let customFolderInput = $state('');

  onMount(loadNotes);

  onDestroy(() => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
  });

  async function loadNotes() {
    isLoading = true;
    loadError = null;
    try {
      notes = await api.getNotes();
      if (notes.length > 0 && !activeNote) {
        activeNote = { ...notes[0], tags: [...(notes[0].tags || [])] };
        saveState = 'saved';
      }
    } catch (e: any) {
      loadError = e?.message || "Couldn't load your notes.";
    } finally {
      isLoading = false;
    }
  }

  let availableFolders = $derived(
    Array.from(
      new Set([
        ...DEFAULT_FOLDERS,
        ...notes.map(n => n.folder || 'General'),
        ...(activeNote?.folder ? [activeNote.folder] : [])
      ])
    )
  );

  let filterFolders = $derived([
    'All',
    ...Array.from(new Set(notes.map(n => n.folder || 'General')))
  ]);

  let filteredNotes = $derived(
    notes.filter(n => {
      const matchFolder = selectedFolder === 'All' || (n.folder || 'General') === selectedFolder;
      if (!matchFolder) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inTitle = n.title.toLowerCase().includes(q);
      const inContent = (n.content || '').toLowerCase().includes(q);
      const inTags = (n.tags || []).some(t => t.toLowerCase().includes(q));
      return inTitle || inContent || inTags;
    })
  );

  let wordCount = $derived(
    (activeNote?.content || '').split(/\s+/).filter(Boolean).length
  );

  let readingTimeMin = $derived(
    Math.max(1, Math.ceil(wordCount / 180))
  );

  let renderedHtml = $derived.by(() => {
    if (!activeNote || !activeNote.content?.trim()) {
      return '<div class="text-slate-500 italic py-8 text-center">Empty note. Type markdown or switch to Edit mode to write.</div>';
    }
    try {
      return marked.parse(activeNote.content) as string;
    } catch (err: any) {
      return `<div class="text-rose-400 p-4">Error parsing markdown: ${err?.message || err}</div>`;
    }
  });

  function markDirtyAndScheduleSave() {
    saveState = 'dirty';
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      handleSaveActiveNote(true);
    }, 900);
  }

  async function selectNote(note: Note) {
    if (activeNote && activeNote.id === note.id) return;
    if (saveState === 'dirty' && activeNote) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      await handleSaveActiveNote(true);
    }
    const fresh = notes.find(n => n.id === note.id) || note;
    activeNote = { ...fresh, tags: [...(fresh.tags || [])] };
    saveState = 'saved';
  }

  async function handleCreateNewNote() {
    if (saveState === 'dirty' && activeNote) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      await handleSaveActiveNote(true);
    }
    try {
      const targetFolder = selectedFolder === 'All' ? 'General' : selectedFolder;
      const created = await api.createNote({
        title: 'Untitled Note',
        content: '# New Note\n\nWrite your thoughts, hooks, and video outlines here...',
        folder: targetFolder,
        tags: []
      });
      notes = [created, ...notes];
      activeNote = { ...created, tags: [...(created.tags || [])] };
      saveState = 'saved';
      appState.showToast('New note created', 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Could not create note', 'error');
    }
  }

  async function handleSaveActiveNote(silent = false) {
    if (!activeNote) return;
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
    try {
      saveState = 'saving';
      const updated = await api.updateNote(activeNote.id, {
        title: activeNote.title.trim() || 'Untitled Note',
        content: activeNote.content,
        folder: activeNote.folder || 'General',
        tags: activeNote.tags || [],
        is_pinned: activeNote.is_pinned
      });
      notes = notes.map(n => (n.id === updated.id ? updated : n));
      activeNote = { ...updated, tags: [...(updated.tags || [])] };
      saveState = 'saved';
      if (!silent) {
        appState.showToast('Note saved', 'success');
      }
    } catch (e: any) {
      saveState = 'dirty';
      if (!silent) {
        appState.showToast(e.message || 'Save failed', 'error');
      }
    }
  }

  async function togglePin(note: Note, e?: Event) {
    if (e) e.stopPropagation();
    try {
      const updated = await api.updateNote(note.id, { is_pinned: !note.is_pinned });
      notes = notes
        .map(n => (n.id === note.id ? updated : n))
        .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));
      if (activeNote?.id === note.id) {
        activeNote = { ...activeNote, is_pinned: updated.is_pinned };
      }
    } catch (err: any) {
      appState.showToast(err.message || 'Could not pin note', 'error');
    }
  }

  async function handleDeleteNote(id: number, e?: Event) {
    if (e) e.stopPropagation();
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    try {
      await api.deleteNote(id);
      notes = notes.filter(n => n.id !== id);
      if (activeNote?.id === id) {
        activeNote = notes.length > 0 ? { ...notes[0], tags: [...(notes[0].tags || [])] } : null;
        saveState = 'saved';
      }
      appState.showToast('Note deleted', 'info');
    } catch (err: any) {
      appState.showToast(err.message || 'Delete failed', 'error');
    }
  }

  function addTagToActiveNote() {
    if (!activeNote) return;
    const val = newTagInput.trim().replace(/^#/, '');
    if (!val) return;
    const currentTags = activeNote.tags || [];
    if (!currentTags.includes(val)) {
      activeNote.tags = [...currentTags, val];
      markDirtyAndScheduleSave();
    }
    newTagInput = '';
  }

  function removeTagFromActiveNote(tag: string) {
    if (!activeNote) return;
    activeNote.tags = (activeNote.tags || []).filter(t => t !== tag);
    markDirtyAndScheduleSave();
  }

  function applyCustomFolder() {
    if (!activeNote) return;
    const val = customFolderInput.trim();
    if (val) {
      activeNote.folder = val;
      markDirtyAndScheduleSave();
    }
    customFolderInput = '';
    isAddingCustomFolder = false;
  }

  // Markdown formatting toolbar helper
  function insertFormatting(prefix: string, suffix = '', placeholder = '') {
    if (!activeNote) return;
    if (!textareaEl) {
      activeNote.content = (activeNote.content || '') + `\n${prefix}${placeholder}${suffix}`;
      markDirtyAndScheduleSave();
      return;
    }

    const start = textareaEl.selectionStart ?? 0;
    const end = textareaEl.selectionEnd ?? 0;
    const text = activeNote.content || '';
    const selected = text.slice(start, end);
    const replacement = selected.length > 0 ? `${prefix}${selected}${suffix}` : `${prefix}${placeholder}${suffix}`;

    activeNote.content = text.slice(0, start) + replacement + text.slice(end);
    markDirtyAndScheduleSave();

    // Re-focus and update cursor
    setTimeout(() => {
      if (textareaEl) {
        textareaEl.focus();
        const cursorPosition = selected.length > 0
          ? start + replacement.length
          : start + prefix.length + placeholder.length;
        textareaEl.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 10);
  }

  async function handleTurnNoteIntoIdea() {
    if (!activeNote) return;
    await handleSaveActiveNote(true);
    try {
      const created = await api.createIdea({
        title: activeNote.title.trim() || 'Idea from Note',
        description: (activeNote.content || '').slice(0, 400),
        category: activeNote.folder || 'General',
        tags: activeNote.tags || [],
        status: 'Active'
      });
      appState.showToast(`Saved to Ideas Bank: "${created.title}"`, 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Could not create idea', 'error');
    }
  }

  async function handleSendToScriptStudio() {
    if (!activeNote) return;
    await handleSaveActiveNote(true);
    const lines = (activeNote.content || '')
      .split('\n')
      .map(l => l.trim().replace(/^[#\-*>\d.]+\s*/, ''))
      .filter(Boolean);
    appState.openScriptStudioWithTopic({
      topic: activeNote.title.trim() || 'Untitled Script',
      talking_points: lines.slice(0, 6),
      autoGenerate: false
    });
  }

  function formatUpdatedTime(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  {#if loadError}
    <LoadError message={loadError} onRetry={loadNotes} />
  {/if}

  <!-- Header -->
  <div class="swiss-card p-6 border border-purple-900/40 bg-[#10071c]">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-medium text-amber-400">Research & Scratchpad</span>
          <span class="text-xs text-slate-400">• {notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <StickyNote class="w-6 h-6 text-amber-400" />
          <span>Creator Notes</span>
        </h1>
        <p class="text-xs text-slate-400 mt-1 max-w-xl">
          Write research notes, hook ideas, and outlines in formatted Markdown. Preview live or promote directly to Ideas Bank or Script Studio.
        </p>
      </div>

      <button
        type="button"
        onclick={handleCreateNewNote}
        class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-all shadow-sm shrink-0"
      >
        <Plus class="w-4 h-4" />
        <span>New Note</span>
      </button>
    </div>
  </div>

  <!-- Two Pane Layout -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
    <!-- Left Pane: Notes List (4 cols) -->
    <div class="lg:col-span-4 swiss-card border border-purple-900/40 bg-[#10071c] p-4 space-y-4 flex flex-col">
      <!-- Search -->
      <div class="relative">
        <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search notes or tags..."
          class="w-full pl-9 pr-3.5 py-2 rounded-lg bg-[#08040d] border border-purple-900/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />
      </div>

      <!-- Folder Filter Tabs -->
      <div class="flex gap-1.5 overflow-x-auto pb-1">
        {#each filterFolders as folder}
          <button
            type="button"
            onclick={() => (selectedFolder = folder)}
            class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 {selectedFolder === folder
              ? 'bg-amber-400 text-black font-semibold'
              : 'bg-[#08040d] text-slate-400 border border-purple-900/30 hover:text-white'}"
          >
            {folder}
          </button>
        {/each}
      </div>

      <!-- Notes Items -->
      {#if filteredNotes.length === 0}
        <div class="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-2 text-slate-400 text-xs">
          <StickyNote class="w-7 h-7 text-purple-400/40" />
          <p>{notes.length === 0 ? 'No notes yet.' : 'No notes match your search.'}</p>
        </div>
      {:else}
        <div class="space-y-2 overflow-y-auto max-h-[560px] pr-1 flex-1">
          {#each filteredNotes as note}
            {@const isSelected = activeNote?.id === note.id}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              onclick={() => selectNote(note)}
              class="w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 group {isSelected
                ? 'bg-purple-950/50 border-amber-400/70 shadow-sm'
                : 'bg-[#08040d]/80 border-purple-900/25 hover:border-purple-700/50'}"
            >
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-amber-400 font-medium truncate">{note.folder || 'General'}</span>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    onclick={(e) => togglePin(note, e)}
                    class="p-0.5 rounded hover:text-amber-400 transition-colors {note.is_pinned ? 'text-amber-400' : 'text-slate-500 opacity-0 group-hover:opacity-100'}"
                    title={note.is_pinned ? 'Unpin note' : 'Pin note'}
                  >
                    <Pin class="w-3 h-3 {note.is_pinned ? 'fill-amber-400' : ''}" />
                  </button>
                  <button
                    type="button"
                    onclick={(e) => handleDeleteNote(note.id, e)}
                    class="p-0.5 rounded text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete note"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              </div>

              <h4 class="text-xs font-semibold text-white line-clamp-1">{note.title}</h4>
              <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {note.content ? note.content.replace(/[#*`_>\[\]]/g, '') : 'Empty note...'}
              </p>

              {#if note.tags && note.tags.length > 0}
                <div class="flex flex-wrap gap-1 pt-0.5">
                  {#each note.tags.slice(0, 3) as tag}
                    <span class="px-1.5 py-0.2 rounded text-[10px] bg-purple-950/60 text-purple-300 border border-purple-800/40">
                      #{tag}
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Right Pane: Active Note Markdown Editor (8 cols) -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      role="region"
      aria-label="Note Editor"
      onkeydown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
          e.preventDefault();
          handleSaveActiveNote(false);
        }
      }}
      class="lg:col-span-8 swiss-card border border-purple-900/40 bg-[#10071c] p-6 space-y-4 flex flex-col justify-between"
    >
      {#if activeNote}
        <div class="space-y-4 flex-1 flex flex-col">
          <!-- Title & Top Actions Bar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-900/30">
            <input
              type="text"
              bind:value={activeNote.title}
              oninput={markDirtyAndScheduleSave}
              class="text-xl font-bold text-white bg-transparent border-none focus:outline-none w-full tracking-tight"
              placeholder="Note title..."
            />

            <div class="flex items-center gap-2 shrink-0 flex-wrap">
              <!-- Auto-save status indicator -->
              <span class="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                {#if saveState === 'saving'}
                  <span class="text-amber-300">Saving...</span>
                {:else if saveState === 'dirty'}
                  <span class="text-amber-300">Unsaved</span>
                {:else}
                  <Check class="w-3 h-3 text-emerald-400" />
                  <span class="text-slate-400">Saved</span>
                {/if}
              </span>

              <button
                type="button"
                onclick={() => activeNote && togglePin(activeNote)}
                class="p-2 rounded-lg bg-[#08040d] border border-purple-900/40 hover:text-amber-400 text-slate-400 transition-colors"
                title={activeNote.is_pinned ? 'Unpin note' : 'Pin note'}
              >
                <Pin class="w-3.5 h-3.5 {activeNote.is_pinned ? 'text-amber-400 fill-amber-400' : ''}" />
              </button>

              <button
                type="button"
                onclick={handleTurnNoteIntoIdea}
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/60 text-purple-200 border border-purple-700/40 text-xs font-medium hover:border-amber-400/50 transition-all"
                title="Save this note to your Ideas Bank"
              >
                <Sparkles class="w-3.5 h-3.5 text-amber-400" />
                <span>Save as Idea</span>
              </button>

              <button
                type="button"
                onclick={handleSendToScriptStudio}
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/60 text-purple-200 border border-purple-700/40 text-xs font-medium hover:border-amber-400/50 transition-all"
                title="Send this note to Script Studio"
              >
                <FileCode class="w-3.5 h-3.5 text-amber-400" />
                <span>Open in Studio</span>
              </button>

              <button
                type="button"
                onclick={() => handleSaveActiveNote(false)}
                class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-all shadow-sm"
              >
                <Save class="w-3.5 h-3.5" />
                <span>Save</span>
              </button>

              <button
                type="button"
                onclick={() => activeNote && handleDeleteNote(activeNote.id)}
                class="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                title="Delete note"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Folder & Tags Bar -->
          <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
            <!-- Folder Picker -->
            <div class="flex items-center gap-2">
              <Folder class="w-3.5 h-3.5 text-amber-400" />
              <span class="text-slate-400">Folder:</span>
              {#if isAddingCustomFolder}
                <div class="flex items-center gap-1">
                  <input
                    type="text"
                    bind:value={customFolderInput}
                    placeholder="Folder name..."
                    onkeydown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyCustomFolder();
                      }
                    }}
                    class="px-2.5 py-1 rounded-md bg-[#08040d] border border-amber-400 text-white text-xs w-32 focus:outline-none"
                  />
                  <button
                    type="button"
                    onclick={applyCustomFolder}
                    class="px-2 py-1 rounded-md bg-amber-400 text-black text-xs font-medium"
                  >
                    Set
                  </button>
                  <button
                    type="button"
                    onclick={() => (isAddingCustomFolder = false)}
                    class="p-1 text-slate-400 hover:text-white"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </div>
              {:else}
                <select
                  bind:value={activeNote.folder}
                  onchange={markDirtyAndScheduleSave}
                  class="px-2.5 py-1 rounded-lg bg-[#08040d] border border-purple-900/50 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                >
                  {#each availableFolders as f}
                    <option value={f}>{f}</option>
                  {/each}
                </select>
                <button
                  type="button"
                  onclick={() => (isAddingCustomFolder = true)}
                  class="text-[11px] text-amber-400 hover:underline"
                >
                  + New folder
                </button>
              {/if}
            </div>

            <!-- Tags Editor -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <Tag class="w-3.5 h-3.5 text-purple-400" />
              {#each activeNote.tags || [] as tag}
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-purple-950/60 text-purple-200 border border-purple-800/40">
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onclick={() => removeTagFromActiveNote(tag)}
                    class="text-slate-400 hover:text-rose-400"
                    aria-label="Remove tag"
                  >
                    <X class="w-2.5 h-2.5" />
                  </button>
                </span>
              {/each}
              <input
                type="text"
                bind:value={newTagInput}
                placeholder="+ Add tag..."
                onkeydown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTagToActiveNote();
                  }
                }}
                class="px-2 py-0.5 rounded-md bg-[#08040d] border border-purple-900/40 text-xs text-slate-200 placeholder-slate-500 w-24 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <!-- Markdown Toolbar & View Switcher -->
          <div class="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-[#090312] border border-purple-900/40 text-slate-300">
            <!-- Formatting buttons (active when editing or split) -->
            <div class="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onclick={() => insertFormatting('# ', '', 'Heading 1')}
                class="p-1.5 rounded hover:bg-purple-900/40 hover:text-amber-400 transition-colors"
                title="Heading 1"
              >
                <Heading1 class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onclick={() => insertFormatting('## ', '', 'Heading 2')}
                class="p-1.5 rounded hover:bg-purple-900/40 hover:text-amber-400 transition-colors"
                title="Heading 2"
              >
                <Heading2 class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onclick={() => insertFormatting('### ', '', 'Heading 3')}
                class="p-1.5 rounded hover:bg-purple-900/40 hover:text-amber-400 transition-colors"
                title="Heading 3"
              >
                <Heading3 class="w-3.5 h-3.5" />
              </button>

              <div class="w-px h-4 bg-purple-900/50 mx-1"></div>

              <button
                type="button"
                onclick={() => insertFormatting('**', '**', 'bold text')}
                class="p-1.5 rounded hover:bg-purple-900/40 hover:text-amber-400 transition-colors"
                title="Bold"
              >
                <Bold class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onclick={() => insertFormatting('*', '*', 'italic text')}
                class="p-1.5 rounded hover:bg-purple-900/40 hover:text-amber-400 transition-colors"
                title="Italic"
              >
                <Italic class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onclick={() => insertFormatting('> ', '', 'Quote note')}
                class="p-1.5 rounded hover:bg-purple-900/40 hover:text-amber-400 transition-colors"
                title="Blockquote"
              >
                <Quote class="w-3.5 h-3.5" />
              </button>

              <div class="w-px h-4 bg-purple-900/50 mx-1"></div>

              <button
                type="button"
                onclick={() => insertFormatting('`', '`', 'code')}
                class="p-1.5 rounded hover:bg-purple-900/40 hover:text-amber-400 transition-colors"
                title="Inline Code"
              >
                <Code class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onclick={() => insertFormatting('- ', '', 'Bullet item')}
                class="p-1.5 rounded hover:bg-purple-900/40 hover:text-amber-400 transition-colors"
                title="Bullet List"
              >
                <List class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onclick={() => insertFormatting('1. ', '', 'Numbered item')}
                class="p-1.5 rounded hover:bg-purple-900/40 hover:text-amber-400 transition-colors"
                title="Numbered List"
              >
                <ListOrdered class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onclick={() => insertFormatting('- [ ] ', '', 'Checklist task')}
                class="p-1.5 rounded hover:bg-purple-900/40 hover:text-amber-400 transition-colors"
                title="Task Checklist"
              >
                <CheckSquare class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onclick={() => insertFormatting('[', '](https://example.com)', 'Link Title')}
                class="p-1.5 rounded hover:bg-purple-900/40 hover:text-amber-400 transition-colors"
                title="Insert Link"
              >
                <LinkIcon class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onclick={() => insertFormatting('\n---\n')}
                class="p-1.5 rounded hover:bg-purple-900/40 hover:text-amber-400 transition-colors"
                title="Horizontal Divider"
              >
                <Minus class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- View Switcher Tabs: Edit / Split / Preview -->
            <div class="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-purple-900/50">
              <button
                type="button"
                onclick={() => (viewMode = 'edit')}
                class="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all {viewMode === 'edit'
                  ? 'bg-amber-400 text-black font-semibold'
                  : 'text-slate-400 hover:text-white'}"
              >
                <Pencil class="w-3 h-3" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onclick={() => (viewMode = 'split')}
                class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all {viewMode === 'split'
                  ? 'bg-amber-400 text-black font-semibold'
                  : 'text-slate-400 hover:text-white'}"
              >
                <Columns class="w-3 h-3" />
                <span>Split</span>
              </button>
              <button
                type="button"
                onclick={() => (viewMode = 'preview')}
                class="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all {viewMode === 'preview'
                  ? 'bg-amber-400 text-black font-semibold'
                  : 'text-slate-400 hover:text-white'}"
              >
                <Eye class="w-3 h-3" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          <!-- Main Note Content Area -->
          <div class="flex-1 min-h-[380px] flex flex-col">
            {#if viewMode === 'edit'}
              <!-- Full Edit Mode -->
              <textarea
                bind:this={textareaEl}
                bind:value={activeNote.content}
                oninput={markDirtyAndScheduleSave}
                rows={18}
                placeholder="Write your research notes, outlines, or talking points in Markdown here..."
                class="w-full flex-1 p-4 rounded-xl bg-[#08040d] border border-purple-900/30 text-slate-100 text-sm font-mono leading-relaxed focus:outline-none focus:border-amber-400 resize-none min-h-[380px]"
              ></textarea>
            {:else if viewMode === 'preview'}
              <!-- Full Rendered Markdown Preview -->
              <div class="w-full flex-1 p-5 rounded-xl bg-[#08040d] border border-purple-900/30 overflow-y-auto max-h-[520px] markdown-preview min-h-[380px]">
                {@html renderedHtml}
              </div>
            {:else}
              <!-- Split View: Side-by-Side on Desktop -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[380px]">
                <textarea
                  bind:this={textareaEl}
                  bind:value={activeNote.content}
                  oninput={markDirtyAndScheduleSave}
                  rows={18}
                  placeholder="Markdown source..."
                  class="w-full h-full p-4 rounded-xl bg-[#08040d] border border-purple-900/30 text-slate-100 text-xs font-mono leading-relaxed focus:outline-none focus:border-amber-400 resize-none min-h-[380px]"
                ></textarea>
                <div class="w-full h-full p-4 rounded-xl bg-[#08040d] border border-purple-900/30 overflow-y-auto max-h-[520px] markdown-preview min-h-[380px]">
                  {@html renderedHtml}
                </div>
              </div>
            {/if}
          </div>

          <!-- Footer Stats Bar -->
          <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-purple-900/30">
            <div class="flex items-center gap-3">
              <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
              <span>•</span>
              <span>~{readingTimeMin} min read</span>
              <span>•</span>
              <span class="text-purple-400">Markdown enabled</span>
            </div>
            {#if activeNote.updated_at}
              <span>Last updated {formatUpdatedTime(activeNote.updated_at)}</span>
            {/if}
          </div>
        </div>
      {:else}
        <div class="flex flex-col items-center justify-center h-full text-slate-400 text-xs space-y-3 py-16">
          <StickyNote class="w-8 h-8 text-purple-400/40" />
          <p>Select a note from the list or create a new one to start writing.</p>
          <button
            type="button"
            onclick={handleCreateNewNote}
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-all"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Create First Note</span>
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Markdown Preview Typography Styling */
  :global(.markdown-preview h1) {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin-top: 1rem;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid rgba(147, 51, 234, 0.3);
    padding-bottom: 0.35rem;
  }
  :global(.markdown-preview h2) {
    font-size: 1.25rem;
    font-weight: 700;
    color: #fbbf24;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }
  :global(.markdown-preview h3) {
    font-size: 1.05rem;
    font-weight: 600;
    color: #c084fc;
    margin-top: 0.85rem;
    margin-bottom: 0.4rem;
  }
  :global(.markdown-preview p) {
    color: #cbd5e1;
    font-size: 0.875rem;
    line-height: 1.65;
    margin-bottom: 0.75rem;
  }
  :global(.markdown-preview blockquote) {
    border-left: 3px solid #fbbf24;
    background: rgba(0, 0, 0, 0.4);
    padding: 0.5rem 1rem;
    font-style: italic;
    color: #e2e8f0;
    margin: 0.75rem 0;
    border-radius: 0 0.375rem 0.375rem 0;
  }
  :global(.markdown-preview pre) {
    background: #040108;
    border: 1px solid rgba(147, 51, 234, 0.4);
    border-radius: 0.5rem;
    padding: 0.85rem;
    overflow-x: auto;
    font-family: monospace;
    font-size: 0.75rem;
    color: #e9d5ff;
    margin: 0.75rem 0;
  }
  :global(.markdown-preview code) {
    background: rgba(88, 28, 135, 0.5);
    color: #fde047;
    padding: 0.15rem 0.35rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-family: monospace;
    border: 1px solid rgba(168, 85, 247, 0.3);
  }
  :global(.markdown-preview pre code) {
    background: transparent;
    padding: 0;
    border: none;
    color: inherit;
  }
  :global(.markdown-preview ul) {
    list-style-type: disc;
    padding-left: 1.25rem;
    margin-bottom: 0.75rem;
    color: #cbd5e1;
    font-size: 0.875rem;
  }
  :global(.markdown-preview ol) {
    list-style-type: decimal;
    padding-left: 1.25rem;
    margin-bottom: 0.75rem;
    color: #cbd5e1;
    font-size: 0.875rem;
  }
  :global(.markdown-preview li) {
    margin-bottom: 0.25rem;
    line-height: 1.5;
  }
  :global(.markdown-preview a) {
    color: #fbbf24;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  :global(.markdown-preview a:hover) {
    color: #fde047;
  }
  :global(.markdown-preview hr) {
    border: none;
    border-top: 1px solid rgba(147, 51, 234, 0.3);
    margin: 1.25rem 0;
  }
  :global(.markdown-preview table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0.75rem 0;
    font-size: 0.75rem;
  }
  :global(.markdown-preview th),
  :global(.markdown-preview td) {
    border: 1px solid rgba(147, 51, 234, 0.35);
    padding: 0.5rem 0.75rem;
    text-align: left;
  }
  :global(.markdown-preview th) {
    background: rgba(88, 28, 135, 0.3);
    color: #ffffff;
    font-weight: 600;
  }
  :global(.markdown-preview input[type="checkbox"]) {
    margin-right: 0.5rem;
    accent-color: #fbbf24;
  }
</style>
