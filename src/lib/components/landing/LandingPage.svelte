<script lang="ts">
  import { appState } from "../../stores/appState.svelte";
  import Kre8Logo from "../ui/Kre8Logo.svelte";
  import AnimatedKre8Logo from "../ui/AnimatedKre8Logo.svelte";
  import {
    Sparkles,
    Radio,
    ArrowRight,
    Video,
    Users,
    BarChart3,
    Calendar,
    Layers,
    Key,
    Check,
    Zap,
    Play,
    FileCode,
    Lightbulb,
    Clock,
    Compass,
    ShieldCheck,
  } from "lucide-svelte";
  import { reveal } from "../../utils/reveal";

  type VoiceId = "explainer" | "high_energy" | "storytelling";

  interface DemoItem {
    headline: string;
    source: string;
    category: string;
    voices: Record<
      VoiceId,
      {
        voiceName: string;
        styleNote: string;
        angle: string;
        hook: string;
        scene1Visual: string;
        scene1Audio: string;
        format: string;
        duration: string;
      }
    >;
  }

  let selectedNiche = $state("AI & Technology");
  let selectedVoice = $state<VoiceId>("explainer");

  const niches = [
    "AI & Technology",
    "Creators & Media",
    "Finance & Business",
    "Health & Fitness",
  ];

  const voiceOptions: { id: VoiceId; label: string; desc: string }[] = [
    {
      id: "explainer",
      label: "Calm Explainer",
      desc: "Clear, structured breakdown",
    },
    { id: "high_energy", label: "High Energy", desc: "Fast-paced, bold hook" },
    {
      id: "storytelling",
      label: "Narrative Story",
      desc: "Curiosity gap & tension",
    },
  ];

  const demoData: Record<string, DemoItem> = {
    "AI & Technology": {
      headline:
        "Autonomous Coding Agents Begin Merging Direct Code in Enterprise Repositories",
      source: "Global Tech Insider",
      category: "Software Architecture",
      voices: {
        explainer: {
          voiceName: "Clear Tech Breakdown",
          styleNote: "Calm pacing with diagrams and step-by-step logic",
          angle:
            "Why Software Engineering Is Shifting from Writing Code to Guiding Agents",
          hook: "Most engineers are using AI like a glorified search engine. Here is the actual three-layer architecture teams use in production.",
          scene1Visual:
            "Screen recording showing an agent terminal, panning to a clean architecture diagram.",
          scene1Audio: "Calm, measured tone. Ambient low synth backdrop.",
          format: "YouTube Long-Form",
          duration: "8 min",
        },
        high_energy: {
          voiceName: "Punchy Fast-Paced",
          styleNote:
            "Rapid jump cuts, loud direct questions, punch sound effects",
          angle: "The 3-Minute Warning: Will AI Replace Junior Devs This Year?",
          hook: "If you are still writing 200 lines of boilerplate by hand every morning, stop right now.",
          scene1Visual:
            'Punch-in to camera, code error buzzer sound, fast text overlay: "10X FASTER".',
          scene1Audio: "Energetic delivery, snappy riser transitions.",
          format: "Shorts & TikTok",
          duration: "50 sec",
        },
        storytelling: {
          voiceName: "Curiosity & Mystery",
          styleNote: "Cinematic storytelling with an opening conflict",
          angle:
            "The Quiet Experiment That Changed How We Build Software Forever",
          hook: "At 2 AM on a Tuesday, an AI opened a pull request that no human on the team knew how to review.",
          scene1Visual:
            "Dimly lit studio desk, slow push-in toward the screen showing git log.",
          scene1Audio:
            "Subtle cinematic rumble, deliberate conversational whisper.",
          format: "Documentary Essay",
          duration: "11 min",
        },
      },
    },
    "Creators & Media": {
      headline:
        "Short-Form Platforms Adjust Algorithms to Prioritize Full-Watch Retention over Swipes",
      source: "Creator Daily",
      category: "Audience Strategy",
      voices: {
        explainer: {
          voiceName: "Analytical Creator",
          styleNote:
            "Framework-focused, transparent data, actionable checklist",
          angle:
            "The New Retention Curve: How to Keep 60% of Viewers Past Second Five",
          hook: "The biggest mistake creators make with short videos is saving the answer for the end. Here is what the retention charts actually show.",
          scene1Visual:
            "Side-by-side comparison of two retention graphs with drop-off markers.",
          scene1Audio: "Even-toned explanation, subtle keyboard typing sound.",
          format: "Explainer Reel",
          duration: "65 sec",
        },
        high_energy: {
          voiceName: "Viral Hook Specialist",
          styleNote: "Direct eye contact, rapid visual changes every 2 seconds",
          angle: "Why Your Views Collapsed Last Week (And The One Fix)",
          hook: "Your first three seconds are costing you 80% of your audience. Here is the hook formula you need today.",
          scene1Visual:
            "Snap zoom on face holding phone displaying zero views, switching to viral chart.",
          scene1Audio: "Fast tempo, record scratch sound effect.",
          format: "TikTok / Reel",
          duration: "45 sec",
        },
        storytelling: {
          voiceName: "Industry Insider",
          styleNote: "Deep-dive investigative breakdown",
          angle: "How One Algorithm Tweak Shifted $100M in Creator Revenue",
          hook: "Last month, three of the world’s largest creator agencies noticed something strange happening across 5,000 accounts.",
          scene1Visual:
            "Moody studio lighting, timeline animation of algorithm updates.",
          scene1Audio: "Deep narrative voiceover with soft piano motif.",
          format: "Video Essay",
          duration: "9 min",
        },
      },
    },
    "Finance & Business": {
      headline:
        "Solopreneur Revenue Crosses Historic Highs via Lean Distribution Channels",
      source: "Financial Times",
      category: "Digital Economy",
      voices: {
        explainer: {
          voiceName: "Structured Wealth Builder",
          styleNote: "Spreadsheets, unit economics, transparent numbers",
          angle:
            "How Single-Person Companies Are Reaching Seven Figures Without Employees",
          hook: "You do not need a 10-person agency to build a sustainable digital business. Here is the operational stack doing it today.",
          scene1Visual:
            "Clean breakdown of a 3-part revenue stack on an iPad whiteboard.",
          scene1Audio: "Clear, grounded delivery. Warm acoustic audio accent.",
          format: "Business Breakdown",
          duration: "12 min",
        },
        high_energy: {
          voiceName: "Aggressive Growth",
          styleNote: "Fast numbers, intense pacing, immediate takeaway",
          angle: "Stop Trading Hours For Dollars: The Solo Cash Flow Playbook",
          hook: "Most people spend 40 hours a week building someone else’s equity. Look at what happens when you build your own.",
          scene1Visual:
            "Fast cut between calendar blocks and automated income dashboard.",
          scene1Audio: "Punchy synth bass hit, fast articulation.",
          format: "Short-Form Reel",
          duration: "55 sec",
        },
        storytelling: {
          voiceName: "Case Study Storyteller",
          styleNote: "Personal journey with high emotional payoff",
          angle: "The 3-Year Quiet Bet That Replaced a Corporate Career",
          hook: "He had $4,000 left in savings and zero followers. Three years later, his weekly newsletter prints six figures a year.",
          scene1Visual:
            "Slow pan across empty workspace moving into modern home studio.",
          scene1Audio: "Reflective narrative pacing, inspiring build.",
          format: "Founder Story",
          duration: "14 min",
        },
      },
    },
    "Health & Fitness": {
      headline:
        "Peer-Reviewed Clinical Trials Compare Zone 2 Steady Cardio Against High-Intensity Intervals",
      source: "Sports Science Journal",
      category: "Exercise Physiology",
      voices: {
        explainer: {
          voiceName: "Science Communicator",
          styleNote: "Evidence-based, citing research papers without dogmatism",
          angle:
            "Zone 2 vs. HIIT: What the Newest Longevity Data Actually Proves",
          hook: "You do not have to crush yourself with exhausting workouts six days a week to build cardiovascular longevity.",
          scene1Visual:
            "Heart rate zone chart animation with lactate threshold curves.",
          scene1Audio:
            "Reassuring, informative narration with light ambient tone.",
          format: "Science Deep-Dive",
          duration: "10 min",
        },
        high_energy: {
          voiceName: "High-Impact Trainer",
          styleNote: "Gym floor background, high pace, actionable challenge",
          angle: "The 20-Minute Cardio Routine You Are Doing Completely Wrong",
          hook: "If you are burning out on the treadmill and seeing zero progress, you are training the wrong metabolic pathway.",
          scene1Visual:
            "Treadmill digital monitor flash, immediate cut to trainer demonstrating pace.",
          scene1Audio: "Upbeat electronic beat, confident vocal presence.",
          format: "Shorts / TikTok",
          duration: "45 sec",
        },
        storytelling: {
          voiceName: "Personal Transformation",
          styleNote: "Relatable human perspective with practical science",
          angle:
            "I Ran in Zone 2 for 90 Days. Here Is What Happened to My Resting Heart Rate",
          hook: "For three months, I forced myself to run so slowly that anyone on the street could walk past me.",
          scene1Visual:
            "Morning running footage in mist, smart watch display showing 135 BPM.",
          scene1Audio: "Cinematic strings, warm personal storytelling tone.",
          format: "Personal Experiment",
          duration: "7 min",
        },
      },
    },
  };

  let activeItem = $derived(demoData[selectedNiche]);
  let activeVoiceData = $derived(activeItem.voices[selectedVoice]);
</script>

<div
  class="min-h-screen bg-[#08040d] text-slate-100 swiss-grid selection:bg-amber-400 selection:text-black"
>
  <!-- TOP NAVIGATION -->
  <header
    class="sticky top-0 z-40 border-b border-purple-900/30 bg-[#08040d]/85 backdrop-blur-md"
  >
    <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <!-- Logo -->
      <Kre8Logo size="md" variant="full" />

      <!-- Center Links -->
      <nav
        class="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400"
      >
        <a href="#overview" class="hover:text-white transition-colors"
          >Overview</a
        >
        <a href="#interactive-demo" class="hover:text-white transition-colors"
          >How It Works</a
        >
        <a href="#creator-voices" class="hover:text-white transition-colors"
          >Creator Voices</a
        >
        <a href="#script-studio" class="hover:text-white transition-colors"
          >Script Studio</a
        >
        <a href="#analytics-board" class="hover:text-white transition-colors"
          >Telemetry & Board</a
        >
      </nav>

      <!-- Right Actions -->
      <div class="flex items-center gap-3">
        {#if appState.isAuthenticated}
          <button
            onclick={() => appState.enterWorkspace()}
            class="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Enter Studio</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        {:else}
          <button
            onclick={() => appState.openAuth("login")}
            class="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button
            onclick={() => appState.openAuth("signup")}
            class="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Get Started Free</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        {/if}
      </div>
    </div>
  </header>

  <!-- HERO SECTION -->
  <section
    id="overview"
    class="relative pt-20 pb-20 border-b border-purple-900/30 overflow-hidden"
  >
    <div
      class="absolute left-1/2 top-0 -translate-x-1/2 w-[1100px] h-96 bg-purple-900/10 blur-[120px] pointer-events-none animate-float-slow"
    ></div>

    <div
      use:reveal={{ delay: 50 }}
      class="max-w-7xl mx-auto px-6 relative z-10 space-y-8"
    >
      <div
        class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/50 border border-purple-800/40"
      >
        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
        <span class="text-xs font-medium text-amber-300">
          The connected operating system for video creators
        </span>
      </div>

      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-12">
        <div class="space-y-4 max-w-3xl">
          <h1
            class="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.05]"
          >
            Turn breaking news and raw ideas into <span class="text-amber-400"
              >ready-to-film</span
            > scripts.
          </h1>
          <p
            class="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed pt-1"
          >
            Kre8 connects your daily niche news feed, creator voice modeling, AI
            scriptwriting studio, timed scene shot lists, and channel telemetry
            into one calm, unified workspace.
          </p>
        </div>

        <!-- Animated Kre8 Vector Mark (hand-drawn calligraphy animation, no container box) -->
        <div class="shrink-0 flex items-center justify-center self-center lg:self-auto py-2">
          <AnimatedKre8Logo size={210} class="scale-90 sm:scale-100" />
        </div>
      </div>

      <div
        class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2"
      >
        {#if appState.isAuthenticated}
          <button
            onclick={() => appState.enterWorkspace()}
            class="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-sm transition-all shadow-lg shadow-amber-400/10 flex items-center justify-center gap-2.5"
          >
            <span>Go to Studio</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        {:else}
          <button
            onclick={() => appState.openAuth("signup")}
            class="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-sm transition-all shadow-lg shadow-amber-400/10 flex items-center justify-center gap-2.5"
          >
            <span>Create Free Account</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        {/if}

        <a
          href="#interactive-demo"
          class="px-6 py-3.5 rounded-xl bg-[#12071d] hover:bg-[#1b0b2b] text-slate-200 border border-purple-700/40 text-sm font-medium transition-colors text-center"
        >
          See how it works
        </a>

        <button
          onclick={() => appState.enterWorkspace("dashboard")}
          class="px-5 py-3.5 text-xs text-slate-400 hover:text-amber-300 transition-colors"
        >
          Jump into Studio Demo →
        </button>
      </div>

      <!-- Feature Highlight Cards -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-10 border-t border-purple-900/30"
      >
        <div
          class="p-4 rounded-xl border border-purple-900/40 bg-purple-950/15 space-y-1"
        >
          <div class="flex items-center gap-2 text-amber-400 mb-1">
            <Radio class="w-4 h-4" />
            <span class="text-xs font-semibold uppercase tracking-wider"
              >Trend Engine</span
            >
          </div>
          <span class="text-lg font-bold text-white block"
            >Daily News Synthesis</span
          >
          <p class="text-xs text-slate-400 leading-relaxed">
            Curated stories matched to your niche, turned into fresh video
            angles.
          </p>
        </div>

        <div
          class="p-4 rounded-xl border border-purple-900/40 bg-purple-950/15 space-y-1"
        >
          <div class="flex items-center gap-2 text-purple-400 mb-1">
            <Users class="w-4 h-4" />
            <span class="text-xs font-semibold uppercase tracking-wider"
              >Watchlist</span
            >
          </div>
          <span class="text-lg font-bold text-white block"
            >Creator Voice Modeling</span
          >
          <p class="text-xs text-slate-400 leading-relaxed">
            Emulate signature pacing, rhythm, and hook formulas without copying
            content.
          </p>
        </div>

        <div
          class="p-4 rounded-xl border border-purple-900/40 bg-purple-950/15 space-y-1"
        >
          <div class="flex items-center gap-2 text-amber-400 mb-1">
            <Video class="w-4 h-4" />
            <span class="text-xs font-semibold uppercase tracking-wider"
              >Production</span
            >
          </div>
          <span class="text-lg font-bold text-white block"
            >Script Studio & Scenes</span
          >
          <p class="text-xs text-slate-400 leading-relaxed">
            AI co-writer, timed clip breakdowns, camera cues, and built-in
            teleprompter.
          </p>
        </div>

        <div
          class="p-4 rounded-xl border border-purple-900/40 bg-purple-950/15 space-y-1"
        >
          <div class="flex items-center gap-2 text-emerald-400 mb-1">
            <BarChart3 class="w-4 h-4" />
            <span class="text-xs font-semibold uppercase tracking-wider"
              >Intelligence</span
            >
          </div>
          <span class="text-lg font-bold text-white block"
            >Telemetry & AI Audits</span
          >
          <p class="text-xs text-slate-400 leading-relaxed">
            Multi-platform analytics and deep retention audits to refine your
            hooks.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- INTERACTIVE DEMO: NEWS TO CREATOR VOICE TO SCRIPT -->
  <section
    id="interactive-demo"
    class="py-20 border-b border-purple-900/30 bg-[#0d0515]/70"
  >
    <div use:reveal={{ delay: 80 }} class="max-w-7xl mx-auto px-6 space-y-10">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="space-y-2">
          <span class="text-xs font-medium text-amber-400">
            Interactive Workflow Demonstration
          </span>
          <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            From raw headline to creator script in seconds
          </h2>
          <p class="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Select a topic niche and adapt it with a creator's delivery style.
            Watch how Kre8 crafts the angle, hook, and filming scene breakdown.
          </p>
        </div>

        <button
          onclick={() => appState.enterWorkspace("discover")}
          class="px-5 py-2.5 rounded-lg bg-amber-400 text-black text-xs font-semibold shrink-0 hover:bg-amber-300 transition-colors flex items-center gap-1.5"
        >
          <span>Open Discover Studio</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Controls: Niche and Voice Selectors -->
      <div class="space-y-4">
        <!-- Niche Selector -->
        <div>
          <span
            class="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2"
            >1. Select Niche:</span
          >
          <div class="flex gap-2 overflow-x-auto pb-1">
            {#each niches as niche}
              <button
                onclick={() => (selectedNiche = niche)}
                class="px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap {selectedNiche ===
                niche
                  ? 'bg-amber-400 text-black font-semibold shadow-sm'
                  : 'bg-purple-950/40 text-slate-300 hover:text-white border border-purple-900/50'}"
              >
                {niche}
              </button>
            {/each}
          </div>
        </div>

        <!-- Voice Selector -->
        <div>
          <span
            class="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2"
            >2. Adapt With Creator Voice:</span
          >
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {#each voiceOptions as opt}
              <button
                onclick={() => (selectedVoice = opt.id)}
                class="p-3 text-left rounded-lg transition-all border {selectedVoice ===
                opt.id
                  ? 'bg-purple-900/40 border-amber-400 text-white shadow-md'
                  : 'bg-black/40 border-purple-900/50 text-slate-300 hover:border-purple-700'}"
              >
                <div class="flex items-center justify-between mb-1">
                  <span
                    class="text-xs font-semibold {selectedVoice === opt.id
                      ? 'text-amber-400'
                      : 'text-slate-200'}"
                  >
                    {opt.label}
                  </span>
                  {#if selectedVoice === opt.id}
                    <Check class="w-3.5 h-3.5 text-amber-400" />
                  {/if}
                </div>
                <span class="text-[11px] text-slate-400 block leading-tight"
                  >{opt.desc}</span
                >
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Interactive Output Display -->
      <div
        class="grid grid-cols-1 lg:grid-cols-12 gap-8 swiss-card p-6 sm:p-8 border border-purple-800/40 bg-[#11071c]"
      >
        <!-- Left: News Trigger & Style Context -->
        <div
          class="lg:col-span-5 space-y-5 border-b lg:border-b-0 lg:border-r border-purple-900/40 pb-6 lg:pb-0 lg:pr-8"
        >
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <Radio class="w-4 h-4 text-purple-400" />
              <span
                class="text-xs font-semibold text-purple-300 uppercase tracking-wide"
                >News Feed Trigger</span
              >
            </div>
            <span class="text-xs text-amber-400/90 font-mono block">
              {activeItem.source} • {activeItem.category}
            </span>
            <h3 class="text-lg sm:text-xl font-bold text-white leading-snug">
              "{activeItem.headline}"
            </h3>
          </div>

          <div
            class="p-3.5 rounded-lg bg-black/60 border border-purple-900/50 space-y-1.5"
          >
            <div class="flex items-center gap-1.5 text-purple-300">
              <Users class="w-3.5 h-3.5 text-amber-400" />
              <span class="text-xs font-semibold"
                >Active Voice Profile: {activeVoiceData.voiceName}</span
              >
            </div>
            <p class="text-xs text-slate-400 leading-relaxed">
              {activeVoiceData.styleNote}
            </p>
          </div>

          <div class="flex items-center gap-4 text-xs text-slate-400 pt-1">
            <div class="flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-amber-400" />
              <span>Est. {activeVoiceData.duration}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <FileCode class="w-3.5 h-3.5 text-purple-400" />
              <span>{activeVoiceData.format}</span>
            </div>
          </div>
        </div>

        <!-- Right: Synthesized Video Angle & Script Breakdown -->
        <div class="lg:col-span-7 space-y-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-amber-400" />
              <span
                class="text-xs font-semibold text-amber-400 uppercase tracking-wide"
                >Synthesized Video Angle</span
              >
            </div>
            <span
              class="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30"
            >
              Ready to Film
            </span>
          </div>

          <div class="space-y-3">
            <h4 class="text-lg font-bold text-white leading-snug">
              {activeVoiceData.angle}
            </h4>

            <!-- Opening Hook -->
            <div
              class="p-4 rounded-xl bg-black/60 border border-purple-900/60 space-y-1.5"
            >
              <div
                class="flex items-center justify-between text-xs text-slate-400"
              >
                <span
                  class="font-mono text-[11px] text-amber-400 font-semibold uppercase tracking-wider"
                  >Opening Hook (First 3s)</span
                >
                <span>Immediate retention trigger</span>
              </div>
              <p class="text-sm font-medium text-amber-200 leading-relaxed">
                "{activeVoiceData.hook}"
              </p>
            </div>

            <!-- Scene 1 Shot Cue Preview -->
            <div
              class="p-4 rounded-xl bg-purple-950/20 border border-purple-900/40 space-y-2"
            >
              <div
                class="flex items-center justify-between text-xs text-slate-400"
              >
                <span
                  class="font-mono text-[11px] text-purple-300 font-semibold uppercase tracking-wider"
                  >Scene 1 • Camera & Audio Cue</span
                >
                <span class="text-[11px] text-slate-400">0:00 - 0:08</span>
              </div>
              <div class="space-y-1 text-xs">
                <p class="text-slate-300">
                  <strong class="text-purple-300 font-normal">Visual:</strong>
                  {activeVoiceData.scene1Visual}
                </p>
                <p class="text-slate-400">
                  <strong class="text-amber-300 font-normal">Audio:</strong>
                  {activeVoiceData.scene1Audio}
                </p>
              </div>
            </div>
          </div>

          <div
            class="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-purple-900/40"
          >
            <span class="text-xs text-slate-400"
              >Launch directly into your studio workspace</span
            >
            <div class="flex items-center gap-2">
              <button
                onclick={() => appState.enterWorkspace("ideas")}
                class="px-4 py-2 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-700/50 text-xs font-semibold transition-colors"
              >
                Save to Ideas Bank
              </button>
              <button
                onclick={() => appState.enterWorkspace("scripts")}
                class="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-colors"
              >
                Open in Script Studio →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- FEATURE SECTION 1: DISCOVERY & CREATOR WATCHLIST -->
  <section id="creator-voices" class="py-20 border-b border-purple-900/30">
    <div use:reveal={{ delay: 60 }} class="max-w-7xl mx-auto px-6 space-y-12">
      <div class="space-y-2 max-w-3xl">
        <span class="text-xs font-medium text-amber-400">
          Trend Discovery & Voice Modeling
        </span>
        <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Never start from a blank page again
        </h2>
        <p class="text-sm sm:text-base text-slate-300 leading-relaxed">
          Follow stories that matter to your audience and study what makes top
          creators succeed—then adopt their signature delivery style for your
          own original ideas.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Feature 1 Card -->
        <div
          class="swiss-card p-8 border border-purple-900/40 bg-[#10071c] space-y-6 flex flex-col justify-between"
        >
          <div class="space-y-4">
            <div
              class="w-10 h-10 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-amber-400"
            >
              <Radio class="w-5 h-5" />
            </div>
            <div class="space-y-2">
              <h3 class="text-xl font-bold text-white">
                Real-Time Niche News Feed
              </h3>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Connect your specific topics and receive a daily stream of
                breaking articles. With one click, synthesize any headline into
                an original angle with tailored opening hooks.
              </p>
            </div>

            <ul
              class="space-y-2 text-xs text-slate-400 pt-2 border-t border-purple-900/40"
            >
              <li class="flex items-center gap-2">
                <Check class="w-3.5 h-3.5 text-amber-400" />
                <span
                  >Multi-topic filtering customized to your channel niche</span
                >
              </li>
              <li class="flex items-center gap-2">
                <Check class="w-3.5 h-3.5 text-amber-400" />
                <span
                  >One-click AI idea generation with custom angles and hooks</span
                >
              </li>
              <li class="flex items-center gap-2">
                <Check class="w-3.5 h-3.5 text-amber-400" />
                <span>Direct export to your Ideas Bank and Content Board</span>
              </li>
            </ul>
          </div>

          <button
            onclick={() => appState.enterWorkspace("discover")}
            class="pt-4 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5"
          >
            <span>Explore News Feed</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Feature 2 Card -->
        <div
          class="swiss-card p-8 border border-purple-900/40 bg-[#10071c] space-y-6 flex flex-col justify-between"
        >
          <div class="space-y-4">
            <div
              class="w-10 h-10 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400"
            >
              <Users class="w-5 h-5" />
            </div>
            <div class="space-y-2">
              <h3 class="text-xl font-bold text-white">
                Creator Watchlist & Voice Modeling
              </h3>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Save creators from YouTube, TikTok, Instagram, X, or LinkedIn.
                Break down their signature pacing, rhythm, and storytelling
                formulas, then select their style to draft scripts.
              </p>
            </div>

            <ul
              class="space-y-2 text-xs text-slate-400 pt-2 border-t border-purple-900/40"
            >
              <li class="flex items-center gap-2">
                <Check class="w-3.5 h-3.5 text-purple-400" />
                <span
                  >Analyze hook formulas and narrative structures across
                  channels</span
                >
              </li>
              <li class="flex items-center gap-2">
                <Check class="w-3.5 h-3.5 text-purple-400" />
                <span
                  >Voice selector in Script Studio adapts delivery style
                  seamlessly</span
                >
              </li>
              <li class="flex items-center gap-2">
                <Check class="w-3.5 h-3.5 text-purple-400" />
                <span
                  >Keeps your content 100% original while elevating execution</span
                >
              </li>
            </ul>
          </div>

          <button
            onclick={() => appState.enterWorkspace("discover")}
            class="pt-4 text-xs font-semibold text-purple-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <span>Explore Watchlist</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- FEATURE SECTION 2: SCRIPT STUDIO & SCENE BREAKDOWN -->
  <section
    id="script-studio"
    class="py-20 border-b border-purple-900/30 bg-[#0a0412]"
  >
    <div use:reveal={{ delay: 60 }} class="max-w-7xl mx-auto px-6 space-y-12">
      <div class="space-y-2 max-w-3xl">
        <span class="text-xs font-medium text-amber-400">
          Studio Production Tools
        </span>
        <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Write faster. Record with zero friction.
        </h2>
        <p class="text-sm sm:text-base text-slate-300 leading-relaxed">
          From full dialogue drafts to timed scene breakdowns and full-screen
          teleprompter recording, Script Studio takes you from concept to film
          day without context switching.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Studio Feature 1 -->
        <div
          class="swiss-card p-6 border border-purple-900/40 bg-[#11071d] space-y-4"
        >
          <div
            class="w-9 h-9 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-amber-400"
          >
            <Zap class="w-4 h-4" />
          </div>
          <h3 class="text-lg font-bold text-white">
            AI Scriptwriting & Co-Pilot
          </h3>
          <p class="text-xs text-slate-300 leading-relaxed">
            Generate full video drafts tailored to your chosen voice. Chat with
            the in-editor assistant to punch up dialogue, test alternate hooks,
            or rewrite specific sections.
          </p>
          <div class="text-[11px] text-amber-300/90 font-mono">
            Speaking time & word counter included
          </div>
        </div>

        <!-- Studio Feature 2 -->
        <div
          class="swiss-card p-6 border border-purple-900/40 bg-[#11071d] space-y-4"
        >
          <div
            class="w-9 h-9 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400"
          >
            <Layers class="w-4 h-4" />
          </div>
          <h3 class="text-lg font-bold text-white">
            Automated Scene Breakdown
          </h3>
          <p class="text-xs text-slate-300 leading-relaxed">
            One click transforms your script into a sequential shot list with
            camera angles, visual descriptions, audio notes, and auto-calculated
            total clip duration.
          </p>
          <div class="text-[11px] text-purple-300/90 font-mono">
            Export ready-to-shoot production boards
          </div>
        </div>

        <!-- Studio Feature 3 -->
        <div
          class="swiss-card p-6 border border-purple-900/40 bg-[#11071d] space-y-4"
        >
          <div
            class="w-9 h-9 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-emerald-400"
          >
            <Play class="w-4 h-4" />
          </div>
          <h3 class="text-lg font-bold text-white">
            Distraction-Free Teleprompter
          </h3>
          <p class="text-xs text-slate-300 leading-relaxed">
            Film with confidence. Open your script in a clean, high-contrast
            teleprompter with adjustable auto-scroll speed and responsive font
            sizing on any screen.
          </p>
          <div class="text-[11px] text-emerald-300/90 font-mono">
            Works smoothly on mobile & tablet rigs
          </div>
        </div>
      </div>

      <div class="pt-2 text-center">
        <button
          onclick={() => appState.enterWorkspace("scripts")}
          class="px-6 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-colors inline-flex items-center gap-2"
        >
          <span>Open Script Studio</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </section>

  <!-- FEATURE SECTION 3: WORKFLOW PIPELINE & TELEMETRY AUDITS -->
  <section id="analytics-board" class="py-20 border-b border-purple-900/30">
    <div use:reveal={{ delay: 60 }} class="max-w-7xl mx-auto px-6 space-y-12">
      <div class="space-y-2 max-w-3xl">
        <span class="text-xs font-medium text-amber-400">
          Pipeline & Performance Intelligence
        </span>
        <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Manage the pipeline. Master the numbers.
        </h2>
        <p class="text-sm sm:text-base text-slate-300 leading-relaxed">
          Stay organized from first draft to final upload, then audit your
          channel telemetry to see which hooks and formats resonate with your
          audience.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Production Board Card -->
        <div
          class="swiss-card p-8 border border-purple-900/40 bg-[#10071c] space-y-6"
        >
          <div
            class="w-10 h-10 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-amber-400"
          >
            <Calendar class="w-5 h-5" />
          </div>
          <div class="space-y-2">
            <h3 class="text-xl font-bold text-white">
              10-Stage Content Board & Calendar
            </h3>
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Track videos through a structured Kanban workflow: Idea,
              Scripting, Storyboard, Pre-Production, Filming, Editing, Review,
              Scheduled, Published, and Archived.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-400">
            <div class="p-3 rounded-lg bg-black/40 border border-purple-900/40">
              <span class="text-white font-semibold block mb-0.5"
                >Drag-and-Drop</span
              >
              <span>Smooth pipeline organization across all stages</span>
            </div>
            <div class="p-3 rounded-lg bg-black/40 border border-purple-900/40">
              <span class="text-white font-semibold block mb-0.5"
                >Shoot Calendar</span
              >
              <span>Schedule recording days and release dates</span>
            </div>
          </div>

          <button
            onclick={() => appState.enterWorkspace("content")}
            class="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5"
          >
            <span>Open Content Board</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Analytics & AI Audits Card -->
        <div
          class="swiss-card p-8 border border-purple-900/40 bg-[#10071c] space-y-6"
        >
          <div
            class="w-10 h-10 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-emerald-400"
          >
            <BarChart3 class="w-5 h-5" />
          </div>
          <div class="space-y-2">
            <h3 class="text-xl font-bold text-white">
              Multi-Platform Telemetry & AI Audits
            </h3>
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Unify metrics across YouTube, TikTok, Instagram, X/Twitter, and
              LinkedIn. Run automated AI audits that highlight viral hook
              patterns, retention drop-offs, and publishing consistency.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-400">
            <div class="p-3 rounded-lg bg-black/40 border border-purple-900/40">
              <span class="text-white font-semibold block mb-0.5"
                >Real Retention Data</span
              >
              <span>Engagement rates, views, and reach tracking</span>
            </div>
            <div class="p-3 rounded-lg bg-black/40 border border-purple-900/40">
              <span class="text-white font-semibold block mb-0.5"
                >AI Channel Audits</span
              >
              <span>Actionable recommendations for your next upload</span>
            </div>
          </div>

          <button
            onclick={() => appState.enterWorkspace("analytics")}
            class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5"
          >
            <span>Open Analytics Studio</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- PRIVACY & BRING YOUR OWN KEY (BYOK) -->
  <section class="py-16 border-b border-purple-900/30 bg-[#0d0515]/60">
    <div use:reveal={{ delay: 60 }} class="max-w-7xl mx-auto px-6">
      <div
        class="p-8 sm:p-10 rounded-2xl border border-purple-800/50 bg-[#12071f] flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div class="space-y-3 max-w-2xl">
          <div class="flex items-center gap-2 text-amber-400">
            <ShieldCheck class="w-5 h-5" />
            <span class="text-xs font-semibold uppercase tracking-wider"
              >Zero Subscription Markups</span
            >
          </div>
          <h3 class="text-2xl sm:text-3xl font-bold text-white">
            Bring Your Own API Key (BYOK)
          </h3>
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Use your own keys for Google Gemini, OpenAI, Anthropic Claude, Groq,
            Mistral, or DeepSeek. Pay the provider directly with zero
            intermediary markups. Your scripts, watchlists, and data stay
            strictly in your local database.
          </p>
          <div
            class="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-purple-300"
          >
            <span
              class="px-2.5 py-1 rounded bg-black/50 border border-purple-900/60"
              >Gemini</span
            >
            <span
              class="px-2.5 py-1 rounded bg-black/50 border border-purple-900/60"
              >OpenAI</span
            >
            <span
              class="px-2.5 py-1 rounded bg-black/50 border border-purple-900/60"
              >Claude</span
            >
            <span
              class="px-2.5 py-1 rounded bg-black/50 border border-purple-900/60"
              >Groq</span
            >
            <span
              class="px-2.5 py-1 rounded bg-black/50 border border-purple-900/60"
              >Mistral</span
            >
            <span
              class="px-2.5 py-1 rounded bg-black/50 border border-purple-900/60"
              >DeepSeek</span
            >
          </div>
        </div>

        <button
          onclick={() => appState.enterWorkspace("settings")}
          class="px-5 py-3 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700/60 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2"
        >
          <Key class="w-4 h-4 text-amber-400" />
          <span>Configure API Keys</span>
        </button>
      </div>
    </div>
  </section>

  <!-- CALL TO ACTION BANNER (REPLACES PRICING) -->
  <section
    class="py-24 border-b border-purple-900/30 bg-[#090310] relative overflow-hidden"
  >
    <div
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-purple-900/15 blur-[120px] pointer-events-none"
    ></div>

    <div
      use:reveal={{ delay: 60 }}
      class="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10"
    >
      <div
        class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-xs text-amber-300"
      >
        <Sparkles class="w-3.5 h-3.5 text-amber-400" />
        <span>Ready to streamline your video workflow?</span>
      </div>

      <div class="space-y-3">
        <h2
          class="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight"
        >
          Start drafting better videos today.
        </h2>
        <p
          class="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed"
        >
          From finding breaking trends to scripting in your favorite creator's
          style, Kre8 gives you the complete setup to publish consistently.
        </p>
      </div>

      <div
        class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
      >
        <button
          onclick={() => appState.openAuth("signup")}
          class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-sm transition-all shadow-lg shadow-amber-400/10 flex items-center justify-center gap-2"
        >
          <span>Get Started Free</span>
          <ArrowRight class="w-4 h-4" />
        </button>
        <button
          onclick={() => appState.enterWorkspace("dashboard")}
          class="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#12071d] hover:bg-[#1b0b2b] text-slate-200 border border-purple-700/40 text-sm font-medium transition-colors"
        >
          Explore Studio
        </button>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer
    class="py-12 border-t border-purple-900/30 bg-[#050208] text-xs text-slate-500"
  >
    <div
      class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6"
    >
      <div class="flex items-center gap-2">
        <span class="font-semibold text-white">Kre8</span>
        <span>•</span>
        <span>Creator Workspace & Script Studio</span>
      </div>

      <div
        class="flex flex-wrap items-center justify-center gap-6 text-slate-400"
      >
        <button
          onclick={() => appState.enterWorkspace("discover")}
          class="hover:text-white transition-colors"
        >
          Discover
        </button>
        <button
          onclick={() => appState.enterWorkspace("ideas")}
          class="hover:text-white transition-colors"
        >
          Ideas Bank
        </button>
        <button
          onclick={() => appState.enterWorkspace("scripts")}
          class="hover:text-white transition-colors"
        >
          Script Studio
        </button>
        <button
          onclick={() => appState.enterWorkspace("content")}
          class="hover:text-white transition-colors"
        >
          Content Board
        </button>
        <button
          onclick={() => appState.enterWorkspace("analytics")}
          class="hover:text-white transition-colors"
        >
          Analytics
        </button>
        <button
          onclick={() => appState.enterWorkspace("settings")}
          class="hover:text-white transition-colors"
        >
          Settings
        </button>
        <button
          onclick={() => appState.openAuth("login")}
          class="hover:text-white transition-colors"
        >
          Sign In
        </button>
      </div>
    </div>
  </footer>
</div>
