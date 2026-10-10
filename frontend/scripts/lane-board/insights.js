// Insights tab of the Jjodel lane board: aggregates over the lanes, plus exports
// to Perfetto (Chrome trace JSON) and to process mining tools (XES). Read-only.
(function () {
  const store = {
    get(k, d) { try { const v = localStorage.getItem('laneINS.' + k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('laneINS.' + k, v); } catch (e) { /* per-viewer convenience only */ } },
  };
  const RANGES = { '7': 7, '30': 30, '0': 0 };
  let range = store.get('range', '7');
  let data = null;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hm = (t) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dhm = (t) => new Date(t).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const dur = (ms) => { const m = Math.round(ms / 60000); return m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min'; };
  const hours = (ms) => (ms / 3600e3).toFixed(ms < 36e6 ? 1 : 0) + ' h';
  const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const dayKey = (t) => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const dark = () => window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  // Sequential ramp: one hue (the board's cyan), light to dark; its own steps in dark mode.
  const ramp = (r) => r <= 0 ? 'var(--bg)' : dark() ? 'hsl(199,80%,' + Math.round(20 + 45 * r) + '%)' : 'hsl(199,85%,' + Math.round(90 - 55 * r) + '%)';
  const OTIP = (o) => ((window.LANE_OUTCOME_TIPS || {})[o] || '').replace(/"/g, '&quot;');
  const OUTS = [['done', 'var(--ok)', 'done'], ['hard-stop', 'var(--hs)', 'hard-stop'], ['question', 'var(--q)', 'question'], ['blocked', 'var(--bad)', 'blocked / failed'], ['running', 'var(--run)', 'running'], ['', 'var(--neutral)', 'no outcome']];
  const outOf = (l) => l.live ? 'running' : (() => { const o = (l.outcome && l.outcome !== 'none' ? l.outcome : (l.turns[l.turns.length - 1] || {}).o || '').split(' ')[0]; return o === 'failed' ? 'blocked' : OUTS.some((x) => x[0] === o) ? o : ''; })();
  const KINDS = [['discovery', 'Discovery'], ['phase2', 'Full / Phase 2'], ['fast', 'Fast'], ['merge', 'Merge'], ['', 'Not recorded']];

  const css = `
  .in-bar{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;margin:8px 0 16px}
  .in-btn{font:inherit;font-size:12px;background:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:6px 12px;cursor:pointer;text-decoration:none}
  .in-btn:hover{border-color:var(--accent)}
  .in-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:16px}
  .in-kpi{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 16px}
  .in-kpi .v{font-size:22px;font-weight:600;line-height:1.2}.in-kpi .l{font-size:11px;color:var(--muted);margin-top:2px}
  .in-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(480px,1fr));gap:16px}
  .in-card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 16px;min-width:0}
  .in-card h3{margin:0 0 2px;font-size:13px}.in-card .sub{font-size:11px;color:var(--muted);margin-bottom:10px}
  .in-card svg{display:block;max-width:100%;font:10px -apple-system,BlinkMacSystemFont,system-ui,sans-serif}
  .in-legend{display:flex;flex-wrap:wrap;gap:12px;font-size:11px;color:var(--muted);margin-top:8px}
  .in-legend .in-key{cursor:help;border-bottom:1px dotted var(--muted)}
  .in-legend i{display:inline-block;width:10px;height:8px;border-radius:2px;margin-right:4px;vertical-align:middle}
  .in-card table{min-width:0;width:100%}.in-card td,.in-card th{padding:4px 8px;font-size:12px}
  .in-tip{position:fixed;z-index:10;pointer-events:none;background:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:8px;box-shadow:0 8px 24px rgba(15,23,42,.18);padding:8px 10px;font-size:12px;max-width:320px}
  [data-tip]{cursor:default}[data-tip]:hover{opacity:.8}
  .in-note{font-size:11px;color:var(--muted);margin-top:8px}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function compute() {
    const now = data.now, days = RANGES[range];
    const from = days ? now - days * 864e5 : Math.min(...data.lanes.filter((l) => l.turns.length).map((l) => l.turns[0].s));
    const lanes = data.lanes.filter((l) => l.turns.length && l.turns[l.turns.length - 1].e >= from);
    const waits = [], spans = [];
    let work = 0, waitTot = 0, decisions = 0;
    lanes.forEach((l) => {
      spans.push(l.turns[l.turns.length - 1].e - l.turns[0].s);
      l.turns.forEach((t, i) => {
        work += t.e - t.s;
        if (i > 0) { const w = Math.max(0, t.s - l.turns[i - 1].e); waits.push({ w, at: t.s, l, d: t.d }); waitTot += w; decisions++; }
      });
    });
    const outs = {}; lanes.forEach((l) => { const o = outOf(l); outs[o] = (outs[o] || 0) + 1; });
    const closed = lanes.filter((l) => !l.live).length;
    return { now, from, lanes, waits, spans, work, waitTot, decisions, outs, closed };
  }

  function kpis(c) {
    const tile = (v, l) => '<div class="in-kpi"><div class="v">' + v + '</div><div class="l">' + l + '</div></div>';
    const done = c.outs.done || 0;
    return '<div class="in-kpis">' +
      tile(c.lanes.length, 'lanes in range') +
      tile(c.closed ? Math.round(100 * done / c.closed) + '%' : '·', 'closed lanes ending done') +
      tile(c.spans.length ? dur(median(c.spans)) : '·', 'median lane span, first turn to last') +
      tile(hours(c.work), 'agent working time') +
      tile(hours(c.waitTot), 'time waiting for a decision') +
      tile(c.waits.length ? dur(median(c.waits.map((w) => w.w))) : '·', 'median wait for a decision (' + c.decisions + ' decisions)') +
      '</div>';
  }

  // Heatmap: days × hours, cell = lane-hours of agent work in that hour.
  function heatmap(c) {
    const dayStart = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
    const first = dayStart(c.from), last = dayStart(c.now);
    const days = [];
    for (let t = last; t >= first; t -= 864e5) days.push(dayStart(t + 36e5)); // DST-safe step
    const uniq = [...new Set(days)].slice(0, 45);
    const cell = new Map();
    c.lanes.forEach((l) => l.turns.forEach((t) => {
      for (let h = Math.floor(t.s / 36e5) * 36e5; h < t.e; h += 36e5) {
        const o = Math.min(t.e, h + 36e5) - Math.max(t.s, h);
        if (o <= 0) continue;
        const k = dayKey(h) + '|' + new Date(h).getHours();
        const e = cell.get(k) || { v: 0, ids: new Set() };
        e.v += o / 36e5; e.ids.add(l.id); cell.set(k, e);
      }
    }));
    const max = Math.max(0.01, ...[...cell.values()].map((e) => e.v));
    const LW = 84, CW = 18, CH = 16, G = 2, TOPH = 18;
    const W = LW + 24 * (CW + G), H = TOPH + uniq.length * (CH + G);
    let s = '';
    for (let h = 0; h < 24; h += 3) s += '<text x="' + (LW + h * (CW + G) + CW / 2) + '" y="12" text-anchor="middle" fill="var(--muted)">' + String(h).padStart(2, '0') + '</text>';
    uniq.forEach((d0, r) => {
      const y = TOPH + r * (CH + G);
      s += '<text x="' + (LW - 6) + '" y="' + (y + 11) + '" text-anchor="end" fill="var(--muted)">' + new Date(d0).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }) + '</text>';
      for (let h = 0; h < 24; h++) {
        const e = cell.get(dayKey(d0) + '|' + h);
        const v = e ? e.v : 0;
        const tip = e ? esc(new Date(d0).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' + String(h).padStart(2, '0') + ':00 to ' + String(h + 1).padStart(2, '0') + ':00|' + v.toFixed(1) + ' lane-hours of work|' + [...e.ids].slice(0, 6).join(', ') + (e.ids.size > 6 ? ', …' : '')) : '';
        s += '<rect x="' + (LW + h * (CW + G)) + '" y="' + y + '" width="' + CW + '" height="' + CH + '" rx="2" fill="' + ramp(v / max) + '"' + (e ? ' data-tip="' + tip + '"' : '') + '/>';
      }
    });
    const lg = [0.1, 0.35, 0.6, 0.85, 1].map((r) => '<i style="background:' + ramp(r) + '"></i>').join('');
    return '<div class="in-card"><h3>When the lanes work</h3><div class="sub">Lane-hours of agent work per hour of the day; darker means more lanes working at once.</div>' +
      '<div style="overflow-x:auto"><svg width="' + W + '" height="' + H + '">' + s + '</svg></div>' +
      '<div class="in-legend"><span>less</span><span>' + lg + '</span><span>more (max ' + max.toFixed(1) + ' lane-hours in one hour)</span></div></div>';
  }

  // Histogram of waits for a decision.
  function waitsChart(c) {
    const B = [[5, '< 5 min'], [15, '5–15 min'], [30, '15–30 min'], [60, '30–60 min'], [120, '1–2 h'], [240, '2–4 h'], [720, '4–12 h'], [Infinity, '> 12 h']];
    const n = B.map(() => ({ k: 0, ids: [] }));
    c.waits.forEach((w) => { const i = B.findIndex(([m]) => w.w / 60000 < m); n[i].k++; if (n[i].ids.length < 6) n[i].ids.push(w.l.id); });
    const max = Math.max(1, ...n.map((x) => x.k));
    const W = 520, H = 170, L = 8, BW = (W - L) / B.length, base = H - 30;
    let s = '<line x1="0" y1="' + base + '" x2="' + W + '" y2="' + base + '" stroke="var(--line)"/>';
    n.forEach((x, i) => {
      const h = (x.k / max) * (base - 18), bx = L + i * BW + 4, w = BW - 8;
      if (x.k) s += '<path d="M' + bx + ' ' + base + 'v' + -(h - 4) + 'q0 -4 4 -4h' + (w - 8) + 'q4 0 4 4v' + (h - 4) + 'z" fill="var(--accent)" data-tip="' + esc(B[i][1] + '|' + x.k + ' decision' + (x.k > 1 ? 's' : '') + '|' + x.ids.join(', ') + (x.k > x.ids.length ? ', …' : '')) + '"/>' +
        '<text x="' + (bx + w / 2) + '" y="' + (base - h - 4) + '" text-anchor="middle" fill="var(--fg)">' + x.k + '</text>';
      s += '<text x="' + (bx + w / 2) + '" y="' + (base + 14) + '" text-anchor="middle" fill="var(--muted)">' + B[i][1] + '</text>';
    });
    return '<div class="in-card"><h3>How long lanes wait for a decision</h3><div class="sub">Time from the end of a turn to the GO, ACK or answer that started the next one.</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%">' + s + '</svg>' +
      '<div class="in-note">Median ' + (c.waits.length ? dur(median(c.waits.map((w) => w.w))) : '·') + ' over ' + c.waits.length + ' decisions; total ' + hours(c.waitTot) + '.</div></div>';
  }

  // Lanes per day, stacked by final outcome.
  function perDay(c) {
    const by = new Map();
    c.lanes.forEach((l) => { const k = dayKey(l.turns[0].s); const e = by.get(k) || {}; const o = outOf(l); e[o] = (e[o] || 0) + 1; by.set(k, e); });
    const keys = [...by.keys()].sort().slice(-31);
    const max = Math.max(1, ...keys.map((k) => Object.values(by.get(k)).reduce((a, b) => a + b, 0)));
    const W = 520, H = 170, base = H - 30, BW = (W - 8) / Math.max(keys.length, 1);
    let s = '<line x1="0" y1="' + base + '" x2="' + W + '" y2="' + base + '" stroke="var(--line)"/>';
    keys.forEach((k, i) => {
      const e = by.get(k), w = Math.min(Math.max(BW - 4, 2), 44), bx = 8 + i * BW + (BW - w) / 2;
      let y = base; const tot = Object.values(e).reduce((a, b) => a + b, 0);
      OUTS.forEach(([o, col, lab]) => { const v = e[o] || 0; if (!v) return; const h = (v / max) * (base - 18); s += '<rect x="' + bx + '" y="' + (y - h + 1) + '" width="' + w + '" height="' + Math.max(h - 2, 1) + '" rx="1.5" fill="' + col + '" data-tip="' + esc(k + '|' + v + ' ' + lab + ' of ' + tot) + '"/>'; y -= h; });
      s += '<text x="' + (bx + w / 2) + '" y="' + (y - 4) + '" text-anchor="middle" fill="var(--fg)">' + tot + '</text>';
      if (keys.length <= 14 || i % Math.ceil(keys.length / 10) === 0) s += '<text x="' + (bx + w / 2) + '" y="' + (base + 14) + '" text-anchor="middle" fill="var(--muted)">' + k.slice(5) + '</text>';
    });
    const lg = OUTS.map(([o, col, lab]) => '<span class="in-key" title="' + OTIP(o) + '"><i style="background:' + col + '"></i>' + lab + '</span>').join('');
    return '<div class="in-card"><h3>Lanes per day, by outcome</h3><div class="sub">Day of the first turn; colour is the outcome of the last turn.</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%">' + s + '</svg><div class="in-legend">' + lg + '</div></div>';
  }

  // Outcome by kind: one horizontal stacked bar per kind, with the counts in a table.
  function byKind(c) {
    const rows = KINDS.map(([k, lab]) => { const ls = c.lanes.filter((l) => (l.kind || '') === k); const e = {}; ls.forEach((l) => { const o = outOf(l); e[o] = (e[o] || 0) + 1; }); return { lab, n: ls.length, e, med: median(ls.map((l) => l.turns.reduce((a, t) => a + t.e - t.s, 0))) }; }).filter((r) => r.n);
    const max = Math.max(1, ...rows.map((r) => r.n));
    let t = '<table><thead><tr><th>Kind</th><th style="width:50%">Outcomes</th><th>Lanes</th><th>Median work</th></tr></thead><tbody>';
    rows.forEach((r) => {
      let xx = 0, bar2 = '';
      OUTS.forEach(([o, col, lab]) => { const v = r.e[o] || 0; if (!v) return; const w = (v / max) * 300; bar2 += '<rect x="' + xx + '" y="0" width="' + Math.max(w - 2, 1) + '" height="12" rx="2" fill="' + col + '" data-tip="' + esc(r.lab + '|' + v + ' ' + lab) + '"/>'; xx += w; });
      t += '<tr><td>' + esc(r.lab) + '</td><td><svg viewBox="0 0 300 12" width="100%" height="12" preserveAspectRatio="none">' + bar2 + '</svg></td><td>' + r.n + '</td><td>' + dur(r.med) + '</td></tr>';
    });
    t += '</tbody></table>';
    const lg = OUTS.map(([o, col, lab]) => '<span class="in-key" title="' + OTIP(o) + '"><i style="background:' + col + '"></i>' + lab + '</span>').join('');
    return '<div class="in-card"><h3>Outcome by kind of lane</h3><div class="sub">Kind from the <code>Lane:</code> line of the prompt header.</div>' + t + '<div class="in-legend">' + lg + '</div></div>';
  }

  // Who launches the lanes: one stacked bar per launcher, as for the kinds.
  const LAUNCH = [['chat', 'Chat (claude.ai)'], ['claude-code', 'Claude Code, local session'], ['chain', 'Chain'], ['harness', 'lane-run (merge prompts)'], ['manual', 'By hand'], ['unknown', 'Unknown']];
  function byLauncher(c) {
    const rows = LAUNCH.map(([k, lab]) => { const ls = c.lanes.filter((l) => ((l.launcher || {}).by || 'unknown') === k); const e = {}; ls.forEach((l) => { const o = outOf(l); e[o] = (e[o] || 0) + 1; }); return { lab, n: ls.length, e, wait: ls.reduce((a, l) => a + l.turns.reduce((s2, t, i) => s2 + (i ? Math.max(0, t.s - l.turns[i - 1].e) : 0), 0), 0) }; }).filter((r) => r.n);
    const max = Math.max(1, ...rows.map((r) => r.n));
    let t = '<table><thead><tr><th>Launched by</th><th style="width:50%">Outcomes</th><th>Lanes</th><th>Waiting</th></tr></thead><tbody>';
    rows.forEach((r) => {
      let xx = 0, bar = '';
      OUTS.forEach(([o, col, lab]) => { const v = r.e[o] || 0; if (!v) return; const w = (v / max) * 300; bar += '<rect x="' + xx + '" y="0" width="' + Math.max(w - 2, 1) + '" height="12" rx="2" fill="' + col + '" data-tip="' + esc(r.lab + '|' + v + ' ' + lab) + '"/>'; xx += w; });
      t += '<tr><td>' + esc(r.lab) + '</td><td><svg viewBox="0 0 300 12" width="100%" height="12" preserveAspectRatio="none">' + bar + '</svg></td><td>' + r.n + '</td><td>' + hours(r.wait) + '</td></tr>';
    });
    const lg = OUTS.map(([o, col, lab]) => '<span class="in-key" title="' + OTIP(o) + '"><i style="background:' + col + '"></i>' + lab + '</span>').join('');
    return '<div class="in-card"><h3>Who launches the lanes</h3><div class="sub">From the commit that added the prompt: a <code>Claude-Session</code> trailer means a claude.ai chat, a Claude co-author alone a local Claude Code session.</div>' + t + '</tbody></table><div class="in-legend">' + lg + '</div></div>';
  }

  function longestWaits(c) {
    const top = [...c.waits].sort((a, b) => b.w - a.w).slice(0, 10);
    if (!top.length) return '<div class="in-card"><h3>Longest waits</h3><div class="sub">No decisions in this range.</div></div>';
    return '<div class="in-card"><h3>Longest waits for a decision</h3><div class="sub">Where the lanes stood still the longest, with the decision that unblocked them.</div><table><thead><tr><th>Wait</th><th>Lane</th><th>Decision</th></tr></thead><tbody>' +
      top.map((w) => '<tr><td style="white-space:nowrap"><b>' + dur(w.w) + '</b><br><span style="color:var(--muted)">' + dhm(w.at) + '</span></td><td style="white-space:nowrap">' + esc(w.l.id) + '<br><span style="color:var(--muted)">' + esc(w.l.chat || '') + '</span></td><td>' + esc(w.d || '') + '</td></tr>').join('') + '</tbody></table></div>';
  }

  function exportsBar() {
    const d = RANGES[range];
    const seg = '<span class="seg" data-name="range">' + [['7', '7 days'], ['30', '30 days'], ['0', 'All']].map(([v, l]) => '<button data-v="' + v + '" class="' + (v === range ? 'on' : '') + '">' + l + '</button>').join('') + '</span>';
    return '<div class="in-bar"><span class="meta">Range</span>' + seg +
      '<span class="meta" style="margin-left:16px">Export</span>' +
      '<button class="in-btn" id="in-perfetto">Open in Perfetto ↗</button>' +
      '<a class="in-btn" href="/export/trace.json?download&days=' + d + '">Trace JSON</a>' +
      '<a class="in-btn" href="/export/lanes.xes?download&days=' + d + '">XES event log</a>' +
      '<span class="meta" id="in-msg"></span></div>';
  }

  // Perfetto accepts a trace by postMessage once it answers PING with PONG.
  async function openPerfetto() {
    const msg = document.getElementById('in-msg');
    const ORIGIN = 'https://ui.perfetto.dev';
    const win = window.open(ORIGIN);
    if (!win) { msg.textContent = 'the browser blocked the pop-up'; return; }
    msg.textContent = 'preparing the trace…';
    const buf = await (await fetch('/export/trace.json?days=' + RANGES[range], { cache: 'no-store' })).arrayBuffer();
    let done = false;
    const onMsg = (e) => {
      if (e.origin !== ORIGIN || e.data !== 'PONG' || done) return;
      done = true; clearInterval(timer); window.removeEventListener('message', onMsg);
      win.postMessage({ perfetto: { buffer: buf, title: 'Jjodel lanes', fileName: 'jjodel-lanes.trace.json' } }, ORIGIN);
      msg.textContent = 'sent to Perfetto';
    };
    window.addEventListener('message', onMsg);
    const timer = setInterval(() => { try { win.postMessage('PING', ORIGIN); } catch (e) { /* not loaded yet */ } }, 300);
    setTimeout(() => { if (!done) { clearInterval(timer); msg.textContent = 'Perfetto did not answer; use "Trace JSON" and open the file there'; } }, 20000);
  }

  function render() {
    const box = document.getElementById('ins');
    if (!box || !data) return;
    const c = compute();
    box.innerHTML = exportsBar() + kpis(c) + '<div class="in-grid">' + heatmap(c) + waitsChart(c) + perDay(c) + byKind(c) + byLauncher(c) + '</div><div style="margin-top:16px">' + longestWaits(c) + '</div><div class="in-tip" id="in-tip" hidden></div>';
    box.querySelectorAll('.seg[data-name=range] button').forEach((b) => b.addEventListener('click', () => { range = b.dataset.v; store.set('range', range); render(); }));
    const p = document.getElementById('in-perfetto'); if (p) p.addEventListener('click', openPerfetto);
    const tip = document.getElementById('in-tip');
    box.querySelectorAll('[data-tip]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const parts = el.getAttribute('data-tip').split('|');
        tip.innerHTML = '<b>' + esc(parts[0]) + '</b>' + parts.slice(1).map((x) => '<div>' + esc(x) + '</div>').join('');
        tip.hidden = false;
        const r = tip.getBoundingClientRect();
        tip.style.left = Math.min(e.clientX + 12, innerWidth - r.width - 8) + 'px';
        tip.style.top = Math.min(e.clientY + 12, innerHeight - r.height - 8) + 'px';
      });
      el.addEventListener('mouseleave', () => { tip.hidden = true; });
    });
  }

  let busy = false;
  async function refresh() {
    if (busy) return; busy = true;
    try { data = await (await fetch('/api/timeline', { cache: 'no-store' })).json(); render(); }
    catch (e) { const box = document.getElementById('ins'); if (box) box.innerHTML = '<div class="err">insights unreachable: ' + esc(e.message) + '</div>'; }
    finally { busy = false; }
  }
  window.INS = { refresh };
})();
