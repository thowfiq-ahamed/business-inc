// Funding Page Logic

let startups = [];
let selectedStartupId = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupFilters();
  setupModal();
  await loadStartups();
});

function showFundingStatus(message, type = 'info') {
  const status = document.getElementById('funding-status');
  if (!status) return;

  status.innerHTML = message ? `<div class="notice ${type}">${escapeHTML(message)}</div>` : '';
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getTractionLabel(startup) {
  if ((startup.teamSize || 0) >= 8 || startup.stage === 'growth' || startup.stage === 'scale') {
    return 'Strong traction signal';
  }
  if (startup.stage === 'mvp' || (startup.teamSize || 0) >= 4) {
    return 'Early traction';
  }
  return 'Pre-traction';
}

function isFeaturedStartup(startup) {
  return Boolean(startup.verified) || startup.stage === 'growth' || startup.stage === 'scale';
}

function sortStartups(items) {
  const sortBy = document.getElementById('sort-startups')?.value || 'featured';

  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'funding-desc':
        return (b.fundingNeeded || 0) - (a.fundingNeeded || 0);
      case 'funding-asc':
        return (a.fundingNeeded || 0) - (b.fundingNeeded || 0);
      case 'team-desc':
        return (b.teamSize || 0) - (a.teamSize || 0);
      case 'stage':
        return String(a.stage || '').localeCompare(String(b.stage || ''));
      case 'name':
        return String(a.name || '').localeCompare(String(b.name || ''));
      case 'featured':
      default:
        return Number(isFeaturedStartup(b)) - Number(isFeaturedStartup(a)) || (b.teamSize || 0) - (a.teamSize || 0);
    }
  });
}

function renderStartups(items) {
  const startupsGrid = document.getElementById('startups-grid');

  if (!items.length) {
    startupsGrid.innerHTML = '<div class="empty-state">No startups match your current filters.</div>';
    return;
  }

  startupsGrid.innerHTML = sortStartups(items)
    .map(startup => {
      const featured = isFeaturedStartup(startup);
      return `
        <article class="startup-card-item ${featured ? 'featured' : ''}" onclick="showStartupDetail('${startup._id}')">
          <div class="startup-header">
            <div class="startup-header-top">
              <span class="startup-chip">${featured ? 'Featured startup' : 'Open for discovery'}</span>
              <span class="startup-stage-pill">${escapeHTML(startup.stage)}</span>
            </div>
            <div class="startup-logo">${escapeHTML(startup.name.slice(0, 1).toUpperCase())}</div>
            <div class="startup-title">${escapeHTML(startup.name)}</div>
            <div class="startup-industry">${escapeHTML(startup.industry)}</div>
            <div class="startup-meta-item">${getTractionLabel(startup)}</div>
          </div>
          <div class="startup-body">
            <p class="startup-description">${escapeHTML(startup.description.substring(0, 120))}...</p>
            <div class="startup-stats">
              <div class="startup-stat">
                <div class="stat-value">${formatCurrency(startup.fundingNeeded)}</div>
                <div class="stat-label">Funding need</div>
              </div>
              <div class="startup-stat">
                <div class="stat-value">${startup.teamSize || 0}</div>
                <div class="stat-label">Team size</div>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

async function loadStartups() {
  const startupsGrid = document.getElementById('startups-grid');
  startupsGrid.innerHTML = '<div class="loading-state">Loading startups...</div>';
  showFundingStatus('');

  try {
    const response = await api.getAllStartups();
    startups = response.startups || [];
    filterStartups();

    if (!startups.length) {
      showFundingStatus('No startups are live yet. Seed the backend or create one from a founder account.', 'info');
    }
  } catch (error) {
    startupsGrid.innerHTML = '<div class="empty-state">We could not load startups right now.</div>';
    showFundingStatus(error.message, 'error');
  }
}

function setupFilters() {
  ['search-startup', 'filter-industry', 'filter-stage', 'sort-startups']
    .forEach(id => {
      const element = document.getElementById(id);
      const eventName = element?.tagName === 'INPUT' ? 'input' : 'change';
      element?.addEventListener(eventName, filterStartups);
    });
}

function filterStartups() {
  const searchTerm = (document.getElementById('search-startup')?.value || '').toLowerCase();
  const industry = (document.getElementById('filter-industry')?.value || '').toLowerCase();
  const stage = (document.getElementById('filter-stage')?.value || '').toLowerCase();

  const filtered = startups.filter(startup => {
    const matchesSearch = !searchTerm || startup.name.toLowerCase().includes(searchTerm);
    const matchesIndustry = !industry || startup.industry.toLowerCase() === industry;
    const matchesStage = !stage || startup.stage.toLowerCase() === stage;
    return matchesSearch && matchesIndustry && matchesStage;
  });

  renderStartups(filtered);
}

async function showStartupDetail(startupId) {
  selectedStartupId = startupId;
  const detailDiv = document.getElementById('startup-detail');
  const interestStatus = document.getElementById('interest-status');
  const interestNote = document.getElementById('interest-note');
  const interestButton = document.getElementById('express-interest-btn');

  detailDiv.innerHTML = '<div class="loading-state">Loading startup details...</div>';
  interestStatus.innerHTML = '';
  interestNote.value = '';

  try {
    const response = await api.getStartupById(startupId);
    const startup = response.startup;
    const safeWebsite = safeExternalURL(startup.website);

    detailDiv.innerHTML = `
      <div class="startup-detail">
        <div class="startup-detail-intro">
          <span class="startup-chip">${isFeaturedStartup(startup) ? 'Featured startup' : 'Open to investors'}</span>
          <h2>${escapeHTML(startup.name)}</h2>
          <p>${escapeHTML(startup.description)}</p>
        </div>
        <div class="startup-detail-header">
          <div class="startup-detail-info">
            <div class="detail-item"><div class="detail-label">Industry</div><div class="detail-value">${escapeHTML(startup.industry)}</div></div>
            <div class="detail-item"><div class="detail-label">Stage</div><div class="detail-value">${escapeHTML(startup.stage)}</div></div>
            <div class="detail-item"><div class="detail-label">Funding needed</div><div class="detail-value">${formatCurrency(startup.fundingNeeded)}</div></div>
            <div class="detail-item"><div class="detail-label">Team size</div><div class="detail-value">${startup.teamSize || 0}</div></div>
            <div class="detail-item"><div class="detail-label">Readiness</div><div class="detail-value">${getTractionLabel(startup)}</div></div>
            <div class="detail-item"><div class="detail-label">Website</div><div class="detail-value">${safeWebsite ? `<a href="${safeWebsite}" target="_blank" rel="noopener noreferrer">Visit site</a>` : 'Not added yet'}</div></div>
          </div>
        </div>
        <div class="founders">
          <h3>Founder</h3>
          <div class="founder">
            <div class="founder-avatar">${escapeHTML(startup.founderId?.name?.charAt(0) || 'F')}</div>
            <div class="founder-info">
              <div class="founder-name">${escapeHTML(startup.founderId?.name || 'Unknown Founder')}</div>
              <div class="founder-email">${escapeHTML(startup.founderId?.email || 'No email available')}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const user = getUserFromToken();
    const canExpressInterest = user?.role === 'investor';
    interestButton.style.display = canExpressInterest ? 'inline-flex' : 'none';

    if (!user) {
      interestStatus.innerHTML = '<div class="notice info">Log in as an investor to save startups to your portfolio.</div>';
    } else if (!canExpressInterest) {
      interestStatus.innerHTML = '<div class="notice info">Only investor accounts can express interest.</div>';
    }

    document.getElementById('startup-modal').classList.add('show');
  } catch (error) {
    detailDiv.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
  }
}

function setupModal() {
  const modal = document.getElementById('startup-modal');
  const closeBtn = modal?.querySelector('.close');
  const interestBtn = document.getElementById('express-interest-btn');

  closeBtn?.addEventListener('click', closeStartupModal);
  interestBtn?.addEventListener('click', expressInterest);

  window.addEventListener('click', event => {
    if (event.target === modal) {
      closeStartupModal();
    }
  });
}

function closeStartupModal() {
  document.getElementById('startup-modal')?.classList.remove('show');
}

async function expressInterest() {
  const status = document.getElementById('interest-status');
  const note = document.getElementById('interest-note').value.trim();

  if (!isAuthenticated()) {
    status.innerHTML = '<div class="notice error">Please log in first.</div>';
    return;
  }

  const user = getUserFromToken();
  if (user.role !== 'investor') {
    status.innerHTML = '<div class="notice error">Only investors can express interest in startups.</div>';
    return;
  }

  status.innerHTML = '<div class="notice info">Saving your interest...</div>';

  try {
    await api.expressInterest(selectedStartupId, note);
    status.innerHTML = '<div class="notice success">Saved to your investor portfolio.</div>';
    showFundingStatus('Investor interest saved successfully.', 'success');
  } catch (error) {
    status.innerHTML = `<div class="notice error">${escapeHTML(error.message)}</div>`;
  }
}

window.showStartupDetail = showStartupDetail;
