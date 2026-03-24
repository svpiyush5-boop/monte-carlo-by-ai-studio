import { SimulationParams } from '../types';

function _mcGenerateRandomReturn(mean: number, stdDev: number) {
    const u1 = Math.random() || 1e-10;
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * Math.random());
    return mean + z * stdDev;
}

function _mcPctile(sortedArr: number[], p: number) {
    if (!sortedArr.length) return 0;
    return sortedArr[Math.min(Math.floor(sortedArr.length * p), sortedArr.length - 1)];
}

export interface CashflowRow {
    age: number;
    year: number;
    phase: 'accumulation' | 'drawdown';
    openingBalance: number;
    contributions: number;
    lumpsum: number;
    withdrawals: number;
    partTimeIncome: number;
    investmentReturn: number;
    closingBalance: number;
    netCashflow: number;
}

export function runMonteCarlo(params: SimulationParams) {
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

    const ytr = Math.max(0, retirementAge - currentAge);
    const yir = Math.max(0, lifeExpectancy - retirementAge);
    
    const expRet = expectedReturn / 100;
    const postRet = postRetirementReturn / 100;
    const stdPre = returnStdDevPre / 100;
    const stdPost = returnStdDevPost / 100;
    const taxD = taxDragPct / 100;
    const inf = withdrawalInflation / 100;
    const stepUp = sipStepUp / 100;

    const adjMonthlyExp = monthlyExpenses * Math.pow(1 + inf, ytr);
    const annualWithdrawal = adjMonthlyExp * 12;

    const balsByAge: Record<number, number[]> = {};
    for (let a = currentAge; a <= lifeExpectancy; a++) balsByAge[a] = [];

    const corpusAtRets: number[] = [];
    const agesAtDepletion: number[] = [];

    // Track per-simulation cashflow rows for median path extraction
    const allSimCashflows: CashflowRow[][] = [];

    for (let sim = 0; sim < numSimulations; sim++) {
        let corpus = currentSavings;
        let monthlySavings = initSIP;
        balsByAge[currentAge].push(corpus);

        const simCashflows: CashflowRow[] = [{
            age: currentAge,
            year: 0,
            phase: 'accumulation' as const,
            openingBalance: 0,
            contributions: 0,
            lumpsum: 0,
            withdrawals: 0,
            partTimeIncome: 0,
            investmentReturn: 0,
            closingBalance: currentSavings,
            netCashflow: currentSavings,
        }];

        for (let yr = 0; yr < ytr; yr++) {
            const r = Math.max(_mcGenerateRandomReturn(expRet - taxD, stdPre), -0.999);
            const mr = Math.pow(1 + r, 1 / 12) - 1;
            const age = currentAge + yr + 1;
            const openingBal = corpus;
            let yearlyContrib = 0;

            for (let mo = 0; mo < 12; mo++) {
                corpus = (corpus + monthlySavings) * (1 + mr);
                yearlyContrib += monthlySavings;
            }

            const lumpsumAdded = (additionalLumpsum > 0 && lumpsumYear > 0 && yr + 1 === lumpsumYear) ? additionalLumpsum : 0;
            if (lumpsumAdded > 0) corpus += lumpsumAdded;

            const investmentReturn = corpus - openingBal - yearlyContrib - lumpsumAdded;

            if (stepUp > 0) monthlySavings *= (1 + stepUp);
            balsByAge[age].push(Math.max(0, corpus));

            simCashflows.push({
                age,
                year: yr + 1,
                phase: 'accumulation' as const,
                openingBalance: openingBal,
                contributions: yearlyContrib,
                lumpsum: lumpsumAdded,
                withdrawals: 0,
                partTimeIncome: 0,
                investmentReturn,
                closingBalance: Math.max(0, corpus),
                netCashflow: yearlyContrib + lumpsumAdded,
            });
        }

        const car = Math.max(0, corpus);
        corpusAtRets.push(car);
        let rc = car;
        let aod = lifeExpectancy;
        let currentAnnualWithdrawal = annualWithdrawal;

        for (let yr = 0; yr < yir; yr++) {
            const age = retirementAge + yr + 1;
            const r = Math.max(_mcGenerateRandomReturn(postRet - taxD, stdPost), -0.999);
            const pt = (partTimeIncome > 0 && age <= partTimeUntilAge) ? partTimeIncome * 12 : 0;
            
            if (yr > 0) {
                currentAnnualWithdrawal *= (1 + inf);
            }
            
            const openingBal = rc;
            const preReturnBal = rc + pt;
            rc = rc * (1 + r) - currentAnnualWithdrawal + pt;
            const investmentReturn = (openingBal * r);

            if (rc <= 0) {
                aod = age;
                simCashflows.push({
                    age,
                    year: ytr + yr + 1,
                    phase: 'drawdown' as const,
                    openingBalance: openingBal,
                    contributions: 0,
                    lumpsum: 0,
                    withdrawals: currentAnnualWithdrawal,
                    partTimeIncome: pt,
                    investmentReturn,
                    closingBalance: 0,
                    netCashflow: pt - currentAnnualWithdrawal,
                });
                for (let a = age; a <= lifeExpectancy; a++) balsByAge[a].push(0);
                break;
            }
            balsByAge[age].push(Math.max(0, rc));

            simCashflows.push({
                age,
                year: ytr + yr + 1,
                phase: 'drawdown' as const,
                openingBalance: openingBal,
                contributions: 0,
                lumpsum: 0,
                withdrawals: currentAnnualWithdrawal,
                partTimeIncome: pt,
                investmentReturn,
                closingBalance: Math.max(0, rc),
                netCashflow: pt - currentAnnualWithdrawal,
            });
        }
        agesAtDepletion.push(aod);
        allSimCashflows.push(simCashflows);
    }

    const p10Path = [], p50Path = [], p80Path = [], p90Path = [];
    for (let a = currentAge; a <= lifeExpectancy; a++) {
        const v = balsByAge[a].slice().sort((x, y) => x - y);
        p10Path.push({ age: a, balance: _mcPctile(v, 0.10) });
        p50Path.push({ age: a, balance: _mcPctile(v, 0.50) });
        p80Path.push({ age: a, balance: _mcPctile(v, 0.80) });
        p90Path.push({ age: a, balance: _mcPctile(v, 0.90) });
    }

    // Extract median cashflow: find simulation whose corpus at retirement is closest to p50
    const p50Corpus = _mcPctile(corpusAtRets.slice().sort((a, b) => a - b), 0.50);
    let bestSimIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < corpusAtRets.length; i++) {
        const diff = Math.abs(corpusAtRets[i] - p50Corpus);
        if (diff < bestDiff) {
            bestDiff = diff;
            bestSimIdx = i;
        }
    }
    const medianCashflow: CashflowRow[] = allSimCashflows[bestSimIdx] || [];

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
        p10Path, p50Path, p80Path, p90Path,
        successRate: (ok / n) * 100,
        criticalFailRate: (agesAtDepletion.filter(a => a < lifeExpectancy - 5).length / n) * 100,
        adjustedMonthlyExpenses: adjMonthlyExp,
        annualWithdrawal,
        medianAgeAtDepletion: _mcPctile(sortedAges, 0.50),
        corpusAtRetirement: {
            p10: _mcPctile(sortedCAR, 0.10),
            p50: _mcPctile(sortedCAR, 0.50),
            p80: _mcPctile(sortedCAR, 0.80),
            p90: _mcPctile(sortedCAR, 0.90),
        },
        corpusHistogram: { bins },
        yearsToRetirement: ytr,
        yearsInRetirement: yir,
        medianCashflow,
    };
}
