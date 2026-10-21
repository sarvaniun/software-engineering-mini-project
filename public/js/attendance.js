
(function initAttendance() {
  const form = document.getElementById('attendance-form');
  if (!form) return;

  const status = document.getElementById('attendance-status');
  const subjectSelect = document.getElementById('attendance-subject');
  const dateInput = document.getElementById('attendance-date');
  const studentsContainer = document.getElementById('attendance-students');
  const saveButton = document.getElementById('save-attendance');

  let students = [];

  function showStatus(message, isError = false) {
    status.textContent = message;
    status.className = isError ? 'error' : 'placeholder';
  }

  function setToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    dateInput.value = `${year}-${month}-${day}`;
  }

  function renderStudents() {
    studentsContainer.replaceChildren();

    if (students.length === 0) {
      studentsContainer.textContent =
        'No active students were found for this subject.';
      return;
    }

    const heading = document.createElement('h3');
    heading.textContent = 'Select attendance for every student';
    studentsContainer.appendChild(heading);

    const roster = document.createElement('div');
    roster.className = 'attendance-roster';

    students.forEach((student) => {
      const row = document.createElement('div');
      row.className = 'attendance-row';

      const details = document.createElement('div');
      details.className = 'attendance-student';

      const name = document.createElement('strong');
      name.textContent = student.name;

      const roll = document.createElement('small');
      roll.textContent = student.roll_no;

      details.append(name, roll);

      const choices = document.createElement('div');
      choices.className = 'attendance-choices';

      [
        { label: 'Present', value: 'true' },
        { label: 'Absent', value: 'false' }
      ].forEach((choice) => {
        const label = document.createElement('label');
        label.className = 'attendance-choice';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `attendance-${student.id}`;
        radio.value = choice.value;
        radio.required = true;

        const text = document.createElement('span');
        text.textContent = choice.label;

        label.append(radio, text);
        choices.appendChild(label);
      });

      row.append(details, choices);
      roster.appendChild(row);
    });

    studentsContainer.appendChild(roster);
  }

  async function loadSubjects() {
    showStatus('Loading your assigned subjects...');

    try {
      const result = await api('/attendance/subjects');
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
      showStatus('Select a subject to load its student list.');
    } catch (error) {
      form.hidden = true;
      showStatus(`Could not load subjects: ${error.message}`, true);
    }
  }

  async function loadStudents() {
    students = [];
    studentsContainer.replaceChildren();

    const classId = subjectSelect.value;
    if (!classId) {
      showStatus('Select a subject to load its student list.');
      return;
    }

    showStatus('Loading students...');

    try {
      const result = await api(
        `/attendance/students?classId=${encodeURIComponent(classId)}`
      );

      students = result.students || [];
      renderStudents();

      showStatus(
        students.length
          ? `${students.length} students loaded. Select Present or Absent for each student.`
          : 'No active students were found for this subject.'
      );
    } catch (error) {
      showStatus(`Could not load students: ${error.message}`, true);
    }
  }

  subjectSelect.addEventListener('change', loadStudents);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!subjectSelect.value || !dateInput.value || students.length === 0) {
      showStatus('Select a subject, date and student list first.', true);
      return;
    }

    const records = [];

    for (const student of students) {
      const selected = studentsContainer.querySelector(
        `input[name="attendance-${student.id}"]:checked`
      );

      if (!selected) {
        showStatus(
          `Please select Present or Absent for ${student.name}.`,
          true
        );
        return;
      }

      records.push({
        studentId: Number(student.id),
        present: selected.value === 'true'
      });
    }

    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    try {
      const result = await api('/attendance', {
        method: 'POST',
        body: JSON.stringify({
          classId: Number(subjectSelect.value),
          date: dateInput.value,
          records
        })
      });

      showStatus(
        `Attendance saved for ${result.recordsProcessed} students. ` +
        `Present for this session: ${result.updatedPercentage}%.`
      );
    } catch (error) {
      showStatus(`Could not save attendance: ${error.message}`, true);
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = 'Save Attendance';
    }
  });

  setToday();
  loadSubjects();
})();
