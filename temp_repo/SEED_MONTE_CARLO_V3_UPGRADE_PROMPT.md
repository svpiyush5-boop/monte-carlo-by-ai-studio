# SEED INVESTMENTS — MONTE CARLO RETIREMENT PLANNER
## v3.0 Major Upgrade Specification
### UI/UX, Features, Visual & Functional Enhancement Prompt

---

> **Context for the builder:** This document is the complete engineering and design specification for upgrading the existing Seed Investments Monte Carlo Retirement Planner from its current v2 state (visible in provided screenshots) to a flagship v3 product. The v2 tool already has the correct simulation engine (simulation.worker.js is production-ready), the three-bug fixes applied, and a working layout. This upgrade is entirely focused on elevating the experience to match a Bloomberg / Vanguard / Zerodha-level product — with collapsible inputs, premium chart UX, multi-user auth scaffolding, and a design system worthy of a ₹100 Crore positioning. Do NOT rewrite the simulation engine. Build everything around it.

---

## PART 0 — WHAT EXISTS, WHAT STAYS, WHAT CHANGES

### What is working and must be preserved exactly:
- `simulation.worker.js` — the entire simulation engine. Touch nothing inside this file.
- The 4-section form structure (About You / Your Money Today / Returns & Risk / Expenses & Goals)
- The Web Worker integration and loading state
- The KPI strip (4 metrics at top of results)
- The Wealth Journey chart (accumulation + drawdown combined)
- The Retirement Corpus Distribution histogram
- The Plan Viability radial gauge
- The Retirement Phase Drawdown chart
- The 3-Bucket Allocation callout
- The SEBI disclaimer block
- The PDF generation via html2canvas + jsPDF

### What is being replaced / upgraded completely:

| Component | Current state | v3 target |
|---|---|---|
| Left panel | Static, always-expanded form | Collapsible sidebar with accordion sections + panel hide toggle |
| Chart containers | Plain white cards, no chart tags | Modern labelled chart frames with gradient headers, source tags, badge labels |
| Typography | DM Sans / DM Serif — clean but generic | `Clash Display` (headings) + `Satoshi` (body) + `JetBrains Mono` (numbers) |
| KPI strip | Blue gradient bar, flat | Deep navy with subtle dot-grid texture, animated count-up numbers, coloured accent borders per metric |
| Slider inputs | Basic range with pill value | Premium segmented track, animated fill, haptic-style snap feedback |
| Section headers | Grey uppercase labels | Numbered pill badges with section status indicators |
| Chart legend | Default Chart.js legend | Custom floating tag-style legends with coloured swatches and live values |
| Results narrative | Plain paragraph text | Styled callout card with dynamic colour based on success rate |
| Auth | None | Login modal scaffold (UI only, gated by `AUTH_ENABLED` flag — default false) |
| Dark mode | None | Full dark mode toggle persisted in localStorage |
| Panel collapse | None | Sidebar collapse/expand toggle with smooth animation; main area fills full width |
| Advanced section | None | Collapsible "Advanced Assumptions" accordion with 4 extra parameters |
| Scenario save | None | "Save Scenario" button stores up to 3 named scenarios in localStorage |
| Tooltips | Basic `title` attributes | Custom floating tooltip component with rich content |
| Mobile | Basic responsive | Full mobile-first redesign with bottom sheet input panel |

---

## PART 1 — DESIGN SYSTEM v3

### 1.1 — Typography Stack

```html
<!-- Load in <head> — these are the ONLY allowed font families -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Satoshi:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

> **Fallback note:** Clash Display may not load on all CDN configs. If unavailable, substitute `Fraunces` (Google Fonts, serif) for display headings. Never fall back to Inter or system-ui for headings.

```css
:root {
  --font-display:  'Clash Display', 'Fraunces', Georgia, serif;
  --font-body:     'Satoshi', 'DM Sans', system-ui, sans-serif;
  --font-mono:     'JetBrains Mono', 'DM Mono', monospace;

  /* Type scale */
  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 15px;
  --text-lg:   17px;
  --text-xl:   20px;
  --text-2xl:  26px;
  --text-3xl:  34px;
  --text-4xl:  44px;
}
```

**Typography rules:**
- All corpus values, percentages, ages shown in data outputs: `font-family: var(--font-mono)`
- All section headings, page title, KPI labels: `font-family: var(--font-display)`
- All body copy, labels, input text, descriptions: `font-family: var(--font-body)`
- Chart axis labels: `font-family: var(--font-mono); font-size: 11px`
- Never use font-weight 600 or 700 on body text — only on display/mono elements

---

### 1.2 — Colour System (Light + Dark)

```css
:root {
  /* ── Brand palette ── */
  --seed-navy:       #0B2545;   /* primary authority */
  --seed-navy-soft:  #1A3A5C;   /* hover state */
  --seed-teal:       #0D9488;   /* success / optimistic */
  --seed-teal-soft:  #CCFBF1;   /* teal background tint */
  --seed-amber:      #D97706;   /* warning */
  --seed-amber-soft: #FEF3C7;   /* amber background tint */
  --seed-red:        #DC2626;   /* danger / pessimistic */
  --seed-red-soft:   #FEE2E2;   /* red background tint */
  --seed-gold:       #B8860B;   /* accent, bucket highlights */
  --seed-blue:       #2563EB;   /* interactive / CTA */
  --seed-blue-soft:  #EFF6FF;   /* blue background tint */

  /* ── Neutral ramp ── */
  --n-0:   #FFFFFF;
  --n-50:  #F8FAFC;
  --n-100: #F1F5F9;
  --n-150: #E9EFF5;
  --n-200: #E2E8F0;
  --n-300: #CBD5E1;
  --n-400: #94A3B8;
  --n-500: #64748B;
  --n-600: #475569;
  --n-700: #334155;
  --n-800: #1E293B;
  --n-900: #0F172A;

  /* ── Semantic tokens (light mode) ── */
  --bg-page:      var(--n-50);
  --bg-card:      var(--n-0);
  --bg-surface:   var(--n-100);
  --bg-elevated:  var(--n-0);
  --bg-sidebar:   var(--n-0);

  --text-primary:   var(--n-900);
  --text-secondary: var(--n-600);
  --text-muted:     var(--n-400);
  --text-inverse:   var(--n-0);

  --border-subtle:  var(--n-150);
  --border-default: var(--n-200);
  --border-strong:  var(--n-300);

  --shadow-xs: 0 1px 2px rgba(15,23,42,0.04);
  --shadow-sm: 0 2px 8px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04);
  --shadow-md: 0 8px 24px rgba(15,23,42,0.08), 0 2px 8px rgba(15,23,42,0.04);
  --shadow-lg: 0 20px 40px rgba(15,23,42,0.10), 0 4px 12px rgba(15,23,42,0.06);

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* ── Sidebar width ── */
  --sidebar-width: 340px;
  --sidebar-collapsed-width: 0px;
  --sidebar-transition: 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Dark mode overrides ── */
[data-theme="dark"] {
  --bg-page:      #0A0F1E;
  --bg-card:      #111827;
  --bg-surface:   #1A2235;
  --bg-elevated:  #1E2D42;
  --bg-sidebar:   #111827;

  --text-primary:   #F1F5F9;
  --text-secondary: #94A3B8;
  --text-muted:     #475569;

  --border-subtle:  rgba(255,255,255,0.04);
  --border-default: rgba(255,255,255,0.08);
  --border-strong:  rgba(255,255,255,0.14);

  --shadow-xs: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.4);
  --shadow-md: 0 8px 24px rgba(0,0,0,0.5);
  --shadow-lg: 0 20px 40px rgba(0,0,0,0.6);

  --seed-teal-soft:  rgba(13,148,136,0.15);
  --seed-amber-soft: rgba(217,119,6,0.15);
  --seed-red-soft:   rgba(220,38,38,0.15);
  --seed-blue-soft:  rgba(37,99,235,0.15);
}
```

---

### 1.3 — Dark Mode Toggle

```html
<!-- Header right slot -->
<button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode">
  <svg class="icon-sun" .../>  <!-- shown in dark mode -->
  <svg class="icon-moon" .../>  <!-- shown in light mode -->
</button>
```

```javascript
// Theme persistence
const savedTheme = localStorage.getItem('seed-theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

document.getElementById('theme-toggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('seed-theme', next);
});
```

---

## PART 2 — OVERALL LAYOUT v3

### 2.1 — Page Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  TOPBAR (64px)                                                               │
│  [S] Seed Investments  |  Home  Services  Tools  |  [☾] [👤]  [Book →]      │
├──────────────┬───────────────────────────────────────────────────────────────┤
│              │                                                               │
│  LEFT PANEL  │  MAIN CANVAS                                                  │
│  (340px)     │  (flex-1, scrollable)                                         │
│  Collapsible │                                                               │
│  Sticky      │                                                               │
│              │                                                               │
│  [›] toggle  │                                                               │
│              │                                                               │
└──────────────┴───────────────────────────────────────────────────────────────┘
│  FOOTER (48px) — ARN · Disclaimer · © Seed Investments 2026                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 — Layout CSS

```css
.app-shell {
  display: grid;
  grid-template-rows: 64px 1fr 48px;
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-areas:
    "topbar  topbar"
    "sidebar main"
    "footer  footer";
  height: 100vh;
  overflow: hidden;
  background: var(--bg-page);
  transition: grid-template-columns var(--sidebar-transition);
}

/* When sidebar is collapsed */
.app-shell.sidebar-collapsed {
  grid-template-columns: 52px 1fr;
}

.app-topbar  { grid-area: topbar;  }
.app-sidebar { grid-area: sidebar; overflow-y: auto; overflow-x: hidden; }
.app-main    { grid-area: main;    overflow-y: auto; }
.app-footer  { grid-area: footer;  }

/* Mobile: stack vertically */
@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
    grid-template-rows: 56px 1fr auto 52px;
    grid-template-areas:
      "topbar"
      "main"
      "sidebar"
      "footer";
    overflow: auto;
    height: auto;
  }
  .app-sidebar {
    position: fixed;
    inset: 0;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform var(--sidebar-transition);
    width: min(340px, 90vw);
  }
  .app-sidebar.mobile-open { transform: translateX(0); }
}
```

---

## PART 3 — TOPBAR

```html
<header class="app-topbar">
  <div class="topbar-inner">

    <!-- Left: Brand -->
    <div class="brand">
      <div class="brand-mark">S</div>
      <div class="brand-text">
        <span class="brand-name">Seed Investments</span>
        <span class="brand-tag">AMFI-Registered · ARN: XXXXXXX</span>
      </div>
    </div>

    <!-- Centre: Nav (desktop only) -->
    <nav class="topbar-nav" aria-label="Main navigation">
      <a href="/">Home</a>
      <a href="/services">Services</a>
      <a href="/tools" class="active" aria-current="page">Tools</a>
    </nav>

    <!-- Right: Controls -->
    <div class="topbar-actions">
      <button class="icon-btn" id="theme-toggle" title="Toggle dark mode">
        <!-- SVG moon/sun icon -->
      </button>
      <!-- AUTH_ENABLED=false: hide user button -->
      <button class="icon-btn" id="user-btn" style="display:none" title="Account">
        <!-- SVG user icon -->
      </button>
      <a href="/clarity-session" class="btn-cta">Book Clarity Session →</a>
    </div>

  </div>
</header>
```

```css
.app-topbar {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-default);
  display: flex; align-items: center;
  padding: 0 1.5rem;
  z-index: 40;
  position: relative;
}
.topbar-inner {
  width: 100%; display: flex; align-items: center;
  gap: 2rem; justify-content: space-between;
}
.brand { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.brand-mark {
  width: 34px; height: 34px; border-radius: 8px;
  background: var(--seed-navy);
  color: white; display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 17px; font-weight: 600;
}
.brand-name {
  font-family: var(--font-display);
  font-size: 16px; font-weight: 600;
  color: var(--seed-navy); display: block; line-height: 1;
}
[data-theme="dark"] .brand-name { color: var(--text-primary); }

.brand-tag {
  font-size: 10px; color: var(--text-muted);
  letter-spacing: 0.04em; display: block; margin-top: 2px;
}
.topbar-nav { display: flex; gap: 28px; }
.topbar-nav a {
  font-size: 14px; color: var(--text-secondary);
  text-decoration: none; font-weight: 500;
  transition: color 0.15s;
}
.topbar-nav a:hover, .topbar-nav a.active { color: var(--text-primary); }
.topbar-nav a.active {
  border-bottom: 2px solid var(--seed-blue);
  padding-bottom: 2px;
}
.topbar-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.icon-btn {
  width: 36px; height: 36px; border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary); transition: background 0.15s, color 0.15s;
}
.icon-btn:hover { background: var(--bg-surface); color: var(--text-primary); }
.btn-cta {
  padding: 8px 16px; border-radius: var(--radius-sm);
  background: var(--seed-navy); color: white;
  font-size: 13px; font-weight: 600; text-decoration: none;
  font-family: var(--font-body);
  transition: background 0.15s, transform 0.1s;
  white-space: nowrap;
}
.btn-cta:hover { background: var(--seed-navy-soft); }

@media (max-width: 900px) {
  .topbar-nav { display: none; }
  .brand-tag  { display: none; }
}
```

---

## PART 4 — LEFT PANEL: COMPLETE REDESIGN

The left panel is the most critical upgrade. It must:
1. Have a collapse toggle at the top — when collapsed, the panel shrinks to a 52px icon rail
2. Have numbered, collapsible accordion sections
3. Have premium input components (not generic browser defaults)
4. Show live feedback as values change
5. Have a sticky "Chart My Future" button pinned at the bottom

### 4.1 — Panel Structure HTML

```html
<aside class="app-sidebar" id="sidebar">

  <!-- Collapse toggle — always visible -->
  <div class="sidebar-toggle-rail">
    <button class="sidebar-toggle-btn" id="sidebar-toggle" title="Collapse panel">
      <svg class="toggle-icon" width="16" height="16" viewBox="0 0 16 16">
        <!-- Left arrow chevron — JS toggles rotation to right arrow when collapsed -->
        <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
    </button>
    <!-- Shown ONLY when collapsed: vertical label -->
    <span class="sidebar-collapsed-label">INPUTS</span>
  </div>

  <!-- All form content — hidden when collapsed -->
  <div class="sidebar-content" id="sidebar-content">

    <!-- Tool title -->
    <div class="sidebar-header">
      <h1 class="sidebar-title">Retirement Planner</h1>
      <p class="sidebar-subtitle">10,000 Monte Carlo simulations</p>
    </div>

    <form id="retirement-form" novalidate>

      <!-- ── SECTION 1: ABOUT YOU ── -->
      <div class="accordion-section open" data-section="1">
        <button type="button" class="accordion-header" aria-expanded="true">
          <div class="accordion-label">
            <span class="section-num">1</span>
            <span class="section-title">About You</span>
          </div>
          <div class="accordion-right">
            <span class="section-status" id="status-1">✓</span>
            <svg class="accordion-chevron" .../>
          </div>
        </button>
        <div class="accordion-body">

          <div class="input-field">
            <label class="field-label" for="clientName">Client Name</label>
            <input type="text" id="clientName" class="field-input"
                   placeholder="e.g. Ananya Sharma" autocomplete="name">
          </div>

          <!-- Age group: 3 in a row -->
          <div class="field-row-3">
            <div class="input-field">
              <label class="field-label" for="currentAge">Current Age</label>
              <div class="num-input-wrap">
                <button type="button" class="num-btn" data-target="currentAge" data-delta="-1">−</button>
                <input type="number" id="currentAge" class="field-input num-input"
                       value="33" min="18" max="79">
                <button type="button" class="num-btn" data-target="currentAge" data-delta="1">+</button>
              </div>
            </div>
            <div class="input-field">
              <label class="field-label" for="retirementAge">Retire At</label>
              <div class="num-input-wrap">
                <button type="button" class="num-btn" data-target="retirementAge" data-delta="-1">−</button>
                <input type="number" id="retirementAge" class="field-input num-input"
                       value="60" min="30" max="80">
                <button type="button" class="num-btn" data-target="retirementAge" data-delta="1">+</button>
              </div>
            </div>
            <div class="input-field">
              <label class="field-label" for="lifeExpectancy">Plan Until</label>
              <div class="num-input-wrap">
                <button type="button" class="num-btn" data-target="lifeExpectancy" data-delta="-1">−</button>
                <input type="number" id="lifeExpectancy" class="field-input num-input"
                       value="85" min="50" max="100">
                <button type="button" class="num-btn" data-target="lifeExpectancy" data-delta="1">+</button>
              </div>
            </div>
          </div>

          <!-- Live age timeline strip -->
          <div class="age-timeline" id="age-timeline">
            <!-- JS renders: [Age 33] ──── 27 yrs ──── [Retire 60] ──── 25 yrs ──── [85] -->
          </div>

        </div>
      </div>

      <!-- ── SECTION 2: YOUR MONEY TODAY ── -->
      <div class="accordion-section open" data-section="2">
        <button type="button" class="accordion-header" aria-expanded="true">
          <div class="accordion-label">
            <span class="section-num">2</span>
            <span class="section-title">Your Money Today</span>
          </div>
          <div class="accordion-right">
            <span class="section-status" id="status-2"></span>
            <svg class="accordion-chevron" .../>
          </div>
        </button>
        <div class="accordion-body">

          <div class="input-field">
            <label class="field-label" for="currentSavings">
              Current Invested Corpus
              <span class="field-tooltip" data-tip="Total value of your existing mutual funds, stocks, EPF, PPF, NPS etc.">ⓘ</span>
            </label>
            <div class="currency-input-wrap">
              <span class="currency-prefix">₹</span>
              <input type="number" id="currentSavings" class="field-input currency-input"
                     value="1000000" min="0" step="10000">
            </div>
            <div class="field-hint" id="savings-display">₹10 Lakhs</div>
          </div>

          <div class="input-field">
            <label class="field-label" for="monthlySavings">Monthly SIP</label>
            <div class="currency-input-wrap">
              <span class="currency-prefix">₹</span>
              <input type="number" id="monthlySavings" class="field-input currency-input"
                     value="35000" min="500" step="500">
            </div>
            <div class="field-hint" id="sip-annual-display">₹4.2L / year</div>
          </div>

          <div class="input-field">
            <label class="field-label" for="sipStepUp">
              Annual SIP Step-Up
              <span class="field-tooltip" data-tip="Increase your SIP by this % each year as your income grows. Even 5% step-up can add 40-60% to your final corpus over 25 years.">ⓘ</span>
            </label>
            <div class="slider-field">
              <div class="slider-track-wrap">
                <div class="slider-fill" id="sipStepUp-fill" style="width: 25%"></div>
                <input type="range" id="sipStepUp" min="0" max="20" value="5" step="1"
                       class="field-slider">
              </div>
              <span class="slider-val" id="sipStepUpVal">5%</span>
            </div>
            <div class="field-hint" id="stepup-hint">SIP will grow to ₹1,14,674/mo by retirement</div>
          </div>

        </div>
      </div>

      <!-- ── SECTION 3: RETURNS & RISK ── -->
      <div class="accordion-section open" data-section="3">
        <button type="button" class="accordion-header" aria-expanded="true">
          <div class="accordion-label">
            <span class="section-num">3</span>
            <span class="section-title">Returns & Risk</span>
          </div>
          <div class="accordion-right">
            <svg class="accordion-chevron" .../>
          </div>
        </button>
        <div class="accordion-body">

          <!-- Risk preset tabs -->
          <div class="risk-presets">
            <button type="button" class="risk-btn" data-preset="conservative">Conservative</button>
            <button type="button" class="risk-btn active" data-preset="balanced">Balanced</button>
            <button type="button" class="risk-btn" data-preset="aggressive">Aggressive</button>
          </div>

          <div class="input-field">
            <label class="field-label" for="expectedReturn">Pre-Retirement Return (%)</label>
            <div class="slider-field">
              <div class="slider-track-wrap">
                <div class="slider-fill" id="expectedReturn-fill"></div>
                <input type="range" id="expectedReturn" min="1" max="20" value="12" step="1" class="field-slider">
              </div>
              <span class="slider-val" id="expectedReturnVal">12%</span>
            </div>
          </div>

          <div class="input-field">
            <label class="field-label" for="preRetirementVol">
              Pre-Retirement Volatility (σ)
              <span class="field-tooltip" data-tip="Standard deviation of annual returns. Equity-heavy: 18-22%. Balanced: 12-15%. Debt-heavy: 5-8%. Higher volatility = wider outcome range.">ⓘ</span>
            </label>
            <div class="slider-field">
              <div class="slider-track-wrap">
                <div class="slider-fill" id="preRetirementVol-fill"></div>
                <input type="range" id="preRetirementVol" min="3" max="28" value="15" step="1" class="field-slider">
              </div>
              <span class="slider-val" id="preRetirementVolVal">15%</span>
            </div>
          </div>

          <div class="input-field">
            <label class="field-label" for="postRetirementReturn">Post-Retirement Return (%)</label>
            <div class="slider-field">
              <div class="slider-track-wrap">
                <div class="slider-fill" id="postRetirementReturn-fill"></div>
                <input type="range" id="postRetirementReturn" min="1" max="15" value="7" step="1" class="field-slider">
              </div>
              <span class="slider-val" id="postRetirementReturnVal">7%</span>
            </div>
          </div>

          <div class="input-field">
            <label class="field-label" for="postRetirementVol">
              Post-Retirement Volatility (σ)
              <span class="field-tooltip" data-tip="Typically lower as you shift to conservative allocation. Recommended: 6-10% for balanced post-retirement portfolio.">ⓘ</span>
            </label>
            <div class="slider-field">
              <div class="slider-track-wrap">
                <div class="slider-fill" id="postRetirementVol-fill"></div>
                <input type="range" id="postRetirementVol" min="2" max="15" value="8" step="1" class="field-slider">
              </div>
              <span class="slider-val" id="postRetirementVolVal">8%</span>
            </div>
          </div>

        </div>
      </div>

      <!-- ── SECTION 4: EXPENSES & GOALS ── -->
      <div class="accordion-section open" data-section="4">
        <button type="button" class="accordion-header" aria-expanded="true">
          <div class="accordion-label">
            <span class="section-num">4</span>
            <span class="section-title">Expenses & Goals</span>
          </div>
          <div class="accordion-right">
            <svg class="accordion-chevron" .../>
          </div>
        </button>
        <div class="accordion-body">

          <div class="input-field">
            <label class="field-label" for="monthlyExpenses">
              Monthly Lifestyle Need (today's ₹)
              <span class="field-tooltip" data-tip="Enter in today's rupees. We automatically inflate this to retirement date.">ⓘ</span>
            </label>
            <div class="currency-input-wrap">
              <span class="currency-prefix">₹</span>
              <input type="number" id="monthlyExpenses" class="field-input currency-input"
                     value="75000" min="5000" step="1000">
            </div>
            <!-- BUG #1 FIX display -->
            <div class="field-hint inflation-hint" id="expense-inflation-hint">
              ₹75k today → <strong>₹1,94,822/mo</strong> at retirement (5% inflation)
            </div>
          </div>

          <div class="input-field">
            <label class="field-label" for="inflation">Assumed Inflation (%)</label>
            <div class="slider-field">
              <div class="slider-track-wrap">
                <div class="slider-fill" id="inflation-fill"></div>
                <input type="range" id="inflation" min="2" max="12" value="5" step="1" class="field-slider">
              </div>
              <span class="slider-val" id="inflationVal">5%</span>
            </div>
          </div>

        </div>
      </div>

      <!-- ── SECTION 5: ADVANCED (COLLAPSED BY DEFAULT) ── -->
      <div class="accordion-section collapsed" data-section="5">
        <button type="button" class="accordion-header" aria-expanded="false">
          <div class="accordion-label">
            <span class="section-num advanced">⚙</span>
            <span class="section-title">Advanced Assumptions</span>
          </div>
          <div class="accordion-right">
            <span class="badge-new">Advanced</span>
            <svg class="accordion-chevron" .../>
          </div>
        </button>
        <div class="accordion-body" style="display:none">

          <div class="input-field">
            <label class="field-label" for="numSimulations">
              Number of Simulations
              <span class="field-tooltip" data-tip="More simulations = more accurate results but slower. 10,000 is the gold standard. 5,000 is faster for exploration.">ⓘ</span>
            </label>
            <select id="numSimulations" class="field-select">
              <option value="5000">5,000 (Fast)</option>
              <option value="10000" selected>10,000 (Standard)</option>
              <option value="20000">20,000 (High Precision)</option>
            </select>
          </div>

          <div class="input-field">
            <label class="field-label" for="additionalLumpsum">
              Planned Lumpsum Investment (₹)
              <span class="field-tooltip" data-tip="A one-time future investment you plan to make (e.g. inheritance, property sale). Enter 0 if none.">ⓘ</span>
            </label>
            <div class="currency-input-wrap">
              <span class="currency-prefix">₹</span>
              <input type="number" id="additionalLumpsum" class="field-input currency-input"
                     value="0" min="0" step="100000">
            </div>
            <div class="field-hint">Year of lumpsum:
              <input type="number" id="lumpsumYear" style="width:60px; display:inline;"
                     value="5" min="1" max="40"> years from now
            </div>
          </div>

          <div class="input-field">
            <label class="field-label" for="partTimeIncome">
              Part-Time Income After Retirement (₹/mo)
              <span class="field-tooltip" data-tip="Consulting, freelance, rental, or other income in early retirement that reduces corpus withdrawal pressure.">ⓘ</span>
            </label>
            <div class="currency-input-wrap">
              <span class="currency-prefix">₹</span>
              <input type="number" id="partTimeIncome" class="field-input currency-input"
                     value="0" min="0" step="5000">
            </div>
            <div class="field-hint">Until age:
              <input type="number" id="partTimeUntilAge" style="width:60px; display:inline;"
                     value="70" min="50" max="90"> years
            </div>
          </div>

          <div class="input-field">
            <label class="field-label" for="taxDragPct">
              Annual Tax & Expense Drag (%)
              <span class="field-tooltip" data-tip="Fund expense ratios + estimated LTCG impact. Typical direct fund + LTCG drag: 0.3-0.6%. Regular funds: 1.0-1.5%.">ⓘ</span>
            </label>
            <div class="slider-field">
              <div class="slider-track-wrap">
                <div class="slider-fill" id="taxDragPct-fill"></div>
                <input type="range" id="taxDragPct" min="0" max="3" value="0.5" step="0.1" class="field-slider">
              </div>
              <span class="slider-val" id="taxDragPctVal">0.5%</span>
            </div>
          </div>

        </div>
      </div>

      <!-- ── FORM DISCLAIMER ── -->
      <div class="form-disclaimer-mini">
        By continuing, you confirm this is illustrative only and not personalised financial advice.
      </div>

    </form>

    <!-- ── STICKY BOTTOM CTA ── -->
    <div class="sidebar-cta-area">
      <div class="scenario-row">
        <button type="button" class="btn-scenario" id="save-scenario-btn" title="Save scenario">
          Save scenario
        </button>
        <span class="scenario-count" id="scenario-count"></span>
      </div>
      <button type="submit" form="retirement-form" id="run-button" class="btn-run">
        Chart My Future →
      </button>
    </div>

  </div>

  <!-- ── COLLAPSED ICON RAIL (shown only when collapsed) ── -->
  <div class="sidebar-icon-rail" id="sidebar-icon-rail" style="display:none">
    <button class="rail-icon-btn" onclick="expandSidebar()" title="Expand inputs">
      <!-- Input sliders SVG icon -->
    </button>
    <button class="rail-icon-btn" onclick="document.getElementById('run-button').click()" title="Re-run simulation">
      <!-- Play SVG icon -->
    </button>
  </div>

</aside>
```

---

### 4.2 — Accordion Behaviour

```javascript
// ── Accordion toggle ─────────────────────────────────────────────────────────
document.querySelectorAll('.accordion-header').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.closest('.accordion-section');
    const body    = section.querySelector('.accordion-body');
    const isOpen  = section.classList.contains('open');

    if (isOpen) {
      section.classList.remove('open');
      section.classList.add('collapsed');
      btn.setAttribute('aria-expanded', 'false');
      // Animate close
      body.style.maxHeight = body.scrollHeight + 'px';
      requestAnimationFrame(() => { body.style.maxHeight = '0'; });
      setTimeout(() => { body.style.display = 'none'; }, 280);
    } else {
      section.classList.remove('collapsed');
      section.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      body.style.display = 'block';
      body.style.maxHeight = '0';
      requestAnimationFrame(() => { body.style.maxHeight = body.scrollHeight + 'px'; });
      setTimeout(() => { body.style.maxHeight = 'none'; }, 280);
    }
  });
});

// ── Sidebar collapse/expand ───────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const sidebarContent = document.getElementById('sidebar-content');
const sidebarIconRail = document.getElementById('sidebar-icon-rail');
const toggleBtn = document.getElementById('sidebar-toggle');

function collapseSidebar() {
  sidebar.classList.add('collapsed');
  document.querySelector('.app-shell').classList.add('sidebar-collapsed');
  sidebarContent.style.opacity = '0';
  setTimeout(() => {
    sidebarContent.style.display = 'none';
    sidebarIconRail.style.display = 'flex';
  }, 200);
  toggleBtn.querySelector('.toggle-icon').style.transform = 'rotate(180deg)';
  localStorage.setItem('seed-sidebar', 'collapsed');
}

function expandSidebar() {
  sidebar.classList.remove('collapsed');
  document.querySelector('.app-shell').classList.remove('sidebar-collapsed');
  sidebarIconRail.style.display = 'none';
  sidebarContent.style.display = 'flex';
  setTimeout(() => { sidebarContent.style.opacity = '1'; }, 20);
  toggleBtn.querySelector('.toggle-icon').style.transform = 'rotate(0deg)';
  localStorage.setItem('seed-sidebar', 'expanded');
}

document.getElementById('sidebar-toggle').addEventListener('click', () => {
  sidebar.classList.contains('collapsed') ? expandSidebar() : collapseSidebar();
});

// Restore from localStorage
if (localStorage.getItem('seed-sidebar') === 'collapsed') collapseSidebar();
```

---

### 4.3 — Premium Slider CSS

```css
/* Slider track + fill + thumb */
.slider-field {
  display: flex; align-items: center; gap: 10px; margin-top: 6px;
}
.slider-track-wrap {
  flex: 1; height: 6px; background: var(--n-200);
  border-radius: var(--radius-full); position: relative; cursor: pointer;
}
[data-theme="dark"] .slider-track-wrap { background: var(--n-700); }
.slider-fill {
  position: absolute; left: 0; top: 0; height: 100%;
  background: linear-gradient(90deg, var(--seed-blue), var(--seed-teal));
  border-radius: var(--radius-full); pointer-events: none;
  transition: width 0.1s;
}
.field-slider {
  position: absolute; inset: 0; opacity: 0;
  width: 100%; height: 24px; margin-top: -9px;
  cursor: pointer; -webkit-appearance: none;
}
.slider-val {
  min-width: 46px; text-align: center;
  font-family: var(--font-mono); font-size: 13px; font-weight: 500;
  color: var(--seed-navy); background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm); padding: 3px 8px;
}
[data-theme="dark"] .slider-val { color: var(--text-primary); }

/* Update fill width from JS */
/* Usage: document.getElementById('expectedReturn-fill').style.width = ((val-min)/(max-min)*100) + '%'; */
```

---

### 4.4 — Section Number Badges

```css
.accordion-section {
  border-bottom: 1px solid var(--border-subtle);
}
.accordion-header {
  width: 100%; display: flex; align-items: center;
  justify-content: space-between; padding: 14px 16px;
  background: transparent; border: none; cursor: pointer;
  text-align: left; transition: background 0.15s;
}
.accordion-header:hover { background: var(--bg-surface); }
.accordion-label { display: flex; align-items: center; gap: 10px; }
.section-num {
  width: 22px; height: 22px; border-radius: var(--radius-full);
  background: var(--seed-navy); color: white;
  font-size: 11px; font-weight: 700; font-family: var(--font-mono);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.section-num.advanced { background: var(--n-300); color: var(--n-700); font-size: 13px; }
[data-theme="dark"] .section-num.advanced { background: var(--n-700); color: var(--n-300); }
.section-title {
  font-family: var(--font-display); font-size: 14px; font-weight: 500;
  color: var(--text-primary); letter-spacing: 0.01em;
}
.accordion-right { display: flex; align-items: center; gap: 8px; }
.section-status { font-size: 11px; color: var(--seed-teal); font-weight: 600; }
.badge-new {
  font-size: 10px; font-weight: 600; padding: 2px 8px;
  border-radius: var(--radius-full); letter-spacing: 0.05em;
  background: var(--seed-blue-soft); color: var(--seed-blue);
}
[data-theme="dark"] .badge-new { background: rgba(37,99,235,0.2); color: #93C5FD; }
.accordion-chevron {
  color: var(--text-muted); transition: transform 0.25s;
}
.accordion-section.collapsed .accordion-chevron { transform: rotate(-90deg); }
```

---

### 4.5 — Stepper Inputs (age fields)

```css
.num-input-wrap {
  display: flex; align-items: center;
  border: 1px solid var(--border-default); border-radius: var(--radius-sm);
  overflow: hidden; height: 38px;
}
.num-btn {
  width: 32px; height: 100%; flex-shrink: 0;
  background: var(--bg-surface); border: none; cursor: pointer;
  font-size: 16px; color: var(--text-secondary); font-weight: 400;
  transition: background 0.12s;
  display: flex; align-items: center; justify-content: center;
}
.num-btn:hover { background: var(--n-200); color: var(--text-primary); }
[data-theme="dark"] .num-btn:hover { background: var(--n-700); }
.num-input {
  flex: 1; border: none; text-align: center;
  font-family: var(--font-mono); font-size: 15px; font-weight: 500;
  background: transparent; color: var(--text-primary);
  -moz-appearance: textfield;
}
.num-input::-webkit-outer-spin-button,
.num-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
```

---

### 4.6 — Age Timeline Visualiser

```javascript
function renderAgeTimeline(currentAge, retirementAge, lifeExpectancy) {
  const yearsAccum  = retirementAge - currentAge;
  const yearsRetire = lifeExpectancy - retirementAge;
  const totalYears  = lifeExpectancy - currentAge;
  const accumPct    = (yearsAccum  / totalYears * 100).toFixed(0);

  document.getElementById('age-timeline').innerHTML = `
    <div class="timeline-bar">
      <div class="timeline-accum" style="width:${accumPct}%">
        <span class="timeline-label">Accumulation · ${yearsAccum}y</span>
      </div>
      <div class="timeline-retire" style="width:${100-accumPct}%">
        <span class="timeline-label">Retirement · ${yearsRetire}y</span>
      </div>
    </div>
    <div class="timeline-markers">
      <span>Age ${currentAge}</span>
      <span>Age ${retirementAge}</span>
      <span>Age ${lifeExpectancy}</span>
    </div>
  `;
}
```

```css
.age-timeline { margin: 12px 0 4px; }
.timeline-bar {
  display: flex; height: 8px; border-radius: var(--radius-full);
  overflow: hidden; gap: 2px;
}
.timeline-accum {
  background: var(--seed-blue); border-radius: var(--radius-full) 0 0 var(--radius-full);
  position: relative;
}
.timeline-retire {
  background: var(--seed-teal); border-radius: 0 var(--radius-full) var(--radius-full) 0;
  flex: 1;
}
.timeline-label {
  font-size: 10px; color: white; white-space: nowrap;
  position: absolute; bottom: -18px; left: 50%;
  transform: translateX(-50%); display: none;
}
.timeline-markers {
  display: flex; justify-content: space-between;
  margin-top: 6px; font-size: 11px; font-family: var(--font-mono);
  color: var(--text-muted);
}
```

---

### 4.7 — Sidebar CTA area

```css
.sidebar-cta-area {
  padding: 12px 16px 16px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-sidebar);
  position: sticky; bottom: 0;
}
.scenario-row {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 10px;
}
.btn-scenario {
  flex: 1; height: 36px; border-radius: var(--radius-sm);
  border: 1px solid var(--border-default); background: transparent;
  font-size: 12px; font-weight: 500; color: var(--text-secondary);
  cursor: pointer; transition: background 0.15s;
}
.btn-scenario:hover { background: var(--bg-surface); color: var(--text-primary); }
.scenario-count { font-size: 11px; color: var(--text-muted); }
.btn-run {
  width: 100%; height: 48px;
  background: var(--seed-navy); color: white;
  border: none; border-radius: var(--radius-md);
  font-family: var(--font-display); font-size: 16px; font-weight: 600;
  cursor: pointer; letter-spacing: 0.02em;
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
  position: relative;
}
.btn-run:hover {
  background: var(--seed-navy-soft);
  box-shadow: 0 4px 12px rgba(11,37,69,0.25);
}
.btn-run:active { transform: scale(0.99); }
.btn-run.loading {
  pointer-events: none;
  background: var(--seed-navy-soft);
}
/* Loading spinner inside button */
.btn-run.loading::after {
  content: '';
  position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }
```

---

## PART 5 — MAIN CANVAS: KPI STRIP REDESIGN

### 5.1 — KPI Strip HTML

```html
<div class="kpi-strip" id="kpi-strip">
  <!-- Left accent bar changes colour based on success rate -->
  <div class="kpi-accent-bar" id="kpi-accent"></div>

  <div class="kpi-item" data-metric="corpus">
    <div class="kpi-label">CORPUS AT RETIREMENT</div>
    <div class="kpi-value" id="kpi-corpus">—</div>
    <div class="kpi-sub" id="kpi-corpus-range">p10 – p90 range</div>
  </div>

  <div class="kpi-divider"></div>

  <div class="kpi-item" data-metric="success">
    <div class="kpi-label">PROBABILITY OF SUCCESS</div>
    <div class="kpi-value kpi-dynamic" id="kpi-success">—</div>
    <div class="kpi-sub" id="kpi-success-label">Plan viability</div>
  </div>

  <div class="kpi-divider"></div>

  <div class="kpi-item" data-metric="age">
    <div class="kpi-label">MEDIAN AGE CORPUS LASTS</div>
    <div class="kpi-value" id="kpi-age">—</div>
    <div class="kpi-sub" id="kpi-age-sub">median simulation</div>
  </div>

  <div class="kpi-divider"></div>

  <div class="kpi-item" data-metric="expense">
    <div class="kpi-label">MONTHLY NEED AT RETIREMENT</div>
    <div class="kpi-value" id="kpi-expense">—</div>
    <div class="kpi-sub">inflation-adjusted</div>
  </div>
</div>
```

### 5.2 — KPI Strip CSS (premium dot-grid texture)

```css
.kpi-strip {
  display: flex; align-items: stretch;
  background: var(--seed-navy);
  border-radius: var(--radius-lg);
  margin: 1.5rem 1.5rem 0;
  overflow: hidden;
  position: relative;

  /* Subtle dot-grid texture overlay */
  background-image:
    radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size: 20px 20px;
}
.kpi-accent-bar {
  width: 4px; flex-shrink: 0;
  background: var(--seed-teal); /* JS updates colour based on success rate */
  transition: background 0.4s ease;
}
.kpi-item {
  flex: 1; padding: 1.25rem 1.5rem;
  display: flex; flex-direction: column; justify-content: center;
}
.kpi-label {
  font-size: 10px; letter-spacing: 0.1em; font-weight: 600;
  color: rgba(255,255,255,0.4); font-family: var(--font-body);
  margin-bottom: 6px; text-transform: uppercase;
}
.kpi-value {
  font-family: var(--font-display); font-size: 2rem;
  color: white; line-height: 1; font-weight: 400;
  transition: color 0.4s;
  /* Count-up animation via JS */
}
.kpi-dynamic {
  /* colour set by JS based on success rate */
}
.kpi-sub {
  font-size: 11px; color: rgba(255,255,255,0.35);
  margin-top: 4px; font-family: var(--font-body);
}
.kpi-divider {
  width: 1px; background: rgba(255,255,255,0.1);
  margin: 1rem 0; flex-shrink: 0;
}

/* Success rate colour mapping */
.kpi-dynamic.rate-excellent { color: #6EE7B7; }
.kpi-dynamic.rate-good      { color: #86EFAC; }
.kpi-dynamic.rate-moderate  { color: #FDE68A; }
.kpi-dynamic.rate-poor      { color: #FCA5A5; }
.kpi-dynamic.rate-critical  { color: #F87171; }

/* Responsive */
@media (max-width: 900px) {
  .kpi-strip { flex-wrap: wrap; margin: 1rem; }
  .kpi-item { flex: calc(50% - 1px); }
  .kpi-divider:nth-child(4) { display: none; }
  .kpi-value { font-size: 1.5rem; }
}
@media (max-width: 480px) {
  .kpi-item { flex: 100%; }
  .kpi-divider { display: none; }
}
```

### 5.3 — Count-up animation for KPI numbers

```javascript
function animateCountUp(elementId, targetValue, prefix = '', suffix = '', duration = 1200) {
  const el = document.getElementById(elementId);
  const startTime = performance.now();
  const startValue = 0;

  function update(currentTime) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = startValue + (targetValue - startValue) * eased;
    el.textContent = prefix + formatDisplayValue(current) + suffix;
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = prefix + formatDisplayValue(targetValue) + suffix;
  }
  requestAnimationFrame(update);
}
```

---

## PART 6 — CHART CONTAINERS: MODERN CHART TAG DESIGN

Every chart must be wrapped in a `chart-frame` component with a header that includes:
- Chart title (display font)
- Chart subtitle/description
- Source badge (bottom right): "Monte Carlo · 10,000 sims"
- Action buttons (right of header): Compare, Export
- Modern coloured legend tags (not default Chart.js legend)

### 6.1 — Chart Frame HTML Template

```html
<div class="chart-frame" id="chart-journey">
  <div class="chart-frame-header">
    <div class="chart-frame-titles">
      <h2 class="chart-title">Wealth Journey & Projection</h2>
      <p class="chart-desc">Accumulation and drawdown phases · 10,000 simulations</p>
    </div>
    <div class="chart-frame-actions">
      <button class="chart-action-btn" id="btn-compare">
        <svg .../>  Compare
      </button>
      <button class="chart-action-btn" id="btn-export">
        <svg .../>  PDF Report
      </button>
    </div>
  </div>

  <!-- Custom legend tags — NOT Chart.js default legend -->
  <div class="chart-legend-row">
    <div class="legend-tag legend-optimistic">
      <span class="legend-dot"></span>
      Optimistic <span class="legend-val" id="legend-optimistic-val">90th %ile</span>
    </div>
    <div class="legend-tag legend-median">
      <span class="legend-dot"></span>
      Median <span class="legend-val" id="legend-median-val">50th %ile</span>
    </div>
    <div class="legend-tag legend-pessimistic">
      <span class="legend-dot"></span>
      Pessimistic <span class="legend-val" id="legend-pessimistic-val">10th %ile</span>
    </div>
    <div class="legend-tag legend-retirement">
      <span class="legend-dash"></span>
      Retirement date
    </div>
  </div>

  <!-- Canvas -->
  <div class="chart-canvas-wrap" style="height: 380px;">
    <canvas id="withdrawal-chart"></canvas>
  </div>

  <!-- Source badge -->
  <div class="chart-source-row">
    <span class="chart-source-badge">Monte Carlo Simulation</span>
    <span class="chart-source-badge">10,000 paths</span>
    <span class="chart-source-badge">Seed Investments v3.0</span>
  </div>
</div>
```

### 6.2 — Chart Frame CSS

```css
.chart-frame {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 0;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.5rem;
  transition: box-shadow 0.2s;
}
.chart-frame:hover { box-shadow: var(--shadow-md); }

.chart-frame-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 1.25rem 1.5rem 0;
  gap: 1rem;
}
.chart-title {
  font-family: var(--font-display); font-size: 18px; font-weight: 500;
  color: var(--text-primary); margin: 0 0 4px; line-height: 1.2;
}
.chart-desc {
  font-size: 12px; color: var(--text-muted); margin: 0; line-height: 1.4;
}
.chart-frame-actions {
  display: flex; gap: 8px; flex-shrink: 0; align-items: flex-start;
}
.chart-action-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: var(--radius-sm);
  border: 1px solid var(--border-default); background: transparent;
  font-size: 12px; font-weight: 500; color: var(--text-secondary);
  cursor: pointer; transition: background 0.15s, color 0.15s;
  font-family: var(--font-body);
}
.chart-action-btn:hover {
  background: var(--bg-surface); color: var(--text-primary);
}

/* Legend tags */
.chart-legend-row {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding: 10px 1.5rem 0;
}
.legend-tag {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: var(--radius-full);
  border: 1px solid var(--border-default);
  font-size: 12px; font-weight: 500; color: var(--text-secondary);
  background: var(--bg-surface);
  font-family: var(--font-body);
}
.legend-tag:hover { border-color: var(--border-strong); color: var(--text-primary); }
.legend-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.legend-dash {
  width: 16px; height: 2px; border-top: 2px dashed; flex-shrink: 0;
}
.legend-val { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }

/* Colour coding */
.legend-optimistic  .legend-dot { background: var(--seed-teal); }
.legend-median      .legend-dot { background: var(--seed-blue); }
.legend-pessimistic .legend-dot { background: var(--seed-red); }
.legend-retirement  .legend-dash { border-color: var(--n-400); }

/* Canvas wrapper */
.chart-canvas-wrap {
  padding: 1rem 1.5rem;
  position: relative;
}
.chart-canvas-wrap canvas { max-height: 100%; }

/* Source badges */
.chart-source-row {
  display: flex; gap: 8px; padding: 0.75rem 1.5rem;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}
.chart-source-badge {
  font-size: 10px; letter-spacing: 0.05em;
  color: var(--text-muted); font-family: var(--font-mono);
  padding: 2px 8px; border-radius: var(--radius-full);
  background: var(--bg-card); border: 1px solid var(--border-subtle);
}
```

---

## PART 7 — CHARTS: CONFIGURATION UPGRADES

### 7.1 — Global Chart.js defaults (set once at top of script)

```javascript
// Set after Chart.js loads
Chart.defaults.font.family = "'JetBrains Mono', monospace";
Chart.defaults.font.size   = 11;
Chart.defaults.color       = getComputedStyle(document.documentElement)
                               .getPropertyValue('--text-muted').trim() || '#94A3B8';
Chart.defaults.plugins.legend.display = false; // always use custom legends
Chart.defaults.plugins.tooltip.backgroundColor = '#0B2545';
Chart.defaults.plugins.tooltip.titleColor       = 'rgba(255,255,255,0.7)';
Chart.defaults.plugins.tooltip.bodyColor        = 'white';
Chart.defaults.plugins.tooltip.padding          = 12;
Chart.defaults.plugins.tooltip.cornerRadius     = 8;
Chart.defaults.plugins.tooltip.displayColors    = true;
Chart.defaults.plugins.tooltip.boxWidth         = 10;
Chart.defaults.plugins.tooltip.boxHeight        = 10;
Chart.defaults.scale.grid.color                 = 'rgba(148,163,184,0.1)';
Chart.defaults.scale.border.dash                = [4, 4];
```

### 7.2 — Journey Chart: add confidence band fill

```javascript
// Journey chart datasets — add shaded band between p25 and p75
{
  label: 'Confidence band',
  data: p25AccumThenDrawdown,        // lower bound
  borderColor: 'transparent',
  backgroundColor: 'rgba(37,99,235,0.07)',
  fill: '+1',                        // fill to the dataset above (p75)
  tension: 0.3, pointRadius: 0,
},
{
  label: 'p75 band top',
  data: p75AccumThenDrawdown,
  borderColor: 'transparent',
  backgroundColor: 'transparent',
  fill: false,
  tension: 0.3, pointRadius: 0,
},
```

### 7.3 — Retirement age vertical annotation line

```javascript
// Add Chart.js annotation plugin (cdnjs or unpkg):
// <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js"></script>

plugins: {
  annotation: {
    annotations: {
      retirementLine: {
        type: 'line',
        xMin: retirementAge, xMax: retirementAge,
        borderColor: 'rgba(148,163,184,0.5)',
        borderWidth: 1.5,
        borderDash: [6, 4],
        label: {
          display: true,
          content: `Retirement\nAge ${retirementAge}`,
          position: 'start',
          backgroundColor: 'rgba(11,37,69,0.85)',
          color: 'white',
          font: { family: "'JetBrains Mono', monospace", size: 10 },
          padding: { x: 8, y: 4 },
          borderRadius: 4,
        }
      }
    }
  }
}
```

### 7.4 — Histogram: better colour coding

```javascript
// Colour bars by zone:
// Red = below p10 corpus, Blue = p10-p90, Green = above p90
const backgroundColors = buckets.map((_, i) => {
  const midValue = min + (i + 0.5) * bucketSize;
  if (midValue < p10CorpusValue)  return 'rgba(220,38,38,0.65)';
  if (midValue > p90CorpusValue)  return 'rgba(13,148,136,0.65)';
  return 'rgba(37,99,235,0.5)';
});
// Add a vertical annotation line at median corpus
```

### 7.5 — Chart resize on sidebar collapse

```javascript
// After sidebar toggle animation completes, resize all charts
setTimeout(() => {
  Chart.instances.forEach(chart => chart.resize());
}, 350); // matches CSS transition duration
```

---

## PART 8 — NARRATIVE CARD REDESIGN

```html
<div class="narrative-card" id="narrative-card">
  <div class="narrative-accent" id="narrative-accent"></div>
  <div class="narrative-body">
    <p class="narrative-text" id="narrative-text">
      <!-- JS populates this dynamically based on success rate and numbers -->
    </p>
  </div>
</div>
```

```javascript
function buildNarrative(params, result) {
  const { clientName, yearsToRetirement, adjustedMonthlyExpenses } = result;
  const { successRate, percentiles } = result;
  const corpus = (percentiles.p50.corpusAtRetirement / 1e7).toFixed(2);
  const expense = formatINR(adjustedMonthlyExpenses);
  const name = clientName || 'Your plan';
  const rate = successRate.toFixed(0);

  let tone, detail;
  if (successRate >= 85) {
    tone = 'strong';
    detail = `a strong <strong>${rate}% probability of success</strong>. Your plan is well-positioned.`;
  } else if (successRate >= 75) {
    tone = 'good';
    detail = `a healthy <strong>${rate}% probability of success</strong>. Minor adjustments can push this above 85%.`;
  } else if (successRate >= 60) {
    tone = 'moderate';
    detail = `a moderate <strong>${rate}% probability of success</strong>. The plan needs attention — consider increasing your SIP or extending your working years.`;
  } else if (successRate >= 40) {
    tone = 'poor';
    detail = `a vulnerable <strong>${rate}% probability of success</strong>. Significant changes to savings or retirement date are recommended.`;
  } else {
    tone = 'critical';
    detail = `a critical <strong>${rate}% probability of success</strong>. This plan requires an urgent strategy rethink — please book a Clarity Session.`;
  }

  document.getElementById('narrative-accent').className = `narrative-accent accent-${tone}`;
  document.getElementById('narrative-text').innerHTML =
    `Based on your goal to retire in ${yearsToRetirement} years, your plan shows ${detail} Your projected median corpus of <strong>₹${corpus} Cr</strong> is designed to fund a <strong>${expense}/month</strong> retirement lifestyle.`;
}
```

```css
.narrative-card {
  display: flex; margin: 1.25rem 1.5rem 0;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md); overflow: hidden;
}
.narrative-accent {
  width: 4px; flex-shrink: 0;
  transition: background 0.4s;
}
.accent-strong   { background: var(--seed-teal); }
.accent-good     { background: #22C55E; }
.accent-moderate { background: var(--seed-amber); }
.accent-poor     { background: #F97316; }
.accent-critical { background: var(--seed-red); }
.narrative-body { padding: 1rem 1.25rem; }
.narrative-text {
  font-size: 14px; line-height: 1.7; color: var(--text-secondary);
  font-family: var(--font-body); margin: 0;
}
.narrative-text strong { color: var(--text-primary); font-weight: 600; }
```

---

## PART 9 — SCENARIO COMPARISON FEATURE

### 9.1 — Save Scenario (localStorage)

```javascript
let savedScenarios = JSON.parse(localStorage.getItem('seed-scenarios') || '[]');

function saveCurrentScenario() {
  if (savedScenarios.length >= 3) {
    showToast('Maximum 3 scenarios. Remove one to save a new one.', 'warning');
    return;
  }
  if (!lastResults) { showToast('Run a simulation first.', 'info'); return; }

  const scenario = {
    id: Date.now(),
    label: document.getElementById('clientName').value || `Scenario ${savedScenarios.length + 1}`,
    params: collectFormParams(),
    summary: {
      corpus:      lastResults.percentiles.p50.corpusAtRetirement,
      successRate: lastResults.successRate,
      medianAge:   lastResults.medianAgeAtDepletion,
      expense:     lastResults.adjustedMonthlyExpenses,
    },
    savedAt: new Date().toLocaleDateString('en-IN'),
  };
  savedScenarios.push(scenario);
  localStorage.setItem('seed-scenarios', JSON.stringify(savedScenarios));
  renderScenarioComparison();
  showToast(`Scenario "${scenario.label}" saved.`, 'success');
}
```

### 9.2 — Comparison Panel HTML

```html
<div class="comparison-panel" id="comparison-panel" style="display:none">
  <div class="comparison-header">
    <h3 class="comparison-title">Scenario Comparison</h3>
    <button class="comparison-close" onclick="closeComparison()">✕</button>
  </div>
  <div class="comparison-table-wrap" id="comparison-table">
    <!-- JS renders table rows -->
  </div>
</div>
```

```javascript
function renderScenarioComparison() {
  if (savedScenarios.length < 2) return;
  const panel = document.getElementById('comparison-panel');
  panel.style.display = 'block';

  const rows = [
    { label: 'Corpus at Retirement', key: 'corpus',      fmt: v => INR.crores(v) },
    { label: 'Success Probability',  key: 'successRate',  fmt: v => v.toFixed(1) + '%' },
    { label: 'Median Age Corpus Lasts', key: 'medianAge', fmt: v => 'Age ' + Math.floor(v) },
    { label: 'Monthly Need',         key: 'expense',      fmt: v => INR.monthly(v) },
  ];

  let html = `<table class="comparison-table">
    <thead><tr>
      <th>Metric</th>
      ${savedScenarios.map(s => `<th>${s.label} <button onclick="removeScenario(${s.id})">✕</button></th>`).join('')}
    </tr></thead>
    <tbody>`;

  rows.forEach(row => {
    const values = savedScenarios.map(s => s.summary[row.key]);
    const maxIdx = row.key === 'successRate' || row.key === 'corpus' || row.key === 'medianAge'
      ? values.indexOf(Math.max(...values)) : values.indexOf(Math.min(...values));
    html += `<tr>
      <td class="compare-metric">${row.label}</td>
      ${values.map((v, i) => `<td class="${i === maxIdx ? 'compare-best' : ''}">${row.fmt(v)}</td>`).join('')}
    </tr>`;
  });
  html += `</tbody></table>`;
  document.getElementById('comparison-table').innerHTML = html;
}
```

---

## PART 10 — AUTH SCAFFOLD (UI ONLY, GATED BY FLAG)

```javascript
// Feature flag — set to true when ready to enable
const AUTH_ENABLED = false;

if (AUTH_ENABLED) {
  document.getElementById('user-btn').style.display = 'flex';
  initAuthUI();
}

function initAuthUI() {
  // Show login modal on page load if not authenticated
  // Modal contains: Email + Password OR Google OAuth button
  // On success: show user avatar initials in topbar, enable save-to-cloud
}
```

```html
<!-- Login modal (hidden until AUTH_ENABLED = true) -->
<div class="modal-overlay" id="auth-modal" style="display:none">
  <div class="modal-card">
    <div class="modal-header">
      <div class="brand-mark" style="margin: 0 auto 1rem;">S</div>
      <h2 class="modal-title">Welcome to Seed Planner</h2>
      <p class="modal-sub">Sign in to save scenarios and access your history</p>
    </div>
    <div class="modal-body">
      <div class="input-field">
        <label class="field-label">Email</label>
        <input type="email" id="auth-email" class="field-input" placeholder="you@example.com">
      </div>
      <div class="input-field">
        <label class="field-label">Password</label>
        <input type="password" id="auth-password" class="field-input" placeholder="••••••••">
      </div>
      <button class="btn-run" style="margin-top:1rem" onclick="handleLogin()">Sign In</button>
      <button class="btn-scenario" style="width:100%;margin-top:8px" onclick="skipAuth()">
        Continue without signing in →
      </button>
    </div>
  </div>
</div>
```

---

## PART 11 — MOBILE BOTTOM SHEET

On screens < 900px, the input form should not be a sidebar — it should be a bottom sheet that slides up from the bottom when the user taps "Edit Inputs".

```html
<!-- Mobile bottom bar (always visible on mobile) -->
<div class="mobile-bar" id="mobile-bar">
  <button class="mobile-bar-btn" onclick="openBottomSheet()">
    Edit Inputs
  </button>
  <div class="mobile-bar-kpi">
    <span id="mobile-kpi-success">—</span>
    <span class="mobile-kpi-label">Success</span>
  </div>
  <button class="mobile-bar-btn mobile-bar-primary" id="mobile-run-btn">
    Run →
  </button>
</div>

<!-- Bottom sheet overlay -->
<div class="bottom-sheet-overlay" id="bs-overlay" onclick="closeBottomSheet()"></div>

<!-- Bottom sheet panel -->
<div class="bottom-sheet" id="bottom-sheet">
  <div class="bottom-sheet-handle"></div>
  <div class="bottom-sheet-content">
    <!-- Same form content as sidebar, just rendered inside here on mobile -->
    <!-- JS clones the sidebar form here, or renders shared component -->
  </div>
</div>
```

```css
@media (max-width: 900px) {
  .mobile-bar {
    display: flex; align-items: center;
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 30;
    background: var(--bg-card); border-top: 1px solid var(--border-default);
    padding: 10px 16px; gap: 12px;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
  }
  .mobile-bar-btn {
    flex: 1; height: 44px; border-radius: var(--radius-sm);
    border: 1px solid var(--border-default); background: transparent;
    font-size: 14px; font-weight: 600; cursor: pointer;
    color: var(--text-primary); font-family: var(--font-body);
  }
  .mobile-bar-primary {
    background: var(--seed-navy); color: white;
    border-color: var(--seed-navy);
  }
  .mobile-bar-kpi {
    display: flex; flex-direction: column; align-items: center; flex-shrink: 0;
    font-family: var(--font-mono);
  }
  .mobile-kpi-label { font-size: 10px; color: var(--text-muted); }

  .bottom-sheet-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.4); z-index: 40;
  }
  .bottom-sheet-overlay.open { display: block; }
  .bottom-sheet {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
    background: var(--bg-card); border-radius: 20px 20px 0 0;
    max-height: 90vh; overflow-y: auto;
    transform: translateY(100%);
    transition: transform var(--sidebar-transition);
    padding-bottom: 80px; /* space for mobile bar */
  }
  .bottom-sheet.open { transform: translateY(0); }
  .bottom-sheet-handle {
    width: 36px; height: 4px; border-radius: 2px;
    background: var(--n-300); margin: 12px auto;
  }
  .app-main { padding-bottom: 80px; }
}
```

---

## PART 12 — TOOLTIP COMPONENT

Replace all `title` attributes with a custom rich tooltip:

```javascript
class Tooltip {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'rich-tooltip';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    document.querySelectorAll('[data-tip]').forEach(trigger => {
      trigger.addEventListener('mouseenter', e => this.show(e.target));
      trigger.addEventListener('mouseleave', () => this.hide());
    });
  }
  show(trigger) {
    this.el.textContent = trigger.getAttribute('data-tip');
    this.el.style.display = 'block';
    const rect = trigger.getBoundingClientRect();
    this.el.style.top  = (rect.bottom + 8 + window.scrollY) + 'px';
    this.el.style.left = (rect.left + window.scrollX) + 'px';
  }
  hide() { this.el.style.display = 'none'; }
}
const tooltip = new Tooltip();
```

```css
.rich-tooltip {
  position: absolute; z-index: 999;
  background: var(--seed-navy); color: white;
  font-size: 12px; line-height: 1.5;
  padding: 8px 12px; border-radius: var(--radius-sm);
  max-width: 240px; pointer-events: none;
  box-shadow: var(--shadow-md);
  font-family: var(--font-body);
}
```

---

## PART 13 — TOAST NOTIFICATION

```javascript
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => toast.classList.add('toast-show'), 10);
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
```

```html
<div id="toast-container"></div>
```

```css
#toast-container {
  position: fixed; bottom: 80px; right: 16px; z-index: 200;
  display: flex; flex-direction: column; gap: 8px;
  pointer-events: none;
}
.toast {
  padding: 10px 16px; border-radius: var(--radius-sm);
  font-size: 13px; font-family: var(--font-body);
  box-shadow: var(--shadow-md); opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.25s, transform 0.25s;
  pointer-events: auto; max-width: 300px;
}
.toast-show { opacity: 1; transform: translateY(0); }
.toast-success  { background: var(--seed-teal);  color: white; }
.toast-warning  { background: var(--seed-amber);  color: white; }
.toast-info     { background: var(--seed-navy);   color: white; }
.toast-error    { background: var(--seed-red);    color: white; }
```

---

## PART 14 — FOOTER

```html
<footer class="app-footer">
  <div class="footer-inner">
    <span class="footer-brand">Seed Investments</span>
    <span class="footer-sep">·</span>
    <span>AMFI-Registered MFD</span>
    <span class="footer-sep">·</span>
    <span>ARN: [YOUR-ARN]</span>
    <span class="footer-sep">·</span>
    <span class="footer-disclaimer">
      For illustrative purposes only. Not investment advice. 
      Mutual Fund investments are subject to market risk.
    </span>
    <span class="footer-sep">·</span>
    <span>© 2026 Seed Investments</span>
  </div>
</footer>
```

```css
.app-footer {
  background: var(--bg-card);
  border-top: 1px solid var(--border-subtle);
  display: flex; align-items: center;
  padding: 0 1.5rem;
}
.footer-inner {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  font-size: 11px; color: var(--text-muted);
  font-family: var(--font-body);
}
.footer-brand { font-weight: 600; color: var(--text-secondary); }
.footer-sep   { color: var(--n-300); }
@media (max-width: 768px) {
  .footer-disclaimer { display: none; }
}
```

---

## PART 15 — IMPLEMENTATION CHECKLIST

### Phase 1 — Foundation (Days 1–2)
- [ ] New CSS design system (Part 1) — all CSS variables, typography, colours
- [ ] Global Chart.js defaults (Part 7.1)
- [ ] Dark mode toggle + localStorage persistence (Part 1.3)
- [ ] App shell layout with correct grid areas (Part 2)
- [ ] Topbar with brand, nav, actions (Part 3)
- [ ] Footer (Part 14)
- [ ] Toast notification component (Part 13)

### Phase 2 — Left Panel Rebuild (Days 3–4)
- [ ] Sidebar collapse toggle with smooth animation (Part 4.2)
- [ ] Icon rail for collapsed state (Part 4.1)
- [ ] Accordion sections 1–5 with open/close animation (Part 4.2)
- [ ] Premium slider with fill track (Part 4.3)
- [ ] Stepper number inputs for ages (Part 4.5)
- [ ] Age timeline visualiser (Part 4.6)
- [ ] Live inflation hint on expenses field (Part 1 — Bug #1 display)
- [ ] SIP step-up monthly projection hint
- [ ] Advanced section (Section 5 collapsed by default)
- [ ] Sticky sidebar CTA area with save scenario button (Part 4.7)
- [ ] Rich tooltip component wired to all ⓘ badges (Part 12)

### Phase 3 — Main Canvas Upgrade (Days 5–6)
- [ ] KPI strip with dot-grid texture (Part 5)
- [ ] Count-up animation for KPI numbers (Part 5.3)
- [ ] KPI accent bar colour changes with success rate
- [ ] Narrative card with tone-responsive accent (Part 8)
- [ ] Chart frames with custom header + legend tags + source badges (Part 6)
- [ ] Journey chart: add confidence band fill between p25-p75 (Part 7.2)
- [ ] Journey chart: retirement age annotation line (Part 7.3)
- [ ] Histogram: zone colouring + median annotation (Part 7.4)
- [ ] Charts resize on sidebar collapse (Part 7.5)
- [ ] Scenario comparison panel (Part 9)

### Phase 4 — Mobile + Polish (Day 7)
- [ ] Mobile bottom sheet (Part 11)
- [ ] Mobile bar with quick stats
- [ ] All breakpoints tested at 375px, 430px, 768px, 1024px, 1440px
- [ ] Auth scaffold modal (hidden, AUTH_ENABLED=false) (Part 10)
- [ ] Input validation with inline field errors
- [ ] PDF report updated with v3 header design
- [ ] Acceptance testing of all simulation outputs still match expected values

---

## PART 16 — ACCEPTANCE CRITERIA v3

### Layout & Sidebar
- [ ] Sidebar collapses to 52px icon rail — main canvas fills full width
- [ ] All accordion sections open/close with smooth 280ms animation
- [ ] Advanced section is closed by default, opens without layout shift
- [ ] Sidebar state persists across page refresh (localStorage)

### Inputs & UX
- [ ] Stepper +/− buttons work for all three age fields
- [ ] All sliders show animated fill track as value changes
- [ ] Inflation hint updates in real time as expenses or inflation slider changes
- [ ] SIP step-up projection hint updates as SIP or step-up slider changes
- [ ] Tooltips appear on all ⓘ icons, disappear on mouse leave
- [ ] Risk preset buttons (Conservative / Balanced / Aggressive) set all 4 sliders correctly

### Charts
- [ ] Journey chart has confidence band fill (p25–p75 shaded area)
- [ ] Journey chart has dashed retirement age annotation line with label
- [ ] Histogram bars are colour-coded (red / blue / green by zone)
- [ ] All charts have custom legend tags (not Chart.js default legend)
- [ ] All chart containers have source badges at bottom
- [ ] Charts resize correctly when sidebar collapses

### KPI Strip
- [ ] Numbers animate with count-up on simulation complete
- [ ] Success rate colour changes dynamically (5 tiers)
- [ ] Left accent bar colour updates with success rate

### Dark Mode
- [ ] All text remains readable in dark mode
- [ ] All chart colours remain legible in dark mode (no hardcoded whites)
- [ ] Dark mode preference persists across refresh

### Mobile (test on 375px width)
- [ ] Bottom bar is always visible — fixed at bottom
- [ ] Bottom sheet slides up smoothly on "Edit Inputs" tap
- [ ] All inputs usable inside bottom sheet
- [ ] "Run" button in bottom bar triggers simulation
- [ ] Results are fully readable without horizontal scroll

---

*Document Version: 3.0 · Seed Investments Internal Engineering Specification*  
*For the developer: Preserve simulation.worker.js completely. Build everything around it.*  
*© 2026 Seed Investments — Confidential*
