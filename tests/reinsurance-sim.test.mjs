import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sim = require('../assets/automation/reinsurance-sim.js');

test('analytical limited expected values reconcile with untamed Lognormal moments and partition identity X = Y + Z', () => {
  const gross = sim.analyticalMetrics({ lambda: 80, mu: 10.5, sigma: 1.15, retention: Infinity });
  const xol150 = sim.analyticalMetrics({ lambda: 80, mu: 10.5, sigma: 1.15, retention: 150000 });
  const xol250 = sim.analyticalMetrics({ lambda: 80, mu: 10.5, sigma: 1.15, retention: 250000 });

  assert.equal(gross.exceedProb, 0);
  assert.equal(gross.cededMean, 0);
  assert.ok(Math.abs(gross.grossMean - 5628067) < 5);

  // Exact partition: E[S_net] + E[S_ceded] === E[S_gross]
  assert.ok(Math.abs((xol150.netMean + xol150.cededMean) - gross.grossMean) < 1e-6);
  assert.ok(Math.abs(xol150.netMean - 4305632) < 5);
  assert.ok(Math.abs(xol150.cededMean - 1322435) < 5);
  assert.ok(xol150.netSd < xol250.netSd && xol250.netSd < gross.grossSd);
});

test('Monte Carlo simulation is deterministic per seed and Excess of Loss strictly compresses 99.5% VaR tail risk', () => {
  const runA = sim.simulatePortfolio({ lambda: 80, mu: 10.5, sigma: 1.15, retention: 150000, nSims: 2000, seed: 2026 });
  const runB = sim.simulatePortfolio({ lambda: 80, mu: 10.5, sigma: 1.15, retention: 150000, nSims: 2000, seed: 2026 });

  assert.equal(runA.net.mean, runB.net.mean);
  assert.equal(runA.net.var995, runB.net.var995);
  assert.ok(runA.net.var995 < runA.gross.var995);
  assert.ok(runA.tailCapitalReliefPct > 45);
  assert.ok(runA.sampleYear.claims.every(c => c > 0));
});

test('invalid simulation parameters are rejected explicitly', () => {
  assert.throws(() => sim.analyticalMetrics({ lambda: -10 }));
  assert.throws(() => sim.analyticalMetrics({ sigma: 0 }));
  assert.throws(() => sim.analyticalMetrics({ retention: -1 }));
});
