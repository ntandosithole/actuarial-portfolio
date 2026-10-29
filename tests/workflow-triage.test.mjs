import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { generateReview } from '../projects/workflow-triage/run.mjs';
const require = createRequire(import.meta.url);
const engine = require('../assets/automation/review-engine.js');
const fixture = JSON.parse(readFileSync(new URL('../assets/automation/worked-review.json', import.meta.url), 'utf8'));

test('exception fixture catches seeded intake issues and blocks release', () => {
  const result = engine.review(engine.sample());
  assert.deepEqual(result.controls.map(c => c.count), [1, 1, 2, 1, 1]);
  assert.equal(result.summary.inputRows, 14);
  assert.equal(result.summary.eligibleRows, 8);
  assert.equal(result.summary.excludedRows, 6);
  assert.equal(result.summary.releaseStatus, 'blocked');
  assert.deepEqual(result.controls[1].refs, ['Inbox row 3', 'Inbox row 13']);
  assert.equal(result.plan.length, 8);
  assert.ok(!result.plan.some(row => row.id === 'DEMO-003'));
});
test('corrected fixture routes every request exactly once to its defined queue', () => {
  const result = engine.review(engine.sample('clean'));
  assert.equal(result.summary.releaseStatus, 'ready-for-review');
  assert.equal(result.plan.length, 12);
  assert.equal(new Set(result.plan.map(row => row.id)).size, 12);
  assert.deepEqual(result.summary.queueCounts, [{ queue: 'Service Desk', count: 4 }, { queue: 'Finance', count: 4 }, { queue: 'Operations', count: 4 }]);
  assert.equal(result.plan[0].queue, 'Service Desk');
  assert.equal(result.plan[1].queue, 'Finance');
  assert.equal(result.plan[2].queue, 'Operations');
});
test('overdue threshold is strict; intake blockers are independent of it', () => {
  assert.equal(engine.review(engine.sample('clean'), 8).summary.overdueCount, 5);
  assert.equal(engine.review(engine.sample('clean'), 8).summary.releaseStatus, 'review-required');
  assert.equal(engine.review(engine.sample(), 72).controls[4].count, 0);
  assert.equal(engine.review(engine.sample(), 72).summary.releaseStatus, 'blocked');
});
test('fresh requests have zero age and no overdue flag', () => {
  const data = engine.sample('clean'); data[0].ageHours = 0;
  const result = engine.review(data);
  assert.equal(result.plan[0].followUp, false);
  assert.equal(result.controls[2].count, 0);
});
test('missing subjects are excluded without mutating the source', () => {
  const data = engine.sample('clean'); data[0].subject = '';
  const before = JSON.stringify(data);
  const result = engine.review(data);
  assert.equal(result.controls[0].count, 1);
  assert.equal(result.summary.excludedRows, 1);
  assert.equal(JSON.stringify(data), before);
});
test('invalid thresholds, inputs and scenarios fail explicitly', () => {
  for (const value of [NaN, Infinity, 0, 169]) assert.throws(() => engine.review(engine.sample(), value));
  assert.throws(() => engine.sample('unknown'));
  assert.throws(() => engine.review([null]));
});
test('AI evidence contains no record identifiers or row references', () => {
  const evidence = engine.aiEvidence(engine.review(engine.sample()));
  assert.doesNotMatch(JSON.stringify(evidence), /DEMO-|Inbox row|"subject"|"refs"/);
});
test('worked AI draft is tied to the exact default evidence and passes structural grounding', () => {
  const evidence = engine.aiEvidence(engine.review(engine.sample()));
  assert.equal(createHash('sha256').update(JSON.stringify(evidence)).digest('hex'), fixture.evidenceHash);
  assert.equal(engine.validateDraft(fixture.draft, evidence), fixture.draft);
  const embedded = readFileSync(new URL('../assets/automation/worked-review.js', import.meta.url), 'utf8').split('window.DataReviewExample = ')[1].trim().slice(0, -1);
  assert.deepEqual(JSON.parse(embedded), fixture);
});
test('AI output cannot invent controls, alter counts, omit findings or remove human review', () => {
  const evidence = engine.aiEvidence(engine.review(engine.sample()));
  for (const mutate of [
    draft => { draft.findings[0].controlId = 'C99'; },
    draft => { draft.findings[0].observedCount = 99; },
    draft => { draft.findings.pop(); },
    draft => { draft.findings.push(draft.findings[0]); },
    draft => { draft.requiresHumanReview = false; }
  ]) {
    const draft = structuredClone(fixture.draft); mutate(draft);
    assert.throws(() => engine.validateDraft(draft, evidence));
  }
});
const evidence = engine.aiEvidence(engine.review(engine.sample()));
const completed = { status: 'completed', id: 'synthetic-test-response', model: 'test-model', output: [{ content: [{ type: 'output_text', text: JSON.stringify(fixture.draft) }] }] };
function mockFetch(body, status = 200) { return async () => ({ ok: status === 200, status, json: async () => body }); }
test('AI adapter requests schema, timeout and non-storage; accepts grounded response', async () => {
  let called = false;
  const response = await generateReview(evidence, {
    model: 'test-model', apiKey: 'test-only-not-a-credential',
    fetchImpl: async (url, options) => {
      called = true;
      assert.equal(url, 'https://api.openai.com/v1/responses');
      assert.ok(options.signal instanceof AbortSignal);
      const body = JSON.parse(options.body);
      assert.equal(body.store, false);
      assert.equal(body.text.format.strict, true);
      assert.deepEqual(JSON.parse(body.input), evidence);
      return { ok: true, json: async () => completed };
    }
  });
  assert.ok(called);
  assert.deepEqual(response.draft, fixture.draft);
});
test('AI adapter fails closed for absent setup, provider errors, refusal, truncation and malformed output', async () => {
  await assert.rejects(generateReview(evidence, { model: 'test-model' }));
  for (const [body, status] of [
    [{}, 429],
    [{ status: 'incomplete', output: [] }, 200],
    [{ status: 'completed', output: [{ content: [{ type: 'refusal' }] }] }, 200],
    [{ status: 'completed', output: [{ content: [{ type: 'output_text', text: '{' }] }] }, 200],
    [{ status: 'completed', output: [] }, 200]
  ]) await assert.rejects(generateReview(evidence, { model: 'test-model', apiKey: 'test-only', fetchImpl: mockFetch(body, status) }));
  await assert.rejects(generateReview(evidence, { model: 'test-model', apiKey: 'test-only', fetchImpl: async () => { throw new Error('Timed out'); } }));
});
test('CLI defaults to an offline run, emits parseable evidence and rejects unknown arguments', () => {
  const entry = new URL('../projects/workflow-triage/run.mjs', import.meta.url);
  const run = spawnSync(process.execPath, [fileURLToPath(entry)], { encoding: 'utf8', env: { PATH: process.env.PATH } });
  assert.equal(run.status, 0);
  assert.equal(JSON.parse(run.stdout).ai.status, 'not-requested');
  assert.equal(spawnSync(process.execPath, [fileURLToPath(entry), '--unknown'], { encoding: 'utf8' }).status, 1);
});
