<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import { portal } from '../../utils/portal';
  import LoadError from '../layout/LoadError.svelte';
  import type { Goal } from '../../types';
  import {
    Target,
    Plus,
    Minus,
    Trash2,
    Calendar,
    Award,
    Edit3,
    X
  } from 'lucide-svelte';

  let goals = $state<Goal[]>([]);
  let isLoading = $state(false);
  let loadError = $state<string | null>(null);

  // Modal state (Create & Edit)
  let showModal = $state(false);
  let editingGoalId = $state<number | null>(null);
  let formTitle = $state('');
  let formType = $state('Weekly Posts');
  let formTarget = $state(4);
  let formCurrent = $state(0);
  let formUnit = $state('videos');
  let formDeadline = $state('');

  let achievedCount = $derived(goals.filter(g => g.is_achieved).length);

  onMount(loadData);

  async function loadData() {
    isLoading = true;
    loadError = null;
    try {
      goals = await api.getGoals();
    } catch (e: any) {
      loadError = e?.message || "Couldn't load your goals.";
    } finally {
      isLoading = false;
    }
  }

  function openCreateModal() {
    editingGoalId = null;
    formTitle = '';
    formType = 'Weekly Posts';
    formTarget = 4;
    formCurrent = 0;
    formUnit = 'videos';
    formDeadline = '';
    showModal = true;
  }

  function openEditModal(goal: Goal) {
    editingGoalId = goal.id;
    formTitle = goal.title;
    formType = goal.goal_type || 'Weekly Posts';
    formTarget = goal.target_value;
    formCurrent = goal.current_value;
    formUnit = goal.unit || 'videos';
    formDeadline = goal.deadline ? goal.deadline.slice(0, 10) : '';
    showModal = true;
  }

  async function handleSaveGoal(e: Event) {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      const payload = {
        title: formTitle.trim(),
        goal_type: formType,
        target_value: Number(formTarget) || 1,
        current_value: Number(formCurrent) || 0,
        unit: formUnit.trim() || 'items',
        deadline: formDeadline ? new Date(formDeadline).toISOString() : undefined
      };

      if (editingGoalId) {
        const updated = await api.updateGoal(editingGoalId, payload);
        goals = goals.map(g => (g.id === editingGoalId ? updated : g));
        appState.showToast('Goal updated', 'success');
      } else {
        const created = await api.createGoal(payload);
        goals = [...goals, created];
        appState.showToast(`Goal created: "${created.title}"`, 'success');
      }
      showModal = false;
    } catch (e: any) {
      appState.showToast(e.message || 'Could not save goal', 'error');
    }
  }

  async function handleAdjustProgress(goal: Goal, delta: number) {
    const nextVal = Math.max(0, Number((goal.current_value + delta).toFixed(2)));
    try {
      const updated = await api.updateGoal(goal.id, {
        current_value: nextVal
      });
      goals = goals.map(g => (g.id === goal.id ? updated : g));
      if (!goal.is_achieved && updated.is_achieved) {
        appState.showToast(`Goal achieved: "${updated.title}"!`, 'success');
      }
    } catch (e: any) {
      appState.showToast(e.message || 'Could not update progress', 'error');
    }
  }

  async function handleDeleteGoal(id: number) {
    try {
      await api.deleteGoal(id);
      goals = goals.filter(g => g.id !== id);
      appState.showToast('Goal removed', 'info');
    } catch (e: any) {
      appState.showToast(e.message || 'Delete failed', 'error');
    }
  }

  function formatDateShort(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  {#if loadError}
    <LoadError message={loadError} onRetry={loadData} />
  {/if}

  <!-- Header -->
  <div class="swiss-card p-6 border border-purple-900/40 bg-[#10071c]">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-medium text-amber-400">Goals & Milestones</span>
          {#if goals.length > 0}
            <span class="text-xs text-slate-400">• {achievedCount} of {goals.length} completed</span>
          {/if}
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Target class="w-6 h-6 text-amber-400" />
          <span>Creator Goals</span>
        </h1>
        <p class="text-xs text-slate-400 mt-1 max-w-xl">
          Set clear targets for videos published, scripts written, and channel milestones.
        </p>
      </div>

      <button
        type="button"
        onclick={openCreateModal}
        class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-all shadow-sm shrink-0"
      >
        <Plus class="w-4 h-4" />
        <span>New Goal</span>
      </button>
    </div>
  </div>

  <!-- Goals Grid -->
  {#if goals.length === 0}
    <div class="swiss-card text-center py-16 bg-[#10071c] border border-purple-900/30 space-y-3">
      <Target class="w-8 h-8 text-purple-400/50 mx-auto" />
      <p class="text-slate-400 text-xs">No goals set yet. Create your first goal to track your progress.</p>
      <button
        type="button"
        onclick={openCreateModal}
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-all"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Create Goal</span>
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      {#each goals as goal}
        {@const percent = Math.min(100, Math.round((goal.current_value / Math.max(1, goal.target_value)) * 100))}
        <div class="swiss-card p-6 space-y-4 hover:border-amber-400/40 transition-all flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-purple-950/60 text-purple-200 border border-purple-800/40">
                  {goal.goal_type}
                </span>
                {#if goal.deadline}
                  <span class="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar class="w-3 h-3 text-purple-400" />
                    <span>Due {formatDateShort(goal.deadline)}</span>
                  </span>
                {/if}
              </div>

              <div class="flex items-center gap-1">
                {#if goal.is_achieved}
                  <span class="text-xs text-amber-300 flex items-center gap-1 border border-amber-400/30 px-2 py-0.5 rounded-full bg-amber-400/10 font-medium">
                    <Award class="w-3 h-3 text-amber-400" /> Completed
                  </span>
                {/if}
                <button
                  type="button"
                  onclick={() => openEditModal(goal)}
                  class="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-purple-950/50 transition-colors"
                  title="Edit goal"
                >
                  <Edit3 class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onclick={() => handleDeleteGoal(goal.id)}
                  class="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors"
                  title="Delete goal"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <h3 class="font-semibold text-white text-base">{goal.title}</h3>
              <div class="flex items-baseline gap-2 mt-1.5">
                <span class="text-2xl font-bold text-white tabular-nums">{goal.current_value}</span>
                <span class="text-xs text-slate-400">/ {goal.target_value} {goal.unit}</span>
                <span class="text-xs font-semibold text-amber-400 ml-auto tabular-nums">{percent}%</span>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="w-full h-2 rounded-full bg-[#08040d] border border-purple-900/40 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500 {goal.is_achieved
                  ? 'bg-gradient-to-r from-emerald-400 to-amber-300'
                  : 'bg-gradient-to-r from-purple-500 to-amber-400'}"
                style="width: {percent}%"
              ></div>
            </div>
          </div>

          <div class="pt-3 border-t border-purple-900/30 flex items-center justify-between">
            <span class="text-xs text-slate-400">Update progress</span>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                onclick={() => handleAdjustProgress(goal, -1)}
                disabled={goal.current_value <= 0}
                class="p-1.5 rounded-lg bg-[#08040d] hover:bg-purple-950/40 text-slate-300 border border-purple-900/40 disabled:opacity-40 transition-colors"
                title="Decrease by 1"
              >
                <Minus class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onclick={() => handleAdjustProgress(goal, 1)}
                class="px-3 py-1.5 rounded-lg bg-[#08040d] hover:bg-purple-950/50 text-amber-300 border border-purple-900/40 hover:border-amber-400/50 text-xs font-medium transition-all flex items-center gap-1"
              >
                <Plus class="w-3.5 h-3.5 text-amber-400" />
                <span>+1 {goal.unit}</span>
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Create / Edit Goal Modal -->
  {#if showModal}
    <div use:portal class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <button
        type="button"
        onclick={() => (showModal = false)}
        class="absolute inset-0 cursor-default"
        aria-label="Close modal"
      ></button>

      <div class="relative w-full max-w-md bg-[#11081d] border border-purple-800/40 rounded-2xl p-6 space-y-4 shadow-2xl z-10 modal-spring">
        <div class="flex items-center justify-between border-b border-purple-900/30 pb-3">
          <div>
            <span class="text-xs font-medium text-amber-400">{editingGoalId ? 'Edit Goal' : 'New Goal'}</span>
            <h3 class="text-base font-bold text-white">{editingGoalId ? 'Update Goal Details' : 'Set a New Goal'}</h3>
          </div>
          <button
            type="button"
            onclick={() => (showModal = false)}
            class="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <form onsubmit={handleSaveGoal} class="space-y-4">
          <div>
            <label for="goal-title-input" class="block text-xs font-medium text-slate-300 mb-1">Goal Title</label>
            <input
              id="goal-title-input"
              type="text"
              bind:value={formTitle}
              placeholder="e.g. Publish 12 YouTube Shorts this month"
              required
              class="w-full px-3.5 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="goal-type-select" class="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                id="goal-type-select"
                bind:value={formType}
                class="w-full px-3 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="Weekly Posts">Weekly Posts</option>
                <option value="Monthly Output">Monthly Output</option>
                <option value="Scripts Written">Scripts Written</option>
                <option value="Audience Milestone">Audience Milestone</option>
                <option value="Sponsorships & Revenue">Sponsorships & Revenue</option>
              </select>
            </div>

            <div>
              <label for="goal-unit-input" class="block text-xs font-medium text-slate-300 mb-1">Unit</label>
              <input
                id="goal-unit-input"
                type="text"
                bind:value={formUnit}
                placeholder="videos, scripts, subs"
                class="w-full px-3.5 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="goal-target-input" class="block text-xs font-medium text-slate-300 mb-1">Target Number</label>
              <input
                id="goal-target-input"
                type="number"
                min="1"
                step="any"
                bind:value={formTarget}
                class="w-full px-3.5 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label for="goal-current-input" class="block text-xs font-medium text-slate-300 mb-1">Current Progress</label>
              <input
                id="goal-current-input"
                type="number"
                min="0"
                step="any"
                bind:value={formCurrent}
                class="w-full px-3.5 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label for="goal-deadline-input" class="block text-xs font-medium text-slate-300 mb-1">Target Date (optional)</label>
            <input
              id="goal-deadline-input"
              type="date"
              bind:value={formDeadline}
              class="w-full px-3.5 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-purple-900/30">
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
              {editingGoalId ? 'Save Changes' : 'Save Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
