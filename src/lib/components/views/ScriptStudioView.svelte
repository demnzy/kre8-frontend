<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../stores/appState.svelte';
  import { api } from '../../api/client';
  import type { Script, ScriptClip, ScriptVersion, ContentItem } from '../../types';
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
    Film,
    Bot,
    Send,
    History,
    Settings,
    Video,
    FolderOpen
  } from 'lucide-svelte';
  import { reveal } from '../../utils/reveal';
  import LoadError from '../layout/LoadError.svelte';

  let scripts = $state<Script[]>([]);
  let contentItems = $state<ContentItem[]>([]);
  let activeScript = $state<Script | null>(null);
  let isGenerating = $state(false);
  let isBreakingDown = $state(false);
  let isSavingScript = $state(false);
  let isCopied = $state(false);
  let loadError = $state<string | null>(null);
  let generationError = $state<string | null>(null);
  let pendingCustomInstructions = $state<string | undefined>(undefined);

  // Script Revision Co-Pilot state
  let isRevising = $state(false);
  let revisionInput = $state('');
  let revisionLog = $state<{
    role: 'user' | 'assistant';
    text: string;
    summary?: string[];
    timestamp: string;
  }[]>([]);
  let activeVersionNumber = $state<number | null>(null);

  const REVISION_CHIPS = [
    { label: '⚡ Make Punchier', prompt: 'Make the dialogue punchier, cut filler words, and intensify the delivery.' },
    { label: '⏱️ Shorten to 30s', prompt: 'Condense this script to a tight 30-second pacing with fast cuts.' },
    { label: '⏱️ Shorten to 60s', prompt: 'Structure this script for an exact 60-second runtime with rhythmic pacing.' },
    { label: '🎣 Spice up Hook', prompt: 'Rewrite the opening hook to be more provocative, surprising, and high-retention.' },
    { label: '🗣️ More Conversational', prompt: 'Make the dialogue feel natural, authentic, and spoken like a direct conversation.' },
    { label: '📌 Add Step-by-Step Breakdown', prompt: 'Structure the core points into numbered step-by-step takeaways.' },
    { label: '🚀 Stronger CTA', prompt: 'Strengthen the closing call to action to boost comments and follows.' }
  ];

  let activeProviderName = $derived.by(() => {
    const p = appState.preferences.ai_provider || 'gemini';
    if (p === 'gemini') return 'Google Gemini';
    if (p === 'openai') return 'OpenAI';
    if (p === 'anthropic') return 'Anthropic Claude';
    if (p === 'groq') return 'Groq (Llama 3.3)';
    if (p === 'openrouter') return 'OpenRouter';
    if (p === 'deepseek') return 'DeepSeek';
    return p;
  });

  let hasCustomApiKey = $derived.by(() => {
    const p = appState.preferences.ai_provider || 'gemini';
    if (p === 'gemini') return !!appState.preferences.gemini_api_key;
    if (p === 'openai') return !!appState.preferences.openai_api_key;
    if (p === 'anthropic') return !!appState.preferences.anthropic_api_key;
    if (p === 'groq') return !!appState.preferences.groq_api_key;
    if (p === 'openrouter') return !!appState.preferences.openrouter_api_key;
    if (p === 'deepseek') return !!appState.preferences.deepseek_api_key;
    return false;
  });

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
    custom_instructions?: string;
    content_item_id?: number;
    autoGenerate?: boolean;
  }) {
    promptTopic = draft.topic;
    if (draft.format) promptFormat = draft.format;
    if (draft.tone) promptTone = draft.tone;

    const combinedContext = [
      draft.custom_instructions,
      draft.hooks && draft.hooks.length > 0 ? `Viral Hooks:\n${draft.hooks.join('\n')}` : '',
      draft.talking_points && draft.talking_points.length > 0 ? `Talking Points:\n${draft.talking_points.join('\n')}` : ''
    ].filter(Boolean).join('\n\n') || undefined;
    pendingCustomInstructions = combinedContext;

    // Immediately set activeScript to the incoming topic so the user never sees an unrelated fallback
    activeScript = {
      id: 0,
      content_item_id: draft.content_item_id,
      title: draft.topic,
      tone: promptTone,
      target_duration_seconds: promptDuration,
      full_script: `Drafting script with ${activeProviderName}...\n\nTopic: ${draft.topic}\nNiche: ${appState.preferences.primary_niche}\nFormat: ${promptFormat}\n\nCrafting hooks, dialogue, and camera scenes...`,
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
      await generateLiveScript(draft.topic, promptTone, promptFormat, promptDuration, combinedContext, draft.content_item_id);
    }
  }

  function seedInitialVersionIfNeeded(script: Script) {
    if (!script.versions || script.versions.length === 0) {
      if (script.full_script) {
        script.versions = [
          {
            version: 1,
            label: 'Initial Draft',
            full_script: script.full_script,
            clips: script.clips ? JSON.parse(JSON.stringify(script.clips)) : [],
            timestamp: script.created_at || new Date().toISOString()
          }
        ];
        activeVersionNumber = 1;
      }
    } else {
      activeVersionNumber = script.versions[script.versions.length - 1].version;
    }
  }

  async function handleReviseScript(customPrompt?: string) {
    const instruction = (customPrompt || revisionInput).trim();
    if (!instruction || !activeScript?.full_script || isRevising) return;
    if (!appState.requireApiKey()) return;

    try {
      isRevising = true;
      const userMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      revisionLog = [
        ...revisionLog,
        { role: 'user', text: instruction, timestamp: userMsgTime }
      ];
      revisionInput = '';

      appState.showToast(`Revising script with ${activeProviderName}...`, 'info');

      const res = await api.reviseScript({
        script_id: activeScript.id || undefined,
        current_script: activeScript.full_script,
        current_clips: activeScript.clips || [],
        instruction: instruction,
        target_duration_seconds: activeScript.target_duration_seconds
      });

      activeScript.full_script = res.revised_script;

      if (res.revised_clips && res.revised_clips.length > 0) {
        activeScript.clips = res.revised_clips;
      }

      if (res.versions && res.versions.length > 0) {
        activeScript.versions = res.versions;
        activeVersionNumber = res.versions[res.versions.length - 1].version;
      } else {
        const nextVer = (activeScript.versions?.length || 0) + 1;
        const newVer: ScriptVersion = {
          version: nextVer,
          label: instruction.length > 24 ? instruction.slice(0, 22) + '...' : instruction,
          full_script: res.revised_script,
          clips: res.revised_clips || activeScript.clips || [],
          timestamp: new Date().toISOString()
        };
        activeScript.versions = [...(activeScript.versions || []), newVer];
        activeVersionNumber = nextVer;
      }

      const aiMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const summaryList = res.summary_of_changes
        ? (Array.isArray(res.summary_of_changes) ? res.summary_of_changes : [res.summary_of_changes])
        : [];
      revisionLog = [
        ...revisionLog,
        {
          role: 'assistant',
          text: res.assistant_message || 'I have updated your script and scene clips.',
          summary: summaryList,
          timestamp: aiMsgTime
        }
      ];

      appState.showToast('Script revised & clips updated!', 'success');
    } catch (e: any) {
      // Restore typed instruction so the creator doesn't have to retype it
      if (!customPrompt && !revisionInput) {
        revisionInput = instruction;
      }
      appState.showToast(e.message || 'Revision failed', 'error');
      revisionLog = [
        ...revisionLog,
        {
          role: 'assistant',
          text: `Revision error: ${e.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
    } finally {
      isRevising = false;
    }
  }

  function handleRollbackVersion(ver: ScriptVersion) {
    if (!activeScript) return;
    activeScript.full_script = ver.full_script;
    if (ver.clips && ver.clips.length > 0) {
      activeScript.clips = JSON.parse(JSON.stringify(ver.clips));
    }
    activeVersionNumber = ver.version;
    appState.showToast(`Loaded version v${ver.version} (${ver.label})`, 'info');
  }

  async function generateLiveScript(
    topic: string,
    tone: string,
    format: string,
    duration: number,
    customInstructions?: string,
    contentItemId?: number
  ) {
    if (!appState.requireApiKey()) return;
    try {
      isGenerating = true;
      generationError = null;
      appState.showToast(`${activeProviderName} is generating complete script for "${topic}"...`, 'info');
      const res = await api.generateScript({
        topic: topic,
        niche: appState.preferences.primary_niche,
        tone: tone,
        format: format,
        target_duration_seconds: duration,
        custom_instructions: customInstructions || pendingCustomInstructions
      });

      const saved = await api.createScript({
        content_item_id: contentItemId ?? activeScript?.content_item_id,
        title: res.title || topic,
        tone: tone,
        target_duration_seconds: duration,
        full_script: res.full_script,
        generated_hooks: res.hooks || [],
        generated_ctas: res.ctas || [],
        clips: res.clips || []
      });

      seedInitialVersionIfNeeded(saved);
      scripts = [saved, ...scripts.filter(s => s.id !== saved.id)];
      activeScript = saved;
      appState.counts.scripts = scripts.length;
      showPromptModal = false;
      promptTopic = '';
      pendingCustomInstructions = undefined;
      appState.showToast(`Script generated: "${saved.title}"!`, 'success');
    } catch (e: any) {
      generationError = e.message || 'Generation failed';
      promptTopic = topic;
      appState.showToast(generationError, 'error');
    } finally {
      isGenerating = false;
    }
  }

  async function loadScripts() {
    loadError = null;
    try {
      const [loadedScripts, loadedContent] = await Promise.all([
        api.getScripts(),
        api.getContentItems().catch(() => [] as ContentItem[])
      ]);
      scripts = loadedScripts;
      contentItems = loadedContent;
      appState.counts.scripts = scripts.length;
      if (scripts.length > 0) {
        if (!activeScript || activeScript.id !== 0) {
          activeScript = scripts[0];
          seedInitialVersionIfNeeded(activeScript);
        }
      } else if (!activeScript) {
        activeScript = {
          id: 0,
          title: `Getting Started with ${appState.preferences.primary_niche}`,
          tone: 'Conversational',
          target_duration_seconds: 60,
          full_script: `[HOOK]\nWelcome to Script Studio. Click "New Script" to write a full video script with ${activeProviderName}.\n\n[CORE BREAKDOWN]\nOr select any daily news angle in Discover to automatically draft and generate your video scripts here.\n\n[CALL TO ACTION]\nFollow for more creator insights!`,
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
        seedInitialVersionIfNeeded(activeScript);
      }
    } catch (e: any) {
      loadError = e?.message || "Couldn't load your saved scripts.";
    }
  }

  function selectSavedScript(script: Script) {
    activeScript = script;
    revisionLog = [];
    seedInitialVersionIfNeeded(activeScript);
  }

  function handleStartBlankScript() {
    activeScript = {
      id: 0,
      title: 'Untitled Script',
      tone: 'Conversational',
      target_duration_seconds: 60,
      full_script: '[HOOK]\n\n[MAIN POINTS]\n\n[CTA]\n',
      generated_hooks: [],
      generated_ctas: [],
      clips: [],
      versions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    revisionLog = [];
    activeVersionNumber = null;
  }

  async function handleDeleteScript(id: number) {
    if (!id) return;
    try {
      await api.deleteScript(id);
      scripts = scripts.filter(s => s.id !== id);
      appState.counts.scripts = scripts.length;
      if (activeScript?.id === id) {
        activeScript = scripts[0] || null;
        if (!activeScript) handleStartBlankScript();
      }
      appState.showToast('Script deleted', 'info');
    } catch (e: any) {
      appState.showToast(e.message || 'Could not delete script', 'error');
    }
  }

  async function handleSendToPipeline() {
    if (!activeScript) return;
    try {
      const created = await api.createContentItem({
        title: activeScript.title || 'New Video Script',
        description: (activeScript.full_script || '').slice(0, 240),
        platform: 'YouTube',
        format: 'Short/Reel',
        category: appState.preferences.primary_niche,
        status: 'Ready to Record',
        priority: 'High'
      });
      contentItems = [created, ...contentItems];
      activeScript.content_item_id = created.id;
      if (activeScript.id) {
        const updated = await api.updateScript(activeScript.id, activeScript);
        activeScript = updated;
        scripts = scripts.map(s => (s.id === updated.id ? updated : s));
      }
      appState.showToast(`Added "${created.title}" to Content Pipeline (Ready to Record)`, 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Could not add to pipeline', 'error');
    }
  }

  function insertTextSnippet(snippet: string, position: 'start' | 'end') {
    if (!activeScript) return;
    const current = activeScript.full_script || '';
    activeScript.full_script =
      position === 'start'
        ? `[HOOK]\n${snippet}\n\n${current}`.trim()
        : `${current}\n\n[CTA]\n${snippet}`.trim();
    appState.showToast(position === 'start' ? 'Hook inserted at start of script' : 'CTA appended to script', 'info');
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
    if (!appState.requireApiKey()) return;
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
    if (!activeScript || isSavingScript) return;
    isSavingScript = true;
    try {
      if (activeScript.id) {
        const updated = await api.updateScript(activeScript.id, activeScript);
        activeScript = updated;
        scripts = scripts.map(s => (s.id === updated.id ? updated : s));
      } else {
        const created = await api.createScript(activeScript);
        activeScript = created;
        scripts = [created, ...scripts];
        appState.counts.scripts = scripts.length;
      }
      appState.showToast('Script and clips saved!', 'success');
    } catch (e: any) {
      appState.showToast(e.message || 'Save failed', 'error');
    } finally {
      isSavingScript = false;
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
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
          Script Studio
        </h1>
        <p class="text-xs text-slate-300 mt-1">
          Draft spoken scripts, test 3-second hook formulas, and structure scenes for filming.
        </p>
      </div>

      <div class="flex items-center gap-2.5 shrink-0">
        <button
          onclick={copyTeleprompterText}
          class="flex items-center gap-1.5 px-3 py-2 bg-black border border-purple-900 hover:border-amber-400/50 text-slate-200 text-xs font-mono transition-all"
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
          onclick={handleStartBlankScript}
          class="flex items-center gap-1.5 px-3 py-2 bg-black border border-purple-900 hover:border-amber-400/50 text-slate-200 text-xs font-mono transition-all"
        >
          <Plus class="w-3.5 h-3.5 text-amber-400" />
          <span>Blank Draft</span>
        </button>

        <button
          onclick={() => (showPromptModal = true)}
          class="flex items-center gap-2 px-4 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 text-xs font-mono font-bold tracking-wider transition-all"
        >
          <Sparkles class="w-4 h-4 text-amber-400" />
          <span>AI Generate</span>
        </button>

        <button
          onclick={handleSaveScript}
          disabled={isSavingScript}
          class="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display tracking-wider transition-all disabled:opacity-50"
        >
          <Save class="w-4 h-4" />
          <span>{isSavingScript ? 'Saving...' : 'Save Draft'}</span>
        </button>
      </div>
    </div>

    <!-- Saved Scripts Switcher Bar -->
    {#if scripts.length > 0}
      <div class="pt-3 border-t border-purple-900/40 flex items-center gap-2 overflow-x-auto pb-1">
        <div class="flex items-center gap-1.5 text-xs font-mono text-slate-400 shrink-0 mr-1">
          <FolderOpen class="w-3.5 h-3.5 text-amber-400" />
          <span>Saved Scripts ({scripts.length}):</span>
        </div>
        {#each scripts as s}
          <div class="flex items-center shrink-0 border transition-all {activeScript?.id === s.id
            ? 'bg-amber-400/15 border-amber-400 text-amber-300'
            : 'bg-black/60 border-purple-900/60 text-slate-300 hover:border-purple-700'}">
            <button
              type="button"
              onclick={() => selectSavedScript(s)}
              class="px-3 py-1 text-xs font-mono truncate max-w-[200px]"
            >
              {s.title}
            </button>
            <button
              type="button"
              onclick={() => handleDeleteScript(s.id)}
              title="Delete script"
              class="px-1.5 py-1 text-slate-500 hover:text-rose-400 border-l border-purple-900/40"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  {#if loadError}
    <LoadError message={loadError} onRetry={loadScripts} />
  {/if}
  {#if generationError}
    <LoadError
      message={generationError}
      onRetry={() => generateLiveScript(promptTopic || activeScript?.title || '', promptTone, promptFormat, promptDuration)}
    />
  {/if}

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
              class="text-lg font-bold text-white bg-transparent border-none focus:outline-none w-full font-display tracking-tight"
            />
            <span class="swiss-tag px-2 py-1 bg-black border border-purple-900 text-amber-400 shrink-0">
              ~{estimatedDurationSec}s [{wordCount} words]
            </span>
          </div>

          <!-- Version History Bar -->
          {#if activeScript.versions && activeScript.versions.length > 0}
            <div class="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 border-b border-purple-900/30">
              <div class="flex items-center gap-1 text-[10px] font-mono text-slate-400 shrink-0">
                <History class="w-3 h-3 text-amber-400" />
                <span>Versions:</span>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                {#each activeScript.versions as ver}
                  <button
                    type="button"
                    onclick={() => handleRollbackVersion(ver)}
                    class="px-2 py-0.5 text-[10px] font-mono border transition-all {activeVersionNumber === ver.version ? 'bg-amber-400 text-black border-amber-300 font-bold' : 'bg-black/60 text-slate-300 border-purple-900 hover:border-amber-400/50'}"
                    title={`Restore version ${ver.version}: ${ver.label}`}
                  >
                    v{ver.version} <span class="opacity-70">({ver.label})</span>
                  </button>
                {/each}
              </div>
            </div>
          {/if}

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

          <div class="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div class="flex items-center gap-2">
              <select
                value={activeScript.content_item_id ?? ''}
                onchange={(e) => {
                  const v = e.currentTarget.value;
                  if (activeScript) activeScript.content_item_id = v ? Number(v) : undefined;
                }}
                class="px-2.5 py-1.5 bg-black border border-purple-900 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-400 max-w-[220px] truncate"
              >
                <option value="">Link to pipeline video (optional)</option>
                {#each contentItems as ci}
                  <option value={ci.id}>{ci.title} ({ci.status})</option>
                {/each}
              </select>

              {#if !activeScript.content_item_id}
                <button
                  type="button"
                  onclick={handleSendToPipeline}
                  class="flex items-center gap-1.5 px-2.5 py-1.5 bg-black hover:bg-purple-950 text-amber-300 border border-purple-800 text-xs font-mono transition-colors"
                  title="Create a Ready to Record video in your Content Pipeline from this script"
                >
                  <Video class="w-3.5 h-3.5" />
                  <span>Send to Pipeline</span>
                </button>
              {/if}
            </div>

            <button
              onclick={handleBreakdownClips}
              disabled={isBreakingDown}
              class="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950 hover:bg-purple-900 text-amber-300 border border-purple-800 text-xs font-mono disabled:opacity-50"
            >
              <Wand2 class="w-3.5 h-3.5" />
              <span>{isBreakingDown ? 'Parsing...' : 'Re-sync Clips from Text'}</span>
            </button>
          </div>
        </div>

        <!-- AI Revision Co-Pilot Card -->
        <div class="swiss-card p-5 border border-purple-900/60 bg-[#10071c] space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/40 pb-3">
            <div class="flex items-center gap-2">
              <Bot class="w-4 h-4 text-amber-400" />
              <h2 class="text-xs font-bold text-white font-display">AI Script Assistant</h2>
              <span class="swiss-tag text-[9px] text-purple-400 font-mono">Interactive</span>
            </div>

            <!-- Active Engine Pill & Link to Settings -->
            <button
              type="button"
              onclick={() => appState.setModule('settings')}
              class="flex items-center gap-1.5 px-2.5 py-1 bg-black border border-purple-900/60 hover:border-amber-400/50 text-[10px] font-mono text-slate-300 hover:text-amber-300 transition-all self-start sm:self-auto"
              title="Click to configure AI providers and custom API keys in Settings"
            >
              <span class="w-1.5 h-1.5 rounded-full {hasCustomApiKey ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
              <span class="font-bold text-slate-200">{activeProviderName}</span>
              <span class="text-purple-600">/</span>
              <span class="text-slate-400 truncate max-w-[100px]">{appState.preferences.ai_model || 'default'}</span>
              <Settings class="w-3 h-3 text-slate-500 ml-0.5" />
            </button>
          </div>

          <!-- Engine Status & API Key Prompt -->
          <div class="p-2.5 bg-black/60 border {hasCustomApiKey ? 'border-emerald-900/40' : 'border-amber-500/40'} flex items-center justify-between gap-2.5 text-xs font-mono">
            <div class="flex items-start gap-2.5">
              <Sparkles class="w-3.5 h-3.5 {hasCustomApiKey ? 'text-emerald-400' : 'text-amber-400'} shrink-0 mt-0.5" />
              <div class="text-slate-300 text-[11px] leading-relaxed">
                {#if hasCustomApiKey}
                  <span class="text-emerald-400 font-bold">API Key Connected:</span> Revisions run directly on your saved <strong class="text-white">{activeProviderName}</strong> key.
                {:else}
                  <span class="text-amber-400 font-bold">API Key Required:</span> Save your personal {activeProviderName} API key to generate and revise scripts.
                {/if}
              </div>
            </div>
            {#if !hasCustomApiKey}
              <button
                type="button"
                onclick={() => (appState.apiKeyModalOpen = true)}
                class="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold text-[10px] shrink-0 transition-colors"
              >
                Set Up Key
              </button>
            {/if}
          </div>

          <!-- Quick Revision Action Chips -->
          <div class="space-y-1.5">
            <span class="block text-[10px] font-mono text-slate-400 tracking-wider">Quick Directives</span>
            <div class="flex flex-wrap gap-1.5">
              {#each REVISION_CHIPS as chip}
                <button
                  type="button"
                  onclick={() => handleReviseScript(chip.prompt)}
                  disabled={isRevising}
                  class="px-2.5 py-1 bg-purple-950/50 hover:bg-purple-900/70 border border-purple-800/60 hover:border-amber-400/50 text-[11px] font-mono text-purple-200 hover:text-amber-300 transition-all disabled:opacity-50"
                >
                  {chip.label}
                </button>
              {/each}
            </div>
          </div>

          <!-- Custom Revision Input Form -->
          <form onsubmit={(e) => { e.preventDefault(); handleReviseScript(); }} class="space-y-2">
            <div class="flex gap-2">
              <input
                type="text"
                bind:value={revisionInput}
                placeholder="Talk to AI: e.g. 'Make the tone more urgent', 'Cut 15 seconds', 'Add 2 concrete tips'..."
                disabled={isRevising}
                class="flex-1 px-3 py-2 bg-black border border-purple-900/80 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isRevising || !revisionInput.trim()}
                class="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display tracking-wider disabled:opacity-50 transition-all shrink-0"
              >
                {#if isRevising}
                  <span class="animate-pulse">...</span>
                  <span>Revising</span>
                {:else}
                  <Send class="w-3.5 h-3.5" />
                  <span>Send</span>
                {/if}
              </button>
            </div>
          </form>

          <!-- Revision Conversation / Activity Stream -->
          {#if revisionLog.length > 0}
            <div class="space-y-2.5 pt-2 border-t border-purple-900/30 max-h-56 overflow-y-auto pr-1">
              {#each revisionLog as item}
                {#if item.role === 'user'}
                  <div class="flex items-start gap-2 justify-end text-xs">
                    <div class="p-2.5 bg-purple-950/70 border border-purple-800 text-purple-200 font-mono text-[11px] max-w-[85%]">
                      <div class="flex items-center justify-between gap-3 text-[9px] text-purple-400 mb-1">
                        <span>You</span>
                        <span>{item.timestamp}</span>
                      </div>
                      <p>{item.text}</p>
                    </div>
                  </div>
                {:else}
                  <div class="flex items-start gap-2 text-xs">
                    <div class="p-2.5 bg-black border border-amber-500/30 text-slate-200 font-mono text-[11px] w-full space-y-1.5">
                      <div class="flex items-center justify-between text-[9px] text-amber-400 font-bold">
                        <span>{activeProviderName} Assistant</span>
                        <span class="text-slate-500 font-normal">{item.timestamp}</span>
                      </div>
                      <p class="text-slate-300">{item.text}</p>
                      {#if item.summary && item.summary.length > 0}
                        <div class="flex flex-wrap gap-1 pt-1">
                          {#each item.summary as change}
                            <span class="px-1.5 py-0.5 bg-amber-400/10 border border-amber-400/30 text-[10px] text-amber-300 font-mono">
                              ✓ {change}
                            </span>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          {/if}
        </div>

        <!-- Generated Hooks & CTAs Card -->
        {#if (activeScript.generated_hooks && activeScript.generated_hooks.length > 0) || (activeScript.generated_ctas && activeScript.generated_ctas.length > 0)}
          <div class="swiss-card p-5 border border-purple-900/60 bg-[#10071c] space-y-4">
            {#if activeScript.generated_hooks && activeScript.generated_hooks.length > 0}
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Sparkles class="w-3.5 h-3.5 text-amber-400" />
                    <span class="swiss-tag text-amber-400">Opening Hooks</span>
                  </div>
                  <span class="text-[10px] font-mono text-slate-500">Click to insert into script</span>
                </div>
                {#each activeScript.generated_hooks as hook}
                  <div class="p-2.5 bg-black border border-purple-950 flex items-center justify-between gap-3 text-xs text-amber-300 font-mono group">
                    <span>"{hook}"</span>
                    <button
                      type="button"
                      onclick={() => insertTextSnippet(hook, 'start')}
                      class="px-2 py-1 bg-purple-950 hover:bg-amber-400 hover:text-black text-purple-200 text-[10px] font-mono shrink-0 transition-colors"
                    >
                      + Use Hook
                    </button>
                  </div>
                {/each}
              </div>
            {/if}

            {#if activeScript.generated_ctas && activeScript.generated_ctas.length > 0}
              <div class="space-y-2 pt-2 border-t border-purple-900/30">
                <div class="flex items-center gap-2">
                  <Sparkles class="w-3.5 h-3.5 text-purple-400" />
                  <span class="swiss-tag text-purple-300">Closing Calls to Action</span>
                </div>
                {#each activeScript.generated_ctas as cta}
                  <div class="p-2.5 bg-black border border-purple-950 flex items-center justify-between gap-3 text-xs text-slate-300 font-mono">
                    <span>"{cta}"</span>
                    <button
                      type="button"
                      onclick={() => insertTextSnippet(cta, 'end')}
                      class="px-2 py-1 bg-purple-950 hover:bg-amber-400 hover:text-black text-purple-200 text-[10px] font-mono shrink-0 transition-colors"
                    >
                      + Use CTA
                    </button>
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
            <h2 class="font-bold text-sm text-white font-display">Scene Breakdown</h2>
            <span class="text-[10px] font-mono text-purple-400">[{clipsDurationTotal}s total]</span>
          </div>

          <button
            onclick={handleAddClip}
            class="flex items-center gap-1 px-2 py-1 bg-black border border-purple-800 text-slate-300 text-xs font-mono hover:text-white"
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
                    <span class="text-xs font-bold text-white font-display">Scene {clip.clip_number}</span>
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
          <h3 class="text-base font-bold text-white font-display">Generate Script</h3>
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
              class="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-display disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Script'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
