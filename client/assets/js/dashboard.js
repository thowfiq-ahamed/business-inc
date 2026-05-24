// Dashboard Logic

let currentUser = null;
let currentStartup = null;
let currentMentor = null;

document.addEventListener('DOMContentLoaded', async () => {
  redirectIfNotAuthenticated();

  currentUser = (await fetchUserProfile()) || getUserFromToken();
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  const welcomeMessage = document.getElementById('welcome-message');
  if (welcomeMessage) {
    welcomeMessage.textContent = `Welcome back, ${currentUser.name}.`;
  }

  renderDashboardMeta();
  renderQuickActions();

  toggleDashboardSections(currentUser.role);

  if (currentUser.role === 'startup') {
    await loadStartupDashboard();
    await loadInvestorInterests(); // ✅ BUG 10 FIX: load after startup is set
  } else if (currentUser.role === 'mentor') {
    await loadMentorDashboard();  // ✅ BUG 2 FIX: loadMentorRequests is called inside
                                  // loadMentorDashboard now, so currentMentor is guaranteed set
  } else if (currentUser.role === 'investor') {
    await loadInvestorDashboard();
  } else if (currentUser.role === 'admin') {
    renderEmptyState('investor-portfolio', 'Open the admin workspace to review users, startups, mentors, and resources.');
  }
});

function toggleDashboardSections(role) {
  const visibilityMap = {
    'startup-dashboard': role === 'startup',
    'mentor-dashboard': role === 'mentor',
    'investor-dashboard': role === 'investor',
    'mentor-requests': role === 'mentor',
    'investor-interests': role === 'startup', // ✅ BUG 10 FIX: show to founders
  };

  Object.entries(visibilityMap).forEach(([id, isVisible]) => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = isVisible ? 'block' : 'none';
    }
  });
}

function showNotice(targetId, message, type = 'info') {
  const target = document.getElementById(targetId);
  if (!target) return;

  target.innerHTML = message ? `<div class="notice ${type}">${escapeHTML(message)}</div>` : '';
}

function renderEmptyState(targetId, message) {
  const target = document.getElementById(targetId);
  if (!target) return;

  target.innerHTML = `<div class="empty-state">${escapeHTML(message)}</div>`;
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value;
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function renderDashboardMeta() {
  const roleLabel = currentUser.role === 'startup'
    ? 'Founder profile'
    : currentUser.role === 'mentor'
      ? 'Mentor profile'
      : currentUser.role === 'admin'
        ? 'Admin profile'
        : 'Investor profile';

  setText('profile-completion', `${roleLabel} is active. Complete the key sections below to improve visibility.`);
  setText('recent-activity', `Your workspace is tuned for the ${currentUser.role} role. Keep profile details current so the right people can evaluate you quickly.`);

  const activityList = document.getElementById('activity-list');
  if (!activityList) return;

  const items = {
    startup: [
      'Refresh your startup profile before sending mentor requests.',
      'Add a website and funding target to improve investor clarity.',
      'Use the resources page to save practical operating templates.',
    ],
    mentor: [
      'Keep expertise tags specific so founders can find you quickly.',
      'Respond to pending requests to maintain momentum.',
      'Refine your profile to show operating depth and availability.',
    ],
    investor: [
      'Save promising teams with notes so you can revisit them later.',
      'Compare team size and stage when triaging opportunities.',
      'Use the funding board sort controls to find stronger signals faster.',
    ],
    admin: [
      'Review new users before trusting them publicly.',
      'Verify startups that have complete, credible profiles.',
      'Keep mentor approvals current so founders see reliable experts.',
    ],
  };

  activityList.innerHTML = (items[currentUser.role] || [])
    .map(item => `<li>${item}</li>`)
    .join('');
}

function renderQuickActions() {
  const quickActions = document.getElementById('quick-actions');
  if (!quickActions) return;

  const actions = {
    startup: [
      { href: '#startup-dashboard', label: 'Update startup profile', className: 'btn btn-primary' },
      { href: 'mentors.html', label: 'Find a mentor', className: 'btn btn-secondary' },
      { href: 'resources.html', label: 'Browse resources', className: 'btn btn-ghost' },
    ],
    mentor: [
      { href: '#mentor-dashboard', label: 'Edit mentor profile', className: 'btn btn-primary' },
      { href: '#mentor-requests', label: 'Review requests', className: 'btn btn-secondary' },
      { href: 'resources.html', label: 'View resources', className: 'btn btn-ghost' },
    ],
    investor: [
      { href: 'funding.html', label: 'Browse startups', className: 'btn btn-primary' },
      { href: '#investor-dashboard', label: 'View portfolio', className: 'btn btn-secondary' },
      { href: 'success-stories.html', label: 'Read founder stories', className: 'btn btn-ghost' },
    ],
    admin: [
      { href: 'admin.html', label: 'Open admin panel', className: 'btn btn-primary' },
      { href: 'funding.html', label: 'Review funding board', className: 'btn btn-secondary' },
      { href: 'resources.html', label: 'Review resources', className: 'btn btn-ghost' },
    ],
  };

  quickActions.innerHTML = (actions[currentUser.role] || [])
    .map(action => `<a href="${action.href}" class="${action.className}">${action.label}</a>`)
    .join('');
}

async function loadStartupDashboard() {
  const startupInfo = document.getElementById('startup-info');
  const createBtn = document.getElementById('create-startup-btn');

  showNotice('startup-form-container', '');
  startupInfo.innerHTML = '<div class="loading-state">Loading your startup profile...</div>';

  try {
    const response = await api.getAllStartups();

    // ✅ BUG 3 FIX: also check _id in case JWT payload uses _id instead of id
    currentStartup = response.startups.find(startup => {
      const founderId = startup.founderId?._id || startup.founderId;
      return founderId === currentUser.id || founderId === currentUser._id;
    }) || null;

    if (!currentStartup) {
      renderEmptyState('startup-info', 'No startup profile yet. Create one to appear on the funding board.');
      createBtn.textContent = 'Create Startup';
      createBtn.style.display = 'inline-block';
      createBtn.onclick = () => renderStartupForm();
      return;
    }

    startupInfo.innerHTML = `
      <div class="startup-card">
        <h3>${escapeHTML(currentStartup.name)}</h3>
        <p>${escapeHTML(currentStartup.description)}</p>
        <div class="startup-info">
          <div class="startup-info-item">
            <div class="startup-info-label">Industry</div>
            <div class="startup-info-value">${escapeHTML(currentStartup.industry)}</div>
          </div>
          <div class="startup-info-item">
            <div class="startup-info-label">Stage</div>
            <div class="startup-info-value">${escapeHTML(currentStartup.stage)}</div>
          </div>
          <div class="startup-info-item">
            <div class="startup-info-label">Funding Needed</div>
            <div class="startup-info-value">${formatCurrency(currentStartup.fundingNeeded)}</div>
          </div>
          <div class="startup-info-item">
            <div class="startup-info-label">Team Size</div>
            <div class="startup-info-value">${currentStartup.teamSize || 0}</div>
          </div>
          <div class="startup-info-item">
            <div class="startup-info-label">Website</div>
            <div class="startup-info-value">${escapeHTML(currentStartup.website || 'Not added yet')}</div>
          </div>
        </div>
        <div class="section-actions">
          <button class="btn btn-secondary" onclick="editStartup('${currentStartup._id}')">Edit Startup</button>
          <button class="btn btn-danger" onclick="deleteStartupConfirm('${currentStartup._id}')">Delete Startup</button>
        </div>
      </div>
    `;

    createBtn.textContent = 'Add Another Startup';
    createBtn.style.display = 'none';
  } catch (error) {
    renderEmptyState('startup-info', `We could not load your startup profile: ${error.message}`);
  }
}

function renderStartupForm(startup = null) {
  const formContainer = document.getElementById('startup-form-container');
  const isEditing = Boolean(startup);

  formContainer.innerHTML = `
    <form class="startup-form" id="startup-form">
      <div id="startup-form-status"></div>
      <div class="form-row">
        <div class="form-group">
          <label for="startup-name">Startup Name</label>
          <input type="text" id="startup-name" name="name" value="${escapeHTML(startup?.name || '')}" required>
        </div>
        <div class="form-group">
          <label for="startup-industry">Industry</label>
          <input type="text" id="startup-industry" name="industry" value="${escapeHTML(startup?.industry || '')}" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group form-group-full">
          <label for="startup-description">Description</label>
          <textarea id="startup-description" name="description" rows="4" required>${escapeHTML(startup?.description || '')}</textarea>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="startup-stage">Stage</label>
          <select id="startup-stage" name="stage">
            <option value="idea">Idea</option>
            <option value="prototype">Prototype</option>
            <option value="mvp">MVP</option>
            <option value="growth">Growth</option>
            <option value="scale">Scale</option>
          </select>
        </div>
        <div class="form-group">
          <label for="startup-funding">Funding Needed</label>
          <input type="number" id="startup-funding" name="fundingNeeded" min="0" value="${startup?.fundingNeeded || 0}">
        </div>
        <div class="form-group">
          <label for="startup-team">Team Size</label>
          <input type="number" id="startup-team" name="teamSize" min="1" value="${startup?.teamSize || 1}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group form-group-full">
          <label for="startup-website">Website</label>
          <input type="url" id="startup-website" name="website" value="${escapeHTML(startup?.website || '')}" placeholder="https://yourstartup.com">
        </div>
      </div>
      <div class="section-actions">
        <button type="submit" class="btn btn-primary">${isEditing ? 'Save Changes' : 'Create Startup'}</button>
        <button type="button" class="btn btn-secondary" onclick="cancelStartupForm()">Cancel</button>
      </div>
    </form>
  `;

  document.getElementById('startup-stage').value = startup?.stage || 'idea';
  document.getElementById('startup-form').addEventListener('submit', event => submitStartupForm(event, startup?._id));
}

async function submitStartupForm(e, startupId = null) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  data.fundingNeeded = parseInt(data.fundingNeeded, 10) || 0;
  data.teamSize = parseInt(data.teamSize, 10) || 1;

  showNotice('startup-form-status', 'Saving startup profile...', 'info');

  try {
    if (startupId) {
      await api.updateStartup(startupId, data);
      showNotice('startup-form-container', 'Startup updated successfully.', 'success');
    } else {
      await api.createStartup(data);
      showNotice('startup-form-container', 'Startup created successfully.', 'success');
    }

    document.getElementById('startup-form-container').innerHTML = '';
    await loadStartupDashboard();
  } catch (error) {
    showNotice('startup-form-status', error.message, 'error');
  }
}

function cancelStartupForm() {
  document.getElementById('startup-form-container').innerHTML = '';
}

async function editStartup(startupId) {
  try {
    const response = await api.getStartupById(startupId);
    renderStartupForm(response.startup);
  } catch (error) {
    showNotice('startup-form-container', `We could not open the startup editor: ${error.message}`, 'error');
  }
}

function deleteStartupConfirm(startupId) {
  const formContainer = document.getElementById('startup-form-container');
  formContainer.innerHTML = `
    <div class="notice error">
      <strong>Delete this startup?</strong> This removes it from the funding board and dashboard.
      <div class="section-actions">
        <button class="btn btn-danger" onclick="deleteStartup('${startupId}')">Yes, delete it</button>
        <button class="btn btn-secondary" onclick="cancelStartupForm()">Cancel</button>
      </div>
    </div>
  `;
}

async function deleteStartup(startupId) {
  showNotice('startup-form-container', 'Deleting startup...', 'info');

  try {
    await api.deleteStartup(startupId);
    currentStartup = null;
    document.getElementById('startup-form-container').innerHTML = '';
    showNotice('startup-form-container', 'Startup deleted successfully.', 'success');
    await loadStartupDashboard();
  } catch (error) {
    showNotice('startup-form-container', error.message, 'error');
  }
}

async function loadMentorDashboard() {
  const mentorInfo = document.getElementById('mentor-info');
  const createBtn = document.getElementById('create-mentor-btn');

  mentorInfo.innerHTML = '<div class="loading-state">Loading your mentor profile...</div>';

  try {
    const response = await api.getAllMentors();

    // ✅ BUG 3 FIX: also check _id in case JWT payload uses _id instead of id
    currentMentor = response.mentors.find(mentor => {
      const mentorUserId = mentor.userId?._id || mentor.userId;
      return mentorUserId === currentUser.id || mentorUserId === currentUser._id;
    }) || null;

    if (!currentMentor) {
      renderEmptyState('mentor-info', 'No mentor profile yet. Add your expertise to start receiving requests.');
      createBtn.style.display = 'inline-block';
      createBtn.textContent = 'Become a Mentor';
      createBtn.onclick = () => renderMentorForm();

      // ✅ BUG 2 FIX: still call loadMentorRequests even when no profile exists,
      // it will show the "create profile" message gracefully
      await loadMentorRequests();
      return;
    }

    mentorInfo.innerHTML = `
      <div class="startup-card">
        <h3>Your Mentor Profile</h3>
        <p>${escapeHTML(currentUser.bio || 'Add a short bio in your profile endpoint later to make this more personal.')}</p>
        <div class="startup-info">
          <div class="startup-info-item">
            <div class="startup-info-label">Expertise</div>
            <div class="startup-info-value">${escapeHTML(currentMentor.expertise.join(', '))}</div>
          </div>
          <div class="startup-info-item">
            <div class="startup-info-label">Experience</div>
            <div class="startup-info-value">${currentMentor.yearsOfExperience} years</div>
          </div>
          <div class="startup-info-item">
            <div class="startup-info-label">Availability</div>
            <div class="startup-info-value">${escapeHTML(currentMentor.availability)}</div>
          </div>
          <div class="startup-info-item">
            <div class="startup-info-label">Rating</div>
            <div class="startup-info-value">${currentMentor.rating}/5</div>
          </div>
        </div>
        <div class="section-actions">
          <button class="btn btn-secondary" onclick="editMentor('${currentMentor._id}')">Edit Profile</button>
        </div>
      </div>
    `;

    createBtn.style.display = 'none';

    // ✅ BUG 2 FIX: loadMentorRequests moved INSIDE loadMentorDashboard so
    // currentMentor is always fully set before requests are loaded
    await loadMentorRequests();

  } catch (error) {
    renderEmptyState('mentor-info', `We could not load your mentor profile: ${error.message}`);
  }
}

function renderMentorForm(mentor = null) {
  const formContainer = document.getElementById('mentor-form-container');
  const isEditing = Boolean(mentor);

  formContainer.innerHTML = `
    <form class="mentor-form" id="mentor-form">
      <div id="mentor-form-status"></div>
      <div class="form-row">
        <div class="form-group">
          <label for="mentor-expertise">Expertise</label>
          <input type="text" id="mentor-expertise" name="expertise" value="${escapeHTML(mentor?.expertise?.join(', ') || '')}" placeholder="technology, business, finance" required>
        </div>
        <div class="form-group">
          <label for="mentor-experience">Years of Experience</label>
          <input type="number" id="mentor-experience" name="yearsOfExperience" min="1" value="${mentor?.yearsOfExperience || 1}" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="mentor-availability">Availability</label>
          <select id="mentor-availability" name="availability">
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="weekend-only">Weekend only</option>
          </select>
        </div>
      </div>
      <div class="section-actions">
        <button type="submit" class="btn btn-primary">${isEditing ? 'Save Changes' : 'Create Mentor Profile'}</button>
        <button type="button" class="btn btn-secondary" onclick="cancelMentorForm()">Cancel</button>
      </div>
    </form>
  `;

  document.getElementById('mentor-availability').value = mentor?.availability || 'part-time';
  document.getElementById('mentor-form').addEventListener('submit', event => submitMentorForm(event, mentor?._id));
}

async function submitMentorForm(e, mentorId = null) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  data.expertise = data.expertise
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
  data.yearsOfExperience = parseInt(data.yearsOfExperience, 10) || 1;

  showNotice('mentor-form-status', 'Saving mentor profile...', 'info');

  try {
    if (mentorId) {
      await api.updateMentor(mentorId, data);
      showNotice('mentor-form-container', 'Mentor profile updated successfully.', 'success');
    } else {
      await api.createMentor(data);
      showNotice('mentor-form-container', 'Mentor profile created successfully.', 'success');
    }

    document.getElementById('mentor-form-container').innerHTML = '';
    await loadMentorDashboard(); // ✅ This now also calls loadMentorRequests internally
  } catch (error) {
    showNotice('mentor-form-status', error.message, 'error');
  }
}

function cancelMentorForm() {
  document.getElementById('mentor-form-container').innerHTML = '';
}

async function editMentor(mentorId) {
  try {
    const response = await api.getMentorById(mentorId);
    renderMentorForm(response.mentor);
  } catch (error) {
    showNotice('mentor-form-container', `We could not open the mentor editor: ${error.message}`, 'error');
  }
}

async function loadMentorRequests() {
  const requestsList = document.getElementById('requests-list');

  // ✅ BUG 2 FIX: safe guard — currentMentor guaranteed set before this is called now
  if (!currentMentor) {
    renderEmptyState('requests-list', 'Create your mentor profile to receive requests.');
    return;
  }

  requestsList.innerHTML = '<div class="loading-state">Loading mentor requests...</div>';

  try {
    const response = await api.getMentorRequests(currentMentor._id);
    const requests = response.requests || [];

    if (!requests.length) {
      renderEmptyState('requests-list', 'No mentor requests yet.');
      return;
    }

    requestsList.innerHTML = requests
      .map(
        request => `
          <div class="request-item" id="request-${request._id}">
            <div class="request-header">
              <h3>${escapeHTML(request.startupId?.name || 'Unknown Startup')}</h3>
              <span class="request-status ${escapeHTML(request.status)}">${escapeHTML(request.status)}</span>
            </div>
            <p>${escapeHTML(request.message || 'No message provided.')}</p>
            <p class="muted">Founder: ${escapeHTML(request.startupFounderId?.name || 'Unknown')} (${escapeHTML(request.startupFounderId?.email || 'No email')})</p>
            ${
              request.status === 'pending'
                ? `
                  <div class="section-actions" id="request-actions-${request._id}">
                    <button class="btn btn-success" onclick="respondToRequest('${request._id}', 'accepted')">Accept</button>
                    <button class="btn btn-danger" onclick="respondToRequest('${request._id}', 'rejected')">Reject</button>
                  </div>
                `
                : ''
            }
          </div>
        `
      )
      .join('');
  } catch (error) {
    renderEmptyState('requests-list', `We could not load mentor requests: ${error.message}`);
  }
}

async function respondToRequest(requestId, status) {
  // ✅ BUG 4 FIX: use a dedicated status element instead of overwriting the whole
  // requests-list, so the success/error message is visible before the list reloads
  const statusEl = document.getElementById(`request-actions-${requestId}`);
  if (statusEl) {
    statusEl.innerHTML = `<div class="notice info">Updating to ${escapeHTML(status)}...</div>`;
  }

  try {
    await api.respondToRequest(requestId, status);

    // ✅ BUG 4 FIX: show success briefly, then reload the list after a short delay
    if (statusEl) {
      statusEl.innerHTML = `<div class="notice success">Request ${escapeHTML(status)} successfully.</div>`;
    }
    setTimeout(() => loadMentorRequests(), 1200);
  } catch (error) {
    if (statusEl) {
      statusEl.innerHTML = `<div class="notice error">${escapeHTML(error.message)}</div>`;
    } else {
      renderEmptyState('requests-list', error.message);
    }
  }
}

async function loadInvestorDashboard() {
  const portfolio = document.getElementById('investor-portfolio');
  portfolio.innerHTML = '<div class="loading-state">Loading your investor portfolio...</div>';

  try {
    const response = await api.getInvestorPortfolio();
    const items = response.portfolio || [];

    if (!items.length) {
      renderEmptyState('investor-portfolio', 'No saved startup interests yet. Use the Funding page to build your pipeline.');
      return;
    }

    portfolio.innerHTML = items
      .map(
        item => `
          <div class="startup-card">
            <h3>${escapeHTML(item.startupId?.name || 'Unknown Startup')}</h3>
            <p>${escapeHTML(item.startupId?.description || 'No description available.')}</p>
            <div class="startup-info">
              <div class="startup-info-item">
                <div class="startup-info-label">Founder</div>
                <div class="startup-info-value">${escapeHTML(item.startupId?.founderId?.name || 'Unknown')}</div>
              </div>
              <div class="startup-info-item">
                <div class="startup-info-label">Funding Needed</div>
                <div class="startup-info-value">${formatCurrency(item.startupId?.fundingNeeded)}</div>
              </div>
              <div class="startup-info-item">
                <div class="startup-info-label">Status</div>
                <div class="startup-info-value">${escapeHTML(item.status)}</div>
              </div>
            </div>
            <p class="muted">${escapeHTML(item.note || 'No investor note saved yet.')}</p>
          </div>
        `
      )
      .join('');
  } catch (error) {
    renderEmptyState('investor-portfolio', `We could not load your portfolio: ${error.message}`);
  }
}

// ✅ BUG 10 FIX: show founders which investors are interested in their startup
async function loadInvestorInterests() {
  const list = document.getElementById('investor-interests-list');
  if (!list) return;

  if (!currentStartup) {
    renderEmptyState('investor-interests-list', 'Create your startup profile to start receiving investor interest.');
    return;
  }

  list.innerHTML = '<div class="loading-state">Loading investor interest...</div>';

  try {
    const response = await api.request(`/startups/${currentStartup._id}/interests`);
    const interests = response.interests || [];

    if (!interests.length) {
      renderEmptyState('investor-interests-list', 'No investor interest yet. Make sure your startup profile is complete and visible on the funding board.');
      return;
    }

    list.innerHTML = interests.map(interest => `
      <div class="request-item">
        <div class="request-header">
          <h3>${escapeHTML(interest.investorId?.name || 'Unknown Investor')}</h3>
          <span class="request-status accepted">${escapeHTML(interest.status)}</span>
        </div>
        <p class="muted">Email: ${escapeHTML(interest.investorId?.email || 'No email')}</p>
        ${interest.note ? `<p>${escapeHTML(interest.note)}</p>` : '<p class="muted">No note left.</p>'}
        <p class="muted" style="font-size:0.85rem;">Expressed interest: ${new Date(interest.updatedAt).toLocaleDateString()}</p>
      </div>
    `).join('');
  } catch (error) {
    renderEmptyState('investor-interests-list', `Could not load investor interest: ${error.message}`);
  }
}

window.editStartup = editStartup;
window.editMentor = editMentor;
window.deleteStartupConfirm = deleteStartupConfirm;
window.deleteStartup = deleteStartup;
window.cancelStartupForm = cancelStartupForm;
window.cancelMentorForm = cancelMentorForm;
window.respondToRequest = respondToRequest;
window.loadInvestorInterests = loadInvestorInterests;
