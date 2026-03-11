const express = require('express');
const path    = require('path');
const https   = require('https');
const fs      = require('fs');

// Load .env manually (no dotenv dependency needed)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && k.trim() && !k.trim().startsWith('#')) {
      process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- Notes storage ----
var DATA_DIR   = path.join(__dirname, 'data');
var NOTES_FILE = path.join(DATA_DIR, 'notes.json');
var writeLock  = false;

if (!fs.existsSync(DATA_DIR))   fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(NOTES_FILE)) fs.writeFileSync(NOTES_FILE, '[]', 'utf8');

function readNotes() {
  try { return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8')); }
  catch(e) { return []; }
}

function writeNotes(notes, cb) {
  if (writeLock) return setTimeout(function(){ writeNotes(notes, cb); }, 50);
  writeLock = true;
  var tmp = NOTES_FILE + '.tmp';
  fs.writeFile(tmp, JSON.stringify(notes, null, 2), 'utf8', function(err) {
    if (err) { writeLock = false; return cb(err); }
    fs.rename(tmp, NOTES_FILE, function(err2) { writeLock = false; cb(err2 || null); });
  });
}

app.get('/api/notes', function(_req, res) {
  res.json(readNotes());
});

app.post('/api/notes', function(req, res) {
  var note = req.body;
  if (!note || !note.id) return res.status(400).json({ error: 'Invalid note' });
  var notes = readNotes();
  if (notes.some(function(n){ return n.id === note.id; }))
    return res.status(409).json({ error: 'Note already exists' });
  notes.unshift(note);
  writeNotes(notes, function(err) {
    if (err) return res.status(500).json({ error: 'Save failed' });
    res.status(201).json(note);
  });
});

app.put('/api/notes/:id', function(req, res) {
  var notes = readNotes();
  var idx   = notes.findIndex(function(n){ return n.id === req.params.id; });
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  notes[idx] = Object.assign({}, notes[idx], req.body, { updatedAt: new Date().toISOString() });
  writeNotes(notes, function(err) {
    if (err) return res.status(500).json({ error: 'Save failed' });
    res.json(notes[idx]);
  });
});

app.delete('/api/notes/:id', function(req, res) {
  var notes = readNotes();
  var next  = notes.filter(function(n){ return n.id !== req.params.id; });
  if (next.length === notes.length) return res.status(404).json({ error: 'Not found' });
  writeNotes(next, function(err) {
    if (err) return res.status(500).json({ error: 'Delete failed' });
    res.json({ ok: true });
  });
});

// AI proxy — forwards requests to Anthropic API
app.post('/api/ai', (req, res) => {
  const apiKey = req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(400).json({
      error: 'No API key provided. Add one in Settings or set ANTHROPIC_API_KEY in .env.'
    });
  }

  const { system, messages, max_tokens = 1024 } = req.body;
  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens,
    system,
    messages
  });

  const options = {
    hostname: 'api.anthropic.com',
    path:     '/v1/messages',
    method:   'POST',
    headers: {
      'Content-Type':      'application/json',
      'Content-Length':    Buffer.byteLength(body),
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01'
    }
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', chunk => { data += chunk; });
    response.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (response.statusCode !== 200) {
          return res.status(response.statusCode).json({
            error: (parsed.error && parsed.error.message) || 'AI request failed'
          });
        }
        res.json({ result: parsed.content[0].text });
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse AI response' });
      }
    });
  });

  request.on('error', (err) => {
    console.error('AI proxy error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  });

  request.write(body);
  request.end();
});

// Fallback: serve index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NoteFlow running at http://localhost:${PORT}`);
});
