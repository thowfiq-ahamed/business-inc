let adminData = null;

document.addEventListener('DOMContentLoaded', async () => {
  redirectIfNotAuthenticated();

  const user = (await fetchUserProfile()) || getUserFromToken();
  if (!user || user.role !== 'admin') {
    window.location.href = 'dashboard.html';
    return;
  }

  const welcome = document.getElementById('admin-welcome');
  if (welcome) {
    welcome.textContent = `Signed in as ${user.name}. Use this page to keep public data credible.`;
  }

  document.getElementById('refresh-admin-btn')?.addEventListener('click', loadAdminOverview);
  await loadAdminOverview();
});

function showAdminStatus(message, type = 'info') {
  const status = document.getElementById('admin-status');
  if (!status) return;

  status.innerHTML = message ? `<div class="notice ${type}">${escapeHTML(message)}</div>` : '';
}

function renderAdminEmpty(targetId, message) {
  const target = document.getElementById(targetId);
  if (target) {
    target.innerHTML = `<div class="empty-state">${escapeHTML(message)}</div>`;
  }
}

function getId(record) {
  return record?._id || record?.id || '';
}

function getVerificationBadge(verified) {
  return `<span class="request-status ${verified ? 'accepted' : 'pending'}">${verified ? 'verified' : 'pending'}</span>`;
}

function getDateLabel(value) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleDateString();
}

async function loadAdminOverview() {
  showAdminStatus('Loading admin data...', 'info');

  try {
    adminData = await api.getAdminOverview();
    renderSummary(adminData.stats || {});
    renderStartups(adminData.startups || []);
    renderMentors(adminData.mentors || []);
    renderUsers(adminData.users || []);
    renderContactMessages(adminData.contactMessages || []);
    renderResources(adminData.resources || []);
    showAdminStatus('Admin data loaded.', 'success');
  } catch (error) {
    showAdminStatus(error.message, 'error');
  }
}

function renderSummary(stats) {
  const summary = document.getElementById('admin-summary');
  if (!summary) return;

  const cards = [
    ['Users', stats.users || 0],
    ['Startups', stats.startups || 0],
    ['Mentors', stats.mentors || 0],
    ['Resources', stats.resources || 0],
    ['Investor interests', stats.interests || 0],
    ['Mentor requests', stats.mentorRequests || 0],
    ['Contact messages', stats.contactMessages || 0],
    ['New inquiries', stats.newContactMessages || 0],
    ['Pending users', stats.pendingUsers || 0],
    ['Pending startups', stats.pendingStartups || 0],
    ['Pending mentors', stats.pendingMentors || 0],
  ];

  summary.innerHTML = cards
    .map(([label, value]) => `
      <div class="metric-card compact-metric">
        <span class="metric-value">${escapeHTML(value)}</span>
        <span class="metric-label">${escapeHTML(label)}</span>
      </div>
    `)
    .join('');
}

function renderTable(targetId, columns, rows, emptyMessage) {
  const target = document.getElementById(targetId);
  if (!target) return;

  if (!rows.length) {
    renderAdminEmpty(targetId, emptyMessage);
    return;
  }

  target.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>${columns.map(column => `<th>${escapeHTML(column)}</th>`).join('')}</tr>
        </thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>
  `;
}

function renderStartups(startups) {
  renderTable(
    'admin-startups',
    ['Startup', 'Founder', 'Stage', 'Funding', 'Status', 'Action'],
    startups.map(startup => {
      const verified = Boolean(startup.verified);
      return `
        <tr>
          <td><strong>${escapeHTML(startup.name)}</strong><span>${escapeHTML(startup.industry || 'No industry')}</span></td>
          <td>${escapeHTML(startup.founderId?.name || 'Unknown')}<span>${escapeHTML(startup.founderId?.email || '')}</span></td>
          <td>${escapeHTML(startup.stage || 'idea')}</td>
          <td>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(startup.fundingNeeded || 0)}</td>
          <td>${getVerificationBadge(verified)}</td>
          <td><button class="btn btn-secondary btn-small" onclick="toggleStartupVerification('${getId(startup)}', ${!verified})">${verified ? 'Unverify' : 'Verify'}</button></td>
        </tr>
      `;
    }),
    'No startups yet.'
  );
}

function renderMentors(mentors) {
  renderTable(
    'admin-mentors',
    ['Mentor', 'Expertise', 'Experience', 'Status', 'Action'],
    mentors.map(mentor => {
      const verified = Boolean(mentor.userId?.verified);
      return `
        <tr>
          <td><strong>${escapeHTML(mentor.userId?.name || 'Unknown')}</strong><span>${escapeHTML(mentor.userId?.email || '')}</span></td>
          <td>${escapeHTML((mentor.expertise || []).join(', ') || 'Not listed')}</td>
          <td>${escapeHTML(mentor.yearsOfExperience || 0)} years</td>
          <td>${getVerificationBadge(verified)}</td>
          <td><button class="btn btn-secondary btn-small" onclick="toggleMentorVerification('${getId(mentor)}', ${!verified})">${verified ? 'Unverify' : 'Verify'}</button></td>
        </tr>
      `;
    }),
    'No mentor profiles yet.'
  );
}

function renderUsers(users) {
  renderTable(
    'admin-users',
    ['User', 'Role', 'Joined', 'Status', 'Action'],
    users.map(user => {
      const verified = Boolean(user.verified);
      return `
        <tr>
          <td><strong>${escapeHTML(user.name)}</strong><span>${escapeHTML(user.email)}</span></td>
          <td>${escapeHTML(user.role)}</td>
          <td>${escapeHTML(getDateLabel(user.createdAt))}</td>
          <td>${getVerificationBadge(verified)}</td>
          <td><button class="btn btn-secondary btn-small" onclick="toggleUserVerification('${getId(user)}', ${!verified})">${verified ? 'Unverify' : 'Verify'}</button></td>
        </tr>
      `;
    }),
    'No users yet.'
  );
}

function renderResources(resources) {
  renderTable(
    'admin-resources',
    ['Resource', 'Category', 'Cost', 'Useful', 'Created by'],
    resources.map(resource => `
      <tr>
        <td><strong>${escapeHTML(resource.title)}</strong><span>${escapeHTML(resource.provider || 'No provider')}</span></td>
        <td>${escapeHTML(resource.category || 'general')}</td>
        <td>${escapeHTML(resource.cost || 'free')}</td>
        <td>${escapeHTML(resource.usefulCount || 0)}</td>
        <td>${escapeHTML(resource.createdBy?.name || 'Unknown')}</td>
      </tr>
    `),
    'No resources yet.'
  );
}

function renderContactMessages(messages) {
  renderTable(
    'admin-contact-messages',
    ['Sender', 'Type', 'Subject', 'Message', 'Received', 'Status'],
    messages.map(message => `
      <tr>
        <td><strong>${escapeHTML(message.name)}</strong><span>${escapeHTML(message.email)}</span></td>
        <td>${escapeHTML(message.inquiryType || 'general')}</td>
        <td>${escapeHTML(message.subject)}</td>
        <td>${escapeHTML((message.message || '').slice(0, 180))}${(message.message || '').length > 180 ? '...' : ''}</td>
        <td>${escapeHTML(getDateLabel(message.createdAt))}</td>
        <td>
          <select class="admin-status-select" onchange="updateContactStatus('${getId(message)}', this.value)">
            <option value="new" ${message.status === 'new' ? 'selected' : ''}>New</option>
            <option value="reviewed" ${message.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
            <option value="closed" ${message.status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
        </td>
      </tr>
    `),
    'No contact messages yet.'
  );
}

async function toggleUserVerification(id, verified) {
  await toggleVerification(() => api.setUserVerification(id, verified), `User ${verified ? 'verified' : 'unverified'}.`);
}

async function toggleStartupVerification(id, verified) {
  await toggleVerification(() => api.setStartupVerification(id, verified), `Startup ${verified ? 'verified' : 'unverified'}.`);
}

async function toggleMentorVerification(id, verified) {
  await toggleVerification(() => api.setMentorVerification(id, verified), `Mentor ${verified ? 'verified' : 'unverified'}.`);
}

async function toggleVerification(action, successMessage) {
  showAdminStatus('Saving approval change...', 'info');

  try {
    await action();
    showAdminStatus(successMessage, 'success');
    await loadAdminOverview();
  } catch (error) {
    showAdminStatus(error.message, 'error');
  }
}

async function updateContactStatus(id, status) {
  showAdminStatus('Saving contact message status...', 'info');

  try {
    await api.setContactMessageStatus(id, status);
    showAdminStatus('Contact message status updated.', 'success');
    await loadAdminOverview();
  } catch (error) {
    showAdminStatus(error.message, 'error');
  }
}

window.toggleUserVerification = toggleUserVerification;
window.toggleStartupVerification = toggleStartupVerification;
window.toggleMentorVerification = toggleMentorVerification;
window.updateContactStatus = updateContactStatus;
