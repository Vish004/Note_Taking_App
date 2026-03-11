# Contributing to NoteFlow

Thank you for your interest in contributing! Here's how to get started.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Note_Taking_App.git
   cd Note_Taking_App
   ```
3. **Install dependencies**: `npm install`
4. **Run the app**: `npm start` → open http://localhost:3000

## Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes, then test
npm start

# Commit with a clear message
git commit -m "feat: add your feature description"

# Push and open a Pull Request
git push origin feature/your-feature-name
```

## Code Style

- Vanilla JS (no frameworks) — keep it lightweight
- CommonJS `require()` on the server; plain `<script>` tags on the client
- CSS custom properties for all colours and spacing
- Comments for non-obvious logic only

## What to Work On

Check the [issues](https://github.com/Vish004/Note_Taking_App/issues) page. Good first issues are tagged `good first issue`.

Some ideas from the roadmap:
- PWA support (service worker + manifest)
- Note templates
- Drag-to-reorder notes
- Graph/link view between notes
- Voice-to-note

## Pull Request Guidelines

- One feature/fix per PR
- Include a short description of what changed and why
- If fixing a bug, reference the issue number
- Ensure `npm start` runs without errors before submitting

## Reporting Bugs

Open an issue with:
1. What you did
2. What you expected
3. What actually happened
4. Browser + OS version

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
