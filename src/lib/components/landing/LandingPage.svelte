<script lang="ts">
  import { appState } from '../../stores/appState.svelte';
  import Kre8Logo from '../ui/Kre8Logo.svelte';
  import {
    Sparkles,
    Radio,
    ArrowRight
  } from 'lucide-svelte';
  import { reveal } from '../../utils/reveal';

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
      headline: 'Svelte 5 Runes Adopted Across Enterprise Frontend Applications',
      source: 'Dev Weekly',
      angle: 'Why Runes Are Replacing Legacy State Management',
      hook: 'If you are still writing 200 lines of state boilerplate, you need to see this.'
    },
    'Personal Finance': {
      headline: 'New Global Dividend Tax Framework Approved for Digital Assets',
      source: 'Financial Times',
      angle: 'How Creators Are Structuring Cash Flows This Year',
      hook: 'The tax rule that most creators will miss this year—and how to protect your revenue.'
    },
    'Fitness & Health': {
      headline: 'Peer-Reviewed Study Reveals Optimal Muscle Protein Synthesis Timing',
      source: 'Sports Science Journal',
      angle: 'Why the 30-Minute Post-Workout Window Myth Is Over',
      hook: 'You do not need to drink your protein shake the second you finish your workout.'
    }
  };
</script>

<div class="min-h-screen bg-[#08040d] text-slate-100 swiss-grid selection:bg-amber-400 selection:text-black">
  <!-- TOP NAVIGATION -->
  <header class="sticky top-0 z-40 border-b border-purple-900/30 bg-[#08040d]/85 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <!-- Logo -->
      <Kre8Logo size="md" variant="full" />

      <!-- Center Links -->
      <nav class="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
        <a href="#overview" class="hover:text-white transition-colors">Overview</a>
        <a href="#news-engine" class="hover:text-white transition-colors">News to Ideas</a>
        <a href="#workflow" class="hover:text-white transition-colors">Features</a>
        <a href="#pricing" class="hover:text-white transition-colors">Pricing</a>
      </nav>

      <!-- Right Actions -->
      <div class="flex items-center gap-3">
        <button
          onclick={() => appState.openAuth('login')}
          class="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          Sign In
        </button>
        <button
          onclick={() => appState.openAuth('signup')}
          class="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
        >
          <span>Get Started</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </header>

  <!-- HERO SECTION -->
  <section id="overview" class="relative pt-20 pb-24 border-b border-purple-900/30 overflow-hidden">
    <div class="absolute left-1/2 top-0 -translate-x-1/2 w-[1100px] h-96 bg-purple-900/10 blur-[120px] pointer-events-none animate-float-slow"></div>

    <div use:reveal={{ delay: 50 }} class="max-w-7xl mx-auto px-6 relative z-10 space-y-8">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/50 border border-purple-800/40">
        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
        <span class="text-xs font-medium text-amber-300">
          Workspace for content creators
        </span>
      </div>

      <div class="space-y-4 max-w-4xl">
        <h1 class="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.05]">
          Turn daily news and raw ideas into <span class="text-amber-400">ready-to-film</span> scripts.
        </h1>
        <p class="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed pt-1">
          Kre8 brings your niche news feed, idea bank, AI script writer, scene breakdown, and publishing calendar together in one calm workspace.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
        <button
          onclick={() => appState.openAuth('signup')}
          class="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-sm transition-all shadow-lg shadow-amber-400/10 flex items-center justify-center gap-2.5"
        >
          <span>Create Free Account</span>
          <ArrowRight class="w-4 h-4" />
        </button>

        <a
          href="#news-engine"
          class="px-6 py-3.5 rounded-xl bg-[#12071d] hover:bg-[#1b0b2b] text-slate-200 border border-purple-700/40 text-sm font-medium transition-colors text-center"
        >
          See how it works
        </a>
      </div>

      <!-- Highlights Bar -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-purple-900/30">
        <div class="p-4 rounded-xl border border-purple-900/40 bg-purple-950/15">
          <span class="text-xs text-slate-400 block mb-1">Production pipeline</span>
          <span class="text-xl font-bold text-white">10 Stages</span>
          <span class="text-xs text-slate-400 block mt-0.5">From rough idea to published</span>
        </div>

        <div class="p-4 rounded-xl border border-purple-900/40 bg-purple-950/15">
          <span class="text-xs text-slate-400 block mb-1">Trend discovery</span>
          <span class="text-xl font-bold text-white">Daily News Feed</span>
          <span class="text-xs text-purple-300 block mt-0.5">Filtered to your topics</span>
        </div>

        <div class="p-4 rounded-xl border border-purple-900/40 bg-purple-950/15">
          <span class="text-xs text-slate-400 block mb-1">Bring your own key</span>
          <span class="text-xl font-bold text-white">6 AI Providers</span>
          <span class="text-xs text-amber-300 block mt-0.5">Gemini, OpenAI, Claude & more</span>
        </div>

        <div class="p-4 rounded-xl border border-purple-900/40 bg-purple-950/15">
          <span class="text-xs text-slate-400 block mb-1">Planning</span>
          <span class="text-xl font-bold text-white">Goals & Calendar</span>
          <span class="text-xs text-slate-400 block mt-0.5">Schedule shoots & releases</span>
        </div>
      </div>
    </div>
  </section>

  <!-- INTERACTIVE NICHE NEWS & AI DEMO SANDBOX -->
  <section id="news-engine" class="py-24 border-b border-purple-900/30 bg-[#0d0515]/60">
    <div use:reveal={{ delay: 80 }} class="max-w-7xl mx-auto px-6 space-y-10">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="space-y-2">
          <span class="text-xs font-medium text-amber-400">
            Real-time topic discovery
          </span>
          <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Turn today's headlines into video angles
          </h2>
          <p class="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Pick your niche and topics. Kre8 pulls fresh stories every day and uses your connected AI model to suggest hooks and talking points.
          </p>
        </div>

        <button
          onclick={() => appState.enterWorkspace('discover')}
          class="px-5 py-2.5 rounded-lg bg-amber-400 text-black text-xs font-semibold shrink-0 hover:bg-amber-300 transition-colors"
        >
          Try in Studio →
        </button>
      </div>

      <!-- Interactive Niche Switcher Pills -->
      <div class="flex gap-2 overflow-x-auto pb-2 border-b border-purple-900/30">
        {#each Object.keys(demoNichesData) as nicheKey}
          <button
            onclick={() => (selectedDemoNiche = nicheKey)}
            class="px-4 py-2 rounded-lg text-xs font-medium transition-all {selectedDemoNiche === nicheKey
              ? 'bg-amber-400 text-black font-semibold'
              : 'bg-purple-950/40 text-slate-300 hover:text-white border border-purple-900/50'}"
          >
            {nicheKey}
          </button>
        {/each}
      </div>

      <!-- Live Pipeline Demo Card -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 swiss-card p-8 border border-purple-800/40 bg-[#11071c]">
        <div class="lg:col-span-5 space-y-3 border-b lg:border-b-0 lg:border-r border-purple-900/40 pb-6 lg:pb-0 lg:pr-8">
          <div class="flex items-center gap-2">
            <Radio class="w-4 h-4 text-purple-400" />
            <span class="text-xs font-medium text-purple-300">Trending Story</span>
          </div>
          <span class="text-xs text-amber-400/90 block">{activeDemo.source} • Today</span>
          <h3 class="text-xl font-bold text-white leading-snug">
            "{activeDemo.headline}"
          </h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Matched automatically from your saved niche and topic keywords.
          </p>
        </div>

        <div class="lg:col-span-7 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-amber-400" />
              <span class="text-xs font-medium text-amber-400">Suggested Video Angle</span>
            </div>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-purple-900/40 text-purple-200 border border-purple-700/40">
              Short Video
            </span>
          </div>

          <div class="space-y-3">
            <h4 class="text-lg font-semibold text-white">
              {activeDemo.angle}
            </h4>

            <div class="p-4 rounded-xl bg-black/50 border border-purple-900/50 space-y-1">
              <span class="text-xs text-slate-400 block">Opening hook</span>
              <p class="text-sm text-amber-300">
                "{activeDemo.hook}"
              </p>
            </div>
          </div>

          <div class="pt-2 flex items-center justify-between">
            <span class="text-xs text-slate-400">Ready to write?</span>
            <button
              onclick={() => appState.enterWorkspace('ideas')}
              class="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold transition-colors"
            >
              Save to Ideas Bank →
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CORE FEATURES -->
  <section id="workflow" class="py-24 border-b border-purple-900/30">
    <div use:reveal={{ delay: 60 }} class="max-w-7xl mx-auto px-6 space-y-12">
      <div class="space-y-2">
        <span class="text-xs font-medium text-amber-400">
          Features
        </span>
        <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Everything you need to plan, write, and publish
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="swiss-card swiss-card-hover p-6 border border-purple-900/40 bg-[#10071c] space-y-4 flex flex-col justify-between">
          <div class="space-y-2.5">
            <span class="text-xs font-medium text-amber-400">Discover</span>
            <h3 class="text-lg font-bold text-white">Daily News & Watchlist</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Follow breaking stories in your niche and keep track of creators who inspire your channel.
            </p>
          </div>
          <button
            onclick={() => appState.enterWorkspace('discover')}
            class="text-xs font-medium text-purple-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <span>Open Discover</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="swiss-card swiss-card-hover p-6 border border-purple-900/40 bg-[#10071c] space-y-4 flex flex-col justify-between">
          <div class="space-y-2.5">
            <span class="text-xs font-medium text-amber-400">Write</span>
            <h3 class="text-lg font-bold text-white">Script Studio</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Draft scripts, chat with your AI assistant to revise dialogue, and break scripts into timed filming scenes.
            </p>
          </div>
          <button
            onclick={() => appState.enterWorkspace('scripts')}
            class="text-xs font-medium text-purple-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <span>Open Script Studio</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="swiss-card swiss-card-hover p-6 border border-purple-900/40 bg-[#10071c] space-y-4 flex flex-col justify-between">
          <div class="space-y-2.5">
            <span class="text-xs font-medium text-amber-400">Organize</span>
            <h3 class="text-lg font-bold text-white">Content Board</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Track every video from initial idea through scripting, filming, editing, and publishing.
            </p>
          </div>
          <button
            onclick={() => appState.enterWorkspace('content')}
            class="text-xs font-medium text-purple-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <span>Open Content Board</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="swiss-card swiss-card-hover p-6 border border-purple-900/40 bg-[#10071c] space-y-4 flex flex-col justify-between">
          <div class="space-y-2.5">
            <span class="text-xs font-medium text-amber-400">Grow</span>
            <h3 class="text-lg font-bold text-white">Analytics & Goals</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Monitor your channel stats across platforms and get actionable feedback on your publishing cadence.
            </p>
          </div>
          <button
            onclick={() => appState.enterWorkspace('analytics')}
            class="text-xs font-medium text-purple-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <span>Open Analytics</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- PRICING -->
  <section id="pricing" class="py-24 border-b border-purple-900/30 bg-[#0b0413]">
    <div use:reveal={{ delay: 80 }} class="max-w-7xl mx-auto px-6 space-y-12">
      <div class="space-y-2">
        <span class="text-xs font-medium text-amber-400">
          Simple pricing
        </span>
        <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Built for solo creators and small teams
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="swiss-card p-8 border border-purple-900/40 bg-[#10071c] space-y-6">
          <div class="space-y-1">
            <span class="text-xs font-medium text-slate-400">Starter</span>
            <h3 class="text-2xl font-bold text-white">Creator Free</h3>
            <div class="text-3xl font-bold text-amber-400 pt-2">\$0 <span class="text-xs text-slate-400 font-normal">/ forever</span></div>
          </div>
          <ul class="space-y-2.5 text-xs text-slate-300">
            <li class="flex items-center gap-2">✓ Unlimited Ideas Bank</li>
            <li class="flex items-center gap-2">✓ Full Content Board & Calendar</li>
            <li class="flex items-center gap-2">✓ Bring Your Own API Key (BYOK)</li>
            <li class="flex items-center gap-2">✓ Local SQLite storage</li>
          </ul>
          <button
            onclick={() => appState.openAuth('signup')}
            class="w-full py-3 rounded-lg bg-purple-950/60 hover:bg-purple-900/50 text-purple-200 border border-purple-700/50 text-xs font-semibold transition-colors"
          >
            Start for Free
          </button>
        </div>

        <div class="swiss-card p-8 border-2 border-amber-400 bg-[#140824] space-y-6 relative shadow-2xl">
          <div class="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-amber-400 text-black text-[11px] font-semibold">
            Popular
          </div>
          <div class="space-y-1">
            <span class="text-xs font-medium text-amber-400">Pro</span>
            <h3 class="text-2xl font-bold text-white">Pro Studio</h3>
            <div class="text-3xl font-bold text-amber-400 pt-2">\$19 <span class="text-xs text-slate-400 font-normal">/ month</span></div>
          </div>
          <ul class="space-y-2.5 text-xs text-slate-200">
            <li class="flex items-center gap-2 text-amber-300">★ Daily Niche News & Idea Synthesis</li>
            <li class="flex items-center gap-2 text-amber-300">★ Interactive AI Script Studio & Versioning</li>
            <li class="flex items-center gap-2">✓ Multi-Platform Channel Analytics</li>
            <li class="flex items-center gap-2">✓ AI Performance Reviews</li>
          </ul>
          <button
            onclick={() => appState.openAuth('signup')}
            class="w-full py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-colors"
          >
            Get Started
          </button>
        </div>

        <div class="swiss-card p-8 border border-purple-900/40 bg-[#10071c] space-y-6">
          <div class="space-y-1">
            <span class="text-xs font-medium text-slate-400">Teams</span>
            <h3 class="text-2xl font-bold text-white">Studio Team</h3>
            <div class="text-3xl font-bold text-amber-400 pt-2">\$49 <span class="text-xs text-slate-400 font-normal">/ month</span></div>
          </div>
          <ul class="space-y-2.5 text-xs text-slate-300">
            <li class="flex items-center gap-2">✓ Multiple channel workspaces</li>
            <li class="flex items-center gap-2">✓ Shared script & scene libraries</li>
            <li class="flex items-center gap-2">✓ Teleprompter export</li>
            <li class="flex items-center gap-2">✓ Priority support</li>
          </ul>
          <button
            onclick={() => appState.openAuth('signup')}
            class="w-full py-3 rounded-lg bg-purple-950/60 hover:bg-purple-900/50 text-purple-200 border border-purple-700/50 text-xs font-semibold transition-colors"
          >
            Contact Us
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="py-12 border-t border-purple-900/30 bg-[#050208] text-xs text-slate-500">
    <div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-white">Kre8</span>
        <span>•</span>
        <span>Creator Workspace</span>
      </div>

      <div class="flex items-center gap-6 text-slate-400">
        <button onclick={() => appState.enterWorkspace('dashboard')} class="hover:text-white transition-colors">
          Open Studio
        </button>
        <button onclick={() => appState.openAuth('login')} class="hover:text-white transition-colors">
          Sign In
        </button>
        <button onclick={() => appState.enterWorkspace('settings')} class="hover:text-white transition-colors">
          Settings
        </button>
      </div>
    </div>
  </footer>
</div>
