// Timeline tab of the Jjodel lane board: turns, decision points, parallelism and dependencies.
// Read-only. Data from /api/timeline; drawn as inline SVG, no libraries.
(function () {
  const store = {
    get(k, d) { try { const v = localStorage.getItem('laneTL.' + k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('laneTL.' + k, v); } catch (e) { /* per-viewer convenience only */ } },
  };
  const RANGES = { '24h': 24, '3d': 72, '7d': 168, all: 0 };
  let group = store.get('group', 'worktree');
  let range = store.get('range', '24h');
  let selected = store.get('selected', '');
  let data = null;
  let overlays = [];
  let pinned = -1;
  let zoom = store.get('zoom', '1');
  let zoomChanged = true;
  let colorBy = store.get('colorBy', 'outcome');
  let expanded = {};
  try { expanded = JSON.parse(store.get('expanded', '{}')) || {}; } catch (e) { expanded = {}; }

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hm = (t) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dhm = (t) => new Date(t).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const dur = (ms) => { const m = Math.round(ms / 60000); return m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min'; };
  const short = (wt) => (wt || 'unknown').replace(/^~\//, '').replace(/^\/Users\/[^/]+\//, '');
  // What each outcome means, shown as a tooltip on every outcome legend (insights.js reads it too).
  window.LANE_OUTCOME_TIPS = {
    done: 'Done: the lane finished its prompt and committed; nothing is waiting on you.',
    'hard-stop': 'Hard-stop: a planned pause, not a failure. The lane stopped where the protocol says it must (end of discovery, before a visual check, after a merge) and waits for your GO.',
    question: 'Question: the lane hit a decision outside its perimeter and asks before going on; it resumes once answered.',
    blocked: 'Blocked / failed: something went wrong (a red gate, a missing precondition, a crash). This is the one that needs a look.',
    running: 'Running: the lane process is still alive.',
    '': 'No outcome: the log has no Outcome line (old lanes, or a lane cut off before its closing message).'
  };
  const OTIP = (o) => (window.LANE_OUTCOME_TIPS[o] || '').replace(/"/g, '&quot;');
  const OUT = { done: 'var(--ok)', 'hard-stop': 'var(--hs)', question: 'var(--q)', blocked: 'var(--bad)', failed: 'var(--bad)' };
  const LNAME = { chat: 'Chat (claude.ai)', 'claude-code': 'Claude Code, local session', harness: 'lane-run (merge prompts)', chain: 'Chain (after its first lane)', manual: 'By hand', unknown: 'Unknown' };
  const LCOL = { chat: 'var(--run)', 'claude-code': 'var(--warn)', harness: 'var(--neutral)', chain: 'var(--q)', manual: 'var(--ok)', unknown: 'var(--track)' };
  const turnColor = (lane, t, last) => (last && lane.live ? 'var(--run)' : OUT[t.o] || 'var(--neutral)');

  const css = `
  :root{--q:#7c3aed;--neutral:#94a3b8;--track:#cbd5e1}
  @media (prefers-color-scheme:dark){:root{--q:#a78bfa;--neutral:#64748b;--track:#334155}}
  .tl-bar{display:flex;flex-wrap:wrap;gap:8px 24px;align-items:center;margin:8px 0 12px}
  .seg{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--card)}
  .seg button{border:0;margin:0;border-right:1px solid var(--line)}.seg button:last-child{border-right:0}
  .seg button.on{background:var(--accent);color:#fff;font-weight:600}
  .tl-legend{display:flex;flex-wrap:wrap;gap:12px;font-size:11px;color:var(--muted);align-items:center}
  .tl-legend span[title]{cursor:help;border-bottom:1px dotted var(--muted)}
  .tl-legend i{display:inline-block;width:14px;height:8px;border-radius:2px;margin-right:4px;vertical-align:middle}
  .tl-wrap{background:var(--card);border:1px solid var(--line);border-radius:8px;overflow:hidden}
  .tl-wrap svg{display:block;font:10px -apple-system,BlinkMacSystemFont,system-ui,sans-serif}
  .tl-split{display:flex;align-items:flex-start}.tl-labels{flex:none;border-right:1px solid var(--line)}.tl-scroll{flex:1;overflow-x:auto;overflow-y:hidden}
  .tl-grp,.tl-lane-lab{cursor:pointer}.tl-grp:hover text{text-decoration:underline}
  .tl-dim .tl-lane-lab:not(.sel):not(.rel){opacity:.35}.tl-lane-lab.sel text{font-weight:600}
  .tl-lane{cursor:pointer}.tl-dim .tl-lane:not(.sel):not(.rel){opacity:.25}
  .tl-lane.sel .tl-turn{stroke:var(--fg);stroke-width:1.5}
  .tl-conf .tl-turn{stroke:var(--bad);stroke-width:1.5;stroke-dasharray:2 1}
  .tl-live .tl-turn:last-of-type{animation:tlp 1.6s ease-in-out infinite}@keyframes tlp{50%{opacity:.45}}
  .tl-detail{margin-top:12px;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 16px}
  .tl-detail h3{margin:0 0 4px;font-size:14px}.tl-detail .meta{margin-bottom:8px}
  .tl-detail blockquote{margin:4px 0 8px;padding:6px 8px;border-left:3px solid var(--accent);background:var(--bg);white-space:pre-wrap;max-height:260px;overflow:auto}
  .tl-detail table{min-width:0}.tl-detail td{padding:4px 8px}.tl-detail a{color:var(--accent);cursor:pointer;text-decoration:none}
  .tl-empty{padding:24px;color:var(--muted)}
  .tl-ov,.tl-link,.tl-bk{cursor:help}.tl-bk:hover{fill:var(--fg);fill-opacity:.06}.tl-link:hover path:first-child,.tl-link.pin path:first-child{stroke-width:3}.tl-ov:hover>rect:first-child{stroke-width:2}
  .tl-pop{position:fixed;z-index:10;max-width:480px;background:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:8px;box-shadow:0 8px 24px rgba(15,23,42,.18);padding:10px 12px;font-size:12px;line-height:1.5;pointer-events:none}
  .tl-pop.pinned{pointer-events:auto}.tl-pop .k{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:1px 6px;border-radius:4px;margin-right:6px;color:#fff}
  .tl-pop .hd{font-weight:600;margin:4px 0}.tl-pop .sub{color:var(--muted);font-size:11px}
  .tl-pop blockquote{margin:6px 0 0;padding:6px 8px;border-left:3px solid var(--accent);background:var(--bg);white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;max-height:260px;overflow:auto}
  .tl-pop mark{background:color-mix(in srgb,var(--accent) 30%,transparent);color:inherit;border-radius:2px;padding:0 1px}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function controls() {
    const seg = (name, opts, cur) => '<span class="seg" data-name="' + name + '">' + opts.map(([v, l]) => '<button data-v="' + v + '" class="' + (v === cur ? 'on' : '') + '">' + l + '</button>').join('') + '</span>';
    return '<div class="tl-bar">' +
      '<span class="meta">Rows</span>' + seg('group', [['worktree', 'Worktree'], ['chat', 'Chat'], ['launcher', 'Launcher']], group) +
      '<span class="meta">Range</span>' + seg('range', [['24h', '24 h'], ['3d', '3 days'], ['7d', '7 days'], ['all', 'All']], range) +
      '<span class="meta">Zoom</span>' + seg('zoom', [['1', 'Fit'], ['2', '2×'], ['4', '4×'], ['8', '8×'], ['16', '16×']], zoom) +
      '<span class="meta">Colour by</span>' + seg('colorBy', [['outcome', 'Outcome'], ['deps', 'Dependencies'], ['heat', 'Heat']], colorBy) +
      '<span class="seg" data-name="fold"><button data-v="open">Expand all</button><button data-v="close">Collapse all</button></span>' +
      '<span class="tl-legend"><span title="' + OTIP('done') + '"><i style="background:var(--ok)"></i>done</span><span title="' + OTIP('hard-stop') + '"><i style="background:var(--hs)"></i>hard-stop</span><span title="' + OTIP('question') + '"><i style="background:var(--q)"></i>question</span><span title="' + OTIP('blocked') + '"><i style="background:var(--bad)"></i>blocked</span><span title="' + OTIP('running') + '"><i style="background:var(--run)"></i>running</span>' +
      '<span><svg width="10" height="10"><path d="M5 0L10 5L5 10L0 5Z" fill="var(--accent)"/></svg> decision</span>' +
      '<span><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="var(--track)" stroke-dasharray="3 2"/></svg> waiting</span>' +
      (group === 'worktree' ? '<span><i style="border:1.5px dashed var(--bad);background:repeating-linear-gradient(45deg,transparent 0 2px,color-mix(in srgb,var(--bad) 40%,transparent) 2px 4px)"></i>overlap in one tree (solid: both working)</span>' : '<span><i style="border:1.5px dashed var(--q);background:repeating-linear-gradient(45deg,transparent 0 2px,color-mix(in srgb,var(--q) 40%,transparent) 2px 4px)"></i>parallel lanes in one row (solid: both working)</span>') + '<span><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="var(--fg)" stroke-width="1.5"/></svg> chain</span><span><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="var(--accent)" stroke-width="2.25"/></svg> declared dependency</span><span><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3"/></svg> citation</span>' + '</span></div>';
  }

  function render() {
    const box = document.getElementById('tl');
    if (!box || !data) return;
    const oldScroll = box.querySelector('.tl-scroll');
    const keepScroll = oldScroll ? { left: oldScroll.scrollLeft, atEnd: oldScroll.scrollLeft + oldScroll.clientWidth >= oldScroll.scrollWidth - 4 } : null;
    const now = data.now;
    const hours = RANGES[range];
    const lanes0 = data.lanes.filter((l) => l.turns.length);
    const allStart = Math.min(...lanes0.map((l) => l.turns[0].s));
    const t0 = hours ? now - hours * 3600e3 : allStart;
    const t1 = now + (now - t0) * 0.01;
    const lanes = lanes0.filter((l) => l.turns[l.turns.length - 1].e >= t0).map((l) => ({ ...l, a: l.turns[0].s, b: l.turns[l.turns.length - 1].e }));
    let html = controls();
    if (!lanes.length) { box.innerHTML = html + '<div class="tl-wrap"><div class="tl-empty">No lanes in this range.</div></div>'; wire(box); return; }

    const keyOf = (l) => (group === 'chat' ? l.chat || 'no chat recorded' : group === 'launcher' ? LNAME[(l.launcher || {}).by] || 'unknown' : short(l.worktree));
    const byStart = (p, q) => p.a - q.a || (p.id < q.id ? -1 : p.id > q.id ? 1 : 0);
    const groups = new Map();
    lanes.sort(byStart).forEach((l) => { const k = keyOf(l); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(l); });
    // Newest first: the groups by their most recent lane, descending. Inside a group the lanes stay
    // oldest first for packing, overlaps and labels; only their row numbers are reversed (below).
    const order = [...groups].sort(([, p], [, q]) => byStart(q[q.length - 1], p[p.length - 1]));
    const isOpen = (k, n) => (k in expanded ? expanded[k] : n <= 8);

    // Geometry: a fixed label column and a plot that zooms and scrolls horizontally.
    const LABEL = 260, ROWC = 18, ROWE = 22, HEAD = 26, TOP = 170;
    const avail = Math.max((box.clientWidth || 1000) - LABEL - 2, 400);
    const plotW = Math.round(avail * Number(zoom)) - 16;
    const W = plotW + 16;
    const x = (t) => 8 + ((Math.max(t, t0) - t0) / (t1 - t0)) * plotW;

    const sel = lanes.find((l) => l.id === selected);
    const links = [];
    if (sel) {
      data.chainDeps.forEach(([a, b, info]) => { if (a === sel.id || b === sel.id) links.push([a, b, 'chain', info || {}]); });
      // Declared dependencies (the `Depends:` header line) come before the citations they make redundant.
      (sel.depends || []).forEach((d) => { if (!links.some((k) => k[0] === d && k[1] === sel.id)) links.push([d, sel.id, 'depends', {}]); });
      lanes.forEach((l) => { if ((l.depends || []).includes(sel.id) && !links.some((k) => k[0] === sel.id && k[1] === l.id)) links.push([sel.id, l.id, 'depends', {}]); });
      sel.cites.forEach((c) => { if (!links.some((k) => k[0] === c.id && k[1] === sel.id)) links.push([c.id, sel.id, 'cites', c]); });
      lanes.forEach((l) => { const c = l.cites.find((x) => x.id === sel.id); if (c && !links.some((k) => k[0] === sel.id && k[1] === l.id)) links.push([sel.id, l.id, 'cites', c]); });
    }
    const related = new Set(links.flatMap((k) => [k[0], k[1]]));
    const byId = new Map(lanes.map((l) => [l.id, l]));
    overlays = [];

    let y = TOP;
    const lab = [], bg = [], ov = [], rows = [];
    const pos = new Map();
    let gi = 0;
    for (const [k, ls] of order) {
      const open = isOpen(k, ls.length);
      // Row of each lane: one per lane when open, packed when collapsed; newest on top either way.
      let nRows;
      if (open) { ls.forEach((l, i) => { l.row = ls.length - 1 - i; }); nRows = ls.length; }
      else {
        const sub = [];
        ls.forEach((l) => { let r = sub.findIndex((end) => end + 60e3 < l.a); if (r === -1) { r = sub.length; sub.push(0); } sub[r] = l.b; l.row = r; });
        // Same packing as before; the packed rows are then numbered by their newest lane, descending.
        const rank = new Map();
        for (let i = ls.length - 1; i >= 0; i--) if (!rank.has(ls[i].row)) rank.set(ls[i].row, rank.size);
        ls.forEach((l) => { l.row = rank.get(l.row); });
        nRows = sub.length;
      }
      const ROW = open ? ROWE : ROWC;
      const top = y + HEAD;
      ls.forEach((l) => { l.y = top + l.row * ROW + 4; });
      const h = HEAD + nRows * ROW + 6;
      // Overlaps inside the group.
      const pairs = [];
      for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++) {
        const p = ls[i], q = ls[j], a = Math.max(p.a, q.a, t0), b = Math.min(p.b, q.b);
        if (b - a < 60e3) continue;
        let both = 0; const work = [];
        p.turns.forEach((u) => q.turns.forEach((v) => { const s0 = Math.max(u.s, v.s, t0), s1 = Math.min(u.e, v.e); if (s1 > s0) { both += s1 - s0; work.push([s0, s1]); } }));
        pairs.push({ p, q, a, b, both, work });
      }
      const conflict = group === 'worktree';
      const col = conflict ? 'var(--bad)' : 'var(--q)';
      pairs.forEach((o) => {
        const ya = Math.min(o.p.y, o.q.y) - 3, yb = Math.max(o.p.y, o.q.y) + 13;
        const idx = overlays.push({ type: 'overlap', o, group: k, conflict }) - 1;
        ov.push('<g class="tl-ov" data-ov="' + idx + '"><rect x="' + x(o.a) + '" y="' + ya + '" width="' + Math.max(x(o.b) - x(o.a), 3) + '" height="' + (yb - ya) + '" fill="url(#' + (conflict ? 'tl-hatch-bad' : 'tl-hatch-q') + ')" stroke="' + col + '" stroke-dasharray="3 2" rx="3"/>' +
          o.work.map(([s0, s1]) => '<rect x="' + x(s0) + '" y="' + ya + '" width="' + Math.max(x(s1) - x(s0), 2) + '" height="' + (yb - ya) + '" fill="' + col + '" opacity=".22"/>').join('') +
          (open && x(o.b) - x(o.a) > 40 ? '<text x="' + (x(o.a) + 3) + '" y="' + (ya - 2) + '" fill="' + col + '" font-weight="600">⇄ ' + dur(o.b - o.a) + '</text>' : '') + '</g>');
      });
      const shade = gi % 2 ? 'transparent' : 'var(--bg)';
      bg.push('<rect x="0" y="' + y + '" width="' + W + '" height="' + h + '" fill="' + shade + '"/><line x1="0" y1="' + y + '" x2="' + W + '" y2="' + y + '" stroke="var(--line)"/>');
      const name = k.length > 30 ? k.slice(0, 29) + '…' : k;
      lab.push('<rect x="0" y="' + y + '" width="' + LABEL + '" height="' + h + '" fill="' + shade + '"/><line x1="0" y1="' + y + '" x2="' + LABEL + '" y2="' + y + '" stroke="var(--line)"/>' +
        '<g class="tl-grp" data-grp="' + esc(k) + '"><rect x="0" y="' + y + '" width="' + LABEL + '" height="' + HEAD + '" fill="transparent"/>' +
        '<text x="10" y="' + (y + 17) + '" fill="var(--muted)" font-size="11">' + (open ? '▾' : '▸') + '</text>' +
        '<text x="24" y="' + (y + 17) + '" fill="var(--fg)" font-weight="600" font-size="12">' + esc(name) + '<title>' + esc(k) + '</title></text>' +
        '<text x="' + (LABEL - 10) + '" y="' + (y + 17) + '" text-anchor="end" fill="var(--muted)">' + ls.length + (pairs.length ? ' · <tspan fill="' + col + '">' + pairs.length + ' ⇄</tspan>' : '') + '</text></g>');
      if (!open && pairs.length) lab.push('<text x="24" y="' + (y + 32) + '" fill="' + col + '" font-size="10">' + pairs.length + ' overlap' + (pairs.length > 1 ? 's' : '') + ' · click to expand</text>');
      // Lanes.
      const labelEnd = [];
      ls.forEach((l) => {
        const ly = l.y;
        pos.set(l.id, { y: ly + 5, a: x(l.a), b: x(l.b) });
        const cls = (l.id === selected ? ' sel' : related.has(l.id) ? ' rel' : '') + (l.live ? ' tl-live' : '');
        let g = '<g class="tl-lane' + cls + '" data-id="' + l.id + '">';
        g += '<line x1="' + x(l.a) + '" y1="' + (ly + 5) + '" x2="' + x(l.b) + '" y2="' + (ly + 5) + '" stroke="var(--track)" stroke-dasharray="3 2"/>';
        l.turns.forEach((t, i) => {
          const last = i === l.turns.length - 1;
          g += '<rect class="tl-turn" x="' + x(t.s) + '" y="' + ly + '" width="' + Math.max(x(t.e) - x(t.s), 2) + '" height="10" rx="2" fill="' + turnColor(l, t, last) + '"><title>' + esc(l.id + ' · turn ' + (i + 1) + '\n' + dhm(t.s) + ' to ' + hm(t.e) + ' (' + dur(t.e - t.s) + ')' + (t.o ? '\nOutcome: ' + t.o : '')) + '</title></rect>';
          if (i > 0 && t.s >= t0) g += '<path d="M' + x(t.s) + ' ' + (ly - 2) + 'l5 7l-5 7l-5 -7z" fill="var(--accent)" stroke="var(--card)" stroke-width="1"><title>' + esc('Decision at ' + dhm(t.s) + ' after ' + dur(t.s - l.turns[i - 1].e) + ' of waiting\n' + (t.d || '')) + '</title></path>';
        });
        // Short label after the bar, only where it does not run into the next lane of the same row.
        const lx = x(l.b) + 6, txt = open ? l.id.slice(2) : l.id.slice(-4);
        const need = txt.length * 5.6 + 4;
        if ((labelEnd[l.row] || 0) < lx && lx + need < W) {
          const next = ls.find((o) => o !== l && o.row === l.row && o.a > l.b);
          if (!next || x(next.a) > lx + need) { g += '<text x="' + lx + '" y="' + (ly + 9) + '" fill="var(--muted)">' + esc(txt) + '</text>'; labelEnd[l.row] = lx + need; }
        }
        g += '<title>' + esc(l.id + (l.title ? ' · ' + l.title : '')) + '</title></g>';
        rows.push(g);
        if (open) {
          const t = (l.title || '').replace(/^Prompt:\s*/, '');
          const max = 27;
          lab.push('<g class="tl-lane-lab' + cls + '" data-id="' + l.id + '"><rect x="0" y="' + (ly - 4) + '" width="' + LABEL + '" height="' + ROWE + '" fill="transparent"/>' +
            '<circle cx="16" cy="' + (ly + 5) + '" r="3.5" fill="' + (LCOL[(l.launcher || {}).by] || 'var(--track)') + '"><title>' + esc('Launched by ' + (LNAME[(l.launcher || {}).by] || 'unknown') + ((l.launcher || {}).detail ? ' · ' + l.launcher.detail : '')) + '</title></circle>' +
            '<text x="24" y="' + (ly + 9) + '" fill="var(--fg)"><tspan font-family="ui-monospace,SFMono-Regular,Menlo,monospace" fill="var(--muted)">' + esc(new Date(l.a).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' + hm(l.a)) + '</tspan> ' +
            esc(t.length > max ? t.slice(0, max - 1) + '…' : t || l.id) + '<title>' + esc(l.id + (l.title ? ' · ' + l.title : '')) + '</title></text></g>');
        }
      });
      y += h; gi++;
    }
    const H = y + 8;

    // Axis and day lines.
    const span = t1 - t0;
    const steps = [15, 30, 60, 120, 180, 360, 720, 1440, 2880, 10080].map((m) => m * 60e3);
    const step = steps.find((s) => span / s <= Math.max(6, plotW / 90)) || steps[steps.length - 1];
    const tz = new Date().getTimezoneOffset() * 60e3;
    let axis = '';
    for (let t = Math.ceil((t0 - tz) / step) * step + tz; t <= t1; t += step) {
      const midnight = new Date(t).getHours() === 0 && new Date(t).getMinutes() === 0;
      axis += '<line x1="' + x(t) + '" y1="' + (TOP - 6) + '" x2="' + x(t) + '" y2="' + H + '" stroke="var(--line)"' + (midnight ? ' stroke-width="1.5"' : '') + '/>' +
        '<text x="' + (x(t) + 3) + '" y="' + (TOP - 9) + '" fill="var(--muted)">' + (midnight || step >= 1440 * 60e3 ? new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : hm(t)) + '</text>';
    }
    axis += '<line x1="' + x(now) + '" y1="4" x2="' + x(now) + '" y2="' + H + '" stroke="var(--accent)" stroke-width="1.5"/><text x="' + (x(now) - 3) + '" y="12" text-anchor="end" fill="var(--accent)" font-weight="600">now</text>';

    // Parallelism chart: one column per time bucket. Height = average number of lanes working
    // in the bucket (light backdrop = lanes open); colour = the metric chosen in "Colour by".
    const STRIP_TOP = 22, STRIP_H = TOP - 22 - STRIP_TOP - 6, base = STRIP_TOP + STRIP_H;
    const nb = Math.max(20, Math.floor(plotW / 7));
    const bw = (t1 - t0) / nb;
    const known = new Map(data.lanes.map((l) => [l.id, l]));
    const depKind = (l) => {
      const deps = l.cites.map((c) => c.id).concat(l.depends || [],data.chainDeps.filter((d) => d[1] === l.id).map((d) => d[0])).map((id) => known.get(id)).filter(Boolean);
      if (!deps.length) return 'none';
      const a = l.turns[0].s, b = l.turns[l.turns.length - 1].e;
      return deps.some((d) => d.turns[0].s < b && a < d.turns[d.turns.length - 1].e) ? 'concurrent' : 'sequential';
    };
    lanes.forEach((l) => { l.dep = depKind(l); });
    const CATS = {
      outcome: [['done', 'var(--ok)', 'done'], ['hard-stop', 'var(--hs)', 'hard-stop'], ['question', 'var(--q)', 'question'], ['blocked', 'var(--bad)', 'blocked / failed'], ['running', 'var(--run)', 'running'], ['', 'var(--neutral)', 'no outcome']],
      deps: [['concurrent', 'var(--bad)', 'depends on a lane open at the same time'], ['sequential', 'var(--accent)', 'depends on an earlier lane'], ['none', 'var(--neutral)', 'no recorded dependency']],
    };
    const catOf = (l, t, last) => colorBy === 'deps' ? l.dep : (last && l.live ? 'running' : t.o === 'failed' ? 'blocked' : (t.o in OUT || t.o === 'done') ? t.o : '');
    const buckets = [];
    for (let i = 0; i < nb; i++) buckets.push({ s: t0 + i * bw, e: t0 + (i + 1) * bw, work: {}, total: 0, open: 0, dec: 0, ids: new Set() });
    const addSpan = (s, e, f) => {
      if (e <= t0 || s >= t1) return;
      for (let i = Math.max(0, Math.floor((s - t0) / bw)); i < nb && buckets[i].s < e; i++) {
        const o = Math.min(e, buckets[i].e) - Math.max(s, buckets[i].s);
        if (o > 0) f(buckets[i], o / bw);
      }
    };
    lanes.forEach((l) => {
      addSpan(l.a, l.b, (bk, w) => { bk.open += w; bk.ids.add(l.id); });
      l.turns.forEach((t, i) => {
        const c = catOf(l, t, i === l.turns.length - 1);
        addSpan(t.s, t.e, (bk, w) => { bk.work[c] = (bk.work[c] || 0) + w; bk.total += w; });
        if (i > 0 && t.s >= t0) { const k = Math.min(nb - 1, Math.floor((t.s - t0) / bw)); if (k >= 0) buckets[k].dec++; }
      });
    });
    const peakOpen = Math.max(1, ...buckets.map((b) => b.open)), peakWork = Math.max(0, ...buckets.map((b) => b.total));
    const ysc = STRIP_H / peakOpen;
    const heat = (v) => { const r = Math.min(1, v / Math.max(1, peakWork)); const dk = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches; return 'hsl(199,' + (dk ? 80 : 85) + '%,' + Math.round(dk ? 28 + 42 * r : 80 - 48 * r) + '%)'; };
    let strip = '<line x1="8" y1="' + base + '" x2="' + (8 + plotW) + '" y2="' + base + '" stroke="var(--line)"/>';
    [Math.ceil(peakOpen / 2), Math.ceil(peakOpen)].forEach((v) => { if (v > 0) strip += '<line x1="8" y1="' + (base - v * ysc) + '" x2="' + (8 + plotW) + '" y2="' + (base - v * ysc) + '" stroke="var(--line)" stroke-dasharray="2 3"/><text x="10" y="' + (base - v * ysc - 2) + '" fill="var(--muted)" font-size="9">' + v + '</text>'; });
    buckets.forEach((bk, i) => {
      const bx = x(bk.s) + 0.5, bwpx = Math.max(x(bk.e) - x(bk.s) - 1, 1);
      if (bk.open > 0.01) strip += '<rect x="' + bx + '" y="' + (base - bk.open * ysc) + '" width="' + bwpx + '" height="' + bk.open * ysc + '" fill="var(--track)" opacity=".55"/>';
      if (colorBy === 'heat') {
        if (bk.total > 0.01) strip += '<rect x="' + bx + '" y="' + (base - bk.total * ysc) + '" width="' + bwpx + '" height="' + bk.total * ysc + '" fill="' + heat(bk.total) + '"/>';
      } else {
        let yy = base;
        CATS[colorBy].forEach(([k, c]) => { const v = bk.work[k] || 0; if (v > 0.01) { strip += '<rect x="' + bx + '" y="' + (yy - v * ysc) + '" width="' + bwpx + '" height="' + v * ysc + '" fill="' + c + '"/>'; yy -= v * ysc; } });
      }
      if (bk.dec) strip += '<path d="M' + (bx + bwpx / 2) + ' ' + (base + 2) + 'l3 4l-3 4l-3 -4z" fill="var(--accent)"/>';
      if (bk.open > 0.01 || bk.dec) {
        const idx = overlays.push({ type: 'bucket', bk, cats: colorBy === 'heat' ? null : CATS[colorBy] }) - 1;
        strip += '<rect class="tl-bk" data-ov="' + idx + '" x="' + bx + '" y="' + STRIP_TOP + '" width="' + bwpx + '" height="' + (STRIP_H + 12) + '" fill="transparent"/>';
      }
    });
    const pw = { max: Math.round(peakWork * 10) / 10 }, po = { max: Math.round(peakOpen * 10) / 10 };
    const legendRows = colorBy === 'heat' ? [['', 'linear-gradient(90deg,' + heat(0) + ',' + heat(peakWork / 2) + ',' + heat(peakWork) + ')', 'working lanes, few → many']] : CATS[colorBy];
    let lg = '';
    legendRows.forEach(([k, c, label], i) => {
      const ly = STRIP_TOP + 36 + i * 13;
      if (ly > base + 6) return;
      lg += colorBy === 'heat'
        ? '<rect x="10" y="' + (ly - 8) + '" width="40" height="8" rx="2" fill="url(#tl-heat)"/><text x="56" y="' + ly + '" fill="var(--muted)" font-size="10">' + esc(label) + '</text>'
        : '<g' + (colorBy === 'outcome' ? ' style="cursor:help"><title>' + esc(window.LANE_OUTCOME_TIPS[k] || '') + '</title>' : '>') + '<rect x="10" y="' + (ly - 8) + '" width="10" height="8" rx="2" fill="' + c + '"/><text x="26" y="' + ly + '" fill="var(--muted)" font-size="10">' + esc(label.length > 36 ? label.slice(0, 35) + '…' : label) + '</text></g>';
    });
    lab.unshift('<rect x="0" y="0" width="' + LABEL + '" height="' + TOP + '" fill="var(--card)"/>' +
      '<defs><linearGradient id="tl-heat"><stop offset="0" stop-color="' + heat(0) + '"/><stop offset=".5" stop-color="' + heat(peakWork / 2) + '"/><stop offset="1" stop-color="' + heat(peakWork) + '"/></linearGradient></defs>' +
      '<text x="10" y="' + (STRIP_TOP + 4) + '" fill="var(--fg)" font-weight="600" font-size="12">Parallelism</text>' +
      '<text x="10" y="' + (STRIP_TOP + 18) + '" fill="var(--muted)">peak ' + pw.max + ' working · ' + po.max + ' open (avg per column)</text>' + lg);

    // Dependencies of the selected lane.
    let deps = '';
    links.forEach(([a, b, kind, info]) => {
      const pa = pos.get(a), pb = pos.get(b);
      if (!pa || !pb) return;
      const x2 = pb.a, x1 = x2 > pa.a + 4 ? Math.min(pa.b, x2 - 4) : pa.a, mx = (x1 + x2) / 2;
      const d = 'M' + x1 + ' ' + pa.y + 'C' + mx + ' ' + pa.y + ' ' + mx + ' ' + pb.y + ' ' + x2 + ' ' + pb.y;
      const idx = overlays.push({ type: kind, from: byId.get(a), to: byId.get(b), info }) - 1;
      deps += '<g class="tl-link" data-ov="' + idx + '"><path d="' + d + '" fill="none" stroke="' + (kind === 'chain' ? 'var(--fg)' : 'var(--accent)') + '" stroke-width="' + (kind === 'depends' ? 2.25 : 1.5) + '"' + (kind === 'cites' ? ' stroke-dasharray="4 3"' : '') + ' marker-end="url(#tl-arr)"/>' +
        '<path d="' + d + '" fill="none" stroke="transparent" stroke-width="12"/></g>';
    });
    const hatch = (id, c) => '<pattern id="' + id + '" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="' + c + '" opacity=".06"/><line x1="0" y1="0" x2="0" y2="6" stroke="' + c + '" stroke-width="2" opacity=".35"/></pattern>';
    const defs = '<defs>' + hatch('tl-hatch-bad', 'var(--bad)') + hatch('tl-hatch-q', 'var(--q)') + '<marker id="tl-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8z" fill="var(--accent)"/></marker></defs>';
    html += '<div class="tl-wrap tl-split' + (sel ? ' tl-dim' : '') + '">' +
      '<svg class="tl-labels" width="' + LABEL + '" height="' + H + '">' + lab.join('') + '</svg>' +
      '<div class="tl-scroll"><svg class="tl-plot" width="' + W + '" height="' + H + '">' + defs + bg.join('') + axis + ov.join('') + rows.join('') + strip + deps + '</svg></div></div><div class="tl-pop" id="tl-pop" hidden></div>';
    html += sel ? detail(sel, links) : '<div class="tl-detail"><span class="meta">Click a row header to expand or collapse it. Click a lane to see its turns, decisions and dependencies; hover an arrow or an overlap for the original text.</span></div>';
    box.innerHTML = html;
    const sc = box.querySelector('.tl-scroll');
    if (sc) sc.scrollLeft = keepScroll && !zoomChanged && !keepScroll.atEnd ? keepScroll.left : sc.scrollWidth;
    zoomChanged = false;
    wire(box);
  }

  function detail(l, links) {
    let rows = '';
    l.turns.forEach((t, i) => {
      if (i > 0) rows += '<tr><td class="meta">decision</td><td>' + dhm(t.s) + '</td><td class="meta">after ' + dur(t.s - l.turns[i - 1].e) + ' waiting</td><td>' + esc(t.d) + '</td></tr>';
      rows += '<tr><td><b>turn ' + (i + 1) + '</b></td><td>' + dhm(t.s) + ' to ' + hm(t.e) + '</td><td>' + dur(t.e - t.s) + '</td><td>' + esc(t.o || (i === l.turns.length - 1 && l.live ? 'running' : '')) + '</td></tr>';
    });
    const link = (id) => '<a data-go="' + id + '">' + id + '</a>';
    const ins = links.filter((k) => k[1] === l.id).map((k) => link(k[0]) + ' (' + k[2] + ')');
    const outs = links.filter((k) => k[0] === l.id).map((k) => link(k[1]) + ' (' + k[2] + ')');
    // The request the lane answers (PROTOCOL P13, RC-43): Alfonso's words from request.md, then the URL of the Request: line.
    const rq = l.request || {};
    const url = rq.url ? (/^https?:\/\//i.test(rq.url) ? '<a href="' + esc(rq.url) + '" target="_blank" rel="noopener">' + esc(rq.url) + '</a>' : esc(rq.url)) : '';
    const request = rq.text || rq.url ? '<div class="meta">Request</div>' + (rq.text ? '<blockquote>' + esc(rq.text) + '</blockquote>' : '') + (url ? '<div class="meta">' + url + '</div>' : '') : '<div class="meta">Request: not recorded</div>';
    return '<div class="tl-detail"><h3>' + esc(l.id) + (l.title ? ' · ' + esc(l.title) : '') + '</h3>' +
      '<div class="meta">' + [l.kind, l.tier, l.chat, short(l.worktree), l.state + (l.outcome && l.outcome !== 'none' ? ' · ' + l.outcome : '')].filter(Boolean).map(esc).join(' · ') + '</div>' +
      '<div class="meta">Launched by <b style="color:' + (LCOL[(l.launcher || {}).by] || 'inherit') + '">' + esc(LNAME[(l.launcher || {}).by] || 'unknown') + '</b>' + ((l.launcher || {}).detail ? ' · ' + esc(l.launcher.detail) : '') + ((l.launcher || {}).file ? ' · <code>' + esc(l.launcher.file) + '</code>' : '') + '</div>' +
      request +
      '<table><tbody>' + rows + '</tbody></table>' +
      '<div class="meta" style="margin-top:8px">Depends on: ' + (ins.join(', ') || 'none recorded') + '<br>Followed by: ' + (outs.join(', ') || 'none recorded') + '</div></div>';
  }

  function popHtml(ov) {
    if (ov.type === 'bucket') {
      const b = ov.bk, f = (v) => (Math.round(v * 10) / 10).toString();
      let rowsH = '';
      if (ov.cats) ov.cats.forEach(([k, c, label]) => { const v = b.work[k] || 0; if (v > 0.01) rowsH += '<div><i style="display:inline-block;width:10px;height:8px;border-radius:2px;background:' + c + ';margin-right:6px"></i>' + esc(label) + ': <b>' + f(v) + '</b></div>'; });
      return '<span class="k" style="background:var(--accent)">Parallelism</span><span class="sub">' + dhm(b.s) + ' to ' + hm(b.e) + '</span>' +
        '<div class="hd">' + f(b.total) + ' working · ' + f(b.open) + ' open</div>' + rowsH +
        (b.dec ? '<div class="sub" style="margin-top:4px">' + b.dec + ' decision' + (b.dec > 1 ? 's' : '') + ' in this column</div>' : '') +
        '<div class="sub" style="margin-top:4px">' + esc([...b.ids].slice(0, 8).join(', ') + (b.ids.size > 8 ? ', …' : '')) + '</div>';
    }
    const lane = (l) => l ? '<b>' + esc(l.id) + '</b>' + (l.title ? ' <span class="sub">' + esc(l.title) + '</span>' : '') : '?';
    if (ov.type === 'overlap') {
      const o = ov.o;
      return '<span class="k" style="background:' + (ov.conflict ? 'var(--bad)' : 'var(--q)') + '">' + (ov.conflict ? 'Same worktree' : 'Parallel in chat') + '</span><span class="sub">' + esc(ov.group) + '</span>' +
        '<div class="hd">' + esc(o.p.id) + ' ⇄ ' + esc(o.q.id) + '</div>' +
        '<div>Both open for <b>' + dur(o.b - o.a) + '</b> (' + dhm(o.a) + ' to ' + hm(o.b) + '), both working for <b>' + dur(o.both) + '</b>.</div>' +
        '<div class="sub" style="margin-top:4px">' + lane(o.p) + '<br>' + lane(o.q) + '</div>' +
        (ov.conflict ? '<div class="sub" style="margin-top:6px">Two lanes in one tree at the same time can overwrite each other (RC-22).</div>' : '');
    }
    if (ov.type === 'chain') {
      const i = ov.info || {};
      return '<span class="k" style="background:var(--fg);color:var(--bg)">Dependency · chain</span><span class="sub">' + esc(i.chain || '') + (i.step ? ' · step ' + i.step + ' of ' + (i.of - 1) : '') + '</span>' +
        '<div class="hd">' + esc(ov.from && ov.from.id) + ' → ' + esc(ov.to && ov.to.id) + '</div>' +
        '<div class="sub">' + lane(ov.from) + '<br>' + lane(ov.to) + '</div>' +
        '<blockquote>' + esc([i.branch && 'branch: ' + i.branch, i.worktree && 'worktree: ' + i.worktree, i.from && 'runs after: ' + i.from, i.to && 'prompt: ' + i.to].filter(Boolean).join('\n')) + '</blockquote>';
    }
    if (ov.type === 'depends') {
      const to = ov.to || {};
      return '<span class="k" style="background:var(--accent)">Dependency · declared</span><span class="sub">' + esc(to.id) + ' declares it in its header</span>' +
        '<div class="hd">' + esc(ov.from && ov.from.id) + ' → ' + esc(to.id) + '</div>' +
        '<div class="sub">' + lane(ov.from) + '<br>' + lane(to) + '</div>' +
        '<blockquote>Depends: ' + esc((to.depends || []).join(', ')) + '</blockquote>';
    }
    const t = esc((ov.info && ov.info.text) || '(the citing paragraph was not found)');
    const id = esc(ov.from ? ov.from.id : '');
    return '<span class="k" style="background:var(--accent)">Citation · inferred</span><span class="sub">' + esc(ov.to && ov.to.id) + ' cites ' + id + ' in its prompt</span>' +
      '<div class="hd">' + id + ' → ' + esc(ov.to && ov.to.id) + '</div>' +
      '<div class="sub">' + lane(ov.from) + '<br>' + lane(ov.to) + '</div>' +
      '<blockquote>' + (id ? t.split(id).join('<mark>' + id + '</mark>') : t) + '</blockquote>';
  }

  function showPop(idx, ev, pin) {
    const pop = document.getElementById('tl-pop');
    if (!pop || !overlays[idx]) return;
    pop.innerHTML = popHtml(overlays[idx]);
    pop.hidden = false;
    pop.classList.toggle('pinned', !!pin);
    const r = pop.getBoundingClientRect();
    let left = ev.clientX + 14, top = ev.clientY + 14;
    if (left + r.width > innerWidth - 8) left = Math.max(8, ev.clientX - r.width - 14);
    if (top + r.height > innerHeight - 8) top = Math.max(8, ev.clientY - r.height - 14);
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
  }
  function hidePop(force) {
    if (pinned >= 0 && !force) return;
    const pop = document.getElementById('tl-pop'); if (pop) pop.hidden = true;
  }

  function wire(box) {
    pinned = -1;
    box.querySelectorAll('[data-ov]').forEach((g) => {
      g.addEventListener('mousemove', (e) => { if (pinned < 0) showPop(+g.dataset.ov, e, false); });
      g.addEventListener('mouseleave', () => hidePop(false));
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        box.querySelectorAll('.pin').forEach((x) => x.classList.remove('pin'));
        if (pinned === +g.dataset.ov) { pinned = -1; hidePop(true); return; }
        pinned = +g.dataset.ov; g.classList.add('pin'); showPop(pinned, e, true);
      });
    });
    box.querySelectorAll('.seg').forEach((s) => s.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const n = s.dataset.name, v = b.dataset.v;
      if (n === 'group') { group = v; store.set('group', group); }
      else if (n === 'range') { range = v; store.set('range', range); zoomChanged = true; }
      else if (n === 'colorBy') { colorBy = v; store.set('colorBy', colorBy); }
      else if (n === 'zoom') { zoom = v; store.set('zoom', zoom); zoomChanged = true; }
      else if (n === 'fold') {
        box.querySelectorAll('.tl-grp').forEach((g) => { expanded[g.dataset.grp] = v === 'open'; });
        store.set('expanded', JSON.stringify(expanded));
      }
      render();
    })));
    box.querySelectorAll('.tl-grp').forEach((g) => g.addEventListener('click', (e) => {
      e.stopPropagation();
      const k = g.dataset.grp, n = Number((g.querySelector('text:last-child') || {}).textContent ? parseInt(g.querySelector('text:last-child').textContent, 10) : 0);
      const cur = k in expanded ? expanded[k] : n <= 8;
      expanded[k] = !cur; store.set('expanded', JSON.stringify(expanded)); render();
    }));
    box.querySelectorAll('.tl-lane, .tl-lane-lab').forEach((g) => g.addEventListener('click', (e) => {
      e.stopPropagation();
      selected = selected === g.dataset.id ? '' : g.dataset.id; store.set('selected', selected); render();
    }));
    box.querySelectorAll('[data-go]').forEach((a) => a.addEventListener('click', () => { selected = a.dataset.go; store.set('selected', selected); render(); }));
    box.querySelectorAll('svg.tl-plot').forEach((svg) => svg.addEventListener('click', () => { if (pinned >= 0) { pinned = -1; hidePop(true); return; } if (selected) { selected = ''; store.set('selected', ''); render(); } }));
  }

  let busy = false;
  async function refresh() {
    if (busy) return; busy = true;
    try {
      const d = await (await fetch('/api/timeline', { cache: 'no-store' })).json();
      data = d; render();
    } catch (e) {
      const box = document.getElementById('tl'); if (box) box.innerHTML = '<div class="err">timeline unreachable: ' + esc(e.message) + '</div>';
    } finally { busy = false; }
  }
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(render, 150); });
  window.TL = { refresh };
})();
