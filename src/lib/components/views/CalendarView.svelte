<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import { portal } from '../../utils/portal';
  import LoadError from '../layout/LoadError.svelte';
  import type { CalendarEvent, ContentItem } from '../../types';
  import {
    Calendar as CalendarIcon,
    Plus,
    Clock,
    ChevronLeft,
    ChevronRight,
    Video,
    Trash2,
    Edit3,
    X
  } from 'lucide-svelte';

  let events = $state<CalendarEvent[]>([]);
  let contentItems = $state<ContentItem[]>([]);
  let isLoading = $state(false);
  let loadError = $state<string | null>(null);

  let currentDate = $state(new Date());
  let currentYear = $derived(currentDate.getFullYear());
  let currentMonth = $derived(currentDate.getMonth());
  let currentMonthName = $derived(currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }));

  let daysInCurrentMonth = $derived(new Date(currentYear, currentMonth + 1, 0).getDate());
  let daysInGrid = $derived(Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1));

  let startWeekdayOffset = $derived(new Date(currentYear, currentMonth, 1).getDay());
  let daysInPrevMonth = $derived(new Date(currentYear, currentMonth, 0).getDate());
  let prevMonthPaddingDays = $derived(
    Array.from({ length: startWeekdayOffset }, (_, i) => daysInPrevMonth - startWeekdayOffset + 1 + i)
  );

  // Create / Edit Modal state
  let showModal = $state(false);
  let editingEventId = $state<number | null>(null);
  let formTitle = $state('');
  let formPlatform = $state('YouTube');
  let formEventType = $state('Scheduled');
  let formDate = $state('');
  let formContentItemId = $state('');
  let formNotes = $state('');

  function toLocalDateTimeInput(d: Date): string {
    const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

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

  function getEventsForDay(day: number): CalendarEvent[] {
    return events
      .filter(e => {
        const d = new Date(e.start_time);
        return (
          d.getFullYear() === currentYear &&
          d.getMonth() === currentMonth &&
          d.getDate() === day
        );
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }

  let upcomingEvents = $derived(
    [...events]
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .filter(e => new Date(e.start_time).getTime() >= Date.now() - 86400000)
  );

  async function loadCalendar() {
    isLoading = true;
    loadError = null;
    const [eventsRes, contentRes] = await Promise.allSettled([
      api.getCalendarEvents(),
      api.getContentItems()
    ]);
    if (eventsRes.status === 'fulfilled') events = eventsRes.value;
    if (contentRes.status === 'fulfilled') contentItems = contentRes.value;
    if (eventsRes.status === 'rejected') {
      loadError = eventsRes.reason?.message || "Couldn't load your calendar.";
    }
    isLoading = false;
  }

  onMount(loadCalendar);

  function openCreateModal(day?: number) {
    editingEventId = null;
    formTitle = '';
    formPlatform = 'YouTube';
    formEventType = 'Scheduled';
    formContentItemId = '';
    formNotes = '';

    if (day !== undefined) {
      const target = new Date(currentYear, currentMonth, day, 10, 0);
      formDate = toLocalDateTimeInput(target);
    } else {
      const tomorrow = new Date(Date.now() + 86400000);
      tomorrow.setHours(10, 0, 0, 0);
      formDate = toLocalDateTimeInput(tomorrow);
    }
    showModal = true;
  }

  function openEditModal(ev: CalendarEvent, e?: Event) {
    if (e) e.stopPropagation();
    editingEventId = ev.id;
    formTitle = ev.title;
    formPlatform = ev.platform || 'YouTube';
    formEventType = ev.event_type || 'Scheduled';
    const d = new Date(ev.start_time);
    formDate = !isNaN(d.getTime()) ? toLocalDateTimeInput(d) : toLocalDateTimeInput(new Date());
    formContentItemId = ev.content_item_id ? String(ev.content_item_id) : '';
    formNotes = ev.notes || '';
    showModal = true;
  }

  async function handleSaveEvent(e: Event) {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const payload: Partial<CalendarEvent> = {
      title: formTitle.trim(),
      start_time: new Date(formDate).toISOString(),
      platform: formPlatform,
      event_type: formEventType,
      content_item_id: formContentItemId ? Number(formContentItemId) : undefined,
      notes: formNotes.trim() || undefined
    };

    try {
      if (editingEventId) {
        const updated = await api.updateCalendarEvent(editingEventId, payload);
        events = events.map(ev => (ev.id === editingEventId ? updated : ev));
        appState.showToast('Schedule updated', 'success');
      } else {
        const created = await api.createCalendarEvent(payload);
        events = [...events, created];
        appState.showToast(`Scheduled: "${created.title}"`, 'success');
      }
      showModal = false;
    } catch (err: any) {
      appState.showToast(err.message || 'Could not save event', 'error');
    }
  }

  async function handleDeleteEvent(id: number, e?: Event) {
    if (e) e.stopPropagation();
    try {
      await api.deleteCalendarEvent(id);
      events = events.filter(ev => ev.id !== id);
      if (editingEventId === id) showModal = false;
      appState.showToast('Event removed', 'info');
    } catch (err: any) {
      appState.showToast(err.message || 'Could not delete event', 'error');
    }
  }

  function formatEventTime(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatEventDateFull(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function getLinkedContentTitle(contentId?: number): string | null {
    if (!contentId) return null;
    return contentItems.find(c => c.id === contentId)?.title || null;
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  {#if loadError}
    <LoadError message={loadError} onRetry={loadCalendar} />
  {/if}

  <!-- Header -->
  <div class="swiss-card p-6 border border-purple-900/40 bg-[#10071c]">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-medium text-amber-400">Publishing Calendar</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <CalendarIcon class="w-6 h-6 text-amber-400" />
          <span>Schedule & Releases</span>
        </h1>
        <p class="text-xs text-slate-400 mt-1 max-w-xl">
          Click any date to schedule a post, shoot, or editing session.
        </p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <div class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#08040d] border border-purple-900/50 text-xs text-slate-200">
          <button
            type="button"
            onclick={prevMonth}
            class="p-1 rounded hover:text-amber-400 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="font-medium text-white min-w-[135px] text-center">{currentMonthName}</span>
          <button
            type="button"
            onclick={nextMonth}
            class="p-1 rounded hover:text-amber-400 transition-colors"
            title="Next Month"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onclick={goToToday}
          class="px-3 py-1.5 rounded-lg bg-black/70 hover:bg-purple-950/60 text-slate-300 border border-purple-900/50 text-xs font-medium transition-colors"
        >
          Today
        </button>

        <button
          type="button"
          onclick={() => openCreateModal()}
          class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-all shadow-sm"
        >
          <Plus class="w-4 h-4" />
          <span>Schedule Event</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Main Layout: Calendar Grid (8 cols) + Upcoming Agenda (4 cols) -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <!-- Calendar Grid Container -->
    <div class="lg:col-span-8 swiss-card p-5 border border-purple-900/40 bg-[#10071c] space-y-3">
      <!-- Day headers -->
      <div class="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-400 pb-2.5 border-b border-purple-900/30">
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
          <div class="min-h-[104px] p-2 rounded-lg bg-[#06030a]/40 border border-purple-950/20 text-slate-600 opacity-40 select-none">
            <span class="text-xs font-medium">{pDay}</span>
          </div>
        {/each}

        <!-- Current month days -->
        {#each daysInGrid as day}
          {@const dayEvents = getEventsForDay(day)}
          {@const isCurrentDay = checkIsToday(day)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            onclick={() => openCreateModal(day)}
            class="min-h-[104px] p-2 rounded-lg bg-[#08040d]/85 border cursor-pointer {isCurrentDay
              ? 'border-amber-400/70 ring-1 ring-amber-400/30 bg-purple-950/25'
              : 'border-purple-900/30'} hover:border-amber-400/40 transition-all flex flex-col justify-between group"
          >
            <div class="flex items-center justify-between text-xs font-medium {isCurrentDay ? 'text-amber-400' : 'text-slate-400'}">
              <span>{day}</span>
              {#if isCurrentDay}
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-400 text-black font-semibold">Today</span>
              {:else}
                <span class="opacity-0 group-hover:opacity-100 text-[10px] text-amber-400 transition-opacity">+ Add</span>
              {/if}
            </div>

            <div class="space-y-1 overflow-hidden my-1.5 flex-1">
              {#each dayEvents as ev}
                <div
                  onclick={(e) => openEditModal(ev, e)}
                  class="px-2 py-1 rounded text-[11px] truncate flex items-center justify-between border transition-colors {ev.platform === 'YouTube'
                    ? 'bg-rose-500/15 text-rose-200 border-rose-500/30 hover:border-rose-400'
                    : ev.platform === 'TikTok'
                    ? 'bg-purple-500/15 text-purple-200 border-purple-500/30 hover:border-purple-400'
                    : 'bg-amber-500/15 text-amber-200 border-amber-500/30 hover:border-amber-400'}"
                  title={`${ev.title} (${ev.platform} • ${formatEventTime(ev.start_time)})`}
                >
                  <span class="truncate font-medium">{ev.title}</span>
                  <button
                    type="button"
                    onclick={(e) => handleDeleteEvent(ev.id, e)}
                    class="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 transition-opacity ml-1 shrink-0"
                    title="Delete event"
                  >
                    <Trash2 class="w-2.5 h-2.5" />
                  </button>
                </div>
              {/each}
            </div>

            {#if dayEvents.length > 0}
              <div class="text-[10px] text-slate-500 text-right">
                {dayEvents.length} {dayEvents.length === 1 ? 'item' : 'items'}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Upcoming Agenda Sidebar (4 cols) -->
    <div class="lg:col-span-4 swiss-card p-5 border border-purple-900/40 bg-[#10071c] space-y-4 flex flex-col">
      <div class="flex items-center justify-between border-b border-purple-900/30 pb-3">
        <div class="flex items-center gap-2">
          <Clock class="w-4 h-4 text-amber-400" />
          <h2 class="text-sm font-semibold text-white">Upcoming Schedule</h2>
        </div>
        <span class="text-xs text-slate-400">{upcomingEvents.length} scheduled</span>
      </div>

      {#if upcomingEvents.length === 0}
        <div class="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-2 text-slate-400 text-xs">
          <CalendarIcon class="w-7 h-7 text-purple-400/40" />
          <p>Nothing scheduled yet.</p>
          <p class="text-[11px] text-slate-500">Click any date on the calendar to add an event.</p>
        </div>
      {:else}
        <div class="space-y-2.5 overflow-y-auto max-h-[540px] pr-1">
          {#each upcomingEvents as ev}
            {@const linkedTitle = getLinkedContentTitle(ev.content_item_id)}
            <div class="p-3.5 rounded-xl bg-black/50 border border-purple-900/40 hover:border-amber-400/40 transition-all space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap mb-1">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-400/15 text-amber-300 border border-amber-400/30">
                      {ev.platform}
                    </span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] bg-purple-950/60 text-purple-200 border border-purple-800/40">
                      {ev.event_type || 'Scheduled'}
                    </span>
                  </div>
                  <h4 class="text-xs font-semibold text-white">{ev.title}</h4>
                </div>

                <div class="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onclick={(e) => openEditModal(ev, e)}
                    class="p-1 rounded text-slate-400 hover:text-white"
                    title="Edit event"
                  >
                    <Edit3 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onclick={(e) => handleDeleteEvent(ev.id, e)}
                    class="p-1 rounded text-slate-500 hover:text-rose-400"
                    title="Delete event"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Clock class="w-3 h-3 text-purple-400" />
                <span>{formatEventDateFull(ev.start_time)}</span>
              </div>

              {#if linkedTitle}
                <button
                  type="button"
                  onclick={() => appState.setModule('content')}
                  class="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:underline"
                >
                  <Video class="w-3 h-3" />
                  <span class="truncate max-w-[200px]">{linkedTitle}</span>
                </button>
              {/if}

              {#if ev.notes}
                <p class="text-[11px] text-slate-400 border-t border-purple-900/30 pt-1.5">
                  {ev.notes}
                </p>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Schedule / Edit Event Modal -->
  {#if showModal}
    <div use:portal class="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 pb-16 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <button
        type="button"
        onclick={() => (showModal = false)}
        class="fixed inset-0 cursor-default"
        aria-label="Close modal"
        tabindex="-1"
      ></button>

      <div class="relative w-full max-w-md bg-[#11081d] border border-purple-800/40 rounded-2xl p-6 space-y-4 shadow-2xl z-10 modal-spring">
        <div class="flex items-center justify-between border-b border-purple-900/30 pb-3">
          <div>
            <span class="text-xs font-medium text-amber-400">{editingEventId ? 'Edit Event' : 'New Event'}</span>
            <h3 class="text-base font-bold text-white">{editingEventId ? 'Update Scheduled Event' : 'Schedule Content or Shoot'}</h3>
          </div>
          <button
            type="button"
            onclick={() => (showModal = false)}
            class="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <form onsubmit={handleSaveEvent} class="space-y-3.5">
          <div>
            <label for="cal-event-title" class="block text-xs font-medium text-slate-300 mb-1">Title</label>
            <input
              id="cal-event-title"
              type="text"
              bind:value={formTitle}
              placeholder="e.g. Publish Deep-Dive: Autonomous Agents"
              required
              class="w-full px-3.5 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="cal-event-plat" class="block text-xs font-medium text-slate-300 mb-1">Platform</label>
              <select
                id="cal-event-plat"
                bind:value={formPlatform}
                class="w-full px-3 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Instagram">Instagram</option>
                <option value="X">X</option>
              </select>
            </div>

            <div>
              <label for="cal-event-type" class="block text-xs font-medium text-slate-300 mb-1">Event Type</label>
              <select
                id="cal-event-type"
                bind:value={formEventType}
                class="w-full px-3 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="Scheduled">Scheduled Release</option>
                <option value="Filming">Filming Session</option>
                <option value="Editing">Editing Session</option>
                <option value="Planned">Planned Idea</option>
                <option value="Live">Live Stream</option>
              </select>
            </div>
          </div>

          <div>
            <label for="cal-event-date" class="block text-xs font-medium text-slate-300 mb-1">Date & Time</label>
            <input
              id="cal-event-date"
              type="datetime-local"
              bind:value={formDate}
              required
              class="w-full px-3.5 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          {#if contentItems.length > 0}
            <div>
              <label for="cal-content-link" class="block text-xs font-medium text-slate-300 mb-1">Link to Video (optional)</label>
              <select
                id="cal-content-link"
                bind:value={formContentItemId}
                class="w-full px-3 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="">None</option>
                {#each contentItems as item}
                  <option value={String(item.id)}>{item.title} ({item.platform})</option>
                {/each}
              </select>
            </div>
          {/if}

          <div>
            <label for="cal-event-notes" class="block text-xs font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              id="cal-event-notes"
              bind:value={formNotes}
              rows={2}
              placeholder="Thumbnail link, sponsor reminders, or publishing checklist..."
              class="w-full px-3.5 py-2 rounded-lg bg-black/70 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-amber-400"
            ></textarea>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-purple-900/30">
            {#if editingEventId}
              <button
                type="button"
                onclick={() => editingEventId && handleDeleteEvent(editingEventId)}
                class="px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 transition-colors"
              >
                Delete
              </button>
            {:else}
              <div></div>
            {/if}

            <div class="flex items-center gap-2">
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
                {editingEventId ? 'Save Changes' : 'Save to Calendar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
