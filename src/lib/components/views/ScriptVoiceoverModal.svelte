<script lang="ts">
  import { onMount } from 'svelte';
  import { portal } from '../../utils/portal';
  import { api } from '../../api/client';
  import { appState } from '../../stores/appState.svelte';
  import type { Script, ScriptClip, VoiceOption, VoiceQuota } from '../../types';
  import {
    Volume2,
    Play,
    Pause,
    Download,
    Sparkles,
    Check,
    X,
    Lock,
    RefreshCw,
    Film,
    Globe,
    Gauge,
    AlertCircle,
    ArrowUpRight
  } from 'lucide-svelte';

  interface Props {
    script: Script;
    isOpen: boolean;
    onClose: () => void;
    onScriptUpdated: (updatedScript: Script) => void;
  }

  let { script, isOpen, onClose, onScriptUpdated }: Props = $props();

  let voiceOptions = $state<VoiceOption[]>([]);
  let quota = $state<VoiceQuota | null>(null);
  let selectedVoiceId = $state('en');
  let selectedFormat = $state<'mp3' | 'wav'>('mp3');

  let isSynthesizingAll = $state(false);
  let synthesizingClipId = $state<number | null>(null);
  let activeAudioPlayingUrl = $state<string | null>(null);
  let audioPlayerEl = $state<HTMLAudioElement | null>(null);
  let isMasterPlaying = $state(false);
  let masterAudioPlayerEl = $state<HTMLAudioElement | null>(null);
  let errorMessage = $state<string | null>(null);

  onMount(async () => {
    if (script.voice_id) selectedVoiceId = script.voice_id;
    await loadVoicesAndQuota();
  });

  $effect(() => {
    if (isOpen) {
      if (script.voice_id) selectedVoiceId = script.voice_id;
      loadVoicesAndQuota();
    } else {
      stopAudio();
    }
  });

  async function loadVoicesAndQuota() {
    try {
      const [voices, q] = await Promise.all([
        api.getVoiceOptions().catch(() => [
          { id: 'en', name: 'English (Studio Kokoro)', language: 'en', language_name: 'English', gender: 'Natural', engine: 'Kokoro-82M', sample_rate: 24000 },
          { id: 'ha', name: 'Hausa (Meta MMS)', language: 'ha', language_name: 'Hausa', gender: 'Natural', engine: 'Meta MMS', sample_rate: 16000 },
          { id: 'fr', name: 'French (Meta MMS)', language: 'fr', language_name: 'French', gender: 'Natural', engine: 'Meta MMS', sample_rate: 16000 }
        ]),
        api.getVoiceQuota().catch(() => null)
      ]);
      voiceOptions = voices;
      quota = q;
    } catch (e: any) {
      console.warn('Voice quota fetch note:', e);
    }
  }

  function stopAudio() {
    if (audioPlayerEl) {
      audioPlayerEl.pause();
      audioPlayerEl.src = '';
    }
    if (masterAudioPlayerEl) {
      masterAudioPlayerEl.pause();
      masterAudioPlayerEl.src = '';
    }
    activeAudioPlayingUrl = null;
    isMasterPlaying = false;
  }

  function togglePlayClip(audioUrl: string | undefined) {
    if (!audioUrl) return;
    const fullUrl = api.getAudioUrl(audioUrl);
    if (activeAudioPlayingUrl === fullUrl && audioPlayerEl && !audioPlayerEl.paused) {
      audioPlayerEl.pause();
      activeAudioPlayingUrl = null;
      return;
    }
    if (audioPlayerEl) {
      audioPlayerEl.src = fullUrl;
      audioPlayerEl.play().catch(e => console.error('Audio play error:', e));
      activeAudioPlayingUrl = fullUrl;
    }
  }

  function togglePlayMaster() {
    if (!script.full_audio_url) return;
    const fullUrl = api.getAudioUrl(script.full_audio_url);
    if (masterAudioPlayerEl) {
      if (isMasterPlaying) {
        masterAudioPlayerEl.pause();
        isMasterPlaying = false;
      } else {
        masterAudioPlayerEl.src = fullUrl;
        masterAudioPlayerEl.play().catch(e => console.error('Master play error:', e));
        isMasterPlaying = true;
      }
    }
  }

  async function handleSynthesizeSingleClip(clip: ScriptClip) {
    if (!clip.id) return;
    errorMessage = null;
    synthesizingClipId = clip.id;
    try {
      const updatedClip = await api.synthesizeClipAudio(script.id, clip.id, {
        spoken_dialogue: clip.spoken_dialogue,
        voice_id: selectedVoiceId,
        format: selectedFormat
      });

      // Update local script clips
      if (script.clips) {
        script.clips = script.clips.map(c => c.id === clip.id ? { ...c, audio_url: updatedClip.audio_url, audio_duration: updatedClip.audio_duration } : c);
      }
      onScriptUpdated(script);
      appState.showToast(`Scene ${clip.clip_number} voiceover synthesized!`, 'success');
      loadVoicesAndQuota();
    } catch (e: any) {
      errorMessage = e.message || 'Clip voiceover failed';
      appState.showToast(errorMessage, 'error');
    } finally {
      synthesizingClipId = null;
    }
  }

  async function handleSynthesizeAll() {
    errorMessage = null;
    isSynthesizingAll = true;
    appState.showToast('Generating full script audio with Nu-Voice...', 'info');
    try {
      const updatedScript = await api.synthesizeFullScriptAudio(script.id, {
        voice_id: selectedVoiceId,
        format: selectedFormat
      });
      onScriptUpdated(updatedScript);
      appState.showToast('Full studio voiceover generated and master audio merged!', 'success');
      await loadVoicesAndQuota();
    } catch (e: any) {
      errorMessage = e.message || 'Full script voiceover failed';
      appState.showToast(errorMessage, 'error');
    } finally {
      isSynthesizingAll = false;
    }
  }

  function triggerDownloadMaster() {
    if (!script.id) return;
    const downloadUrl = api.getMasterAudioDownloadUrl(script.id);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${script.title.replace(/\s+/g, '_')}_master.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
</script>

<!-- Hidden Audio Player Elements -->
<audio
  bind:this={audioPlayerEl}
  onended={() => (activeAudioPlayingUrl = null)}
></audio>
<audio
  bind:this={masterAudioPlayerEl}
  onended={() => (isMasterPlaying = false)}
></audio>

{#if isOpen}
  <div use:portal class="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 pb-16 bg-black/85 backdrop-blur-sm animate-in fade-in">
    <!-- Backdrop dismiss -->
    <button
      type="button"
      onclick={onClose}
      class="fixed inset-0 cursor-default"
      aria-label="Close modal"
      tabindex="-1"
    ></button>

    <div class="relative w-full max-w-2xl swiss-card border border-purple-800 bg-[#0e071a] p-6 space-y-5 shadow-2xl z-10 modal-spring">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-purple-900/60 pb-3.5">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded bg-amber-400 text-black">
            <Volume2 class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white font-display">Studio Voiceover</h3>
            <p class="text-xs font-mono text-slate-400">Powered by Nu-Voice & Kokoro-82M</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Quota Badge -->
          {#if quota}
            {#if quota.is_unlimited}
              <span class="px-2.5 py-1 bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-[11px] font-mono rounded-full font-bold flex items-center gap-1">
                <Sparkles class="w-3 h-3 text-emerald-400" />
                <span>Creator Pro • Unlimited</span>
              </span>
            {:else}
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 bg-purple-950 border border-amber-400/40 text-amber-300 text-[11px] font-mono rounded-full">
                  {quota.remaining} of {quota.voiceover_generations_limit} free uses left
                </span>
                {#if quota.remaining <= 1}
                  <button
                    type="button"
                    onclick={() => appState.showToast('Flutterwave subscription checkout coming up in next update!', 'info')}
                    class="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold text-[10px] font-mono rounded flex items-center gap-1 transition-colors"
                  >
                    <span>Upgrade</span>
                    <ArrowUpRight class="w-3 h-3" />
                  </button>
                {/if}
              </div>
            {/if}
          {/if}

          <button
            type="button"
            onclick={onClose}
            class="p-1.5 text-slate-400 hover:text-white rounded hover:bg-purple-950 transition-colors"
            title="Close"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      {#if errorMessage}
        <div class="p-3 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs font-mono rounded flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      {/if}

      <!-- Engine & Voice Selection Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-black/60 border border-purple-900/60 rounded">
        <div>
          <label class="block text-xs font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Globe class="w-3.5 h-3.5 text-amber-400" />
            <span>Voice Language Engine</span>
          </label>
          <select
            bind:value={selectedVoiceId}
            class="w-full px-3 py-1.5 bg-black border border-purple-900 text-amber-300 text-xs font-mono rounded focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {#each voiceOptions as v}
              <option value={v.id} class="bg-[#10071c] text-slate-200">
                {v.name} ({v.engine})
              </option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-xs font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Gauge class="w-3.5 h-3.5 text-purple-400" />
            <span>Output Format</span>
          </label>
          <div class="flex items-center gap-2">
            <button
              type="button"
              onclick={() => (selectedFormat = 'mp3')}
              class="flex-1 py-1.5 text-xs font-mono rounded border transition-colors {selectedFormat === 'mp3' ? 'bg-amber-400 text-black border-amber-300 font-bold' : 'bg-black text-slate-400 border-purple-900'}"
            >
              MP3 (Fast & Compact)
            </button>
            <button
              type="button"
              onclick={() => (selectedFormat = 'wav')}
              class="flex-1 py-1.5 text-xs font-mono rounded border transition-colors {selectedFormat === 'wav' ? 'bg-amber-400 text-black border-amber-300 font-bold' : 'bg-black text-slate-400 border-purple-900'}"
            >
              WAV (Lossless)
            </button>
          </div>
        </div>
      </div>

      <!-- Master Audio Card (If Generated) -->
      {#if script.full_audio_url}
        <div class="p-4 bg-purple-950/40 border border-emerald-500/50 rounded space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <span class="text-xs font-bold text-white font-display">Full Script Master Audio Ready</span>
                <p class="text-[11px] font-mono text-slate-400">All scenes stitched into continuous broadcast track</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick={togglePlayMaster}
                class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs font-mono rounded transition-colors"
              >
                {#if isMasterPlaying}
                  <Pause class="w-3.5 h-3.5 fill-black" />
                  <span>Pause Master</span>
                {:else}
                  <Play class="w-3.5 h-3.5 fill-black" />
                  <span>Play Master</span>
                {/if}
              </button>

              <button
                type="button"
                onclick={triggerDownloadMaster}
                class="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-purple-800 text-amber-300 hover:text-white hover:border-amber-400 text-xs font-mono rounded transition-colors"
                title="Download Master MP3 file directly to your device"
              >
                <Download class="w-3.5 h-3.5 text-amber-400" />
                <span>Download MP3</span>
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Scene Breakdown Audio List -->
      <div class="space-y-2">
        <div class="flex items-center justify-between border-b border-purple-900/40 pb-2">
          <span class="text-xs font-mono text-slate-400">Scene Clips ({script.clips?.length || 0})</span>
          <span class="text-[10px] font-mono text-purple-400">Synthesize individually or all at once</span>
        </div>

        {#if !script.clips || script.clips.length === 0}
          <div class="p-6 text-center text-xs font-mono text-slate-500 border border-purple-900/40 rounded">
            No scenes partitioned yet. Use "Re-sync Scenes from Text" in Script Studio.
          </div>
        {:else}
          <div class="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {#each script.clips as clip}
              <div class="p-3 bg-black/60 border border-purple-900/70 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div class="space-y-1 min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="w-4 h-4 rounded bg-amber-400 text-black font-bold text-[10px] flex items-center justify-center">
                      {clip.clip_number}
                    </span>
                    <span class="font-bold text-white text-[11px] truncate">
                      {clip.on_screen_text ? `Scene ${clip.clip_number}: ${clip.on_screen_text}` : `Scene ${clip.clip_number}`}
                    </span>
                    {#if clip.audio_url}
                      <span class="px-1.5 py-0.2 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px] rounded">
                        ✓ Ready ({clip.audio_duration ? `${clip.audio_duration}s` : 'audio'})
                      </span>
                    {/if}
                  </div>
                  <p class="text-slate-400 text-[11px] line-clamp-1 italic">
                    "{clip.spoken_dialogue || 'No dialogue'}"
                  </p>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  {#if clip.audio_url}
                    {@const isThisPlaying = activeAudioPlayingUrl === api.getAudioUrl(clip.audio_url)}
                    <button
                      type="button"
                      onclick={() => togglePlayClip(clip.audio_url)}
                      class="flex items-center gap-1 px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-amber-300 border border-purple-800 text-[11px] rounded transition-colors"
                      title="Play scene voiceover preview"
                    >
                      {#if isThisPlaying}
                        <Pause class="w-3 h-3 fill-current" />
                        <span>Pause</span>
                      {:else}
                        <Play class="w-3 h-3 fill-current" />
                        <span>Play</span>
                      {/if}
                    </button>
                  {/if}

                  <button
                    type="button"
                    onclick={() => handleSynthesizeSingleClip(clip)}
                    disabled={synthesizingClipId === clip.id || isSynthesizingAll}
                    class="flex items-center gap-1 px-2.5 py-1 bg-black hover:bg-purple-950 text-slate-300 hover:text-white border border-purple-900 text-[11px] rounded transition-colors disabled:opacity-40"
                    title="Synthesize single scene voiceover"
                  >
                    {#if synthesizingClipId === clip.id}
                      <RefreshCw class="w-3 h-3 text-amber-400 animate-spin" />
                      <span>Generating...</span>
                    {:else}
                      <Volume2 class="w-3 h-3 text-purple-400" />
                      <span>{clip.audio_url ? 'Re-voice' : 'Voice'}</span>
                    {/if}
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Action Footer -->
      <div class="pt-3 border-t border-purple-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-[11px] font-mono text-slate-400">
          Generated audio is cached locally and available for instant download.
        </p>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onclick={handleSynthesizeAll}
            disabled={isSynthesizingAll || !script.clips || script.clips.length === 0}
            class="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-bold font-display text-xs tracking-wider rounded transition-all shadow-lg disabled:opacity-40"
          >
            {#if isSynthesizingAll}
              <RefreshCw class="w-4 h-4 text-black animate-spin" />
              <span>Synthesizing Voiceovers...</span>
            {:else}
              <Sparkles class="w-4 h-4 text-black" />
              <span>{script.full_audio_url ? 'Re-Synthesize Full Voiceover' : 'Generate Full Voiceover'}</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
