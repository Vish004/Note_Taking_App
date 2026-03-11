/* ============================================================
   quotes.js — Daily quote display
   Shows once per day (tracks last-shown date in localStorage)
   ============================================================ */

const Quotes = (() => {
  const QUOTES = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "An unexamined life is not worth living.", author: "Socrates" },
    { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
    { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
    { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
    { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
    { text: "The mind is everything. What you think you become.", author: "Buddha" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi" },
    { text: "If you want to live a happy life, tie it to a goal, not to people or things.", author: "Albert Einstein" },
    { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { text: "Great things are not done by impulse, but by a series of small things brought together.", author: "Vincent Van Gogh" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
    { text: "Act as if what you do makes a difference. It does.", author: "William James" },
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "With the new day comes new strength and new thoughts.", author: "Eleanor Roosevelt" },
    { text: "Problems are not stop signs, they are guidelines.", author: "Robert H. Schuller" },
  ];

  const STORAGE_KEY = 'noteflow_last_quote_date';
  const STORAGE_QUOTE_KEY = 'noteflow_last_quote_idx';

  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }

  function getDailyQuote() {
    const today = todayStr();
    const lastDate = localStorage.getItem(STORAGE_KEY);

    let idx;
    if (lastDate === today) {
      // Same day — reuse same quote
      idx = parseInt(localStorage.getItem(STORAGE_QUOTE_KEY) || '0', 10);
    } else {
      // New day — pick a deterministic-but-varied index based on date
      const seed = today.replace(/-/g, '');
      idx = parseInt(seed, 10) % QUOTES.length;
      localStorage.setItem(STORAGE_KEY, today);
      localStorage.setItem(STORAGE_QUOTE_KEY, String(idx));
    }

    return QUOTES[idx];
  }

  function shouldShow(settings) {
    if (!settings.showQuote) return false;
    const lastSeen = localStorage.getItem('noteflow_quote_seen');
    return lastSeen !== todayStr();
  }

  function markSeen() {
    localStorage.setItem('noteflow_quote_seen', todayStr());
  }

  function show(onClose) {
    const quote = getDailyQuote();
    const overlay = document.getElementById('quote-overlay');
    const textEl   = document.getElementById('quote-text');
    const authorEl = document.getElementById('quote-author');
    const dateEl   = document.getElementById('quote-date');
    const closeBtn = document.getElementById('close-quote');

    textEl.textContent   = quote.text;
    authorEl.textContent = quote.author;
    dateEl.textContent   = new Date().toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    overlay.classList.remove('hidden');

    // Animate in
    if (window.anime) {
      const card = document.getElementById('quote-card');
      anime({
        targets: card,
        opacity:    [0, 1],
        scale:      [0.85, 1],
        duration:   600,
        easing:     'easeOutBack',
      });
    }

    function close() {
      markSeen();
      if (window.anime) {
        const card = document.getElementById('quote-card');
        anime({
          targets:  card,
          opacity:  [1, 0],
          scale:    [1, 0.9],
          duration: 300,
          easing:   'easeInCubic',
          complete: () => { overlay.classList.add('hidden'); onClose && onClose(); }
        });
      } else {
        overlay.classList.add('hidden');
        onClose && onClose();
      }
    }

    closeBtn.addEventListener('click', close, { once: true });
    // Click outside the card to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    }, { once: true });
  }

  return { show, shouldShow, getDailyQuote };
})();
