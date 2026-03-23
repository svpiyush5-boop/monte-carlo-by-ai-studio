# SEED INVESTMENTS — MONTE CARLO RETIREMENT PLANNER
## Production-Grade Build Prompt v1.0
### Complete Audit → Rebuild Specification

---

> **Document Purpose:** This is a full engineering and design specification to transform the current Monte Carlo Retirement Planner from a capable MVP into a production-grade, SEBI-compliant, SaaS-ready tool worthy of Seed Investments' ₹100 Crore AUM positioning. Every section includes the *why*, the *what*, and the exact *how* to implement.

---

## PART 0 — AUDIT SUMMARY SCORECARD

| Dimension | Current Score | Target Score | Status |
|---|---|---|---|
| Financial Model Accuracy | 4 / 10 | 9 / 10 | 🔴 Critical fixes required |
| Regulatory & Compliance | 2 / 10 | 10 / 10 | 🔴 Blocker — do this first |
| Visualisation Quality | 6 / 10 | 9 / 10 | 🟡 Significant upgrade needed |
| UX & Client Experience | 6 / 10 | 9 / 10 | 🟡 Redesign required |
| Code Quality & Security | 6 / 10 | 9 / 10 | 🟡 Several hardening steps |
| SaaS Readiness | 3 / 10 | 8 / 10 | 🔴 Architecture additions needed |
| **Overall** | **54 / 100** | **90 / 100** | **Not production-ready yet** |

---

## PART 1 — CRITICAL BUG FIXES (DO BEFORE ANYTHING ELSE)

These three bugs produce materially wrong numbers. A client shown the current output could make a misinformed financial decision.

---

### BUG #1 — Expenses not inflation-adjusted to retirement date

**Severity:** 🔴 P0 — Renders all output figures incorrect

**Current broken code (line 424):**
```javascript
let annualWithdrawal = monthlyExpenses * 12;
```

**The problem:** A client aged 30 who says "I need ₹75,000/month today" will actually need ~₹2,00,000/month at age 60 at 5% inflation. The tool uses today's rupee value directly as the retirement withdrawal, massively understating the real corpus required. Every client sees an overoptimistic picture.

**The fix:**
```javascript
// BEFORE the simulation loop, add this one line:
const inflationYears = yearsToRetirement;
const adjustedMonthlyExpenses = monthlyExpenses * Math.pow(1 + withdrawalInflation, inflationYears);

// Then inside the simulation loop, replace:
// let annualWithdrawal = monthlyExpenses * 12;
// WITH:
let annualWithdrawal = adjustedMonthlyExpenses * 12;
```

**Update the UI label too:**
```html
<!-- Change this label -->
<label for="monthlyExpenses">Monthly Expenses at Retirement (in today's ₹)</label>

<!-- Add this helper text below the input -->
<p class="input-hint">
  Enter your expenses in <strong>today's rupees</strong>. 
  We will automatically adjust for inflation to your retirement date.
</p>
```

**Show the adjusted figure in results:**
```javascript
// In displayResults(), add this to the overview section:
const displayAdjustedExpense = (adjustedMonthlyExpenses / 100).toFixed(0);
// Show: "Your ₹75,000/month today becomes ₹2,01,359/month at retirement (5% inflation for 30 years)"
```

---

### BUG #2 — Volatility is hardcoded and invisible to the user

**Severity:** 🔴 P0 — Hidden assumption driving all output spread

**Current broken code (lines 412–413):**
```javascript
const returnStdDevPre = 0.12;   // 12% — never shown to user
const returnStdDevPost = 0.07;  // 7%  — never shown to user
```

**The problem:** The entire width of the outcome cone — the difference between pessimistic and optimistic — is driven entirely by these two numbers. A pure equity portfolio has σ ≈ 18–22%. Balanced funds ≈ 12–14%. Debt-heavy ≈ 5–7%. Hardcoding 12% for all clients is wrong for most of them. The user cannot see this assumption, cannot challenge it, and the output appears authoritative when it is guesswork.

**The fix — add two slider inputs:**
```html
<!-- Add to form-grid, after postRetirementReturn slider -->
<div class="input-group full-width">
  <label for="preRetirementVol">
    Pre-Retirement Volatility / Risk (%)
    <span class="tooltip-icon" data-tip="Standard deviation of annual returns. Equity funds ≈ 18%, Balanced ≈ 12%, Debt ≈ 5%.">ⓘ</span>
  </label>
  <div class="slider-container">
    <input type="range" id="preRetirementVol" min="3" max="28" value="15" step="1"
           oninput="updateSlider('preRetirementVolValue', this.value)">
    <div class="slider-value" id="preRetirementVolValue">15%</div>
  </div>
  <div class="slider-presets">
    <button type="button" onclick="setVol('pre',6,4)">Conservative</button>
    <button type="button" onclick="setVol('pre',15,8)">Balanced</button>
    <button type="button" onclick="setVol('pre',20,10)">Aggressive</button>
  </div>
</div>

<div class="input-group full-width">
  <label for="postRetirementVol">
    Post-Retirement Volatility / Risk (%)
    <span class="tooltip-icon" data-tip="Typically lower as you shift to conservative allocation in retirement.">ⓘ</span>
  </label>
  <div class="slider-container">
    <input type="range" id="postRetirementVol" min="2" max="15" value="8" step="1"
           oninput="updateSlider('postRetirementVolValue', this.value)">
    <div class="slider-value" id="postRetirementVolValue">8%</div>
  </div>
</div>
```

**Update runSimulation() to read from DOM:**
```javascript
// Replace hardcoded constants with:
const returnStdDevPre  = parseFloat(document.getElementById('preRetirementVol').value) / 100;
const returnStdDevPost = parseFloat(document.getElementById('postRetirementVol').value) / 100;
```

**Helper function for preset buttons:**
```javascript
function setVol(phase, pre, post) {
  if (phase === 'pre') {
    document.getElementById('preRetirementVol').value = pre;
    document.getElementById('postRetirementVol').value = post;
    updateSlider('preRetirementVolValue', pre);
    updateSlider('postRetirementVolValue', post);
  }
}
```

---

### BUG #3 — SIP treated as annual lump sum, not monthly

**Severity:** 🔴 P0 — Overstates corpus, especially over long horizons

**Current broken code (line 418–419):**
```javascript
for (let year = 0; year < yearsToRetirement; year++) {
    corpusAtRetirement = (corpusAtRetirement + (monthlySavings * 12)) * (1 + generateRandomReturn(...));
}
```

**The problem:** This deposits a full year's SIP at the start of each year and gives it a full year of compound growth. A monthly SIP should compound at 1/12 of the annual rate each month. Over 30 years, this overcounts compounding significantly — the difference can be 8–12% of the final corpus.

**The correct monthly simulation loop:**
```javascript
// Replace the annual accumulation loop with:
let corpusAtRetirement = currentSavings;
const annualReturn = expectedReturn; // already in decimal form (e.g. 0.12)
const annualVol = returnStdDevPre;

// Generate ONE annual return, but step through monthly
for (let year = 0; year < yearsToRetirement; year++) {
  // Draw one annual shock, convert to monthly equivalent
  const annualR = generateRandomReturn(annualReturn, annualVol);
  const monthlyR = Math.pow(1 + annualR, 1/12) - 1;

  for (let month = 0; month < 12; month++) {
    corpusAtRetirement = (corpusAtRetirement + monthlySavings) * (1 + monthlyR);
  }
}
```

> **Note on SIP Step-Up (Enhancement):** Most serious clients increase their SIP annually. Add an optional `sipStepUp` input (default 5%) and apply `monthlySavings *= (1 + sipStepUp/100)` at each year boundary inside the accumulation loop. This is a significant differentiator vs. basic calculators.

---

## PART 2 — COMPLIANCE & REGULATORY (NON-NEGOTIABLE)

As an AMFI-registered MFD, showing projection tools to clients without mandatory disclosures is a regulatory risk. These items must be present in the live tool and in every PDF generated.

---

### 2.1 — On-screen disclaimer (persistent, always visible in results)

Add this block immediately after the `.results-overview` div — it must never be hidden or toggled off:

```html
<div class="sebi-disclaimer" id="sebi-disclaimer">
  <div class="disclaimer-icon">⚠</div>
  <div class="disclaimer-text">
    <strong>Important Disclosure — Please Read</strong><br>
    This tool is for <strong>illustrative and educational purposes only</strong> and does not constitute 
    personalised investment advice. Projections are based on hypothetical Monte Carlo simulations using 
    assumed rates of return and do not guarantee future results. Mutual fund investments are subject to 
    market risk. Past performance is not indicative of future returns. Please read all scheme-related 
    documents carefully before investing.<br><br>
    <strong>Seed Investments</strong> · AMFI-Registered Mutual Fund Distributor · ARN: [YOUR-ARN-HERE] · 
    Registered with AMFI under SEBI (Mutual Funds) Regulations, 1996.<br>
    For personalised advice, please <a href="#">book a Clarity Session</a>.
  </div>
</div>
```

```css
.sebi-disclaimer {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  background: #fffbeb;
  border: 1px solid #f59e0b;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin: 2rem 0;
  font-size: 0.8rem;
  color: #78350f;
  line-height: 1.6;
}
.sebi-disclaimer strong { color: #92400e; }
.sebi-disclaimer a { color: #0077b6; text-decoration: underline; }
.disclaimer-icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 2px; }
```

---

### 2.2 — PDF disclaimer (hardcoded, not removable)

The current PDF generation appends a simple "Prepared by Seed Investments" footer. This is insufficient. The PDF must carry the full regulatory disclaimer and must state it is not advice.

**Replace the pdfHeader and pdfFooter generation with:**

```javascript
// PDF Header
pdfHeader.innerHTML = `
  <div style="border-bottom: 2px solid #023e8a; padding-bottom: 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <div style="font-size: 20px; font-weight: 700; color: #023e8a;">Seed Investments</div>
      <div style="font-size: 11px; color: #555;">AMFI-Registered Mutual Fund Distributor · ARN: [YOUR-ARN]</div>
    </div>
    <div style="font-size: 11px; color: #555; text-align: right;">
      Retirement Projection Report<br>
      Prepared for: <strong>${clientName}</strong><br>
      Generated: ${new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'long', year:'numeric'})}
    </div>
  </div>
  <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 6px; padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 10px; color: #78350f; line-height: 1.5;">
    <strong>FOR ILLUSTRATIVE PURPOSES ONLY — NOT INVESTMENT ADVICE.</strong> This report presents 
    hypothetical Monte Carlo simulation results and does not guarantee future returns. 
    Mutual fund investments are subject to market risk. Read all scheme documents before investing.
  </div>
`;

// PDF Footer (appears on every page equivalent)
pdfFooter.innerHTML = `
  <div style="border-top: 1px solid #e0e0e0; padding-top: 0.75rem; margin-top: 1.5rem; font-size: 9px; color: #888; text-align: center; line-height: 1.6;">
    Seed Investments · AMFI-Registered MFD · ARN: [YOUR-ARN] · 
    This projection is for educational purposes only and does not constitute investment advice. 
    Mutual Fund investments are subject to market risks. Past performance is not indicative of future returns.<br>
    © ${new Date().getFullYear()} Seed Investments. All rights reserved. 
    Generated by Seed Retirement Planner v2.0
  </div>
`;
```

---

### 2.3 — Input disclaimer on the form

Add this above the Submit button:

```html
<div class="form-disclaimer">
  By clicking "Chart My Future", you confirm that you understand this tool provides 
  illustrative projections only and does not constitute personalised financial advice.
</div>
```

---

## PART 3 — FINANCIAL MODEL ENHANCEMENTS

Beyond fixing the bugs, these additions make the model defensible and genuinely useful.

---

### 3.1 — Pre-retirement expense inflation display

After calculating, show the client what their expenses will actually look like:

```javascript
function showExpenseProjection(monthlyExpenses, withdrawalInflation, yearsToRetirement) {
  const adjustedExpense = monthlyExpenses * Math.pow(1 + withdrawalInflation, yearsToRetirement);
  return `Your ₹${(monthlyExpenses/1000).toFixed(0)}k/month today 
          → ₹${formatINR(adjustedExpense)}/month at retirement 
          (${(withdrawalInflation*100).toFixed(0)}% inflation, ${yearsToRetirement} years)`;
}
```

Display this as a dynamic hint below the monthly expenses input field, updating in real time as the user changes values.

---

### 3.2 — Optional SIP Step-Up input

```html
<div class="input-group full-width">
  <label for="sipStepUp">
    Annual SIP Increase (Step-Up %)
    <span class="tooltip-icon" data-tip="Most investors increase their SIP by 5–10% each year as income grows. This makes a large difference over time.">ⓘ</span>
  </label>
  <div class="slider-container">
    <input type="range" id="sipStepUp" min="0" max="20" value="5" step="1"
           oninput="updateSlider('sipStepUpValue', this.value)">
    <div class="slider-value" id="sipStepUpValue">5%</div>
  </div>
</div>
```

```javascript
// In accumulation loop, add at the end of each year:
if (sipStepUp > 0) {
  monthlySavings *= (1 + sipStepUp / 100);
}
```

---

### 3.3 — Corpus safety threshold

Add a "minimum acceptable corpus" check. If in more than 25% of simulations the corpus runs out before `lifeExpectancy - 5` (i.e., 5 years before the target), flag this as a red alert.

```javascript
const criticalFailures = results.filter(r => r.ageAtDepletion < (lifeExpectancy - 5)).length;
const criticalFailRate = (criticalFailures / results.length) * 100;

if (criticalFailRate > 25) {
  showCriticalAlert(`In ${criticalFailRate.toFixed(0)}% of scenarios, your money runs out more than 5 years early. This plan needs urgent attention.`);
}
```

---

### 3.4 — Three-Bucket integration callout

After displaying results, show how the Seed 3-Bucket System addresses the plan:

```javascript
function showBucketAllocation(corpusAtRetirement, monthlyExpenses, adjustedMonthlyExpenses) {
  const bucket1 = adjustedMonthlyExpenses * 12 * 2;   // 2 years liquid
  const bucket2 = adjustedMonthlyExpenses * 12 * 8;   // 8 years medium
  const bucket3 = corpusAtRetirement - bucket1 - bucket2; // rest growth

  return `
    <div class="bucket-callout">
      <h3>Your 3-Bucket Allocation at Retirement</h3>
      <div class="bucket-grid">
        <div class="bucket bucket-1">
          <div class="bucket-label">Bucket 1 — Safety</div>
          <div class="bucket-amount">${formatCrores(bucket1)}</div>
          <div class="bucket-desc">2 years of expenses · FD / Liquid Fund</div>
        </div>
        <div class="bucket bucket-2">
          <div class="bucket-label">Bucket 2 — Income</div>
          <div class="bucket-amount">${formatCrores(bucket2)}</div>
          <div class="bucket-desc">Years 3–10 · Debt / Hybrid Funds</div>
        </div>
        <div class="bucket bucket-3">
          <div class="bucket-label">Bucket 3 — Growth</div>
          <div class="bucket-amount">${formatCrores(bucket3)}</div>
          <div class="bucket-desc">Year 11+ · Equity Funds</div>
        </div>
      </div>
      <a href="/clarity-session" class="cta-button">Book a Clarity Session to build this plan →</a>
    </div>
  `;
}
```

---

### 3.5 — Success rate colour logic (expand beyond binary)

The current code only distinguishes above/below 75%. Add granularity:

```javascript
function getSuccessRateClass(rate) {
  if (rate >= 85) return { cls: 'rate-excellent', label: 'Excellent Plan', color: '#2a9d8f' };
  if (rate >= 75) return { cls: 'rate-good',      label: 'Good Plan',      color: '#52b788' };
  if (rate >= 60) return { cls: 'rate-moderate',  label: 'Needs Attention',color: '#f4a261' };
  if (rate >= 40) return { cls: 'rate-poor',      label: 'At Risk',        color: '#e76f51' };
  return           { cls: 'rate-critical',        label: 'Critical — Act Now', color: '#c1121f' };
}
```

---

## PART 4 — VISUALISATION UPGRADE

The current tool shows only a 3-line post-retirement drawdown chart. Billion-dollar planning firms show 4 visualisations. Implement all of them.

---

### 4.1 — Chart 1: Full Journey Chart (Accumulation + Drawdown)

This is the most important missing chart. Show corpus from today → retirement → end of life in one continuous view.

```javascript
function buildFullJourneyChart(results, currentAge, retirementAge, lifeExpectancy) {
  const p10 = results[Math.floor(results.length * 0.10)];
  const p50 = results[Math.floor(results.length * 0.50)];
  const p90 = results[Math.floor(results.length * 0.90)];

  // Build accumulation phase data points (yearly from currentAge to retirementAge)
  // Each result must store its accumulation path — store it during simulation
  // Then stitch: accumulationPath[...] + withdrawalPath[...]

  const labels = [];
  for (let age = currentAge; age <= lifeExpectancy; age++) labels.push(age);

  const datasets = [
    {
      label: 'Optimistic (90th %ile)',
      data: [...p90.accumulationPath, ...p90.withdrawalPath.slice(1)].map(p => ({
        x: p.age, y: balanceToCrores(p.balance)
      })),
      borderColor: '#2a9d8f', borderWidth: 2, fill: false, tension: 0.3, pointRadius: 0
    },
    {
      label: 'Most Likely (Median)',
      data: [...p50.accumulationPath, ...p50.withdrawalPath.slice(1)].map(p => ({
        x: p.age, y: balanceToCrores(p.balance)
      })),
      borderColor: '#0077b6', borderWidth: 3.5, fill: false, tension: 0.3, pointRadius: 0
    },
    {
      label: 'Pessimistic (10th %ile)',
      data: [...p10.accumulationPath, ...p10.withdrawalPath.slice(1)].map(p => ({
        x: p.age, y: balanceToCrores(p.balance)
      })),
      borderColor: '#e76f51', borderWidth: 2, fill: false, tension: 0.3, pointRadius: 0
    }
  ];

  // Add vertical annotation line at retirementAge
  // Use Chart.js annotation plugin or draw it as a vertical dataset:
  const retirementLine = {
    label: 'Retirement',
    data: [{x: retirementAge, y: 0}, {x: retirementAge, y: maxCorpus * 1.1}],
    borderColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1.5,
    borderDash: [6, 4],
    fill: false,
    pointRadius: 0,
    tension: 0
  };
  datasets.push(retirementLine);

  // Render with annotation:
  // Label the retirement age divider: "Accumulation Phase" | "Retirement Phase"
}
```

**Update the simulation loop to store accumulation paths:**
```javascript
// Add to each simulation iteration:
const accumulationPath = [{ age: currentAge, balance: currentSavings }];

// Inside accumulation loop, add after each year:
accumulationPath.push({ age: currentAge + year + 1, balance: corpusAtRetirement_snapshot });

// Store in result:
simulationResults.push({ corpusAtRetirement, ageAtDepletion, withdrawalPath, accumulationPath });
```

---

### 4.2 — Chart 2: Outcome Distribution Histogram

Show the distribution of final corpus values at retirement across all 10,000 simulations. This is what makes Monte Carlo visually powerful — clients see the bell curve and understand probability intuitively.

```javascript
function buildHistogramChart(results) {
  const corpora = results.map(r => balanceToCrores(r.corpusAtRetirement));
  const min = Math.min(...corpora);
  const max = Math.max(...corpora);
  const bucketCount = 40;
  const bucketSize = (max - min) / bucketCount;

  const buckets = Array(bucketCount).fill(0);
  corpora.forEach(c => {
    const idx = Math.min(Math.floor((c - min) / bucketSize), bucketCount - 1);
    buckets[idx]++;
  });

  const labels = buckets.map((_, i) => `₹${(min + i * bucketSize).toFixed(1)}Cr`);
  const backgroundColors = buckets.map((_, i) => {
    const value = min + i * bucketSize;
    if (value < p10Value) return 'rgba(231, 111, 81, 0.7)';
    if (value > p90Value) return 'rgba(42, 157, 143, 0.7)';
    return 'rgba(0, 119, 182, 0.5)';
  });

  new Chart(document.getElementById('histogram-chart'), {
    type: 'bar',
    data: { labels, datasets: [{ data: buckets, backgroundColor: backgroundColors, borderWidth: 0 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Distribution of Corpus at Retirement (10,000 Simulations)' }
      },
      scales: {
        x: { title: { display: true, text: 'Corpus at Retirement (₹ Crores)' }, ticks: { maxTicksLimit: 8 } },
        y: { title: { display: true, text: 'Number of Simulations' } }
      }
    }
  });
}
```

---

### 4.3 — Chart 3: Existing Drawdown Chart (keep, polish)

The existing 3-line drawdown chart is good. Keep it. Make these improvements:
- Add a 80% confidence band (fill between p10 and p90 lines)
- Add annotation label: "Corpus depleted" where lines hit zero
- Label each line with its corpus at retirement in the legend tooltip

---

### 4.4 — Probability Gauge / Radial Indicator

Replace the large plain percentage text with a visual arc gauge:

```javascript
function drawSuccessGauge(canvasId, successRate) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height * 0.7;
  const radius = Math.min(cx, cy) * 0.75;

  // Background arc (full semicircle)
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI, 0, false);
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#e9ecef';
  ctx.stroke();

  // Filled arc (success rate portion)
  const startAngle = Math.PI;
  const endAngle = Math.PI + (successRate / 100) * Math.PI;
  const color = successRate >= 85 ? '#2a9d8f' : successRate >= 75 ? '#52b788' :
                successRate >= 60 ? '#f4a261' : '#e76f51';

  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle, false);
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.stroke();

  // Center text
  ctx.fillStyle = color;
  ctx.font = `bold ${radius * 0.5}px Inter`;
  ctx.textAlign = 'center';
  ctx.fillText(`${successRate.toFixed(0)}%`, cx, cy - 10);
  ctx.fillStyle = '#6c757d';
  ctx.font = `${radius * 0.18}px Inter`;
  ctx.fillText('Probability of Success', cx, cy + radius * 0.25);
}
```

---

## PART 5 — UI REDESIGN SPECIFICATION: BILLION-DOLLAR FIRM STANDARD

The current UI is a competent bootstrap-style form. The target is a Vanguard / Fidelity / HDFC AMC-level interface — authoritative, refined, and trustworthy. Every design decision must signal: *your money is safe here.*

---

### 5.1 — Design System

**Typography:**
- Display / Headings: `DM Serif Display` (Google Fonts) — elegant, trustworthy, slightly editorial
- Body / UI: `DM Sans` (Google Fonts) — clean, modern, pairs perfectly with DM Serif
- Monospace (numbers): `DM Mono` for corpus figures — differentiates data from text

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

```css
:root {
  /* Typography */
  --font-display: 'DM Serif Display', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-data: 'DM Mono', 'Courier New', monospace;

  /* Seed Brand Palette */
  --seed-navy:    #0A2540;   /* Primary — deep authority */
  --seed-blue:    #1A56DB;   /* Action — CTAs, links */
  --seed-teal:    #0D9488;   /* Success — good outcomes */
  --seed-amber:   #D97706;   /* Warning — attention states */
  --seed-red:     #DC2626;   /* Danger — failure states */
  --seed-gold:    #B8860B;   /* Accent — Seed brand warmth */

  /* Neutrals */
  --neutral-50:   #F8FAFC;
  --neutral-100:  #F1F5F9;
  --neutral-200:  #E2E8F0;
  --neutral-300:  #CBD5E1;
  --neutral-400:  #94A3B8;
  --neutral-600:  #475569;
  --neutral-700:  #334155;
  --neutral-800:  #1E293B;
  --neutral-900:  #0F172A;

  /* Semantic */
  --bg-page:      #F8FAFC;
  --bg-card:      #FFFFFF;
  --bg-surface:   #F1F5F9;
  --text-primary: var(--neutral-900);
  --text-muted:   var(--neutral-600);
  --text-hint:    var(--neutral-400);
  --border:       var(--neutral-200);
  --border-focus: var(--seed-blue);

  /* Shadows */
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md:  0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.06);
  --shadow-lg:  0 10px 25px rgba(0,0,0,0.06), 0 4px 10px rgba(0,0,0,0.04);

  /* Radii */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  16px;
  --radius-xl:  24px;
}
```

---

### 5.2 — Page Layout

Replace the single centered card with a two-zone layout:

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: Seed wordmark + nav (Home | Tools | Contact)   │
├─────────────────┬───────────────────────────────────────┤
│                 │                                       │
│   SIDEBAR       │   MAIN CONTENT AREA                   │
│   Form inputs   │   Results / Charts / Metrics          │
│   (sticky)      │   (scrollable)                        │
│   ~360px wide   │                                       │
│                 │                                       │
├─────────────────┴───────────────────────────────────────┤
│  FOOTER: ARN | Disclaimer | © Seed Investments          │
└─────────────────────────────────────────────────────────┘
```

On mobile (`max-width: 768px`): sidebar collapses to top, results stack below.

**Layout CSS:**
```css
.app-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  min-height: 100vh;
  background: var(--bg-page);
}

.app-header  { grid-area: header; }
.app-sidebar { grid-area: sidebar; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
.app-main    { grid-area: main;   padding: 2rem; overflow-y: auto; }
.app-footer  { grid-area: footer; }

@media (max-width: 900px) {
  .app-layout { grid-template-columns: 1fr; grid-template-areas: "header" "sidebar" "main" "footer"; }
  .app-sidebar { position: static; height: auto; }
}
```

---

### 5.3 — Header

```html
<header class="app-header">
  <div class="header-inner">
    <div class="brand">
      <div class="brand-logo">S</div>
      <div>
        <div class="brand-name">Seed Investments</div>
        <div class="brand-sub">AMFI-Registered · ARN: XXXXXXX</div>
      </div>
    </div>
    <nav class="header-nav">
      <a href="/">Home</a>
      <a href="/services">Services</a>
      <a href="/tools" class="active">Tools</a>
      <a href="/clarity-session" class="btn-nav-cta">Book Clarity Session →</a>
    </nav>
  </div>
</header>
```

```css
.app-header {
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
  padding: 0 2rem;
  height: 64px;
  display: flex;
  align-items: center;
}
.header-inner {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.brand { display: flex; align-items: center; gap: 12px; }
.brand-logo {
  width: 36px; height: 36px;
  background: var(--seed-navy);
  color: white;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display);
  font-size: 18px;
}
.brand-name { font-family: var(--font-display); font-size: 17px; color: var(--seed-navy); }
.brand-sub  { font-size: 10px; color: var(--text-muted); letter-spacing: 0.03em; margin-top: 1px; }
.header-nav { display: flex; align-items: center; gap: 24px; font-size: 14px; }
.header-nav a { color: var(--text-muted); text-decoration: none; transition: color 0.15s; }
.header-nav a:hover, .header-nav a.active { color: var(--seed-navy); }
.btn-nav-cta {
  background: var(--seed-navy);
  color: white !important;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  font-size: 13px !important;
}
```

---

### 5.4 — Sidebar Form

Replace the current form styling with a premium sidebar:

```css
.app-sidebar {
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  padding: 0;
  display: flex;
  flex-direction: column;
}

.sidebar-section {
  padding: 1.5rem;
  border-bottom: 1px solid var(--neutral-100);
}
.sidebar-section-title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-hint);
  margin-bottom: 1.25rem;
}

/* Input group redesign */
.input-group {
  margin-bottom: 1.25rem;
}
.input-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
}
.input-group .input-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
  line-height: 1.4;
}
.input-wrap {
  position: relative;
}
.input-prefix {
  position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
  font-size: 13px; color: var(--text-muted);
}
input[type="number"], input[type="text"] {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 28px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-body);
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}
input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(26,86,219,0.12);
}

/* Slider redesign */
.slider-row {
  display: flex; align-items: center; gap: 12px; margin-top: 6px;
}
input[type="range"] {
  flex: 1; height: 4px;
  -webkit-appearance: none; appearance: none;
  background: var(--neutral-200);
  border-radius: 2px; outline: none;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px; height: 18px;
  background: var(--seed-navy);
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  cursor: pointer;
}
.slider-val {
  min-width: 48px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-data);
  color: var(--seed-navy);
  background: var(--neutral-100);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}
```

---

### 5.5 — Submit Button

```css
.btn-primary {
  width: 100%;
  height: 48px;
  background: var(--seed-navy);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: background 0.15s, transform 0.1s;
  position: relative;
  overflow: hidden;
}
.btn-primary:hover  { background: #0d3460; }
.btn-primary:active { transform: scale(0.99); }
.btn-primary:disabled { background: var(--neutral-300); cursor: not-allowed; }

/* Loading state */
.btn-primary.loading::after {
  content: '';
  position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }
```

---

### 5.6 — Results Area: KPI Row

Replace the three result cards with a premium metric strip at the top of results:

```html
<div class="kpi-strip">
  <div class="kpi-item">
    <div class="kpi-label">Corpus at retirement (median)</div>
    <div class="kpi-value" id="kpi-corpus">—</div>
  </div>
  <div class="kpi-divider"></div>
  <div class="kpi-item">
    <div class="kpi-label">Probability plan succeeds</div>
    <div class="kpi-value kpi-dynamic" id="kpi-success">—</div>
  </div>
  <div class="kpi-divider"></div>
  <div class="kpi-item">
    <div class="kpi-label">Median age corpus lasts</div>
    <div class="kpi-value" id="kpi-age">—</div>
  </div>
  <div class="kpi-divider"></div>
  <div class="kpi-item">
    <div class="kpi-label">Monthly need at retirement</div>
    <div class="kpi-value" id="kpi-expense">—</div>
  </div>
</div>
```

```css
.kpi-strip {
  display: flex;
  background: var(--seed-navy);
  border-radius: var(--radius-lg);
  padding: 1.5rem 2rem;
  gap: 0;
  margin-bottom: 2rem;
  align-items: center;
}
.kpi-item {
  flex: 1;
  text-align: center;
  padding: 0 1rem;
}
.kpi-label {
  font-size: 11px;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
  font-weight: 500;
}
.kpi-value {
  font-family: var(--font-display);
  font-size: 2rem;
  color: white;
  line-height: 1;
}
.kpi-divider {
  width: 1px;
  height: 48px;
  background: rgba(255,255,255,0.15);
  flex-shrink: 0;
}
/* Dynamic colour on success rate */
.kpi-value.rate-excellent { color: #6EE7B7; }
.kpi-value.rate-good      { color: #A7F3D0; }
.kpi-value.rate-moderate  { color: #FDE68A; }
.kpi-value.rate-poor      { color: #FECACA; }
.kpi-value.rate-critical  { color: #FCA5A5; }
```

---

### 5.7 — Chart Containers

```css
.chart-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
}
.chart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}
.chart-card-title {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--seed-navy);
  line-height: 1.2;
}
.chart-card-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
  line-height: 1.4;
}
.chart-canvas-wrap {
  position: relative;
  width: 100%;
}
```

---

### 5.8 — PDF Button (elevated style)

```css
.btn-pdf {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1.5px solid var(--seed-navy);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--seed-navy);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.btn-pdf:hover {
  background: var(--seed-navy);
  color: white;
}
.btn-pdf svg { width: 16px; height: 16px; }
```

---

## PART 6 — RESPONSIVE DESIGN SPECIFICATION

### 6.1 — Breakpoint System

```css
/* Mobile first */
/* sm:  480px  — large phones, landscape mobile */
/* md:  768px  — tablets */
/* lg:  900px  — small laptops, sidebar kicks in */
/* xl: 1280px  — desktop */
/* 2xl: 1600px — wide/ultra */
```

### 6.2 — Mobile layout (< 900px)

- Sidebar becomes a collapsible accordion at top of page
- "Edit Inputs" button fixed at bottom of screen when results are showing
- KPI strip becomes a 2×2 grid (not a horizontal strip)
- Chart height reduces from 420px to 260px
- Form grid is single column
- PDF button label shortens to "Download PDF"
- Navigation collapses to hamburger menu

```css
@media (max-width: 900px) {
  .app-layout {
    grid-template-columns: 1fr;
    grid-template-areas: "header" "sidebar" "main" "footer";
  }
  .app-sidebar {
    position: static;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border);
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.35s ease;
  }
  .app-sidebar.open { max-height: 2000px; }
  .kpi-strip {
    flex-wrap: wrap;
    gap: 1rem;
  }
  .kpi-item { flex: calc(50% - 0.5rem); }
  .kpi-divider { display: none; }
  .kpi-value { font-size: 1.5rem; }
  .chart-canvas-wrap canvas { max-height: 260px; }
}

@media (max-width: 480px) {
  .app-main { padding: 1rem; }
  .kpi-value { font-size: 1.25rem; }
  .chart-card { padding: 1rem; border-radius: var(--radius-md); }
  .chart-card-title { font-size: 15px; }
  h1 { font-size: 1.6rem; }
}
```

**Mobile sticky edit bar:**
```html
<div class="mobile-edit-bar" id="mobile-edit-bar">
  <button onclick="toggleSidebar()">
    Edit Inputs ✏
  </button>
  <button onclick="document.getElementById('download-pdf-button').click()">
    Download PDF ↓
  </button>
</div>
```

```css
.mobile-edit-bar {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  padding: 12px 16px;
  gap: 12px;
  z-index: 100;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.06);
}
@media (max-width: 900px) {
  .mobile-edit-bar { display: flex; }
  .app-main        { padding-bottom: 80px; } /* avoid content behind bar */
}
.mobile-edit-bar button {
  flex: 1;
  height: 44px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
```

---

## PART 7 — PERFORMANCE & CODE QUALITY

### 7.1 — Web Worker for simulation (eliminates UI freeze)

10,000 simulations take ~1.5–3 seconds on mobile. This freezes the main thread. Move it to a Web Worker.

**Create `simulation.worker.js`:**
```javascript
// simulation.worker.js
self.onmessage = function(e) {
  const { params } = e.data;
  const results = runSimulation(params);
  self.postMessage({ results });
};

function generateRandomReturn(mean, stdDev) {
  const u1 = Math.random(), u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * stdDev;
}

function runSimulation(params) {
  // ... full simulation logic here ...
  // Return { simulationResults }
}
```

**In main JS:**
```javascript
const worker = new Worker('simulation.worker.js');

document.getElementById('retirement-form').addEventListener('submit', function(e) {
  e.preventDefault();
  runButton.textContent = 'Calculating...';
  runButton.disabled = true;
  runButton.classList.add('loading');

  const params = collectFormParams(); // extract all input values
  worker.postMessage({ params });
});

worker.onmessage = function(e) {
  runButton.classList.remove('loading');
  displayResults(e.data.results);
};
```

---

### 7.2 — Input validation (comprehensive)

```javascript
function validateInputs(params) {
  const errors = [];

  if (params.currentAge < 18 || params.currentAge > 80)
    errors.push('Current age must be between 18 and 80.');
  if (params.retirementAge <= params.currentAge)
    errors.push('Retirement age must be greater than current age.');
  if (params.retirementAge > 80)
    errors.push('Retirement age cannot exceed 80.');
  if (params.lifeExpectancy <= params.retirementAge)
    errors.push('Life expectancy must be greater than retirement age.');
  if (params.lifeExpectancy > 100)
    errors.push('Life expectancy cannot exceed 100.');
  if (params.currentSavings < 0)
    errors.push('Current savings cannot be negative.');
  if (params.monthlySavings < 500)
    errors.push('Monthly SIP must be at least ₹500.');
  if (params.monthlyExpenses <= 0)
    errors.push('Monthly expenses must be positive.');
  if (params.expectedReturn < 1 || params.expectedReturn > 30)
    errors.push('Expected return must be between 1% and 30%.');
  if (params.postRetirementReturn >= params.expectedReturn)
    errors.push('Post-retirement return should typically be lower than pre-retirement return.');

  return errors;
}

function showValidationErrors(errors) {
  const box = document.getElementById('validation-errors');
  if (errors.length === 0) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = '<ul>' + errors.map(e => `<li>${e}</li>`).join('') + '</ul>';
}
```

---

### 7.3 — CDN version pinning

```html
<!-- WRONG (unpinned — could break on library update) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- CORRECT (pinned version + integrity hash) -->
<script 
  src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"
  integrity="sha384-[HASH]"
  crossorigin="anonymous">
</script>
```

Run `openssl dgst -sha384 -binary chart.umd.min.js | openssl base64 -A` to generate integrity hashes.

---

### 7.4 — XSS fix for client name in PDF

```javascript
// WRONG (current code — unsafe):
pdfHeader.innerHTML = `...Prepared for: <strong>${clientName}</strong>...`;

// CORRECT (sanitize first):
function sanitize(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
const safeClientName = sanitize(clientName);
pdfHeader.innerHTML = `...Prepared for: <strong>${safeClientName}</strong>...`;
```

---

### 7.5 — Number formatting utility (no more raw JS floats on screen)

```javascript
const INR = {
  crores: (v)  => `₹${(v / 10000000).toFixed(2)} Cr`,
  lakhs:  (v)  => `₹${(v / 100000).toFixed(1)} L`,
  smart:  (v)  => v >= 10000000 ? INR.crores(v) : INR.lakhs(v),
  monthly:(v)  => `₹${Math.round(v).toLocaleString('en-IN')}/mo`,
};

// Usage throughout:
document.getElementById('corpus_value_50').textContent = INR.crores(medianResult.corpusAtRetirement);
```

---

## PART 8 — SAAS INTEGRATION HOOKS

These enable the tool to connect to Seed's broader Next.js + Supabase stack.

---

### 8.1 — Save simulation to Supabase

```javascript
async function saveSimulationResult(clientName, params, results) {
  const payload = {
    client_name: clientName,
    inputs: params,
    median_corpus: results.median.corpusAtRetirement,
    success_rate: results.successRate,
    simulated_at: new Date().toISOString(),
    advisor_id: getCurrentAdvisorId(), // from auth context
  };

  const response = await fetch('/api/simulations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const { id } = await response.json();
    showShareLink(`/simulations/${id}`); // shareable link for client
  }
}
```

**Supabase table schema:**
```sql
CREATE TABLE retirement_simulations (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advisor_id    UUID REFERENCES advisors(id),
  client_name   TEXT NOT NULL,
  inputs        JSONB NOT NULL,
  median_corpus NUMERIC,
  success_rate  NUMERIC,
  simulated_at  TIMESTAMPTZ DEFAULT NOW(),
  pdf_url       TEXT,
  shared_token  TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex')
);

-- RLS: advisors can only see their own simulations
ALTER TABLE retirement_simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advisor_own_sims" ON retirement_simulations
  FOR ALL USING (advisor_id = auth.uid());
```

---

### 8.2 — Scenario comparison (show 2 scenarios side by side)

```javascript
let savedScenarios = [];

function saveScenario() {
  if (savedScenarios.length >= 3) {
    alert('Maximum 3 scenarios can be compared. Remove one first.');
    return;
  }
  savedScenarios.push({
    label: document.getElementById('clientName').value || `Scenario ${savedScenarios.length + 1}`,
    params: collectFormParams(),
    results: lastResults,
  });
  renderScenarioComparison();
}

function renderScenarioComparison() {
  // Show a horizontal comparison table of key metrics across scenarios
  // Highlight best value in each row
}
```

---

### 8.3 — Analytics event hooks

```javascript
// Track key user interactions (connect to your analytics provider)
function track(event, properties = {}) {
  if (typeof gtag !== 'undefined') {
    gtag('event', event, properties);
  }
  // Or: analytics.track(event, properties); // Segment, Mixpanel, etc.
}

// Fire these:
track('simulation_run',    { success_rate: successRate, years_to_retirement: yearsToRetirement });
track('pdf_downloaded',    { client_name: clientName ? 'provided' : 'anonymous' });
track('clarity_cta_click', { from: 'low_success_rate', rate: successRate });
```

---

## PART 9 — IMPLEMENTATION PRIORITY ORDER

Follow this exact sequence. Don't jump to UI before fixing the model.

```
WEEK 1 — Model & Compliance (build trust)
  ├── Day 1–2: Fix Bug #1 (expense inflation)
  ├── Day 2:   Fix Bug #2 (add volatility sliders)
  ├── Day 3:   Fix Bug #3 (monthly SIP loop)
  ├── Day 3:   Add all SEBI disclaimers (screen + PDF)
  └── Day 4–5: Add SIP step-up, 5-tier success rate colours, expense projection hint

WEEK 2 — Visualisation (build conviction)
  ├── Day 1–2: Full journey chart (accumulation + drawdown combined)
  ├── Day 2–3: Outcome histogram chart
  ├── Day 3:   Success rate gauge
  └── Day 4–5: 3-Bucket allocation callout section

WEEK 3 — UI Redesign (build credibility)
  ├── Day 1:   New design system (fonts, CSS variables, colour tokens)
  ├── Day 2:   Header + sidebar layout
  ├── Day 2–3: KPI strip + chart card components
  ├── Day 3–4: Responsive / mobile layout + sticky edit bar
  └── Day 5:   PDF redesign with proper letterhead

WEEK 4 — Engineering Hardening (build reliability)
  ├── Day 1:   Web Worker for simulation
  ├── Day 2:   Full input validation
  ├── Day 2:   CDN pinning + SRI hashes
  ├── Day 3:   XSS fix + number formatting utility
  └── Day 4–5: Supabase save hooks + analytics events
```

---

## PART 10 — ACCEPTANCE CRITERIA

Before calling this production-ready, verify every item:

### Financial Model
- [ ] Running simulation with 30yr old, ₹75k/month expenses, 5% inflation, 60yr retirement shows expenses ~₹2L/month (not ₹75k) in results
- [ ] Changing volatility slider from 10% to 22% significantly widens the outcome range
- [ ] Results with monthly SIP loop differ from annual lump-sum by ≤8% on corpus
- [ ] SIP step-up at 5%/yr shows meaningfully higher corpus than 0%

### Compliance
- [ ] SEBI disclaimer visible on screen before results are shown
- [ ] SEBI disclaimer with ARN visible in PDF on every page equivalent
- [ ] PDF header says "For illustrative purposes only" in bold
- [ ] "Not investment advice" language present in form and results

### Visualisation
- [ ] Full journey chart shows both accumulation and drawdown phases
- [ ] Retirement age is visually marked on journey chart
- [ ] Histogram shows distribution of final corpus values
- [ ] Success rate is shown as a gauge/arc, not just a number

### UX
- [ ] On a 375px mobile screen, all inputs are usable without horizontal scroll
- [ ] Results are readable on 375px without horizontal scroll
- [ ] "Edit Inputs" sticky bar appears on mobile after simulation runs
- [ ] Simulation runs without freezing the UI (loading state visible)

### Code Quality
- [ ] All CDN scripts have pinned version numbers
- [ ] Client name input is sanitized before HTML insertion
- [ ] Numbers with >2 decimal places never reach the screen
- [ ] Edge case: retirement at same year as current (validation catches it)
- [ ] Edge case: life expectancy = 100 runs without crashing

---

## APPENDIX A — SEBI DISCLAIMER LANGUAGE (EXACT TEXT)

Copy this verbatim for all client-facing placements:

> **Important Disclosure:** This simulation is provided for illustrative and educational purposes only and does not constitute investment advice, a recommendation, or an offer to buy or sell any financial product. Mutual Fund investments are subject to market risks. Past performance is not indicative of future returns. Please read the Scheme Information Document (SID), Key Information Memorandum (KIM), and Statement of Additional Information (SAI) carefully before investing. The projections shown are hypothetical and based on assumed rates of return — actual results may differ materially. Investors are advised to consult a SEBI-registered Investment Adviser for personalised financial planning.
>
> **Seed Investments** is an AMFI-Registered Mutual Fund Distributor. ARN: [YOUR ARN]. CIN: [IF APPLICABLE]. Registered Address: [ADDRESS]. SEBI Registration is not applicable for MFDs; distribution activity is governed by AMFI Code of Conduct.

---

## APPENDIX B — FORMULA REFERENCE

| Formula | Purpose | Correct implementation |
|---|---|---|
| Inflation-adjusted expenses | Convert today's expenses to retirement-date rupees | `monthlyExpenses × (1 + inflation)^yearsToRetirement` |
| Monthly SIP compounding | Each monthly deposit grows at monthly rate | `(corpus + sip) × (1 + annualReturn/12)` each month |
| Box-Muller transform | Generate normally distributed random returns | `mean + stdDev × √(-2ln(u₁)) × cos(2π·u₂)` ✅ Already correct |
| Log-normal returns | Model geometric return paths | `val × exp((μ - σ²/2) + σ·Z)` — more accurate than arithmetic |
| Required Corpus (3-Bucket) | Seed's proprietary formula | `Monthly Need ÷ 0.0066` (Seed 3-Bucket System™) |
| Percentile lookup | Get 10th / 50th / 90th outcome | Sort ascending, index at `n × p` |

---

*Document Version: 1.0 · Prepared by Seed Investments Build Team · All specifications are for internal engineering use only · © Seed Investments*
