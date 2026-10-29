(function () {
  'use strict';
  const engine = window.DataReview;
  const el = id => document.getElementById(id);
  const scenario = el('review-scenario'), threshold = el('review-threshold');
  let current = null;
  const example = window.DataReviewExample || null;
  function node(tag, text, className) {
    const item = document.createElement(tag);
    if (text !== undefined) item.textContent = text;
    if (className) item.className = className;
    return item;
  }
  function download(name, value) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function clearDraft() {
    el('review-ai-output').replaceChildren();
    el('review-ai-note').textContent = 'The worked AI example is available for the exceptions scenario at a 24-hour threshold. A fresh AI review for any scenario can be generated with the downloadable runner.';
    el('review-show-ai').disabled = !current || scenario.value !== 'exceptions' || Number(threshold.value) !== 24 || !example;
  }
  function showInput() {
    const data = engine.sample(scenario.value);
    const body = el('review-input-rows'); body.replaceChildren();
    data.forEach((row, i) => {
      const tr = node('tr');
      [i + 1, row.id || '(missing)', row.subject, row.ageHours === null ? '(missing)' : row.ageHours, row.category].forEach(value => tr.append(node('td', value)));
      body.append(tr);
    });
    current = null;
    el('review-results').hidden = true;
    el('review-download').disabled = true;
    el('review-status').textContent = 'Scenario ready. Run the checks to generate current evidence.';
    clearDraft();
  }
  function run() {
    current = engine.review(engine.sample(scenario.value), Number(threshold.value));
    const s = current.summary;
    el('review-results').hidden = false;
    el('review-status').textContent = `Checks complete. ${s.flaggedControls} of 5 controls flagged. ${s.releaseStatus === 'blocked' ? 'Batch blocked for source corrections.' : s.releaseStatus === 'review-required' ? 'Overdue requests require review.' : 'Routing plan ready for human review.'}`;
    const metrics = el('review-metrics'); metrics.replaceChildren();
    [[s.inputRows, 'incoming rows'], [s.eligibleRows, 'eligible for draft routing'], [s.excludedRows, 'rows excluded'], [`${s.flaggedControls} / 5`, 'controls flagged']].forEach(([value, label]) => {
      const card = node('div', undefined, 'review-metric'); card.append(node('strong', value), node('span', label)); metrics.append(card);
    });
    const body = el('review-control-rows'); body.replaceChildren();
    current.controls.forEach(control => {
      const tr = node('tr');
      tr.append(node('th', `${control.id} · ${control.name}`)); tr.firstChild.scope = 'row';
      const status = node('td'); status.append(node('span', control.count ? control.severity === 'blocker' ? 'Resolve' : 'Review' : 'Pass', `review-badge ${control.count ? 'review-badge--flag' : 'review-badge--pass'}`));
      const unit = control.count === 1 ? control.unit.replace(/^rows\b/, 'row').replace(/groups$/, 'group').replace(/^eligible requests\b/, 'eligible request') : control.unit;
      tr.append(status, node('td', `${control.count} ${unit}`));
      const detail = node('td');
      if (control.refs.length) {
        detail.append(node('p', control.refs.join('; '), 'review-refs'), node('p', control.action));
      } else detail.textContent = 'No exceptions to this rule.';
      tr.append(detail); body.append(tr);
    });
    const plan = el('review-plan'); plan.replaceChildren();
    plan.append(node('h3', 'Draft routing plan'), node('p', s.releaseStatus === 'blocked' ? 'Batch blocked. The eligible rows below are diagnostic proposals only. Resolve the intake exceptions before releasing work.' : 'Proposed queues and follow-ups for eligible requests. Human approval is required; no messages or tasks have been sent.'));
    const totals = node('p', s.queueCounts.map(item => `${item.queue}: ${item.count}`).join(' · '));
    plan.append(totals);
    const table = node('table', undefined, 'review-table');
    const caption = node('caption', 'Eligible synthetic requests'); table.append(caption);
    const head = node('thead'), header = node('tr');
    ['Request', 'Subject', 'Queue', 'Age (hours)', 'Follow-up'].forEach(label => { const th = node('th', label); th.scope = 'col'; header.append(th); });
    head.append(header); table.append(head);
    const rows = node('tbody');
    current.plan.forEach(row => {
      const tr = node('tr');
      [row.id, row.subject, row.queue, row.ageHours, row.followUp ? 'Review overdue item' : 'Standard queue'].forEach(value => tr.append(node('td', value)));
      rows.append(tr);
    });
    table.append(rows); const scroll = node('div', undefined, 'review-table-scroll');
    scroll.tabIndex = 0; scroll.setAttribute('role', 'region'); scroll.setAttribute('aria-label', 'Draft routing plan'); scroll.append(table); plan.append(scroll);
    el('review-download').disabled = false;
    el('review-evidence').textContent = JSON.stringify(engine.aiEvidence(current), null, 2);
    clearDraft();
  }
  scenario.addEventListener('change', showInput);
  threshold.addEventListener('change', showInput);
  el('review-run').addEventListener('click', run);
  el('review-download').addEventListener('click', () => { if (current) download(`synthetic-review-${scenario.value}.json`, { scenario: scenario.value, ...current }); });
  el('review-show-ai').addEventListener('click', () => {
    if (!current || !example || scenario.value !== 'exceptions' || Number(threshold.value) !== 24) return;
    engine.validateDraft(example.draft, engine.aiEvidence(current));
    const output = el('review-ai-output'); output.replaceChildren();
    output.append(node('p', example.draft.summary, 'review-ai-summary'));
    example.draft.findings.forEach(finding => {
      const section = node('section');
      section.append(node('h4', `${finding.controlId} · ${finding.observedCount} flagged`), node('p', finding.interpretation), node('p', finding.suggestedAction)); output.append(section);
    });
    el('review-ai-note').textContent = `${example.provenance} Counts and control references pass structural validation; the narrative still needs human review.`;
  });
  if (!example) el('review-ai-note').textContent = 'The worked example could not be loaded. Use the source runner for the AI step.';
  showInput();
}());
