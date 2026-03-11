# NoteFlow — Business Requirements Document (BRD)

**Version:** 1.0
**Date:** 2026-03-10
**Status:** Approved

---

## 1. Executive Summary

NoteFlow is an AI-powered, browser-based note-taking application designed to maximize personal productivity. It combines modern note management features (rich text, checklists, priorities, reminders, calendar) with the intelligence of Claude AI (summarization, expansion, task extraction, writing improvement). The application requires no account, stores all data locally in the browser, and is accessible via a simple `npm start` command.

---

## 2. Business Objectives

| ID  | Objective |
|-----|-----------|
| BO1 | Provide a fast, distraction-free environment for capturing ideas |
| BO2 | Leverage AI to reduce time spent organizing and refining notes |
| BO3 | Ensure data privacy (local storage, no cloud by default) |
| BO4 | Deliver a world-class UI/UX that users want to open every day |
| BO5 | Support daily productivity workflows (reminders, due dates, priorities) |

---

## 3. Stakeholders

| Role | Description |
|------|-------------|
| End User | Individual using the app for personal productivity |
| Developer | Person maintaining and extending the codebase |
| AI Provider | Anthropic (Claude API) |

---

## 4. Functional Requirements

### 4.1 Note Management

| ID   | Requirement | Priority |
|------|-------------|----------|
| FR01 | Create, edit, and delete notes | Must Have |
| FR02 | Rich text formatting (bold, italic, underline, lists, blockquote) | Must Have |
| FR03 | Checklist mode with check/uncheck and progress display | Must Have |
| FR04 | Auto-save notes while typing (max 800ms debounce) | Must Have |
| FR05 | Real-time search across title, content, and tags | Must Have |
| FR06 | Sort notes by: recently updated, created, title, priority | Must Have |
| FR07 | Export note as Markdown file | Should Have |
| FR08 | Note color coding (6 background colors) | Nice to Have |

### 4.2 Organization

| ID   | Requirement | Priority |
|------|-------------|----------|
| FR09 | Assign priority levels: None / Low / Medium / High / Urgent | Must Have |
| FR10 | Add/remove tags per note; filter notes by tag | Must Have |
| FR11 | Mark notes as favorites; view favorites separately | Must Have |
| FR12 | Assign due dates to notes; view in calendar | Must Have |
| FR13 | Grid and list layout views | Should Have |
| FR14 | Sidebar collapse for more writing space | Nice to Have |

### 4.3 Reminders

| ID   | Requirement | Priority |
|------|-------------|----------|
| FR15 | Set a reminder datetime per note | Must Have |
| FR16 | Deliver browser push notification when reminder fires | Must Have |
| FR17 | Show overdue reminders highlighted in the Reminders view | Must Have |
| FR18 | Clear or update reminders from the editor | Must Have |

### 4.4 Calendar

| ID   | Requirement | Priority |
|------|-------------|----------|
| FR19 | Monthly calendar view with note dots per day | Must Have |
| FR20 | Navigate months (prev/next/today) | Must Have |
| FR21 | Click day to see associated notes | Must Have |
| FR22 | Notes associated by: due date, reminder date, creation date | Should Have |

### 4.5 AI Features

| ID   | Requirement | Priority |
|------|-------------|----------|
| FR23 | Summarize note content (3-5 sentences) | Must Have |
| FR24 | Expand note with additional ideas | Must Have |
| FR25 | Extract action items / tasks as a numbered list | Must Have |
| FR26 | Improve writing clarity and grammar | Must Have |
| FR27 | Free-form AI chat with context of current note | Must Have |
| FR28 | AI panel is collapsible; does not clutter the editor | Must Have |
| FR29 | User provides their own Anthropic API key via Settings | Must Have |

### 4.6 Daily Quote

| ID   | Requirement | Priority |
|------|-------------|----------|
| FR30 | Show one motivational quote per day on first open | Must Have |
| FR31 | User can disable the daily quote in Settings | Should Have |
| FR32 | Quote is deterministic for the day (same quote if reopened) | Should Have |

### 4.7 Settings & Theming

| ID   | Requirement | Priority |
|------|-------------|----------|
| FR33 | Dark and light theme with instant switching | Must Have |
| FR34 | Store and display user's Anthropic API key (locally only) | Must Have |
| FR35 | Toggle daily quote on/off | Should Have |

---

## 5. Non-Functional Requirements

| ID   | Requirement | Target |
|------|-------------|--------|
| NFR01 | Page load time | < 2 seconds on localhost |
| NFR02 | Search response time | < 300ms (client-side) |
| NFR03 | Autosave delay | ≤ 800ms after last keystroke |
| NFR04 | AI response time | Depends on Anthropic API; typically 1–4s |
| NFR05 | Mobile responsiveness | Functional on 375px+ screens |
| NFR06 | Browser support | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ |
| NFR07 | No external data leakage | Notes never leave the device (except AI content sent to Anthropic) |
| NFR08 | Accessibility | Keyboard-navigable; meaningful ARIA labels on interactive elements |

---

## 6. Constraints

- No user authentication or cloud sync in v1.0
- Data is stored in `localStorage` (5–10 MB limit per origin)
- AI features require an internet connection and a valid Anthropic API key
- Browser Notifications API requires user permission

---

## 7. Assumptions

- Users are running a modern desktop or mobile browser
- Users have Node.js 18+ installed to run the dev server
- AI-powered features are optional enhancements, not core requirements
- A single user per browser instance

---

## 8. Out of Scope (v1.0)

- Multi-user / collaboration
- End-to-end encryption
- Native mobile application
- Offline AI (on-device model)
- Third-party integrations (Notion, Slack, etc.)
- Note version history
