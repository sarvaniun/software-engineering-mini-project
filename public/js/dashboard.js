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

// SRSF-004: auto-logout after SESSION_TIMEOUT_MINUTES with no mouse/keyboard/touch activity
(function idleLogout() {
  if (!Auth.token()) return;
  let timer;
  const reset = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      Auth.clear();
      window.location.href = '/?expired=1';
    }, SESSION_TIMEOUT_MINUTES * 60 * 1000);
  };
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach((evt) =>
    document.addEventListener(evt, reset, { passive: true })
  );
  reset();
})();
