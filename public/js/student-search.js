// SRSF-014: faculty student search. Uses the same GET /api/students as the admin list.

(function initStudentSearch() {
  const results = document.getElementById('search-results');
  const msg = document.getElementById('search-msg');
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  // shortcut: no request cancel, a slow older response can overwrite newer results; add AbortController if seen
  async function search() {
    const qs = new URLSearchParams(Object.entries({
      q: document.getElementById('student-q').value.trim(),
      branch: document.getElementById('student-branch').value,
      semester: document.getElementById('student-semester').value,
    }).filter(([, v]) => v));

    try {
      const res = await api('/students?' + qs);
      results.innerHTML = res.students.map((s) =>
        `<tr><td>${esc(s.roll_no)}</td><td>${esc(s.name)}</td><td>${esc(s.branch)}</td><td>${esc(s.semester)}</td></tr>`
      ).join('');
      msg.textContent = `${res.students.length} found`;
    } catch (e) {
      msg.textContent = e.message;
    }
  }

  ['student-q', 'student-branch', 'student-semester'].forEach((id) =>
    document.getElementById(id).addEventListener('input', search));
  search();
})();
