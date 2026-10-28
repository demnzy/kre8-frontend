<script lang="ts">
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import { X, Lightbulb, Video, CheckSquare, StickyNote, Plus } from 'lucide-svelte';

  type CaptureType = 'idea' | 'content' | 'task' | 'note';
  let captureType = $state<CaptureType>('idea');

  // Form states
  let title = $state('');
  let description = $state('');
  let platform = $state('YouTube');
  let priority = $state<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  let format = $state('Video');
  let folder = $state('General');
  let dueDate = $state('');
  let isSubmitting = $state(false);

  function defaultTomorrowDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  function resetForm() {
    title = '';
    description = '';
    platform = 'YouTube';
    priority = 'Medium';
    format = 'Video';
    folder = 'General';
    dueDate = defaultTomorrowDate();
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      isSubmitting = true;
      if (captureType === 'idea') {
        const created = await api.createIdea({
          title: title.trim(),
          description: description.trim(),
          intended_platform: platform,
          priority,
          category: appState.preferences.primary_niche,
          status: 'Active'
        });
        appState.counts.ideas = (appState.counts.ideas || 0) + 1;
        appState.showToast(`Saved idea: "${created.title}"`, 'success');
      } else if (captureType === 'content') {
        const created = await api.createContentItem({
          title: title.trim(),
          description: description.trim(),
          platform,
          format,
          category: appState.preferences.primary_niche,
          status: 'Idea',
          priority
        });
        appState.counts.activeContent = (appState.counts.activeContent || 0) + 1;
        appState.showToast(`Added to Content Pipeline: "${created.title}"`, 'success');
      } else if (captureType === 'task') {
        const targetDue = dueDate ? `${dueDate}T12:00:00` : `${defaultTomorrowDate()}T12:00:00`;
        const created = await api.createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          due_date: targetDue,
          priority,
          is_completed: false,
          checklist: []
        });
        appState.counts.tasksDueToday = (appState.counts.tasksDueToday || 0) + 1;
        appState.showToast(`Created task: "${created.title}"`, 'success');
      } else if (captureType === 'note') {
        const created = await api.createNote({
          title: title.trim(),
          content: description.trim(),
          folder: folder || 'General',
          tags: ['quick-capture']
        });
        appState.showToast(`Saved note: "${created.title}"`, 'success');
      }

      resetForm();
      appState.quickCaptureOpen = false;
      appState.triggerRefresh();
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to save', 'error');
    } finally {
      isSubmitting = false;
    }
  }
</script>

{#if appState.quickCaptureOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
    <!-- Click backdrop to close -->
    <button
      type="button"
      onclick={() => (appState.quickCaptureOpen = false)}
      class="absolute inset-0 cursor-default"
      aria-label="Close modal"
    ></button>

    <div class="relative w-full max-w-lg swiss-card border border-purple-800 bg-[#10071c] shadow-2xl overflow-hidden z-10 space-y-4 p-6">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
        <div class="flex items-center gap-2">
          <Plus class="w-4 h-4 text-amber-400" />
          <h3 class="text-base font-bold text-white font-display">Quick Capture</h3>
          <span class="swiss-tag text-purple-400 font-mono text-[9px]">Fast Entry</span>
        </div>
        <button
          type="button"
          onclick={() => (appState.quickCaptureOpen = false)}
          class="text-slate-400 hover:text-white p-1 transition-colors"
          aria-label="Close"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Type Switcher Tabs -->
      <div class="grid grid-cols-4 gap-2">
        <button
          type="button"
          onclick={() => (captureType = 'idea')}
          class="flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-mono transition-all {captureType === 'idea'
            ? 'bg-amber-400 text-black font-bold'
            : 'bg-black/60 text-slate-400 hover:text-white border border-purple-900/60'}"
        >
          <Lightbulb class="w-3.5 h-3.5" />
          <span>Idea</span>
        </button>

        <button
          type="button"
          onclick={() => (captureType = 'content')}
          class="flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-mono transition-all {captureType === 'content'
            ? 'bg-amber-400 text-black font-bold'
            : 'bg-black/60 text-slate-400 hover:text-white border border-purple-900/60'}"
        >
          <Video class="w-3.5 h-3.5" />
          <span>Content</span>
        </button>

        <button
          type="button"
          onclick={() => { captureType = 'task'; if (!dueDate) dueDate = defaultTomorrowDate(); }}
          class="flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-mono transition-all {captureType === 'task'
            ? 'bg-amber-400 text-black font-bold'
            : 'bg-black/60 text-slate-400 hover:text-white border border-purple-900/60'}"
        >
          <CheckSquare class="w-3.5 h-3.5" />
          <span>Task</span>
        </button>

        <button
          type="button"
          onclick={() => (captureType = 'note')}
          class="flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-mono transition-all {captureType === 'note'
            ? 'bg-amber-400 text-black font-bold'
            : 'bg-black/60 text-slate-400 hover:text-white border border-purple-900/60'}"
        >
          <StickyNote class="w-3.5 h-3.5" />
          <span>Note</span>
        </button>
      </div>

      <!-- Form -->
      <form onsubmit={handleSubmit} class="space-y-3.5">
        <div>
          <label for="capture-title" class="block swiss-tag text-slate-400 mb-1">
            {captureType === 'idea' ? 'Idea Title' : captureType === 'content' ? 'Content Title' : captureType === 'task' ? 'Task' : 'Note Title'}
          </label>
          <input
            id="capture-title"
            type="text"
            bind:value={title}
            placeholder={captureType === 'idea' ? 'e.g. 5 AI tools changing developer workflows...' : captureType === 'task' ? 'e.g. Export 4K cut and review thumbnail' : 'Enter title...'}
            required
            class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label for="capture-desc" class="block swiss-tag text-slate-400 mb-1">
            {captureType === 'note' ? 'Content' : captureType === 'task' ? 'Details (optional)' : 'Description / Angles'}
          </label>
          <textarea
            id="capture-desc"
            bind:value={description}
            rows={captureType === 'note' ? 4 : 2}
            placeholder={captureType === 'note' ? 'Write your thoughts or reference notes...' : 'Key talking points, hooks, or notes...'}
            class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400 leading-relaxed"
          ></textarea>
        </div>

        {#if captureType === 'idea' || captureType === 'content'}
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label for="capture-plat" class="block swiss-tag text-slate-400 mb-1">Platform</label>
              <select
                id="capture-plat"
                bind:value={platform}
                class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              >
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Instagram">Instagram</option>
                <option value="X">X</option>
              </select>
            </div>

            {#if captureType === 'content'}
              <div>
                <label for="capture-fmt" class="block swiss-tag text-slate-400 mb-1">Format</label>
                <select
                  id="capture-fmt"
                  bind:value={format}
                  class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                >
                  <option value="Video">Video</option>
                  <option value="Short/Reel">Short/Reel</option>
                  <option value="Carousel">Carousel</option>
                  <option value="Article">Article</option>
                </select>
              </div>
            {/if}

            <div>
              <label for="capture-prio" class="block swiss-tag text-slate-400 mb-1">Priority</label>
              <select
                id="capture-prio"
                bind:value={priority}
                class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
        {:else if captureType === 'task'}
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="capture-task-due" class="block swiss-tag text-slate-400 mb-1">Due Date</label>
              <input
                id="capture-task-due"
                type="date"
                bind:value={dueDate}
                class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label for="capture-task-prio" class="block swiss-tag text-slate-400 mb-1">Priority</label>
              <select
                id="capture-task-prio"
                bind:value={priority}
                class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
        {:else if captureType === 'note'}
          <div>
            <label for="capture-note-folder" class="block swiss-tag text-slate-400 mb-1">Folder</label>
            <select
              id="capture-note-folder"
              bind:value={folder}
              class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
            >
              <option value="General">General</option>
              <option value="Research">Research</option>
              <option value="Script Drafts">Script Drafts</option>
              <option value="Competitors">Competitors</option>
              <option value="Sponsors">Sponsors</option>
            </select>
          </div>
        {/if}

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-purple-900/40">
          <button
            type="button"
            onclick={() => (appState.quickCaptureOpen = false)}
            class="px-4 py-2 text-xs text-slate-400 hover:text-white font-mono transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            class="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display tracking-wider transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
