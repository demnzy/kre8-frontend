<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import type { CalendarEvent, ContentItem } from '../../types';
  import {
    Calendar as CalendarIcon,
    Plus,
    Clock,
    ChevronLeft,
    ChevronRight,
    Video,
    Trash2,
    CalendarCheck,
    Layers
  } from 'lucide-svelte';

  let events = $state<CalendarEvent[]>([]);
  let contentItems = $state<ContentItem[]>([]);
  let isLoading = $state(false);

  // Dynamic Real Calendar Engine State
  let currentDate = $state(new Date());

  let currentYear = $derived(currentDate.getFullYear());
  let currentMonth = $derived(currentDate.getMonth()); // 0 - 11
  let currentMonthName = $derived(currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }));

  // Days in current month (28, 29, 30, 31)
  let daysInCurrentMonth = $derived(new Date(currentYear, currentMonth + 1, 0).getDate());
  let daysInGrid = $derived(Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1));

  // Weekday offset for the 1st of the month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  let startWeekdayOffset = $derived(new Date(currentYear, currentMonth, 1).getDay());
  let daysInPrevMonth = $derived(new Date(currentYear, currentMonth, 0).getDate());
  let prevMonthPaddingDays = $derived(
    Array.from({ length: startWeekdayOffset }, (_, i) => daysInPrevMonth - startWeekdayOffset + 1 + i)
  );

  function nextMonth() {
    currentDate = new Date(currentYear, currentMonth + 1, 1);
  }

  function prevMonth() {
    currentDate = new Date(currentYear, currentMonth - 1, 1);
  }

  function goToToday() {
    currentDate = new Date();
  }

  function checkIsToday(day: number): boolean {
    const today = new Date();
    return (
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonth &&
      today.getDate() === day
    );
  }

  function getEventsForDay(day: number) {
    return events.filter(e => {
      const d = new Date(e.start_time);
      return (
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth &&
        d.getDate() === day
      );
    });
  }

  let showCreateModal = $state(false);
  let newTitle = $state('');
  let newPlatform = $state('YouTube');
  let newDate = $state(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  let newNotes = $state('');

  onMount(async () => {
    try {
      isLoading = true;
      const [fetchedEvents, fetchedContent] = await Promise.all([
        api.getCalendarEvents(),
        api.getContentItems()
      ]);
      events = fetchedEvents;
      contentItems = fetchedContent;
    } catch (e: any) {
      console.error(e);
    } finally {
      isLoading = false;
    }
  });

  async function handleCreateEvent(e: Event) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await api.createCalendarEvent({
        title: newTitle,
        start_time: newDate,
        platform: newPlatform,
        event_type: 'Scheduled',
        notes: newNotes
      });
      events = [...events, created];
      newTitle = '';
      newNotes = '';
      showCreateModal = false;
      appState.showToast(`Scheduled event: "${created.title}"`, 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to schedule', 'error');
    }
  }

  async function handleDeleteEvent(id: number) {
    try {
      await api.deleteCalendarEvent(id);
      events = events.filter(e => e.id !== id);
      appState.showToast('Event removed', 'info');
    } catch (e: any) {
      appState.showToast(e.message || 'Failed to delete', 'error');
    }
  }

</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <!-- Swiss Header -->
  <div class="p-6 bg-[#10071c] border border-purple-900/30 relative">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <span class="font-mono text-[10px] tracking-widest text-amber-400 uppercase">Publishing Calendar</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display flex items-center gap-2.5">
          <CalendarIcon class="w-6 h-6 text-amber-400" />
          <span>Content Schedule & Deadlines</span>
        </h1>
        <p class="text-xs text-slate-400 mt-1 max-w-xl">
          Coordinate multi-platform publishing timetables, shoot dates, and editorial delivery slots.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 px-3 py-1.5 bg-[#08040d] border border-purple-900/40 text-xs font-mono text-slate-300">
          <button onclick={prevMonth} class="p-1 hover:text-amber-400 transition-colors" title="Previous Month">
            <ChevronLeft class="w-3.5 h-3.5" />
          </button>
          <span class="tracking-wide text-white min-w-[130px] text-center">{currentMonthName}</span>
          <button onclick={nextMonth} class="p-1 hover:text-amber-400 transition-colors" title="Next Month">
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onclick={goToToday}
          class="px-2.5 py-1.5 bg-black hover:bg-purple-950 text-slate-300 border border-purple-900 text-xs font-mono uppercase tracking-wider transition-colors"
        >
          Today
        </button>

        <button
          onclick={() => (showCreateModal = true)}
          class="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold font-mono tracking-wider uppercase transition-all shadow-md shadow-amber-500/10"
        >
          <Plus class="w-4 h-4" />
          <span>Schedule Post</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Calendar Grid Container -->
  <div class="bg-[#10071c] border border-purple-900/30 p-5 space-y-3">
    <!-- Day headers -->
    <div class="grid grid-cols-7 gap-2 text-center font-mono text-[11px] tracking-wider text-purple-300/70 pb-3 border-b border-purple-900/30 uppercase">
      <div>Sun</div>
      <div>Mon</div>
      <div>Tue</div>
      <div>Wed</div>
      <div>Thu</div>
      <div>Fri</div>
      <div>Sat</div>
    </div>

    <!-- Month day blocks -->
    <div class="grid grid-cols-7 gap-2">
      <!-- Leading padding cells from previous month -->
      {#each prevMonthPaddingDays as pDay}
        <div class="min-h-[110px] p-2 bg-[#06030a]/60 border border-purple-950/20 text-slate-600 opacity-40 select-none flex flex-col justify-between">
          <div class="font-mono text-xs font-bold text-slate-600">
            <span>{pDay}</span>
          </div>
        </div>
      {/each}

      <!-- Current month days -->
      {#each daysInGrid as day}
        {@const dayEvents = getEventsForDay(day)}
        {@const isCurrentDay = checkIsToday(day)}
        <div class="min-h-[110px] p-2 bg-[#08040d]/90 border {isCurrentDay ? 'border-amber-400/70 ring-1 ring-amber-400/40 bg-purple-950/25' : 'border-purple-900/25'} hover:border-purple-700/50 transition-colors flex flex-col justify-between group">
          <div class="flex items-center justify-between font-mono text-xs font-bold {isCurrentDay ? 'text-amber-400' : 'text-slate-400'}">
            <span class="tabular-nums">{day < 10 ? `0${day}` : day}</span>
            {#if isCurrentDay}
              <span class="text-[9px] px-1.5 py-0.2 bg-amber-400 text-black font-mono font-bold tracking-wider uppercase">Today</span>
            {/if}
          </div>

          <div class="space-y-1.5 overflow-hidden my-1.5 flex-1">
            {#each dayEvents as ev}
              <div class="p-1.5 text-[10px] font-mono truncate flex items-center justify-between border {ev.platform === 'YouTube'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : ev.platform === 'TikTok'
                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'}">
                <span class="truncate font-sans font-medium">{ev.title}</span>
                <button
                  onclick={() => handleDeleteEvent(ev.id)}
                  class="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 transition-opacity ml-1"
                  title="Remove scheduled event"
                >
                  <Trash2 class="w-2.5 h-2.5" />
                </button>
              </div>
            {/each}
          </div>

          <div class="text-[9px] font-mono text-slate-500 text-right">
            {dayEvents.length > 0 ? `${dayEvents.length} POST${dayEvents.length > 1 ? 'S' : ''}` : ''}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Swiss Schedule Post Modal -->
  {#if showCreateModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div class="relative w-full max-w-md bg-[#10071c] border border-amber-400/40 p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-purple-900/30 pb-3">
          <div class="flex items-center gap-2">
            <span class="font-mono text-[10px] tracking-widest text-amber-400 uppercase">[ NEW ENTRY ]</span>
            <h3 class="text-base font-bold text-white font-display">Schedule Content Release</h3>
          </div>
          <button onclick={() => (showCreateModal = false)} class="font-mono text-xs text-slate-400 hover:text-white">✕</button>
        </div>

        <form onsubmit={handleCreateEvent} class="space-y-4">
          <div>
            <label for="cal-event-title" class="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Content Title</label>
            <input
              id="cal-event-title"
              type="text"
              bind:value={newTitle}
              placeholder="e.g. Upload Deep-Dive: Autonomous Agents"
              required
              class="w-full px-3 py-2 bg-[#08040d] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="cal-event-plat" class="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Target Platform</label>
              <select
                id="cal-event-plat"
                bind:value={newPlatform}
                class="w-full px-3 py-2 bg-[#08040d] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
              >
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Instagram">Instagram</option>
                <option value="X">X (Twitter)</option>
              </select>
            </div>

            <div>
              <label for="cal-event-date" class="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Date & Time</label>
              <input
                id="cal-event-date"
                type="datetime-local"
                bind:value={newDate}
                class="w-full px-2 py-2 bg-[#08040d] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label for="cal-event-notes" class="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Production Notes</label>
            <input
              id="cal-event-notes"
              type="text"
              bind:value={newNotes}
              placeholder="Thumbnail link, sponsor tags, or rendering notes..."
              class="w-full px-3 py-2 bg-[#08040d] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-amber-400"
            />
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
              Commit to Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
