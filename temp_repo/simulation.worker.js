// simulation.worker.js — Seed Investments Monte Carlo Retirement Planner
// Web Worker: runs N simulations off the main thread, returns year-by-year fan bands.

// ── Box-Muller: normally distributed random return ───────────────────────────
function generateRandomReturn(mean, stdDev) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1 === 0 ? 1e-10 : u1)) *
        Math.cos(2.0 * Math.PI * u2);
    return mean + z * stdDev;
}

// ── Sorted-array percentile helper ───────────────────────────────────────────
function pctile(sortedArr, p) {
    if (!sortedArr.length) return 0;
    return sortedArr[Math.min(Math.floor(sortedArr.length * p), sortedArr.length - 1)];
}

// ── Core simulation ───────────────────────────────────────────────────────────
function runSimulation(params) {
    const {
        currentAge,
        retirementAge,
        lifeExpectancy,
        currentSavings,
        monthlySavings: initialMonthlySavings,
        sipStepUp,            // % e.g. 5
        expectedReturn,       // decimal e.g. 0.12
        postRetirementReturn, // decimal e.g. 0.07
        returnStdDevPre,      // decimal e.g. 0.15
        returnStdDevPost,     // decimal e.g. 0.08
        monthlyExpenses,      // today's rupees
        withdrawalInflation,  // decimal e.g. 0.06
        numSimulations,
        // optional
        additionalLumpsum = 0,
        lumpsumYear = 0,
        partTimeIncome = 0,
        partTimeUntilAge = 0,
        taxDragPct = 0, // % e.g. 0.5 — dividing by 100 inside
    } = params;

    const yearsToRetirement = retirementAge - currentAge;
    const yearsInRetirement = lifeExpectancy - retirementAge;

    // Inflation-adjust expenses from today to retirement date
    const adjustedMonthlyExpenses =
        monthlyExpenses * Math.pow(1 + withdrawalInflation, yearsToRetirement);
    const annualWithdrawal = adjustedMonthlyExpenses * 12;

    // annualTaxDrag as a decimal friction applied to returns
    const taxDragDecimal = taxDragPct / 100;

    // ── Accumulators: for EACH age, store one balance per simulation ──────────
    // After all sims, sort each age's array → compute fan-band percentiles.
    // This guarantees p90 > p50 > p10 at every single point on the chart.
    const balancesByAge = {};
    for (let age = currentAge; age <= lifeExpectancy; age++) {
        balancesByAge[age] = [];
    }

    const corpusAtRetirements = [];
    const agesAtDepletion = [];

    // ── Run N simulations ─────────────────────────────────────────────────────
    for (let sim = 0; sim < numSimulations; sim++) {

        // ─ Accumulation phase ─────────────────────────────────────────────────
        let corpus = currentSavings;
        let monthlySavings = initialMonthlySavings;
        balancesByAge[currentAge].push(corpus);

        for (let year = 0; year < yearsToRetirement; year++) {
            // Clamp to -99.9% so Math.pow never gets a negative base → NaN
            const rawR = generateRandomReturn(expectedReturn - taxDragDecimal, returnStdDevPre);
            const annualR = Math.max(rawR, -0.999);
            const monthlyR = Math.pow(1 + annualR, 1 / 12) - 1;
            const age = currentAge + year + 1;

            for (let month = 0; month < 12; month++) {
                corpus = (corpus + monthlySavings) * (1 + monthlyR);
            }

            if (sipStepUp > 0) monthlySavings *= (1 + sipStepUp / 100);
            if (additionalLumpsum > 0 && lumpsumYear > 0 && year + 1 === lumpsumYear) {
                corpus += additionalLumpsum;
            }

            balancesByAge[age].push(Math.max(0, corpus));
        }

        const corpusAtRetirement = Math.max(0, corpus);
        corpusAtRetirements.push(corpusAtRetirement);

        // ─ Drawdown phase ──────────────────────────────────────────────────────
        let runningCorpus = corpusAtRetirement;
        let ageAtDepletion = lifeExpectancy;
        let depleted = false;

        for (let year = 0; year < yearsInRetirement; year++) {
            const age = retirementAge + year + 1;
            const rawR = generateRandomReturn(postRetirementReturn - taxDragDecimal, returnStdDevPost);
            const annualR = Math.max(rawR, -0.999);

            const ptIncome = (partTimeIncome > 0 && age <= partTimeUntilAge)
                ? partTimeIncome * 12 : 0;

            runningCorpus = runningCorpus * (1 + annualR) - annualWithdrawal + ptIncome;

            if (runningCorpus <= 0) {
                ageAtDepletion = age;
                depleted = true;
                // Fill this age AND all remaining ages with 0 so every slot has exactly N entries
                for (let a = age; a <= lifeExpectancy; a++) balancesByAge[a].push(0);
                break;
            }

            balancesByAge[age].push(Math.max(0, runningCorpus));
        }

        // If corpus survived to lifeExpectancy, push the final balance
        if (!depleted) {
            // lifeExpectancy slot was already filled by the last loop iteration above if it ran
            // Guard: only push if the loop actually reached lifeExpectancy
            if (balancesByAge[lifeExpectancy].length < sim + 1) {
                balancesByAge[lifeExpectancy].push(Math.max(0, runningCorpus));
            }
        }

        agesAtDepletion.push(ageAtDepletion);
    }

    // ── Build year-by-year percentile paths ──────────────────────────────────
    // At every age, sort all N values → pick p10 / p50 / p90.
    // This is the correct "fan chart" approach used in professional FP software.
    const p10Path = [], p50Path = [], p90Path = [];
    for (let age = currentAge; age <= lifeExpectancy; age++) {
        const vals = balancesByAge[age].slice().sort((a, b) => a - b);
        p10Path.push({ age, balance: pctile(vals, 0.10) });
        p50Path.push({ age, balance: pctile(vals, 0.50) });
        p90Path.push({ age, balance: pctile(vals, 0.90) });
    }

    // ── Derived statistics ────────────────────────────────────────────────────
    const n = agesAtDepletion.length;
    const successCount = agesAtDepletion.filter(a => a >= lifeExpectancy).length;
    const successRate = (successCount / n) * 100;
    const criticalFail = agesAtDepletion.filter(a => a < lifeExpectancy - 5).length;
    const criticalFailRate = (criticalFail / n) * 100;

    const sortedAges = agesAtDepletion.slice().sort((a, b) => a - b);
    const medianAgeAtDepletion = pctile(sortedAges, 0.50);

    const sortedCAR = corpusAtRetirements.slice().sort((a, b) => a - b);

    // Histogram of corpus at retirement (40 bins)
    const minC = sortedCAR[0], maxC = sortedCAR[sortedCAR.length - 1];
    const bSize = (maxC - minC) / 40 || 1;
    const bins = Array.from({ length: 40 }, (_, i) => ({
        min: minC + i * bSize, max: minC + (i + 1) * bSize, count: 0
    }));
    sortedCAR.forEach(v => {
        bins[Math.min(Math.floor((v - minC) / bSize), 39)].count++;
    });

    return {
        // Year-by-year percentile fan band paths
        p10Path, p50Path, p90Path,

        // Scalar KPIs
        successRate,
        criticalFailRate,
        adjustedMonthlyExpenses,
        annualWithdrawal,
        medianAgeAtDepletion,

        // Corpus at retirement percentiles for KPI strip
        corpusAtRetirement: {
            p10: pctile(sortedCAR, 0.10),
            p50: pctile(sortedCAR, 0.50),
            p90: pctile(sortedCAR, 0.90),
        },

        // Pre-built histogram — no need to recompute in UI
        corpusHistogram: { bins },

        yearsToRetirement,
        yearsInRetirement,
    };
}

// ── Message handler ───────────────────────────────────────────────────────────
self.onmessage = function (e) {
    try {
        const results = runSimulation(e.data.params);
        self.postMessage({ success: true, results });
    } catch (err) {
        self.postMessage({ success: false, error: err.message + '\n' + err.stack });
    }
};
