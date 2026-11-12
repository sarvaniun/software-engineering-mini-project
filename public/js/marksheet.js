
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

// Keep this grading logic consistent with src/utils/gpa.js.
function getGradePoint(marks, maxMarks) {
  if (marks === null || marks === undefined || marks === '') return null;

  const obtained = Number(marks);
  const maximum = Number(maxMarks);

  if (!Number.isFinite(obtained) ||
      !Number.isFinite(maximum) ||
      maximum <= 0) {
    return 0;
  }

  const percentage = (obtained / maximum) * 100;

  if (percentage >= 90) return 10;
  if (percentage >= 80) return 9;
  if (percentage >= 70) return 8;
  if (percentage >= 60) return 7;
  if (percentage >= 50) return 6;
  if (percentage >= 40) return 5;
  return 0;
}

async function loadMarkSheet() {
  const details = document.getElementById('student-details');
  const tbody = document.querySelector('#marks-table tbody');
  const gpaElement = document.getElementById('gpa');

  try {
    const profileResponse = await api('/me/profile');
    const student = profileResponse.profile ||
      profileResponse.student ||
      profileResponse.data ||
      {};

    details.innerHTML = `
      <p><strong>Name:</strong> ${escapeHtml(student.name)}</p>
      <p><strong>Roll Number:</strong> ${escapeHtml(student.roll_no)}</p>
      <p><strong>Branch:</strong> ${escapeHtml(student.branch)}</p>
      <p><strong>Semester:</strong> ${escapeHtml(student.semester)}</p>
      <p><strong>Email:</strong> ${escapeHtml(student.email)}</p>
    `;
  } catch (error) {
    details.textContent = 'Unable to load student details: ' + error.message;
  }

  try {
    const marksResponse = await api('/me/marks');
    const marks = marksResponse.marks || marksResponse.data || [];

    if (marks.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6">No marks available.</td></tr>';
    } else {
      tbody.innerHTML = marks.map((subject) => {
        const gradePoint = getGradePoint(
          subject.marks,
          subject.max_marks
        );

        return `
          <tr>
            <td>${escapeHtml(subject.code)}</td>
            <td>${escapeHtml(subject.name)}</td>
            <td>${subject.marks === null || subject.marks === undefined
              ? '—'
              : escapeHtml(subject.marks)}</td>
            <td>${escapeHtml(subject.max_marks)}</td>
            <td>${escapeHtml(subject.credits)}</td>
            <td>${gradePoint === null ? '—' : gradePoint.toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    }

    gpaElement.textContent =
      marksResponse.gpa === null || marksResponse.gpa === undefined
        ? 'Not available'
        : Number(marksResponse.gpa).toFixed(2);

  } catch (error) {
    tbody.innerHTML =
      `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
    gpaElement.textContent = 'Unable to calculate';
  }
}

loadMarkSheet();
