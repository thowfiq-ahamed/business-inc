// Mentors Page Logic

let mentors = [];
let selectedMentorId = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupModal();
  setupSearch();
  await loadMentors();
});

function showStatus(message, type = 'info') {
  const status = document.getElementById('mentors-status');
  if (!status) return;

  status.innerHTML = message ? `<div class="notice ${type}">${escapeHTML(message)}</div>` : '';
}

function getMentorInitials(name) {
  return (name || 'Mentor')
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function isFeaturedMentor(mentor) {
  return (mentor.rating || 0) >= 4.8 || (mentor.yearsOfExperience || 0) >= 10;
}

function renderMentorCards(items) {
  const mentorsGrid = document.getElementById('mentors-grid');

  if (!items.length) {
    mentorsGrid.innerHTML = '<div class="empty-state">No mentors match your current filters.</div>';
    return;
  }

  mentorsGrid.innerHTML = items
    .map(mentor => {
      const featured = isFeaturedMentor(mentor);

      return `
        <article class="mentor-card ${featured ? 'featured' : ''}" onclick="showMentorDetail('${mentor._id}')">
          <div class="mentor-header">
            <div class="mentor-header-top">
              <span class="mentor-chip">${featured ? 'Featured mentor' : 'Mentor profile'}</span>
              <span class="mentor-rating-pill">${escapeHTML(mentor.rating)}/5</span>
            </div>
            <div class="mentor-avatar">${getMentorInitials(mentor.userId?.name)}</div>
            <div class="mentor-name">${escapeHTML(mentor.userId?.name || 'Unknown')}</div>
            <div class="mentor-role">${escapeHTML(mentor.availability)}</div>
          </div>
          <div class="mentor-body">
            <div class="expertise-list">
              ${mentor.expertise.map(exp => `<span class="expertise-tag">${escapeHTML(exp)}</span>`).join('')}
            </div>
            <div class="mentor-info">
              <div class="mentor-info-item">
                <span class="mentor-info-label">Experience</span>
                <span class="mentor-info-value">${mentor.yearsOfExperience} years</span>
              </div>
              <div class="mentor-info-item">
                <span class="mentor-info-label">Reviews</span>
                <span class="mentor-info-value">${mentor.reviews?.length || 0}</span>
              </div>
            </div>
            <p class="mentor-bio">${escapeHTML(mentor.userId?.bio || 'No bio added yet.')}</p>
          </div>
        </article>
      `;
    })
    .join('');
}

async function loadMentors() {
  const mentorsGrid = document.getElementById('mentors-grid');
  mentorsGrid.innerHTML = '<div class="loading-state">Loading mentors...</div>';
  showStatus('');

  try {
    const response = await api.getAllMentors();
    mentors = (response.mentors || []).sort((a, b) => {
      return Number(isFeaturedMentor(b)) - Number(isFeaturedMentor(a)) || (b.rating || 0) - (a.rating || 0);
    });

    filterMentors();

    if (!mentors.length) {
      showStatus('No mentors are available yet. Create a mentor account or seed data to populate this page.', 'info');
    }
  } catch (error) {
    mentorsGrid.innerHTML = '<div class="empty-state">We could not load mentors right now.</div>';
    showStatus(error.message, 'error');
  }
}

function setupSearch() {
  ['search-mentor', 'filter-expertise', 'filter-availability', 'filter-experience', 'filter-rating', 'filter-featured']
    .forEach(id => {
      const element = document.getElementById(id);
      const eventName = element?.tagName === 'INPUT' ? 'input' : 'change';
      element?.addEventListener(eventName, filterMentors);
    });
}

function filterMentors() {
  const searchTerm = (document.getElementById('search-mentor')?.value || '').toLowerCase();
  const expertise = (document.getElementById('filter-expertise')?.value || '').toLowerCase();
  const availability = (document.getElementById('filter-availability')?.value || '').toLowerCase();
  const experience = parseInt(document.getElementById('filter-experience')?.value || '0', 10);
  const rating = parseInt(document.getElementById('filter-rating')?.value || '0', 10);
  const featured = document.getElementById('filter-featured')?.value || '';

  const filtered = mentors.filter(mentor => {
    const matchesName = !searchTerm || mentor.userId?.name?.toLowerCase().includes(searchTerm);
    const matchesExpertise = !expertise || mentor.expertise.some(item => item.toLowerCase() === expertise);
    const matchesAvailability = !availability || mentor.availability.toLowerCase() === availability;
    const matchesExperience = !experience || (mentor.yearsOfExperience || 0) >= experience;
    const matchesRating = !rating || Math.floor(mentor.rating || 0) >= rating;
    const matchesFeatured = featured !== 'featured' || isFeaturedMentor(mentor);

    return matchesName && matchesExpertise && matchesAvailability && matchesExperience && matchesRating && matchesFeatured;
  });

  renderMentorCards(filtered);
}

async function showMentorDetail(mentorId) {
  selectedMentorId = mentorId;
  const detailDiv = document.getElementById('mentor-detail');
  const requestStatus = document.getElementById('mentor-request-status');
  const requestMessage = document.getElementById('mentor-request-message');
  const requestButton = document.getElementById('request-mentor-btn');

  requestStatus.innerHTML = '';
  requestMessage.value = '';
  detailDiv.innerHTML = '<div class="loading-state">Loading mentor details...</div>';

  try {
    const response = await api.getMentorById(mentorId);
    const mentor = response.mentor;

    detailDiv.innerHTML = `
      <div class="mentor-detail">
        <div class="mentor-detail-intro">
          <span class="mentor-chip">${isFeaturedMentor(mentor) ? 'Featured mentor' : 'Available mentor'}</span>
          <h2>${escapeHTML(mentor.userId?.name || 'Unknown Mentor')}</h2>
          <p>${escapeHTML(mentor.userId?.bio || 'No bio provided yet.')}</p>
        </div>
        <div class="mentor-detail-panels">
          <div class="detail-card">
            <h3>Expertise</h3>
            <div class="expertise-list">
              ${mentor.expertise.map(exp => `<span class="expertise-tag">${escapeHTML(exp)}</span>`).join('')}
            </div>
          </div>
          <div class="detail-card">
            <h3>Details</h3>
            <div class="mentor-info">
              <div class="mentor-info-item"><span class="mentor-info-label">Experience</span><span class="mentor-info-value">${mentor.yearsOfExperience} years</span></div>
              <div class="mentor-info-item"><span class="mentor-info-label">Availability</span><span class="mentor-info-value">${escapeHTML(mentor.availability)}</span></div>
              <div class="mentor-info-item"><span class="mentor-info-label">Rating</span><span class="mentor-info-value">${mentor.rating}/5</span></div>
            </div>
          </div>
        </div>
        ${
          mentor.reviews.length
            ? `
              <div class="mentor-detail-section">
                <h3>Founder reviews</h3>
                <div class="reviews">
                  ${mentor.reviews
                    .map(
                      review => `
                        <div class="review">
                          <div class="review-header">
                            <span class="review-author">${escapeHTML(review.reviewer?.name || 'Anonymous')}</span>
                            <span class="review-rating">${escapeHTML(review.rating)}/5</span>
                          </div>
                          <p class="review-text">${escapeHTML(review.comment || 'No written feedback.')}</p>
                        </div>
                      `
                    )
                    .join('')}
                </div>
              </div>
            `
            : ''
        }
      </div>
    `;

    const user = getUserFromToken();
    const canRequest = user?.role === 'startup';
    requestButton.style.display = canRequest ? 'inline-flex' : 'none';

    if (!user) {
      requestStatus.innerHTML = '<div class="notice info">Log in as a startup founder to request mentoring.</div>';
    } else if (!canRequest) {
      requestStatus.innerHTML = '<div class="notice info">Only startup founders can send mentor requests.</div>';
    }

    document.getElementById('mentor-modal').classList.add('show');
  } catch (error) {
    detailDiv.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
  }
}

function setupModal() {
  const modal = document.getElementById('mentor-modal');
  const closeBtn = modal?.querySelector('.close');
  const requestBtn = document.getElementById('request-mentor-btn');

  closeBtn?.addEventListener('click', closeMentorModal);
  requestBtn?.addEventListener('click', requestMentoring);

  window.addEventListener('click', event => {
    if (event.target === modal) {
      closeMentorModal();
    }
  });
}

function closeMentorModal() {
  document.getElementById('mentor-modal')?.classList.remove('show');
}

async function requestMentoring() {
  const status = document.getElementById('mentor-request-status');
  const message = document.getElementById('mentor-request-message').value.trim();

  if (!isAuthenticated()) {
    status.innerHTML = '<div class="notice error">Please log in first.</div>';
    return;
  }

  const user = getUserFromToken();
  if (user.role !== 'startup') {
    status.innerHTML = '<div class="notice error">Only startup founders can request mentoring.</div>';
    return;
  }

  if (!message) {
    status.innerHTML = '<div class="notice error">Please add a short message before sending the request.</div>';
    return;
  }

  status.innerHTML = '<div class="notice info">Sending request...</div>';

  try {
    const response = await api.getAllStartups();
    const userStartup = response.startups.find(startup => {
      const founderId = startup.founderId?._id || startup.founderId;
      // ✅ BUG 8 FIX: check both user.id and user._id since JWT payload
      // field name may differ depending on how the token was signed
      return founderId === user.id || founderId === user._id;
    });

    if (!userStartup) {
      status.innerHTML = '<div class="notice error">Create your startup profile in the dashboard before requesting mentoring.</div>';
      return;
    }

    await api.requestMentoring(selectedMentorId, userStartup._id, message);
    status.innerHTML = '<div class="notice success">Mentoring request sent successfully.</div>';
    document.getElementById('mentor-request-message').value = '';
  } catch (error) {
    status.innerHTML = `<div class="notice error">${escapeHTML(error.message)}</div>`;
  }
}

window.showMentorDetail = showMentorDetail;
