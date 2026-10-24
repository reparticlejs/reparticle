/** Add copying to highlighted snippets, including generated API examples. */
for (const snippet of document.querySelectorAll<HTMLPreElement>('pre.astro-code, pre.shiki')) {
  const code = snippet.querySelector('code');
  if (!code || snippet.closest('[data-no-copy]')) {
    continue;
  }

  const frame = document.createElement('div');
  frame.className = 'code-snippet';
  const toolbar = document.createElement('div');
  toolbar.className = 'code-snippet-toolbar';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Copy';
  button.setAttribute('aria-label', 'Copy code');
  button.setAttribute('aria-live', 'polite');
  toolbar.append(button);
  snippet.before(frame);
  frame.append(toolbar, snippet);

  let reset: ReturnType<typeof setTimeout>;
  button.addEventListener('click', async () => {
    clearTimeout(reset);
    try {
      await navigator.clipboard.writeText(code.textContent ?? '');
      button.textContent = 'Copied!';
      button.setAttribute('aria-label', 'Code copied');
    } catch {
      button.textContent = 'Select to copy';
      button.setAttribute('aria-label', 'Copy failed. Select the code to copy manually.');
    }
    reset = setTimeout(() => {
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy code');
    }, 2000);
  });
}
