/* ============================================================
   notes.js — Note CRUD with server-side persistence
   In-memory cache is the single source of truth.
   Reads are synchronous (from cache).
   Writes fire async fetch calls to the server in the background.
   ============================================================ */

const Notes = (() => {
  const LEGACY_KEY = 'noteflow_notes'; // used only for one-time migration
  let _cache = [];
  let _warnShown = false;

  // ---------- Boot: load from server ----------

  function init() {
    return fetch('/api/notes')
      .then(res => res.json())
      .then(serverNotes => {
        _cache = serverNotes;
        _migrateLocalStorage();
      })
      .catch(err => {
        console.warn('Server unavailable, falling back to localStorage:', err);
        try { _cache = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]'); }
        catch(e) { _cache = []; }
      });
  }

  // ---------- One-time migration ----------

  function _migrateLocalStorage() {
    let raw;
    try { raw = localStorage.getItem(LEGACY_KEY); } catch(e) { return; }
    if (!raw) return;
    let localNotes;
    try { localNotes = JSON.parse(raw); } catch(e) { return; }
    if (!localNotes || !localNotes.length) { localStorage.removeItem(LEGACY_KEY); return; }

    const serverIds = new Set(_cache.map(n => n.id));
    const toMigrate = localNotes.filter(n => !serverIds.has(n.id));

    if (toMigrate.length) {
      toMigrate.slice().reverse().forEach(note => {
        _cache.unshift(note);
        fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(note),
        }).catch(err => console.error('Migration push failed:', err));
      });
      console.log(`Migrated ${toMigrate.length} note(s) from localStorage to server.`);
    }
    localStorage.removeItem(LEGACY_KEY);
  }

  // ---------- Background server writes ----------

  function _syncWarn() {
    if (_warnShown) return;
    _warnShown = true;
    window.dispatchEvent(new CustomEvent('noteflow:sync-error'));
  }

  function _pushCreate(note) {
    fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    }).catch(() => _syncWarn());
  }

  function _pushUpdate(id, note) {
    fetch('/api/notes/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    }).catch(() => _syncWarn());
  }

  function _pushDelete(id) {
    fetch('/api/notes/' + id, { method: 'DELETE' })
      .catch(() => _syncWarn());
  }

  // ---------- CRUD ----------

  function getAll() {
    return _cache.slice();
  }

  function getById(id) {
    return _cache.find(n => n.id === id) || null;
  }

  function create(overrides = {}) {
    const now = new Date().toISOString();
    const note = {
      id:        crypto.randomUUID(),
      title:     '',
      type:      'note',
      content:   '',
      items:     [],
      priority:  'none',
      tags:      [],
      liked:     false,
      reminder:  null,
      dueDate:   null,
      color:     'none',
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
    _cache.unshift(note);
    _pushCreate(note);
    return note;
  }

  function update(id, changes) {
    const idx = _cache.findIndex(n => n.id === id);
    if (idx === -1) return null;
    _cache[idx] = { ..._cache[idx], ...changes, updatedAt: new Date().toISOString() };
    _pushUpdate(id, _cache[idx]);
    return _cache[idx];
  }

  function remove(id) {
    _cache = _cache.filter(n => n.id !== id);
    _pushDelete(id);
  }

  // ---------- Queries ----------

  function filter({ view = 'all', priorityFilter = 'all', tagFilter = null, searchQuery = '' } = {}) {
    let notes = _cache.slice();

    if (view === 'favorites') notes = notes.filter(n => n.liked);
    if (view === 'reminders') notes = notes.filter(n => n.reminder);

    if (priorityFilter !== 'all') {
      notes = notes.filter(n => n.priority === priorityFilter);
    }
    if (tagFilter) {
      notes = notes.filter(n => n.tags.includes(tagFilter));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      notes = notes.filter(n => {
        return n.title.toLowerCase().includes(q)
          || stripHtml(n.content).toLowerCase().includes(q)
          || n.tags.some(t => t.toLowerCase().includes(q))
          || n.items.some(i => i.text.toLowerCase().includes(q));
      });
    }
    return notes;
  }

  function sort(notes, sortKey = 'updatedAt-desc') {
    const [field, dir] = sortKey.split('-');
    return [...notes].sort((a, b) => {
      let va = a[field], vb = b[field];
      if (field === 'priority') {
        const order = { urgent: 4, high: 3, medium: 2, low: 1, none: 0 };
        va = order[va] || 0; vb = order[vb] || 0;
      }
      if (field === 'title') { va = (va || '').toLowerCase(); vb = (vb || '').toLowerCase(); }
      if (dir === 'asc') return va > vb ? 1 : -1;
      return va < vb ? 1 : -1;
    });
  }

  function getAllTags() {
    const tags = new Set();
    _cache.forEach(n => n.tags.forEach(t => tags.add(t)));
    return [...tags].sort();
  }

  function getNotesForDate(dateStr) {
    return _cache.filter(n => {
      if (n.dueDate === dateStr) return true;
      if (n.reminder && n.reminder.startsWith(dateStr)) return true;
      if (n.createdAt.startsWith(dateStr)) return true;
      return false;
    });
  }

  // ---------- Helpers ----------

  function stripHtml(html = '') {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || '';
  }

  function getPreview(note) {
    if (note.type === 'checklist') {
      if (!note.items.length) return 'Empty checklist';
      return note.items.slice(0, 3).map(i => (i.checked ? '✓ ' : '○ ') + i.text).join('\n');
    }
    return stripHtml(note.content).replace(/\s+/g, ' ').trim().slice(0, 160);
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    const diffH   = Math.floor((now - d) / 3600000);
    const diffD   = Math.floor((now - d) / 86400000);
    if (diffMin < 1)  return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffH   < 24) return `${diffH}h ago`;
    if (diffD   < 7)  return `${diffD}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function wordCount(note) {
    const text = note.type === 'checklist'
      ? note.items.map(i => i.text).join(' ')
      : stripHtml(note.content);
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  return {
    init,
    getAll,
    getById,
    create,
    update,
    remove,
    filter,
    sort,
    getAllTags,
    getNotesForDate,
    getPreview,
    formatDate,
    wordCount,
    stripHtml,
  };
})();
