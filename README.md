# NoteFlow — AI-Powered Note Taking App

> A beautiful, fully-featured note-taking web app powered by Claude AI — with reminders, calendar, checklists, priorities, and smooth anime transitions.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D10.x-green.svg)
![Version](https://img.shields.io/badge/version-1.0.0-purple.svg)

---

## Features

- **Rich Text Notes** — Bold, italic, underline, lists, blockquotes, dividers
- **Checklist Mode** — Toggle any note to a task list with progress tracking
- **AI Assistant** — Summarize, expand, extract tasks, improve writing, and chat (powered by Claude)
- **Priority Levels** — None / Low / Medium / High / Urgent with color-coded cards
- **Tags & Favorites** — Organize and filter notes your way
- **Reminders** — Browser push notifications at your chosen time
- **Calendar View** — Monthly view with notes pinned to dates
- **Daily Quote** — One motivational quote shown each morning
- **Dark / Light Theme** — Instant theme switching
- **Anime Transitions** — Smooth, purposeful animations throughout
- **Server Persistence** — Notes saved to `data/notes.json`, survive browser clears and laptop restarts
- **Export** — Download any note as Markdown

---

## Quick Start

### Prerequisites
- Node.js 10+ (Node 20 recommended)
- An [Anthropic API key](https://console.anthropic.com/) *(optional — only needed for AI features)*

### Installation

```bash
# Clone the repo
git clone https://github.com/Vish004/Note_Taking_App.git
cd Note_Taking_App

# Install dependencies
npm install

# (Optional) Set your Anthropic API key
cp .env.example .env
# Edit .env and add: ANTHROPIC_API_KEY=sk-ant-...

# Start the app
npm start
```

Open **http://localhost:3000** in your browser.

### Auto-start on login (Linux)

```bash
# Install as a systemd user service
mkdir -p ~/.config/systemd/user
cp noteflow.service.example ~/.config/systemd/user/noteflow.service
# Edit the WorkingDirectory path if needed
systemctl --user daemon-reload
systemctl --user enable --now noteflow
```

---

## Project Structure

```
Note_Taking_App/
├── server.js              Express server + notes API + AI proxy
├── package.json
├── .env.example           Environment variable template
├── public/
│   ├── index.html         Single-page app shell
│   ├── css/
│   │   └── style.css      Full UI (dark/light themes, responsive)
│   └── js/
│       ├── app.js         Main controller — state, events, rendering
│       ├── notes.js       Note CRUD with server sync + localStorage fallback
│       ├── ai.js          Claude API integration
│       ├── calendar.js    Monthly calendar view
│       ├── reminders.js   Reminder scheduling + Web Notifications
│       ├── quotes.js      Daily quote logic
│       └── animations.js  Anime.js wrapper utilities
├── data/                  Auto-created; stores notes.json (git-ignored)
├── docs/
│   ├── PLANNING.md        Architecture and roadmap
│   ├── BRD.md             Business requirements
│   ├── RELEASE_NOTES.md   Changelog
│   └── BUG_REPORT.md      Known issues and fixes
└── .github/
    └── workflows/
        └── ci.yml         GitHub Actions CI/CD pipeline
```

---

## CI/CD Pipeline

GitHub Actions runs on every push to `main` or `develop`:

| Job | Checks |
|-----|--------|
| **Lint & Validate** | JS syntax check, required file verification |
| **API Integration Tests** | Full CRUD test suite against live server |
| **Security Audit** | `npm audit` + no hardcoded secrets check |
| **Deploy Ready** | Summary report on successful `main` push |

---

## API Reference

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notes` | Get all notes |
| `POST` | `/api/notes` | Create a note |
| `PUT` | `/api/notes/:id` | Update a note |
| `DELETE` | `/api/notes/:id` | Delete a note |

### AI Proxy

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai` | Proxy to Anthropic Claude API |

Pass your API key via `X-Api-Key` header or set `ANTHROPIC_API_KEY` in `.env`.

---

## Note Data Model

```json
{
  "id":        "uuid",
  "title":     "string",
  "type":      "note | checklist",
  "content":   "HTML string (note mode)",
  "items":     [{ "id": "uuid", "text": "string", "checked": false }],
  "priority":  "none | low | medium | high | urgent",
  "tags":      ["string"],
  "liked":     false,
  "reminder":  "ISO date | null",
  "dueDate":   "YYYY-MM-DD | null",
  "color":     "hex | none",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | New note |
| `Ctrl + F` | Focus search |
| `Ctrl + S` | Force save |
| `Escape` | Close panel / modal |
| `Enter` (checklist) | Add new item |

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

- [Anthropic Claude](https://anthropic.com) — AI engine
- [Anime.js](https://animejs.com) — Animations
- [RemixIcon](https://remixicon.com) — Icons
- [Inter](https://rsms.me/inter/) + [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) — Fonts
