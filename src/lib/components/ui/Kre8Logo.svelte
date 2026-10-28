<script lang="ts">
  interface Props {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
    variant?: 'icon' | 'full';
    glow?: boolean;
    class?: string;
  }

  let {
    size = 'md',
    variant = 'icon',
    glow = true,
    class: className = ''
  }: Props = $props();

  const sizeMap: Record<string, number> = {
    xs: 20,
    sm: 24,
    md: 32,
    lg: 40,
    xl: 56
  };

  let pixelSize = $derived(typeof size === 'number' ? size : sizeMap[size] || 32);
</script>

<div class="inline-flex items-center gap-2.5 select-none {className}">
  <!-- Monogram Vector Mark -->
  <div
    class="relative shrink-0 flex items-center justify-center"
    style="width: {pixelSize}px; height: {pixelSize}px;"
  >
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="w-full h-full overflow-visible"
    >
      <defs>
        <!-- Seamless Gradient for Heart Outline: Starts in Studio Purple at K Spine & transitions to Radiant Gold -->
        <linearGradient id="kre8HeartBlend" x1="24" y1="50" x2="88" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#9333EA" />
          <stop offset="14%" stop-color="#A855F7" />
          <stop offset="28%" stop-color="#C084FC" />
          <stop offset="44%" stop-color="#FDE68A" />
          <stop offset="68%" stop-color="#FBBF24" />
          <stop offset="100%" stop-color="#F59E0B" />
        </linearGradient>

        <!-- Seamless Gradient for Interior Line: Flows from Purple at K Stem to Gold at 8 Cleft -->
        <linearGradient id="kre8LineBlend" x1="26" y1="50" x2="78" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#9333EA" />
          <stop offset="22%" stop-color="#A855F7" />
          <stop offset="48%" stop-color="#C084FC" />
          <stop offset="72%" stop-color="#FDE68A" />
          <stop offset="100%" stop-color="#FBBF24" />
        </linearGradient>

        <!-- K Spine Gradient: Deep Electric Violet -->
        <linearGradient id="kre8SpineGrad" x1="15" y1="12" x2="26" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#E9D5FF" />
          <stop offset="35%" stop-color="#C084FC" />
          <stop offset="70%" stop-color="#9333EA" />
          <stop offset="100%" stop-color="#6B21A8" />
        </linearGradient>

        {#if glow}
          <!-- Dual Atmospheric Glow -->
          <filter id="kre8LogoGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" flood-color="#FBBF24" flood-opacity="0.45" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#C084FC" flood-opacity="0.3" />
          </filter>
        {/if}
      </defs>

      <!-- 1. K-Stem (Bold Spine) in Purple -->
      <rect
        x="15.5"
        y="12"
        width="10.5"
        height="76"
        rx="5.25"
        fill="url(#kre8SpineGrad)"
      />

      <!-- 2. Intersecting Heart with Seamless Purple-to-Gold Gradient Transition -->
      <path
        d="M 26 50
           L 52 24
           C 62 14 77 15 85 24
           C 92 33 90 44 78 50
           C 90 56 92 67 85 76
           C 77 85 62 86 52 76
           Z"
        stroke="url(#kre8HeartBlend)"
        stroke-width="8"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="#FBBF24"
        fill-opacity="0.08"
        filter={glow ? 'url(#kre8LogoGlow)' : undefined}
      />

      <!-- 3. Interior Curved Line with Seamless Purple-to-Gold Gradient -->
      <path
        d="M 26 50 Q 51 57 78 50"
        stroke="url(#kre8LineBlend)"
        stroke-width="6.5"
        stroke-linecap="round"
      />
    </svg>
  </div>

  <!-- Typographic Lockup (When variant === 'full') -->
  {#if variant === 'full'}
    <div class="flex flex-col leading-none">
      <div class="flex items-baseline font-bold tracking-tight text-white" style="font-size: {Math.max(14, pixelSize * 0.52)}px;">
        <span>Kre</span>
        <span class="text-amber-400">8</span>
      </div>
      <span class="text-slate-400 tracking-normal font-normal mt-0.5" style="font-size: {Math.max(10, pixelSize * 0.32)}px;">
        Creator Studio
      </span>
    </div>
  {/if}
</div>
