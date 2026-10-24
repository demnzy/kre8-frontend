<script lang="ts">
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import { X, Lightbulb, Video, CheckSquare, StickyNote, Sparkles } from 'lucide-svelte';

  type CaptureType = 'idea' | 'content' | 'task' | 'note';
  let captureType = $state<CaptureType>('idea');

  // Form states
  let title = $state('');
  let description = $state('');
  let platform = $state('YouTube');
  let priority = $state<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  let format = $state('Video');
  let category = $state('Technology');
  let isSubmitting = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      isSubmitting = true;
      if (captureType === 'idea') {
        await api.createIdea({
          title,
          description,
          intended_platform: platform,
          priority,
          category,
          status: 'Active'
        });
        appState.showToast(`Saved idea: "${title}"`, 'success');
      } else if (captureType === 'content') {
        await api.createContentItem({
          title,
          description,
          platform,
          format,
          category,
          status: 'Idea',
          priority
        });
        appState.showToast(`Created content item: "${title}"`, 'success');
      } else if (captureType === 'task') {
        await api.createTask({
          title,
          description,
          priority,
          is_completed: false
        });
        appState.showToast(`Created task: "${title}"`, 'success');
      } else if (captureType === 'note') {
        await api.createNote({
          title,
          content: description,
          folder: 'Quick Capture'
        });
        appState.showToast(`Saved note: "${title}"`, 'success');
      }

      // Reset
      title = '';
      description = '';
      appState.quickCaptureOpen = false;
      // Refresh current view
      const curr = appState.activeModule;
      appState.setModule(curr);
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to save', 'error');
    } finally {
      isSubmitting = false;
    }
  }
</script>

{#if appState.quickCaptureOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
    <!-- Click backdrop to close -->
    <button
      type="button"
      onclick={() => (appState.quickCaptureOpen = false)}
      class="absolute inset-0 cursor-default"
      aria-label="Close modal"
    ></button>

    <div class="relative w-full max-w-lg glass-panel rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden z-10">
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-violet-600/20 text-violet-400">
            <Sparkles class="w-4 h-4" />
          </div>
          <span class="font-bold text-base text-white">Quick Capture</span>
        </div>
        <button
          onclick={() => (appState.quickCaptureOpen = false)}
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Type Switcher Tabs -->
      <div class="grid grid-cols-4 border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1">
        <button
          type="button"
          onclick={() => (captureType = 'idea')}
          class="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all {captureType === 'idea'
            ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}"
        >
          <Lightbulb class="w-3.5 h-3.5" />
          <span>Idea</span>
        </button>

        <button
          type="button"
          onclick={() => (captureType = 'content')}
          class="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all {captureType === 'content'
            ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}"
        >
          <Video class="w-3.5 h-3.5" />
          <span>Content</span>
        </button>

        <button
          type="button"
          onclick={() => (captureType = 'task')}
          class="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all {captureType === 'task'
            ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}"
        >
          <CheckSquare class="w-3.5 h-3.5" />
          <span>Task</span>
        </button>

        <button
          type="button"
          onclick={() => (captureType = 'note')}
          class="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all {captureType === 'note'
            ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}"
        >
          <StickyNote class="w-3.5 h-3.5" />
          <span>Note</span>
        </button>
      </div>

      <!-- Form -->
      <form onsubmit={handleSubmit} class="p-6 space-y-4">
        <div>
          <label for="capture-title" class="block text-xs font-semibold text-slate-300 mb-1.5">
            {captureType === 'idea' ? 'Idea Title' : captureType === 'content' ? 'Content Title' : captureType === 'task' ? 'Task Description' : 'Note Title'}
          </label>
          <input
            id="capture-title"
            type="text"
            bind:value={title}
            placeholder={captureType === 'idea' ? 'e.g. 5 AI tools changing developer workflows...' : 'Enter title...'}
            required
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
          />
        </div>

        <div>
          <label for="capture-desc" class="block text-xs font-semibold text-slate-300 mb-1.5">
            {captureType === 'note' ? 'Note Content (Markdown supported)' : 'Details / Talking Points / Angles'}
          </label>
          <textarea
            id="capture-desc"
            bind:value={description}
            rows={captureType === 'note' ? 5 : 3}
            placeholder="Add any extra thoughts, links, or notes..."
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
          ></textarea>
        </div>

        {#if captureType === 'idea' || captureType === 'content'}
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="capture-plat" class="block text-xs font-semibold text-slate-300 mb-1.5">Platform</label>
              <select
                id="capture-plat"
                bind:value={platform}
                class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Instagram">Instagram</option>
                <option value="X">X (Twitter)</option>
              </select>
            </div>

            <div>
              <label for="capture-prio" class="block text-xs font-semibold text-slate-300 mb-1.5">Priority</label>
              <select
                id="capture-prio"
                bind:value={priority}
                class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
        {/if}

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onclick={() => (appState.quickCaptureOpen = false)}
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            class="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save to Workspace'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
