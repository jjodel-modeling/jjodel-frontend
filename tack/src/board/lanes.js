// Tack board, Lanes view: drawn from /api/lanes only, the board's first tab. Tiles, the lanes that need
// attention, the running cards, the last 24 hours, the lanes by state, and the lanes that reported unattended
// decisions. Adapted from Jjodel's lane board (port 4700): the same tiles and cards; the phase ladder and the
// architect-chat tokens are shown disabled with their reason (discovery 2026-10-19, Tack Lanes page, §2).
// Slice 9: the waiting lanes are cards above the running ones, with what it takes to answer them (the reason, the
// Recommended: line, the chat), and a banner «N lanes waiting» that scrolls to them, or shows the one card.
// html(), runningCard(), waitingCard(), banner() and poller() are pure (test/lanes-view.test.mjs runs them in a vm).
'use strict';
(function (root) {
  const C = root.TackCharts, B = root.TackBoard;
  const esc = C.esc;

  const PHASE_REASON = 'Phase progress is not tracked in v0: the milestones are specific to the repository\'s gate commands';
  const ARCH_REASON = 'Architect-chat tokens are not collected in v0';
  const LAUNCH_NOTE = 'Launched by: the Chat: line of the prompt header; commit trailers are not read';
  const EVERY_MS = 20_000;

  const k = (n) => (n === null || n === undefined ? '–' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(n));
  const mins = (ms) => (ms === null || ms === undefined ? '–' : B.dur(Math.round(ms / 60000)));
  const clock = (ms) => (ms === null || ms === undefined ? '–' : B.hhmm(new Date(ms).toISOString()));
  const ago = (ms, now) => (ms === null || ms === undefined ? '–' : mins(now - ms) + ' ago');
  const disabled = (label, reason) => '<span class="ln-dis" title="' + esc(reason) + '" aria-label="' + esc(label + ': ' + reason) + '">' + esc(label) + '</span>';
  const OUTCOME_CLASS = { done: 'ln-done', question: 'ln-wait', 'hard-stop': 'ln-hs', breakpoint: 'ln-bp', ceiling: 'ln-ceil', blocked: 'ln-block' };
  // The three stops behind Outcome: hard-stop (the collector's stop_kind); the tooltip says what each means.
  const STOP_TIPS = {
    breakpoint: 'Breakpoint: a stop the prompt planned (its HARD STOP section). Nothing went wrong; the lane waits for a GO.',
    ceiling: 'Ceiling: the session hit the context ceiling and wrote a handoff. The work continues in a new lane.',
    'hard-stop': 'Hard-stop: an unplanned stop. Look at the lane.',
  };
  const AUTO_TIP = 'auto: every resume of this lane was sent in /lane auto (the message starts with [auto]), so its breakpoints did not stop for Alfonso. Resumes before the marker existed carry none and get no pill.';
  /** The outcome pill: a final hard-stop shows its kind (breakpoint, ceiling, hard-stop), and auto follows when all resumes were auto. */
  const outcome = (o, stopKind, auto) => {
    const label = o === 'hard-stop' ? stopKind || 'hard-stop' : o;
    return '<span class="tag ' + (OUTCOME_CLASS[label] || '') + '"' + (STOP_TIPS[label] ? ' title="' + esc(STOP_TIPS[label]) + '"' : '') + '>' + esc(label || 'none') + '</span>' +
      (auto ? ' <span class="tag ln-auto" title="' + esc(AUTO_TIP) + '">auto</span>' : '');
  };
  const PLURAL = { question: 'questions', breakpoint: 'breakpoints', ceiling: 'ceilings', 'hard-stop': 'hard-stops' };
  /** Waiting lanes by what they wait on: «2 breakpoints · 1 hard-stop», zero kinds left out; null when none. */
  const waitText = (by) => {
    const parts = ['breakpoint', 'ceiling', 'hard-stop', 'question'].filter((x) => by && by[x]).map((x) => by[x] + ' ' + (by[x] === 1 ? x : PLURAL[x]));
    return parts.length ? parts.join(' · ') : null;
  };
  const launcher = (c) => (c.chat ? '<span class="mono" title="' + esc(LAUNCH_NOTE) + '">' + esc(c.chat) + '</span>' : '<span class="dim" title="' + esc(LAUNCH_NOTE) + '">—</span>');
  const badges = (c) => (c.kind ? '<span class="tag">' + esc(c.kind) + '</span>' : '') + (c.tier ? '<span class="tag">' + esc(c.tier) + '</span>' : '') +
    (c.direct ? '<span class="tag" title="A direct merge: no Claude session">direct</span>' : '') + (c.critical ? '<span class="tag ln-block" title="Critical zone">critical</span>' : '');
  const base = (p) => (p ? p.split(/[\\/]/).filter(Boolean).pop() : null);
  const pad = (n) => String(n).padStart(2, '0');
  /** Local YYYY-MM-DD HH:MM. */
  const stamp = (ms) => { const d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };

  // The pill of a waiting card says what the answer is; the class keeps the colour of the stop kind.
  const WAIT_TIPS = {
    GO: 'GO: the lane stopped where its prompt planned (a breakpoint); it continues on a GO.',
    answer: 'answer: the lane asks a question; it continues on the answer.',
    ACK: 'ACK: the session hit the context ceiling and wrote a handoff; the continuation needs a go.',
    'hard-stop': 'hard-stop: an unplanned stop; look at the lane.',
  };
  const PILL_CLASS = { GO: 'ln-bp', answer: 'ln-wait', ACK: 'ln-ceil', 'hard-stop': 'ln-hs' };
  const CHAT_NOTE = 'The chat that must answer: the Request: line of the prompt, else the Claude-Session: trailer of the commit that added it';

  /** A waiting lane: id, wait pill, title, the reason, the Recommended: line set apart, waiting since, the chat that answers. */
  function waitingCard(c, now) {
    const w = c.wait || {};
    const pill = w.pill || 'hard-stop';
    const who = c.chat || (w.chatUrl ? 'chat' : '—');
    const chat = w.chatUrl ? '<a class="mono ln-chat" href="' + esc(w.chatUrl) + '" target="_blank" rel="noopener noreferrer" title="' + esc(CHAT_NOTE) + '">' + esc(who) + '</a>'
      : '<span class="mono ln-chat" title="' + esc(CHAT_NOTE + '; no URL resolves') + '">' + esc(who) + '</span>';
    return '<section class="in-card ln-card ln-wcard" data-id="' + esc(c.id) + '" aria-label="' + esc(c.id + ' waits: ' + pill) + '">' +
      '<h3><span class="mono">' + esc(c.id) + '</span><span class="tag ' + (PILL_CLASS[pill] || '') + '" title="' + esc(WAIT_TIPS[pill] || '') + '">' + esc(pill) + '</span>' +
      (c.auto ? '<span class="tag ln-auto" title="' + esc(AUTO_TIP) + '">auto</span>' : '') + badges(c) + '</h3>' +
      '<div class="sub">' + esc(c.title || '(no title)') + '</div>' +
      (w.reason ? '<p class="ln-why">' + esc(w.reason) + '</p>' : '<p class="ln-why dim">No closing message to quote.</p>') +
      (w.recommended ? '<p class="ln-rec"><span class="kl">Recommended</span>' + esc(w.recommended) + '</p>' : '') +
      '<div class="ln-facts"><span title="' + esc(w.since ? stamp(w.since) : '') + '">waiting ' + esc(mins(w.since ? now - w.since : null)) + ' · since ' + esc(w.since ? stamp(w.since) : '–') + '</span>' +
      '<span>answer in ' + chat + '</span></div></section>';
  }

  /** The banner over the page: «N lanes waiting» scrolling to the cards; exactly one waiting lane, the banner shows its card. '' for none. */
  function banner(cards, by, now) {
    if (!cards || !cards.length) return '';
    if (cards.length === 1) return '<div class="ln-banner ln-one" role="status"><div class="ln-bh">1 lane waiting</div>' + waitingCard(cards[0], now) + '</div>';
    return '<button type="button" class="ln-banner" data-scroll="ln-waiting" role="status">' + cards.length + ' lanes waiting' +
      (waitText(by) ? '<span class="dim"> · ' + esc(waitText(by)) + '</span>' : '') + '</button>';
  }

  /** A running lane: id, kind and tier, title, elapsed work against the median of its kind (when there is one). */
  function runningCard(c, now) {
    const median = c.medianMs ? '<span class="dim"> / median ' + esc(mins(c.medianMs)) + '</span>' : '';
    return '<section class="in-card ln-card" data-id="' + esc(c.id) + '" aria-label="' + esc(c.id) + '">' +
      '<h3><span class="mono">' + esc(c.id) + '</span>' + badges(c) + '</h3>' +
      '<div class="sub">' + esc(c.title || '(no title)') + '</div>' +
      '<div class="ln-facts">' +
      '<span title="Work: the sum of the turns">' + esc(mins(c.workMs)) + median + '</span>' +
      (c.overLimit ? '<span class="ln-block">over the time limit</span>' : '') +
      '<span>started ' + esc(clock(c.started)) + '</span>' +
      '<span title="Tokens in: input + cache read + cache write over the main-thread calls">' + esc(k(c.tokensIn)) + ' in</span>' +
      '<span title="Largest main-thread context">peak ' + esc(k(c.contextPeak)) + '</span>' +
      (c.worktree ? '<span class="mono" title="' + esc(c.worktree) + '">' + esc(base(c.worktree)) + '</span>' : '') +
      '<span>by ' + launcher(c) + '</span>' +
      disabled('Phase —', PHASE_REASON) +
      '</div></section>';
  }

  const attnRow = (c, now, closure) => '<li data-id="' + esc(c.id) + '" title="' + esc(closure) + '"><span class="mono">' + esc(c.id) + '</span>' + outcome(c.lastOutcome, c.stopKind, c.auto) +
    '<span class="ln-t">' + esc(c.title || '') + '</span><span class="dim">' + esc(ago(c.end ?? c.started, now)) + '</span></li>';

  function lastRow(c, now) {
    return '<tr data-id="' + esc(c.id) + '"><td class="c ln-id">' + esc(c.id) + '</td><td>' + (c.kind ? esc(c.kind) : '<span class="dim">–</span>') + '</td><td class="ln-ti" title="' + esc(c.title || '') + '"><div class="ln-clamp">' + esc(c.title || '') +
      '</div></td><td>' + outcome(c.lastOutcome, c.stopKind, c.auto) + (c.resolved ? ' <span class="tag">resolved</span>' : '') + '</td><td class="n">' + esc(clock(c.started)) + '–' + esc(clock(c.end)) +
      '</td><td class="n r">' + esc(mins(c.workMs)) + '</td><td class="n r">' + esc(mins(c.spanMs)) + '</td><td class="n r">' + esc(k(c.tokensIn)) +
      '</td><td class="n r">' + (c.cost === null ? '<span class="dim">–</span>' : B.usd(c.cost)) + '</td><td class="n r">' + esc(k(c.contextPeak)) +
      '</td><td>' + disabled('–', ARCH_REASON) + '</td><td>' + launcher(c) + '</td></tr>';
  }

  /** The whole view for one /api/lanes payload: the absence sentence alone, or the page. */
  function html(d, now = Date.now()) {
    if (d.state !== 'ok') return '<div class="empty ln-absent">' + esc(d.reason) + '</div>';
    const t = d.tiles;
    const tile = (label, v, sub) => '<div class="kpi"><span class="kl">' + esc(label) + '</span><span class="kv"><b>' + v + '</b><span>' + esc(sub || '') + '</span></span></div>';
    const wc = d.waitingCards || [];
    let out = '<div class="meta ln-upd">Updated ' + esc(d.updatedMs ? clock(d.updatedMs) : '–') + '; the page refreshes every 20 s while it is shown</div>';
    out += banner(wc, t.waitingBy, now);
    out += '<div class="kpis ln-kpis" aria-label="Lanes">' + tile('Running', t.running) + tile('Waiting', t.waiting, waitText(t.waitingBy) || 'question or stop') + tile('Blocked', t.blocked, 'now') +
      tile('Done', t.done24, '24 h') + tile('Resolved', t.resolved24, '24 h') + tile('Spend today', B.usd(t.spendToday)) + '</div>';

    const a = d.attention;
    if (a.waiting.length || a.blocked.length || a.staleCount) {
      out += '<h2 title="' + esc(d.closure) + '">Needs attention<span class="h2n">' + (a.waiting.length + a.blocked.length) + ' open' +
        (waitText(t.waitingBy) ? ' (' + waitText(t.waitingBy) + ')' : '') + (a.staleCount ? ', ' + a.staleCount + ' older than 72 h not listed' : '') + '</span></h2>';
      // The waiting lanes are the cards below; the list keeps the blocked ones.
      if (a.blocked.length) out += '<ul class="ln-attn">' + a.blocked.map((c) => attnRow(c, now, d.closure)).join('') + '</ul>';
    }
    if (wc.length > 1) {
      out += '<h2 id="ln-waiting">Waiting<span class="h2n">' + wc.length + ', longest first</span></h2>';
      out += '<div class="in-grid">' + wc.map((c) => waitingCard(c, now)).join('') + '</div>';
    }

    out += '<h2>Running<span class="h2n">' + d.running.length + '</span></h2>';
    out += d.running.length ? '<div class="in-grid">' + d.running.map((c) => runningCard(c, now)).join('') + '</div>' : '<div class="empty">No lane is running.</div>';

    out += '<h2>Last 24 hours<span class="h2n">' + d.last24.length + '</span></h2>';
    out += d.last24.length ? '<div class="wrap"><table class="sfx ln-tab"><thead><tr><th>Prompt-ID</th><th>Kind</th><th>Title</th><th>Outcome</th><th>Window</th><th class="r" title="The sum of the turns">Work</th><th class="r">Span</th>' +
      '<th class="r">Tokens in</th><th class="r">Cost</th><th class="r">Context</th><th>' + disabled('Arch', ARCH_REASON) + '</th><th title="' + esc(LAUNCH_NOTE) + '">Launched by</th></tr></thead><tbody>' +
      d.last24.map((c) => lastRow(c, now)).join('') + '</tbody></table></div>' : '<div class="empty">No lane ended in the last 24 hours.</div>';

    const groups = [['Running', 'running'], ['Waiting', 'waiting'], ['Blocked', 'blocked'], ['Done', 'done'], ['Resolved', 'resolved'], ['Other', 'other']];
    out += '<h2>By state</h2><div class="ln-states">' + groups.map(([label, key]) => '<div><span class="kl">' + esc(label) + ' · ' + d.byState[key].length + '</span>' +
      d.byState[key].map((id) => '<span class="mono">' + esc(id) + '</span>').join('') + '</div>').join('') + '</div>';

    out += '<h2>Unattended decisions<span class="h2n">as reported in each lane\'s closing message</span></h2>';
    out += d.adoptions.length ? '<div class="wrap"><table class="sfx ln-tab"><thead><tr><th>Prompt-ID</th><th>Front</th><th>Chat</th><th>Ended</th><th class="r">Decisions</th><th>Last outcome</th></tr></thead><tbody>' +
      d.adoptions.map((x) => '<tr><td class="c">' + esc(x.id) + '</td><td>' + esc(x.front || '–') + '</td><td class="c">' + esc(x.chat || '—') + '</td><td class="n">' + esc(ago(x.end, now)) +
        '</td><td class="n r">' + x.count + '</td><td>' + outcome(x.lastOutcome, x.stopKind, x.auto) + '</td></tr>').join('') + '</tbody></table></div>'
      : '<div class="empty">No lane reported an unattended decision.</div>';
    return out;
  }

  /** Calls load every 20 s, and when the page is shown again, only while it is visible and active() holds. */
  function poller({ load, visible, active = () => true, every = EVERY_MS, timers = { setInterval: (fn, ms) => setInterval(fn, ms) } }) {
    const tick = () => { if (!visible() || !active()) return false; load(); return true; };
    return { tick, start() { timers.setInterval(tick, every); return this; } };
  }

  root.TackLanes = { html, runningCard, waitingCard, banner, WAIT_TIPS, poller, waitText, STOP_TIPS, AUTO_TIP, PHASE_REASON, ARCH_REASON, LAUNCH_NOTE };
  if (typeof document === 'undefined') return;

  let box = null;
  let busy = false;
  async function load() {
    if (!box || busy) return;
    busy = true;
    try {
      const repo = new URL(location.href).searchParams.get('repo') || 'all';
      const r = await fetch('/api/lanes?repo=' + encodeURIComponent(repo), { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || r.status);
      box.innerHTML = html(d);
    } catch (e) {
      document.getElementById('err').textContent = 'Could not load the lanes: ' + e.message;
    } finally {
      busy = false;
    }
  }
  const scroll = (e) => {
    const b = e.target.closest && e.target.closest('[data-scroll]');
    const to = b && document.getElementById(b.getAttribute('data-scroll'));
    if (to) to.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  root.TackViews.lanes = { render: (state, el) => { if (box !== el) el.addEventListener('click', scroll); box = el; load(); } };
  const p = poller({ load, visible: () => document.visibilityState === 'visible', active: () => B.state && B.state.tab === 'lanes' }).start();
  document.addEventListener('visibilitychange', p.tick);
})(typeof window !== 'undefined' ? window : globalThis);
