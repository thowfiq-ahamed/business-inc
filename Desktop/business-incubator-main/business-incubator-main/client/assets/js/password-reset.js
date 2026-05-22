document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('forgot-password-form')?.addEventListener('submit', handleForgotPassword);
  document.getElementById('reset-password-form')?.addEventListener('submit', handleResetPassword);
  validateResetToken();
});

function showPasswordResetStatus(message, type = 'info') {
  const status = document.getElementById('password-reset-status');
  if (!status) return;

  status.innerHTML = message ? `<div class="notice ${type}">${message}</div>` : '';
}

function setSubmitting(form, isSubmitting, label) {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;

  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent;
  }

  button.disabled = isSubmitting;
  button.textContent = isSubmitting ? label : button.dataset.originalText;
}

async function handleForgotPassword(event) {
  event.preventDefault();

  const form = event.target;
  const email = document.getElementById('email').value.trim();

  showPasswordResetStatus('Preparing reset link...', 'info');
  setSubmitting(form, true, 'Sending...');

  try {
    const response = await api.forgotPassword(email);
    const devLink = response.resetUrl
      ? ` <a href="${escapeHTML(response.resetUrl)}">Open reset link</a>`
      : '';
    showPasswordResetStatus(`${escapeHTML(response.message)}${devLink}`, 'success');
    form.reset();
  } catch (error) {
    showPasswordResetStatus(escapeHTML(error.message || 'Password reset request failed.'), 'error');
  } finally {
    setSubmitting(form, false);
  }
}

function validateResetToken() {
  const form = document.getElementById('reset-password-form');
  if (!form) return;

  const token = new URLSearchParams(window.location.search).get('token');
  if (!token) {
    form.querySelectorAll('input, button').forEach(element => {
      element.disabled = true;
    });
    showPasswordResetStatus('This reset link is missing a token. Request a new password reset link.', 'error');
  }
}

async function handleResetPassword(event) {
  event.preventDefault();

  const form = event.target;
  const token = new URLSearchParams(window.location.search).get('token');
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (password !== confirmPassword) {
    showPasswordResetStatus('Passwords do not match.', 'error');
    return;
  }

  showPasswordResetStatus('Saving your new password...', 'info');
  setSubmitting(form, true, 'Saving...');

  try {
    const response = await api.resetPassword(token, password);
    api.setToken(response.token);
    api.setCurrentUser(response.user);
    showPasswordResetStatus('Password saved. Redirecting to your workspace...', 'success');
    window.location.href = response.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
  } catch (error) {
    showPasswordResetStatus(escapeHTML(error.message || 'Password reset failed.'), 'error');
  } finally {
    setSubmitting(form, false);
  }
}
