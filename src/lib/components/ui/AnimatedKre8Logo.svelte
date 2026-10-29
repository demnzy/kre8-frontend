<script lang="ts">
  interface Props {
    size?: number;
    class?: string;
  }

  let { size = 180, class: className = '' }: Props = $props();

  let replayKey = $state(0);

  function handleReplay() {
    replayKey += 1;
  }
</script>

{#key replayKey}
  <button
    type="button"
    onclick={handleReplay}
    title="Click to redraw"
    class="relative inline-flex items-center justify-center bg-transparent border-0 p-0 m-0 cursor-pointer select-none group focus:outline-none {className}"
    style="width: {size}px; height: {size}px;"
    aria-label="Kre8 animated logo"
  >
    <div class="logo-floating w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="w-full h-full overflow-visible pointer-events-none"
      >
        <defs>
          <!-- Unique gradients with unique IDs to prevent conflict -->
          <linearGradient id="animHeartGrad" x1="24" y1="50" x2="88" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#9333EA" />
            <stop offset="14%" stop-color="#A855F7" />
            <stop offset="28%" stop-color="#C084FC" />
            <stop offset="44%" stop-color="#FDE68A" />
            <stop offset="68%" stop-color="#FBBF24" />
            <stop offset="100%" stop-color="#F59E0B" />
          </linearGradient>

          <linearGradient id="animLineGrad" x1="26" y1="50" x2="78" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#9333EA" />
            <stop offset="22%" stop-color="#A855F7" />
            <stop offset="48%" stop-color="#C084FC" />
            <stop offset="72%" stop-color="#FDE68A" />
            <stop offset="100%" stop-color="#FBBF24" />
          </linearGradient>

          <linearGradient id="animSpineGrad" x1="20.75" y1="12" x2="20.75" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#E9D5FF" />
            <stop offset="35%" stop-color="#C084FC" />
            <stop offset="70%" stop-color="#9333EA" />
            <stop offset="100%" stop-color="#6B21A8" />
          </linearGradient>

          <filter id="animGlowFilter" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#FBBF24" flood-opacity="0.5" />
            <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#C084FC" flood-opacity="0.4" />
          </filter>
        </defs>

        <!-- 1. K-Spine: vertical stroke written from top to bottom -->
        <path
          d="M 20.75 14 L 20.75 86"
          stroke="url(#animSpineGrad)"
          stroke-width="10.5"
          stroke-linecap="round"
          pathLength="100"
          class="stroke-spine"
        />

        <!-- 2. Loop/Heart: continuous flourish stroke drawn around -->
        <path
          d="M 26 50
             L 52 24
             C 62 14 77 15 85 24
             C 92 33 90 44 78 50
             C 90 56 92 67 85 76
             C 77 85 62 86 52 76
             Z"
          stroke="url(#animHeartGrad)"
          stroke-width="8"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="#FBBF24"
          fill-opacity="0"
          filter="url(#animGlowFilter)"
          pathLength="100"
          class="stroke-heart"
        />

        <!-- 3. Interior flourish line crossing across the middle -->
        <path
          d="M 26 50 Q 51 57 78 50"
          stroke="url(#animLineGrad)"
          stroke-width="6.5"
          stroke-linecap="round"
          pathLength="100"
          class="stroke-line"
        />
      </svg>
    </div>
  </button>
{/key}

<style>
  .logo-floating {
    filter: drop-shadow(0 0 18px rgba(245, 158, 11, 0.4)) drop-shadow(0 0 35px rgba(168, 85, 247, 0.35));
    animation: floatBreathe 4.5s ease-in-out 2.4s infinite alternate;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  button:hover .logo-floating {
    transform: scale(1.05);
    filter: drop-shadow(0 0 26px rgba(245, 158, 11, 0.65)) drop-shadow(0 0 50px rgba(168, 85, 247, 0.55));
  }

  .stroke-spine {
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation: drawSpine 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.15s forwards;
  }

  .stroke-heart {
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation:
      drawHeart 1.5s cubic-bezier(0.4, 0, 0.2, 1) 0.65s forwards,
      fadeFill 0.8s ease-out 1.9s forwards;
  }

  .stroke-line {
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation: drawLine 0.6s cubic-bezier(0.4, 0, 0.2, 1) 1.7s forwards;
  }

  @keyframes drawSpine {
    0% {
      stroke-dashoffset: 100;
      opacity: 0.1;
    }
    10% {
      opacity: 1;
    }
    100% {
      stroke-dashoffset: 0;
      opacity: 1;
    }
  }

  @keyframes drawHeart {
    0% {
      stroke-dashoffset: 100;
      opacity: 0.1;
    }
    10% {
      opacity: 1;
    }
    100% {
      stroke-dashoffset: 0;
      opacity: 1;
    }
  }

  @keyframes drawLine {
    0% {
      stroke-dashoffset: 100;
      opacity: 0.1;
    }
    15% {
      opacity: 1;
    }
    100% {
      stroke-dashoffset: 0;
      opacity: 1;
    }
  }

  @keyframes fadeFill {
    0% {
      fill-opacity: 0;
    }
    100% {
      fill-opacity: 0.08;
    }
  }

  @keyframes floatBreathe {
    0% {
      transform: translateY(0px) scale(1);
    }
    100% {
      transform: translateY(-8px) scale(1.02);
    }
  }
</style>
