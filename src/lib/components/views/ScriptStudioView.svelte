<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import type { Script, ScriptClip } from '../../types';
  import {
    FileCode,
    Sparkles,
    Copy,
    Check,
    Plus,
    Trash2,
    Clock,
    Wand2,
    Layers,
    Save,
    Film
  } from 'lucide-svelte';
  import { reveal } from '../../utils/reveal';

  let scripts = $state<Script[]>([]);
  let activeScript = $state<Script | null>(null);
  let isGenerating = $state(false);
  let isBreakingDown = $state(false);
  let isCopied = $state(false);

  let showPromptModal = $state(false);
  let promptTopic = $state('');
  let promptTone = $state('Conversational & Punchy');
  let promptFormat = $state('Short Video');
  let promptDuration = $state(60);

  onMount(loadScripts);

  $effect(() => {
    if (appState.pendingScriptDraft) {
      const draft = appState.pendingScriptDraft;
      appState.pendingScriptDraft = null;
      handleIncomingDraft(draft);
    }
  });

  async function handleIncomingDraft(draft: {
    topic: string;
    format?: string;
    tone?: string;
    hooks?: string[];
    talking_points?: string[];
    autoGenerate?: boolean;
  }) {
    promptTopic = draft.topic;
    if (draft.format) promptFormat = draft.format;
    if (draft.tone) promptTone = draft.tone;

    // Immediately set activeScript to the incoming topic so the user never sees an unrelated fallback
    activeScript = {
      id: 0,
      title: draft.topic,
      tone: promptTone,
      target_duration_seconds: promptDuration,
      full_script: `[GENERATING LIVE SCRIPT WITH GEMINI...]\n\nTopic: ${draft.topic}\nNiche: ${appState.preferences.primary_niche}\nFormat: ${promptFormat}\n\nPlease wait a moment while Google Gemini crafts the hooks, dialogue, and camera scenes...`,
      generated_hooks: draft.hooks && draft.hooks.length > 0 ? draft.hooks : ['Generating high-retention hooks...'],
      generated_ctas: ['Follow for more creator insights!'],
      clips: [
        {
          clip_number: 1,
          spoken_dialogue: draft.hooks?.[0] || 'Hook opening...',
          estimated_duration: 6,
          on_screen_text: 'ATTENTION',
          visual_direction: 'Direct to camera with punch-in zoom',
          transition: 'Zoom In'
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (draft.autoGenerate) {
      await generateLiveScript(draft.topic, promptTone, promptFormat, promptDuration);
    }
  }

  async function generateLiveScript(topic: string, tone: string, format: string, duration: number) {
    try {
      isGenerating = true;
      appState.showToast(`Gemini is generating complete script for "${topic}"...`, 'info');
      const res = await api.generateScript({
        topic: topic,
        niche: appState.preferences.primary_niche,
        tone: tone,
        format: format,
        target_duration_seconds: duration
      });

      const saved = await api.createScript({
        title: res.title || topic,
        tone: tone,
        target_duration_seconds: duration,
        full_script: res.full_script,
        generated_hooks: res.hooks || [],
        generated_ctas: res.ctas || [],
        clips: res.clips || []
      });

      scripts = [saved, ...scripts.filter(s => s.id !== saved.id)];
      activeScript = saved;
      showPromptModal = false;
      promptTopic = '';
      appState.showToast(`Script generated: "${saved.title}"!`, 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Generation failed', 'error');
      if (activeScript && activeScript.id === 0) {
        activeScript.full_script = `Generation error: ${e.message}\n\nYou can retry using the "AI Generate" button in the toolbar.`;
      }
    } finally {
      isGenerating = false;
    }
  }

  async function loadScripts() {
    try {
      scripts = await api.getScripts();
      if (scripts.length > 0) {
        // If an activeScript wasn't already set by handleIncomingDraft
        if (!activeScript || activeScript.id !== 0) {
          activeScript = scripts[0];
        }
      } else if (!activeScript) {
        activeScript = {
          id: 0,
          title: `Getting Started with ${appState.preferences.primary_niche}`,
          tone: 'Conversational',
          target_duration_seconds: 60,
          full_script: `[HOOK]\nWelcome to Script Studio. Click "AI Generate Script" to write a full video script with Google Gemini.\n\n[CORE BREAKDOWN]\nOr select any daily news angle in Discover to automatically draft and generate your video scripts here.\n\n[CALL TO ACTION]\nFollow for more creator insights!`,
          generated_hooks: [
            `Stop scrolling: here is how to master ${appState.preferences.sub_niche || appState.preferences.primary_niche}.`,
            'The exact formula top creators use every day.'
          ],
          generated_ctas: [
            'Follow for more daily breakdowns in this space.'
          ],
          clips: [
            {
              clip_number: 1,
              spoken_dialogue: `Stop scrolling: here is how to master ${appState.preferences.primary_niche}.`,
              estimated_duration: 6,
              on_screen_text: 'STOP SCROLLING',
              visual_direction: 'Direct to camera with punch-in zoom',
              transition: 'Zoom In'
            }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    } catch (e: any) {
      console.error(e);
    }
  }

  let wordCount = $derived(
    activeScript?.full_script ? activeScript.full_script.trim().split(/\s+/).length : 0
  );
  let estimatedDurationSec = $derived(Math.round(wordCount / 2.5));
  let clipsDurationTotal = $derived(
    activeScript?.clips ? activeScript.clips.reduce((sum, c) => sum + (c.estimated_duration || 0), 0) : 0
  );

  async function handleAIGenerateScript(e: Event) {
    e.preventDefault();
    if (!promptTopic.trim()) return;
    await generateLiveScript(promptTopic, promptTone, promptFormat, promptDuration);
  }

  async function handleBreakdownClips() {
    if (!activeScript?.full_script) return;
    try {
      isBreakingDown = true;
      appState.showToast('Breaking script into scene cards...', 'info');
      const res = await api.breakdownClips(activeScript.full_script, activeScript.target_duration_seconds);
      if (activeScript) {
        activeScript.clips = res.clips;
      }
      appState.showToast('Parsed script into independent scenes!', 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Breakdown failed', 'error');
    } finally {
      isBreakingDown = false;
    }
  }

  async function handleSaveScript() {
    if (!activeScript) return;
    try {
      if (activeScript.id) {
        const updated = await api.updateScript(activeScript.id, activeScript);
        activeScript = updated;
      } else {
        const created = await api.createScript(activeScript);
        activeScript = created;
        scripts = [created, ...scripts];
      }
      appState.showToast('Script and clips saved!', 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Save failed', 'error');
    }
  }

  function handleAddClip() {
    if (!activeScript) return;
    const nextNum = (activeScript.clips?.length || 0) + 1;
    const newClip: ScriptClip = {
      clip_number: nextNum,
      spoken_dialogue: '',
      estimated_duration: 5,
      on_screen_text: `SCENE ${nextNum}`,
      visual_direction: 'Camera framing notes...',
      transition: 'Cut'
    };
    activeScript.clips = [...(activeScript.clips || []), newClip];
  }

  function handleRemoveClip(index: number) {
    if (!activeScript?.clips) return;
    activeScript.clips = activeScript.clips.filter((_, i) => i !== index);
    activeScript.clips.forEach((c, idx) => (c.clip_number = idx + 1));
  }

  function copyTeleprompterText() {
    if (!activeScript?.full_script) return;
    navigator.clipboard.writeText(activeScript.full_script);
    isCopied = true;
    appState.showToast('Copied to clipboard for teleprompter!', 'info');
    setTimeout(() => (isCopied = false), 2500);
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <!-- Swiss Header -->
  <div class="swiss-card p-6 border border-purple-900/60 bg-[#10071c] space-y-4">
    <div class="flex items-center justify-between border-b border-purple-900/40 pb-3">
      <div class="flex items-center gap-2">
        <FileCode class="w-4 h-4 text-amber-400" />
        <span class="swiss-tag text-amber-400">
          Script Drafting & Scenes
        </span>
      </div>
      <span class="swiss-tag text-purple-400 font-mono">
        AI Assisted
      </span>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-display">
          Script Studio
        </h1>
        <p class="text-xs text-slate-300 mt-1">
          Draft spoken scripts, test 3-second hook formulas, and structure scenes for filming.
        </p>
      </div>

      <div class="flex items-center gap-2.5 shrink-0">
        <button
          onclick={copyTeleprompterText}
          class="flex items-center gap-1.5 px-3 py-2 bg-black border border-purple-900 hover:border-amber-400/50 text-slate-200 text-xs font-mono uppercase transition-all"
        >
          {#if isCopied}
            <Check class="w-3.5 h-3.5 text-emerald-400" />
            <span>Copied</span>
          {:else}
            <Copy class="w-3.5 h-3.5 text-amber-400" />
            <span>Teleprompter</span>
          {/if}
        </button>

        <button
          onclick={() => (showPromptModal = true)}
          class="flex items-center gap-2 px-4 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 text-xs font-mono uppercase font-bold tracking-wider transition-all"
        >
          <Sparkles class="w-4 h-4 text-amber-400" />
          <span>AI Script Gen</span>
        </button>

        <button
          onclick={handleSaveScript}
          class="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase font-display tracking-wider transition-all"
        >
          <Save class="w-4 h-4" />
          <span>Save Draft</span>
        </button>
      </div>
    </div>
  </div>

  {#if activeScript}
    <!-- Two Column Workspace -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left Column: Script Drafting (7 cols) -->
      <div class="lg:col-span-7 space-y-5">
        <div class="swiss-card p-5 border border-purple-900/60 bg-[#10071c] space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/40 pb-3">
            <input
              type="text"
              bind:value={activeScript.title}
              placeholder="Script Title..."
              class="text-lg font-black text-white bg-transparent border-none focus:outline-none w-full font-display uppercase tracking-tight"
            />
            <span class="swiss-tag px-2 py-1 bg-black border border-purple-900 text-amber-400 shrink-0">
              ~{estimatedDurationSec}s [{wordCount} words]
            </span>
          </div>

          <div>
            <label for="script-editor-content" class="block swiss-tag text-slate-400 mb-1.5">Dialogue & Teleprompter Text</label>
            <textarea
              id="script-editor-content"
              bind:value={activeScript.full_script}
              rows={14}
              placeholder="Write your dialogue here... Use [HOOK], [POINT 1], and [CTA] to organize sections."
              class="w-full p-4 bg-black border border-purple-950 text-slate-100 text-xs font-mono leading-relaxed placeholder-slate-600 focus:outline-none focus:border-amber-400"
            ></textarea>
          </div>

          <div class="flex items-center justify-between pt-2">
            <span class="text-xs text-slate-400 font-mono">Want to sync scenes with text?</span>
            <button
              onclick={handleBreakdownClips}
              disabled={isBreakingDown}
              class="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950 hover:bg-purple-900 text-amber-300 border border-purple-800 text-xs font-mono uppercase disabled:opacity-50"
            >
              <Wand2 class="w-3.5 h-3.5" />
              <span>{isBreakingDown ? 'Parsing...' : 'Re-sync Clips from Text'}</span>
            </button>
          </div>
        </div>

        <!-- Generated Hooks Card -->
        {#if (activeScript.generated_hooks && activeScript.generated_hooks.length > 0) || (activeScript.generated_ctas && activeScript.generated_ctas.length > 0)}
          <div class="swiss-card p-5 border border-purple-900/60 bg-[#10071c] space-y-4">
            <div class="flex items-center gap-2">
              <Sparkles class="w-3.5 h-3.5 text-amber-400" />
              <span class="swiss-tag text-amber-400">TESTED 3-SECOND HOOK FORMULAS</span>
            </div>

            {#if activeScript.generated_hooks && activeScript.generated_hooks.length > 0}
              <div class="space-y-2">
                {#each activeScript.generated_hooks as hook}
                  <div class="p-2.5 bg-black border border-purple-950 text-xs text-amber-300 font-mono">
                    "{hook}"
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Right Column: Scene Breakdown (5 cols) -->
      <div class="lg:col-span-5 space-y-4">
        <div class="flex items-center justify-between border-b border-purple-900/40 pb-2">
          <div class="flex items-center gap-2">
            <Film class="w-4 h-4 text-amber-400" />
            <h2 class="font-bold text-sm uppercase text-white font-display">Scene Breakdown</h2>
            <span class="text-[10px] font-mono text-purple-400">[{clipsDurationTotal}s total]</span>
          </div>

          <button
            onclick={handleAddClip}
            class="flex items-center gap-1 px-2 py-1 bg-black border border-purple-800 text-slate-300 text-xs font-mono uppercase hover:text-white"
          >
            <Plus class="w-3 h-3" />
            <span>Add Scene</span>
          </button>
        </div>

        {#if !activeScript.clips || activeScript.clips.length === 0}
          <div class="p-8 text-center swiss-card border border-purple-900/40 text-slate-500 text-xs font-mono space-y-3">
            <Layers class="w-8 h-8 mx-auto text-purple-600/40" />
            <p>No scenes generated yet. Click Re-sync Clips to break down your script.</p>
          </div>
        {:else}
          <div class="space-y-3 overflow-y-auto max-h-[82vh] pr-1">
            {#each activeScript.clips as clip, idx}
              <div use:reveal={{ delay: Math.min(idx * 50, 300) }} class="swiss-card swiss-card-hover p-4 border border-purple-900/50 bg-[#10071c] hover:border-amber-400/40 transition-all space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-5 h-5 bg-amber-400 text-black font-bold font-mono text-xs flex items-center justify-center">
                      {clip.clip_number}
                    </span>
                    <span class="text-xs font-bold text-white uppercase font-display">Scene {clip.clip_number}</span>
                  </div>

                  <div class="flex items-center gap-2">
                    <div class="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                      <Clock class="w-3 h-3 text-amber-400" />
                      <input
                        type="number"
                        bind:value={clip.estimated_duration}
                        class="w-10 bg-black border border-purple-900 px-1 text-center text-amber-400 text-xs font-mono"
                      />
                      <span>s</span>
                    </div>

                    <button
                      onclick={() => handleRemoveClip(idx)}
                      class="text-slate-600 hover:text-rose-400 p-1"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label for={`scene-dialogue-${clip.clip_number}`} class="block swiss-tag text-slate-400 mb-1">
                    Spoken Dialogue
                  </label>
                  <textarea
                    id={`scene-dialogue-${clip.clip_number}`}
                    bind:value={clip.spoken_dialogue}
                    rows={2}
                    placeholder="Spoken words..."
                    class="w-full p-2 bg-black border border-purple-950 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
                  ></textarea>
                </div>

                <div class="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label for={`scene-visual-${clip.clip_number}`} class="block swiss-tag text-slate-500 mb-0.5">Visual Cues</label>
                    <input
                      id={`scene-visual-${clip.clip_number}`}
                      type="text"
                      bind:value={clip.visual_direction}
                      placeholder="e.g. Punch-in zoom"
                      class="w-full px-2 py-1 bg-black border border-purple-950 text-xs text-slate-300 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label for={`scene-text-${clip.clip_number}`} class="block swiss-tag text-slate-500 mb-0.5">On-Screen Text</label>
                    <input
                      id={`scene-text-${clip.clip_number}`}
                      type="text"
                      bind:value={clip.on_screen_text}
                      placeholder="TEXT OVERLAY"
                      class="w-full px-2 py-1 bg-black border border-purple-950 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Prompt Modal -->
  {#if showPromptModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div class="relative w-full max-w-lg swiss-card border border-purple-800 bg-[#10071c] p-6 space-y-4">
        <div class="flex items-center gap-2 border-b border-purple-900/40 pb-3">
          <Sparkles class="w-4 h-4 text-amber-400" />
          <h3 class="text-base font-bold text-white uppercase font-display">Gemini Script Assistant</h3>
        </div>

        <form onsubmit={handleAIGenerateScript} class="space-y-4">
          <div>
            <label for="script-modal-topic" class="block swiss-tag text-slate-400 mb-1">Topic / Core Question</label>
            <input
              id="script-modal-topic"
              type="text"
              bind:value={promptTopic}
              placeholder="e.g. Why developers are adopting autonomous agents in 2026"
              required
              class="w-full px-3.5 py-2 bg-black border border-purple-900 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="script-modal-format" class="block swiss-tag text-slate-400 mb-1">Format</label>
              <select
                id="script-modal-format"
                bind:value={promptFormat}
                class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono"
              >
                <option value="Short Video">Short Video (60s)</option>
                <option value="YouTube Long">YouTube Long (3-5 min)</option>
                <option value="LinkedIn Post">LinkedIn Video</option>
              </select>
            </div>

            <div>
              <label for="script-modal-tone" class="block swiss-tag text-slate-400 mb-1">Tone</label>
              <select
                id="script-modal-tone"
                bind:value={promptTone}
                class="w-full px-3 py-2 bg-black border border-purple-900 text-white text-xs font-mono"
              >
                <option value="Conversational & Punchy">Conversational & Punchy</option>
                <option value="Technical & Analytical">Technical & Analytical</option>
                <option value="Story-Driven & Energetic">Story-Driven & Energetic</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-purple-900/40">
            <button
              type="button"
              onclick={() => (showPromptModal = false)}
              class="px-4 py-2 text-xs text-slate-400 hover:text-white font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              class="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase font-display disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Script'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
