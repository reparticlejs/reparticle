/** Site-wide theme preference and a small, local documentation search. */
const theme = document.querySelector<HTMLButtonElement>('#theme-preference');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');

if (theme) {
  let preference = 'system';
  try {
    const saved = localStorage.getItem('reparticle-theme');
    preference = saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    preference = 'system';
  }

  function applyTheme() {
    if (!theme) {
      return;
    }
    const resolved =
      preference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : preference;
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    const next = preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system';
    const label = `Theme: ${preference}. Switch to ${next}.`;
    theme.dataset.preference = preference;
    theme.setAttribute('aria-label', label);
    theme.title = label;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolved === 'dark' ? '#090a0c' : '#fafbfc');
  }

  theme.addEventListener('click', () => {
    preference = preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system';
    try {
      localStorage.setItem('reparticle-theme', preference);
    } catch {
      // The selection still works when persistent storage is unavailable.
    }
    applyTheme();
  });
  systemTheme.addEventListener('change', applyTheme);
  applyTheme();
}

const search = document.querySelector<HTMLDialogElement>('#site-search');
const query = document.querySelector<HTMLInputElement>('#search-query');
const results = [...document.querySelectorAll<HTMLAnchorElement>('[data-search-result]')];

function openSearch() {
  search?.showModal();
  query?.focus();
}

document.querySelector('#search-open')?.addEventListener('click', openSearch);
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (search?.open) {
      search.close();
    } else {
      openSearch();
    }
  }
});
query?.addEventListener('input', () => {
  const terms = query.value.toLowerCase().trim().split(/\s+/);
  for (const result of results) {
    result.hidden = !terms.every((term) => result.textContent?.toLowerCase().includes(term));
  }
  const empty = document.querySelector<HTMLElement>('#search-empty');
  if (empty) {
    empty.hidden = results.some((result) => !result.hidden);
  }
});

const menuButton = document.querySelector<HTMLButtonElement>('#nav-toggle');
const menu = document.querySelector<HTMLElement>('#nav-mobile');
menuButton?.addEventListener('click', () => {
  const open = menu?.classList.toggle('hidden') === false;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

// Let keyboard users dismiss the mobile menu and return to its toggle.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    menu?.classList.add('hidden');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    menuButton.focus();
  }
});
