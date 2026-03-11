/* ============================================================
   calendar.js — Monthly calendar view
   ============================================================ */

const Calendar = (() => {
  let currentYear  = new Date().getFullYear();
  let currentMonth = new Date().getMonth(); // 0-based
  let selectedDate = null;

  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function init() {
    document.getElementById('cal-prev').addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      render();
    });
    document.getElementById('cal-next').addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      render();
    });
    document.getElementById('cal-today').addEventListener('click', () => {
      currentYear  = new Date().getFullYear();
      currentMonth = new Date().getMonth();
      selectedDate = toDateStr(new Date());
      render();
      showDayNotes(selectedDate);
    });
  }

  function render() {
    document.getElementById('cal-month-year').textContent =
      `${MONTHS[currentMonth]} ${currentYear}`;

    const grid = document.getElementById('calendar-grid');
    const notes = Notes.getAll();
    const today = toDateStr(new Date());

    // Build date-to-notes map
    const dateMap = {};
    notes.forEach(note => {
      const dates = new Set();
      if (note.dueDate) dates.add(note.dueDate);
      if (note.reminder) dates.add(note.reminder.split('T')[0]);
      dates.add(note.createdAt.split('T')[0]);
      dates.forEach(d => {
        if (!dateMap[d]) dateMap[d] = [];
        dateMap[d].push(note);
      });
    });

    // First day of month (0=Sun)
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrev  = new Date(currentYear, currentMonth, 0).getDate();

    let html = '<div class="cal-weekdays">';
    DAYS.forEach(d => { html += `<div class="cal-weekday">${d}</div>`; });
    html += '</div><div class="cal-days">';

    // Prev month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const day  = daysInPrev - i;
      const year = currentMonth === 0 ? currentYear - 1 : currentYear;
      const mon  = currentMonth === 0 ? 11 : currentMonth - 1;
      const ds   = toDateStr(new Date(year, mon, day));
      html += dayCell(day, ds, dateMap[ds] || [], true, false, false);
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = toDateStr(new Date(currentYear, currentMonth, d));
      const isToday    = ds === today;
      const isSelected = ds === selectedDate;
      html += dayCell(d, ds, dateMap[ds] || [], false, isToday, isSelected);
    }

    // Next month padding
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const nextPad    = totalCells - firstDay - daysInMonth;
    for (let d = 1; d <= nextPad; d++) {
      const year = currentMonth === 11 ? currentYear + 1 : currentYear;
      const mon  = currentMonth === 11 ? 0 : currentMonth + 1;
      const ds   = toDateStr(new Date(year, mon, d));
      html += dayCell(d, ds, dateMap[ds] || [], true, false, false);
    }

    html += '</div>';
    grid.innerHTML = html;

    // Bind click on days
    grid.querySelectorAll('.cal-day[data-date]').forEach(el => {
      el.addEventListener('click', () => {
        selectedDate = el.dataset.date;
        // Remove selected from all
        grid.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
        el.classList.add('selected');
        showDayNotes(selectedDate);
      });
    });

    // Animate
    Anim.staggerIn(grid.querySelectorAll('.cal-day:not(.other-month)'), 8);

    if (selectedDate) showDayNotes(selectedDate);
  }

  function dayCell(num, dateStr, dayNotes, otherMonth, isToday, isSelected) {
    const classes = [
      'cal-day',
      otherMonth  ? 'other-month' : '',
      isToday     ? 'today'       : '',
      isSelected  ? 'selected'    : '',
    ].filter(Boolean).join(' ');

    const dots = dayNotes.slice(0, 5).map(n =>
      `<span class="cal-dot ${n.priority !== 'none' ? n.priority : ''}"></span>`
    ).join('');

    return `
      <div class="${classes}" data-date="${dateStr}">
        <div class="cal-day-num">${num}</div>
        ${dots ? `<div class="cal-day-dots">${dots}</div>` : ''}
      </div>
    `;
  }

  function showDayNotes(dateStr) {
    const titleEl = document.getElementById('calendar-day-title');
    const listEl  = document.getElementById('calendar-day-list');
    const d       = new Date(dateStr + 'T12:00:00');

    titleEl.textContent = d.toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric'
    });

    const dayNotes = Notes.getNotesForDate(dateStr);
    if (!dayNotes.length) {
      listEl.innerHTML = '<p style="color:var(--text-faint);font-size:0.82rem">No notes for this day.</p>';
      return;
    }

    listEl.innerHTML = dayNotes.map(note => `
      <div class="note-card" data-priority="${note.priority}" data-id="${note.id}" style="cursor:pointer">
        <div class="note-card-header">
          <span class="note-card-title">${escHtml(note.title || 'Untitled')}</span>
          ${note.priority !== 'none' ? `<span class="priority-badge ${note.priority}">${note.priority}</span>` : ''}
        </div>
        <p class="note-card-preview">${escHtml(Notes.getPreview(note))}</p>
      </div>
    `).join('');

    listEl.querySelectorAll('.note-card').forEach(el => {
      el.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('noteflow:open-note', {
          detail: { id: el.dataset.id }
        }));
      });
    });

    Anim.staggerIn(listEl.querySelectorAll('.note-card'), 60);
  }

  function toDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { init, render };
})();
