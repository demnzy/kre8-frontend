<script lang="ts">
  import { connection } from '../../stores/connection.svelte';
  import { WifiOff, CheckCircle2, RefreshCw } from 'lucide-svelte';

  let checking = $state(false);

  async function retryNow() {
    checking = true;
    await connection.checkNow();
    checking = false;
  }
</script>

{#if !connection.online}
  <div
    role="alert"
    class="fixed top-0 inset-x-0 z-[60] flex items-center justify-center gap-3 px-4 py-2 bg-rose-950/95 border-b border-rose-500/50 text-rose-100 text-xs font-mono backdrop-blur-sm"
  >
    <WifiOff class="w-3.5 h-3.5 text-rose-300 shrink-0" />
    <span>Can't reach the server. Retrying automatically…</span>
    <button
      type="button"
      onclick={retryNow}
      disabled={checking}
      class="flex items-center gap-1 px-2 py-0.5 border border-rose-400/60 hover:bg-rose-900 text-rose-100 tracking-wider disabled:opacity-50"
    >
      <RefreshCw class="w-3 h-3 {checking ? 'animate-spin' : ''}" />
      <span>{checking ? 'Checking' : 'Retry now'}</span>
    </button>
  </div>
{:else if connection.justReconnected}
  <div
    role="status"
    class="fixed top-0 inset-x-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 bg-emerald-950/95 border-b border-emerald-500/50 text-emerald-200 text-xs font-mono"
  >
    <CheckCircle2 class="w-3.5 h-3.5" />
    <span>Back online</span>
  </div>
{/if}

