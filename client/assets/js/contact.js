document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('contact-form')?.addEventListener('submit', handleContactSubmit);
});

function showContactStatus(message, type = 'info') {
  const status = document.getElementById('contact-form-status');
  if (!status) return;

  status.innerHTML = message ? `<div class="notice ${type}">${escapeHTML(message)}</div>` : '';
}

async function handleContactSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');
  const originalText = submitButton?.textContent || 'Send message';
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  data.name = data.name?.trim();
  data.email = data.email?.trim();
  data.subject = data.subject?.trim();
  data.message = data.message?.trim();

  if (!data.name || !data.email || !data.subject || !data.message) {
    showContactStatus('Please complete all required fields.', 'error');
    return;
  }

  showContactStatus('Sending your message...', 'info');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
  }

  try {
    await api.submitContactMessage(data);
    form.reset();
    showContactStatus('Thanks. Your message has been sent to the incubator team.', 'success');
  } catch (error) {
    showContactStatus(error.message || 'We could not send your message right now.', 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }
}
