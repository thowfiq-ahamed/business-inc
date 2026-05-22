// Resources Page Logic

let resources = [];
let bookmarks = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    bookmarks = JSON.parse(localStorage.getItem('resourceBookmarks') || '[]');
  } catch (error) {
    bookmarks = [];
  }
  setupFilters();
  await loadResources();
});

function showResourcesStatus(message, type = 'info') {
  const status = document.getElementById('resources-status');
  if (!status) return;

  status.innerHTML = message ? `<div class="notice ${type}">${escapeHTML(message)}</div>` : '';
}

function getCategoryLabel(category) {
  return category ? category.charAt(0).toUpperCase() + category.slice(1) : 'General';
}

function isBookmarked(resourceId) {
  return bookmarks.includes(resourceId);
}

function isFeaturedResource(resource) {
  return (resource.usefulCount || 0) >= 1 || (resource.rating || 0) >= 5;
}

function persistBookmarks() {
  localStorage.setItem('resourceBookmarks', JSON.stringify(bookmarks));
}

function renderResources(items) {
  const resourcesGrid = document.getElementById('resources-grid');

  if (!items.length) {
    resourcesGrid.innerHTML = '<div class="empty-state">No resources match your current filters.</div>';
    return;
  }

  resourcesGrid.innerHTML = items
    .map(resource => {
      const bookmarked = isBookmarked(resource._id);
      const featured = isFeaturedResource(resource);
      const safeLink = safeExternalURL(resource.link);

      return `
        <article class="resource-card ${featured ? 'featured' : ''}">
          <div class="resource-header">
            <div class="resource-header-top">
              <span class="resource-chip">${featured ? 'Featured' : 'Resource'}</span>
              <button class="bookmark-btn ${bookmarked ? 'active' : ''}" onclick="toggleBookmark('${resource._id}')">${bookmarked ? 'Saved' : 'Save'}</button>
            </div>
            <div class="resource-icon">${getCategoryLabel(resource.category).slice(0, 1)}</div>
            <div class="resource-title">${escapeHTML(resource.title)}</div>
          </div>
          <div class="resource-body">
            <p class="resource-description">${escapeHTML(resource.description || 'No description available yet.')}</p>
            <span class="resource-category">${escapeHTML(getCategoryLabel(resource.category))}</span>
            <div class="resource-meta">
              <div class="meta-item"><span class="meta-label">Cost</span><span class="meta-value">${escapeHTML(resource.cost || 'free')}</span></div>
              <div class="meta-item"><span class="meta-label">Useful</span><span class="meta-value">${resource.usefulCount || 0}</span></div>
            </div>
            <div class="resource-tags">
              ${(resource.tags || []).map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}
            </div>
            <div class="resource-footer">
              ${safeLink ? `<a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Visit</a>` : ''}
              <button class="btn btn-secondary" onclick="markUseful('${resource._id}')">Useful</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

async function loadResources() {
  const resourcesGrid = document.getElementById('resources-grid');
  resourcesGrid.innerHTML = '<div class="loading-state">Loading resources...</div>';
  showResourcesStatus('');

  try {
    const response = await api.getAllResources();
    resources = (response.resources || []).sort((a, b) => {
      return Number(isFeaturedResource(b)) - Number(isFeaturedResource(a)) || (b.usefulCount || 0) - (a.usefulCount || 0);
    });

    filterResources();

    if (!resources.length) {
      showResourcesStatus('No resources are available yet. Add some seed content or create resources from the API.', 'info');
    }
  } catch (error) {
    resourcesGrid.innerHTML = '<div class="empty-state">We could not load resources right now.</div>';
    showResourcesStatus(error.message, 'error');
  }
}

function setupFilters() {
  ['search-resource', 'filter-category', 'filter-cost', 'filter-bookmarked']
    .forEach(id => {
      const element = document.getElementById(id);
      const eventName = element?.tagName === 'INPUT' ? 'input' : 'change';
      element?.addEventListener(eventName, filterResources);
    });
}

function filterResources() {
  const searchTerm = (document.getElementById('search-resource')?.value || '').toLowerCase();
  const category = (document.getElementById('filter-category')?.value || '').toLowerCase();
  const cost = (document.getElementById('filter-cost')?.value || '').toLowerCase();
  const bookmarkedOnly = document.getElementById('filter-bookmarked')?.value === 'bookmarked';

  const filtered = resources.filter(resource => {
    const matchesSearch =
      !searchTerm ||
      resource.title.toLowerCase().includes(searchTerm) ||
      resource.description?.toLowerCase().includes(searchTerm);
    const matchesCategory = !category || resource.category.toLowerCase() === category;
    const matchesCost = !cost || (resource.cost || '').toLowerCase() === cost;
    const matchesBookmark = !bookmarkedOnly || isBookmarked(resource._id);
    return matchesSearch && matchesCategory && matchesCost && matchesBookmark;
  });

  renderResources(filtered);
}

function toggleBookmark(resourceId) {
  if (isBookmarked(resourceId)) {
    bookmarks = bookmarks.filter(id => id !== resourceId);
  } else {
    bookmarks.push(resourceId);
  }

  persistBookmarks();
  filterResources();
}

async function markUseful(resourceId) {
  if (!isAuthenticated()) {
    showResourcesStatus('Log in to mark resources as useful.', 'info');
    return;
  }

  try {
    await api.markResourceAsUseful(resourceId);
    showResourcesStatus('Thanks for the feedback. Resource popularity has been updated.', 'success');
    await loadResources();
  } catch (error) {
    showResourcesStatus(error.message, 'error');
  }
}

window.markUseful = markUseful;
window.toggleBookmark = toggleBookmark;
