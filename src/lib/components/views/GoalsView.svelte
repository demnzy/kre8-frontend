<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import type { Goal, ContentItem } from '../../types';
  import {
    Target,
    Plus,
    Flame,
    CheckCircle2,
    TrendingUp,
    Trash2,
    Calendar,
    Award
  } from 'lucide-svelte';
  import { calculateActivityStreak } from '../../utils/metrics';

  let goals = $state<Goal[]>([]);
  let contentItems = $state<ContentItem[]>([]);
  let isLoading = $state(false);

  // New Goal modal
  let showCreateModal = $state(false);
  let newTitle = $state('');
  let newType = $state('Weekly Posts');
  let newTarget = $state(4);
  let newCurrent = $state(0);
  let newUnit = $state('posts');

  let streakDays = $derived(
    calculateActivityStreak(
      contentItems.map(c => c.planned_date || c.created_at)
    )
  );

  onMount(loadData);

  async function loadData() {
    try {
      isLoading = true;
      const [fetchedGoals, fetchedContent] = await Promise.all([
        api.getGoals(),
        api.getContentItems().catch(() => [])
      ]);
      goals = fetchedGoals;
      contentItems = fetchedContent;
    } catch (e: any) {
      console.error(e);
    } finally {
      isLoading = false;
    }
  }

  async function handleCreateGoal(e: Event) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await api.createGoal({
        title: newTitle,
        goal_type: newType,
        target_value: Number(newTarget),
        current_value: Number(newCurrent),
        unit: newUnit
      });
      goals = [...goals, created];
      newTitle = '';
      showCreateModal = false;
      appState.showToast(`Goal set: "${created.title}"`, 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to create goal', 'error');
    }
  }

  async function handleIncrement(goal: Goal) {
    try {
      const updated = await api.updateGoal(goal.id, {
        current_value: goal.current_value + 1
      });
      goals = goals.map(g => (g.id === goal.id ? updated : g));
      if (updated.is_achieved) {
        appState.showToast(`🎉 Milestone reached: "${updated.title}"!`, 'success');
      }
    } catch (e: any) {
      console.error(e);
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
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <!-- Swiss Header -->
  <div class="p-6 bg-[#10071c] border border-purple-900/30 relative">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <span class="font-mono text-[10px] tracking-widest text-amber-400 uppercase">Habit & Cadence Tracker</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display flex items-center gap-2.5">
          <Target class="w-6 h-6 text-amber-400" />
          <span>Output Goals & Creator Cadence</span>
        </h1>
        <p class="text-xs text-slate-400 mt-1 max-w-xl">
          Track input-driven consistency goals (scripts written, videos published) isolated from erratic algorithm metrics.
        </p>
      </div>

      <button
        onclick={() => (showCreateModal = true)}
        class="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold font-mono tracking-wider uppercase transition-all shadow-md shadow-amber-500/10"
      >
        <Plus class="w-4 h-4" />
        <span>Set Target</span>
      </button>
    </div>
  </div>

  <!-- Swiss Consistency Philosophy Banner -->
  <div class="p-6 bg-gradient-to-r from-amber-950/20 via-[#10071c] to-[#08040d] border border-amber-400/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
    <div class="flex items-center gap-3.5">
      <div class="p-3 bg-amber-400/10 border border-amber-400/30 text-amber-400">
        <Flame class="w-6 h-6" />
      </div>
      <div>
        <div class="flex items-center gap-2">
          <span class="font-mono text-[10px] tracking-widest text-amber-400 uppercase">Creative Principle</span>
        </div>
        <h3 class="font-bold text-sm text-white font-display">The Input-Control Principle</h3>
        <p class="text-xs text-slate-400 mt-0.5 max-w-2xl">
          Algorithm impressions fluctuate, but your creative consistency compounds exponentially. Focus on what you control: words written, shots delivered, and regular publishing cadences.
        </p>
      </div>
    </div>
    <div class="text-right shrink-0 border-l border-purple-900/40 pl-6">
      <span class="font-mono text-[10px] uppercase tracking-wider text-amber-400 block">CURRENT CADENCE</span>
      <span class="text-2xl font-black text-white font-display tracking-tight">
        {streakDays} CONSECUTIVE {streakDays === 1 ? 'DAY' : 'DAYS'}
      </span>
    </div>
  </div>

  <!-- Goals Grid -->
  {#if goals.length === 0}
    <div class="text-center py-16 bg-[#10071c] border border-purple-900/30 text-slate-500 font-mono text-xs uppercase tracking-wider">
      No targets set yet. Click "Set Target" to establish your weekly creator goals.
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      {#each goals as goal}
        {@const percent = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))}
        <div class="bg-[#10071c] border border-purple-900/30 p-6 space-y-4 hover:border-amber-400/40 transition-all flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-purple-950/60 text-purple-300 border border-purple-800/40">
                {goal.goal_type}
              </span>

              <div class="flex items-center gap-2">
                {#if goal.is_achieved}
                  <span class="font-mono text-[10px] uppercase tracking-wider text-amber-400 flex items-center gap-1 border border-amber-400/30 px-1.5 py-0.5 bg-amber-400/10">
                    <Award class="w-3 h-3 text-amber-400" /> ACHIEVED
                  </span>
                {/if}
                <button
                  onclick={() => handleDeleteGoal(goal.id)}
                  class="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                  title="Remove goal"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <h3 class="font-bold text-white text-base font-display">{goal.title}</h3>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="text-2xl font-bold font-mono text-white tabular-nums">{goal.current_value}</span>
                <span class="font-mono text-xs text-slate-400">/ {goal.target_value} {goal.unit}</span>
                <span class="font-mono text-xs font-bold text-amber-400 ml-auto tabular-nums">{percent}%</span>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="w-full h-1.5 bg-[#08040d] border border-purple-900/40 overflow-hidden">
              <div
                class="h-full transition-all duration-500 {goal.is_achieved
                  ? 'bg-gradient-to-r from-amber-400 to-amber-300'
                  : 'bg-gradient-to-r from-purple-500 to-amber-400'}"
                style="width: {percent}%"
              ></div>
            </div>
          </div>

          <div class="pt-3 border-t border-purple-900/30 flex items-center justify-between font-mono">
            <span class="text-[11px] text-slate-500 uppercase tracking-wider">Log progress:</span>
            <button
              onclick={() => handleIncrement(goal)}
              class="px-3 py-1.5 bg-[#08040d] hover:bg-purple-950/40 text-amber-300 border border-purple-900/40 hover:border-amber-400/50 text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              <Plus class="w-3 h-3 text-amber-400" />
              <span>+1 {goal.unit}</span>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Swiss Modal -->
  {#if showCreateModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div class="relative w-full max-w-md bg-[#10071c] border border-amber-400/40 p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-purple-900/30 pb-3">
          <div class="flex items-center gap-2">
            <span class="font-mono text-[10px] tracking-widest text-amber-400 uppercase">Target Setup</span>
            <h3 class="text-base font-bold text-white font-display">Set Creator Cadence Target</h3>
          </div>
          <button onclick={() => (showCreateModal = false)} class="font-mono text-xs text-slate-400 hover:text-white">✕</button>
        </div>

        <form onsubmit={handleCreateGoal} class="space-y-4">
          <div>
            <label for="goal-title-input" class="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Target Statement</label>
            <input
              id="goal-title-input"
              type="text"
              bind:value={newTitle}
              placeholder="e.g. Publish 4 Videos Every Week"
              required
              class="w-full px-3 py-2 bg-[#08040d] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="goal-type-select" class="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Cadence Type</label>
              <select
                id="goal-type-select"
                bind:value={newType}
                class="w-full px-3 py-2 bg-[#08040d] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
              >
                <option value="Weekly Posts">Weekly Posts</option>
                <option value="Scripts Written">Scripts Written</option>
                <option value="Follower Milestone">Follower Milestone</option>
                <option value="Publishing Streak">Publishing Streak</option>
              </select>
            </div>

            <div>
              <label for="goal-unit-input" class="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Unit</label>
              <input
                id="goal-unit-input"
                type="text"
                bind:value={newUnit}
                placeholder="posts, scripts, days"
                class="w-full px-3 py-2 bg-[#08040d] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="goal-target-input" class="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Target Value</label>
              <input
                id="goal-target-input"
                type="number"
                bind:value={newTarget}
                class="w-full px-3 py-2 bg-[#08040d] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label for="goal-current-input" class="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Current Progress</label>
              <input
                id="goal-current-input"
                type="number"
                bind:value={newCurrent}
                class="w-full px-3 py-2 bg-[#08040d] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
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
              Set Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
