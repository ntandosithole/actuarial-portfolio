(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ReinsuranceSim = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function erf(x) {
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    const t = 1.0 / (1.0 + 0.3275911 * ax);
    const y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
    return sign * y;
  }

  function stdNormalCdf(z) {
    return 0.5 * (1.0 + erf(z / Math.SQRT2));
  }

  function analyticalMetrics(options = {}) {
    const lambda = Number(options.lambda ?? 80);
    const mu = Number(options.mu ?? 10.5);
    const sigma = Number(options.sigma ?? 1.15);
    const retention = options.retention === Infinity || options.retention === 'inf' ? Infinity : Number(options.retention ?? 150000);

    if (!(lambda > 0 && lambda <= 500) || !(sigma > 0 && sigma <= 2.5) || !(retention > 0)) {
      throw new Error('Invalid collective risk or retention parameters.');
    }

    const ex = Math.exp(mu + 0.5 * sigma * sigma);
    const ex2 = Math.exp(2 * mu + 2 * sigma * sigma);
    let ey = ex;
    let ey2 = ex2;
    let exceedProb = 0;

    if (Number.isFinite(retention)) {
      const d0 = (Math.log(retention) - mu - 2 * sigma * sigma) / sigma;
      const d1 = (Math.log(retention) - mu - sigma * sigma) / sigma;
      const d2 = (Math.log(retention) - mu) / sigma;
      exceedProb = 1.0 - stdNormalCdf(d2);
      ey = ex * stdNormalCdf(d1) + retention * exceedProb;
      ey2 = ex2 * stdNormalCdf(d0) + retention * retention * exceedProb;
    }

    const ez = Math.max(0, ex - ey);
    const grossMean = lambda * ex;
    const grossSd = Math.sqrt(lambda * ex2);
    const netMean = lambda * ey;
    const cededMean = lambda * ez;
    const netSd = Math.sqrt(lambda * ey2);
    const sdReductionPct = ((grossSd - netSd) / grossSd) * 100;

    return {
      lambda,
      mu,
      sigma,
      retention,
      meanSeverityGross: ex,
      meanSeverityRetained: ey,
      meanSeverityCeded: ez,
      exceedProb,
      grossMean,
      grossSd,
      netMean,
      cededMean,
      netSd,
      sdReductionPct
    };
  }

  function simulatePortfolio(options = {}) {
    const analytical = analyticalMetrics(options);
    const { lambda, mu, sigma, retention } = analytical;
    const nSims = Math.min(10000, Math.max(500, Number(options.nSims ?? 3000)));
    const seed = Number(options.seed ?? 2026);
    const rng = mulberry32(seed);

    function sampleNormal() {
      let u1 = 0;
      let u2 = 0;
      while (u1 <= 1e-12) u1 = rng();
      u2 = rng();
      return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    }

    function samplePoisson(lam) {
      const L = Math.exp(-lam);
      let k = 0;
      let p = 1.0;
      do {
        k += 1;
        p *= rng();
      } while (p > L);
      return k - 1;
    }

    const grossTotals = new Float64Array(nSims);
    const netTotals = new Float64Array(nSims);
    const cededTotals = new Float64Array(nSims);
    let sampleClaims = null;

    for (let s = 0; s < nSims; s += 1) {
      const n = samplePoisson(lambda);
      let gSum = 0;
      let nSum = 0;
      const yearClaims = s === 0 ? [] : null;

      for (let i = 0; i < n; i += 1) {
        const x = Math.exp(mu + sigma * sampleNormal());
        const y = Number.isFinite(retention) ? Math.min(x, retention) : x;
        gSum += x;
        nSum += y;
        if (yearClaims) yearClaims.push(x);
      }

      if (yearClaims) sampleClaims = yearClaims;
      grossTotals[s] = gSum;
      netTotals[s] = nSum;
      cededTotals[s] = gSum - nSum;
    }

    const grossSorted = Float64Array.from(grossTotals).sort();
    const netSorted = Float64Array.from(netTotals).sort();

    function empiricalStats(sortedArr, rawArr) {
      const len = sortedArr.length;
      let sum = 0;
      for (let i = 0; i < len; i += 1) sum += rawArr[i];
      const mean = sum / len;
      let sq = 0;
      for (let i = 0; i < len; i += 1) {
        const d = rawArr[i] - mean;
        sq += d * d;
      }
      const sd = Math.sqrt(sq / (len - 1));
      const var95 = sortedArr[Math.floor(0.95 * len)];
      const var995 = sortedArr[Math.floor(0.995 * len)];
      const tailStart = Math.floor(0.99 * len);
      let tailSum = 0;
      for (let i = tailStart; i < len; i += 1) tailSum += sortedArr[i];
      const tvar99 = tailSum / (len - tailStart);
      return { mean, sd, var95, var995, tvar99, tailCapital995: var995 - mean };
    }

    const gross = empiricalStats(grossSorted, grossTotals);
    const net = empiricalStats(netSorted, netTotals);
    let cededSum = 0;
    for (let i = 0; i < nSims; i += 1) cededSum += cededTotals[i];
    const cededMean = cededSum / nSims;

    const tailCapitalReliefPct = gross.tailCapital995 > 0
      ? ((gross.tailCapital995 - net.tailCapital995) / gross.tailCapital995) * 100
      : 0;

    const piercedCount = sampleClaims.filter(x => Number.isFinite(retention) && x > retention).length;
    const sampleRetainedTotal = sampleClaims.reduce((acc, x) => acc + (Number.isFinite(retention) ? Math.min(x, retention) : x), 0);
    const sampleCededTotal = sampleClaims.reduce((acc, x) => acc + (Number.isFinite(retention) ? Math.max(x - retention, 0) : 0), 0);

    return {
      nSims,
      seed,
      analytical,
      gross,
      net,
      cededMean,
      tailCapitalReliefPct,
      sampleYear: {
        claims: sampleClaims,
        claimCount: sampleClaims.length,
        piercedCount,
        retainedTotal: sampleRetainedTotal,
        cededTotal: sampleCededTotal
      },
      grossTotals,
      netTotals
    };
  }

  function formatRand(x) {
    return 'R' + Math.round(x).toLocaleString('en-US');
  }

  function formatMillions(x) {
    return 'R' + (x / 1e6).toFixed(2) + 'm';
  }

  function renderClaimsSvg(container, simResult) {
    const claims = simResult.sampleYear.claims;
    const retention = simResult.analytical.retention;
    const W = 800, H = 340;
    const padL = 74, padR = 26, padT = 38, padB = 48;
    const pw = W - padL - padR;
    const ph = H - padT - padB;
    const maxClaim = Math.max(...claims, Number.isFinite(retention) ? retention * 1.3 : 300000, 300000);
    const maxY = Math.ceil((maxClaim * 1.06) / 100000) * 100000;
    const yCoord = v => padT + ph * (1 - Math.min(v, maxY) / maxY);

    const n = Math.max(1, claims.length);
    const step = pw / n;
    const barW = Math.max(2.5, step * 0.68);

    const parts = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Interactive single-year claim severities chart">`,
      `<text x="${padL}" y="22" font-size="13.5" font-weight="700" fill="#0d2742">Single Simulated Policy Year (N = ${claims.length} claims) · ${simResult.sampleYear.piercedCount} claims capped at M · Ceded: ${formatRand(simResult.sampleYear.cededTotal)}</text>`
    ];

    const ticks = 4;
    for (let i = 0; i <= ticks; i += 1) {
      const val = (maxY / ticks) * i;
      const yc = yCoord(val);
      parts.push(`<line x1="${padL}" y1="${yc.toFixed(1)}" x2="${W - padR}" y2="${yc.toFixed(1)}" stroke="#e5edf2" stroke-width="1"/>`);
      parts.push(`<text x="${padL - 8}" y="${(yc + 4).toFixed(1)}" font-size="11" fill="#5d6c78" text-anchor="end">${val === 0 ? 'R0' : 'R' + Math.round(val / 1000) + 'k'}</text>`);
    }

    claims.forEach((c, idx) => {
      const x = padL + idx * step + (step - barW) / 2;
      const ret = Number.isFinite(retention) ? Math.min(c, retention) : c;
      const ced = Number.isFinite(retention) ? Math.max(c - retention, 0) : 0;
      const yRet = yCoord(ret);
      const hRet = Math.max(1, yCoord(0) - yRet);
      parts.push(`<rect x="${x.toFixed(1)}" y="${yRet.toFixed(1)}" width="${barW.toFixed(1)}" height="${hRet.toFixed(1)}" fill="${ced > 0 ? '#2a8c8c' : '#174a69'}" rx="1"/>`);
      if (ced > 0) {
        const yTop = yCoord(c);
        const hCed = Math.max(1.5, yRet - yTop);
        parts.push(`<rect x="${x.toFixed(1)}" y="${yTop.toFixed(1)}" width="${barW.toFixed(1)}" height="${hCed.toFixed(1)}" fill="#e08b2c" rx="1"/>`);
      }
    });

    if (Number.isFinite(retention) && retention <= maxY) {
      const ym = yCoord(retention);
      parts.push(`<line x1="${padL}" y1="${ym.toFixed(1)}" x2="${W - padR}" y2="${ym.toFixed(1)}" stroke="#c0392b" stroke-width="2" stroke-dasharray="6,4"/>`);
      parts.push(`<rect x="${W - padR - 178}" y="${Math.max(padT, ym - 21).toFixed(1)}" width="174" height="18" rx="4" fill="#fff5f5" stroke="#f5c6cb"/>`);
      parts.push(`<text x="${W - padR - 91}" y="${Math.max(padT + 13, ym - 8).toFixed(1)}" font-size="10.5" font-weight="700" fill="#a62626" text-anchor="middle">Retention M = R${Math.round(retention / 1000)}k</text>`);
    }

    parts.push(`<line x1="${padL}" y1="${yCoord(0).toFixed(1)}" x2="${W - padR}" y2="${yCoord(0).toFixed(1)}" stroke="#0d2742" stroke-width="1.2"/>`);
    parts.push(`<text x="${(padL + pw / 2).toFixed(1)}" y="${H - 12}" font-size="11.5" font-weight="600" fill="#0d2742" text-anchor="middle">Simulated individual claims in policy year (Retained in navy/teal · Ceded above M in amber)</text>`);
    parts.push('</svg>');
    container.innerHTML = parts.join('');
  }

  function renderAggregateSvg(container, simResult) {
    const W = 800, H = 340;
    const padL = 74, padR = 26, padT = 38, padB = 48;
    const pw = W - padL - padR;
    const ph = H - padT - padB;

    const gArr = simResult.grossTotals;
    const nArr = simResult.netTotals;
    let minVal = Infinity, maxVal = -Infinity;
    for (let i = 0; i < gArr.length; i += 1) {
      if (nArr[i] < minVal) minVal = nArr[i];
      if (gArr[i] > maxVal) maxVal = gArr[i];
    }
    const minX = Math.max(0, Math.floor(minVal / 1e6) * 1e6);
    const maxX = Math.ceil((maxVal * 1.02) / 1e6) * 1e6;
    const nBins = 40;
    const binW = (maxX - minX) / nBins;
    const gCounts = new Array(nBins).fill(0);
    const nCounts = new Array(nBins).fill(0);

    for (let i = 0; i < gArr.length; i += 1) {
      const bg = Math.min(nBins - 1, Math.max(0, Math.floor((gArr[i] - minX) / binW)));
      const bn = Math.min(nBins - 1, Math.max(0, Math.floor((nArr[i] - minX) / binW)));
      gCounts[bg] += 1;
      nCounts[bn] += 1;
    }

    const maxCount = Math.max(...gCounts, ...nCounts) * 1.15;
    const xCoord = v => padL + pw * ((v - minX) / (maxX - minX));
    const yCoord = c => padT + ph * (1 - c / maxCount);
    const bwPx = pw / nBins;

    const parts = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Interactive aggregate portfolio loss distribution chart">`,
      `<text x="${padL}" y="22" font-size="13.5" font-weight="700" fill="#0d2742">Aggregate Annual Portfolio Claims (${simResult.nSims.toLocaleString('en-US')} Simulated Years) · Gross vs. Net 99.5% VaR</text>`
    ];

    for (let i = 0; i < nBins; i += 1) {
      const x = padL + i * bwPx;
      const yg = yCoord(gCounts[i]);
      const hg = yCoord(0) - yg;
      parts.push(`<rect x="${(x + 0.5).toFixed(1)}" y="${yg.toFixed(1)}" width="${Math.max(1, bwPx - 1).toFixed(1)}" height="${Math.max(0, hg).toFixed(1)}" fill="#e08b2c" fill-opacity="0.40" stroke="#d47a18" stroke-width="0.6"/>`);
    }

    for (let i = 0; i < nBins; i += 1) {
      const x = padL + i * bwPx;
      const yn = yCoord(nCounts[i]);
      const hn = yCoord(0) - yn;
      parts.push(`<rect x="${(x + 0.5).toFixed(1)}" y="${yn.toFixed(1)}" width="${Math.max(1, bwPx - 1).toFixed(1)}" height="${Math.max(0, hn).toFixed(1)}" fill="#2a8c8c" fill-opacity="0.58" stroke="#174a69" stroke-width="0.7"/>`);
    }

    const xgVar = xCoord(simResult.gross.var995);
    const xnVar = xCoord(simResult.net.var995);

    parts.push(`<line x1="${xnVar.toFixed(1)}" y1="${padT + 8}" x2="${xnVar.toFixed(1)}" y2="${yCoord(0).toFixed(1)}" stroke="#0d2742" stroke-width="2" stroke-dasharray="5,4"/>`);
    parts.push(`<rect x="${Math.min(W - padR - 150, Math.max(padL, xnVar - 75)).toFixed(1)}" y="${padT + 6}" width="150" height="19" rx="4" fill="#eaf4f4" stroke="#2a8c8c"/>`);
    parts.push(`<text x="${Math.min(W - padR - 75, Math.max(padL + 75, xnVar)).toFixed(1)}" y="${padT + 19}" font-size="10.5" font-weight="700" fill="#0d2742" text-anchor="middle">Net 99.5% VaR: ${formatMillions(simResult.net.var995)}</text>`);

    parts.push(`<line x1="${xgVar.toFixed(1)}" y1="${padT + 32}" x2="${xgVar.toFixed(1)}" y2="${yCoord(0).toFixed(1)}" stroke="#b85400" stroke-width="2" stroke-dasharray="5,4"/>`);
    parts.push(`<rect x="${Math.min(W - padR - 156, Math.max(padL, xgVar - 78)).toFixed(1)}" y="${padT + 30}" width="156" height="19" rx="4" fill="#fff3e6" stroke="#e08b2c"/>`);
    parts.push(`<text x="${Math.min(W - padR - 78, Math.max(padL + 78, xgVar)).toFixed(1)}" y="${padT + 43}" font-size="10.5" font-weight="700" fill="#8a3e00" text-anchor="middle">Gross 99.5% VaR: ${formatMillions(simResult.gross.var995)}</text>`);

    parts.push(`<line x1="${padL}" y1="${yCoord(0).toFixed(1)}" x2="${W - padR}" y2="${yCoord(0).toFixed(1)}" stroke="#0d2742" stroke-width="1.2"/>`);

    const stepM = Math.max(1, Math.round((maxX - minX) / 1e6 / 6));
    for (let m = Math.ceil(minX / 1e6); m <= Math.floor(maxX / 1e6); m += stepM) {
      const xv = xCoord(m * 1e6);
      parts.push(`<text x="${xv.toFixed(1)}" y="${H - 30}" font-size="11" fill="#5d6c78" text-anchor="middle">R${m}m</text>`);
    }

    parts.push(`<text x="${(padL + pw / 2).toFixed(1)}" y="${H - 10}" font-size="11.5" font-weight="600" fill="#0d2742" text-anchor="middle">Annual aggregate portfolio claims (Teal = Net Retained S_net · Amber = Gross Unreinsured S_gross)</text>`);
    parts.push('</svg>');
    container.innerHTML = parts.join('');
  }

  function initBrowserConsole() {
    if (typeof document === 'undefined') return;
    const rootEl = document.getElementById('reinsurance-sim-console');
    if (!rootEl) return;

    const elRetention = document.getElementById('sim-retention');
    const elLambda = document.getElementById('sim-lambda');
    const elSigma = document.getElementById('sim-sigma');
    const elRunBtn = document.getElementById('sim-reseed-btn');
    const elMetrics = document.getElementById('sim-kpi-grid');
    const elChartClaims = document.getElementById('sim-chart-claims');
    const elChartAgg = document.getElementById('sim-chart-agg');
    const elStatus = document.getElementById('sim-status');
    let seed = 2026;

    function updateSimulation() {
      const retVal = elRetention.value === 'inf' ? Infinity : Number(elRetention.value);
      const lambdaVal = Number(elLambda.value);
      const sigmaVal = Number(elSigma.value);

      const res = simulatePortfolio({
        retention: retVal,
        lambda: lambdaVal,
        mu: 10.5,
        sigma: sigmaVal,
        nSims: 3000,
        seed
      });

      const kpis = [
        [formatMillions(res.net.mean), `Expected Net Claims (Gross: ${formatMillions(res.gross.mean)})`],
        [formatMillions(res.cededMean), `Expected Ceded XoL Recovery (${(res.analytical.exceedProb * 100).toFixed(1)}% claims > M)`],
        [`−${res.analytical.sdReductionPct.toFixed(1)}%`, `Aggregate Volatility Reduction (SD: ${formatMillions(res.net.sd)})`],
        [`−${res.tailCapitalReliefPct.toFixed(1)}%`, `1-in-200 Tail Capital Relief (Net VaR: ${formatMillions(res.net.var995)})`]
      ];

      elMetrics.replaceChildren();
      kpis.forEach(([val, label]) => {
        const card = document.createElement('div');
        card.className = 'reins-kpi';
        const strong = document.createElement('strong');
        strong.textContent = val;
        const span = document.createElement('span');
        span.textContent = label;
        card.append(strong, span);
        elMetrics.append(card);
      });

      renderClaimsSvg(elChartClaims, res);
      renderAggregateSvg(elChartAgg, res);

      const capLabel = Number.isFinite(retVal) ? `R${(retVal / 1000).toLocaleString('en-US')}k per claim` : 'Unlimited (No Reinsurance)';
      elStatus.textContent = `Simulated 3,000 portfolio years (seed ${seed}) · Retention M = ${capLabel} · λ = ${lambdaVal} claims/yr · σ = ${sigmaVal}.`;
    }

    elRetention.addEventListener('change', updateSimulation);
    elLambda.addEventListener('change', updateSimulation);
    elSigma.addEventListener('change', updateSimulation);
    elRunBtn.addEventListener('click', () => {
      seed = seed === 2026 ? 4096 : seed === 4096 ? 8192 : 2026;
      updateSimulation();
    });

    updateSimulation();
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBrowserConsole);
    } else {
      initBrowserConsole();
    }
  }

  return {
    analyticalMetrics,
    simulatePortfolio
  };
}));
