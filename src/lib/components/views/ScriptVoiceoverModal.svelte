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
    X,
    Lock,
    RefreshCw,
    AlertCircle,
    ArrowUpRight,
    Mic
  } from 'lucide-svelte';

  interface Props {
    script: Script;
    isOpen: boolean;
    onClose: () => void;
    onScriptUpdated: (updatedScript: Script) => void;
  }

  let { script, isOpen, onClose, onScriptUpdated }: Props = $props();

  let voiceOptions = $state<VoiceOption[]>([
    { id: 'af_heart', name: 'Heart (Natural & Warm)', language: 'en', language_name: 'English', gender: 'Female', engine: 'Kokoro-82M', sample_rate: 24000 },
    { id: 'am_adam', name: 'Adam (Deep & Confident)', language: 'en', language_name: 'English', gender: 'Male', engine: 'Kokoro-82M', sample_rate: 24000 },
    { id: 'af_bella', name: 'Bella (Expressive & Dynamic)', language: 'en', language_name: 'English', gender: 'Female', engine: 'Kokoro-82M', sample_rate: 24000 },
    { id: 'am_michael', name: 'Michael (Authoritative & Smooth)', language: 'en', language_name: 'English', gender: 'Male', engine: 'Kokoro-82M', sample_rate: 24000 },
    { id: 'bf_alice', name: 'Alice (British Conversational)', language: 'en', language_name: 'English (UK)', gender: 'Female', engine: 'Kokoro-82M', sample_rate: 24000 },
    { id: 'bm_george', name: 'George (British Storyteller)', language: 'en', language_name: 'English (UK)', gender: 'Male', engine: 'Kokoro-82M', sample_rate: 24000 },
    { id: 'ha', name: 'Amina (Hausa Natural)', language: 'ha', language_name: 'Hausa', gender: 'Female', engine: 'Meta MMS', sample_rate: 16000 },
    { id: 'fr', name: 'Camille (French Natural)', language: 'fr', language_name: 'French', gender: 'Female', engine: 'Meta MMS', sample_rate: 16000 }
  ]);

  let quota = $state<VoiceQuota | null>(null);
  let selectedVoiceId = $state('af_heart');
  let selectedFormat = $state<'mp3' | 'wav'>('mp3');

  let synthesizingClipId = $state<number | null>(null);
  let activeAudioPlayingUrl = $state<string | null>(null);
  let audioPlayerEl = $state<HTMLAudioElement | null>(null);
  let errorMessage = $state<string | null>(null);

  let isQuotaExceeded = $derived.by(() => {
    if (!quota) return false;
    if (quota.is_unlimited) return false;
    return quota.remaining <= 0;
  });

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
        api.getVoiceOptions().catch(() => voiceOptions),
        api.getVoiceQuota().catch(() => null)
      ]);
      if (voices && voices.length > 0) voiceOptions = voices;
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
    activeAudioPlayingUrl = null;
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
      if (audioPlayerEl.src !== fullUrl) {
        audioPlayerEl.src = fullUrl;
        audioPlayerEl.load();
      }
      audioPlayerEl.play().catch(e => {
        console.error('Audio play error for URL:', fullUrl, e);
        appState.showToast('Unable to play audio. Check connection or re-synthesize.', 'error');
      });
      activeAudioPlayingUrl = fullUrl;
    }
  }

  async function handleSynthesizeSingleClip(clip: ScriptClip) {
    if (!clip.id) return;
    if (isQuotaExceeded) {
      appState.showToast('Free limit reached (5 of 5 used). Upgrade to Creator Pro for unlimited voiceovers.', 'error');
      return;
    }

    errorMessage = null;
    synthesizingClipId = clip.id;
    try {
      const updatedClip = await api.synthesizeClipAudio(script.id, clip.id, {
        spoken_dialogue: clip.spoken_dialogue,
        voice_id: selectedVoiceId,
        format: selectedFormat
      });

      if (script.clips) {
        script.clips = script.clips.map(c => c.id === clip.id ? { ...c, audio_url: updatedClip.audio_url, audio_duration: updatedClip.audio_duration } : c);
      }
      onScriptUpdated(script);
      appState.showToast(`Scene ${clip.clip_number} voice synthesized!`, 'success');
      await loadVoicesAndQuota();
    } catch (e: any) {
      errorMessage = e.message || 'Scene voiceover failed';
      appState.showToast(errorMessage, 'error');
    } finally {
      synthesizingClipId = null;
    }
  }

  function triggerDownloadClip(clip: ScriptClip) {
    if (!script.id || !clip.id) return;
    const downloadUrl = api.getClipAudioDownloadUrl(script.id, clip.id);
    const a = document.createElement('a');
    a.href = downloadUrl;
    const safeTitle = (script.title || 'script').replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
    a.setAttribute('download', `${safeTitle}_scene_${clip.clip_number}.mp3`);
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
</script>

<!-- Hidden Audio Player -->
<audio
  bind:this={audioPlayerEl}
  onended={() => (activeAudioPlayingUrl = null)}
></audio>

{#if isOpen}
  <div use:portal class="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-3 sm:p-6 pt-6 sm:pt-10 pb-16 bg-black/85 backdrop-blur-sm animate-in fade-in">
    <!-- Backdrop dismiss -->
    <button
      type="button"
      onclick={onClose}
      class="fixed inset-0 cursor-default"
      aria-label="Close modal"
      tabindex="-1"
    ></button>

    <div class="relative w-full max-w-xl swiss-card border border-purple-800 bg-[#0c0617] p-5 sm:p-6 space-y-4 shadow-2xl z-10 modal-spring">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-purple-900/50 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded bg-amber-400 text-black flex items-center justify-center shrink-0">
            <Volume2 class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white font-display leading-tight">Scene Voiceover</h3>
            <p class="text-[11px] text-slate-400">Generate and download studio voice for each scene</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Quota Badge -->
          {#if quota}
            {#if quota.is_unlimited}
              <span class="px-2.5 py-1 bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-[11px] font-mono rounded font-bold flex items-center gap-1">
                <Sparkles class="w-3 h-3 text-emerald-400" />
                <span>Pro • Unlimited</span>
              </span>
            {:else if quota.remaining > 0}
              <span class="px-2.5 py-1 bg-purple-950/80 border border-amber-400/30 text-amber-300 text-[11px] font-mono rounded">
                <strong class="text-amber-400">{quota.remaining}</strong> of {quota.voiceover_generations_limit} free uses left
              </span>
            {:else}
              <span class="px-2.5 py-1 bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] font-mono rounded font-bold">
                0 free uses left
              </span>
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

      <!-- Upgrade Alert (When Limit Reached) -->
      {#if isQuotaExceeded}
        <div class="p-3.5 bg-gradient-to-r from-purple-950/90 to-amber-950/50 border border-amber-400/50 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div class="space-y-0.5">
            <div class="flex items-center gap-1.5 text-amber-300 font-bold">
              <Lock class="w-3.5 h-3.5 text-amber-400" />
              <span>Free limit reached (5 of 5 used)</span>
            </div>
            <p class="text-slate-300 text-[11px]">
              Upgrade to Creator Pro for unlimited studio voiceovers.
            </p>
          </div>

          <button
            type="button"
            onclick={() => appState.showToast('Flutterwave Pro checkout ready. Contact support or choose Pro in billing!', 'info')}
            class="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs font-mono rounded shrink-0 flex items-center gap-1.5 transition-all shadow-md"
          >
            <span>Upgrade to Pro</span>
            <ArrowUpRight class="w-3.5 h-3.5" />
          </button>
        </div>
      {/if}

      {#if errorMessage}
        <div class="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-mono rounded flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      {/if}

      <!-- Voice Selection Grid -->
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs font-mono">
          <label for="voice-persona-select" class="text-slate-400 flex items-center gap-1.5">
            <Mic class="w-3.5 h-3.5 text-amber-400" />
            <span>Select Voice Persona</span>
          </label>

          <!-- Format Pills -->
          <div class="flex items-center gap-1">
            <button
              type="button"
              onclick={() => (selectedFormat = 'mp3')}
              class="px-2 py-0.5 text-[10px] font-mono rounded border transition-colors {selectedFormat === 'mp3' ? 'bg-amber-400 text-black border-amber-300 font-bold' : 'bg-black text-slate-400 border-purple-900'}"
            >
              MP3
            </button>
            <button
              type="button"
              onclick={() => (selectedFormat = 'wav')}
              class="px-2 py-0.5 text-[10px] font-mono rounded border transition-colors {selectedFormat === 'wav' ? 'bg-amber-400 text-black border-amber-300 font-bold' : 'bg-black text-slate-400 border-purple-900'}"
            >
              WAV
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {#each voiceOptions as v}
            {@const isSelected = selectedVoiceId === v.id}
            <button
              type="button"
              onclick={() => (selectedVoiceId = v.id)}
              class="p-2 rounded border text-left transition-all duration-150 {
                isSelected
                  ? 'bg-amber-400/15 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/50'
                  : 'bg-black/60 border-purple-900/60 text-slate-400 hover:text-slate-200 hover:border-purple-700'
              }"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold truncate {isSelected ? 'text-amber-300' : 'text-slate-200'}">
                  {v.name.split(' ')[0]}
                </span>
                {#if isSelected}
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                {/if}
              </div>
              <div class="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                {v.language_name} • {v.gender || 'Natural'}
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Scene-by-Scene Audio Generation & Download List -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-xs font-mono text-slate-400 pb-1">
          <span>Scenes ({script.clips?.length || 0})</span>
          <span class="text-[10px] text-purple-400">Generate and download scene audio</span>
        </div>

        {#if !script.clips || script.clips.length === 0}
          <div class="p-4 text-center text-xs font-mono text-slate-500 border border-purple-900/40 rounded">
            No scenes defined yet in Script Studio.
          </div>
        {:else}
          <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
            {#each script.clips as clip}
              <div class="p-3 bg-black/60 border border-purple-900/60 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono hover:border-purple-800 transition-colors">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-1.5 py-0.5 rounded bg-amber-400 text-black font-bold text-[10px] shrink-0">
                      Scene {clip.clip_number}
                    </span>
                    {#if clip.audio_duration}
                      <span class="text-[10px] text-emerald-400 font-mono">
                        {clip.audio_duration.toFixed(1)}s audio
                      </span>
                    {/if}
                  </div>
                  <p class="text-slate-300 text-[11px] line-clamp-2 leading-relaxed">
                    {clip.spoken_dialogue || 'Empty dialogue'}
                  </p>
                </div>

                <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {#if clip.audio_url}
                    {@const isThisPlaying = activeAudioPlayingUrl === api.getAudioUrl(clip.audio_url)}
                    <!-- Play/Pause Preview -->
                    <button
                      type="button"
                      onclick={() => togglePlayClip(clip.audio_url)}
                      class="px-2 py-1 bg-purple-950 hover:bg-purple-900 text-amber-300 border border-purple-800 text-[11px] rounded transition-colors flex items-center gap-1"
                      title="Play scene preview"
                    >
                      {#if isThisPlaying}
                        <Pause class="w-3 h-3 fill-current text-amber-400" />
                        <span class="text-[10px]">Pause</span>
                      {:else}
                        <Play class="w-3 h-3 fill-current text-amber-400" />
                        <span class="text-[10px]">Play</span>
                      {/if}
                    </button>

                    <!-- Direct Download Button for this Scene -->
                    <button
                      type="button"
                      onclick={() => triggerDownloadClip(clip)}
                      class="px-2 py-1 bg-black hover:bg-purple-950 text-emerald-400 hover:text-emerald-300 border border-purple-800 text-[11px] rounded transition-colors flex items-center gap-1"
                      title="Download scene audio"
                    >
                      <Download class="w-3 h-3" />
                      <span class="text-[10px]">Download</span>
                    </button>
                  {/if}

                  <!-- Generate / Re-voice Button -->
                  <button
                    type="button"
                    onclick={() => handleSynthesizeSingleClip(clip)}
                    disabled={synthesizingClipId === clip.id || isQuotaExceeded}
                    class="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold border border-amber-300 text-[11px] rounded transition-colors disabled:opacity-40 flex items-center gap-1"
                    title={isQuotaExceeded ? 'Free quota reached' : 'Synthesize scene audio'}
                  >
                    {#if synthesizingClipId === clip.id}
                      <RefreshCw class="w-3 h-3 animate-spin text-black" />
                      <span class="text-[10px]">Generating...</span>
                    {:else}
                      <Sparkles class="w-3 h-3 text-black" />
                      <span class="text-[10px]">{clip.audio_url ? 'Re-voice' : 'Voice'}</span>
                    {/if}
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Action Footer -->
      <div class="pt-3 border-t border-purple-900/50 flex items-center justify-between gap-3">
        <p class="text-[11px] font-mono text-slate-400">
          Synthesize voiceover scene-by-scene for fast, reliable generation.
        </p>

        <button
          type="button"
          onclick={onClose}
          class="px-4 py-1.5 bg-black hover:bg-purple-950 border border-purple-800 text-xs font-mono text-slate-300 hover:text-white rounded transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  </div>
{/if}
