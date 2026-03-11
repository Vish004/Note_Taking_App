/* ============================================================
   reminders.js — Reminder scheduling via Web Notifications API
   Polls every 30 seconds for due reminders
   ============================================================ */

const Reminders = (() => {
  let pollingInterval = null;
  const FIRED_KEY = 'noteflow_fired_reminders';

  // ---------- Notification permission ----------

  async function requestPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied')  return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  // ---------- Fired tracking (so we don't re-fire) ----------

  function getFired() {
    try { return JSON.parse(localStorage.getItem(FIRED_KEY) || '[]'); }
    catch { return []; }
  }

  function markFired(id) {
    const fired = getFired();
    if (!fired.includes(id)) {
      fired.push(id);
      localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
    }
  }

  function wasFired(id) { return getFired().includes(id); }

  // ---------- Fire a notification ----------

  function fireNotification(note) {
    if (Notification.permission !== 'granted') return;

    const body = note.type === 'checklist'
      ? `Checklist: ${note.items.length} item(s)`
      : Notes.stripHtml(note.content).slice(0, 120) || 'Open note for details';

    const notif = new Notification(note.title || 'Reminder', {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: note.id,
    });

    notif.onclick = () => {
      window.focus();
      window.dispatchEvent(new CustomEvent('noteflow:open-note', { detail: { id: note.id } }));
    };

    markFired(note.id + '_' + note.reminder);
  }

  // ---------- Poll ----------

  function check() {
    const now  = new Date();
    const notes = Notes.getAll().filter(n => n.reminder);

    notes.forEach(note => {
      const remTime  = new Date(note.reminder);
      const fireKey  = note.id + '_' + note.reminder;

      if (remTime <= now && !wasFired(fireKey)) {
        fireNotification(note);
      }
    });
  }

  function start() {
    if (pollingInterval) return;
    requestPermission();
    check(); // immediate check
    pollingInterval = setInterval(check, 30_000);
  }

  function stop() {
    if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
  }

  // ---------- Render reminders view ----------

  function render() {
    const container  = document.getElementById('reminders-container');
    const emptyEl    = document.getElementById('reminders-empty');
    const notes      = Notes.getAll().filter(n => n.reminder).sort((a, b) => new Date(a.reminder) - new Date(b.reminder));

    if (!notes.length) {
      container.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');

    const now = new Date();
    container.innerHTML = notes.map(note => {
      const remDate  = new Date(note.reminder);
      const overdue  = remDate < now;
      const timeStr  = remDate.toLocaleString(undefined, {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      return `
        <div class="reminder-card ${overdue ? 'overdue' : ''}" data-note-id="${note.id}">
          <div class="reminder-icon ${overdue ? 'overdue' : ''}">
            <i class="ri-alarm-${overdue ? 'warning' : 'line'}"></i>
          </div>
          <div class="reminder-info">
            <div class="reminder-title">${escHtml(note.title || 'Untitled')}</div>
            <div class="reminder-time ${overdue ? 'overdue' : ''}">
              ${overdue ? 'Overdue · ' : ''}${timeStr}
            </div>
          </div>
          <button class="reminder-open-btn" data-note-id="${note.id}">Open</button>
        </div>
      `;
    }).join('');

    // Animate
    Anim.staggerIn(container.querySelectorAll('.reminder-card'), 50);

    // Bind open buttons
    container.querySelectorAll('[data-note-id]').forEach(el => {
      el.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('noteflow:open-note', {
          detail: { id: el.dataset.noteId }
        }));
      });
    });
  }

  // ---------- Helper ----------

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function formatReminderTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  return { start, stop, render, requestPermission, formatReminderTime };
})();
