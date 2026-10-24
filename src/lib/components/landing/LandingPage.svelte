<script lang="ts">
  import { appState } from '../../stores/appState.svelte';
  import {
    Sparkles,
    Radio,
    Video,
    FileCode,
    Compass,
    ArrowRight,
    Check,
    Globe,
    Layers,
    Flame,
    BarChart3,
    Terminal,
    Target
  } from 'lucide-svelte';
  import { reveal } from '../../utils/reveal';

  // Interactive Sandbox state on the landing page
  let selectedDemoNiche = $state('AI & Robotics');
  let activeDemo = $derived(demoNichesData[selectedDemoNiche]);

  const demoNichesData: Record<string, { headline: string; source: string; angle: string; hook: string }> = {
    'AI & Robotics': {
      headline: 'Next-Generation Autonomous Coding Agents Enter Production Workflows',
      source: 'Global Tech Insider',
      angle: 'Why Software Engineers Are Moving from Syntax Writing to Agent Architecture',
      hook: 'Stop using AI as glorified autocomplete—here is the exact 3-layer architecture real agents use.'
    },
    'Web Development': {
      headline: 'Svelte 5 Runes Officially Adopted Across Enterprise Frontend Applications',
      source: 'Dev Weekly',
      angle: 'The End of Reactive Boilerplate: Why Runes Are Replacing Legacy Framework State',
      hook: 'If you are still writing 200 lines of state management in 2026, you need to see this.'
    },
    'Personal Finance': {
      headline: 'New Global Dividend Tax Framework Approved for Digital Assets',
      source: 'Financial Times',
      angle: 'How High-Yield Creators Are Restructuring Cash Flows for 2026',
      hook: 'The tax rule that 90% of creators will miss this year—and how to protect your revenue.'
    },
    'Fitness & Health': {
      headline: 'Peer-Reviewed Study Reveals Optimal Muscle Protein Synthesis Timing',
      source: 'Sports Science Journal',
      angle: 'Why the 30-Minute Anabolic Window Myth is Officially Dead',
      hook: 'You do not need to drink your protein shake the second you finish your workout.'
    }
  };
</script>

<div class="min-h-screen bg-[#08040d] text-slate-100 swiss-grid selection:bg-amber-400 selection:text-black">
  <!-- TOP NAVIGATION -->
  <header class="sticky top-0 z-40 border-b border-purple-900/40 bg-[#08040d]/90 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-amber-400 text-black flex items-center justify-center font-black text-sm tracking-tighter">
          K8
        </div>
        <div class="flex flex-col">
          <span class="font-extrabold tracking-tight text-white text-base uppercase font-display">
            KRE<span class="text-amber-400">8</span>
          </span>
          <span class="swiss-tag text-[9px] text-purple-400 -mt-1 tracking-widest font-mono">
            SYS.CREATOR.OS
          </span>
        </div>
      </div>

      <!-- Center Links -->
      <nav class="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-slate-400">
        <a href="#overview" class="hover:text-amber-400 transition-colors">Overview</a>
        <a href="#news-engine" class="hover:text-amber-400 transition-colors">News Radar</a>
        <a href="#script-studio" class="hover:text-amber-400 transition-colors">Script Studio</a>
        <a href="#pricing" class="hover:text-amber-400 transition-colors">Pricing</a>
      </nav>

      <!-- Right Actions -->
      <div class="flex items-center gap-3">
        <button
          onclick={() => appState.openAuth('login')}
          class="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
        >
          Sign In
        </button>
        <button
          onclick={() => appState.enterWorkspace('dashboard')}
          class="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black tracking-wider uppercase transition-all shadow-md active:scale-95 flex items-center gap-1.5 font-display"
        >
          <span>Launch Studio</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </header>

  <!-- HERO SECTION -->
  <section id="overview" class="relative pt-20 pb-28 border-b border-purple-900/40 overflow-hidden">
    <!-- Geometric accent lines -->
    <div class="absolute left-1/2 top-0 -translate-x-1/2 w-[1100px] h-96 bg-purple-900/10 blur-[120px] pointer-events-none animate-float-slow"></div>

    <div use:reveal={{ delay: 50 }} class="max-w-7xl mx-auto px-6 relative z-10 space-y-10">
      <!-- Header Tag -->
      <div class="flex items-center gap-3">
        <span class="w-2.5 h-2.5 bg-amber-400"></span>
        <span class="swiss-tag text-amber-400 font-mono tracking-widest text-[11px]">
          The Creator Operating System
        </span>
      </div>

      <!-- Giant Swiss Display Title -->
      <div class="space-y-4 max-w-5xl">
        <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold uppercase tracking-tighter text-white font-display leading-[0.95]">
          The Intelligent System For <span class="text-amber-400 underline decoration-purple-600 decoration-4">High-Output</span> Content Creators.
        </h1>
        <p class="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed pt-2">
          Kre8 is a centralized workspace engineered to capture ideas, ingest daily niche news, synthesize viral hooks via Gemini AI, break scripts down into filming scenes, and manage production across a 10-stage Kanban pipeline.
        </p>
      </div>

      <!-- Dual CTAs -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
        <button
          onclick={() => appState.enterWorkspace('dashboard')}
          class="px-8 py-4 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-sm tracking-wider uppercase transition-all shadow-xl shadow-amber-400/10 flex items-center justify-center gap-3 active:scale-95 font-display"
        >
          <span>Enter Kre8 Workspace</span>
          <ArrowRight class="w-4 h-4" />
        </button>

        <a
          href="#news-engine"
          class="px-8 py-4 bg-[#12071d] hover:bg-[#1b0b2b] text-purple-200 border border-purple-600/40 text-sm font-mono tracking-wider uppercase transition-colors text-center"
        >
          [ Explore Live News AI Demo ]
        </a>
      </div>

      <!-- Live Telemetry Stat Bar -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-purple-900/40">
        <div class="p-4 border-l-2 border-amber-400 bg-purple-950/20">
          <span class="swiss-tag text-slate-400 block mb-1">01 / PRODUCTION PHASES</span>
          <span class="text-2xl font-black text-white font-display">10 Stages</span>
          <span class="text-[11px] text-slate-400 block mt-0.5">Idea to Repurposing</span>
        </div>

        <div class="p-4 border-l-2 border-purple-500 bg-purple-950/20">
          <span class="swiss-tag text-slate-400 block mb-1">02 / TREND RADAR</span>
          <span class="text-2xl font-black text-white font-display">Daily News Ingestion</span>
          <span class="text-[11px] text-purple-300 block mt-0.5">Niche & Sub-Niche feeds</span>
        </div>

        <div class="p-4 border-l-2 border-amber-400 bg-purple-950/20">
          <span class="swiss-tag text-slate-400 block mb-1">03 / AI SYNTHESIZER</span>
          <span class="text-2xl font-black text-white font-display">Gemini 2.5 Engine</span>
          <span class="text-[11px] text-amber-300 block mt-0.5">Viral hooks & clip parsing</span>
        </div>

        <div class="p-4 border-l-2 border-purple-500 bg-purple-950/20">
          <span class="swiss-tag text-slate-400 block mb-1">04 / CONSISTENCY</span>
          <span class="text-2xl font-black text-white font-display">Streak Tracking</span>
          <span class="text-[11px] text-slate-400 block mt-0.5">Leading input focus</span>
        </div>
      </div>
    </div>
  </section>

  <!-- INTERACTIVE NICHE NEWS & GEMINI AI DEMO SANDBOX -->
  <section id="news-engine" class="py-24 border-b border-purple-900/40 bg-[#0d0515]/60">
    <div use:reveal={{ delay: 80 }} class="max-w-7xl mx-auto px-6 space-y-12">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="space-y-2">
          <span class="swiss-tag text-amber-400 font-mono tracking-widest text-[11px]">
            Real-Time Niche Trends
          </span>
          <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white font-display">
            How The Daily News-to-Idea AI Engine Works
          </h2>
          <p class="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Creators pick their niche and sub-niche. Kre8's background engine queries daily breaking news, and Gemini extracts high-retention video angles with instant hooks.
          </p>
        </div>

        <button
          onclick={() => appState.enterWorkspace('discover')}
          class="px-5 py-2.5 bg-amber-400 text-black text-xs font-bold uppercase tracking-wider font-display shrink-0 hover:bg-amber-300 transition-colors"
        >
          Try in Studio →
        </button>
      </div>

      <!-- Interactive Niche Switcher Pills -->
      <div class="flex gap-2 overflow-x-auto pb-2 border-b border-purple-900/40">
        {#each Object.keys(demoNichesData) as nicheKey}
          <button
            onclick={() => (selectedDemoNiche = nicheKey)}
            class="px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all {selectedDemoNiche === nicheKey
              ? 'bg-amber-400 text-black font-extrabold border-amber-400'
              : 'bg-purple-950/40 text-slate-300 hover:text-white border border-purple-900/60'}"
          >
            {nicheKey}
          </button>
        {/each}
      </div>

      <!-- Live Pipeline Demo Card -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 swiss-card p-8 border border-purple-800/40 bg-[#11071c]">
        <!-- Step 1: News Article Ingestion -->
        <div class="lg:col-span-5 space-y-4 border-b lg:border-b-0 lg:border-r border-purple-900/50 pb-6 lg:pb-0 lg:pr-8">
          <div class="flex items-center gap-2">
            <Radio class="w-4 h-4 text-purple-400 animate-pulse" />
            <span class="swiss-tag text-purple-300">Trending Headline</span>
          </div>
          <span class="text-xs font-mono text-amber-400/90 block">{activeDemo.source} • Today</span>
          <h3 class="text-xl font-bold text-white font-display leading-snug">
            "{activeDemo.headline}"
          </h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Automatically queried via real-time RSS search based on your active sub-niche keyword targets.
          </p>
        </div>

        <!-- Step 2: Gemini Synthesis -->
        <div class="lg:col-span-7 space-y-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-amber-400" />
              <span class="swiss-tag text-amber-400">AI Synthesized Angle</span>
            </div>
            <span class="text-[10px] font-mono px-2 py-0.5 bg-purple-900/40 text-purple-300 border border-purple-700/50 uppercase">
              Short Video / Reel
            </span>
          </div>

          <div class="space-y-3">
            <h4 class="text-lg font-bold text-white font-display">
              {activeDemo.angle}
            </h4>

            <div class="p-4 bg-black/60 border border-purple-900/60 space-y-1.5">
              <span class="swiss-tag text-slate-400 block text-[10px]">3-Second Viral Hook:</span>
              <p class="text-xs font-mono text-amber-300 italic">
                "{activeDemo.hook}"
              </p>
            </div>
          </div>

          <!-- Action -->
          <div class="pt-2 flex items-center justify-between">
            <span class="text-xs text-slate-400 font-mono">1-Click Action in Kre8:</span>
            <button
              onclick={() => appState.enterWorkspace('ideas')}
              class="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold font-display uppercase tracking-wider"
            >
              Save to Ideas Bank →
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- THE 4 SWISS ARCHITECTURAL PILLARS -->
  <section id="workflow" class="py-24 border-b border-purple-900/40">
    <div use:reveal={{ delay: 60 }} class="max-w-7xl mx-auto px-6 space-y-14">
      <div class="space-y-2">
        <span class="swiss-tag text-amber-400 font-mono tracking-widest text-[11px]">
          Core Capabilities
        </span>
        <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white font-display">
          Everything High-Output Creators Need
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Pillar 1 -->
        <div class="swiss-card swiss-card-hover p-6 border border-purple-900/50 bg-[#10071c] space-y-4 flex flex-col justify-between">
          <div class="space-y-3">
            <span class="swiss-tag text-amber-400">Discover</span>
            <h3 class="text-xl font-bold text-white font-display uppercase">Trend Intelligence</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Real-time daily niche news ingestion. Monitor competitors and peers on your private Creator Watchlist.
            </p>
          </div>
          <button
            onclick={() => appState.enterWorkspace('discover')}
            class="text-xs font-mono text-purple-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <span>Open Discover</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Pillar 2 -->
        <div class="swiss-card swiss-card-hover p-6 border border-purple-900/50 bg-[#10071c] space-y-4 flex flex-col justify-between">
          <div class="space-y-3">
            <span class="swiss-tag text-amber-400">Script</span>
            <h3 class="text-xl font-bold text-white font-display uppercase">Script Studio</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Two-pane script drafting alongside independent clip/scene cards with duration timers, on-screen text, and visual cues.
            </p>
          </div>
          <button
            onclick={() => appState.enterWorkspace('scripts')}
            class="text-xs font-mono text-purple-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <span>Open Studio</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Pillar 3 -->
        <div class="swiss-card swiss-card-hover p-6 border border-purple-900/50 bg-[#10071c] space-y-4 flex flex-col justify-between">
          <div class="space-y-3">
            <span class="swiss-tag text-amber-400">Produce</span>
            <h3 class="text-xl font-bold text-white font-display uppercase">10-Stage Kanban</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Central content register tracking states from Idea through Researching, Recording, Editing, Scheduled, and Repurposed.
            </p>
          </div>
          <button
            onclick={() => appState.enterWorkspace('content')}
            class="text-xs font-mono text-purple-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <span>Open Kanban</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Pillar 4 -->
        <div class="swiss-card swiss-card-hover p-6 border border-purple-900/50 bg-[#10071c] space-y-4 flex flex-col justify-between">
          <div class="space-y-3">
            <span class="swiss-tag text-amber-400">Measure</span>
            <h3 class="text-xl font-bold text-white font-display uppercase">Analytics & Coach</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Aggregated views and follower stats across YouTube, LinkedIn, TikTok, and Instagram, plus Gemini performance critique.
            </p>
          </div>
          <button
            onclick={() => appState.enterWorkspace('analytics')}
            class="text-xs font-mono text-purple-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <span>Open Analytics</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- PRICING / ACCESS TIERS -->
  <section id="pricing" class="py-24 border-b border-purple-900/40 bg-[#0b0413]">
    <div use:reveal={{ delay: 80 }} class="max-w-7xl mx-auto px-6 space-y-12">
      <div class="space-y-2">
        <span class="swiss-tag text-amber-400 font-mono tracking-widest text-[11px]">
          Plans & Pricing
        </span>
        <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white font-display">
          Built For Solo Creators & Production Teams
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Tier 1 -->
        <div class="swiss-card p-8 border border-purple-900/60 bg-[#10071c] space-y-6">
          <div class="space-y-1">
            <span class="swiss-tag text-slate-400">[ TIER.01 ]</span>
            <h3 class="text-2xl font-black text-white font-display">Creator Starter</h3>
            <div class="text-3xl font-black text-amber-400 font-display pt-2">$0 <span class="text-xs font-mono text-slate-400 font-normal">/ Free Forever</span></div>
          </div>
          <ul class="space-y-2 text-xs text-slate-300 font-mono">
            <li class="flex items-center gap-2">✓ Unlimited Ideas Bank</li>
            <li class="flex items-center gap-2">✓ Full 10-Stage Kanban</li>
            <li class="flex items-center gap-2">✓ Local SQLite Persistence</li>
            <li class="flex items-center gap-2">✓ Content Calendar & Tasks</li>
          </ul>
          <button
            onclick={() => appState.enterWorkspace('dashboard')}
            class="w-full py-3 bg-purple-950/60 hover:bg-purple-900/40 text-purple-200 border border-purple-700/50 text-xs font-mono uppercase font-bold tracking-wider"
          >
            Launch Free Studio
          </button>
        </div>

        <!-- Tier 2 (Highlighted) -->
        <div class="swiss-card p-8 border-2 border-amber-400 bg-[#140824] space-y-6 relative shadow-2xl">
          <div class="absolute -top-3 right-6 px-3 py-0.5 bg-amber-400 text-black text-[10px] font-bold font-mono uppercase tracking-widest">
            RECOMMENDED
          </div>
          <div class="space-y-1">
            <span class="swiss-tag text-amber-400">[ TIER.02 ]</span>
            <h3 class="text-2xl font-black text-white font-display">Pro Studio</h3>
            <div class="text-3xl font-black text-amber-400 font-display pt-2">$19 <span class="text-xs font-mono text-slate-400 font-normal">/ month</span></div>
          </div>
          <ul class="space-y-2 text-xs text-slate-200 font-mono">
            <li class="flex items-center gap-2 text-amber-300">★ Daily Niche News AI Ingestion</li>
            <li class="flex items-center gap-2 text-amber-300">★ Gemini Script Studio with Scene Breakdown</li>
            <li class="flex items-center gap-2">✓ Multi-Platform Social Analytics</li>
            <li class="flex items-center gap-2">✓ AI Performance Coaching</li>
          </ul>
          <button
            onclick={() => appState.enterWorkspace('dashboard')}
            class="w-full py-3 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider font-display"
          >
            Get Started Now
          </button>
        </div>

        <!-- Tier 3 -->
        <div class="swiss-card p-8 border border-purple-900/60 bg-[#10071c] space-y-6">
          <div class="space-y-1">
            <span class="swiss-tag text-slate-400">[ TIER.03 ]</span>
            <h3 class="text-2xl font-black text-white font-display">Media Agency</h3>
            <div class="text-3xl font-black text-amber-400 font-display pt-2">$49 <span class="text-xs font-mono text-slate-400 font-normal">/ month</span></div>
          </div>
          <ul class="space-y-2 text-xs text-slate-300 font-mono">
            <li class="flex items-center gap-2">✓ Multi-Brand Workspaces</li>
            <li class="flex items-center gap-2">✓ Advanced YouTube & LinkedIn OAuth</li>
            <li class="flex items-center gap-2">✓ Teleprompter Team Export</li>
            <li class="flex items-center gap-2">✓ Dedicated API Quotas</li>
          </ul>
          <button
            onclick={() => appState.enterWorkspace('dashboard')}
            class="w-full py-3 bg-purple-950/60 hover:bg-purple-900/40 text-purple-200 border border-purple-700/50 text-xs font-mono uppercase font-bold tracking-wider"
          >
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="py-12 border-t border-purple-900/40 bg-[#050208] text-xs font-mono text-slate-500">
    <div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-3">
        <span class="font-bold text-white font-display">Kre8 Creator Studio</span>
        <span>•</span>
        <span>Production Workspace</span>
      </div>

      <div class="flex items-center gap-6 text-slate-400">
        <button onclick={() => appState.enterWorkspace('dashboard')} class="hover:text-amber-400 transition-colors uppercase">
          Enter Studio
        </button>
        <button onclick={() => appState.openAuth('login')} class="hover:text-amber-400 transition-colors uppercase">
          Sign In
        </button>
        <button onclick={() => appState.enterWorkspace('settings')} class="hover:text-amber-400 transition-colors uppercase">
          Settings
        </button>
      </div>

      <div>
        <span class="text-emerald-400 font-mono text-[10px]">● ALL SYSTEMS OPERATIONAL</span>
      </div>
    </div>
  </footer>
</div>
