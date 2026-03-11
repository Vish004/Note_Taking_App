# NoteFlow — Project Planning Document

## Project Overview

**Product Name:** NoteFlow
**Version:** 1.0.0
**Type:** AI-powered web-based note-taking application
**Stack:** Node.js + Express (backend), Vanilla JS + HTML/CSS (frontend), Claude API (AI)

---

## Goals

1. Deliver a fast, beautiful, and fully functional note-taking experience.
2. Integrate Claude AI for summarization, expansion, task extraction, and free-form chat.
3. Support checklists with progress tracking.
4. Provide priority levels, tags, reminders, and a calendar view.
5. Display a daily motivational quote on first open each day.
6. Ensure all data is stored locally (no account required).

---

## Architecture

```
note_taking_app/
├── server.js              Express server + AI proxy endpoint
├── package.json
├── .env.example
├── public/
│   ├── index.html         Single-page app shell
│   ├── css/
│   │   └── style.css      Full UI styling (dark/light themes)
│   └── js/
│       ├── quotes.js      Daily quote selection + display
│       ├── animations.js  Anime.js wrapper utilities
│       ├── notes.js       Note CRUD + localStorage
│       ├── reminders.js   Reminder scheduling + Web Notifications
│       ├── calendar.js    Monthly calendar view
│       ├── ai.js          Claude API integration helpers
│       └── app.js         Main controller (state, events, rendering)
└── docs/
    ├── PLANNING.md        (this file)
    ├── BRD.md
    ├── RELEASE_NOTES.md
    └── BUG_REPORT.md
```

---

## Data Model

### Note object (stored in localStorage as JSON array)

| Field       | Type                                   | Description                        |
|-------------|----------------------------------------|------------------------------------|
| id          | string (UUID)                          | Unique identifier                  |
| title       | string                                 | Note title                         |
| type        | `"note"` \| `"checklist"`             | Content mode                       |
| content     | string (HTML)                          | Rich text content (note mode)      |
| items       | `{id, text, checked}[]`               | Checklist items (checklist mode)   |
| priority    | `"none"` \| `"low"` \| `"medium"` \| `"high"` \| `"urgent"` | Priority level |
| tags        | string[]                               | Tag list                           |
| liked       | boolean                                | Favorited flag                     |
| reminder    | string (ISO) \| null                   | Reminder datetime                  |
| dueDate     | string (YYYY-MM-DD) \| null            | Due date                           |
| color       | string (hex) \| `"none"`              | Note background color              |
| createdAt   | string (ISO)                           | Creation timestamp                 |
| updatedAt   | string (ISO)                           | Last update timestamp              |

---

## Feature Breakdown

### Phase 1 — Core (v1.0)
- [x] Note CRUD (create, read, update, delete)
- [x] Rich text editor (bold, italic, underline, lists, quotes)
- [x] Checklist mode with progress tracking
- [x] Priority levels (None / Low / Medium / High / Urgent)
- [x] Tags (add, remove, filter)
- [x] Like / favorite notes
- [x] Search (real-time, across title + content + tags)
- [x] Sort (by updated, created, title, priority)
- [x] Grid and list layouts
- [x] Note color backgrounds (6 options)
- [x] Export note as Markdown
- [x] Dark / light theme

### Phase 2 — Productivity
- [x] Reminders with Web Notifications API (polling every 30s)
- [x] Due date per note
- [x] Calendar view (monthly, notes shown by date)
- [x] Daily motivational quote (once per day)

### Phase 3 — AI Features
- [x] AI Summarize
- [x] AI Expand Ideas
- [x] AI Extract Tasks
- [x] AI Improve Writing
- [x] AI Chat (context-aware, history-tracked per session)

### Phase 4 — UX Polish
- [x] Anime.js transitions throughout
- [x] Toast notifications
- [x] Keyboard shortcuts (Ctrl+N, Ctrl+F, Ctrl+S, Escape)
- [x] Autosave with debounce
- [x] Responsive layout (mobile-friendly)
- [x] Collapsible sidebar

---

## Keyboard Shortcuts

| Shortcut       | Action              |
|----------------|---------------------|
| Ctrl/Cmd + N   | New note            |
| Ctrl/Cmd + F   | Focus search        |
| Ctrl/Cmd + S   | Force save          |
| Escape         | Close panel/modal   |
| Enter (checklist) | Add new item    |
| Backspace (empty checklist item) | Remove item |

---

## Technology Decisions

| Decision | Choice | Reason |
|---|---|---|
| AI model | claude-haiku-4-5 | Fast, cost-effective for real-time features |
| Animations | anime.js 3.x | Lightweight, powerful, no-framework |
| Storage | localStorage | No backend DB needed; privacy-first |
| Styling | Vanilla CSS + custom properties | Zero dependencies, fully custom |
| Fonts | Inter + Space Grotesk | Clean, modern, free |
| Icons | RemixIcon | Complete, free, CDN |
| Markdown export | Native Blob API | No library needed |

---

## Future Roadmap

- [ ] Cloud sync (optional account)
- [ ] Collaborative notes
- [ ] AI-suggested tags
- [ ] Voice-to-note
- [ ] PWA (installable, offline support)
- [ ] Note templates
- [ ] Nested notebooks/folders
- [ ] Graph view of linked notes
