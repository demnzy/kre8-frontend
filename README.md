# Kre8 Frontend — Creator Operating System Studio

Kre8 Frontend is an interface built with **Svelte 5** (Runes), **TypeScript**, **Vite**, and **TailwindCSS v4**, crafted in the Swiss Modernist design tradition. It provides digital creators with a centralized command center for content ideation, daily trend intelligence, live video scriptwriting, multi-channel scheduling, and telemetry tracking.

---

## 🎨 Swiss Design Philosophy & Aesthetics

- **Neo-Grotesque Typography**:
  - **Headlines & Banners**: *Chivo* — heavy, architectural, tight tracking (`-0.045em`).
  - **Body & Controls**: *Instrument Sans* — clean, legible, high-contrast digital grotesque.
  - **Telemetry & Metadata**: *Space Mono* — geometric monospace for tabular data, timestamps, and badges.
- **Color Palette & Visual Void**:
  - Deep violet-black void backgrounds (`#08040d`, `#10071c`).
  - Amber Gold accents (`#f59e0b`, `#fbbf24`) for active states, calls to action, and focus rings.
  - Electric Purple borders (`rgba(88, 28, 135, 0.5)`) and subtle ambient glows.
- **Fluid Motion System**:
  - Hardware-accelerated viewport scroll reveals (`use:reveal` Svelte action).
  - Micro-lift card hover physics (`.swiss-card-hover`).
  - Seamless view transitions between workspace modules.

---

## 🚀 Key Modules & Views

1. **Studio Setup Modal (5-Step Carousel)**:
   - Compact floating card (`max-w-md`) with multi-topic selection and progressive AI suggestions.
   - Dynamic AI topic and voice recommendation based on selected niche.
2. **Dashboard (`DashboardView.svelte`)**:
   - Live metrics summary: Active Ideas, In Production, Published MTD, Activity Streak, and Total Reach.
   - Today's execution queue and breaking daily trend radar.
3. **Discover & Trend Radar (`DiscoverView.svelte`)**:
   - Real-time niche RSS headlines with article thumbnails.
   - Gemini AI 3-second hook synthesis with 1-click **Draft Script** pipeline into Script Studio.
4. **Script Studio (`ScriptStudioView.svelte`)**:
   - Dual-pane scriptwriting workspace with live Gemini script generation.
   - Interactive scene director breakdown with camera directions, transitions, and on-screen text overlays.
   - 1-Click teleprompter clipboard copy.
5. **Ideas Bank (`IdeasView.svelte`)**:
   - Idea repository with priority scoring and 1-click promotion to active Kanban workflow or script drafting.
6. **Content Pipeline (`ContentView.svelte`)**:
   - 10-stage production Kanban board (Idea → Researching → Script Writing → Ready to Record → Recorded → Editing → Ready to Publish → Scheduled → Published → Repurposed).
   - Fast stage moving, filtering, and direct links to Script Studio.
7. **Calendar (`CalendarView.svelte`)**:
   - Reactive calendar engine with exact days per month, leap years, Sunday offset padding, and Next/Prev navigation.
8. **Social Telemetry & Analytics (`AnalyticsView.svelte`)**:
   - Multi-channel analytics aggregation across YouTube, LinkedIn, TikTok, and Instagram.
   - Interactive channel connection modal with public YouTube lookup (`@handle`).
   - Gemini performance review analysis.
9. **Habit & Cadence Goals (`GoalsView.svelte`)**:
   - Input-control habit tracker (scripts written, videos published) and dynamic consecutive publishing streak.
10. **Settings & AI Diagnostics (`SettingsView.svelte`)**:
    - Persistent custom niche and keyword configuration.
    - Live Gemini connection ping dot and interactive AI prompt playground.

---

## 🛠️ Tech Stack

- **Framework**: [Svelte 5](https://svelte.dev/) with modern Runes (`$state`, `$derived`, `$effect`)
- **Language**: TypeScript
- **Bundler & Dev Server**: [Vite 8](https://vitejs.dev/)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide Svelte](https://lucide.dev/guide/packages/lucide-svelte)

---

## 📁 Directory Structure

```text
kre8-frontend/
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts             # Typed REST API client & auth storage
│   │   ├── components/
│   │   │   ├── landing/              # Landing page & auth modals
│   │   │   │   ├── LandingPage.svelte
│   │   │   │   └── AuthModal.svelte  # 5-step compact onboarding carousel
│   │   │   ├── layout/               # Header, sidebar, toasts, command palette
│   │   │   │   ├── Header.svelte
│   │   │   │   ├── Sidebar.svelte
│   │   │   │   ├── Toast.svelte
│   │   │   │   └── CommandPalette.svelte
│   │   │   └── views/                # 10 core creator studio views
│   │   │       ├── DashboardView.svelte
│   │   │       ├── DiscoverView.svelte
│   │   │       ├── ContentView.svelte
│   │   │       ├── ScriptStudioView.svelte
│   │   │       ├── IdeasView.svelte
│   │   │       ├── AnalyticsView.svelte
│   │   │       ├── CalendarView.svelte
│   │   │       ├── TasksView.svelte
│   │   │       ├── NotesView.svelte
│   │   │       ├── GoalsView.svelte
│   │   │       └── SettingsView.svelte
│   │   ├── stores/
│   │   │   └── appState.svelte.ts    # Global reactive state & module navigation
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interface contracts
│   │   └── utils/
│   │       ├── metrics.ts            # Dynamic streak & number formatting
│   │       └── reveal.ts             # Intersection observer scroll animations
│   ├── app.css                       # Swiss design system & custom CSS utilities
│   ├── App.svelte                    # Root application router
│   └── main.ts                       # Svelte entrypoint
├── index.html                        # HTML entry with Google Fonts
├── package.json
├── svelte.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Getting Started

### 1. Install Node Dependencies
```powershell
npm install
```

### 2. Run Local Development Server
```powershell
npm run dev
```
Open your browser at: **`http://127.0.0.1:5173/`**

### 3. Build Production Bundle
```powershell
npm run build
```
Generates an optimized bundle in the `dist/` folder ready for production deployment.
