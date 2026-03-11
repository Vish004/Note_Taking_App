/* ============================================================
   ai.js — Claude AI integration via local backend proxy
   ============================================================ */

const AI = (() => {
  const ENDPOINT = '/api/ai';

  async function call(system, userMessage, apiKey, maxTokens = 1024) {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;

    const res = await fetch(ENDPOINT, {
      method:  'POST',
      headers,
      body: JSON.stringify({
        system,
        messages: [{ role: 'user', content: userMessage }],
        max_tokens: maxTokens,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI request failed');
    return data.result;
  }

  // ---------- Quick actions ----------

  async function summarize(noteContent, apiKey) {
    const system = 'You are a note-taking assistant. Summarize the given note concisely (3-5 sentences max). Be clear and direct.';
    return call(system, noteContent, apiKey);
  }

  async function expand(noteContent, apiKey) {
    const system = 'You are a creative writing assistant. Expand and enrich the given note with additional ideas, context, and details. Keep the same tone and style.';
    return call(system, noteContent, apiKey, 1500);
  }

  async function extractTasks(noteContent, apiKey) {
    const system = 'Extract all action items and tasks from the given note. Format them as a simple numbered list. If no tasks found, say so clearly.';
    return call(system, noteContent, apiKey);
  }

  async function improve(noteContent, apiKey) {
    const system = 'You are a professional editor. Improve the clarity, structure, and grammar of this note while preserving its meaning and the author\'s voice. Return only the improved text.';
    return call(system, noteContent, apiKey, 2000);
  }

  async function chat(noteContent, userQuestion, history, apiKey) {
    const system = `You are a helpful assistant for the following note. Answer questions about it, provide insights, and help the user think through ideas related to the content.

NOTE CONTENT:
${noteContent}`;

    // Build messages array with history
    const messages = [
      ...history,
      { role: 'user', content: userQuestion }
    ];

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ system, messages, max_tokens: 1024 }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI request failed');
    return data.result;
  }

  // ---------- UI helpers ----------

  function getApiKey() {
    return localStorage.getItem('noteflow_api_key') || '';
  }

  function showLoading(messagesEl) {
    const el = document.createElement('div');
    el.className = 'ai-msg ai';
    el.id = 'ai-loading-indicator';
    el.innerHTML = `
      <div class="ai-msg-label">AI</div>
      <div class="ai-msg-content">
        <div class="ai-loading">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function removeLoading() {
    const el = document.getElementById('ai-loading-indicator');
    if (el) el.remove();
  }

  function appendMessage(messagesEl, role, text) {
    const el = document.createElement('div');
    el.className = `ai-msg ${role}`;
    el.innerHTML = `
      <div class="ai-msg-label">${role === 'user' ? 'You' : 'AI'}</div>
      <div class="ai-msg-content">${escHtml(text)}</div>
    `;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    Anim.fadeInUp(el, 0, 240);
    return el;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  return {
    summarize,
    expand,
    extractTasks,
    improve,
    chat,
    getApiKey,
    showLoading,
    removeLoading,
    appendMessage,
  };
})();
