<script lang="ts">
  import { appState } from '../../stores/appState.svelte';
  import { api, authStorage } from '../../api/client';
  import type { OnboardingSuggestions } from '../../types';
  import Kre8Logo from '../ui/Kre8Logo.svelte';
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
    Palette,
    Eye,
    EyeOff
  } from 'lucide-svelte';

  // Carousel Slide State: 1 to 5
  let currentSlide = $state<1 | 2 | 3 | 4 | 5>(1);
  let slideDirection = $state<'next' | 'prev'>('next');
  let isSubmitting = $state(false);
  let errorMessage = $state('');

  // Slide 1: Credentials
  let email = $state('');
  let password = $state('');
  let displayName = $state('');
  let showLoginPassword = $state(false);
  let showSignupPassword = $state(false);

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

  async function fetchAiSuggestionsForNiche(nicheName: string) {
    if (!nicheName) return;
    try {
      isFetchingAiSuggestions = true;
      const suggestions = await api.getOnboardingSuggestions(nicheName);
      if (suggestions && suggestions.topics && suggestions.topics.length > 0) {
        aiSuggestions = suggestions;
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
      slideDirection = 'next';
      currentSlide = (currentSlide + 1) as any;
    }
  }

  function prevSlide() {
    errorMessage = '';
    if (currentSlide > 1) {
      slideDirection = 'prev';
      currentSlide = (currentSlide - 1) as any;
    }
  }

  function jumpToSlide(target: 1 | 2 | 3 | 4 | 5) {
    if (target > 1 && (!email.trim() || password.length < 6)) {
      errorMessage = 'Please complete step 1 first.';
      slideDirection = 'prev';
      currentSlide = 1;
      return;
    }
    errorMessage = '';
    slideDirection = target >= currentSlide ? 'next' : 'prev';
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
    1: { title: 'Create your account', subtitle: 'Set up your profile and login details.' },
    2: { title: 'Choose your niche', subtitle: 'Pick the primary space you create in.' },
    3: { title: 'Pick your topics', subtitle: 'Select the subjects you want in your feed.' },
    4: { title: 'Audience & voice', subtitle: 'Tell us who you create for and your style.' },
    5: { title: 'Publishing cadence', subtitle: 'Choose your platforms and weekly goal.' }
  };
</script>

{#if appState.authModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
    <!-- Click backdrop to close -->
    <button
      type="button"
      onclick={() => (appState.authModalOpen = false)}
      class="absolute inset-0 cursor-default"
      aria-label="Close modal"
    ></button>

    <!-- Floating Modal Card -->
    <div class="relative w-full max-w-md bg-[#11081d] border border-purple-800/40 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col modal-spring">
      <!-- Smooth Progress Bar for Sign Up -->
      {#if appState.authMode === 'signup'}
        <div class="h-1 bg-purple-950/50 w-full relative overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-500 ease-out"
            style="width: {(currentSlide / 5) * 100}%"
          ></div>
        </div>
      {/if}

      <!-- Header -->
      <div class="px-6 pt-5 pb-3.5 border-b border-purple-900/30 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <Kre8Logo size="sm" variant="icon" />
          <span class="text-xs font-medium text-slate-300">
            {appState.authMode === 'signup' ? `Step ${currentSlide} of 5` : 'Welcome back'}
          </span>
          {#if appState.authMode === 'signup' && isFetchingAiSuggestions}
            <span class="inline-flex items-center gap-1 text-[11px] text-amber-300 animate-pulse">
              <Sparkles class="w-3 h-3" /> Personalizing...
            </span>
          {/if}
        </div>

        <div class="flex items-center gap-2">
          {#if appState.authMode === 'signup'}
            <div class="flex items-center gap-1">
              {#each [1, 2, 3, 4, 5] as s}
                <button
                  type="button"
                  onclick={() => jumpToSlide(s as any)}
                  class="w-6 h-1.5 rounded-full transition-all duration-300 {currentSlide === s
                    ? 'bg-amber-400 w-7'
                    : s < currentSlide
                    ? 'bg-amber-400/40 hover:bg-amber-400/60'
                    : 'bg-purple-900/50 hover:bg-purple-800/60'}"
                  title="Step {s}"
                  aria-label="Go to step {s}"
                ></button>
              {/each}
            </div>
          {/if}

          <button
            type="button"
            onclick={() => (appState.authModalOpen = false)}
            class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-purple-950/50 transition-colors ml-1"
            aria-label="Close"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Mode Switcher -->
      <div class="px-6 pt-3">
        <div class="grid grid-cols-2 rounded-xl border border-purple-900/40 p-1 bg-black/40 text-xs">
          <button
            type="button"
            onclick={() => {
              appState.authMode = 'signup';
              currentSlide = 1;
              errorMessage = '';
            }}
            class="py-1.5 rounded-lg text-center font-medium transition-all duration-200 {appState.authMode === 'signup'
              ? 'bg-amber-400 text-black font-semibold shadow-sm'
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
            class="py-1.5 rounded-lg text-center font-medium transition-all duration-200 {appState.authMode === 'login'
              ? 'bg-amber-400 text-black font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'}"
          >
            Sign In
          </button>
        </div>
      </div>

      <!-- Main Body Container -->
      <div class="p-6 flex-1 flex flex-col justify-between">
        {#if errorMessage}
          <div class="mb-3 p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <span>{errorMessage}</span>
          </div>
        {/if}

        <!-- SIGN IN -->
        {#if appState.authMode === 'login'}
          <div class="space-y-4 my-auto py-1 step-slide-prev">
            <div>
              <h3 class="text-lg font-semibold text-white">Sign in to Kre8</h3>
              <p class="text-xs text-slate-400 mt-0.5">Access your ideas, scripts, and content calendar.</p>
            </div>

            <form onsubmit={handleLogin} class="space-y-3.5">
              <div>
                <label for="login-email" class="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
                <input
                  id="login-email"
                  type="email"
                  bind:value={email}
                  placeholder="name@domain.com"
                  required
                  class="w-full px-3.5 py-2.5 rounded-lg bg-black/70 border border-purple-900/60 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label for="login-pass" class="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <div class="relative">
                  <input
                    id="login-pass"
                    type={showLoginPassword ? 'text' : 'password'}
                    bind:value={password}
                    placeholder="Enter your password"
                    required
                    class="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-black/70 border border-purple-900/60 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <button
                    type="button"
                    onclick={() => (showLoginPassword = !showLoginPassword)}
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {#if showLoginPassword}
                      <EyeOff class="w-4 h-4" />
                    {:else}
                      <Eye class="w-4 h-4" />
                    {/if}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                class="w-full py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        <!-- 5-STEP SIGN UP CAROUSEL -->
        {:else}
          <div class="space-y-3.5">
            <!-- Title Header -->
            <div class="border-b border-purple-900/30 pb-2.5">
              <h3 class="text-lg font-semibold text-white">
                {slideHeaders[currentSlide].title}
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                {slideHeaders[currentSlide].subtitle}
              </p>
            </div>

            <!-- Animated Slide Content -->
            {#key currentSlide}
              <div class="min-h-[235px] max-h-[250px] flex flex-col justify-center {slideDirection === 'next' ? 'step-slide-next' : 'step-slide-prev'}">
                <!-- STEP 1: CREDENTIALS -->
                {#if currentSlide === 1}
                  <div class="space-y-3">
                    <div>
                      <label for="step1-name" class="block text-xs font-medium text-slate-300 mb-1">Creator or Channel Name</label>
                      <input
                        id="step1-name"
                        type="text"
                        bind:value={displayName}
                        placeholder="e.g. Alex Rivera"
                        required
                        class="w-full px-3.5 py-2 rounded-lg bg-black/70 border border-purple-900/60 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label for="step1-email" class="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                      <input
                        id="step1-email"
                        type="email"
                        bind:value={email}
                        placeholder="alex@domain.com"
                        required
                        class="w-full px-3.5 py-2 rounded-lg bg-black/70 border border-purple-900/60 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label for="step1-pass" class="block text-xs font-medium text-slate-300 mb-1">Password</label>
                      <div class="relative">
                        <input
                          id="step1-pass"
                          type={showSignupPassword ? 'text' : 'password'}
                          bind:value={password}
                          placeholder="At least 6 characters"
                          required
                          onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); nextSlide(); } }}
                          class="w-full pl-3.5 pr-10 py-2 rounded-lg bg-black/70 border border-purple-900/60 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                        />
                        <button
                          type="button"
                          onclick={() => (showSignupPassword = !showSignupPassword)}
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                          aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                          title={showSignupPassword ? 'Hide password' : 'Show password'}
                        >
                          {#if showSignupPassword}
                            <EyeOff class="w-4 h-4" />
                          {:else}
                            <Eye class="w-4 h-4" />
                          {/if}
                        </button>
                      </div>
                    </div>
                  </div>

                <!-- STEP 2: PRIMARY NICHE -->
                {:else if currentSlide === 2}
                  <div class="space-y-2.5">
                    <div class="grid grid-cols-2 gap-2">
                      {#each Object.entries(defaultNiches) as [key, val]}
                        {@const isSelected = primaryNiche === key}
                        <button
                          type="button"
                          onclick={() => selectPrimaryNiche(key)}
                          class="p-2.5 rounded-lg text-left border text-xs transition-all flex items-center justify-between {isSelected
                            ? 'bg-amber-400 text-black border-amber-400 font-semibold shadow-sm'
                            : 'bg-black/60 text-slate-300 border-purple-900/40 hover:border-purple-600 hover:text-white'}"
                        >
                          <span class="truncate">{val.label}</span>
                          {#if isSelected}
                            <Check class="w-3.5 h-3.5 shrink-0" />
                          {/if}
                        </button>
                      {/each}
                    </div>

                    <div class="pt-0.5">
                      <button
                        type="button"
                        onclick={() => (primaryNiche = 'Custom')}
                        class="text-xs text-amber-400 hover:text-amber-300 transition-colors block mb-1.5"
                      >
                        {primaryNiche === 'Custom' ? '✓ Custom niche:' : '+ Enter a custom niche'}
                      </button>
                      {#if primaryNiche === 'Custom'}
                        <input
                          type="text"
                          bind:value={customNiche}
                          placeholder="e.g. Sustainable Living, Specialty Coffee"
                          class="w-full px-3.5 py-2 rounded-lg bg-black/70 border border-amber-400 text-white text-xs focus:outline-none"
                        />
                      {/if}
                    </div>
                  </div>

                <!-- STEP 3: MULTI-TOPIC SELECTION -->
                {:else if currentSlide === 3}
                  <div class="space-y-2.5">
                    <div class="flex items-center justify-between text-xs text-slate-300">
                      <span>Selected topics ({selectedTopics.length}):</span>
                      {#if aiSuggestions}
                        <span class="text-[11px] text-amber-300 flex items-center gap-1">
                          <Sparkles class="w-3 h-3" /> Tailored for you
                        </span>
                      {/if}
                    </div>

                    <!-- Topic Cloud -->
                    <div class="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {#each activeTopicsPool as topic}
                        {@const isSelected = selectedTopics.includes(topic)}
                        <button
                          type="button"
                          onclick={() => toggleTopic(topic)}
                          class="px-3 py-1.5 rounded-full text-xs border transition-all text-left flex items-center gap-1.5 {isSelected
                            ? 'bg-purple-900/80 text-amber-300 border-amber-400/80 font-medium'
                            : 'bg-black/60 text-slate-400 border-purple-900/40 hover:text-white hover:border-purple-700'}"
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
                        placeholder="Add your own topic..."
                        onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTopic(); } }}
                        class="flex-1 px-3 py-1.5 rounded-lg bg-black/70 border border-purple-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onclick={addCustomTopic}
                        class="px-3 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 text-amber-300 border border-purple-800 text-xs font-medium transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                <!-- STEP 4: AUDIENCE & STYLE -->
                {:else if currentSlide === 4}
                  <div class="space-y-3">
                    <div>
                      <label for="target-aud" class="block text-xs font-medium text-slate-300 mb-1">Who do you create for?</label>
                      <input
                        id="target-aud"
                        type="text"
                        bind:value={targetAudience}
                        placeholder="e.g. Beginners learning to code"
                        class="w-full px-3.5 py-2 rounded-lg bg-black/70 border border-purple-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                      {#if aiSuggestions && aiSuggestions.audience_suggestions}
                        <div class="flex flex-wrap gap-1.5 mt-1.5">
                          {#each aiSuggestions.audience_suggestions as aud}
                            <button
                              type="button"
                              onclick={() => (targetAudience = aud)}
                              class="text-[11px] rounded-md text-amber-300/90 hover:text-amber-200 bg-purple-950/60 px-2 py-0.5 border border-purple-800/40 truncate max-w-full text-left transition-colors"
                              title="Click to use"
                            >
                              + {aud}
                            </button>
                          {/each}
                        </div>
                      {/if}
                    </div>

                    <div>
                      <span class="block text-xs font-medium text-slate-300 mb-1.5">Your tone</span>
                      <div class="grid grid-cols-2 gap-2">
                        {#each toneOptions as tone}
                          {@const isSelected = preferredTone === tone.id}
                          <button
                            type="button"
                            onclick={() => (preferredTone = tone.id)}
                            class="p-2.5 rounded-lg border text-left text-xs transition-all {isSelected
                              ? 'bg-amber-400 text-black border-amber-400 font-semibold shadow-sm'
                              : 'bg-black/60 text-slate-300 border-purple-900/40 hover:border-purple-600'}"
                          >
                            <div class="text-xs font-semibold">{tone.title}</div>
                            <div class="text-[11px] opacity-75">{tone.desc}</div>
                          </button>
                        {/each}
                      </div>
                    </div>
                  </div>

                <!-- STEP 5: CHANNELS & GOALS -->
                {:else if currentSlide === 5}
                  <div class="space-y-3">
                    <div>
                      <span class="block text-xs font-medium text-slate-300 mb-1.5">Where do you publish?</span>
                      <div class="flex flex-wrap gap-1.5">
                        {#each ['YouTube', 'TikTok', 'LinkedIn', 'Instagram', 'X'] as plat}
                          {@const isSelected = selectedPlatforms.includes(plat)}
                          <button
                            type="button"
                            onclick={() => togglePlatform(plat)}
                            class="px-3 py-1.5 rounded-lg text-xs border transition-all {isSelected
                              ? 'bg-amber-400 text-black border-amber-400 font-semibold'
                              : 'bg-black/60 text-slate-400 border-purple-900/40 hover:text-white'}"
                          >
                            {plat} {isSelected ? '✓' : ''}
                          </button>
                        {/each}
                      </div>
                    </div>

                    <div>
                      <span class="block text-xs font-medium text-slate-300 mb-1.5">Weekly publishing goal</span>
                      <div class="grid grid-cols-4 gap-2 text-center">
                        {#each [
                          { val: 1, label: '1 Post', sub: 'Steady' },
                          { val: 2, label: '2 Posts', sub: 'Balanced' },
                          { val: 3, label: '3 Posts', sub: 'Growth' },
                          { val: 4, label: '4+ Posts', sub: 'Daily' }
                        ] as cad}
                          {@const isSelected = weeklyPostGoal === cad.val}
                          <button
                            type="button"
                            onclick={() => (weeklyPostGoal = cad.val)}
                            class="p-2 rounded-lg border transition-all {isSelected
                              ? 'bg-amber-400 text-black border-amber-400 font-semibold'
                              : 'bg-black/60 text-slate-400 border-purple-900/40 hover:text-white'}"
                          >
                            <div class="text-xs font-semibold">{cad.label}</div>
                            <div class="text-[10px] opacity-75">{cad.sub}</div>
                          </button>
                        {/each}
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            {/key}

            <!-- Footer Navigation -->
            <div class="pt-3 border-t border-purple-900/30 flex items-center justify-between">
              <button
                type="button"
                onclick={prevSlide}
                disabled={currentSlide === 1}
                class="px-3.5 py-2 rounded-lg border border-purple-900/60 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ArrowLeft class="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <span class="text-xs text-slate-400">
                {currentSlide} of 5
              </span>

              {#if currentSlide < 5}
                <button
                  type="button"
                  onclick={nextSlide}
                  class="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>Next</span>
                  <ArrowRight class="w-3.5 h-3.5" />
                </button>
              {:else}
                <button
                  type="button"
                  onclick={() => handleRegister()}
                  disabled={isSubmitting}
                  class="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles class="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Creating workspace...' : 'Get Started'}</span>
                </button>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Demo Mode Link -->
        <div class="pt-3 mt-2 border-t border-purple-900/30 text-center">
          <button
            type="button"
            onclick={handleGuestEntry}
            disabled={isSubmitting}
            class="text-xs text-slate-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1.5"
          >
            <Key class="w-3 h-3 text-amber-400" />
            <span>Explore demo workspace</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
