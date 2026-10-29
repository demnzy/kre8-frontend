<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { portal } from '../../utils/portal';
  import type { Script, ScriptClip } from '../../types';
  import {
    Play,
    Pause,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Minimize2,
    X,
    Eye,
    EyeOff,
    Clock,
    Film,
    Sparkles,
    Volume2,
    Type,
    Gauge,
    FlipHorizontal,
    Tv,
    Wind
  } from 'lucide-svelte';

  interface Props {
    script: Script;
    isOpen: boolean;
    initialSceneIndex?: number;
    onClose: () => void;
  }

  let { script, isOpen, initialSceneIndex = 0, onClose }: Props = $props();

  interface Token {
    type: 'word' | 'breath' | 'pause' | 'cue' | 'heading' | 'break';
    text?: string;
    breathType?: 'sentence' | 'comma' | 'beat' | 'paragraph';
    isBold?: boolean;
    isItalic?: boolean;
    weight?: number;
    duration?: number;  // in seconds
    startTime?: number; // seconds within scene
    endTime?: number;   // seconds within scene
  }

  interface PreparedScene {
    index: number;
    sceneNumber: number;
    title: string;
    duration: number; // in seconds
    visualDirection?: string;
    onScreenText?: string;
    tokens: Token[];
    rawText: string;
    wordCount: number;
    breathCount: number;
  }

  let currentSceneIndex = $state(0);
  let isPlaying = $state(false);
  let playbackSpeed = $state(1.0); // 0.5 to 2.0 with 0.05 granular steps
  let fontSize = $state<'md' | 'lg' | 'xl' | '2xl'>('xl');
  let isMirrored = $state(false);
  let isFullscreen = $state(false);
  let showEyeGuide = $state(true);
  let showBreathMarkers = $state(true);
  let pausedOnScroll = $state(false);
  let countdownSec = $state<number | null>(null);
  let elapsedSceneMs = $state(0);

  let containerEl = $state<HTMLElement | null>(null);
  let animFrameId: number | null = null;
  let lastTimestamp: number | null = null;

  // Prepare scenes from clips or fallback to full_script parsing
  let preparedScenes = $derived.by<PreparedScene[]>(() => {
    if (script.clips && script.clips.length > 0) {
      return script.clips.map((clip, idx) => {
        const text = clip.spoken_dialogue || '';
        const dur = clip.estimated_duration && clip.estimated_duration > 0
          ? clip.estimated_duration
          : estimateDurationFromText(text);
        const tokens = tokenizeSceneText(text, Math.max(3, dur));
        const words = tokens.filter(t => t.type === 'word');
        const breaths = tokens.filter(t => t.type === 'breath' || t.type === 'pause');
        return {
          index: idx,
          sceneNumber: clip.clip_number || idx + 1,
          title: clip.on_screen_text ? `Scene ${clip.clip_number}: ${clip.on_screen_text}` : `Scene ${clip.clip_number}`,
          duration: Math.max(3, dur),
          visualDirection: clip.visual_direction,
          onScreenText: clip.on_screen_text,
          tokens,
          rawText: text,
          wordCount: words.length,
          breathCount: breaths.length
        };
      });
    }

    // Fallback: Partition full_script into scenes using markdown headers or bracket markers
    const full = script.full_script || '';
    if (!full.trim()) {
      const fallbackTokens = tokenizeSceneText('Ready to record. Write or generate your dialogue in Script Studio.', 5);
      return [{
        index: 0,
        sceneNumber: 1,
        title: 'Scene 1',
        duration: script.target_duration_seconds || 60,
        tokens: fallbackTokens,
        rawText: '',
        wordCount: 11,
        breathCount: 1
      }];
    }

    const sections = full.split(/\n(?=\[(?:HOOK|POINT|SCENE|CTA|MAIN).*?\]|^#{1,3}\s+)/gim);
    return sections.map((sec, idx) => {
      const trimmed = sec.trim();
      const dur = estimateDurationFromText(trimmed);
      const tokens = tokenizeSceneText(trimmed, Math.max(4, dur));
      const words = tokens.filter(t => t.type === 'word');
      const breaths = tokens.filter(t => t.type === 'breath' || t.type === 'pause');
      return {
        index: idx,
        sceneNumber: idx + 1,
        title: `Scene ${idx + 1}`,
        duration: Math.max(4, dur),
        tokens,
        rawText: trimmed,
        wordCount: words.length,
        breathCount: breaths.length
      };
    });
  });

  let activeScene = $derived(preparedScenes[currentSceneIndex] || preparedScenes[0]);

  let totalScriptDurationSec = $derived(
    preparedScenes.reduce((acc, s) => acc + s.duration, 0)
  );

  let totalElapsedSec = $derived.by(() => {
    let priorSec = 0;
    for (let i = 0; i < currentSceneIndex; i++) {
      priorSec += preparedScenes[i]?.duration || 0;
    }
    return priorSec + (elapsedSceneMs / 1000);
  });

  function estimateDurationFromText(text: string): number {
    const clean = text.replace(/\[.*?\]/g, '').replace(/#+/g, '').trim();
    const wordCount = clean.split(/\s+/).filter(Boolean).length;
    // Natural human speaking pace: ~135 words/min + 20% pause/breath time = ~2.25 words/sec net
    return Math.max(4, Math.round(wordCount / 2.25));
  }

  /**
   * Parses text into tokens with human speech dynamics:
   * - Monosyllabic vs multisyllabic syllable weighting
   * - Sentence termination breaths (. ! ?)
   * - Clause micro-pauses (, ; : —)
   * - Paragraph / thought transition resets
   * - Explicit cues ([PAUSE], [BEAT], [BREATHE])
   */
  function tokenizeSceneText(text: string, sceneDurSec: number): Token[] {
    const lines = text.split('\n');
    const rawTokens: Token[] = [];

    for (let l = 0; l < lines.length; l++) {
      const rawLine = lines[l].trim();
      if (!rawLine) {
        // Line break indicates thought reset
        rawTokens.push({
          type: 'breath',
          breathType: 'paragraph',
          text: 'breath',
          weight: 2.8
        });
        rawTokens.push({ type: 'break' });
        continue;
      }

      // 1. Heading `# Title`
      if (/^#{1,6}\s+/.test(rawLine)) {
        rawTokens.push({ type: 'heading', text: rawLine.replace(/^#{1,6}\s+/, '') });
        rawTokens.push({ type: 'break' });
        continue;
      }

      // 2. Full-line cue `[B-ROLL: Camera Zoom]` or `[PAUSE]`
      if (/^\[(.*?)\]$/.test(rawLine)) {
        const cueContent = rawLine.slice(1, -1).trim();
        if (/^(PAUSE|BEAT|BREATHE|SILENCE)(\s+\d+s?)?$/i.test(cueContent)) {
          rawTokens.push({
            type: 'pause',
            breathType: 'beat',
            text: cueContent.toLowerCase(),
            weight: 4.0
          });
        } else {
          rawTokens.push({ type: 'cue', text: cueContent });
        }
        continue;
      }

      // 3. Inline markdown: **bold**, *italic*, [inline cue], regular words
      const regex = /(\*\*.*?\*\*|\*.*?\*|\[.*?\]|\(.*?\)|[^\s*\[\]\(\)]+)/g;
      let match;
      while ((match = regex.exec(rawLine)) !== null) {
        const part = match[0];

        // Explicit inline pause like (pause) or [pause]
        if (/^[\[\(](PAUSE|BEAT|BREATHE|SILENCE)[\]\)]$/i.test(part)) {
          rawTokens.push({
            type: 'pause',
            breathType: 'beat',
            text: 'beat',
            weight: 3.5
          });
          continue;
        }

        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          const inner = part.slice(2, -2);
          processWordsIntoTokens(inner, true, false, rawTokens);
        } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          const inner = part.slice(1, -1);
          processWordsIntoTokens(inner, false, true, rawTokens);
        } else if (part.startsWith('[') && part.endsWith(']')) {
          rawTokens.push({ type: 'cue', text: part.slice(1, -1) });
        } else {
          processWordsIntoTokens(part, false, false, rawTokens);
        }
      }
    }

    // Allocate realistic human timeline across words and breaths
    const timedTokens = rawTokens.filter(t => t.type === 'word' || t.type === 'breath' || t.type === 'pause');
    const totalWeight = timedTokens.reduce((acc, t) => acc + (t.weight || 1), 0) || 1;

    let currTime = 0;
    for (const t of timedTokens) {
      const dur = ((t.weight || 1) / totalWeight) * sceneDurSec;
      t.duration = dur;
      t.startTime = currTime;
      t.endTime = currTime + dur;
      currTime += dur;
    }

    return rawTokens;
  }

  function processWordsIntoTokens(
    content: string,
    isBold: boolean,
    isItalic: boolean,
    targetList: Token[]
  ) {
    const rawWords = content.split(/\s+/).filter(Boolean);
    for (const w of rawWords) {
      // Check trailing punctuation for natural breath / micro-pauses
      const hasSentenceEnd = /[.!?]+$/.test(w);
      const hasClausePause = /[,;:\u2014]+$/.test(w) || w.endsWith('--');

      // Word speech weight based on syllable / length estimation
      const cleanLen = w.replace(/[^a-zA-Z0-9]/g, '').length;
      let weight = 2.0;
      if (cleanLen <= 3) {
        weight = 1.3; // short filler/connector: "in", "the", "to"
      } else if (cleanLen <= 7) {
        weight = 2.2; // standard word
      } else if (cleanLen <= 11) {
        weight = 3.2; // multisyllabic word
      } else {
        weight = 4.2; // long complex word
      }

      if (isBold) weight *= 1.35; // vocal emphasis
      if (w === w.toUpperCase() && cleanLen > 1) weight *= 1.25;

      targetList.push({
        type: 'word',
        text: w,
        isBold,
        isItalic,
        weight
      });

      // Insert natural human breathing pauses
      if (hasSentenceEnd) {
        targetList.push({
          type: 'breath',
          breathType: 'sentence',
          text: 'breath',
          weight: 2.8 // ~0.45s to 0.65s breath
        });
      } else if (hasClausePause) {
        targetList.push({
          type: 'breath',
          breathType: 'comma',
          text: 'pause',
          weight: 1.2 // ~0.20s micro-pause
        });
      }
    }
  }

  function startCountdownAndPlay() {
    countdownSec = 3;
    const interval = setInterval(() => {
      if (countdownSec === null) {
        clearInterval(interval);
        return;
      }
      if (countdownSec > 1) {
        countdownSec--;
      } else {
        countdownSec = null;
        clearInterval(interval);
        play();
      }
    }, 850);
  }

  function play() {
    isPlaying = true;
    pausedOnScroll = false;
    lastTimestamp = null;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(onFrame);
  }

  function pause() {
    isPlaying = false;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function togglePlayPause() {
    pausedOnScroll = false;
    if (countdownSec !== null) {
      countdownSec = null;
      return;
    }
    if (isPlaying) {
      pause();
    } else {
      if (elapsedSceneMs === 0 && countdownSec === null) {
        startCountdownAndPlay();
      } else {
        play();
      }
    }
  }

  function onFrame(timestamp: number) {
    if (!isPlaying) return;
    if (lastTimestamp === null) {
      lastTimestamp = timestamp;
    }
    const deltaMs = (timestamp - lastTimestamp) * playbackSpeed;
    lastTimestamp = timestamp;

    elapsedSceneMs += deltaMs;

    const sceneDurationMs = (activeScene?.duration || 10) * 1000;
    if (elapsedSceneMs >= sceneDurationMs) {
      // Advance to next scene with breather
      if (currentSceneIndex < preparedScenes.length - 1) {
        pause();
        currentSceneIndex++;
        restartScene();
        // Give 3-second countdown for the next scene so speaker can read and see the screen first
        startCountdownAndPlay();
        return;
      } else {
        // Script finished
        elapsedSceneMs = sceneDurationMs;
        pause();
        return;
      }
    }

    // Auto-scroll to keep active word near eye-level guideline
    scrollToActiveWord();

    animFrameId = requestAnimationFrame(onFrame);
  }

  function scrollToActiveWord() {
    if (!containerEl) return;
    const currentEl = containerEl.querySelector('#teleprompter-current-target') as HTMLElement | null;
    if (!currentEl) return;
    const containerRect = containerEl.getBoundingClientRect();
    const wordRect = currentEl.getBoundingClientRect();
    const targetTop = containerRect.top + (containerRect.height * 0.35); // 35% eye line
    const diff = wordRect.top - targetTop;

    if (Math.abs(diff) > 2) {
      // Smooth continuous damping without CSS scroll animation jitter
      const step = Math.sign(diff) * Math.min(Math.abs(diff) * 0.12, 14);
      containerEl.scrollTop += step;
    }
  }

  function restartScene() {
    pause(); // Always pause when restarting/switching so highlighter doesn't run off-screen
    elapsedSceneMs = 0;
    lastTimestamp = null;
    pausedOnScroll = false;
    if (containerEl) {
      containerEl.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  function nextScene() {
    if (currentSceneIndex < preparedScenes.length - 1) {
      pause();
      currentSceneIndex++;
      restartScene();
    }
  }

  function prevScene() {
    if (currentSceneIndex > 0) {
      pause();
      currentSceneIndex--;
      restartScene();
    }
  }

  function jumpToScene(idx: number) {
    if (idx >= 0 && idx < preparedScenes.length) {
      pause();
      currentSceneIndex = idx;
      restartScene();
    }
  }

  // When user wheels or touches to manually scroll, pause auto-play immediately
  function handleUserScroll() {
    if (isPlaying) {
      pause();
      pausedOnScroll = true;
    }
  }

  // Jump playback directly to clicked word
  function seekToWord(token: Token) {
    if (token.startTime !== undefined) {
      elapsedSceneMs = token.startTime * 1000;
      pausedOnScroll = false;
      scrollToActiveWord();
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      isFullscreen = true;
    } else {
      document.exitFullscreen?.().catch(() => {});
      isFullscreen = false;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!isOpen) return;

    if (e.code === 'Space') {
      e.preventDefault();
      togglePlayPause();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      nextScene();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      prevScene();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      restartScene();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === 'b' || e.key === 'B') {
      e.preventDefault();
      showBreathMarkers = !showBreathMarkers;
    } else if (e.key === '[' || e.key === '-') {
      e.preventDefault();
      playbackSpeed = Math.max(0.5, Number((playbackSpeed - 0.05).toFixed(2)));
    } else if (e.key === ']' || e.key === '=' || e.key === '+') {
      e.preventDefault();
      playbackSpeed = Math.min(2.0, Number((playbackSpeed + 0.05).toFixed(2)));
    } else if (e.key === 'Escape') {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
        isFullscreen = false;
      } else {
        closeTeleprompter();
      }
    }
  }

  function closeTeleprompter() {
    pause();
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onClose();
  }

  function formatTime(sec: number): string {
    const s = Math.max(0, Math.floor(sec));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  $effect(() => {
    if (isOpen) {
      currentSceneIndex = Math.min(initialSceneIndex, Math.max(0, preparedScenes.length - 1));
      elapsedSceneMs = 0;
      window.addEventListener('keydown', handleKeyDown);

      const el = containerEl;
      if (el) {
        el.addEventListener('wheel', handleUserScroll, { passive: true });
        el.addEventListener('touchmove', handleUserScroll, { passive: true });
      }

      return () => {
        pause();
        window.removeEventListener('keydown', handleKeyDown);
        if (el) {
          el.removeEventListener('wheel', handleUserScroll);
          el.removeEventListener('touchmove', handleUserScroll);
        }
      };
    } else {
      pause();
      window.removeEventListener('keydown', handleKeyDown);
    }
  });

  onDestroy(() => {
    pause();
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown);
    }
  });
</script>

{#if isOpen}
  <div
    use:portal
    class="fixed inset-0 z-50 bg-[#06030a] text-white flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-200"
    role="region"
    aria-label="Teleprompter Studio"
  >
    <!-- Single Sleek Top Bar (Auto-dims during recording unless hovered) -->
    <header
      class="h-14 px-5 bg-[#090412]/95 backdrop-blur-md border-b border-purple-900/40 flex items-center justify-between gap-4 shrink-0 z-30 transition-opacity duration-300 {
        isPlaying ? 'opacity-25 hover:opacity-100' : 'opacity-100'
      }"
    >
      <!-- Left: Scene and Timing Status -->
      <div class="flex items-center gap-3 min-w-0">
        <div class="flex items-center gap-1.5 px-2 py-0.5 bg-amber-400 text-black font-bold font-mono text-xs rounded shrink-0">
          <Tv class="w-3.5 h-3.5" />
          <span>Scene {currentSceneIndex + 1}/{preparedScenes.length}</span>
        </div>

        <div class="flex items-center gap-2 text-xs font-mono min-w-0">
          <span class="text-amber-300 font-bold shrink-0">
            {formatTime(elapsedSceneMs / 1000)} / {formatTime(activeScene.duration)}
          </span>
          <span class="text-slate-600 hidden sm:inline">•</span>
          <span class="text-slate-400 text-[11px] hidden sm:inline truncate max-w-[200px]" title={script.title}>
            {script.title || 'Untitled Script'}
          </span>
        </div>

        <!-- Inline Visual Cue Pill (if any exists for this scene) -->
        {#if activeScene.onScreenText}
          <div class="hidden md:flex items-center gap-1 px-2 py-0.5 bg-black border border-purple-900 text-purple-300 text-[11px] font-mono rounded truncate max-w-[240px]">
            <Film class="w-3 h-3 text-purple-400 shrink-0" />
            <span class="truncate">{activeScene.onScreenText}</span>
          </div>
        {/if}
      </div>

      <!-- Center: Slim Scene Progress -->
      <div class="hidden lg:flex items-center gap-2 w-32 shrink-0">
        <div class="flex-1 h-1 bg-black border border-purple-900/80 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-75"
            style={`width: ${Math.min(100, (elapsedSceneMs / (activeScene.duration * 1000)) * 100)}%`}
          ></div>
        </div>
        <span class="text-[10px] text-slate-400 font-mono">
          {Math.round(Math.min(100, (elapsedSceneMs / (activeScene.duration * 1000)) * 100))}%
        </span>
      </div>

      <!-- Right: Granular Speed Slider & Minimalist Controls -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Granular Speed Slider (0.50x to 2.00x) -->
        <div class="flex items-center gap-1.5 px-2 py-1 bg-black border border-purple-900/60 rounded text-xs font-mono" title={`Playback Speed: ${playbackSpeed.toFixed(2)}x (~${Math.round(135 * playbackSpeed)} WPM)`}>
          <Gauge class="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <button
            type="button"
            onclick={() => (playbackSpeed = Math.max(0.5, Number((playbackSpeed - 0.05).toFixed(2))))}
            class="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white font-bold leading-none"
            title="Slower by -0.05x (Key: [)"
          >
            -
          </button>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            bind:value={playbackSpeed}
            class="w-14 sm:w-20 h-1 accent-amber-400 bg-purple-950 rounded cursor-pointer"
          />
          <button
            type="button"
            onclick={() => (playbackSpeed = Math.min(2.0, Number((playbackSpeed + 0.05).toFixed(2))))}
            class="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white font-bold leading-none"
            title="Faster by +0.05x (Key: ])"
          >
            +
          </button>
          <span class="text-[10px] font-bold text-amber-300 w-9 text-right font-mono">
            {playbackSpeed.toFixed(2)}x
          </span>
        </div>

        <!-- Natural Breaths Toggle -->
        <button
          type="button"
          onclick={() => (showBreathMarkers = !showBreathMarkers)}
          class="flex items-center gap-1 px-2 py-1 rounded border text-xs font-mono transition-colors {
            showBreathMarkers
              ? 'bg-cyan-950/80 border-cyan-700/80 text-cyan-300'
              : 'bg-black border-purple-900/60 text-slate-500 hover:text-slate-300'
          }"
          title="Toggle visual breath indicators (B)"
        >
          <Wind class="w-3.5 h-3.5 text-cyan-400" />
          <span class="hidden sm:inline text-[11px]">Breaths</span>
        </button>

        <!-- Eye-Level Guide Toggle -->
        <button
          type="button"
          onclick={() => (showEyeGuide = !showEyeGuide)}
          class="p-1.5 rounded border transition-colors {showEyeGuide
            ? 'bg-purple-950/80 border-purple-700 text-amber-300'
            : 'bg-black border-purple-900/60 text-slate-500 hover:text-slate-300'}"
          title="Toggle camera eye-level guide"
        >
          {#if showEyeGuide}
            <Eye class="w-3.5 h-3.5" />
          {:else}
            <EyeOff class="w-3.5 h-3.5" />
          {/if}
        </button>

        <!-- Typography Size -->
        <div class="hidden sm:flex items-center bg-black border border-purple-900/60 rounded px-1 py-0.5 text-xs font-mono">
          {#each [
            { id: 'md', label: 'M' },
            { id: 'lg', label: 'L' },
            { id: 'xl', label: 'XL' },
            { id: '2xl', label: '2XL' }
          ] as sz}
            <button
              type="button"
              onclick={() => (fontSize = sz.id as any)}
              class="px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors {fontSize === sz.id
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'}"
              title={`Font size ${sz.label}`}
            >
              {sz.label}
            </button>
          {/each}
        </div>

        <!-- Mirror Text (beam-splitter glass) -->
        <button
          type="button"
          onclick={() => (isMirrored = !isMirrored)}
          class="p-1.5 rounded border transition-colors {isMirrored
            ? 'bg-amber-400 text-black border-amber-300 font-bold'
            : 'bg-black border-purple-900/60 text-slate-300 hover:text-white'}"
          title="Mirror text horizontally (for prompter glass)"
        >
          <FlipHorizontal class="w-3.5 h-3.5" />
        </button>

        <!-- Fullscreen -->
        <button
          type="button"
          onclick={toggleFullscreen}
          class="p-1.5 bg-black border border-purple-900/60 rounded text-slate-300 hover:text-white transition-colors"
          title="Toggle Fullscreen (F)"
        >
          {#if isFullscreen}
            <Minimize2 class="w-3.5 h-3.5" />
          {:else}
            <Maximize2 class="w-3.5 h-3.5" />
          {/if}
        </button>

        <!-- Exit -->
        <button
          type="button"
          onclick={closeTeleprompter}
          class="p-1.5 bg-black hover:bg-rose-950 text-slate-400 hover:text-rose-200 border border-purple-900/60 hover:border-rose-800 rounded transition-colors"
          title="Exit Teleprompter (Esc)"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </header>

    <!-- Teleprompter Main Display Area -->
    <div class="relative flex-1 flex flex-col justify-center items-center overflow-hidden bg-[#06030a]">
      <!-- Decluttered Subtle Eye-Level Focal Guideline -->
      {#if showEyeGuide}
        <div class="absolute left-0 right-0 top-[35%] -translate-y-1/2 pointer-events-none z-10 flex items-center justify-between px-8 opacity-25 hover:opacity-50 transition-opacity">
          <div class="flex items-center gap-1.5 text-[10px] font-mono text-amber-300">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>lens eye contact</span>
          </div>
          <div class="flex-1 mx-4 border-b border-amber-400/30"></div>
          <span class="text-[10px] font-mono text-amber-300">35%</span>
        </div>
      {/if}

      <!-- Countdown Overlay -->
      {#if countdownSec !== null}
        <div class="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
          <div class="text-8xl font-black font-mono text-amber-400 animate-ping">
            {countdownSec}
          </div>
          <p class="text-sm font-mono text-slate-300 tracking-wider">
            Look directly at the camera lens • Starting in {countdownSec}...
          </p>
        </div>
      {/if}

      <!-- Paused on Scroll Notification Banner -->
      {#if pausedOnScroll}
        <div class="absolute top-4 z-30 px-4 py-1.5 bg-purple-950/90 border border-amber-400/40 rounded-full backdrop-blur-md shadow-lg flex items-center gap-2 text-xs font-mono text-amber-300 animate-in fade-in slide-in-from-top-2">
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>Playback paused on scroll • Press Space or Play to resume</span>
        </div>
      {/if}

      <!-- Scrollable Text Channel (Auto-pauses when user scrolls) -->
      <div
        bind:this={containerEl}
        class="w-full h-full overflow-y-auto px-6 sm:px-12 lg:px-20 pt-44 pb-64 focus:outline-none {isMirrored ? 'scale-x-[-1]' : ''}"
      >
        <div class="max-w-3xl mx-auto space-y-6">
          <!-- Spoken Dialogue & Paced Breath Tokens -->
          <div class="leading-[2.2] {
            fontSize === 'md' ? 'text-xl sm:text-2xl leading-[2.1]' :
            fontSize === 'lg' ? 'text-2xl sm:text-3xl leading-[2.2]' :
            fontSize === 'xl' ? 'text-3xl sm:text-4xl leading-[2.3] font-medium' :
            'text-4xl sm:text-5xl leading-[2.4] font-medium'
          }">
            {#each activeScene.tokens as token, tIdx}
              {#if token.type === 'break'}
                <div class="h-6"></div>
              {:else if token.type === 'heading'}
                <div class="my-3 px-3 py-1 bg-purple-950/40 border-l-4 border-amber-400 text-amber-300 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider inline-block">
                  # {token.text}
                </div>
              {:else if token.type === 'cue'}
                <div class="my-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-black/80 border border-purple-900 text-purple-300 font-mono text-xs font-semibold rounded mr-2">
                  <Film class="w-3 h-3 text-purple-400" />
                  <span>[{token.text}]</span>
                </div>
              {:else if token.type === 'word'}
                {@const isPast = (token.endTime !== undefined) && ((elapsedSceneMs / 1000) >= token.endTime)}
                {@const isCurrent = (token.startTime !== undefined && token.endTime !== undefined) && ((elapsedSceneMs / 1000) >= token.startTime && (elapsedSceneMs / 1000) < token.endTime)}
                
                <button
                  type="button"
                  id={isCurrent ? 'teleprompter-current-target' : undefined}
                  onclick={() => seekToWord(token)}
                  class="inline-block text-left transition-all duration-100 mr-2 rounded cursor-pointer {
                    isCurrent
                      ? 'bg-amber-400 text-black font-extrabold px-1.5 py-0.5 shadow-lg ring-2 ring-amber-300 scale-105'
                      : isPast
                      ? 'text-white/85 font-medium hover:text-amber-300'
                      : 'text-slate-500/50 font-normal hover:text-slate-300'
                  } {token.isBold ? 'font-bold underline decoration-amber-400/50 decoration-2' : ''} {token.isItalic ? 'italic' : ''}"
                  title="Click to jump prompter to this word"
                >
                  {token.text}
                </button>
              {:else if token.type === 'breath' || token.type === 'pause'}
                {@const isPast = (token.endTime !== undefined) && ((elapsedSceneMs / 1000) >= token.endTime)}
                {@const isCurrent = (token.startTime !== undefined && token.endTime !== undefined) && ((elapsedSceneMs / 1000) >= token.startTime && (elapsedSceneMs / 1000) < token.endTime)}

                {#if showBreathMarkers && (token.breathType === 'sentence' || token.breathType === 'paragraph' || token.breathType === 'beat')}
                  <button
                    type="button"
                    id={isCurrent ? 'teleprompter-current-target' : undefined}
                    onclick={() => seekToWord(token)}
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono transition-all duration-150 mr-2 align-middle cursor-pointer {
                      isCurrent
                        ? 'bg-cyan-400 text-black font-bold ring-2 ring-cyan-300 scale-110 shadow-lg'
                        : isPast
                        ? 'text-slate-600/50 opacity-30 hover:opacity-80'
                        : 'text-cyan-400/60 bg-cyan-950/20 border border-cyan-800/40 opacity-70 hover:opacity-100'
                    }"
                    title={token.breathType === 'beat' ? 'Pause beat' : 'Natural breath pause'}
                  >
                    <Wind class="w-3 h-3 {isCurrent ? 'animate-pulse' : ''}" />
                    <span>{isCurrent ? 'inhale' : (token.breathType === 'beat' ? 'beat' : 'breath')}</span>
                  </button>
                {/if}
              {/if}
            {/each}
          </div>

          <!-- Bottom spacing buffer for comfortable reading of the last scene line -->
          <div class="h-64"></div>
        </div>
      </div>

      <!-- Floating Minimalist Island Dock (Auto-dims during playback unless hovered) -->
      <footer
        class="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 bg-[#090412]/90 backdrop-blur-md border border-purple-900/60 rounded-full shadow-2xl flex items-center gap-3 transition-opacity duration-300 {
          isPlaying ? 'opacity-25 hover:opacity-100' : 'opacity-100'
        }"
      >
        <!-- Prev Scene -->
        <button
          type="button"
          onclick={prevScene}
          disabled={currentSceneIndex === 0}
          class="p-2 rounded-full bg-black/60 border border-purple-900/80 text-slate-300 hover:text-white hover:border-amber-400/50 transition-colors disabled:opacity-30"
          title="Previous Scene (Left Arrow)"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <!-- Restart -->
        <button
          type="button"
          onclick={restartScene}
          class="p-2 rounded-full bg-black/60 border border-purple-900/80 text-slate-300 hover:text-white hover:border-amber-400/50 transition-colors"
          title="Restart Scene (R)"
        >
          <RotateCcw class="w-3.5 h-3.5 text-amber-400" />
        </button>

        <!-- Primary Play/Pause Button -->
        <button
          type="button"
          onclick={togglePlayPause}
          class="flex items-center gap-2 px-6 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold font-display text-xs tracking-wider rounded-full shadow-lg transition-transform active:scale-95"
          title="Play / Pause (Spacebar)"
        >
          {#if isPlaying}
            <Pause class="w-4 h-4 fill-black text-black" />
            <span>PAUSE</span>
          {:else}
            <Play class="w-4 h-4 fill-black text-black" />
            <span>{elapsedSceneMs > 0 ? 'RESUME' : 'PLAY'}</span>
          {/if}
        </button>

        <!-- Scene Selector Pills -->
        <div class="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-black/60 border border-purple-900/60 rounded-full">
          {#each preparedScenes as s, sIdx}
            <button
              type="button"
              onclick={() => jumpToScene(sIdx)}
              class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono transition-colors {sIdx === currentSceneIndex
                ? 'bg-amber-400 text-black font-bold'
                : 'text-slate-400 hover:text-white hover:bg-purple-950'}"
              title={`Scene ${s.sceneNumber}`}
            >
              {s.sceneNumber}
            </button>
          {/each}
        </div>

        <!-- Next Scene -->
        <button
          type="button"
          onclick={nextScene}
          disabled={currentSceneIndex >= preparedScenes.length - 1}
          class="p-2 rounded-full bg-black/60 border border-purple-900/80 text-slate-300 hover:text-white hover:border-amber-400/50 transition-colors disabled:opacity-30"
          title="Next Scene (Right Arrow)"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </footer>
    </div>
  </div>
{/if}
