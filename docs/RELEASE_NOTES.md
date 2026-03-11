# NoteFlow — Release Notes

---

## v1.0.0 — Initial Release
**Date:** 2026-03-10

### Overview
First public release of NoteFlow — a full-featured, AI-powered note-taking web application built with Node.js, Express, and Vanilla JS.

---

### New Features

#### Core Notes
- **Rich text editor** — Bold, italic, underline, strikethrough, ordered/unordered lists, blockquotes, dividers via `execCommand`
- **Checklist mode** — Toggle any note to a task checklist; items can be checked/unchecked; progress counter shown in toolbar
- **Auto-save** — Notes save automatically 800ms after last keystroke; visual "Saved" indicator in footer
- **Note cards** — Grid and list layout views; cards show title, preview, tags, date, priority strip, like status

#### Organization
- **Priority levels** — None / Low / Medium / High / Urgent (color-coded border and badge per card)
- **Tags** — Add multiple tags per note; filter by tag from sidebar tag cloud
- **Favorites** — Heart any note; view all favorites in the Favorites nav section
- **Due dates** — Assign a due date; appears on calendar
- **Note colors** — 6 background color options (Navy, Forest, Crimson, Purple, Teal, Default)
- **Sort** — Sort by recently updated, recently created, title A–Z, or priority

#### Search
- **Real-time search** — Searches across title, content (stripped HTML), tags, and checklist items; ≤300ms debounce
- **Search clear** — One-click clear button in search bar

#### Reminders
- **Set / clear reminders** — Datetime picker in reminder modal per note
- **Browser push notifications** — Fires via Web Notifications API at the specified time (polled every 30s)
- **Overdue indicator** — Overdue reminders shown with red "Overdue" label in Reminders view
- **Reminders view** — Dedicated sidebar section listing all upcoming and past reminders

#### Calendar
- **Monthly calendar** — Navigate months forward/backward; jump to today
- **Note indicators** — Colored dots on dates where notes are due, have reminders, or were created
- **Day notes panel** — Click any day to see associated notes below the calendar
- **Open from calendar** — Click a note card in the day panel to open it in the editor

#### AI Assistant (requires Anthropic API key)
- **Summarize** — 3–5 sentence summary of current note
- **Expand Ideas** — AI enriches the note with additional context and ideas
- **Extract Tasks** — Numbered list of action items found in the note
- **Improve Writing** — Clarity, grammar, and structure improvements
- **AI Chat** — Context-aware free-form conversation about the current note; session history maintained
- **Collapsible panel** — AI panel slides in below the editor; can be hidden at any time

#### Daily Quote
- **Morning motivation** — One quote shown per day on first app open
- **Deterministic** — Same quote all day; changes daily
- **Dismissable** — Click "Start Your Day" or click outside to dismiss; won't reappear until tomorrow
- **Configurable** — Can be disabled in Settings

#### Settings
- **API key** — Enter Anthropic API key; stored in `localStorage`; masked by default
- **Dark / Light theme** — Instant switching via CSS custom properties
- **Show/hide daily quote** — Toggle in Settings

#### UX & Animations
- **Anime.js transitions** — Fade-in-up on note cards (staggered), slide-in-right for editor panel, pop-in for modals, heartbeat on like, bounce loading dots for AI
- **Toast notifications** — Non-blocking notifications for all user actions
- **Keyboard shortcuts** — Ctrl+N (new note), Ctrl+F (search), Ctrl+S (save), Escape (close)
- **Collapsible sidebar** — Collapse to icon-only mode for more screen space
- **Responsive design** — Sidebar becomes mobile drawer; editor takes full screen on small viewports
- **Export** — Export note as a `.md` Markdown file

---

### Technical Details

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 18+ |
| Server | Express 4.x |
| AI Proxy | Fetch to `api.anthropic.com/v1/messages` |
| AI Model | `claude-haiku-4-5-20251001` |
| Storage | Browser `localStorage` |
| Animations | Anime.js 3.2.2 (CDN) |
| Icons | RemixIcon 4.2 (CDN) |
| Fonts | Inter + Space Grotesk (Google Fonts CDN) |

---

### Known Limitations (v1.0)

- `localStorage` has a ~5–10 MB browser limit; extremely large note collections may require cleanup
- `document.execCommand()` used for rich text formatting is deprecated in spec but universally supported
- Browser notifications require HTTPS in production (localhost works without it)
- AI features require an active internet connection and valid API key
- No cloud sync; notes are browser-local only

---

### Getting Started

```bash
cd note_taking_app
cp .env.example .env          # optional: add ANTHROPIC_API_KEY
npm install
npm start
# Open http://localhost:3000
```

To use AI features, open Settings (gear icon) and enter your Anthropic API key, or set `ANTHROPIC_API_KEY` in `.env`.
