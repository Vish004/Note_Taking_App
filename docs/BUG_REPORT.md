# NoteFlow — Bug Report & Fix Documentation

**Version:** 1.0.0
**Last Updated:** 2026-03-10

---

## Bug Report Format

Each entry follows:
- **ID** — Unique identifier
- **Severity** — Critical / High / Medium / Low
- **Status** — Open / Fixed / Won't Fix / Investigating
- **Description** — What happens and when
- **Steps to Reproduce**
- **Root Cause**
- **Fix Applied**
- **Testing Steps**

---

## Identified & Fixed Bugs

---

### BUG-001 · Medium · Fixed
**Title:** `package.json` uses CommonJS imports but server uses ES Module syntax

**Description:** `server.js` uses `import` statements, but `package.json` did not originally declare `"type": "module"`. This causes Node.js to treat `.js` files as CommonJS, producing a SyntaxError on startup.

**Steps to Reproduce:**
1. Clone project
2. Run `npm start` without `"type": "module"` in package.json

**Error:**
```
SyntaxError: Cannot use import statement in a module
```

**Root Cause:** Node.js defaults to CommonJS mode unless `"type": "module"` is set.

**Fix Applied:** Added `"type": "module"` to `package.json`.

**Testing Steps:**
1. Run `npm install && npm start`
2. Verify server starts and outputs `NoteFlow running at http://localhost:3000`

---

### BUG-002 · High · Fixed
**Title:** `node-fetch` is ESM-only in v3.x; incompatible with CommonJS require

**Description:** `node-fetch` v3+ is pure ESM. Using `require('node-fetch')` in a CommonJS context throws a `ERR_REQUIRE_ESM` error.

**Root Cause:** Package version mismatch with module system.

**Fix Applied:** Since `server.js` uses ES Module syntax (`import`), `node-fetch` v3 is compatible. The `"type": "module"` fix (BUG-001) resolves this.

**Testing Steps:**
1. Start server
2. Make an AI request — verify no `ERR_REQUIRE_ESM` error in server logs

---

### BUG-003 · Medium · Fixed
**Title:** Daily quote overlay fires every page reload instead of once per day

**Description:** The quote shows on every page load regardless of whether it was already seen today.

**Root Cause:** `shouldShow()` was not checking `noteflow_quote_seen` in `localStorage`.

**Fix Applied:** `Quotes.shouldShow()` reads `noteflow_quote_seen` from localStorage and compares to today's date string. `Quotes.markSeen()` writes today's date when the overlay is dismissed.

**Testing Steps:**
1. Open app — quote should show
2. Dismiss quote
3. Refresh page — quote should NOT show again
4. Set `localStorage.removeItem('noteflow_quote_seen')` in DevTools → refresh → quote shows again

---

### BUG-004 · High · Fixed
**Title:** Editor panel renders on top of sidebar on narrow screens without overlay

**Description:** On mobile viewports (<900px), the editor panel uses `position: fixed; inset: 0` so it covers the full screen. However, if the sidebar is also open (mobile drawer), it appears behind the editor (z-index conflict).

**Root Cause:** Sidebar z-index (200) was higher than editor panel z-index (150).

**Fix Applied:** CSS updated so editor panel has `z-index: 150` and sidebar has `z-index: 200`. When the editor opens on mobile, the sidebar is automatically closed via `sidebar.classList.remove('open')` in the close-editor handler.

**Testing Steps:**
1. Open app on a 375px viewport
2. Open sidebar, then tap a note
3. Verify editor covers full screen cleanly

---

### BUG-005 · Medium · Fixed
**Title:** Reminder notification fires repeatedly every 30 seconds

**Description:** Once a reminder fires, it triggers a new browser notification every poll cycle (every 30 seconds).

**Root Cause:** No deduplication of fired reminders.

**Fix Applied:** `Reminders` module tracks fired reminders in `localStorage` under `noteflow_fired_reminders`. The composite key `noteId + '_' + reminderISO` is stored on first fire and checked before firing again.

**Testing Steps:**
1. Set a reminder for 1 minute in the future
2. Wait for it to fire — one notification appears
3. Wait 30+ more seconds — no additional notification

---

### BUG-006 · Low · Fixed
**Title:** Checklist "Check All" / "Uncheck All" buttons don't persist changes

**Description:** Clicking Check All visually checks all boxes but the state isn't saved to localStorage.

**Root Cause:** The button handler updated the DOM but did not call `scheduleAutosave()`.

**Fix Applied:** Added `scheduleAutosave()` and `updateChecklistProgressFromDOM()` calls in all checklist toolbar button handlers.

**Testing Steps:**
1. Create a checklist note with 3 items
2. Click "Check All"
3. Reload the page and reopen the note
4. All items should still be checked

---

### BUG-007 · Low · Fixed
**Title:** Tag input accepts commas as tag separators but leaves empty tags

**Description:** Typing `foo, bar` and pressing Enter creates an empty tag for the comma.

**Root Cause:** `raw` variable was not stripping commas correctly before creating the tag.

**Fix Applied:** Tag input handler strips commas via `.replace(/,/g, '')` before processing, and guards with `if (!raw)` before inserting.

**Testing Steps:**
1. Open a note
2. Type `foo,` in tag input and press Enter
3. Only the tag "foo" should be created, not an empty tag

---

### BUG-008 · Medium · Fixed
**Title:** Note editor contenteditable loses focus after toolbar button click

**Description:** Clicking a formatting button (Bold, Italic, etc.) causes the editor to lose focus, breaking the selection before `execCommand` is applied.

**Root Cause:** Button click events cause focus to move from `contenteditable` to the button.

**Fix Applied:** Each toolbar button calls `document.getElementById('note-content').focus()` immediately after `execCommand`. Using `mousedown` + `e.preventDefault()` would be the ideal fix, but `focus()` is sufficient for this implementation.

**Testing Steps:**
1. Select text in note editor
2. Click Bold
3. Selected text should become bold; cursor should remain in editor

---

### BUG-009 · Low · Fixed
**Title:** Reminder modal datetime input shows time in UTC instead of local time

**Description:** When setting a reminder, the default time shown in the `datetime-local` input was in UTC, causing off-by-timezone issues.

**Root Cause:** `toISOString()` returns UTC time; `datetime-local` input expects local time.

**Fix Applied:** In `openReminderModal()`, we subtract the timezone offset before calling `.toISOString().slice(0, 16)`:
```js
d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
```

**Testing Steps:**
1. Open reminder modal for a note
2. Default value should be ~1 hour from now in local time
3. Set reminder, save, and verify the stored ISO string matches the intended local time

---

### BUG-010 · Medium · Fixed
**Title:** Calendar doesn't show notes created on dates in other months

**Description:** When navigating to a previous month, notes created that month don't appear as dots on the calendar.

**Root Cause:** `getNotesForDate()` checked `createdAt.startsWith(dateStr)` correctly, but the calendar rendering logic built the dateMap only from `dueDate` and `reminder` fields.

**Fix Applied:** Calendar's `dateMap` construction now includes `note.createdAt.split('T')[0]` as a key, ensuring creation-date dots appear correctly.

**Testing Steps:**
1. Create a note (today)
2. Navigate to previous month in calendar
3. Navigate back to current month
4. Dot should appear on today's date

---

## Open / Known Issues

| ID      | Severity | Status       | Description |
|---------|----------|--------------|-------------|
| BUG-011 | Low      | Open         | `execCommand` is deprecated per HTML spec. Will migrate to Selection API or a lightweight editor library in v1.1. |
| BUG-012 | Low      | Investigating | On iOS Safari, `Notification.requestPermission()` is not supported. Reminders fire silently. |
| BUG-013 | Low      | Open         | Very long note titles overflow the note card on narrow grid columns at some viewport widths. |

---

## Testing Checklist

Run through these steps after any code change:

### Smoke Tests
- [ ] App loads at `http://localhost:3000`
- [ ] Daily quote shows on first load; does not show on refresh
- [ ] Create a new note via button and keyboard shortcut (Ctrl+N)
- [ ] Type in title and content; verify autosave fires
- [ ] Delete a note

### Notes
- [ ] Rich text formatting: bold, italic, underline, lists
- [ ] Switch note to checklist mode; add/check/delete items
- [ ] Check All / Uncheck All / Clear Done persist after reload
- [ ] Set priority; verify card border color
- [ ] Add/remove tags; verify tag cloud updates
- [ ] Like/unlike; verify Favorites count updates
- [ ] Set note color; verify background changes

### Search & Sort
- [ ] Search by title
- [ ] Search by content
- [ ] Search by tag
- [ ] Sort by each option
- [ ] Filter by priority

### Reminders & Calendar
- [ ] Set a reminder 2 minutes in future; wait for notification
- [ ] View overdue reminder in Reminders view
- [ ] Navigate calendar; verify dots on note dates
- [ ] Click a calendar day; verify notes appear

### AI (requires API key)
- [ ] Summarize a note with content
- [ ] Expand a note
- [ ] Extract tasks from a note
- [ ] Improve writing
- [ ] Send a chat message and receive a response
- [ ] AI error handled gracefully when API key is missing

### Settings
- [ ] Toggle dark/light theme
- [ ] Save API key; verify it persists after reload
- [ ] Toggle daily quote off; verify it doesn't show next reload

### Export
- [ ] Export a note as Markdown; verify file downloads correctly
