applyTheme(getStoredTheme());

document.addEventListener('DOMContentLoaded', () => {
  setupMobileNav();
  setupThemeToggle();
  updateFooterYear();
  highlightCurrentPage();
  hydrateHomepageStats();
});

function getStoredTheme() {
  try {
    const storedTheme = localStorage.getItem('theme');
    return storedTheme === 'dark' ? 'dark' : 'light';
  } catch (error) {
    return 'light';
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function setupMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');

  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

function setupThemeToggle() {
  const menu = document.getElementById('nav-menu');
  if (!menu || document.getElementById('theme-toggle')) return;

  const item = document.createElement('li');
  item.className = 'theme-toggle-item';

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'theme-toggle';
  button.className = 'theme-toggle';

  function syncThemeButton() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    button.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    button.setAttribute('aria-pressed', String(isDark));
    button.textContent = isDark ? 'Light' : 'Dark';
  }

  button.addEventListener('click', () => {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', nextTheme);
    } catch (error) {
      // Keep the in-page theme switch working if storage is unavailable.
    }
    applyTheme(nextTheme);
    syncThemeButton();
  });

  syncThemeButton();
  item.appendChild(button);
  menu.appendChild(item);
}

function updateFooterYear() {
  document.querySelectorAll('[data-current-year]').forEach(node => {
    node.textContent = String(new Date().getFullYear());
  });
}

function highlightCurrentPage() {
  const page = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('[data-nav]').forEach(link => {
    const target = link.getAttribute('href');
    if (target === page) {
      link.classList.add('active');
    }
  });
}

async function hydrateHomepageStats() {
  const mentorsNode = document.getElementById('stat-mentors');
  const startupsNode = document.getElementById('stat-startups');
  const resourcesNode = document.getElementById('stat-resources');

  if (!mentorsNode && !startupsNode && !resourcesNode) return;
  if (typeof api === 'undefined') return;

  try {
    const [mentors, startups, resources] = await Promise.all([
      api.getAllMentors(),
      api.getAllStartups(),
      api.getAllResources(),
    ]);

    if (mentorsNode) mentorsNode.textContent = String(mentors.mentors?.length || 0);
    if (startupsNode) startupsNode.textContent = String(startups.startups?.length || 0);
    if (resourcesNode) resourcesNode.textContent = String(resources.resources?.length || 0);
  } catch (error) {
    // Keep the fallback values when the API is unavailable.
  }
}
