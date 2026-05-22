// Authentication Logic

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  setupAuthForms();
  setupLogout();
});

function updateAuthUI() {
  const token = localStorage.getItem('token');
  const user = api.getCurrentUser();
  const loginLink = document.getElementById('login-link');
  const authLink = document.getElementById('auth-link');
  const logoutLink = document.getElementById('logout-link');
  const dashboardLink = document.getElementById('dashboard-link');

  if (token) {
    if (loginLink) loginLink.style.display = 'none';
    if (authLink) authLink.style.display = 'none';
    if (logoutLink) logoutLink.style.display = 'inline-flex';
    if (dashboardLink) {
      dashboardLink.textContent = user?.role === 'admin' ? 'Admin' : 'Dashboard';
      dashboardLink.setAttribute('href', user?.role === 'admin' ? 'admin.html' : 'dashboard.html');
    }
  } else {
    if (loginLink) loginLink.style.display = 'inline-flex';
    if (authLink) authLink.style.display = 'inline-flex';
    if (logoutLink) logoutLink.style.display = 'none';
    if (dashboardLink) {
      dashboardLink.textContent = 'Dashboard';
      dashboardLink.setAttribute('href', 'dashboard.html');
    }
  }
}

function setupAuthForms() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (registerForm) registerForm.addEventListener('submit', handleRegister);
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('error-message');
  const deviceToken = localStorage.getItem('deviceToken');

  try {
    const response = await api.login(email, password, deviceToken);

    if (response.requiresOtp) {
      // Redirect to OTP page
      window.location.href = `verify-otp.html?email=${encodeURIComponent(email)}&purpose=${response.purpose}`;
      return;
    }

    api.setToken(response.token);
    api.setCurrentUser(response.user);
    window.location.href = response.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
  } catch (error) {
    if (errorDiv) {
      errorDiv.textContent = error.message || 'Login failed. Please try again.';
      errorDiv.classList.add('show');
    }
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  const errorDiv = document.getElementById('error-message');

  try {
    const response = await api.register({ name, email, password, role });

    if (response.requiresOtp) {
      // Redirect to OTP verification page
      window.location.href = `verify-otp.html?email=${encodeURIComponent(email)}&purpose=verify`;
      return;
    }

    api.setToken(response.token);
    api.setCurrentUser(response.user);
    window.location.href = response.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
  } catch (error) {
    if (errorDiv) {
      errorDiv.textContent = error.message || 'Registration failed. Please try again.';
      errorDiv.classList.add('show');
    }
  }
}

function setupLogout() {
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', e => {
      e.preventDefault();
      api.clearToken();
      window.location.href = 'index.html';
    });
  }
}

function isAuthenticated() {
  return !!api.getToken();
}

function redirectIfNotAuthenticated() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
}

function checkRole(requiredRole) {
  const user = getUserFromToken();
  return user && user.role === requiredRole;
}

function getUserFromToken() {
  const storedUser = api.getCurrentUser();
  if (storedUser?.id && storedUser?.role) return storedUser;

  const token = api.getToken();
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    return null;
  }
}

async function fetchUserProfile() {
  try {
    if (!isAuthenticated()) return null;
    const response = await api.getMe();
    api.setCurrentUser(response.user);
    return response.user;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
}
