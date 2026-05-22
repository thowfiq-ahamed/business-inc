// API Configuration
const API_BASE_URL = window.API_BASE_URL
  || (window.location.protocol === 'file:' ? 'http://localhost:5000/api' : `${window.location.origin}/api`);

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function safeExternalURL(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch (error) {
    return '';
  }
}

class APIClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
    this.user = this.getStoredUser();
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  setCurrentUser(user) {
    this.user = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  getStoredUser() {
    const user = localStorage.getItem('currentUser');
    if (!user) return null;
    try {
      return JSON.parse(user);
    } catch (error) {
      localStorage.removeItem('currentUser');
      return null;
    }
  }

  getCurrentUser() {
    return this.getStoredUser();
  }

  getToken() {
    return localStorage.getItem('token');
  }

  clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.token = null;
    this.user = null;
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: { ...this.getHeaders(), ...options.headers },
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : null;

      if (!response.ok) {
        throw new Error(data?.message || `HTTP Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Generic POST helper (used by verify-otp page)
  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email, password, deviceToken) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, deviceToken }),
    });
  }

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token, password) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(userData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getAllStartups() {
    return this.request('/startups');
  }

  async getStartupById(id) {
    return this.request(`/startups/${id}`);
  }

  async createStartup(startupData) {
    return this.request('/startups', {
      method: 'POST',
      body: JSON.stringify(startupData),
    });
  }

  async updateStartup(id, startupData) {
    return this.request(`/startups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(startupData),
    });
  }

  async deleteStartup(id) {
    return this.request(`/startups/${id}`, { method: 'DELETE' });
  }

  async getAllMentors() {
    return this.request('/mentors');
  }

  async getMentorById(id) {
    return this.request(`/mentors/${id}`);
  }

  async createMentor(mentorData) {
    return this.request('/mentors', {
      method: 'POST',
      body: JSON.stringify(mentorData),
    });
  }

  async updateMentor(id, mentorData) {
    return this.request(`/mentors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mentorData),
    });
  }

  async requestMentoring(mentorId, startupId, message) {
    return this.request(`/mentors/${mentorId}/request`, {
      method: 'POST',
      body: JSON.stringify({ startupId, message }),
    });
  }

  async getMentorRequests(mentorId) {
    return this.request(`/mentors/${mentorId}/requests`);
  }

  async respondToRequest(requestId, status) {
    return this.request(`/mentors/request/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async browseStartups(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/investors/browse?${params}`);
  }

  async expressInterest(startupId, note = '') {
    return this.request('/investors/interest', {
      method: 'POST',
      body: JSON.stringify({ startupId, note }),
    });
  }

  async getInvestorPortfolio() {
    return this.request('/investors/portfolio');
  }

  async getAllResources(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/resources?${params}`);
  }

  async getResourceById(id) {
    return this.request(`/resources/${id}`);
  }

  async createResource(resourceData) {
    return this.request('/resources', {
      method: 'POST',
      body: JSON.stringify(resourceData),
    });
  }

  async updateResource(id, resourceData) {
    return this.request(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(resourceData),
    });
  }

  async deleteResource(id) {
    return this.request(`/resources/${id}`, { method: 'DELETE' });
  }

  async markResourceAsUseful(id) {
    return this.request(`/resources/${id}/useful`, { method: 'POST' });
  }

  async getAdminOverview() {
    return this.request('/admin/overview');
  }

  async submitContactMessage(contactData) {
    return this.request('/contact', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async getContactMessages() {
    return this.request('/contact');
  }

  async setContactMessageStatus(id, status) {
    return this.request(`/contact/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async setUserVerification(id, verified) {
    return this.request(`/admin/users/${id}/verification`, {
      method: 'PATCH',
      body: JSON.stringify({ verified }),
    });
  }

  async setStartupVerification(id, verified) {
    return this.request(`/admin/startups/${id}/verification`, {
      method: 'PATCH',
      body: JSON.stringify({ verified }),
    });
  }

  async setMentorVerification(id, verified) {
    return this.request(`/admin/mentors/${id}/verification`, {
      method: 'PATCH',
      body: JSON.stringify({ verified }),
    });
  }
}

const api = new APIClient();
