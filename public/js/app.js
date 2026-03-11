/* ============================================================
   app.js — Main application controller
   Wires together all modules; manages state and UI
   ============================================================ */

(function () {
  // ============================================================
  // STATE
  // ============================================================
  const state = {
    view:           'all',      // 'all'|'favorites'|'reminders'|'calendar'
    layout:         'grid',
    searchQuery:    '',
    priorityFilter: 'all',
    tagFilter:      null,
    sortBy:         'updatedAt-desc',
    currentNoteId:  null,
    editorDirty:    false,
    aiHistory:      [],         // [{role,content}] for current note's AI session
    settings: {
      apiKey:    '',
      theme:     'dark',
      showQuote: true,
    },
  };

  // Autosave debounce timer
  let autosaveTimer = null;

  // ============================================================
  // SETTINGS
  // ============================================================
  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('noteflow_settings') || '{}');
      Object.assign(state.settings, s);
    } catch { /* ignore */ }
    applyTheme(state.settings.theme);
  }

  function saveSettings() {
    localStorage.setItem('noteflow_settings', JSON.stringify(state.settings));
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // ============================================================
  // TOAST
  // ============================================================
  function toast(msg, type = 'info', duration = 3000) {
    const icons = { success: 'ri-check-circle-line', error: 'ri-error-warning-line',
                    warning: 'ri-alert-line', info: 'ri-information-line' };
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${msg}</span>`;
    container.appendChild(el);
    Anim.toastIn(el);
    setTimeout(() => Anim.toastOut(el, () => el.remove()), duration);
  }

  // ============================================================
  // RENDER NOTES LIST
  // ============================================================
  function renderNotes() {
    const filtered = Notes.filter({
      view:           state.view === 'calendar' || state.view === 'reminders' ? 'all' : state.view,
      priorityFilter: state.priorityFilter,
      tagFilter:      state.tagFilter,
      searchQuery:    state.searchQuery,
    });
    const sorted = Notes.sort(filtered, state.sortBy);

    const container = document.getElementById('notes-container');
    const empty     = document.getElementById('empty-state');

    container.className = state.layout === 'list' ? 'notes-list' : 'notes-grid';

    if (!sorted.length) {
      container.innerHTML = '';
      empty.classList.remove('hidden');
      const msg = document.getElementById('empty-message');
      if (state.searchQuery)    msg.textContent = `No notes match "${state.searchQuery}".`;
      else if (state.tagFilter) msg.textContent = `No notes tagged #${state.tagFilter}.`;
      else if (state.view === 'favorites') msg.textContent = 'No favorite notes yet. Like a note to add it here.';
      else msg.textContent = 'Create your first note to get started.';
      return;
    }

    empty.classList.add('hidden');
    container.innerHTML = sorted.map(renderNoteCard).join('');

    // Mark active
    if (state.currentNoteId) {
      const active = container.querySelector(`[data-id="${state.currentNoteId}"]`);
      if (active) active.classList.add('active');
    }

    // Stagger animation
    Anim.staggerIn(container.querySelectorAll('.note-card'), 45);

    // Bind events for all cards
    container.querySelectorAll('.note-card').forEach(card => bindCardEvents(card));

    updateCounts();
    renderTagCloud();
  }

  // Bind click/like/dropdown events to a single card element
  function bindCardEvents(card) {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.note-card-action') || e.target.closest('.nc-more-wrap')) return;
      openNote(card.dataset.id);
    });

    const likeBtn = card.querySelector('.nc-like');
    if (likeBtn) {
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLike(card.dataset.id, likeBtn);
      });
    }

    const moreBtn  = card.querySelector('.nc-more');
    const dropdown = card.querySelector('.nc-dropdown');
    if (moreBtn && dropdown) {
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        document.querySelectorAll('.nc-dropdown.open').forEach(d => d.classList.remove('open'));
        if (!isOpen) dropdown.classList.add('open');
      });

      dropdown.querySelectorAll('.nc-dd-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.classList.remove('open');
          const action = item.dataset.action;
          const id = card.dataset.id;
          if (action === 'open')      openNote(id);
          if (action === 'duplicate') duplicateNote(id);
          if (action === 'delete') {
            state.currentNoteId = id;
            openDeleteModal();
          }
        });
      });
    }
  }

  // Patch a single card in-place without a full list re-render
  function updateNoteCard(id) {
    const container = document.getElementById('notes-container');
    const existing  = container ? container.querySelector(`[data-id="${id}"]`) : null;
    if (!existing) return; // card is filtered out — nothing to patch
    const note = Notes.getById(id);
    if (!note) return;

    const tmp = document.createElement('div');
    tmp.innerHTML = renderNoteCard(note).trim();
    const newCard = tmp.firstElementChild;

    if (state.currentNoteId === id) newCard.classList.add('active');
    existing.replaceWith(newCard);
    bindCardEvents(newCard);
  }

  function renderNoteCard(note) {
    const preview  = Notes.getPreview(note);
    const dateStr  = Notes.formatDate(note.updatedAt);
    const hasRem   = !!note.reminder;
    const priorityBadge = note.priority !== 'none'
      ? `<span class="priority-badge ${note.priority}">${note.priority}</span>`
      : '';
    const typeIcon = note.type === 'checklist'
      ? `<i class="ri-checkbox-line checklist-badge" title="Checklist"></i>`
      : '';
    const likeClass = note.liked ? 'liked' : '';
    const remClass  = hasRem   ? 'has-reminder' : '';
    const bgStyle   = note.color && note.color !== 'none' ? `style="background:${note.color}"` : '';
    const tags = note.tags.slice(0, 3).map(t =>
      `<span class="note-tag">#${escHtml(t)}</span>`
    ).join('');

    return `
      <div class="note-card" data-id="${note.id}" data-priority="${note.priority}" ${bgStyle}>
        <div class="note-card-header">
          <span class="note-card-title">${escHtml(note.title || 'Untitled')}</span>
          <div style="display:flex;align-items:center;gap:4px">
            ${typeIcon}
            ${priorityBadge}
          </div>
        </div>
        <p class="note-card-preview">${escHtml(preview)}</p>
        <div class="note-card-footer">
          <div class="note-card-tags">${tags}</div>
          <div class="note-card-actions">
            ${hasRem ? `<span class="note-card-action ${remClass}" title="${Reminders.formatReminderTime(note.reminder)}"><i class="ri-alarm-line"></i></span>` : ''}
            <button class="note-card-action nc-like ${likeClass}" title="${note.liked ? 'Unlike' : 'Like'}">
              <i class="ri-heart-${note.liked ? 'fill' : 'line'}"></i>
            </button>
            <div class="nc-more-wrap">
              <button class="note-card-action nc-more" title="More options">
                <i class="ri-more-2-line"></i>
              </button>
              <div class="nc-dropdown">
                <button class="nc-dd-item" data-action="open"><i class="ri-edit-line"></i> Open</button>
                <button class="nc-dd-item" data-action="duplicate"><i class="ri-file-copy-line"></i> Duplicate</button>
                <button class="nc-dd-item nc-dd-danger" data-action="delete"><i class="ri-delete-bin-line"></i> Delete</button>
              </div>
            </div>
          </div>
        </div>
        <div class="note-card-date">${dateStr}</div>
      </div>
    `;
  }

  function duplicateNote(id) {
    const note = Notes.getById(id);
    if (!note) return;
    Notes.create({
      title:    (note.title || 'Untitled') + ' (copy)',
      type:     note.type,
      content:  note.content,
      items:    note.items.map(i => ({ ...i, id: crypto.randomUUID() })),
      priority: note.priority,
      tags:     [...note.tags],
      color:    note.color,
    });
    renderNotes();
    updateCounts();
    toast('Note duplicated.', 'success');
  }

  function toggleLike(id, btnEl) {
    const note = Notes.getById(id);
    if (!note) return;
    const updated = Notes.update(id, { liked: !note.liked });
    const icon = btnEl.querySelector('i');
    if (updated.liked) {
      icon.className = 'ri-heart-fill';
      btnEl.classList.add('liked');
      Anim.heartBeat(btnEl);
    } else {
      icon.className = 'ri-heart-line';
      btnEl.classList.remove('liked');
    }
    updateCounts();
    if (state.currentNoteId === id) {
      updateEditorLikeBtn(updated.liked);
    }
  }

  function updateEditorLikeBtn(liked) {
    const btn  = document.getElementById('toggle-like');
    const icon = btn.querySelector('i');
    icon.className = liked ? 'ri-heart-fill' : 'ri-heart-line';
    btn.classList.toggle('active-heart', liked);
  }

  // ============================================================
  // TAG CLOUD
  // ============================================================
  function renderTagCloud() {
    const cloud = document.getElementById('tag-cloud');
    const tags  = Notes.getAllTags();
    if (!tags.length) {
      cloud.innerHTML = '<span style="font-size:0.75rem;color:var(--text-faint)">No tags yet</span>';
      return;
    }
    cloud.innerHTML = tags.map(t =>
      `<button class="tag-chip ${state.tagFilter === t ? 'active' : ''}" data-tag="${escHtml(t)}">#${escHtml(t)}</button>`
    ).join('');
    cloud.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        state.tagFilter = state.tagFilter === chip.dataset.tag ? null : chip.dataset.tag;
        renderNotes();
      });
    });
  }

  // ============================================================
  // COUNTS
  // ============================================================
  function updateCounts() {
    const all   = Notes.getAll();
    document.getElementById('count-all').textContent       = all.length;
    document.getElementById('count-favorites').textContent = all.filter(n => n.liked).length;
    document.getElementById('count-reminders').textContent = all.filter(n => n.reminder).length;
    document.getElementById('total-notes-stat').textContent =
      `${all.length} note${all.length !== 1 ? 's' : ''}`;
  }

  // ============================================================
  // VIEW SWITCHING
  // ============================================================
  function switchView(view) {
    state.view = view;

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });

    const viewMap = {
      all:       'view-notes',
      favorites: 'view-notes',
      reminders: 'view-reminders',
      calendar:  'view-calendar',
    };

    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewMap[view] || 'view-notes').classList.remove('hidden');

    const titles = {
      all: 'All Notes', favorites: 'Favorites',
      reminders: 'Reminders', calendar: 'Calendar',
    };
    document.getElementById('view-title').textContent = titles[view] || 'Notes';

    if (view === 'all' || view === 'favorites') {
      document.getElementById('view-notes').classList.remove('hidden');
      renderNotes();
    } else if (view === 'reminders') {
      Reminders.render();
    } else if (view === 'calendar') {
      Calendar.render();
    }
  }

  // ============================================================
  // OPEN / CLOSE EDITOR
  // ============================================================
  function openNote(id) {
    const note = Notes.getById(id);
    if (!note) return;

    state.currentNoteId = id;
    state.aiHistory     = [];

    const app    = document.getElementById('app');
    const panel  = document.getElementById('editor-panel');

    panel.classList.remove('hidden');
    app.classList.add('editor-open');
    Anim.slideInRight(panel);

    populateEditor(note);

    // Update active state without full re-render
    document.querySelectorAll('.note-card').forEach(c => c.classList.remove('active'));
    const activeCard = document.querySelector(`.note-card[data-id="${id}"]`);
    if (activeCard) activeCard.classList.add('active');
  }

  function closeEditor() {
    const app    = document.getElementById('app');
    const panel  = document.getElementById('editor-panel');

    app.classList.remove('editor-open');
    panel.classList.add('hidden');
    state.currentNoteId = null;
    document.querySelectorAll('.note-card').forEach(c => c.classList.remove('active'));
  }

  function populateEditor(note) {
    document.getElementById('note-title').value          = note.title;
    document.getElementById('priority-select').value     = note.priority;
    document.getElementById('due-date-input').value      = note.dueDate || '';
    document.getElementById('note-timestamps').textContent =
      `Created ${Notes.formatDate(note.createdAt)} · Updated ${Notes.formatDate(note.updatedAt)}`;

    // Type
    setEditorType(note.type, note);

    // Tags
    renderTagPills(note.tags);

    // Color
    document.querySelectorAll('.swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.color === note.color);
    });
    document.getElementById('editor-panel').style.background =
      note.color && note.color !== 'none' ? note.color : '';

    // Like
    updateEditorLikeBtn(note.liked);

    // Reminder indicator
    const remBtn = document.getElementById('set-reminder-btn');
    remBtn.classList.toggle('active-reminder', !!note.reminder);

    // AI panel — reset
    document.getElementById('ai-messages').innerHTML = '';
    document.getElementById('ai-panel').classList.add('hidden');
    document.getElementById('toggle-ai-panel').classList.remove('ai-active');

    updateWordCount(note);
    document.getElementById('autosave-status').textContent = '';
  }

  function setEditorType(type, note) {
    const noteContent   = document.getElementById('note-content');
    const checkContent  = document.getElementById('checklist-content');
    const noteTb        = document.getElementById('note-toolbar');
    const checkTb       = document.getElementById('checklist-toolbar');
    const btnNote       = document.getElementById('btn-type-note');
    const btnCheck      = document.getElementById('btn-type-checklist');

    btnNote.classList.toggle('active', type === 'note');
    btnCheck.classList.toggle('active', type === 'checklist');

    if (type === 'note') {
      noteContent.classList.remove('hidden');
      checkContent.classList.add('hidden');
      noteTb.classList.remove('hidden');
      checkTb.classList.add('hidden');
      noteContent.innerHTML = note ? note.content : '';
      noteContent.focus();
    } else {
      noteContent.classList.add('hidden');
      checkContent.classList.remove('hidden');
      noteTb.classList.add('hidden');
      checkTb.classList.remove('hidden');
      renderChecklist(note ? note.items : []);
    }
  }

  // ============================================================
  // CHECKLIST
  // ============================================================
  function renderChecklist(items) {
    const container = document.getElementById('checklist-items');
    container.innerHTML = items.map(item => buildChecklistItem(item)).join('');
    bindChecklistEvents(container);
    updateChecklistProgress(items);
  }

  function buildChecklistItem(item = { id: crypto.randomUUID(), text: '', checked: false }) {
    return `
      <div class="checklist-item" data-item-id="${item.id}">
        <div class="ci-checkbox ${item.checked ? 'checked' : ''}" data-cb></div>
        <input class="ci-text ${item.checked ? 'done' : ''}" value="${escHtml(item.text)}" placeholder="Item..." data-ci-input>
        <button class="ci-delete" data-ci-del title="Remove"><i class="ri-close-line"></i></button>
      </div>
    `;
  }

  function bindChecklistEvents(container) {
    container.querySelectorAll('[data-cb]').forEach(cb => {
      cb.addEventListener('click', () => {
        cb.classList.toggle('checked');
        const input = cb.nextElementSibling;
        input.classList.toggle('done', cb.classList.contains('checked'));
        scheduleAutosave();
        updateChecklistProgressFromDOM();
      });
    });

    container.querySelectorAll('[data-ci-input]').forEach(input => {
      input.addEventListener('input', scheduleAutosave);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addChecklistItem();
        }
        if (e.key === 'Backspace' && input.value === '') {
          e.preventDefault();
          const item = input.closest('.checklist-item');
          item.remove();
          scheduleAutosave();
          updateChecklistProgressFromDOM();
        }
      });
    });

    container.querySelectorAll('[data-ci-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.checklist-item').remove();
        scheduleAutosave();
        updateChecklistProgressFromDOM();
      });
    });
  }

  function addChecklistItem() {
    const container = document.getElementById('checklist-items');
    const item      = { id: crypto.randomUUID(), text: '', checked: false };
    const div       = document.createElement('div');
    div.innerHTML   = buildChecklistItem(item);
    const el        = div.firstElementChild;
    container.appendChild(el);
    bindChecklistEvents(el.parentElement);
    el.querySelector('[data-ci-input]').focus();
    Anim.fadeInUp(el, 0, 220);
  }

  function getChecklistItems() {
    const items = [];
    document.querySelectorAll('#checklist-items .checklist-item').forEach(row => {
      const id      = row.dataset.itemId || crypto.randomUUID();
      const text    = row.querySelector('[data-ci-input]').value;
      const checked = row.querySelector('[data-cb]').classList.contains('checked');
      items.push({ id, text, checked });
    });
    return items;
  }

  function updateChecklistProgressFromDOM() {
    const items = getChecklistItems();
    updateChecklistProgress(items);
  }

  function updateChecklistProgress(items) {
    const total   = items.length;
    const checked = items.filter(i => i.checked).length;
    document.getElementById('checklist-progress').textContent = `${checked} / ${total}`;
  }

  // ============================================================
  // TAG PILLS IN EDITOR
  // ============================================================
  function renderTagPills(tags) {
    const container = document.getElementById('tags-pills');
    container.innerHTML = tags.map(t => `
      <span class="tag-pill">
        #${escHtml(t)}
        <button data-remove-tag="${escHtml(t)}" title="Remove tag">×</button>
      </span>
    `).join('');
    container.querySelectorAll('[data-remove-tag]').forEach(btn => {
      btn.addEventListener('click', () => {
        const note = Notes.getById(state.currentNoteId);
        if (!note) return;
        const newTags = note.tags.filter(t => t !== btn.dataset.removeTag);
        Notes.update(state.currentNoteId, { tags: newTags });
        renderTagPills(newTags);
        renderTagCloud();
      });
    });
  }

  // ============================================================
  // AUTOSAVE
  // ============================================================
  function scheduleAutosave() {
    state.editorDirty = true;
    document.getElementById('autosave-status').textContent = 'Saving...';
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(performSave, 800);
  }

  function performSave() {
    const id = state.currentNoteId;
    if (!id) return;

    const note = Notes.getById(id);
    if (!note) return;

    const title    = document.getElementById('note-title').value;
    const priority = document.getElementById('priority-select').value;
    const dueDate  = document.getElementById('due-date-input').value || null;
    const type     = document.querySelector('.type-btn.active').dataset.type;

    let changes = { title, priority, dueDate, type };

    if (type === 'note') {
      changes.content = document.getElementById('note-content').innerHTML;
    } else {
      changes.items = getChecklistItems();
    }

    Notes.update(id, changes);

    state.editorDirty = false;
    document.getElementById('autosave-status').textContent = 'Saved';
    setTimeout(() => {
      if (!state.editorDirty)
        document.getElementById('autosave-status').textContent = '';
    }, 2000);

    updateWordCount(Notes.getById(id));
    updateNoteCard(id);  // patch only this card — no full re-render flash
    updateCounts();
  }

  // ============================================================
  // WORD COUNT
  // ============================================================
  function updateWordCount(note) {
    if (!note) return;
    const count = Notes.wordCount(note);
    document.getElementById('word-count').textContent = `${count} word${count !== 1 ? 's' : ''}`;
  }

  // ============================================================
  // SEARCH
  // ============================================================
  let searchDebounce;
  function onSearch(q) {
    state.searchQuery = q;
    document.getElementById('search-clear').classList.toggle('hidden', !q);
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(renderNotes, 250);
  }

  // ============================================================
  // MODALS
  // ============================================================
  function openSettingsModal() {
    document.getElementById('api-key-input').value = state.settings.apiKey;
    document.getElementById('show-quote-toggle').checked = state.settings.showQuote;
    document.querySelectorAll('.theme-opt').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === state.settings.theme);
    });
    const modal = document.getElementById('settings-modal');
    modal.classList.remove('hidden');
    Anim.popIn(document.getElementById('settings-card'));
  }

  function closeSettingsModal() {
    document.getElementById('settings-modal').classList.add('hidden');
  }

  function openReminderModal() {
    const id = state.currentNoteId;
    if (!id) return;
    const note = Notes.getById(id);

    const dtInput = document.getElementById('reminder-datetime');
    if (note.reminder) {
      // Convert to datetime-local format
      const d = new Date(note.reminder);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      dtInput.value = d.toISOString().slice(0, 16);
    } else {
      // Default: 1 hour from now
      const d = new Date(Date.now() + 3600_000);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      dtInput.value = d.toISOString().slice(0, 16);
    }

    document.getElementById('reminder-note-preview').value = note.title || 'Untitled';
    const modal = document.getElementById('reminder-modal');
    modal.classList.remove('hidden');
    Anim.popIn(document.getElementById('reminder-card'));
  }

  function closeReminderModal() {
    document.getElementById('reminder-modal').classList.add('hidden');
  }

  function openDeleteModal() {
    const modal = document.getElementById('delete-modal');
    modal.classList.remove('hidden');
    Anim.popIn(document.getElementById('delete-modal-card'));
  }

  function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
  }

  // ============================================================
  // AI PANEL
  // ============================================================
  function getNoteText() {
    const note = Notes.getById(state.currentNoteId);
    if (!note) return '';
    if (note.type === 'checklist') {
      return `${note.title}\n${note.items.map(i => (i.checked ? '[x] ' : '[ ] ') + i.text).join('\n')}`;
    }
    return `${note.title}\n${Notes.stripHtml(note.content)}`;
  }

  async function runAIAction(action) {
    const apiKey = AI.getApiKey() || state.settings.apiKey;
    if (!apiKey) {
      toast('Add your Anthropic API key in Settings first.', 'warning');
      openSettingsModal();
      return;
    }

    const text = getNoteText().trim();
    if (!text) {
      toast('The note is empty. Write something first.', 'warning');
      return;
    }

    const messagesEl = document.getElementById('ai-messages');
    const notice     = document.getElementById('ai-notice');
    notice.textContent = '';

    const actionLabels = {
      summarize:    'Summarize this note',
      expand:       'Expand ideas in this note',
      extractTasks: 'Extract tasks from this note',
      improve:      'Improve the writing in this note',
    };

    AI.appendMessage(messagesEl, 'user', actionLabels[action]);
    const loader = AI.showLoading(messagesEl);

    try {
      let result;
      if (action === 'summarize')    result = await AI.summarize(text, apiKey);
      if (action === 'expand')       result = await AI.expand(text, apiKey);
      if (action === 'extractTasks') result = await AI.extractTasks(text, apiKey);
      if (action === 'improve')      result = await AI.improve(text, apiKey);
      AI.removeLoading();
      AI.appendMessage(messagesEl, 'ai', result);
    } catch (err) {
      AI.removeLoading();
      AI.appendMessage(messagesEl, 'ai', `Error: ${err.message}`);
    }
  }

  async function sendAIChat(message) {
    const apiKey = AI.getApiKey() || state.settings.apiKey;
    if (!apiKey) {
      toast('Add your Anthropic API key in Settings first.', 'warning');
      openSettingsModal();
      return;
    }

    const messagesEl = document.getElementById('ai-messages');
    AI.appendMessage(messagesEl, 'user', message);
    state.aiHistory.push({ role: 'user', content: message });

    const loader = AI.showLoading(messagesEl);
    try {
      const result = await AI.chat(getNoteText(), message, state.aiHistory.slice(0, -1), apiKey);
      AI.removeLoading();
      AI.appendMessage(messagesEl, 'ai', result);
      state.aiHistory.push({ role: 'assistant', content: result });
    } catch (err) {
      AI.removeLoading();
      AI.appendMessage(messagesEl, 'ai', `Error: ${err.message}`);
    }
  }

  // ============================================================
  // EXPORT
  // ============================================================
  function exportNote() {
    const note = Notes.getById(state.currentNoteId);
    if (!note) return;

    let content = `# ${note.title || 'Untitled'}\n\n`;
    if (note.priority !== 'none') content += `Priority: ${note.priority}\n`;
    if (note.dueDate)             content += `Due: ${note.dueDate}\n`;
    if (note.tags.length)         content += `Tags: ${note.tags.map(t => '#' + t).join(', ')}\n`;
    content += `\n`;

    if (note.type === 'checklist') {
      content += note.items.map(i => `- [${i.checked ? 'x' : ' '}] ${i.text}`).join('\n');
    } else {
      content += Notes.stripHtml(note.content);
    }

    content += `\n\n---\nCreated: ${new Date(note.createdAt).toLocaleString()}\nUpdated: ${new Date(note.updatedAt).toLocaleString()}`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${(note.title || 'note').replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Note exported as Markdown.', 'success');
  }

  // ============================================================
  // KEYBOARD SHORTCUTS
  // ============================================================
  function setupKeyboardShortcuts() {
    // Close any open 3-dot dropdown when clicking elsewhere
    document.addEventListener('click', () => {
      document.querySelectorAll('.nc-dropdown.open').forEach(d => d.classList.remove('open'));
    });

    document.addEventListener('keydown', (e) => {
      const inInput = ['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)
        || document.activeElement.contentEditable === 'true';

      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createNewNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input').focus();
        document.getElementById('search-input').select();
      }
      if (e.key === 'Escape') {
        if (!document.getElementById('settings-modal').classList.contains('hidden')) closeSettingsModal();
        else if (!document.getElementById('delete-modal').classList.contains('hidden'))  closeDeleteModal();
        else if (!document.getElementById('reminder-modal').classList.contains('hidden')) closeReminderModal();
        else if (state.currentNoteId) closeEditor();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && inInput) {
        e.preventDefault();
        performSave();
        toast('Saved!', 'success', 1500);
      }
    });
  }

  // ============================================================
  // CREATE NEW NOTE
  // ============================================================
  function createNewNote() {
    const note = Notes.create();
    updateCounts();
    renderNotes();
    openNote(note.id);
    setTimeout(() => document.getElementById('note-title').focus(), 100);
  }

  // ============================================================
  // INIT — wire up all events
  // ============================================================
  function init() {
    loadSettings();
    Calendar.init();
    Reminders.start();

    // Daily quote
    if (Quotes.shouldShow(state.settings)) {
      Quotes.show(() => { /* after close */ });
    }

    // Initial render
    renderNotes();
    updateCounts();
    renderTagCloud();
    setupKeyboardShortcuts();

    // ---- Sync error toast ----
    window.addEventListener('noteflow:sync-error', () => {
      toast('Could not save to server. Changes may be lost on refresh.', 'warning', 6000);
    });

    // ---- Sidebar collapse ----
    document.getElementById('collapse-sidebar').addEventListener('click', () => {
      document.getElementById('app').classList.toggle('sidebar-collapsed');
    });
    document.getElementById('toggle-sidebar-mobile').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // ---- Nav items ----
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => switchView(item.dataset.view));
    });

    // ---- Priority filters ----
    document.querySelectorAll('.pf-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pf-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.priorityFilter = btn.dataset.priority;
        renderNotes();
      });
    });

    // ---- New note ----
    document.getElementById('new-note-btn').addEventListener('click', createNewNote);
    document.getElementById('empty-new-btn').addEventListener('click', createNewNote);

    // ---- Search ----
    document.getElementById('search-input').addEventListener('input', e => onSearch(e.target.value));
    document.getElementById('search-clear').addEventListener('click', () => {
      document.getElementById('search-input').value = '';
      onSearch('');
    });

    // ---- Sort ----
    document.getElementById('sort-select').addEventListener('change', e => {
      state.sortBy = e.target.value;
      renderNotes();
    });

    // ---- Layout ----
    document.querySelectorAll('.layout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.layout = btn.dataset.layout;
        renderNotes();
      });
    });

    // ---- Settings ----
    document.getElementById('settings-btn').addEventListener('click', openSettingsModal);
    document.getElementById('topbar-settings-btn').addEventListener('click', openSettingsModal);
    document.getElementById('close-settings').addEventListener('click', closeSettingsModal);
    document.getElementById('settings-modal').addEventListener('click', e => {
      if (e.target === e.currentTarget) closeSettingsModal();
    });

    document.querySelectorAll('.theme-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.settings.theme = btn.dataset.theme;
        applyTheme(btn.dataset.theme);
      });
    });

    document.getElementById('toggle-api-key').addEventListener('click', () => {
      const input = document.getElementById('api-key-input');
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    document.getElementById('save-settings').addEventListener('click', () => {
      state.settings.apiKey    = document.getElementById('api-key-input').value.trim();
      state.settings.showQuote = document.getElementById('show-quote-toggle').checked;
      localStorage.setItem('noteflow_api_key', state.settings.apiKey);
      saveSettings();
      closeSettingsModal();
      toast('Settings saved.', 'success');
    });

    // ---- Editor: close ----
    document.getElementById('close-editor').addEventListener('click', closeEditor);

    // ---- Editor: title & content changes ----
    document.getElementById('note-title').addEventListener('input', scheduleAutosave);
    document.getElementById('note-content').addEventListener('input', scheduleAutosave);
    document.getElementById('priority-select').addEventListener('change', scheduleAutosave);
    document.getElementById('due-date-input').addEventListener('change', scheduleAutosave);

    // ---- Type switcher ----
    document.getElementById('btn-type-note').addEventListener('click', () => {
      if (state.currentNoteId) {
        const note = Notes.getById(state.currentNoteId);
        setEditorType('note', note);
        scheduleAutosave();
      }
    });
    document.getElementById('btn-type-checklist').addEventListener('click', () => {
      if (state.currentNoteId) {
        const note = Notes.getById(state.currentNoteId);
        setEditorType('checklist', note);
        scheduleAutosave();
      }
    });

    // ---- Formatting toolbar ----
    document.querySelectorAll('.tb-btn[data-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        const val = btn.dataset.val || null;
        document.execCommand(cmd, false, val);
        document.getElementById('note-content').focus();
        scheduleAutosave();
      });
    });

    // ---- Copy button ----
    document.getElementById('copy-note-btn').addEventListener('click', () => {
      const text = Notes.stripHtml(document.getElementById('note-content').innerHTML);
      navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard!', 'success'));
    });

    // ---- Checklist toolbar buttons ----
    document.getElementById('check-all-btn').addEventListener('click', () => {
      document.querySelectorAll('#checklist-items [data-cb]').forEach(cb => {
        cb.classList.add('checked');
        cb.nextElementSibling.classList.add('done');
      });
      updateChecklistProgressFromDOM();
      scheduleAutosave();
    });
    document.getElementById('uncheck-all-btn').addEventListener('click', () => {
      document.querySelectorAll('#checklist-items [data-cb]').forEach(cb => {
        cb.classList.remove('checked');
        cb.nextElementSibling.classList.remove('done');
      });
      updateChecklistProgressFromDOM();
      scheduleAutosave();
    });
    document.getElementById('clear-checked-btn').addEventListener('click', () => {
      document.querySelectorAll('#checklist-items .checklist-item').forEach(row => {
        if (row.querySelector('[data-cb]').classList.contains('checked')) row.remove();
      });
      updateChecklistProgressFromDOM();
      scheduleAutosave();
    });
    document.getElementById('add-item-btn').addEventListener('click', addChecklistItem);

    // ---- Like ----
    document.getElementById('toggle-like').addEventListener('click', () => {
      if (!state.currentNoteId) return;
      const note    = Notes.getById(state.currentNoteId);
      const updated = Notes.update(state.currentNoteId, { liked: !note.liked });
      updateEditorLikeBtn(updated.liked);
      Anim.heartBeat(document.getElementById('toggle-like'));
      updateCounts();
      updateNoteCard(state.currentNoteId);
    });

    // ---- Reminder ----
    document.getElementById('set-reminder-btn').addEventListener('click', openReminderModal);
    document.getElementById('close-reminder').addEventListener('click', closeReminderModal);
    document.getElementById('reminder-modal').addEventListener('click', e => {
      if (e.target === e.currentTarget) closeReminderModal();
    });
    document.getElementById('save-reminder').addEventListener('click', () => {
      const dt = document.getElementById('reminder-datetime').value;
      if (!dt) { toast('Please select a date and time.', 'warning'); return; }
      const remIso = new Date(dt).toISOString();
      Notes.update(state.currentNoteId, { reminder: remIso });
      document.getElementById('set-reminder-btn').classList.add('active-reminder');
      Anim.shake(document.getElementById('set-reminder-btn').querySelector('i'));
      closeReminderModal();
      toast('Reminder set.', 'success');
      updateCounts();
      updateNoteCard(state.currentNoteId);
    });
    document.getElementById('clear-reminder').addEventListener('click', () => {
      Notes.update(state.currentNoteId, { reminder: null });
      document.getElementById('set-reminder-btn').classList.remove('active-reminder');
      closeReminderModal();
      toast('Reminder cleared.', 'info');
      updateCounts();
      updateNoteCard(state.currentNoteId);
    });

    // ---- Delete ----
    document.getElementById('delete-note-btn').addEventListener('click', openDeleteModal);
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('delete-modal').addEventListener('click', e => {
      if (e.target === e.currentTarget) closeDeleteModal();
    });
    document.getElementById('confirm-delete').addEventListener('click', () => {
      Notes.remove(state.currentNoteId);
      closeDeleteModal();
      closeEditor();
      renderNotes();
      updateCounts();
      renderTagCloud();
      toast('Note deleted.', 'info');
    });

    // ---- Export ----
    document.getElementById('export-note-btn').addEventListener('click', exportNote);

    // ---- Color swatches ----
    document.querySelectorAll('.swatch').forEach(s => {
      s.addEventListener('click', () => {
        document.querySelectorAll('.swatch').forEach(sw => sw.classList.remove('active'));
        s.classList.add('active');
        const color = s.dataset.color;
        Notes.update(state.currentNoteId, { color });
        document.getElementById('editor-panel').style.background =
          color && color !== 'none' ? color : '';
        scheduleAutosave();
        updateNoteCard(state.currentNoteId);
      });
    });

    // ---- Tags input ----
    document.getElementById('tag-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const raw = e.target.value.trim().replace(/,/g, '').toLowerCase();
        if (!raw || !state.currentNoteId) return;
        const note = Notes.getById(state.currentNoteId);
        if (!note.tags.includes(raw)) {
          const newTags = [...note.tags, raw];
          Notes.update(state.currentNoteId, { tags: newTags });
          renderTagPills(newTags);
          renderTagCloud();
          updateNoteCard(state.currentNoteId);
        }
        e.target.value = '';
      }
    });

    // ---- AI panel toggle ----
    document.getElementById('toggle-ai-panel').addEventListener('click', () => {
      const panel = document.getElementById('ai-panel');
      const btn   = document.getElementById('toggle-ai-panel');
      const isHidden = panel.classList.contains('hidden');
      if (isHidden) {
        panel.classList.remove('hidden');
        btn.classList.add('ai-active');
        Anim.fadeInUp(panel, 0, 280);
      } else {
        panel.classList.add('hidden');
        btn.classList.remove('ai-active');
      }
    });
    document.getElementById('close-ai-panel').addEventListener('click', () => {
      document.getElementById('ai-panel').classList.add('hidden');
      document.getElementById('toggle-ai-panel').classList.remove('ai-active');
    });

    // ---- AI quick actions ----
    document.getElementById('ai-summarize').addEventListener('click', () => runAIAction('summarize'));
    document.getElementById('ai-expand').addEventListener('click',    () => runAIAction('expand'));
    document.getElementById('ai-tasks').addEventListener('click',     () => runAIAction('extractTasks'));
    document.getElementById('ai-improve').addEventListener('click',   () => runAIAction('improve'));

    // ---- AI chat ----
    document.getElementById('ai-send-btn').addEventListener('click', sendChat);
    document.getElementById('ai-chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
    });
    function sendChat() {
      const input = document.getElementById('ai-chat-input');
      const msg   = input.value.trim();
      if (!msg) return;
      input.value = '';
      sendAIChat(msg);
    }

    // ---- Listen for open-note events (from calendar/reminders) ----
    window.addEventListener('noteflow:open-note', (e) => {
      switchView('all');
      openNote(e.detail.id);
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================
  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ============================================================
  // BOOT
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    Notes.init().then(() => init());
  });
})();
