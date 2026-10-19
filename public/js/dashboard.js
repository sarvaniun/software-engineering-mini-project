// Runs on every dashboard. Each page says which role it is for: <body data-role="admin">
// This is the UI side; the SERVER also checks roles on every API call (SRSSR-003).
(function guard() {
  const pageRole = document.body.dataset.role;

  if (!Auth.token()) {
    window.location.href = '/';
    return;
  }
  if (Auth.role() !== pageRole) {
    window.location.href = HOME_BY_ROLE[Auth.role()] || '/';
    return;
  }

  document.getElementById('user-name').textContent = Auth.name();
  document.getElementById('logout').addEventListener('click', () => {
    Auth.clear();
    window.location.href = '/';
  });

  // Confirms the token is still valid on the server (if expired, api() sends the user to login)
  api('/whoami').catch(() => {});
})();
