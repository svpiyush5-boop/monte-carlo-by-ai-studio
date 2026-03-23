/**
 * v3_logic.js
 * Core application logic for Monte Carlo Retirement Planner V3
 */

// -- UI Initialization & Interactivity --

document.addEventListener('DOMContentLoaded', () => {
    // Accordions
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const section = header.parentElement;
            const body = header.nextElementSibling;

            const isOpen = section.classList.contains('open');

            // Close all sections first
            document.querySelectorAll('.accordion-section.open').forEach(s => {
                s.classList.remove('open');
                s.classList.add('collapsed');
                s.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
                s.querySelector('.accordion-body').style.display = 'none';
            });

            if (isOpen) {
                // It was open and we just closed it (and all others). Leave it closed.
            } else {
                // It was closed, so open it
                section.classList.remove('collapsed');
                section.classList.add('open');
                header.setAttribute('aria-expanded', 'true');
                body.style.display = 'block';
            }
        });
    });

    // ── Form submit → run simulation (prevent native page reload) ──────────
    const form = document.getElementById('retirement-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            window.runSimulation();
        });
    }

    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.addEventListener('click', () => {
        const root = document.documentElement;
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        themeBtn.innerHTML = next === 'dark' ? '&#9728;' : '&#9790;';
        if (window.lastResults) renderCharts(window.lastResults.params, window.lastResults);
    });

    // Initialize UI
    updateTimeline();
    updateHints();
    document.querySelectorAll('.field-slider').forEach(syncSlider);

    // Auth logic if feature flagged
    const authEnabled = false; // or check window.AUTH_ENABLED
    if (authEnabled) {
        document.getElementById('user-btn').style.display = 'flex';
        document.getElementById('user-btn').addEventListener('click', () => {
            document.getElementById('auth-modal').style.display = 'flex';
        });
    }
});

// Sidebar Collapse state — references the root app-shell div
const appShell = document.getElementById('app-shell');

function collapseSidebar() {
    appShell.classList.add('sidebar-collapsed');
    setTimeout(() => { Object.values(Chart.instances).forEach(c => c.resize()); }, 350);
}

function expandSidebar() {
    appShell.classList.remove('sidebar-collapsed');
    setTimeout(() => { Object.values(Chart.instances).forEach(c => c.resize()); }, 350);
}

document.getElementById('sidebar-toggle').addEventListener('click', () => {
    if (appShell.classList.contains('sidebar-collapsed')) expandSidebar();
    else collapseSidebar();
});

// Mobile sidebar open/close
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('bs-overlay');
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('open');
}

// Mobile Bottom Sheet (for backward compat)
function openBottomSheet() { toggleMobileSidebar(); }
function closeBottomSheet() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('bs-overlay');
    if (sidebar.classList.contains('mobile-open')) { sidebar.classList.remove('mobile-open'); overlay.classList.remove('open'); }
}

// Stepper inputs
function stepAge(id, diff) {
    const input = document.getElementById(id);
    const val = parseInt(input.value) + diff;
    if (val >= parseInt(input.min) && val <= parseInt(input.max)) {
        input.value = val;
        updateTimeline();
    }
}

// Slider sync
function syncSlider(slider) {
    const fill = document.getElementById(slider.id + '-fill');
    const valSpan = document.getElementById(slider.id + '-val');
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    fill.style.width = pct + '%';
    valSpan.innerText = slider.value + '%';
}

// Risk Presets
function setRisk(type, btn) {
    document.querySelectorAll('.risk-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const preRetReturn = document.getElementById('expectedReturn');
    const preRetVol = document.getElementById('preRetirementVol');
    const postRetReturn = document.getElementById('postRetirementReturn');
    const postRetVol = document.getElementById('postRetirementVol');

    if (type === 'conservative') {
        preRetReturn.value = 9; preRetVol.value = 8;
        postRetReturn.value = 6; postRetVol.value = 5;
    } else if (type === 'balanced') {
        preRetReturn.value = 12; preRetVol.value = 15;
        postRetReturn.value = 7; postRetVol.value = 8;
    } else if (type === 'aggressive') {
        preRetReturn.value = 15; preRetVol.value = 22;
        postRetReturn.value = 8; postRetVol.value = 12;
    }

    syncSlider(preRetReturn); syncSlider(preRetVol);
    syncSlider(postRetReturn); syncSlider(postRetVol);
}

// Hints & Formatting
const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const INR_LAKH = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

const formatLakhsCrores = (val) => {
    if (val === null || val === undefined) return '—';
    if (val >= 10000000) return '₹' + (val / 10000000).toFixed(1) + 'Cr';
    if (val >= 100000) return '₹' + (val / 100000).toFixed(1) + 'L';
    return '₹' + Math.round(val).toLocaleString('en-IN');
};

function formatLakhs(num) {
    return '&#8377;' + INR_LAKH.format(num / 100000) + ' Lakhs';
}

function updateHints() {
    const savings = parseInt(document.getElementById('currentSavings').value) || 0;
    const sip = parseInt(document.getElementById('monthlySavings').value) || 0;
    const exp = parseInt(document.getElementById('monthlyExpenses').value) || 0;
    const inf = parseInt(document.getElementById('inflation').value) || 6;
    const currentAge = parseInt(document.getElementById('currentAge').value) || 30;
    const retireAge = parseInt(document.getElementById('retirementAge').value) || 60;

    document.getElementById('savings-display').innerHTML = formatLakhs(savings);
    document.getElementById('sip-annual-display').innerHTML = formatLakhs(sip * 12) + ' / year';

    const years = Math.max(0, retireAge - currentAge);
    const inflatedExp = exp * Math.pow(1 + (inf / 100), years);
    document.getElementById('expense-inflation-hint').innerHTML = `&#8377;${(exp / 1000).toFixed(0)}k today &rarr; <strong>${INR.format(inflatedExp)}/mo</strong> at retirement`;
}

function updateTimeline() {
    const curr = parseInt(document.getElementById('currentAge').value);
    const ret = parseInt(document.getElementById('retirementAge').value);
    const life = parseInt(document.getElementById('lifeExpectancy').value);

    const timeline = document.getElementById('age-timeline');
    if (curr >= ret || ret >= life) return;

    const total = life - curr;
    const accumPct = ((ret - curr) / total) * 100;

    timeline.innerHTML = `
        <div class="timeline-bar">
            <div class="timeline-accum" style="width:${accumPct}%"></div>
            <div class="timeline-retire"></div>
        </div>
        <div class="timeline-markers">
            <span>Age ${curr}</span>
            <span>Retire ${ret}</span>
            <span>Plan until ${life}</span>
        </div>
    `;
}

// Toasts
function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const currentToasts = container.querySelectorAll('.toast');
    if (currentToasts.length > 2) currentToasts[0].remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = msg;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast-show'));
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 250);
    }, 4000);
}

// -- Core Simulation Logic --

function collectFormParams() {
    return {
        // Ages
        currentAge: parseInt(document.getElementById('currentAge').value),
        retirementAge: parseInt(document.getElementById('retirementAge').value),
        lifeExpectancy: parseInt(document.getElementById('lifeExpectancy').value),

        // Corpus
        currentSavings: parseInt(document.getElementById('currentSavings').value) || 0,
        monthlySavings: parseInt(document.getElementById('monthlySavings').value) || 0,
        sipStepUp: parseFloat(document.getElementById('sipStepUp').value) || 0,

        // Returns — worker expects DECIMALS (e.g. 0.12) and specific param names
        expectedReturn: parseFloat(document.getElementById('expectedReturn').value) / 100,
        returnStdDevPre: parseFloat(document.getElementById('preRetirementVol').value) / 100,
        postRetirementReturn: parseFloat(document.getElementById('postRetirementReturn').value) / 100,
        returnStdDevPost: parseFloat(document.getElementById('postRetirementVol').value) / 100,

        // Expenses — worker expects withdrawalInflation as decimal
        monthlyExpenses: parseInt(document.getElementById('monthlyExpenses').value) || 0,
        withdrawalInflation: parseFloat(document.getElementById('inflation').value) / 100,

        // Simulation settings
        numSimulations: parseInt(document.getElementById('numSimulations').value) || 10000,
        taxDragPct: parseFloat(document.getElementById('taxDragPct').value) || 0,

        // Optional advanced inputs (matching worker param names exactly)
        additionalLumpsum: parseInt(document.getElementById('additionalLumpsum').value) || 0,
        lumpsumYear: parseInt(document.getElementById('lumpsumYear').value) || 0,
        partTimeIncome: parseInt(document.getElementById('partTimeIncome').value) || 0,
        partTimeUntilAge: parseInt(document.getElementById('partTimeUntilAge').value) || 70,

        // Meta
        clientName: document.getElementById('clientName').value
    };
}

function validateInputs(params) {
    const errObj = document.getElementById('validation-errors');
    const errors = [];

    if (params.currentAge >= params.retirementAge) errors.push("Retirement age must be strictly greater than current age.");
    if (params.retirementAge >= params.lifeExpectancy) errors.push("Life expectancy must be greater than retirement age.");
    if (params.monthlyExpenses < 1000) errors.push("Monthly expense is unrealistically low.");

    if (errors.length > 0) {
        errObj.innerHTML = '<strong>Please correct the following:</strong><ul style="margin-left:16px; margin-top:4px;">' + errors.map(e => `<li>${e}</li>`).join('') + '</ul>';
        errObj.style.display = 'block';
        return false;
    }
    errObj.style.display = 'none';
    return true;
}

let chartObj = { journey: null, histogram: null, drawdown: null };
window.lastResults = null;

// ── Inline Monte Carlo Simulation Engine ─────────────────────────────────────
// (Web Workers are blocked on file:// URLs; this runs on the main thread.)
function _mcGenerateRandomReturn(mean, stdDev) {
    const u1 = Math.random() || 1e-10;
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * Math.random());
    return mean + z * stdDev;
}
function _mcPctile(sortedArr, p) {
    if (!sortedArr.length) return 0;
    return sortedArr[Math.min(Math.floor(sortedArr.length * p), sortedArr.length - 1)];
}
function runMonteCarlo(params) {
    const {
        currentAge, retirementAge, lifeExpectancy,
        currentSavings, monthlySavings: initSIP, sipStepUp,
        expectedReturn, postRetirementReturn,
        returnStdDevPre, returnStdDevPost,
        monthlyExpenses, withdrawalInflation,
        numSimulations,
        additionalLumpsum = 0, lumpsumYear = 0,
        partTimeIncome = 0, partTimeUntilAge = 0,
        taxDragPct = 0,
    } = params;

    const ytr = retirementAge - currentAge;
    const yir = lifeExpectancy - retirementAge;
    const taxD = taxDragPct / 100;
    const adjMonthlyExp = monthlyExpenses * Math.pow(1 + withdrawalInflation, ytr);
    const annualWithdrawal = adjMonthlyExp * 12;

    // Per-age balance accumulator for fan-band percentiles
    const balsByAge = {};
    for (let a = currentAge; a <= lifeExpectancy; a++) balsByAge[a] = [];

    const corpusAtRets = [], agesAtDepletion = [];

    for (let sim = 0; sim < numSimulations; sim++) {
        let corpus = currentSavings, monthlySavings = initSIP;
        balsByAge[currentAge].push(corpus);

        // Accumulation
        for (let yr = 0; yr < ytr; yr++) {
            const r = Math.max(_mcGenerateRandomReturn(expectedReturn - taxD, returnStdDevPre), -0.999);
            const mr = Math.pow(1 + r, 1 / 12) - 1;
            const age = currentAge + yr + 1;
            for (let mo = 0; mo < 12; mo++) corpus = (corpus + monthlySavings) * (1 + mr);
            if (sipStepUp > 0) monthlySavings *= (1 + sipStepUp / 100);
            if (additionalLumpsum > 0 && lumpsumYear > 0 && yr + 1 === lumpsumYear) corpus += additionalLumpsum;
            balsByAge[age].push(Math.max(0, corpus));
        }

        const car = Math.max(0, corpus);
        corpusAtRets.push(car);
        let rc = car, aod = lifeExpectancy, depleted = false;

        // Drawdown
        for (let yr = 0; yr < yir; yr++) {
            const age = retirementAge + yr + 1;
            const r = Math.max(_mcGenerateRandomReturn(postRetirementReturn - taxD, returnStdDevPost), -0.999);
            const pt = (partTimeIncome > 0 && age <= partTimeUntilAge) ? partTimeIncome * 12 : 0;
            rc = rc * (1 + r) - annualWithdrawal + pt;
            if (rc <= 0) {
                aod = age; depleted = true;
                for (let a = age; a <= lifeExpectancy; a++) balsByAge[a].push(0);
                break;
            }
            balsByAge[age].push(Math.max(0, rc));
        }
        if (!depleted && balsByAge[lifeExpectancy].length < sim + 1) {
            balsByAge[lifeExpectancy].push(Math.max(0, rc));
        }
        agesAtDepletion.push(aod);
    }

    // Build fan-band paths (p80 ALWAYS > p50 > p10)
    const p10Path = [], p50Path = [], p80Path = [];
    for (let a = currentAge; a <= lifeExpectancy; a++) {
        const v = balsByAge[a].slice().sort((x, y) => x - y);
        p10Path.push({ age: a, balance: _mcPctile(v, 0.10) });
        p50Path.push({ age: a, balance: _mcPctile(v, 0.50) });
        p80Path.push({ age: a, balance: _mcPctile(v, 0.80) });
    }

    const n = agesAtDepletion.length;
    const ok = agesAtDepletion.filter(a => a >= lifeExpectancy).length;
    const sortedCAR = corpusAtRets.slice().sort((a, b) => a - b);
    const sortedAges = agesAtDepletion.slice().sort((a, b) => a - b);

    const minC = sortedCAR[0], maxC = sortedCAR[sortedCAR.length - 1];
    const bSz = (maxC - minC) / 40 || 1;
    const bins = Array.from({ length: 40 }, (_, i) => ({
        min: minC + i * bSz, max: minC + (i + 1) * bSz, count: 0
    }));
    sortedCAR.forEach(v => bins[Math.min(Math.floor((v - minC) / bSz), 39)].count++);

    return {
        p10Path, p50Path, p80Path,
        successRate: (ok / n) * 100,
        criticalFailRate: (agesAtDepletion.filter(a => a < lifeExpectancy - 5).length / n) * 100,
        adjustedMonthlyExpenses: adjMonthlyExp,
        annualWithdrawal,
        medianAgeAtDepletion: _mcPctile(sortedAges, 0.50),
        corpusAtRetirement: {
            p10: _mcPctile(sortedCAR, 0.10),
            p50: _mcPctile(sortedCAR, 0.50),
            p80: _mcPctile(sortedCAR, 0.80),
        },
        corpusHistogram: { bins },
        yearsToRetirement: ytr,
        yearsInRetirement: yir,
    };
}

window.runSimulation = function () {
    const params = collectFormParams();
    if (!validateInputs(params)) {
        showToast('Validation failed. Check inputs.', 'error');
        return;
    }

    const btn = document.getElementById('run-button');
    btn.classList.add('loading');
    btn.innerText = 'Simulating...';

    if (window.innerWidth <= 900) closeBottomSheet();

    // Defer 20ms so the loading state renders before the heavy computation
    setTimeout(() => {
        try {
            const res = runMonteCarlo(params);
            btn.classList.remove('loading');
            btn.innerText = 'Chart My Future \u2192';

            window.lastResults = res;
            window.lastResults.params = params;

            renderKPIs(res);
            renderCharts(params, res);
            buildNarrative(params, res);

            if (window.innerWidth <= 900) {
                document.getElementById('charts-scroll').scrollIntoView({ behavior: 'smooth' });
            }
        } catch (err) {
            btn.classList.remove('loading');
            btn.innerText = 'Chart My Future \u2192';
            showToast('Simulation error: ' + err.message, 'error');
            console.error('Simulation error:', err);
        }
    }, 20);
};

// -- Rendering --

function renderKPIs(res) {
    // New format: res.corpusAtRetirement is { p10, p50, p80 }
    const c = res.corpusAtRetirement.p50;
    const c10 = res.corpusAtRetirement.p10;
    const c80 = res.corpusAtRetirement.p80;

    document.getElementById('kpi-corpus').innerText = formatLakhsCrores(c);
    document.getElementById('kpi-corpus-range').innerText =
        `p10: ${formatLakhsCrores(c10)} — p80: ${formatLakhsCrores(c80)}`;

    const sr = res.successRate.toFixed(1);
    const kpiSucc = document.getElementById('kpi-success');
    kpiSucc.innerText = sr + '%';

    // Dynamic KPI color styling
    kpiSucc.className = 'kpi-value kpi-dynamic';
    const accent = document.getElementById('kpi-accent');
    if (sr >= 90) { kpiSucc.classList.add('rate-excellent'); accent.style.background = '#6EE7B7'; }
    else if (sr >= 75) { kpiSucc.classList.add('rate-good'); accent.style.background = '#86EFAC'; }
    else if (sr >= 50) { kpiSucc.classList.add('rate-moderate'); accent.style.background = '#FDE68A'; }
    else if (sr >= 25) { kpiSucc.classList.add('rate-poor'); accent.style.background = '#FCA5A5'; }
    else { kpiSucc.classList.add('rate-critical'); accent.style.background = '#F87171'; }

    const mdAge = res.medianAgeAtDepletion;
    document.getElementById('kpi-age').innerText = mdAge >= 100 ? '100+ Years' : Math.floor(mdAge);

    document.getElementById('kpi-expense').innerText = formatLakhsCrores(res.adjustedMonthlyExpenses) + '/mo';

    document.getElementById('mobile-kpi-success').innerText = sr + '%';
    document.getElementById('mobile-kpi-success').style.color = sr >= 75 ? 'var(--seed-teal)' : (sr >= 50 ? 'var(--seed-amber)' : 'var(--seed-red)');
}

function buildNarrative(params, result) {
    const successRate = result.successRate;
    const corpus = (result.corpusAtRetirement.p50 / 10000000).toFixed(2);
    const expense = formatLakhsCrores(result.adjustedMonthlyExpenses);

    let tone, detail;
    if (successRate >= 85) {
        tone = 'strong';
        detail = `a strong <strong>${successRate.toFixed(0)}% probability of success</strong>. Your plan is well-positioned.`;
    } else if (successRate >= 75) {
        tone = 'good';
        detail = `a healthy <strong>${successRate.toFixed(0)}% probability of success</strong>. Minor adjustments can push this above 85%.`;
    } else if (successRate >= 60) {
        tone = 'moderate';
        detail = `a moderate <strong>${successRate.toFixed(0)}% probability of success</strong>. The plan needs attention \u2014 consider increasing your SIP or extending your working years.`;
    } else if (successRate >= 40) {
        tone = 'poor';
        detail = `a vulnerable <strong>${successRate.toFixed(0)}% probability of success</strong>. Significant changes to savings or retirement date are recommended.`;
    } else {
        tone = 'critical';
        detail = `a critical <strong>${successRate.toFixed(0)}% probability of success</strong>. This plan requires an urgent strategy rethink \u2014 please book a Clarity Session.`;
    }

    document.getElementById('narrative-accent').className = `narrative-accent accent-${tone}`;
    document.getElementById('narrative-text').innerHTML =
        `Based on your goal to retire at age ${params.retirementAge}, your plan shows ${detail} Your projected median corpus of <strong>\u20B9${corpus} Cr</strong> is designed to fund a <strong>${expense}/month</strong> retirement lifestyle.`;
}

// Chart Global Settings
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = "#64748B";
Chart.defaults.font.weight = '500';

function getThemeColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

function renderCharts(params, res) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
    const textColor = isDark ? '#94A3B8' : '#64748B';
    Chart.defaults.color = textColor;
    buildJourneyChart(params, res, gridColor);
    buildHistogramChart(params, res, gridColor);
    buildDrawdownChart(params, res, gridColor);
}

/**
 * Pad a path (array of {age, balance}) with zero-balance points from its last
 * recorded age up to lifeExpectancy so the chart never cuts short.
 */
function padPath(path, lifeExpectancy) {
    if (!path || !path.length) return [];
    const result = [...path];
    let lastAge = result[result.length - 1].age;
    // If corpus depleted before life expectancy, fill zeros
    while (lastAge < lifeExpectancy) {
        lastAge++;
        result.push({ age: lastAge, balance: 0 });
    }
    return result;
}

/**
 * Convert path array to Chart.js {x, y} point format.
 * Using {x, y} with type:'linear' ensures xMin/xMax annotations land correctly.
 */
function toXY(path) {
    return path.map(pt => ({ x: pt.age, y: Math.max(0, pt.balance) }));
}

// Toggle a dataset visibility from the custom legend buttons
window.toggleDataset = function (chartName, datasetIndex) {
    const chart = chartObj[chartName];
    if (!chart) return;
    const meta = chart.getDatasetMeta(datasetIndex);
    meta.hidden = !meta.hidden;
    chart.update();
    // Reflect hidden state on button
    const btn = document.querySelector(`[data-chart="${chartName}"][data-ds="${datasetIndex}"]`);
    if (btn) btn.classList.toggle('legend-hidden', meta.hidden);
};

function buildJourneyChart(params, res, gridColor) {
    const ctx = document.getElementById('journeyChart').getContext('2d');
    if (chartObj.journey) chartObj.journey.destroy();

    const life = params.lifeExpectancy;
    const retAge = params.retirementAge;

    const elLifeJourney = document.getElementById('lbl-life-age-journey');
    if (elLifeJourney) elLifeJourney.innerText = life;

    // Use the pre-built year-by-year percentile paths from the worker
    // (p80 is guaranteed > p50 > p10 at every age)
    const p10 = toXY(padPath(res.p10Path, life));
    const p50 = toXY(padPath(res.p50Path, life));
    const p80 = toXY(padPath(res.p80Path, life));

    const maxP50 = Math.max(...p50.map(pt => pt.y));
    const maxP80 = Math.max(...p80.map(pt => pt.y));
    const yMaxCap = Math.max(maxP50 * 1.4, 1000000);

    const journeyAnnotations = {
        retirementLine: {
            type: 'line',
            xMin: retAge,
            xMax: retAge,
            borderColor: 'rgba(148,163,184,0.7)',
            borderWidth: 1.5,
            borderDash: [6, 4],
            label: {
                display: true,
                content: `Retire: ${retAge}`,
                position: 'start',
                yAdjust: 16,
                backgroundColor: 'rgba(11,37,69,0.9)',
                color: 'white',
                font: { family: "'Plus Jakarta Sans'", size: 10, weight: '700' },
                padding: { x: 8, y: 4 },
                borderRadius: 4
            }
        }
    };

    if (maxP80 > yMaxCap) {
        let exitPt = p80.find(pt => pt.y > yMaxCap);
        let exitAge = exitPt ? exitPt.x : life;
        let formattedMax = maxP80 >= 10000000 ? (maxP80 / 10000000).toFixed(1) + ' Cr' : (maxP80 >= 100000 ? (maxP80 / 100000).toFixed(1) + ' L' : maxP80.toLocaleString('en-IN'));
        journeyAnnotations.p80Overflow = {
            type: 'label',
            xValue: exitAge,
            yValue: yMaxCap,
            yAdjust: 12, // Move down into chart slightly
            content: `↑ extends to ₹${formattedMax}`,
            backgroundColor: 'rgba(255,255,255,0.85)',
            color: getThemeColor('--seed-teal'),
            font: { family: "'Inter'", size: 10, weight: '600' },
            padding: { x: 4, y: 2 }
        };
    }

    chartObj.journey = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Optimistic (p80)',
                    data: toXY(padPath(res.p80Path, life)),
                    borderColor: getThemeColor('--seed-teal'),
                    _mutedColor: 'rgba(13,148,136,0.3)', _glowColor: getThemeColor('--seed-teal'),
                    backgroundColor: 'rgba(13,148,136,0.06)',
                    _mutedBg: 'rgba(13,148,136,0.01)', _glowBg: 'rgba(13,148,136,0.15)',
                    borderWidth: 1.5, _glowWidth: 2.5,
                    tension: 0.2, pointRadius: 0, fill: false
                },
                {
                    label: 'Median (p50)',
                    data: p50,
                    borderColor: getThemeColor('--seed-blue'),
                    _mutedColor: 'rgba(37,99,235,0.3)', _glowColor: getThemeColor('--seed-blue'),
                    backgroundColor: 'rgba(37,99,235,0.08)',
                    _mutedBg: 'rgba(37,99,235,0.02)', _glowBg: 'rgba(37,99,235,0.15)',
                    borderWidth: 3.5, _glowWidth: 4.5,
                    tension: 0.2, pointRadius: 0,
                    fill: '+1'     // fill between median and p10
                },
                {
                    label: 'Pessimistic (p10)',
                    data: p10,
                    borderColor: getThemeColor('--seed-red'),
                    _mutedColor: 'rgba(220,38,38,0.3)', _glowColor: getThemeColor('--seed-red'),
                    backgroundColor: 'transparent',
                    _mutedBg: 'transparent', _glowBg: 'rgba(220,38,38,0.08)',
                    borderWidth: 1.5, _glowWidth: 2.5,
                    tension: 0.2, pointRadius: 0,
                    borderDash: [4, 3],
                    segment: {
                        borderColor: ctx => ctx.p0.parsed.y === 0 && ctx.p1.parsed.y === 0 ? 'transparent' : undefined
                    }
                }
            ]
        },
        options: {
            clip: false, // Ensure label annotations can bleed
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },   // we use custom HTML legend
                tooltip: {
                    backgroundColor: 'rgba(11,37,69,0.95)',
                    titleColor: '#fff',
                    bodyColor: 'rgba(255,255,255,0.8)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    titleFont: { size: 12, weight: '700', family: "'Plus Jakarta Sans'" },
                    bodyFont: { size: 11, weight: '500', family: "'Inter'" },
                    callbacks: {
                        title: items => `Age ${items[0].parsed.x}`,
                        label: ctx => ` ${ctx.dataset.label}: ${formatLakhsCrores(ctx.parsed.y)}`
                    },
                    external: function (context) {
                        const { tooltip } = context;
                        if (tooltip.opacity === 0) {
                            ['journey-leg-optimistic', 'journey-leg-median', 'journey-leg-pessimistic'].forEach(id => {
                                const el = document.getElementById(id);
                                if (el) el.innerHTML = '&mdash;';
                            });
                            return;
                        }
                        if (tooltip.dataPoints && tooltip.dataPoints.length > 0) {
                            tooltip.dataPoints.forEach(point => {
                                const idx = point.datasetIndex;
                                const val = point.parsed.y;
                                let targetId;
                                if (idx === 0) targetId = 'journey-leg-optimistic';
                                else if (idx === 1) targetId = 'journey-leg-median';
                                else if (idx === 2) targetId = 'journey-leg-pessimistic';
                                else return;

                                const el = document.getElementById(targetId);
                                if (!el) return;
                                if (val === null || val === undefined) {
                                    el.innerHTML = '&mdash;';
                                } else if (val >= 10000000) {
                                    el.textContent = '₹' + (val / 10000000).toFixed(1) + 'Cr';
                                } else if (val >= 100000) {
                                    el.textContent = '₹' + (val / 100000).toFixed(1) + 'L';
                                } else {
                                    el.textContent = '₹' + Math.round(val).toLocaleString('en-IN');
                                }
                            });
                        }
                    }
                },
                annotation: {
                    clip: false,
                    annotations: journeyAnnotations
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: params.currentAge,
                    max: life,
                    grid: { color: gridColor },
                    ticks: {
                        stepSize: 5,
                        callback: v => `${v}`
                    },
                    title: { display: true, text: 'Age', font: { size: 12 } }
                },
                y: {
                    max: maxP50 > 0 ? yMaxCap : undefined,
                    grid: { color: gridColor },
                    ticks: {
                        callback: v => {
                            if (v >= 10000000) return '₹' + (v / 10000000).toFixed(1) + 'Cr';
                            if (v >= 100000) return '₹' + (v / 100000).toFixed(0) + 'L';
                            return '₹' + v;
                        }
                    }
                }
            }
        }
    });
    const scaleNote = document.getElementById('journey-scale-note');
    const sourceCap = document.getElementById('journey-source-badge-cap');
    if (scaleNote) scaleNote.style.display = maxP80 > yMaxCap ? 'flex' : 'none';
    if (sourceCap) sourceCap.style.display = maxP80 > yMaxCap ? 'inline-block' : 'none';
}

function buildHistogramChart(params, res, gridColor) {
    const ctx = document.getElementById('histogramChart').getContext('2d');
    if (chartObj.histogram) chartObj.histogram.destroy();

    const elRetireHist = document.getElementById('lbl-retire-age-hist');
    if (elRetireHist) elRetireHist.innerText = params.retirementAge;

    const bins = res.corpusHistogram.bins;
    // corpusAtRetirement is now { p10, p50, p80 } scalars
    const p10val = res.corpusAtRetirement.p10;
    const p80val = res.corpusAtRetirement.p80;
    const p50val = res.corpusAtRetirement.p50;

    const bgColors = bins.map(b => {
        const mid = (b.min + b.max) / 2;
        if (mid < p10val) return 'rgba(220,38,38,0.55)';
        if (mid > p80val) return 'rgba(13,148,136,0.6)';
        return 'rgba(37,99,235,0.45)';
    });
    const borderColors = bins.map(b => {
        const mid = (b.min + b.max) / 2;
        if (mid < p10val) return 'rgba(220,38,38,0.9)';
        if (mid > p80val) return 'rgba(13,148,136,0.9)';
        return 'rgba(37,99,235,0.8)';
    });

    chartObj.histogram = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: bins.map((b, i) => i),
            datasets: [{
                data: bins.map(b => b.count),
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 1,
                barPercentage: 1.0,
                categoryPercentage: 1.0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(11,37,69,0.95)',
                    titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.8)',
                    callbacks: {
                        title: items => {
                            const b = bins[items[0].dataIndex];
                            return `₹${(b.min / 10000000).toFixed(2)}–${(b.max / 10000000).toFixed(2)} Cr`;
                        },
                        label: items => ` ${items.formattedValue} simulations`
                    }
                },
                annotation: {
                    annotations: {
                        medianLine: {
                            type: 'line',
                            xMin: bins.findIndex(b => b.min <= p50val && b.max >= p50val),
                            xMax: bins.findIndex(b => b.min <= p50val && b.max >= p50val),
                            borderColor: getThemeColor('--seed-blue'),
                            borderWidth: 2,
                            borderDash: [4, 3],
                            label: {
                                display: true, content: 'Median',
                                position: 'end',
                                backgroundColor: 'rgba(37,99,235,0.9)',
                                color: 'white',
                                font: { size: 10, weight: '700', family: "'Inter'" },
                                padding: { x: 6, y: 3 }, borderRadius: 3
                            }
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { display: false } },
                y: { grid: { color: gridColor }, title: { display: true, text: '# Simulations' } }
            }
        }
    });
}

function buildDrawdownChart(params, res, gridColor) {
    const ctx = document.getElementById('drawdownChart').getContext('2d');
    if (chartObj.drawdown) chartObj.drawdown.destroy();

    const life = params.lifeExpectancy;
    const retAge = params.retirementAge;
    const elRetireDrawdown = document.getElementById('lbl-retire-age-drawdown');
    if (elRetireDrawdown) elRetireDrawdown.innerText = retAge;
    const elLifeDrawdown = document.getElementById('lbl-life-age-drawdown');
    if (elLifeDrawdown) elLifeDrawdown.innerText = life;

    const rawP10 = res.p10Path.filter(pt => pt.age >= retAge);
    const rawP50 = res.p50Path.filter(pt => pt.age >= retAge);
    const rawP80 = res.p80Path.filter(pt => pt.age >= retAge);

    const p10 = toXY(padPath(rawP10, life));
    const p50 = toXY(padPath(rawP50, life));
    const p80 = toXY(padPath(rawP80, life));

    const maxP50 = Math.max(...p50.map(pt => pt.y));
    const maxP80 = Math.max(...p80.map(pt => pt.y));
    const yMaxCap = Math.max(maxP50 * 1.4, 1000000);

    const drawdownAnnotations = {};
    if (maxP80 > yMaxCap) {
        let exitPt = p80.find(pt => pt.y > yMaxCap);
        let exitAge = exitPt ? exitPt.x : life;
        let formattedMax = maxP80 >= 10000000 ? (maxP80 / 10000000).toFixed(1) + ' Cr' : (maxP80 >= 100000 ? (maxP80 / 100000).toFixed(1) + ' L' : maxP80.toLocaleString('en-IN'));
        drawdownAnnotations.p80Overflow = {
            type: 'label',
            xValue: exitAge,
            yValue: yMaxCap,
            yAdjust: 12,
            content: `↑ extends to ₹${formattedMax}`,
            backgroundColor: 'rgba(255,255,255,0.85)',
            color: getThemeColor('--seed-teal'),
            font: { family: "'Inter'", size: 10, weight: '600' },
            padding: { x: 4, y: 2 }
        };
    }

    chartObj.drawdown = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Optimistic (p80)',
                    data: p80,
                    borderColor: 'rgba(13,148,136,0.4)',
                    _mutedColor: 'rgba(13,148,136,0.1)', _glowColor: 'rgba(13,148,136,0.8)',
                    backgroundColor: 'rgba(37,99,235,0.05)',
                    _mutedBg: 'rgba(37,99,235,0.01)', _glowBg: 'rgba(37,99,235,0.15)',
                    borderWidth: 1.5, _glowWidth: 2.5,
                    tension: 0.2, pointRadius: 0,
                    fill: '+1'
                },
                {
                    label: 'Median (p50)',
                    data: p50,
                    borderColor: getThemeColor('--seed-blue'),
                    _mutedColor: 'rgba(37,99,235,0.3)', _glowColor: getThemeColor('--seed-blue'),
                    borderWidth: 3.5, _glowWidth: 4.5,
                    tension: 0.2, pointRadius: 0
                },
                {
                    label: 'Pessimistic (p10)',
                    data: p10,
                    borderColor: getThemeColor('--seed-red'),
                    _mutedColor: 'rgba(220,38,38,0.3)', _glowColor: getThemeColor('--seed-red'),
                    backgroundColor: 'rgba(220,38,38,0.03)',
                    _mutedBg: 'rgba(220,38,38,0.01)', _glowBg: 'rgba(220,38,38,0.1)',
                    borderWidth: 1.5, _glowWidth: 2.5,
                    tension: 0.2, pointRadius: 0,
                    borderDash: [4, 3], fill: '-1',
                    segment: {
                        borderColor: ctx => ctx.p0.parsed.y === 0 && ctx.p1.parsed.y === 0 ? 'transparent' : undefined
                    }
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                annotation: {
                    clip: false,
                    annotations: drawdownAnnotations
                },
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(11,37,69,0.95)',
                    titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.8)',
                    padding: 12,
                    titleFont: { size: 12, weight: '700', family: "'Plus Jakarta Sans'" },
                    bodyFont: { size: 11, weight: '500', family: "'Inter'" },
                    callbacks: {
                        title: items => `Age ${items[0].parsed.x}`,
                        label: ctx => ` ${ctx.dataset.label}: ${formatLakhsCrores(ctx.parsed.y)}`
                    },
                    external: function (context) {
                        const { tooltip } = context;
                        if (tooltip.opacity === 0) {
                            ['drawdown-leg-optimistic', 'drawdown-leg-median', 'drawdown-leg-pessimistic'].forEach(id => {
                                const el = document.getElementById(id);
                                if (el) el.innerHTML = '&mdash;';
                            });
                            return;
                        }
                        if (tooltip.dataPoints && tooltip.dataPoints.length > 0) {
                            tooltip.dataPoints.forEach(point => {
                                const idx = point.datasetIndex;
                                const val = point.parsed.y;
                                let targetId;
                                if (idx === 0) targetId = 'drawdown-leg-optimistic';
                                else if (idx === 1) targetId = 'drawdown-leg-median';
                                else if (idx === 2) targetId = 'drawdown-leg-pessimistic';
                                else return;

                                const el = document.getElementById(targetId);
                                if (!el) return;
                                if (val === null || val === undefined) {
                                    el.innerHTML = '&mdash;';
                                } else if (val >= 10000000) {
                                    el.textContent = '₹' + (val / 10000000).toFixed(1) + 'Cr';
                                } else if (val >= 100000) {
                                    el.textContent = '₹' + (val / 100000).toFixed(1) + 'L';
                                } else {
                                    el.textContent = '₹' + Math.round(val).toLocaleString('en-IN');
                                }
                            });
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: retAge, max: life,
                    grid: { color: gridColor },
                    ticks: { stepSize: 5, callback: v => `${v}` },
                    title: { display: true, text: 'Age (Post-Retirement)' }
                },
                y: {
                    max: maxP50 > 0 ? yMaxCap : undefined,
                    grid: { color: gridColor },
                    ticks: { callback: v => v >= 10000000 ? '₹' + (v / 10000000).toFixed(1) + 'Cr' : v >= 100000 ? '₹' + (v / 100000).toFixed(0) + 'L' : '₹' + v }
                }
            }
        }
    });
    const scaleNoteDt = document.getElementById('drawdown-scale-note');
    const sourceCapDt = document.getElementById('drawdown-source-badge-cap');
    if (scaleNoteDt) scaleNoteDt.style.display = maxP80 > yMaxCap ? 'flex' : 'none';
    if (sourceCapDt) sourceCapDt.style.display = maxP80 > yMaxCap ? 'inline-block' : 'none';
}



window.highlightChartDataset = function (chartName, dsIdx) {
    const chart = chartObj[chartName];
    if (!chart || !chart.data.datasets) return;
    chart.data.datasets.forEach((ds, i) => {
        if (ds._origConfigured === undefined) {
            ds._origBorderColor = ds.borderColor;
            ds._origBgColor = ds.backgroundColor;
            ds._origBorderWidth = ds.borderWidth;
            ds._origConfigured = true;
        }
        if (i === dsIdx) {
            if (ds._glowColor) ds.borderColor = ds._glowColor;
            if (ds._glowBg) ds.backgroundColor = ds._glowBg;
            if (ds._glowWidth) ds.borderWidth = ds._glowWidth;
        } else {
            if (ds._mutedColor) ds.borderColor = ds._mutedColor;
            if (ds._mutedBg) ds.backgroundColor = ds._mutedBg;
        }
    });
    chart.update('none'); // Update immediately without animation
};

window.resetChartDataset = function (chartName) {
    const chart = chartObj[chartName];
    if (!chart || !chart.data.datasets) return;
    chart.data.datasets.forEach(ds => {
        if (ds._origConfigured) {
            ds.borderColor = ds._origBorderColor;
            ds.backgroundColor = ds._origBgColor;
            ds.borderWidth = ds._origBorderWidth;
        }
    });
    chart.update('none');
};


// -- Scenario Comparison --

let savedScenarios = JSON.parse(localStorage.getItem('seed-scenarios') || '[]');

function saveCurrentScenario() {
    if (savedScenarios.length >= 3) {
        showToast('Maximum 3 scenarios. Remove one to save a new one.', 'warning');
        return;
    }
    if (!window.lastResults) { showToast('Run a simulation first.', 'info'); return; }

    const scenario = {
        id: Date.now(),
        label: document.getElementById('clientName').value || `Scenario ${savedScenarios.length + 1}`,
        params: window.lastResults.params,
        summary: {
            corpus: window.lastResults.percentiles.p50.corpusAtRetirement,
            successRate: window.lastResults.successRate,
            medianAge: window.lastResults.medianAgeAtDepletion,
            expense: window.lastResults.adjustedMonthlyExpenses,
        },
        savedAt: new Date().toLocaleDateString('en-IN'),
    };
    savedScenarios.push(scenario);
    localStorage.setItem('seed-scenarios', JSON.stringify(savedScenarios));

    document.getElementById('scenario-count').innerText = `${savedScenarios.length} / 3 saved`;
    renderScenarioComparison();
    showToast(`Scenario "${scenario.label}" saved.`, 'success');
}

function removeScenario(id) {
    savedScenarios = savedScenarios.filter(s => s.id !== id);
    localStorage.setItem('seed-scenarios', JSON.stringify(savedScenarios));
    document.getElementById('scenario-count').innerText = `${savedScenarios.length} / 3 saved`;
    renderScenarioComparison();
    if (savedScenarios.length === 0) closeComparison();
}

function closeComparison() {
    document.getElementById('comparison-panel').style.display = 'none';
}

function renderScenarioComparison() {
    if (savedScenarios.length === 0) return;
    const panel = document.getElementById('comparison-panel');
    panel.style.display = 'block';

    const rows = [
        { label: 'Corpus at Retirement', key: 'corpus', fmt: v => formatLakhsCrores(v) },
        { label: 'Success Rate', key: 'successRate', fmt: v => v >= 90 ? `<span style="color:var(--seed-teal);font-weight:600">${v.toFixed(1)}%</span>` : v.toFixed(1) + '%' },
        { label: 'Median Survived Age', key: 'medianAge', fmt: v => v >= 100 ? '100+ Years' : Math.floor(v) },
        { label: 'Monthly Need', key: 'expense', fmt: v => formatLakhsCrores(v) },
    ];

    let html = `<table class="comparison-table">
        <thead><tr>
        <th>Metric</th>
        ${savedScenarios.map(s => `<th>${s.label} <button class="icon-btn" style="width:24px;height:24px;border:none;display:inline-flex" onclick="removeScenario(${s.id})">✕</button></th>`).join('')}
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

// Initial count updates
document.getElementById('scenario-count').innerText = `${savedScenarios.length} / 3 saved`;
if (savedScenarios.length > 0) renderScenarioComparison();
