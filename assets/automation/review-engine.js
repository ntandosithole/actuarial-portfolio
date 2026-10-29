/* Synthetic operations workflow. Shared by the browser and Node runner. */
(function (root) {
  'use strict';
  const VERSION = '1.0.0';
  const AS_OF = '2026-09-30T12:00:00Z';
  const ROUTES = Object.freeze({ access: 'Service Desk', billing: 'Finance', general: 'Operations' });
  const SUBJECTS = ['Workspace access request', 'Invoice reference query', 'Meeting room equipment', 'Shared folder access', 'Duplicate invoice query', 'Delivery status update', 'Account access change', 'Payment reference query', 'Office supply request', 'Application access request', 'Invoice copy request', 'Facilities request'];
  function sample(scenario = 'exceptions') {
    if (!['exceptions', 'clean'].includes(scenario)) throw new Error('Unknown synthetic scenario.');
    const requests = SUBJECTS.map((subject, i) => ({ id: `DEMO-${String(i + 1).padStart(3, '0')}`, subject, category: ['access', 'billing', 'general'][i % 3], ageHours: i + 2 }));
    if (scenario === 'exceptions') {
      requests.push({ ...requests[2] }, { id: '', subject: 'Unidentified incoming request', category: 'general', ageHours: 9 });
      requests[3].ageHours = -1;
      requests[4].ageHours = 72;
      requests[5].ageHours = null;
      requests[6].category = 'unclassified';
    }
    return requests;
  }
  function review(requests, threshold = 24) {
    if (!Number.isFinite(threshold) || threshold < 1 || threshold > 168) throw new Error('Overdue threshold must be between 1 and 168 hours.');
    if (!Array.isArray(requests) || requests.some(row => !row || typeof row !== 'object')) throw new Error('A request array is required.');
    const counts = new Map();
    requests.forEach(row => { if (typeof row.id === 'string' && row.id.trim()) counts.set(row.id, (counts.get(row.id) || 0) + 1); });
    const missing = [], duplicate = [], age = [], category = [], eligible = [];
    requests.forEach((row, i) => {
      const ref = `Inbox row ${i + 1}`;
      const hasFields = typeof row.id === 'string' && Boolean(row.id.trim()) && typeof row.subject === 'string' && Boolean(row.subject.trim());
      const hasAge = Number.isSafeInteger(row.ageHours) && row.ageHours >= 0;
      const hasCategory = Object.hasOwn(ROUTES, row.category);
      if (!hasFields) missing.push(ref);
      if (counts.get(row.id) > 1) duplicate.push(ref);
      if (!hasAge) age.push(ref);
      if (!hasCategory) category.push(ref);
      if (hasFields && counts.get(row.id) === 1 && hasAge && hasCategory) eligible.push(row);
    });
    const overdue = eligible.filter(row => row.ageHours > threshold);
    const controls = [
      { id: 'C01', name: 'Required fields', count: missing.length, unit: 'rows without an identifier or subject', severity: 'blocker', refs: missing, action: 'Complete the required fields before routing the request.' },
      { id: 'C02', name: 'Duplicate requests', count: [...counts.values()].filter(n => n > 1).length, unit: 'duplicate identifier groups', severity: 'blocker', refs: duplicate, action: 'Resolve duplicate groups at source. Do not silently discard or send twice.' },
      { id: 'C03', name: 'Request age', count: age.length, unit: 'rows with missing, negative or non-integer age hours', severity: 'blocker', refs: age, action: 'Correct the received-time calculation before assessing whether the request is overdue.' },
      { id: 'C04', name: 'Routing category', count: category.length, unit: 'rows with an unsupported category', severity: 'blocker', refs: category, action: 'Confirm the category before assigning an owner queue.' },
      { id: 'C05', name: 'Overdue follow-up', count: overdue.length, unit: `eligible requests older than ${threshold} hours`, severity: 'review', refs: overdue.map(row => row.id), action: 'Ask the queue owner to review the overdue item. Age alone does not establish urgency.' }
    ].map(control => ({ ...control, result: control.count ? 'flag' : 'pass' }));
    const blocked = controls.some(c => c.severity === 'blocker' && c.count);
    const plan = eligible.map(row => ({ id: row.id, subject: row.subject, queue: ROUTES[row.category], ageHours: row.ageHours, followUp: row.ageHours > threshold }));
    const summary = {
      synthetic: true, engineVersion: VERSION, asOf: AS_OF,
      ageBasis: 'Whole elapsed hours at the fixed synthetic snapshot; no business-calendar adjustment',
      overdueThresholdHours: threshold, inputRows: requests.length,
      eligibleRows: eligible.length, excludedRows: requests.length - eligible.length,
      flaggedControls: controls.filter(c => c.count).length,
      releaseStatus: blocked ? 'blocked' : overdue.length ? 'review-required' : 'ready-for-review',
      queueCounts: Object.values(ROUTES).map(queue => ({ queue, count: plan.filter(row => row.queue === queue).length })),
      overdueCount: overdue.length,
      controls: controls.map(({ refs, ...aggregate }) => aggregate)
    };
    return { summary, controls, plan };
  }
  function aiEvidence(result) {
    // No subjects, request identifiers or row references are sent to the model.
    return JSON.parse(JSON.stringify(result.summary));
  }
  function validateDraft(draft, evidence) {
    if (!draft || typeof draft.summary !== 'string' || !draft.summary.trim() || draft.summary.length > 3000 || !Array.isArray(draft.findings) || draft.findings.length > 5 || draft.requiresHumanReview !== true) throw new Error('Invalid AI review structure.');
    const expected = evidence.controls.filter(c => c.count).map(c => c.id).sort();
    const received = draft.findings.map(f => f.controlId).sort();
    if (JSON.stringify(expected) !== JSON.stringify(received)) throw new Error('AI review must cover each flagged control exactly once, with no invented controls.');
    for (const finding of draft.findings) {
      const control = evidence.controls.find(c => c.id === finding.controlId);
      if (finding.observedCount !== control.count || !['interpretation', 'suggestedAction'].every(key => typeof finding[key] === 'string' && finding[key].trim() && finding[key].length <= 1500)) throw new Error('AI review does not agree with control evidence.');
    }
    // Structural grounding does not prove that every narrative claim is true.
    return draft;
  }
  const api = { VERSION, AS_OF, ROUTES, sample, review, aiEvidence, validateDraft };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DataReview = api;
}(typeof globalThis !== 'undefined' ? globalThis : this));
