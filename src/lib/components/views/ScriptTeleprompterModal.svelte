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
    Clock,
    Film,
    Sparkles,
    Volume2,
    Type,
    Gauge,
    FlipHorizontal,
    Tv
  } from 'lucide-svelte';

  interface Props {
    script: Script;
    isOpen: boolean;
    initialSceneIndex?: number;
    onClose: () => void;
  }

  let { script, isOpen, initialSceneIndex = 0, onClose }: Props = $props();

  interface Token {
    type: 'word' | 'cue' | 'heading' | 'break';
    text?: string;
    isBold?: boolean;
    isItalic?: boolean;
    weight?: number;
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
  }

  let currentSceneIndex = $state(0);
  let isPlaying = $state(false);
  let playbackSpeed = $state(1.0); // 0.75, 1.0, 1.25, 1.5
  let fontSize = $state<'md' | 'lg' | 'xl' | '2xl'>('xl');
  let isMirrored = $state(false);
  let isFullscreen = $state(false);
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
        return {
          index: idx,
          sceneNumber: clip.clip_number || idx + 1,
          title: clip.on_screen_text ? `Scene ${clip.clip_number}: ${clip.on_screen_text}` : `Scene ${clip.clip_number}`,
          duration: Math.max(3, dur),
          visualDirection: clip.visual_direction,
          onScreenText: clip.on_screen_text,
          tokens: tokenizeSceneText(text, Math.max(3, dur)),
          rawText: text
        };
      });
    }

    // Fallback: Partition full_script into scenes using markdown headers or bracket markers
    const full = script.full_script || '';
    if (!full.trim()) {
      return [{
        index: 0,
        sceneNumber: 1,
        title: 'Scene 1',
        duration: script.target_duration_seconds || 60,
        tokens: tokenizeSceneText('Ready to record. Write or generate your dialogue in Script Studio.', 5),
        rawText: ''
      }];
    }

    const sections = full.split(/\n(?=\[(?:HOOK|POINT|SCENE|CTA|MAIN).*?\]|^#{1,3}\s+)/gim);
    return sections.map((sec, idx) => {
      const trimmed = sec.trim();
      const dur = estimateDurationFromText(trimmed);
      return {
        index: idx,
        sceneNumber: idx + 1,
        title: `Scene ${idx + 1}`,
        duration: Math.max(4, dur),
        tokens: tokenizeSceneText(trimmed, Math.max(4, dur)),
        rawText: trimmed
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

  let activeWordIndex = $derived.by(() => {
    if (!activeScene) return -1;
    const currentSec = elapsedSceneMs / 1000;
    const words = activeScene.tokens.filter(t => t.type === 'word');
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (w.startTime !== undefined && w.endTime !== undefined) {
        if (currentSec >= w.startTime && currentSec < w.endTime) {
          return i;
        }
      }
    }
    if (currentSec >= activeScene.duration) {
      return words.length - 1;
    }
    return 0;
  });

  function estimateDurationFromText(text: string): number {
    const clean = text.replace(/\[.*?\]/g, '').replace(/#+/g, '').trim();
    const wordCount = clean.split(/\s+/).filter(Boolean).length;
    // ~140 words per minute = ~2.33 words per second
    return Math.max(4, Math.round(wordCount / 2.33));
  }

  function tokenizeSceneText(text: string, sceneDurSec: number): Token[] {
    const lines = text.split('\n');
    const tokens: Token[] = [];

    for (let l = 0; l < lines.length; l++) {
      const rawLine = lines[l].trim();
      if (!rawLine) {
        tokens.push({ type: 'break' });
        continue;
      }

      // 1. Heading `# Title`
      if (/^#{1,6}\s+/.test(rawLine)) {
        tokens.push({ type: 'heading', text: rawLine.replace(/^#{1,6}\s+/, '') });
        continue;
      }

      // 2. Full-line cue `[B-ROLL: Camera Zoom]`
      if (/^\[(.*?)\]$/.test(rawLine)) {
        tokens.push({ type: 'cue', text: rawLine.slice(1, -1) });
        continue;
      }

      // 3. Inline markdown: **bold**, *italic*, [inline cue], regular words
      const regex = /(\*\*.*?\*\*|\*.*?\*|\[.*?\]|[^\s*\[\]]+)/g;
      let match;
      while ((match = regex.exec(rawLine)) !== null) {
        const part = match[0];
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          const inner = part.slice(2, -2);
          inner.split(/\s+/).forEach(w => {
            if (w) tokens.push({ type: 'word', text: w, isBold: true, isItalic: false, weight: Math.max(1, w.length) });
          });
        } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          const inner = part.slice(1, -1);
          inner.split(/\s+/).forEach(w => {
            if (w) tokens.push({ type: 'word', text: w, isBold: false, isItalic: true, weight: Math.max(1, w.length) });
          });
        } else if (part.startsWith('[') && part.endsWith(']')) {
          tokens.push({ type: 'cue', text: part.slice(1, -1) });
        } else {
          tokens.push({ type: 'word', text: part, isBold: false, isItalic: false, weight: Math.max(1, part.length) });
        }
      }
    }

    // Calculate proportional timeline for spoken words based on syllable / char weight
    const spokenWords = tokens.filter(t => t.type === 'word');
    const totalWeight = spokenWords.reduce((acc, t) => acc + (t.weight || 1), 0) || 1;
    let currTime = 0;
    for (const w of spokenWords) {
      const dur = ((w.weight || 1) / totalWeight) * sceneDurSec;
      w.startTime = currTime;
      w.endTime = currTime + dur;
      currTime += dur;
    }

    return tokens;
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
      // Advance to next scene
      if (currentSceneIndex < preparedScenes.length - 1) {
        currentSceneIndex++;
        elapsedSceneMs = 0;
        lastTimestamp = timestamp;
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
    const currentEl = containerEl.querySelector('#teleprompter-current-word') as HTMLElement | null;
    if (!currentEl) return;
    const containerRect = containerEl.getBoundingClientRect();
    const wordRect = currentEl.getBoundingClientRect();
    const targetTop = containerRect.top + (containerRect.height * 0.35); // 35% eye line
    const diff = wordRect.top - targetTop;

    if (Math.abs(diff) > 20) {
      containerEl.scrollBy({
        top: diff,
        behavior: 'smooth'
      });
    }
  }

  function restartScene() {
    elapsedSceneMs = 0;
    lastTimestamp = null;
    if (containerEl) containerEl.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextScene() {
    if (currentSceneIndex < preparedScenes.length - 1) {
      currentSceneIndex++;
      restartScene();
    }
  }

  function prevScene() {
    if (currentSceneIndex > 0) {
      currentSceneIndex--;
      restartScene();
    }
  }

  function jumpToScene(idx: number) {
    if (idx >= 0 && idx < preparedScenes.length) {
      currentSceneIndex = idx;
      restartScene();
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
    } else {
      pause();
      window.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      pause();
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  onDestroy(() => {
    pause();
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown);
    }
  });
</script>

{#if isOpen}
  <div use:portal class="fixed inset-0 z-50 bg-[#07030c] text-white flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-200">
    <!-- Top Studio Header -->
    <header class="h-16 px-6 bg-[#0c0517] border-b border-purple-900/60 flex items-center justify-between gap-4 shrink-0 z-20">
      <div class="flex items-center gap-3 min-w-0">
        <div class="flex items-center gap-2 px-2.5 py-1 bg-amber-400 text-black font-bold font-mono text-xs tracking-wider uppercase">
          <Tv class="w-3.5 h-3.5" />
          <span>Teleprompter</span>
        </div>

        <div class="min-w-0">
          <h2 class="text-sm font-bold text-white truncate font-display">
            {script.title || 'Untitled Script'}
          </h2>
          <div class="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>Scene {currentSceneIndex + 1} of {preparedScenes.length}</span>
            <span class="text-slate-600">•</span>
            <span class="text-amber-400">
              {formatTime(elapsedSceneMs / 1000)} / {formatTime(activeScene.duration)}
            </span>
            <span class="text-slate-600">•</span>
            <span class="text-slate-400">
              Total {formatTime(totalElapsedSec)} / {formatTime(totalScriptDurationSec)}
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Studio Controls -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Speed Controls -->
        <div class="flex items-center gap-1 px-2 py-1 bg-black border border-purple-900/60 rounded text-xs font-mono">
          <Gauge class="w-3.5 h-3.5 text-purple-400 mr-1 hidden sm:inline" />
          {#each [0.8, 1.0, 1.25, 1.5] as spd}
            <button
              type="button"
              onclick={() => (playbackSpeed = spd)}
              class="px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors {playbackSpeed === spd
                ? 'bg-amber-400 text-black font-bold'
                : 'text-slate-400 hover:text-white'}"
            >
              {spd}x
            </button>
          {/each}
        </div>

        <!-- Typography Size -->
        <div class="flex items-center gap-1 px-2 py-1 bg-black border border-purple-900/60 rounded text-xs font-mono">
          <Type class="w-3.5 h-3.5 text-amber-400 mr-1 hidden sm:inline" />
          {#each [
            { id: 'md', label: 'M' },
            { id: 'lg', label: 'L' },
            { id: 'xl', label: 'XL' },
            { id: '2xl', label: '2XL' }
          ] as sz}
            <button
              type="button"
              onclick={() => (fontSize = sz.id as any)}
              class="px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors {fontSize === sz.id
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'}"
              title={`Font size ${sz.label}`}
            >
              {sz.label}
            </button>
          {/each}
        </div>

        <!-- Mirror Mode Button (For hardware teleprompter glass) -->
        <button
          type="button"
          onclick={() => (isMirrored = !isMirrored)}
          class="p-2 rounded border transition-colors {isMirrored
            ? 'bg-amber-400 text-black border-amber-300 font-bold'
            : 'bg-black border-purple-900/60 text-slate-300 hover:text-white'}"
          title="Mirror text horizontally (for beam splitter glass)"
        >
          <FlipHorizontal class="w-3.5 h-3.5" />
        </button>

        <!-- Fullscreen Button -->
        <button
          type="button"
          onclick={toggleFullscreen}
          class="p-2 bg-black border border-purple-900/60 rounded text-slate-300 hover:text-white transition-colors"
          title="Toggle Fullscreen (F)"
        >
          {#if isFullscreen}
            <Minimize2 class="w-3.5 h-3.5" />
          {:else}
            <Maximize2 class="w-3.5 h-3.5" />
          {/if}
        </button>

        <!-- Close Studio Mode -->
        <button
          type="button"
          onclick={closeTeleprompter}
          class="p-2 bg-purple-950/70 hover:bg-rose-950 text-slate-300 hover:text-rose-200 border border-purple-800 hover:border-rose-700 rounded transition-colors"
          title="Exit Teleprompter (Esc)"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Scene Information Cue Bar -->
    <div class="px-6 py-2.5 bg-[#0e071a] border-b border-purple-900/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
      <div class="flex items-center gap-3">
        <span class="text-amber-400 font-bold">
          Scene {activeScene.sceneNumber} / {preparedScenes.length}
        </span>
        {#if activeScene.onScreenText}
          <div class="flex items-center gap-1.5 px-2 py-0.5 bg-black border border-amber-400/30 text-amber-300 text-[11px]">
            <span class="text-slate-500 uppercase text-[9px]">Graphic:</span>
            <span>{activeScene.onScreenText}</span>
          </div>
        {/if}
        {#if activeScene.visualDirection}
          <div class="flex items-center gap-1.5 px-2 py-0.5 bg-purple-950/60 border border-purple-800 text-purple-200 text-[11px]">
            <Film class="w-3 h-3 text-purple-400" />
            <span>{activeScene.visualDirection}</span>
          </div>
        {/if}
      </div>

      <!-- Scene Progress Bar -->
      <div class="flex items-center gap-2 w-full sm:w-48">
        <div class="flex-1 h-1.5 bg-black border border-purple-900 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-75"
            style={`width: ${Math.min(100, (elapsedSceneMs / (activeScene.duration * 1000)) * 100)}%`}
          ></div>
        </div>
        <span class="text-[10px] text-slate-400 font-mono shrink-0">
          {Math.round(Math.min(100, (elapsedSceneMs / (activeScene.duration * 1000)) * 100))}%
        </span>
      </div>
    </div>

    <!-- Teleprompter Main Display Container -->
    <div class="relative flex-1 flex flex-col justify-center items-center overflow-hidden bg-[#07030c]">
      <!-- Eye-Level Camera Guideline -->
      <div class="absolute left-0 right-0 top-[35%] -translate-y-1/2 pointer-events-none z-10 flex items-center justify-between px-6 opacity-40">
        <div class="flex items-center gap-1 text-[10px] font-mono text-amber-400">
          <Eye class="w-3.5 h-3.5 text-amber-400" />
          <span>EYE CONTACT LEVEL</span>
        </div>
        <div class="flex-1 mx-4 border-b border-dashed border-amber-400/40"></div>
        <span class="text-[10px] font-mono text-amber-400">LOOK INTO LENS</span>
      </div>

      <!-- Countdown Overlay -->
      {#if countdownSec !== null}
        <div class="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
          <div class="text-8xl font-black font-mono text-amber-400 animate-ping">
            {countdownSec}
          </div>
          <p class="text-sm font-mono text-slate-300 tracking-wider">
            Look at the camera lens • Starting in {countdownSec}...
          </p>
        </div>
      {/if}

      <!-- Scrollable Text Area -->
      <div
        bind:this={containerEl}
        class="w-full h-full overflow-y-auto px-8 sm:px-16 lg:px-24 py-36 scroll-smooth {isMirrored ? 'scale-x-[-1]' : ''}"
      >
        <div class="max-w-4xl mx-auto space-y-6">
          <!-- Spoken Dialogue Tokens -->
          <div class="leading-relaxed {
            fontSize === 'md' ? 'text-xl sm:text-2xl leading-normal' :
            fontSize === 'lg' ? 'text-2xl sm:text-3xl leading-relaxed' :
            fontSize === 'xl' ? 'text-3xl sm:text-4xl leading-loose font-medium' :
            'text-4xl sm:text-5xl leading-loose font-medium'
          }">
            {#each activeScene.tokens as token, tIdx}
              {#if token.type === 'break'}
                <div class="h-4"></div>
              {:else if token.type === 'heading'}
                <div class="my-3 px-3 py-1 bg-purple-950/60 border-l-4 border-amber-400 text-amber-300 font-mono text-sm sm:text-base font-bold uppercase tracking-wider inline-block">
                  # {token.text}
                </div>
              {:else if token.type === 'cue'}
                <div class="my-2 inline-flex items-center gap-1.5 px-3 py-1 bg-black/90 border border-purple-800 text-purple-300 font-mono text-xs sm:text-sm font-semibold rounded mr-2">
                  <Film class="w-3 h-3 text-purple-400" />
                  <span>[{token.text}]</span>
                </div>
              {:else if token.type === 'word'}
                {@const isPast = (token.endTime !== undefined) && ((elapsedSceneMs / 1000) >= token.endTime)}
                {@const isCurrent = (token.startTime !== undefined && token.endTime !== undefined) && ((elapsedSceneMs / 1000) >= token.startTime && (elapsedSceneMs / 1000) < token.endTime)}
                
                <span
                  id={isCurrent ? 'teleprompter-current-word' : undefined}
                  class="inline-block transition-all duration-100 mr-2 rounded {
                    isCurrent
                      ? 'bg-amber-400 text-black font-extrabold px-1.5 py-0.5 shadow-lg ring-2 ring-amber-300 scale-105'
                      : isPast
                      ? 'text-white font-medium opacity-90'
                      : 'text-slate-500 opacity-60 font-normal'
                  } {token.isBold ? 'font-bold' : ''} {token.isItalic ? 'italic' : ''}"
                >
                  {token.text}
                </span>
              {/if}
            {/each}
          </div>

          <!-- Bottom spacing to allow smooth scrolling past the last line -->
          <div class="h-48"></div>
        </div>
      </div>
    </div>

    <!-- Bottom Studio Dock Controls -->
    <footer class="h-20 px-6 bg-[#0c0517] border-t border-purple-900/60 flex items-center justify-between gap-4 shrink-0 z-20">
      <!-- Scene Navigation Buttons -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={prevScene}
          disabled={currentSceneIndex === 0}
          class="flex items-center gap-1 px-3 py-2 bg-black border border-purple-900 text-slate-300 hover:text-white hover:border-amber-400/50 text-xs font-mono transition-colors disabled:opacity-40"
          title="Previous Scene (Left Arrow)"
        >
          <ChevronLeft class="w-4 h-4" />
          <span class="hidden sm:inline">Prev Scene</span>
        </button>

        <button
          type="button"
          onclick={restartScene}
          class="flex items-center gap-1 px-3 py-2 bg-black border border-purple-900 text-slate-300 hover:text-white hover:border-amber-400/50 text-xs font-mono transition-colors"
          title="Restart Scene (R)"
        >
          <RotateCcw class="w-3.5 h-3.5 text-amber-400" />
          <span class="hidden sm:inline">Restart</span>
        </button>
      </div>

      <!-- Big Primary Play/Pause Button -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          onclick={togglePlayPause}
          class="flex items-center justify-center gap-2 px-8 py-3 bg-amber-400 hover:bg-amber-300 text-black font-bold font-display text-sm tracking-wider shadow-lg rounded transition-all active:scale-95"
          title="Play / Pause (Spacebar)"
        >
          {#if isPlaying}
            <Pause class="w-5 h-5 fill-black text-black" />
            <span>PAUSE</span>
          {:else}
            <Play class="w-5 h-5 fill-black text-black" />
            <span>{elapsedSceneMs > 0 ? 'RESUME' : 'PLAY'}</span>
          {/if}
        </button>
      </div>

      <!-- Next Scene & Scene Selector Carousel -->
      <div class="flex items-center gap-2">
        <!-- Scene Selector Pills -->
        <div class="hidden lg:flex items-center gap-1 px-2 py-1 bg-black border border-purple-900/60 rounded max-w-xs overflow-x-auto">
          {#each preparedScenes as s, sIdx}
            <button
              type="button"
              onclick={() => jumpToScene(sIdx)}
              class="w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono transition-colors {sIdx === currentSceneIndex
                ? 'bg-amber-400 text-black font-bold'
                : 'text-slate-400 hover:text-white hover:bg-purple-950'}"
              title={`Jump to Scene ${s.sceneNumber}`}
            >
              {s.sceneNumber}
            </button>
          {/each}
        </div>

        <button
          type="button"
          onclick={nextScene}
          disabled={currentSceneIndex >= preparedScenes.length - 1}
          class="flex items-center gap-1 px-3 py-2 bg-black border border-purple-900 text-slate-300 hover:text-white hover:border-amber-400/50 text-xs font-mono transition-colors disabled:opacity-40"
          title="Next Scene (Right Arrow)"
        >
          <span class="hidden sm:inline">Next Scene</span>
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </footer>
  </div>
{/if}
