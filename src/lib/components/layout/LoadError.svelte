<script lang="ts">
  import { AlertTriangle, RefreshCw } from 'lucide-svelte';

  let { message = "Couldn't load this section.", onRetry, compact = false }: {
    message?: string;
    onRetry?: () => void | Promise<void>;
    compact?: boolean;
  } = $props();

  let retrying = $state(false);

  async function retry() {
    if (!onRetry) return;
    retrying = true;
    try {
      await onRetry();
    } finally {
      retrying = false;
    }
  }
</script>

<div
  role="alert"
  class="flex items-center justify-between gap-3 border border-rose-500/30 bg-rose-950/20 text-xs font-mono text-rose-200 {compact ? 'p-2.5' : 'p-4'}"
>
  <div class="flex items-center gap-2 min-w-0">
    <AlertTriangle class="w-3.5 h-3.5 text-rose-400 shrink-0" />
    <span class="truncate" title={message}>{message}</span>
  </div>
  {#if onRetry}
    <button
      type="button"
      onclick={retry}
      disabled={retrying}
      class="flex items-center gap-1 px-2.5 py-1 shrink-0 border border-rose-400/50 hover:bg-rose-900/40 tracking-wider disabled:opacity-50"
    >
      <RefreshCw class="w-3 h-3 {retrying ? 'animate-spin' : ''}" />
      <span>Retry</span>
    </button>
  {/if}
</div>

