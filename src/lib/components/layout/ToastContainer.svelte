<script lang="ts">
  import { appState } from '../../stores/appState.svelte';
  import { CheckCircle2, AlertCircle, Info, X } from 'lucide-svelte';
</script>

<div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
  {#each appState.toasts as toast (toast.id)}
    <div
      class="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 {toast.type === 'success'
        ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300'
        : toast.type === 'error'
        ? 'bg-slate-900/90 border-rose-500/40 text-rose-300'
        : 'bg-slate-900/90 border-violet-500/40 text-violet-300'}"
    >
      {#if toast.type === 'success'}
        <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
      {:else if toast.type === 'error'}
        <AlertCircle class="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      {:else}
        <Info class="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
      {/if}

      <div class="flex-1 text-xs leading-relaxed text-slate-200">
        {toast.text}
      </div>

      <button
        onclick={() => appState.removeToast(toast.id)}
        class="text-slate-400 hover:text-white p-0.5"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>
  {/each}
</div>
