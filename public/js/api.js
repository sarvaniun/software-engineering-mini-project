// Shared by every page: stores the login token and calls the API with it attached.
// Teammates: use api('/students') etc. for every request. It adds the token for you.

const Auth = {
  save(data) {
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('role', data.role);
    sessionStorage.setItem('name', data.name);
  },
  token() { return sessionStorage.getItem('token'); },
  role() { return sessionStorage.getItem('role'); },
  name() { return sessionStorage.getItem('name'); },
  clear() { sessionStorage.clear(); },
};

const HOME_BY_ROLE = { student: '/student.html', faculty: '/faculty.html', admin: '/admin.html' };

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (Auth.token()) headers.Authorization = `Bearer ${Auth.token()}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));

  // Token missing/expired on a protected call -> back to login
  if (res.status === 401 && path !== '/login') {
    Auth.clear();
    window.location.href = '/?expired=1';
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error(body.message || 'Something went wrong');
  return body;
}
