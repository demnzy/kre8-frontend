<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import { portal } from '../../utils/portal';
  import LoadError from '../layout/LoadError.svelte';
  import type { Task, ContentItem } from '../../types';
  import {
    CheckSquare,
    Plus,
    Calendar,
    CheckCircle2,
    Trash2,
    Edit3,
    Video,
    Search,
    X,
  } from "lucide-svelte";

  type TaskFilter = "all" | "pending" | "urgent" | "completed";
  let activeFilter = $state<TaskFilter>("all");
  let searchQuery = $state("");
  let tasks = $state<Task[]>([]);
  let contentItems = $state<ContentItem[]>([]);
  let isLoading = $state(false);
  let loadError = $state<string | null>(null);

  // Inline checklist input per task
  let inlineStepInputs = $state<Record<number, string>>({});

  // Create / Edit Task modal state
  let showModal = $state(false);
  let editingTaskId = $state<number | null>(null);
  let formTitle = $state("");
  let formDescription = $state("");
  let formPriority = $state<"Low" | "Medium" | "High" | "Urgent">("Medium");
  let formDueDate = $state("");
  let formContentItemId = $state<string>("");
  let formChecklistRaw = $state("");

  function defaultTomorrowDate(): string {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().slice(0, 10);
  }

  onMount(loadTasks);

  async function loadTasks() {
    isLoading = true;
    loadError = null;
    const [tasksRes, contentRes] = await Promise.allSettled([
      api.getTasks(),
      api.getContentItems(),
    ]);
    if (tasksRes.status === "fulfilled") tasks = tasksRes.value;
    if (contentRes.status === "fulfilled") contentItems = contentRes.value;
    if (tasksRes.status === "rejected") {
      loadError = tasksRes.reason?.message || "Couldn't load your tasks.";
    }
    isLoading = false;
  }

  let filteredTasks = $derived(
    tasks.filter((t) => {
      if (activeFilter === "pending" && t.is_completed) return false;
      if (activeFilter === "completed" && !t.is_completed) return false;
      if (
        activeFilter === "urgent" &&
        (t.is_completed || (t.priority !== "Urgent" && t.priority !== "High"))
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = t.title.toLowerCase().includes(q);
        const inDesc = (t.description || "").toLowerCase().includes(q);
        return inTitle || inDesc;
      }
      return true;
    }),
  );

  function openCreateModal() {
    editingTaskId = null;
    formTitle = "";
    formDescription = "";
    formPriority = "Medium";
    formDueDate = defaultTomorrowDate();
    formContentItemId = "";
    formChecklistRaw = "";
    showModal = true;
  }

  function openEditModal(task: Task) {
    editingTaskId = task.id;
    formTitle = task.title;
    formDescription = task.description || "";
    formPriority = task.priority || "Medium";
    formDueDate = task.due_date ? task.due_date.slice(0, 10) : "";
    formContentItemId = task.content_item_id
      ? String(task.content_item_id)
      : "";
    formChecklistRaw = (task.checklist || []).map((c) => c.text).join("\n");
    showModal = true;
  }

  async function handleSaveTask(e: Event) {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const existingTask = editingTaskId
      ? tasks.find((t) => t.id === editingTaskId)
      : null;
    const existingDoneMap = new Map(
      (existingTask?.checklist || []).map((c) => [
        c.text.trim().toLowerCase(),
        c.done,
      ]),
    );

    const checklistItems = formChecklistRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text) => ({
        text,
        done: existingDoneMap.get(text.toLowerCase()) ?? false,
      }));

    const payload: Partial<Task> = {
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      priority: formPriority,
      due_date: formDueDate
        ? new Date(`${formDueDate}T12:00:00`).toISOString()
        : undefined,
      content_item_id: formContentItemId
        ? Number(formContentItemId)
        : undefined,
      checklist: checklistItems,
    };

    try {
      if (editingTaskId) {
        const updated = await api.updateTask(editingTaskId, payload);
        tasks = tasks.map((t) => (t.id === editingTaskId ? updated : t));
        appState.showToast("Task updated", "success");
      } else {
        const created = await api.createTask({
          ...payload,
          is_completed: false,
        });
        tasks = [created, ...tasks];
        appState.showToast(`Task created: "${created.title}"`, "success");
      }
      showModal = false;
    } catch (e: any) {
      appState.showToast(e.message || "Could not save task", "error");
    }
  }

  async function toggleTaskComplete(task: Task) {
    try {
      const updated = await api.updateTask(task.id, {
        is_completed: !task.is_completed,
      });
      tasks = tasks.map((t) => (t.id === task.id ? updated : t));
      appState.showToast(
        updated.is_completed ? "Task completed!" : "Task reopened",
        "info",
      );
    } catch (e: any) {
      appState.showToast(e.message || "Failed to update task", "error");
    }
  }

  async function toggleChecklistItem(task: Task, itemIndex: number) {
    const updatedChecklist = (task.checklist || []).map((c, idx) =>
      idx === itemIndex ? { ...c, done: !c.done } : c,
    );
    try {
      const updated = await api.updateTask(task.id, {
        checklist: updatedChecklist,
      });
      tasks = tasks.map((t) => (t.id === task.id ? updated : t));
    } catch (e: any) {
      appState.showToast(e.message || "Could not update checklist", "error");
    }
  }

  async function addInlineChecklistItem(task: Task) {
    const text = (inlineStepInputs[task.id] || "").trim();
    if (!text) return;
    const updatedChecklist = [...(task.checklist || []), { text, done: false }];
    try {
      const updated = await api.updateTask(task.id, {
        checklist: updatedChecklist,
      });
      tasks = tasks.map((t) => (t.id === task.id ? updated : t));
      inlineStepInputs = { ...inlineStepInputs, [task.id]: "" };
    } catch (e: any) {
      appState.showToast(e.message || "Could not add step", "error");
    }
  }

  async function removeChecklistItem(task: Task, itemIndex: number) {
    const updatedChecklist = (task.checklist || []).filter(
      (_, idx) => idx !== itemIndex,
    );
    try {
      const updated = await api.updateTask(task.id, {
        checklist: updatedChecklist,
      });
      tasks = tasks.map((t) => (t.id === task.id ? updated : t));
    } catch (e: any) {
      appState.showToast(e.message || "Could not remove step", "error");
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteTask(id);
      tasks = tasks.filter((t) => t.id !== id);
      appState.showToast("Task deleted", "info");
    } catch (e: any) {
      appState.showToast(e.message || "Delete failed", "error");
    }
  }

  function formatDueDate(
    iso?: string,
  ): { label: string; isOverdue: boolean } | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round(
      (target.getTime() - today.getTime()) / 86400000,
    );
    if (diffDays === 0) return { label: "Due today", isOverdue: false };
    if (diffDays === 1) return { label: "Due tomorrow", isOverdue: false };
    if (diffDays < 0) {
      return {
        label: `Overdue (${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })})`,
        isOverdue: true,
      };
    }
    return {
      label: `Due ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      isOverdue: false,
    };
  }

  function getLinkedContentTitle(contentId?: number): string | null {
    if (!contentId) return null;
    return contentItems.find((c) => c.id === contentId)?.title || null;
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  {#if loadError}
    <LoadError message={loadError} onRetry={loadTasks} />
  {/if}

  <!-- Header -->
  <div class="swiss-card p-6 border border-purple-900/40 bg-[#10071c]">
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-medium text-amber-400"
            >Production Checklist</span
          >
        </div>
        <h1
          class="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5"
        >
          <CheckSquare class="w-6 h-6 text-amber-400" />
          <span>Tasks & Checklists</span>
        </h1>
        <p class="text-xs text-slate-400 mt-1 max-w-xl">
          Manage filming checklists, editing steps, and channel deliverables.
        </p>
      </div>

      <button
        type="button"
        onclick={openCreateModal}
        class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-all shadow-sm shrink-0"
      >
        <Plus class="w-4 h-4" />
        <span>New Task</span>
      </button>
    </div>
  </div>

  <!-- Filter Tabs & Search -->
  <div
    class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/30 pb-3"
  >
    <div class="flex items-center gap-2 overflow-x-auto">
      {#each [{ id: "all", label: `All (${tasks.length})` }, { id: "pending", label: `To Do (${tasks.filter((t) => !t.is_completed).length})` }, { id: "urgent", label: `High Priority (${tasks.filter((t) => !t.is_completed && (t.priority === "Urgent" || t.priority === "High")).length})` }, { id: "completed", label: `Completed (${tasks.filter((t) => t.is_completed).length})` }] as tab}
        <button
          type="button"
          onclick={() => (activeFilter = tab.id as TaskFilter)}
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 {activeFilter ===
          tab.id
            ? 'bg-amber-400 text-black font-semibold'
            : 'bg-purple-950/30 text-slate-400 hover:text-white'}"
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <div class="relative w-full sm:w-64">
      <Search
        class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Filter tasks..."
        class="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#10071c] border border-purple-900/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
      />
    </div>
  </div>

  <!-- Task List -->
  {#if filteredTasks.length === 0}
    <div
      class="swiss-card text-center py-16 bg-[#10071c] border border-purple-900/30 space-y-3"
    >
      <CheckSquare class="w-8 h-8 text-purple-400/50 mx-auto" />
      <p class="text-slate-400 text-xs">
        {tasks.length === 0
          ? "No tasks yet. Create your first task to get started."
          : "No tasks match your current filter."}
      </p>
      {#if tasks.length === 0}
        <button
          type="button"
          onclick={openCreateModal}
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-all"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add First Task</span>
        </button>
      {/if}
    </div>
  {:else}
    <div class="space-y-3">
      {#each filteredTasks as task}
        {@const dueInfo = formatDueDate(task.due_date)}
        {@const linkedTitle = getLinkedContentTitle(task.content_item_id)}
        {@const doneCount = (task.checklist || []).filter((c) => c.done).length}
        {@const totalSteps = (task.checklist || []).length}
        <div
          class="swiss-card p-5 border border-purple-900/40 hover:border-amber-400/40 transition-all space-y-3 {task.is_completed
            ? 'opacity-65 bg-[#0c0515]'
            : ''}"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-3 flex-1">
              <button
                type="button"
                onclick={() => toggleTaskComplete(task)}
                class="mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 {task.is_completed
                  ? 'bg-amber-400 border-amber-400 text-black'
                  : 'border-purple-500/60 hover:border-amber-400 text-transparent'}"
                title={task.is_completed ? "Mark incomplete" : "Mark complete"}
              >
                <CheckCircle2 class="w-3.5 h-3.5" />
              </button>

              <div class="space-y-1.5 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="text-sm font-semibold text-white {task.is_completed
                      ? 'line-through text-slate-400'
                      : ''}"
                  >
                    {task.title}
                  </span>

                  <span
                    class="px-2 py-0.5 rounded-full text-[11px] font-medium border {task.priority ===
                    'Urgent'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      : task.priority === 'High'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : 'bg-purple-950/50 text-purple-200 border-purple-800/40'}"
                  >
                    {task.priority}
                  </span>

                  {#if dueInfo}
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border {dueInfo.isOverdue &&
                      !task.is_completed
                        ? 'bg-rose-950/60 text-rose-300 border-rose-500/40 font-medium'
                        : 'bg-black/40 text-slate-300 border-purple-900/40'}"
                    >
                      <Calendar class="w-3 h-3 text-amber-400" />
                      <span>{dueInfo.label}</span>
                    </span>
                  {/if}

                  {#if linkedTitle}
                    <button
                      type="button"
                      onclick={() => appState.setModule("content")}
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-purple-950/60 text-purple-200 border border-purple-700/40 hover:border-amber-400/50 transition-colors"
                      title="Open in Content Board"
                    >
                      <Video class="w-3 h-3 text-amber-400" />
                      <span class="truncate max-w-[180px]">{linkedTitle}</span>
                    </button>
                  {/if}

                  {#if totalSteps > 0}
                    <span class="text-[11px] text-slate-400">
                      {doneCount}/{totalSteps} steps
                    </span>
                  {/if}
                </div>

                {#if task.description}
                  <p class="text-xs text-slate-400 leading-relaxed max-w-3xl">
                    {task.description}
                  </p>
                {/if}
              </div>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onclick={() => openEditModal(task)}
                class="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-purple-950/50 transition-colors"
                title="Edit task"
              >
                <Edit3 class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onclick={() => handleDelete(task.id)}
                class="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors"
                title="Delete task"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Checklist items & inline add -->
          <div class="pl-8 pt-2.5 border-t border-purple-900/25 space-y-2">
            {#if task.checklist && task.checklist.length > 0}
              {#each task.checklist as check, cIdx}
                <div class="flex items-center justify-between gap-2 group">
                  <button
                    type="button"
                    onclick={() => toggleChecklistItem(task, cIdx)}
                    class="flex items-center gap-2.5 text-xs text-left flex-1 hover:text-slate-100 transition-colors {check.done
                      ? 'line-through text-slate-500'
                      : 'text-slate-300'}"
                  >
                    <span
                      class="w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 {check.done
                        ? 'bg-amber-400 border-amber-400 text-black font-bold'
                        : 'border-purple-600/60'}"
                    >
                      {check.done ? "✓" : ""}
                    </span>
                    <span>{check.text}</span>
                  </button>
                  <button
                    type="button"
                    onclick={() => removeChecklistItem(task, cIdx)}
                    class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 transition-opacity"
                    title="Remove checklist item"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </div>
              {/each}
            {/if}

            <!-- Quick inline step adder -->
            <div class="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={inlineStepInputs[task.id] || ""}
                oninput={(e) =>
                  (inlineStepInputs = {
                    ...inlineStepInputs,
                    [task.id]: (e.currentTarget as HTMLInputElement).value,
                  })}
                onkeydown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addInlineChecklistItem(task);
                  }
                }}
                placeholder="+ Add a checklist step..."
                class="flex-1 max-w-sm px-2.5 py-1 rounded-md bg-black/40 border border-purple-900/40 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              {#if (inlineStepInputs[task.id] || "").trim()}
                <button
                  type="button"
                  onclick={() => addInlineChecklistItem(task)}
                  class="px-2.5 py-1 rounded-md bg-purple-900/60 hover:bg-purple-800 text-amber-300 text-xs font-medium"
                >
                  Add
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Create / Edit Task Modal -->
  {#if showModal}
    <div use:portal class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <button
        type="button"
        onclick={() => (showModal = false)}
        class="absolute inset-0 cursor-default"
        aria-label="Close modal"
      ></button>

      <div
        class="relative w-full max-w-md bg-[#11081d] border border-purple-800/40 rounded-2xl p-6 space-y-4 shadow-2xl z-10 modal-spring"
      >
        <div
          class="flex items-center justify-between border-b border-purple-900/30 pb-3"
        >
          <div>
            <span class="text-xs font-medium text-amber-400"
              >{editingTaskId ? "Edit Task" : "New Task"}</span
            >
            <h3 class="text-base font-bold text-white">
              {editingTaskId ? "Update Task" : "Create Task"}
            </h3>
          </div>
          <button
            type="button"
            onclick={() => (showModal = false)}
            class="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <form onsubmit={handleSaveTask} class="space-y-3.5">
          <div>
            <label
              for="task-title-input"
              class="block text-xs font-medium text-slate-300 mb-1"
              >Task Title</label
            >
            <input
              id="task-title-input"
              type="text"
              bind:value={formTitle}
              placeholder="e.g. Record A-Roll for Agent Architecture video"
              required
              class="w-full px-3.5 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label
              for="task-desc-input"
              class="block text-xs font-medium text-slate-300 mb-1"
              >Notes & Details</label
            >
            <textarea
              id="task-desc-input"
              bind:value={formDescription}
              rows={2}
              placeholder="Camera setup, audio notes, or links..."
              class="w-full px-3.5 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label
                for="task-prio-select"
                class="block text-xs font-medium text-slate-300 mb-1"
                >Priority</label
              >
              <select
                id="task-prio-select"
                bind:value={formPriority}
                class="w-full px-3 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label
                for="task-due-input"
                class="block text-xs font-medium text-slate-300 mb-1"
                >Due Date</label
              >
              <input
                id="task-due-input"
                type="date"
                bind:value={formDueDate}
                class="w-full px-3 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {#if contentItems.length > 0}
            <div>
              <label
                for="task-content-link"
                class="block text-xs font-medium text-slate-300 mb-1"
                >Link to Video (optional)</label
              >
              <select
                id="task-content-link"
                bind:value={formContentItemId}
                class="w-full px-3 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="">None</option>
                {#each contentItems as item}
                  <option value={String(item.id)}
                    >{item.title} ({item.platform})</option
                  >
                {/each}
              </select>
            </div>
          {/if}

          <div>
            <label
              for="task-checklist-input"
              class="block text-xs font-medium text-slate-300 mb-1"
              >Checklist Steps (one per line)</label
            >
            <textarea
              id="task-checklist-input"
              bind:value={formChecklistRaw}
              rows={3}
              placeholder="Set key light&#10;Record 3 hook variations&#10;Check mic gain"
              class="w-full px-3.5 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
            ></textarea>
          </div>

          <div
            class="flex justify-end gap-2 pt-3 border-t border-purple-900/30"
          >
            <button
              type="button"
              onclick={() => (showModal = false)}
              class="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-all"
            >
              {editingTaskId ? "Save Changes" : "Save Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
