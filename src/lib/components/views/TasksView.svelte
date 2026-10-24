<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import type { Task, TaskChecklistItem } from '../../types';
  import {
    CheckSquare,
    Plus,
    Clock,
    AlertCircle,
    CheckCircle2,
    Trash2,
    Calendar,
    ChevronDown,
    ListTodo
  } from 'lucide-svelte';

  type TaskFilter = 'all' | 'pending' | 'completed' | 'urgent';
  let activeFilter = $state<TaskFilter>('all');
  let tasks = $state<Task[]>([]);
  let isLoading = $state(false);

  // New Task form state
  let showCreateModal = $state(false);
  let newTitle = $state('');
  let newDescription = $state('');
  let newPriority = $state<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  let newDueDate = $state('2026-10-25');
  let newChecklistRaw = $state('');

  onMount(loadTasks);

  async function loadTasks() {
    try {
      isLoading = true;
      tasks = await api.getTasks();
    } catch (e: any) {
      console.error(e);
    } finally {
      isLoading = false;
    }
  }

  let filteredTasks = $derived(
    tasks.filter(t => {
      if (activeFilter === 'pending') return !t.is_completed;
      if (activeFilter === 'completed') return t.is_completed;
      if (activeFilter === 'urgent') return !t.is_completed && (t.priority === 'Urgent' || t.priority === 'High');
      return true;
    })
  );

  async function toggleTaskComplete(task: Task) {
    try {
      const updated = await api.updateTask(task.id, { is_completed: !task.is_completed });
      tasks = tasks.map(t => (t.id === task.id ? updated : t));
      appState.showToast(updated.is_completed ? 'Task completed!' : 'Marked active', 'info');
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to update', 'error');
    }
  }

  async function toggleChecklistItem(task: Task, itemIndex: number) {
    const updatedChecklist = task.checklist.map((c, idx) =>
      idx === itemIndex ? { ...c, done: !c.done } : c
    );
    try {
      const updated = await api.updateTask(task.id, { checklist: updatedChecklist });
      tasks = tasks.map(t => (t.id === task.id ? updated : t));
    } catch (e: any) {
      console.error(e);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteTask(id);
      tasks = tasks.filter(t => t.id !== id);
      appState.showToast('Task deleted', 'info');
    } catch (e: any) {
      appState.showToast(e.message || 'Delete failed', 'error');
    }
  }

  async function handleCreateTask(e: Event) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const checklistItems = newChecklistRaw
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(text => ({ text, done: false }));

    try {
      const created = await api.createTask({
        title: newTitle,
        description: newDescription,
        priority: newPriority,
        due_date: newDueDate ? new Date(newDueDate).toISOString() : undefined,
        is_completed: false,
        checklist: checklistItems
      });
      tasks = [created, ...tasks];
      newTitle = '';
      newDescription = '';
      newChecklistRaw = '';
      showCreateModal = false;
      appState.showToast(`Task created: "${created.title}"`, 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to create task', 'error');
    }
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <!-- Swiss Header -->
  <div class="p-6 bg-[#10071c] border border-purple-900/30 relative">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <span class="font-mono text-[10px] tracking-widest text-amber-400 uppercase">Production Tasks</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display flex items-center gap-2.5">
          <CheckSquare class="w-6 h-6 text-amber-400" />
          <span>Production Tasks & Checklist</span>
        </h1>
        <p class="text-xs text-slate-400 mt-1 max-w-xl">
          Actionable shoot checklists, editing checkpoints, and multi-channel asset deliverables.
        </p>
      </div>

      <button
        onclick={() => (showCreateModal = true)}
        class="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold font-mono tracking-wider uppercase transition-all shadow-md shadow-amber-500/10"
      >
        <Plus class="w-4 h-4" />
        <span>New Task</span>
      </button>
    </div>
  </div>

  <!-- Swiss Filter Tabs -->
  <div class="flex border-b border-purple-900/30 gap-6 font-mono text-xs uppercase tracking-wider">
    {#each [{ id: 'all', label: `ALL [${tasks.length}]` }, { id: 'pending', label: `PENDING [${tasks.filter(t => !t.is_completed).length}]` }, { id: 'urgent', label: 'URGENT / HIGH' }, { id: 'completed', label: 'COMPLETED' }] as tab}
      <button
        onclick={() => (activeFilter = tab.id as TaskFilter)}
        class="pb-3 transition-colors relative {activeFilter === tab.id
          ? 'text-amber-400 font-bold'
          : 'text-slate-400 hover:text-slate-200'}"
      >
        <span>{tab.label}</span>
        {#if activeFilter === tab.id}
          <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"></div>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Task List -->
  {#if filteredTasks.length === 0}
    <div class="text-center py-16 bg-[#10071c] border border-purple-900/30 text-slate-500 font-mono text-xs uppercase tracking-wider">
      No tasks match this filter. Pipeline clear.
    </div>
  {:else}
    <div class="space-y-3">
      {#each filteredTasks as task}
        <div class="p-5 bg-[#10071c] border border-purple-900/30 hover:border-amber-400/40 transition-all space-y-3 {task.is_completed ? 'opacity-60 bg-[#0c0515]' : ''}">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-3 flex-1">
              <button
                onclick={() => toggleTaskComplete(task)}
                class="mt-0.5 w-5 h-5 border flex items-center justify-center transition-colors {task.is_completed
                  ? 'bg-amber-400 border-amber-400 text-black'
                  : 'border-purple-500/50 hover:border-amber-400 text-transparent'}"
              >
                <CheckCircle2 class="w-3.5 h-3.5 fill-current" />
              </button>

              <div class="space-y-1.5 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-bold font-display text-white {task.is_completed ? 'line-through text-slate-400' : ''}">
                    {task.title}
                  </span>
                  <span class="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border {task.priority === 'Urgent'
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/40'
                    : task.priority === 'High'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                    : 'bg-purple-950/40 text-purple-300 border-purple-800/40'}">
                    {task.priority}
                  </span>
                </div>

                {#if task.description}
                  <p class="text-xs text-slate-400 leading-relaxed max-w-3xl">
                    {task.description}
                  </p>
                {/if}
              </div>
            </div>

            <button
              onclick={() => handleDelete(task.id)}
              class="text-slate-600 hover:text-rose-400 p-1 transition-colors"
              title="Delete task"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <!-- Checklist items -->
          {#if task.checklist && task.checklist.length > 0}
            <div class="pl-8 pt-3 border-t border-purple-900/30 space-y-2">
              {#each task.checklist as check, cIdx}
                <button
                  onclick={() => toggleChecklistItem(task, cIdx)}
                  class="flex items-center gap-2.5 text-xs text-left w-full hover:text-slate-100 transition-colors group {check.done ? 'line-through text-slate-500' : 'text-slate-300'}"
                >
                  <span class="w-3.5 h-3.5 border flex items-center justify-center font-mono text-[9px] {check.done ? 'bg-amber-400 border-amber-400 text-black font-bold' : 'border-purple-600/60'}">
                    {check.done ? '✓' : ''}
                  </span>
                  <span class="font-sans">{check.text}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- Swiss Add Task Modal -->
  {#if showCreateModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div class="relative w-full max-w-md bg-[#10071c] border border-amber-400/40 p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-purple-900/30 pb-3">
          <div class="flex items-center gap-2">
            <span class="font-mono text-[10px] tracking-widest text-amber-400 uppercase">[ TASK DEFINITION ]</span>
            <h3 class="text-base font-bold text-white font-display">Create Production Task</h3>
          </div>
          <button onclick={() => (showCreateModal = false)} class="font-mono text-xs text-slate-400 hover:text-white">✕</button>
        </div>

        <form onsubmit={handleCreateTask} class="space-y-4">
          <div>
            <label for="task-title-input" class="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Task Title</label>
            <input
              id="task-title-input"
              type="text"
              bind:value={newTitle}
              placeholder="e.g. Record 4K A-Roll for Agent Architecture Video"
              required
              class="w-full px-3 py-2 bg-[#08040d] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label for="task-desc-input" class="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Details & Production Context</label>
            <textarea
              id="task-desc-input"
              bind:value={newDescription}
              rows={2}
              placeholder="Camera lens, sound levels, or specific b-roll shots needed..."
              class="w-full px-3 py-2 bg-[#08040d] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-amber-400"
            ></textarea>
          </div>

          <div>
            <label for="task-checklist-input" class="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Checklist Items (one per line)</label>
            <textarea
              id="task-checklist-input"
              bind:value={newChecklistRaw}
              rows={3}
              placeholder="Check 5600K key light balance&#10;Record 3 variations of hook statement&#10;Verify wireless lavalier gain"
              class="w-full px-3 py-2 bg-[#08040d] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-amber-400 font-mono text-[11px]"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="task-prio-select" class="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Priority</label>
              <select
                id="task-prio-select"
                bind:value={newPriority}
                class="w-full px-3 py-2 bg-[#08040d] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label for="task-due-input" class="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Target Date</label>
              <input
                id="task-due-input"
                type="date"
                bind:value={newDueDate}
                class="w-full px-2.5 py-2 bg-[#08040d] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-purple-900/30">
            <button
              type="button"
              onclick={() => (showCreateModal = false)}
              class="px-4 py-2 font-mono text-xs uppercase tracking-wider text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs uppercase tracking-wider"
            >
              Commit Task
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
