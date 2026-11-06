(function () {
  'use strict';
  const container = document.querySelector('[data-demo]');
  if (!container) return;
  const demo = window.EverydayDemos.find(item => item.id === container.dataset.demo);
  const engine = window.EverydayAI;
  const el = id => document.getElementById(`demo-${id}`);
  const inputs = demo.labels.map((_, i) => el(`input-${i}`));
  const values = () => inputs.map(input => input.value);
  const index = () => Number(el('scenario').value);
  let prompt = '';
  function update() {
    el('output-panel').hidden = true;
    el('output').textContent = '';
    const matches = engine.matchesExample(demo, index(), values());
    el('show').disabled = !matches;
    try {
      prompt = engine.buildPrompt(demo, values());
      el('prompt').textContent = prompt;
      el('copy').disabled = el('download').disabled = false;
      el('status').textContent = matches
        ? 'Example ready. Show its worked response or copy the reusable prompt.'
        : 'Custom input. Prompt updated; the worked response is hidden because it would not describe your text.';
    } catch (error) {
      prompt = '';
      el('prompt').textContent = '';
      el('copy').disabled = el('download').disabled = true;
      el('status').textContent = error.message;
    }
  }
  function restore() {
    demo.examples[index()].inputs.forEach((value, i) => { inputs[i].value = value; });
    update();
  }
  inputs.forEach(input => input.addEventListener('input', update));
  el('scenario').addEventListener('change', restore);
  el('reset').addEventListener('click', restore);
  el('show').addEventListener('click', () => {
    if (!engine.matchesExample(demo, index(), values())) return;
    el('output').textContent = demo.examples[index()].output;
    el('output-panel').hidden = false;
    el('status').textContent = 'Worked response shown below. This is a prewritten illustration for the selected example.';
  });
  el('copy').addEventListener('click', async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      el('status').textContent = 'Prompt copied. Run it in your chosen AI tool and review the response against the source.';
    } catch {
      el('prompt').closest('details').open = true;
      const selection = window.getSelection();
      const range = document.createRange(); range.selectNodeContents(el('prompt'));
      selection.removeAllRanges(); selection.addRange(range);
      el('prompt').focus();
      el('status').textContent = 'Clipboard access is unavailable. The prompt is selected; copy it manually or download it.';
    }
  });
  el('download').addEventListener('click', () => {
    if (!prompt) return;
    const text = engine.buildDownload(demo, index(), values());
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${demo.id}-prompt.txt`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    el('status').textContent = 'Download prepared with the current input, prompt and review notes.';
  });
  restore();
}());
