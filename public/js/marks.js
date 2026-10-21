
(function initMarks() {
  const form = document.getElementById('marks-form');
  if (!form) return;

  const status = document.getElementById('marks-status');
  const subjectSelect = document.getElementById('marks-subject');
  const maxInfo = document.getElementById('marks-max-info');
  const studentsContainer = document.getElementById('marks-students');
  const saveButton = document.getElementById('save-marks');

  let students = [];
  let maxMarks = 0;

  function showStatus(message, isError = false) {
    status.textContent = message;
    status.className = isError ? 'error' : 'placeholder';
  }

  function renderStudents() {
    studentsContainer.replaceChildren();

    if (students.length === 0) {
      studentsContainer.textContent =
        'No active students were found for this subject.';
      return;
    }

    const heading = document.createElement('h3');
    heading.textContent = 'Enter marks for every student';
    studentsContainer.appendChild(heading);

    const roster = document.createElement('div');
    roster.className = 'marks-roster';

    students.forEach((student) => {
      const row = document.createElement('div');
      row.className = 'marks-row';

      const details = document.createElement('div');
      details.className = 'marks-student';

      const name = document.createElement('strong');
      name.textContent = student.name;

      const roll = document.createElement('small');
      roll.textContent = student.roll_no;

      details.append(name, roll);

      const field = document.createElement('label');
      field.className = 'marks-field';
      field.textContent = `Marks (out of ${maxMarks})`;

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = String(maxMarks);
      input.step = '0.01';
      input.required = true;
      input.id = `marks-input-${student.id}`;
      input.setAttribute('aria-label', `Marks for ${student.name}`);

      if (student.marks !== null && student.marks !== undefined) {
        input.value = String(Number(student.marks));
      }

      field.appendChild(input);
      row.append(details, field);
      roster.appendChild(row);
    });

    studentsContainer.appendChild(roster);
  }

  async function loadSubjects() {
    showStatus('Loading your assigned subjects...');

    try {
      const result = await api('/marks/subjects');
      const subjects = result.subjects || [];

      subjectSelect.replaceChildren();

      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Select a subject';
      subjectSelect.appendChild(placeholder);

      subjects.forEach((subject) => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent =
          `${subject.code} - ${subject.name} (${subject.branch}, Semester ${subject.semester})`;
        subjectSelect.appendChild(option);
      });

      if (subjects.length === 0) {
        form.hidden = true;
        showStatus('No subjects are assigned to your faculty account.');
        return;
      }

      form.hidden = false;
      showStatus('Select a subject to load its students and marks.');
    } catch (error) {
      form.hidden = true;
      showStatus(`Could not load subjects: ${error.message}`, true);
    }
  }

  async function loadStudents() {
    students = [];
    maxMarks = 0;
    studentsContainer.replaceChildren();
    maxInfo.textContent = '';

    const subjectId = subjectSelect.value;

    if (!subjectId) {
      showStatus('Select a subject to load its students and marks.');
      return;
    }

    showStatus('Loading students and existing marks...');

    try {
      const result = await api(
        `/marks/students?subjectId=${encodeURIComponent(subjectId)}`
      );

      students = result.students || [];
      maxMarks = Number(result.maxMarks);

      if (!Number.isFinite(maxMarks) || maxMarks < 0) {
        throw new Error('The subject has an invalid maximum marks value.');
      }

      maxInfo.textContent = `Maximum marks for this subject: ${maxMarks}`;
      renderStudents();

      showStatus(
        students.length
          ? `${students.length} students loaded. Enter or update their marks.`
          : 'No active students were found for this subject.'
      );
    } catch (error) {
      showStatus(`Could not load students: ${error.message}`, true);
    }
  }

  subjectSelect.addEventListener('change', loadStudents);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const subjectId = Number(subjectSelect.value);

    if (!subjectId || students.length === 0) {
      showStatus('Select a subject with students before saving marks.', true);
      return;
    }

    const records = [];

    for (const student of students) {
      const input = document.getElementById(`marks-input-${student.id}`);
      const rawValue = input ? input.value.trim() : '';

      if (rawValue === '') {
        showStatus(`Please enter marks for ${student.name}.`, true);
        if (input) input.focus();
        return;
      }

      const marks = Number(rawValue);

      if (!Number.isFinite(marks) || marks < 0 || marks > maxMarks) {
        showStatus(
          `Marks for ${student.name} must be between 0 and ${maxMarks}.`,
          true
        );
        input.focus();
        return;
      }

      records.push({
        studentId: Number(student.id),
        marks
      });
    }

    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    try {
      const result = await api('/marks', {
        method: 'POST',
        body: JSON.stringify({ subjectId, records })
      });

      showStatus(
        `Marks saved successfully for ${result.recordsProcessed} students.`
      );

      // Reload the records so the form shows the values stored by the server.
      await loadStudents();
    } catch (error) {
      showStatus(`Could not save marks: ${error.message}`, true);
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = 'Save Marks';
    }
  });

  loadSubjects();
})();
