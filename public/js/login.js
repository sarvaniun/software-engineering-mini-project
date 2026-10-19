// Login page (SRSF-001-UI, SRSF-002)

// Already logged in? Go straight to your dashboard.
if (Auth.token() && HOME_BY_ROLE[Auth.role()]) {
  window.location.href = HOME_BY_ROLE[Auth.role()];
}

const form = document.getElementById('login-form');
const errorBox = document.getElementById('error');
const pw = document.getElementById('password');
const toggle = document.getElementById('toggle-password');

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

if (new URLSearchParams(window.location.search).has('expired')) {
  showError('Your session expired. Please log in again.');
}

// SRSF-002: masked by default; the button lets the user check what they typed
toggle.addEventListener('click', () => {
  const isHidden = pw.type === 'password';
  pw.type = isHidden ? 'text' : 'password';
  toggle.textContent = isHidden ? 'Hide' : 'Show';
  toggle.setAttribute('aria-pressed', String(isHidden));
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.hidden = true;

  const username = form.username.value.trim();
  if (!username || !pw.value) {
    showError('Please enter your username and password.');
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const data = await api('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password: pw.value }),
    });
    Auth.save(data);
    window.location.href = HOME_BY_ROLE[data.role];
  } catch (err) {
    showError(err.message);
  } finally {
    button.disabled = false;
  }
});
