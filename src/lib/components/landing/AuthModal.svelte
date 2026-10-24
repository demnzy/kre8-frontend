<script lang="ts">
  import { appState } from '../../stores/appState.svelte';
  import { api, authStorage } from '../../api/client';
  import type { OnboardingSuggestions } from '../../types';
  import {
    X,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    Key,
    Check,
    Cpu,
    TrendingUp,
    HeartPulse,
    Video,
    Gamepad2,
    Palette
  } from 'lucide-svelte';

  // Carousel Slide State: 1 to 5
  let currentSlide = $state<1 | 2 | 3 | 4 | 5>(1);
  let isSubmitting = $state(false);
  let errorMessage = $state('');

  // Slide 1: Credentials
  let email = $state('');
  let password = $state('');
  let displayName = $state('');

  // Slide 2: Primary Niche
  let primaryNiche = $state('Technology');
  let customNiche = $state('');

  // Slide 3: Multi-Topic Selection & AI Suggestions
  let selectedTopics = $state<string[]>(['Artificial Intelligence & Agents', 'Coding & Developer Tools']);
  let customTopicInput = $state('');
  let isFetchingAiSuggestions = $state(false);
  let aiSuggestions = $state<OnboardingSuggestions | null>(null);

  // Slide 4: Target Audience & Tone
  let targetAudience = $state('Developers, tech founders, and digital builders');
  let preferredTone = $state('High Energy');

  // Slide 5: Channels & Cadence
  let selectedPlatforms = $state<string[]>(['YouTube', 'LinkedIn', 'X']);
  let weeklyPostGoal = $state(3);

  // Default Niche Catalog for instant zero-latency start
  const defaultNiches: Record<string, { label: string; icon: any; topics: string[]; defaultAudience: string }> = {
    'Technology': {
      label: 'Technology & AI',
      icon: Cpu,
      topics: [
        'Artificial Intelligence & Agents',
        'Coding & Developer Tools',
        'Startups & Micro-SaaS',
        'Cloud & DevOps',
        'Cybersecurity',
        'Next-Gen Hardware'
      ],
      defaultAudience: 'Developers, tech founders, and builders'
    },
    'Finance & Wealth': {
      label: 'Finance & Wealth',
      icon: TrendingUp,
      topics: [
        'Crypto & DeFi',
        'Stock Market & Index Funds',
        'Real Estate',
        'Personal Finance & Saving',
        'Macroeconomics & Trends',
        'Business & Entrepreneurship'
      ],
      defaultAudience: 'Investors, entrepreneurs, and savers'
    },
    'Health & Fitness': {
      label: 'Health & Fitness',
      icon: HeartPulse,
      topics: [
        'Longevity & Biohacking',
        'Strength & Muscle Building',
        'Nutrition & Diets',
        'Sleep & Recovery',
        'Mental Focus & Breathwork',
        'Mobility & Injury Prevention'
      ],
      defaultAudience: 'Fitness enthusiasts and health-conscious professionals'
    },
    'Content Creation': {
      label: 'Content Creation',
      icon: Video,
      topics: [
        'YouTube Growth & Packaging',
        'Short-Form Video (TikTok & Reels)',
        'Monetization & Sponsorships',
        'Creator Tools & AI Workflows',
        'Podcasting & Interviews',
        'Video Editing & Retention'
      ],
      defaultAudience: 'Content creators, video editors, and media brands'
    },
    'Gaming': {
      label: 'Gaming & Esports',
      icon: Gamepad2,
      topics: [
        'Indie Game Development',
        'Competitive Gaming & Guides',
        'PC Hardware & Gear',
        'Game Lore & Analysis',
        'Streaming & Community',
        'Game Design & Unreal Engine'
      ],
      defaultAudience: 'Gamers, game developers, and streamers'
    },
    'Design & Creative': {
      label: 'Design & Creative',
      icon: Palette,
      topics: [
        'UI/UX Design',
        'Graphic Design & Branding',
        '3D Modeling & Blender',
        'Architecture & Spatial Design',
        'Typography & Layout',
        'Motion Graphics'
      ],
      defaultAudience: 'Designers, artists, and creative leads'
    }
  };

  const toneOptions = [
    { id: 'High Energy', title: 'High Energy', desc: 'Fast-paced and exciting' },
    { id: 'Deep & Analytical', title: 'Analytical', desc: 'Detailed and thoughtful' },
    { id: 'Direct & Practical', title: 'Direct', desc: 'Actionable and concise' },
    { id: 'Casual & Story-driven', title: 'Story-Driven', desc: 'Relatable and conversational' }
  ];

  // Fetch AI suggestions whenever niche is selected
  async function fetchAiSuggestionsForNiche(nicheName: string) {
    if (!nicheName) return;
    try {
      isFetchingAiSuggestions = true;
      const suggestions = await api.getOnboardingSuggestions(nicheName);
      if (suggestions && suggestions.topics && suggestions.topics.length > 0) {
        aiSuggestions = suggestions;
        // Pre-select first two AI suggestions if user hasn't selected custom ones yet
        if (selectedTopics.length === 0) {
          selectedTopics = suggestions.topics.slice(0, 2);
        }
        if (suggestions.audience_suggestions && suggestions.audience_suggestions.length > 0) {
          targetAudience = suggestions.audience_suggestions[0];
        }
      }
    } catch {
      // Fallback already pre-loaded from defaultNiches
    } finally {
      isFetchingAiSuggestions = false;
    }
  }

  function selectPrimaryNiche(nicheKey: string) {
    primaryNiche = nicheKey;
    if (defaultNiches[nicheKey]) {
      selectedTopics = defaultNiches[nicheKey].topics.slice(0, 2);
      targetAudience = defaultNiches[nicheKey].defaultAudience;
    }
    // Fetch dynamic AI expansion for this niche
    fetchAiSuggestionsForNiche(nicheKey);
  }

  function toggleTopic(topic: string) {
    if (selectedTopics.includes(topic)) {
      if (selectedTopics.length > 1) {
        selectedTopics = selectedTopics.filter(t => t !== topic);
      }
    } else {
      selectedTopics = [...selectedTopics, topic];
    }
  }

  function addCustomTopic() {
    const val = customTopicInput.trim();
    if (val && !selectedTopics.includes(val)) {
      selectedTopics = [...selectedTopics, val];
      customTopicInput = '';
    }
  }

  function togglePlatform(p: string) {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        selectedPlatforms = selectedPlatforms.filter(item => item !== p);
      }
    } else {
      selectedPlatforms = [...selectedPlatforms, p];
    }
  }

  function nextSlide() {
    errorMessage = '';
    if (currentSlide === 1) {
      if (!displayName.trim()) {
        errorMessage = 'Please enter your name or channel name.';
        return;
      }
      if (!email.trim() || !password.trim()) {
        errorMessage = 'Please enter your email and password.';
        return;
      }
      if (password.length < 6) {
        errorMessage = 'Password should be at least 6 characters.';
        return;
      }
    }
    if (currentSlide === 2) {
      if (primaryNiche === 'Custom' && !customNiche.trim()) {
        errorMessage = 'Please enter your custom niche.';
        return;
      }
      const effective = primaryNiche === 'Custom' ? customNiche : primaryNiche;
      fetchAiSuggestionsForNiche(effective);
    }
    if (currentSlide === 3) {
      if (selectedTopics.length === 0) {
        errorMessage = 'Please select at least one topic.';
        return;
      }
    }
    if (currentSlide === 4) {
      if (!targetAudience.trim()) {
        errorMessage = 'Please describe your audience.';
        return;
      }
    }

    if (currentSlide < 5) {
      currentSlide = (currentSlide + 1) as any;
    }
  }

  function prevSlide() {
    errorMessage = '';
    if (currentSlide > 1) {
      currentSlide = (currentSlide - 1) as any;
    }
  }

  function jumpToSlide(target: 1 | 2 | 3 | 4 | 5) {
    if (target > 1 && (!email.trim() || password.length < 6)) {
      errorMessage = 'Please complete step 1 first.';
      currentSlide = 1;
      return;
    }
    errorMessage = '';
    currentSlide = target;
  }

  async function handleRegister(e?: Event) {
    if (e) e.preventDefault();
    errorMessage = '';
    isSubmitting = true;

    const effectivePrimaryNiche = primaryNiche === 'Custom' ? customNiche.trim() || 'General' : primaryNiche;
    const combinedSubNiche = selectedTopics.join(', ');
    const keywords = `${effectivePrimaryNiche}, ${combinedSubNiche}, news`;

    try {
      const res = await api.register({
        email: email.trim(),
        password,
        display_name: displayName.trim() || 'Creator',
        primary_niche: effectivePrimaryNiche,
        sub_niche: combinedSubNiche,
        sub_niches: selectedTopics,
        search_keywords: keywords,
        target_audience: targetAudience.trim(),
        preferred_tone: preferredTone,
        preferred_platforms: selectedPlatforms,
        weekly_post_goal: Number(weeklyPostGoal)
      });

      authStorage.setToken(res.access_token);
      appState.currentUser = {
        id: res.user.id,
        email: res.user.email,
        display_name: res.user.display_name
      };
      await appState.loadInitialData();

      appState.showToast(`Welcome to Kre8, ${res.user.display_name}!`, 'success');
      appState.enterWorkspace('dashboard');
    } catch (err: any) {
      errorMessage = err.message || 'Registration failed. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }

  async function handleLogin(e: Event) {
    e.preventDefault();
    errorMessage = '';
    isSubmitting = true;

    try {
      const res = await api.login({
        email: email.trim(),
        password
      });

      authStorage.setToken(res.access_token);
      appState.currentUser = {
        id: res.user.id,
        email: res.user.email,
        display_name: res.user.display_name
      };
      await appState.loadInitialData();

      appState.showToast(`Welcome back, ${res.user.display_name}!`, 'success');
      appState.enterWorkspace('dashboard');
    } catch (err: any) {
      errorMessage = err.message || 'Incorrect email or password.';
    } finally {
      isSubmitting = false;
    }
  }

  async function handleGuestEntry() {
    isSubmitting = true;
    errorMessage = '';
    try {
      const res = await api.login({
        email: 'creator@kre8.local',
        password: 'creator123'
      });
      authStorage.setToken(res.access_token);
      appState.currentUser = {
        id: res.user.id,
        email: res.user.email,
        display_name: res.user.display_name
      };
      await appState.loadInitialData();
      appState.showToast('Entered demo workspace', 'info');
      appState.enterWorkspace('dashboard');
    } catch {
      try {
        const regRes = await api.register({
          email: 'creator@kre8.local',
          password: 'creator123',
          display_name: 'Lead Creator',
          primary_niche: 'Technology',
          sub_niche: 'Artificial Intelligence & Agents',
          weekly_post_goal: 4
        });
        authStorage.setToken(regRes.access_token);
        appState.currentUser = {
          id: regRes.user.id,
          email: regRes.user.email,
          display_name: regRes.user.display_name
        };
        await appState.loadInitialData();
        appState.showToast('Initialized demo workspace', 'info');
        appState.enterWorkspace('dashboard');
      } catch {
        appState.enterWorkspace('dashboard');
      }
    } finally {
      isSubmitting = false;
    }
  }

  // Active topics to display: merge AI suggestions with default niche topics
  let activeTopicsPool = $derived.by(() => {
    if (aiSuggestions && aiSuggestions.topics && aiSuggestions.topics.length > 0) {
      return Array.from(new Set([...selectedTopics, ...aiSuggestions.topics]));
    }
    if (defaultNiches[primaryNiche]) {
      return Array.from(new Set([...selectedTopics, ...defaultNiches[primaryNiche].topics]));
    }
    return selectedTopics.length > 0 ? selectedTopics : ['General Insights', 'Tutorials', 'News & Updates'];
  });

  const slideHeaders: Record<number, { title: string; subtitle: string }> = {
    1: { title: 'Create account', subtitle: 'Enter your name and login details.' },
    2: { title: 'Choose your niche', subtitle: 'Pick your main content category.' },
    3: { title: 'Select topics', subtitle: 'Choose one or more topics to cover.' },
    4: { title: 'Audience & style', subtitle: 'Who you create for and how you sound.' },
    5: { title: 'Publishing goals', subtitle: 'Where you post and your weekly goal.' }
  };
</script>

{#if appState.authModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
    <!-- Click backdrop to close -->
    <button
      type="button"
      onclick={() => (appState.authModalOpen = false)}
      class="absolute inset-0 cursor-default"
      aria-label="Close modal"
    ></button>

    <!-- Compact Floating Modal Card (max-w-md, ~440px) -->
    <div class="relative w-full max-w-md bg-[#0e0717] border border-amber-400/30 shadow-2xl overflow-hidden z-10 flex flex-col">
      <!-- Minimalist Progress Bar for Sign Up -->
      {#if appState.authMode === 'signup'}
        <div class="h-1 bg-purple-950/40 w-full relative overflow-hidden">
          <div
            class="h-full bg-amber-400 transition-all duration-300 ease-out"
            style="width: {(currentSlide / 5) * 100}%"
          ></div>
        </div>
      {/if}

      <!-- Compact Header -->
      <div class="px-5 pt-4 pb-3 border-b border-purple-900/30 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-amber-400 rounded-full"></span>
          <span class="text-xs font-medium text-slate-300">
            {appState.authMode === 'signup' ? `Step ${currentSlide} of 5` : 'Sign In'}
          </span>
          {#if appState.authMode === 'signup' && isFetchingAiSuggestions}
            <span class="inline-flex items-center gap-1 text-[10px] text-amber-300 font-mono animate-pulse">
              <Sparkles class="w-3 h-3" /> AI Tailoring...
            </span>
          {/if}
        </div>

        <div class="flex items-center gap-1.5">
          {#if appState.authMode === 'signup'}
            <div class="flex items-center gap-1 text-[11px]">
              {#each [1, 2, 3, 4, 5] as s}
                <button
                  type="button"
                  onclick={() => jumpToSlide(s as any)}
                  class="w-5 h-5 flex items-center justify-center transition-all {currentSlide === s
                    ? 'bg-amber-400 text-black font-bold'
                    : s < currentSlide
                    ? 'bg-purple-950 text-amber-300 border border-purple-800/60'
                    : 'bg-black text-slate-500 border border-purple-900/40'}"
                  title="Step {s}"
                >
                  {s}
                </button>
              {/each}
            </div>
          {/if}

          <button
            onclick={() => (appState.authModalOpen = false)}
            class="text-slate-400 hover:text-white p-1 ml-1 text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Mode Switcher -->
      <div class="px-5 pt-2.5">
        <div class="grid grid-cols-2 border border-purple-900/40 p-0.5 bg-purple-950/20 text-xs">
          <button
            type="button"
            onclick={() => {
              appState.authMode = 'signup';
              currentSlide = 1;
              errorMessage = '';
            }}
            class="py-1 text-center transition-all {appState.authMode === 'signup'
              ? 'bg-amber-400 text-black font-bold'
              : 'text-slate-400 hover:text-white'}"
          >
            Sign Up
          </button>
          <button
            type="button"
            onclick={() => {
              appState.authMode = 'login';
              errorMessage = '';
            }}
            class="py-1 text-center transition-all {appState.authMode === 'login'
              ? 'bg-amber-400 text-black font-bold'
              : 'text-slate-400 hover:text-white'}"
          >
            Sign In
          </button>
        </div>
      </div>

      <!-- Main Body Container -->
      <div class="p-5 flex-1 flex flex-col justify-between">
        {#if errorMessage}
          <div class="mb-2.5 p-2 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-1.5">
            <span>Notice:</span>
            <span>{errorMessage}</span>
          </div>
        {/if}

        <!-- SIGN IN -->
        {#if appState.authMode === 'login'}
          <div class="space-y-3.5 my-auto py-1">
            <div>
              <h3 class="text-base font-bold text-white">Sign in to your workspace</h3>
              <p class="text-xs text-slate-400">Access your ideas, scripts, and content calendar.</p>
            </div>

            <form onsubmit={handleLogin} class="space-y-3">
              <div>
                <label for="login-email" class="block text-xs text-slate-300 mb-1">Email</label>
                <input
                  id="login-email"
                  type="email"
                  bind:value={email}
                  placeholder="name@domain.com"
                  required
                  class="w-full px-3 py-2 bg-black border border-purple-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label for="login-pass" class="block text-xs text-slate-300 mb-1">Password</label>
                <input
                  id="login-pass"
                  type="password"
                  bind:value={password}
                  placeholder="••••••••••••"
                  required
                  class="w-full px-3 py-2 bg-black border border-purple-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                class="w-full py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        <!-- 5-STEP SIGN UP CAROUSEL -->
        {:else}
          <div class="space-y-3">
            <!-- Title Header -->
            <div class="border-b border-purple-900/30 pb-2">
              <h3 class="text-base font-bold text-white">
                {slideHeaders[currentSlide].title}
              </h3>
              <p class="text-xs text-slate-400">
                {slideHeaders[currentSlide].subtitle}
              </p>
            </div>

            <!-- Compact Slide Content (~220px fixed height) -->
            <div class="min-h-[220px] max-h-[235px] flex flex-col justify-center">
              <!-- STEP 1: CREDENTIALS -->
              {#if currentSlide === 1}
                <div class="space-y-2.5 animate-in fade-in duration-150">
                  <div>
                    <label for="step1-name" class="block text-xs text-slate-300 mb-0.5">Creator or Channel Name</label>
                    <input
                      id="step1-name"
                      type="text"
                      bind:value={displayName}
                      placeholder="e.g. Alex Rivera"
                      required
                      class="w-full px-3 py-1.5 bg-black border border-purple-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label for="step1-email" class="block text-xs text-slate-300 mb-0.5">Email Address</label>
                    <input
                      id="step1-email"
                      type="email"
                      bind:value={email}
                      placeholder="alex@domain.com"
                      required
                      class="w-full px-3 py-1.5 bg-black border border-purple-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label for="step1-pass" class="block text-xs text-slate-300 mb-0.5">Password</label>
                    <input
                      id="step1-pass"
                      type="password"
                      bind:value={password}
                      placeholder="At least 6 characters"
                      required
                      class="w-full px-3 py-1.5 bg-black border border-purple-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

              <!-- STEP 2: PRIMARY NICHE (Compact Grid) -->
              {:else if currentSlide === 2}
                <div class="space-y-2 animate-in fade-in duration-150">
                  <div class="grid grid-cols-2 gap-1.5">
                    {#each Object.entries(defaultNiches) as [key, val]}
                      {@const isSelected = primaryNiche === key}
                      <button
                        type="button"
                        onclick={() => selectPrimaryNiche(key)}
                        class="p-2 text-left border text-xs transition-all flex items-center justify-between {isSelected
                          ? 'bg-amber-400 text-black border-amber-400 font-bold'
                          : 'bg-black text-slate-300 border-purple-900/40 hover:border-purple-600'}"
                      >
                        <span class="truncate">{val.label}</span>
                        {#if isSelected}
                          <Check class="w-3 h-3 shrink-0" />
                        {/if}
                      </button>
                    {/each}
                  </div>

                  <div class="pt-0.5">
                    <button
                      type="button"
                      onclick={() => (primaryNiche = 'Custom')}
                      class="text-[11px] text-amber-400 hover:underline block mb-1"
                    >
                      {primaryNiche === 'Custom' ? '✓ Custom niche active:' : '+ Enter custom niche'}
                    </button>
                    {#if primaryNiche === 'Custom'}
                      <input
                        type="text"
                        bind:value={customNiche}
                        placeholder="e.g. Sustainable Living, Coffee"
                        class="w-full px-3 py-1.5 bg-black border border-amber-400 text-white text-xs focus:outline-none"
                      />
                    {/if}
                  </div>
                </div>

              <!-- STEP 3: MULTI-TOPIC SELECTION -->
              {:else if currentSlide === 3}
                <div class="space-y-2 animate-in fade-in duration-150">
                  <div class="flex items-center justify-between text-xs text-slate-300">
                    <span>Select all that apply ({selectedTopics.length} selected):</span>
                    {#if aiSuggestions}
                      <span class="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                        <Sparkles class="w-2.5 h-2.5" /> AI Recommended
                      </span>
                    {/if}
                  </div>

                  <!-- Topic Cloud (Multi-Select) -->
                  <div class="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {#each activeTopicsPool as topic}
                      {@const isSelected = selectedTopics.includes(topic)}
                      <button
                        type="button"
                        onclick={() => toggleTopic(topic)}
                        class="px-2.5 py-1 text-xs border transition-all text-left flex items-center gap-1.5 {isSelected
                          ? 'bg-purple-900/90 text-amber-300 border-amber-400 font-medium'
                          : 'bg-black text-slate-400 border-purple-900/40 hover:text-white'}"
                      >
                        <span class="w-1.5 h-1.5 rounded-full {isSelected ? 'bg-amber-400' : 'bg-purple-700'}"></span>
                        <span>{topic}</span>
                      </button>
                    {/each}
                  </div>

                  <!-- Custom topic input -->
                  <div class="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      bind:value={customTopicInput}
                      placeholder="Add another topic..."
                      onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTopic(); } }}
                      class="flex-1 px-2.5 py-1 bg-black border border-purple-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onclick={addCustomTopic}
                      class="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-amber-300 border border-purple-800 text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>

              <!-- STEP 4: AUDIENCE & STYLE -->
              {:else if currentSlide === 4}
                <div class="space-y-2.5 animate-in fade-in duration-150">
                  <div>
                    <label for="target-aud" class="block text-xs text-slate-300 mb-0.5">Who do you create for?</label>
                    <input
                      id="target-aud"
                      type="text"
                      bind:value={targetAudience}
                      placeholder="e.g. Beginners learning to code"
                      class="w-full px-3 py-1.5 bg-black border border-purple-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                    {#if aiSuggestions && aiSuggestions.audience_suggestions}
                      <div class="flex flex-wrap gap-1 mt-1">
                        {#each aiSuggestions.audience_suggestions as aud}
                          <button
                            type="button"
                            onclick={() => (targetAudience = aud)}
                            class="text-[10px] text-amber-300/80 hover:text-amber-300 bg-purple-950/60 px-1.5 py-0.5 border border-purple-800/40 truncate max-w-full text-left"
                            title="Click to use"
                          >
                            + {aud}
                          </button>
                        {/each}
                      </div>
                    {/if}
                  </div>

                  <div>
                    <span class="block text-xs text-slate-300 mb-1">Choose your tone</span>
                    <div class="grid grid-cols-2 gap-1.5">
                      {#each toneOptions as tone}
                        {@const isSelected = preferredTone === tone.id}
                        <button
                          type="button"
                          onclick={() => (preferredTone = tone.id)}
                          class="p-2 border text-left text-xs transition-all {isSelected
                            ? 'bg-amber-400 text-black border-amber-400 font-bold'
                            : 'bg-black text-slate-300 border-purple-900/40 hover:border-purple-600'}"
                        >
                          <div class="text-xs font-semibold">{tone.title}</div>
                          <div class="text-[10px] opacity-75">{tone.desc}</div>
                        </button>
                      {/each}
                    </div>
                  </div>
                </div>

              <!-- STEP 5: CHANNELS & GOALS -->
              {:else if currentSlide === 5}
                <div class="space-y-2.5 animate-in fade-in duration-150">
                  <div>
                    <span class="block text-xs text-slate-300 mb-1">Select your platforms</span>
                    <div class="flex flex-wrap gap-1.5">
                      {#each ['YouTube', 'TikTok', 'LinkedIn', 'Instagram', 'X'] as plat}
                        {@const isSelected = selectedPlatforms.includes(plat)}
                        <button
                          type="button"
                          onclick={() => togglePlatform(plat)}
                          class="px-2.5 py-1 text-xs border transition-all {isSelected
                            ? 'bg-amber-400 text-black border-amber-400 font-bold'
                            : 'bg-black text-slate-400 border-purple-900/40 hover:text-white'}"
                        >
                          {plat} {isSelected ? '✓' : ''}
                        </button>
                      {/each}
                    </div>
                  </div>

                  <div>
                    <span class="block text-xs text-slate-300 mb-1">Weekly publishing target</span>
                    <div class="grid grid-cols-4 gap-1.5 text-center">
                      {#each [
                        { val: 1, label: '1 Post', sub: 'Weekly' },
                        { val: 2, label: '2 Posts', sub: 'Balanced' },
                        { val: 3, label: '3 Posts', sub: 'Optimal' },
                        { val: 4, label: '4+ Posts', sub: 'Fast' }
                      ] as cad}
                        {@const isSelected = weeklyPostGoal === cad.val}
                        <button
                          type="button"
                          onclick={() => (weeklyPostGoal = cad.val)}
                          class="p-2 border transition-all {isSelected
                            ? 'bg-amber-400 text-black border-amber-400 font-bold'
                            : 'bg-black text-slate-400 border-purple-900/40 hover:text-white'}"
                        >
                          <div class="text-xs font-bold">{cad.label}</div>
                          <div class="text-[10px] opacity-75">{cad.sub}</div>
                        </button>
                      {/each}
                    </div>
                  </div>
                </div>
              {/if}
            </div>

            <!-- Footer Navigation -->
            <div class="pt-2.5 border-t border-purple-900/40 flex items-center justify-between">
              <button
                type="button"
                onclick={prevSlide}
                disabled={currentSlide === 1}
                class="px-3 py-1.5 border border-purple-900/60 text-slate-300 hover:text-white text-xs flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ArrowLeft class="w-3 h-3" />
                <span>Back</span>
              </button>

              <span class="text-xs text-slate-400 font-mono">
                {currentSlide} / 5
              </span>

              {#if currentSlide < 5}
                <button
                  type="button"
                  onclick={nextSlide}
                  class="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center gap-1 transition-all"
                >
                  <span>Next</span>
                  <ArrowRight class="w-3 h-3" />
                </button>
              {:else}
                <button
                  type="button"
                  onclick={() => handleRegister()}
                  disabled={isSubmitting}
                  class="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Sparkles class="w-3 h-3" />
                  <span>{isSubmitting ? 'Creating workspace...' : 'Get Started'}</span>
                </button>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Demo Mode Link -->
        <div class="pt-2.5 border-t border-purple-900/30 text-center">
          <button
            type="button"
            onclick={handleGuestEntry}
            disabled={isSubmitting}
            class="text-[11px] text-slate-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
          >
            <Key class="w-3 h-3 text-amber-400" />
            <span>Try demo workspace without signing up</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
