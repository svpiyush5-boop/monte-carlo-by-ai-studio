import os

ROOT = 'd:/Tools/Corpus lab/Monte carlo'

# Read old HTML to extract any pdf generation script
with open(f'{ROOT}/index.html', encoding='utf-8') as f:
    old = f.read()

pdf_start = old.find("async function generatePDF()")
pdf_end   = old.find("</script>", pdf_start)
pdf_script = old[pdf_start:pdf_end] if pdf_start != -1 else ""

HTML = """<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Retirement Planner — Seed Investments</title>

<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Satoshi:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js" crossorigin="anonymous"></script>

<!-- PDF -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" crossorigin="anonymous"></script>

<!-- Design Tokens & Components -->
<link rel="stylesheet" href="v3.css">

<style>
:root {
  --font-display: 'Clash Display', Georgia, serif;
  --font-body: 'Satoshi', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --seed-navy: #0B2545; --seed-navy-soft: #1A3A5C;
  --seed-teal: #0D9488; --seed-teal-soft: #CCFBF1;
  --seed-amber: #D97706; --seed-amber-soft: #FEF3C7;
  --seed-red: #DC2626; --seed-red-soft: #FEE2E2;
  --seed-gold: #B8860B;
  --seed-blue: #2563EB; --seed-blue-soft: #EFF6FF;

  --n-0:#fff; --n-50:#F8FAFC; --n-100:#F1F5F9; --n-150:#E9EFF5;
  --n-200:#E2E8F0; --n-300:#CBD5E1; --n-400:#94A3B8; --n-500:#64748B;
  --n-600:#475569; --n-700:#334155; --n-800:#1E293B; --n-900:#0F172A;

  --bg-page: var(--n-50); --bg-card: var(--n-0); --bg-surface: var(--n-100);
  --bg-sidebar: var(--n-0);
  --text-primary: var(--n-900); --text-secondary: var(--n-600); --text-muted: var(--n-400);
  --border-subtle: var(--n-150); --border-default: var(--n-200); --border-strong: var(--n-300);

  --shadow-xs: 0 1px 2px rgba(15,23,42,.04);
  --shadow-sm: 0 2px 8px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.04);
  --shadow-md: 0 8px 24px rgba(15,23,42,.08), 0 2px 8px rgba(15,23,42,.04);
  --shadow-lg: 0 20px 40px rgba(15,23,42,.1), 0 4px 12px rgba(15,23,42,.06);

  --radius-xs: 4px; --radius-sm: 6px; --radius-md: 10px;
  --radius-lg: 16px; --radius-xl: 24px; --radius-full: 9999px;

  --sidebar-w: 340px;
  --sidebar-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="dark"] {
  --bg-page: #0A0F1E; --bg-card: #111827; --bg-surface: #1A2235; --bg-sidebar: #111827;
  --text-primary: #F1F5F9; --text-secondary: #94A3B8; --text-muted: #475569;
  --border-subtle: rgba(255,255,255,.04); --border-default: rgba(255,255,255,.08); --border-strong: rgba(255,255,255,.14);
  --shadow-xs: 0 1px 2px rgba(0,0,0,.3); --shadow-sm: 0 2px 8px rgba(0,0,0,.4);
  --shadow-md: 0 8px 24px rgba(0,0,0,.5); --shadow-lg: 0 20px 40px rgba(0,0,0,.6);
  --seed-teal-soft: rgba(13,148,136,.15); --seed-amber-soft: rgba(217,119,6,.15);
  --seed-red-soft: rgba(220,38,38,.15); --seed-blue-soft: rgba(37,99,235,.15);
}
</style>
</head>

<body>
<div class="app-shell" id="app-shell">

  <!-- ── Topbar ── -->
  <header class="app-topbar">
    <div class="topbar-inner">
      <div class="brand">
        <div class="brand-mark">S</div>
        <div>
          <span class="brand-name">Seed Investments</span>
          <span class="brand-tag">AMFI-Registered &middot; ARN: XXXXXXX</span>
        </div>
      </div>
      <nav class="topbar-nav">
        <a href="#">Home</a>
        <a href="#">Services</a>
        <a href="#" class="active">Tools</a>
      </nav>
      <div class="topbar-actions">
        <button class="icon-btn" id="theme-toggle" title="Toggle dark mode">&#9790;</button>
        <a href="#" class="btn-cta">Book Clarity Session &rarr;</a>
      </div>
    </div>
  </header>

  <!-- ── Sidebar ── -->
  <aside class="app-sidebar" id="sidebar">

    <!-- Collapse toggle -->
    <div class="sidebar-toggle-strip">
      <button class="sidebar-toggle-btn" id="sidebar-toggle" title="Collapse sidebar">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>

    <!-- Collapsed icon rail (shown when collapsed) -->
    <div class="sidebar-icon-rail" id="sidebar-icon-rail">
      <button class="rail-icon-btn" onclick="expandSidebar()" title="Expand">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <button class="rail-icon-btn" onclick="window.runSimulation()" title="Run simulation">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </button>
    </div>

    <!-- Scrollable form area -->
    <div class="sidebar-scroll" id="sidebar-scroll">

      <div class="sidebar-header">
        <h1>Retirement Planner</h1>
        <p>10,000 Monte Carlo simulations</p>
      </div>

      <form id="retirement-form" novalidate onsubmit="event.preventDefault(); window.runSimulation();" class="sidebar-form">

        <!-- 1 About You -->
        <div class="accordion-section open" data-section="1">
          <button type="button" class="accordion-header" aria-expanded="true">
            <div class="accordion-label">
              <span class="section-num">1</span>
              <span class="section-title">About You</span>
            </div>
            <div class="accordion-right">
              <svg class="accordion-chevron" width="12" height="12" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none"/></svg>
            </div>
          </button>
          <div class="accordion-body">
            <div class="input-field">
              <label class="field-label" for="clientName">Client Name</label>
              <input type="text" id="clientName" class="field-input" placeholder="e.g. Piyush Sharma" autocomplete="name">
            </div>
            <div class="field-row-3">
              <div class="input-field">
                <label class="field-label" for="currentAge">Age</label>
                <div class="num-input-wrap">
                  <button type="button" class="num-btn" onclick="stepAge('currentAge',-1)">&minus;</button>
                  <input type="number" id="currentAge" class="num-input" value="33" min="18" max="79" onchange="updateTimeline()">
                  <button type="button" class="num-btn" onclick="stepAge('currentAge',1)">+</button>
                </div>
              </div>
              <div class="input-field">
                <label class="field-label" for="retirementAge">Retire At</label>
                <div class="num-input-wrap">
                  <button type="button" class="num-btn" onclick="stepAge('retirementAge',-1)">&minus;</button>
                  <input type="number" id="retirementAge" class="num-input" value="60" min="30" max="80" onchange="updateTimeline()">
                  <button type="button" class="num-btn" onclick="stepAge('retirementAge',1)">+</button>
                </div>
              </div>
              <div class="input-field">
                <label class="field-label" for="lifeExpectancy">Until</label>
                <div class="num-input-wrap">
                  <button type="button" class="num-btn" onclick="stepAge('lifeExpectancy',-1)">&minus;</button>
                  <input type="number" id="lifeExpectancy" class="num-input" value="85" min="50" max="100" onchange="updateTimeline()">
                  <button type="button" class="num-btn" onclick="stepAge('lifeExpectancy',1)">+</button>
                </div>
              </div>
            </div>
            <div class="age-timeline" id="age-timeline"></div>
          </div>
        </div>

        <!-- 2 Your Money Today -->
        <div class="accordion-section open" data-section="2">
          <button type="button" class="accordion-header" aria-expanded="true">
            <div class="accordion-label">
              <span class="section-num">2</span>
              <span class="section-title">Your Money Today</span>
            </div>
            <div class="accordion-right">
              <svg class="accordion-chevron" width="12" height="12" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none"/></svg>
            </div>
          </button>
          <div class="accordion-body">
            <div class="input-field">
              <label class="field-label" for="currentSavings">Current Invested Corpus <span class="field-tooltip" data-tip="Total of MFs, stocks, EPF, PPF, NPS etc.">i</span></label>
              <div class="currency-input-wrap">
                <span class="currency-prefix">&#8377;</span>
                <input type="number" id="currentSavings" class="field-input currency-input" value="1000000" min="0" step="10000" oninput="updateHints()">
              </div>
              <div class="field-hint" id="savings-display">&#8377;10.00 Lakhs</div>
            </div>
            <div class="input-field">
              <label class="field-label" for="monthlySavings">Monthly SIP</label>
              <div class="currency-input-wrap">
                <span class="currency-prefix">&#8377;</span>
                <input type="number" id="monthlySavings" class="field-input currency-input" value="35000" min="0" step="500" oninput="updateHints()">
              </div>
              <div class="field-hint" id="sip-annual-display">&#8377;4.20 Lakhs / year</div>
            </div>
            <div class="input-field">
              <label class="field-label" for="sipStepUp">Annual SIP Step-Up <span class="field-tooltip" data-tip="% increase in SIP each year as income grows">i</span></label>
              <div class="slider-field">
                <div class="slider-track-wrap">
                  <div class="slider-fill" id="sipStepUp-fill" style="width:25%"></div>
                  <input type="range" id="sipStepUp" class="field-slider" min="0" max="20" value="5" step="1" oninput="syncSlider(this)">
                </div>
                <span class="slider-val" id="sipStepUp-val">5%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3 Returns & Risk -->
        <div class="accordion-section open" data-section="3">
          <button type="button" class="accordion-header" aria-expanded="true">
            <div class="accordion-label">
              <span class="section-num">3</span>
              <span class="section-title">Returns &amp; Risk</span>
            </div>
            <div class="accordion-right">
              <svg class="accordion-chevron" width="12" height="12" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none"/></svg>
            </div>
          </button>
          <div class="accordion-body">
            <div class="risk-presets">
              <button type="button" class="risk-btn" onclick="setRisk('conservative',this)">Conservative</button>
              <button type="button" class="risk-btn active" onclick="setRisk('balanced',this)">Balanced</button>
              <button type="button" class="risk-btn" onclick="setRisk('aggressive',this)">Aggressive</button>
            </div>
            <div class="input-field">
              <label class="field-label" for="expectedReturn">Pre-Retire Return</label>
              <div class="slider-field">
                <div class="slider-track-wrap">
                  <div class="slider-fill" id="expectedReturn-fill" style="width:57%"></div>
                  <input type="range" id="expectedReturn" class="field-slider" min="1" max="20" value="12" step="1" oninput="syncSlider(this)">
                </div>
                <span class="slider-val" id="expectedReturn-val">12%</span>
              </div>
            </div>
            <div class="input-field">
              <label class="field-label" for="preRetirementVol">Pre-Retire Volatility (&sigma;) <span class="field-tooltip" data-tip="Std deviation of annual returns. Equity: 18-22%, Balanced: 12-15%">i</span></label>
              <div class="slider-field">
                <div class="slider-track-wrap">
                  <div class="slider-fill" id="preRetirementVol-fill" style="width:48%"></div>
                  <input type="range" id="preRetirementVol" class="field-slider" min="3" max="28" value="15" step="1" oninput="syncSlider(this)">
                </div>
                <span class="slider-val" id="preRetirementVol-val">15%</span>
              </div>
            </div>
            <div class="input-field">
              <label class="field-label" for="postRetirementReturn">Post-Retire Return</label>
              <div class="slider-field">
                <div class="slider-track-wrap">
                  <div class="slider-fill" id="postRetirementReturn-fill" style="width:42%"></div>
                  <input type="range" id="postRetirementReturn" class="field-slider" min="1" max="15" value="7" step="1" oninput="syncSlider(this)">
                </div>
                <span class="slider-val" id="postRetirementReturn-val">7%</span>
              </div>
            </div>
            <div class="input-field">
              <label class="field-label" for="postRetirementVol">Post-Retire Volatility (&sigma;)</label>
              <div class="slider-field">
                <div class="slider-track-wrap">
                  <div class="slider-fill" id="postRetirementVol-fill" style="width:46%"></div>
                  <input type="range" id="postRetirementVol" class="field-slider" min="2" max="15" value="8" step="1" oninput="syncSlider(this)">
                </div>
                <span class="slider-val" id="postRetirementVol-val">8%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4 Expenses -->
        <div class="accordion-section open" data-section="4">
          <button type="button" class="accordion-header" aria-expanded="true">
            <div class="accordion-label">
              <span class="section-num">4</span>
              <span class="section-title">Expenses &amp; Goals</span>
            </div>
            <div class="accordion-right">
              <svg class="accordion-chevron" width="12" height="12" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none"/></svg>
            </div>
          </button>
          <div class="accordion-body">
            <div class="input-field">
              <label class="field-label" for="monthlyExpenses">Monthly Need (today's &#8377;)</label>
              <div class="currency-input-wrap">
                <span class="currency-prefix">&#8377;</span>
                <input type="number" id="monthlyExpenses" class="field-input currency-input" value="75000" min="5000" step="1000" oninput="updateHints()">
              </div>
              <div class="field-hint" id="expense-inflation-hint">At retirement: calculating...</div>
            </div>
            <div class="input-field">
              <label class="field-label" for="inflation">Assumed Inflation</label>
              <div class="slider-field">
                <div class="slider-track-wrap">
                  <div class="slider-fill" id="inflation-fill" style="width:40%"></div>
                  <input type="range" id="inflation" class="field-slider" min="2" max="12" value="6" step="1" oninput="syncSlider(this)">
                </div>
                <span class="slider-val" id="inflation-val">6%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 5 Advanced -->
        <div class="accordion-section collapsed" data-section="5">
          <button type="button" class="accordion-header" aria-expanded="false">
            <div class="accordion-label">
              <span class="section-num advanced">&#9881;</span>
              <span class="section-title">Advanced</span>
            </div>
            <div class="accordion-right">
              <span class="badge-new">Optional</span>
              <svg class="accordion-chevron" width="12" height="12" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none"/></svg>
            </div>
          </button>
          <div class="accordion-body">
            <div class="input-field">
              <label class="field-label" for="numSimulations">Simulations</label>
              <select id="numSimulations" class="field-input">
                <option value="5000">5,000 (Fast)</option>
                <option value="10000" selected>10,000 (Standard)</option>
                <option value="20000">20,000 (High Precision)</option>
              </select>
            </div>
            <div class="input-field">
              <label class="field-label" for="additionalLumpsum">Planned Lumpsum (&#8377;)</label>
              <div class="currency-input-wrap">
                <span class="currency-prefix">&#8377;</span>
                <input type="number" id="additionalLumpsum" class="field-input currency-input" value="0" min="0" step="50000">
              </div>
              <div class="field-hint">
                Year from now: <input type="number" id="lumpsumYear" style="width:44px;display:inline;margin-left:4px" value="5" min="1" max="40">
              </div>
            </div>
            <div class="input-field">
              <label class="field-label" for="partTimeIncome">Part-Time Income (&#8377;/mo)</label>
              <div class="currency-input-wrap">
                <span class="currency-prefix">&#8377;</span>
                <input type="number" id="partTimeIncome" class="field-input currency-input" value="0" min="0" step="5000">
              </div>
              <div class="field-hint">
                Until age: <input type="number" id="partTimeUntilAge" style="width:44px;display:inline;margin-left:4px" value="70" min="50" max="90">
              </div>
            </div>
            <div class="input-field">
              <label class="field-label" for="taxDragPct">Annual Tax Drag <span class="field-tooltip" data-tip="Fund expense ratios + LTCG drag">i</span></label>
              <div class="slider-field">
                <div class="slider-track-wrap">
                  <div class="slider-fill" id="taxDragPct-fill" style="width:16%"></div>
                  <input type="range" id="taxDragPct" class="field-slider" min="0" max="3" value="0.5" step="0.1" oninput="syncSlider(this)">
                </div>
                <span class="slider-val" id="taxDragPct-val">0.5%</span>
              </div>
            </div>
          </div>
        </div>

      </form><!-- /form -->
    </div><!-- /sidebar-scroll -->

    <!-- Bottom CTA -->
    <div class="sidebar-cta-area">
      <div class="scenario-row">
        <button type="button" class="btn-scenario" onclick="saveCurrentScenario()">Save Scenario</button>
        <span class="scenario-count" id="scenario-count">0 / 3 saved</span>
      </div>
      <button type="submit" form="retirement-form" id="run-button" class="btn-run">Chart My Future &rarr;</button>
    </div>

  </aside><!-- /sidebar -->

  <!-- ── Main Canvas ── -->
  <main class="app-main" id="main-content">

    <div id="validation-errors" class="alert-error" style="display:none"></div>

    <!-- Comparison panel -->
    <div class="comparison-panel" id="comparison-panel" style="display:none">
      <div class="comparison-header">
        <h3 class="comparison-title">Scenario Comparison</h3>
        <button class="comparison-close" onclick="closeComparison()">&#215;</button>
      </div>
      <div id="comparison-table"></div>
    </div>

    <!-- KPI Strip -->
    <div class="kpi-strip">
      <div class="kpi-accent-bar" id="kpi-accent"></div>
      <div class="kpi-item">
        <div class="kpi-label">Corpus at Retirement</div>
        <div class="kpi-value" id="kpi-corpus">&mdash;</div>
        <div class="kpi-sub" id="kpi-corpus-range">Run simulation to see projections</div>
      </div>
      <div class="kpi-divider"></div>
      <div class="kpi-item">
        <div class="kpi-label">Probability of Success</div>
        <div class="kpi-value kpi-dynamic" id="kpi-success">&mdash;</div>
        <div class="kpi-sub" id="kpi-success-label">Plan viability</div>
      </div>
      <div class="kpi-divider"></div>
      <div class="kpi-item">
        <div class="kpi-label">Corpus Lasts Until Age</div>
        <div class="kpi-value" id="kpi-age">&mdash;</div>
        <div class="kpi-sub">median simulation</div>
      </div>
      <div class="kpi-divider"></div>
      <div class="kpi-item">
        <div class="kpi-label">Monthly Need at Retirement</div>
        <div class="kpi-value" id="kpi-expense">&mdash;</div>
        <div class="kpi-sub">inflation-adjusted</div>
      </div>
    </div>

    <!-- Narrative Card -->
    <div class="narrative-card" id="narrative-card">
      <div class="narrative-accent" id="narrative-accent"></div>
      <div class="narrative-body">
        <p class="narrative-text" id="narrative-text">Run a simulation to see your personalised plan analysis.</p>
      </div>
    </div>

    <!-- Journey Chart -->
    <div class="chart-frame" id="frame-journey">
      <div class="chart-frame-header">
        <div>
          <h2 class="chart-title">Wealth Journey &amp; Projection</h2>
          <p class="chart-desc">Accumulation and drawdown phases over time</p>
        </div>
        <div class="chart-frame-actions">
          <button class="chart-action-btn" onclick="generatePDF()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export PDF
          </button>
        </div>
      </div>
      <div class="chart-legend-row">
        <div class="legend-tag legend-optimistic"><span class="legend-dot"></span>Optimistic <span class="legend-val">p90</span></div>
        <div class="legend-tag legend-median"><span class="legend-dot"></span>Median <span class="legend-val">p50</span></div>
        <div class="legend-tag legend-pessimistic"><span class="legend-dot"></span>Pessimistic <span class="legend-val">p10</span></div>
        <div class="legend-tag legend-retirement"><span class="legend-dash"></span>Retirement</div>
      </div>
      <div class="chart-canvas-wrap" style="height:360px"><canvas id="journeyChart"></canvas></div>
      <div class="chart-source-row">
        <span class="chart-source-badge">Monte Carlo</span>
        <span class="chart-source-badge" id="sim-count-badge">10,000 paths</span>
        <span class="chart-source-badge">V3 Engine</span>
      </div>
    </div>

    <!-- Histogram -->
    <div class="chart-frame" id="frame-histogram">
      <div class="chart-frame-header">
        <div>
          <h2 class="chart-title">Corpus Distribution at Retirement</h2>
          <p class="chart-desc">Range of outcomes at age <span id="lbl-retire-age">60</span></p>
        </div>
      </div>
      <div class="chart-legend-row">
        <div class="legend-tag legend-pessimistic"><span class="legend-dot" style="border-radius:2px"></span>Bottom 10%</div>
        <div class="legend-tag legend-median"><span class="legend-dot" style="border-radius:2px;background:var(--seed-blue)"></span>Middle 80%</div>
        <div class="legend-tag legend-optimistic"><span class="legend-dot" style="border-radius:2px"></span>Top 10%</div>
      </div>
      <div class="chart-canvas-wrap" style="height:280px"><canvas id="histogramChart"></canvas></div>
    </div>

    <!-- Drawdown -->
    <div class="chart-frame" id="frame-drawdown">
      <div class="chart-frame-header">
        <div>
          <h2 class="chart-title">Retirement Phase Drawdown</h2>
          <p class="chart-desc">Corpus depletion paths post-retirement</p>
        </div>
      </div>
      <div class="chart-legend-row">
        <div class="legend-tag legend-median"><span class="legend-dot" style="background:var(--seed-blue)"></span>Median Path</div>
        <div class="legend-tag legend-optimistic"><span class="legend-dot" style="background:rgba(37,99,235,.12)"></span>80% Confidence Band</div>
      </div>
      <div class="chart-canvas-wrap" style="height:280px"><canvas id="drawdownChart"></canvas></div>
    </div>

    <div class="main-bottom-spacer"></div>

  </main><!-- /main -->

  <!-- Footer -->
  <footer class="app-footer">
    <div class="footer-inner">
      <span class="footer-brand">Seed Investments</span>
      <span class="footer-sep">&middot;</span>
      <span>AMFI-Registered MFD</span>
      <span class="footer-sep">&middot;</span>
      <span>ARN: 260388</span>
      <span class="footer-sep">&middot;</span>
      <span class="footer-disclaimer">For illustrative purposes only. Not investment advice.</span>
      <span class="footer-sep">&middot;</span>
      <span>&copy; 2026 Seed Investments</span>
    </div>
  </footer>

</div><!-- /app-shell -->

<!-- Mobile Bar -->
<div class="mobile-bar" id="mobile-bar">
  <button class="mobile-bar-btn" onclick="toggleMobileSidebar()">Edit Inputs</button>
  <div class="mobile-bar-kpi">
    <span id="mobile-kpi-success" style="font-size:16px;font-weight:700">&mdash;</span>
    <span class="mobile-kpi-label">Success</span>
  </div>
  <button class="mobile-bar-btn mobile-bar-primary" onclick="window.runSimulation()">Run &rarr;</button>
</div>

<div class="bottom-sheet-overlay" id="bs-overlay" onclick="toggleMobileSidebar()"></div>

<!-- Toast container -->
<div id="toast-container"></div>

<!-- PDF hidden container -->
<div id="pdf-container"><div id="pdf-content"></div></div>

<!-- Auth Modal (off by default) -->
<div class="modal-overlay" id="auth-modal" style="display:none">
  <div class="modal-card">
    <div style="text-align:center">
      <div class="brand-mark" style="margin:0 auto 1rem;font-family:'Clash Display'">S</div>
      <h2 class="modal-title">Welcome to Seed Planner</h2>
      <p class="modal-sub">Sign in to save scenarios and access history</p>
    </div>
    <div class="modal-body">
      <div class="input-field"><label class="field-label">Email</label><input type="email" id="auth-email" class="field-input" placeholder="you@example.com"></div>
      <div class="input-field"><label class="field-label">Password</label><input type="password" id="auth-password" class="field-input" placeholder="••••••••"></div>
      <button class="btn-run" style="margin-top:.75rem" onclick="document.getElementById('auth-modal').style.display='none'">Sign In</button>
      <button class="btn-scenario" style="width:100%;margin-top:8px" onclick="document.getElementById('auth-modal').style.display='none'">Continue without signing in &rarr;</button>
    </div>
  </div>
</div>

<script>
PDF_SCRIPT_PLACEHOLDER
</script>
<script src="v3_logic.js"></script>
</body>
</html>"""

HTML = HTML.replace("PDF_SCRIPT_PLACEHOLDER", pdf_script)

with open(f'{ROOT}/index.html', 'w', encoding='utf-8') as f:
    f.write(HTML)

print("index.html rebuilt cleanly!")
