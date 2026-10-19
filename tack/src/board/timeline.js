// Tack board, Timeline view: one swimlane per repository (per branch when one repository is selected),
// each session a bar from its first to its last event, coloured by model family, a mark where the
// main-thread context first reached the threshold, the repository's commits within the hour as ticks
// under the bar. Day or week window in local days. Adapted from Jjodel's lane-board timeline.js
// (P-2026-10-19-1520): the label column, the packing of overlapping bars into sub-rows and the popover;
// none of its lane, chat or dependency concepts. html() is pure (test/board.test.mjs runs it in a vm).
'use strict';
(function (root) {
  const C = root.TackCharts, B = root.TackBoard;
  const esc = C.esc;
  const pad = (n) => String(n).padStart(2, '0');
  const hm = (t) => { const d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const md = (t) => { const d = new Date(t); return MONTHS[d.getMonth()] + ' ' + d.getDate(); };

  /** [start, end) of the local day, or of the Monday-to-Monday week, that contains t. */
  function windowOf(zoom, t) {
    const d = new Date(t); d.setHours(0, 0, 0, 0);
    if (zoom === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const e = new Date(d); e.setDate(e.getDate() + (zoom === 'week' ? 7 : 1));
    return [d.getTime(), e.getTime()];
  }
  /** The window k steps away from the one starting at t0 (local calendar arithmetic, DST-safe). */
  function shift(zoom, t0, k) { const d = new Date(t0); d.setDate(d.getDate() + k * (zoom === 'week' ? 7 : 1)); return windowOf(zoom, d.getTime()); }
  const windowLabel = (zoom, t0, t1) => zoom === 'week' ? md(t0) + ' – ' + md(t1 - 1) + ', ' + new Date(t1 - 1).getFullYear() : WD[new Date(t0).getDay()] + ' ' + md(t0) + ', ' + new Date(t0).getFullYear();

  const LABEL = 200, AXIS = 26, ROW = 26, GAP = 8;

  /**
   * The view as HTML. rows: the /api/sessions rows; geo: the /api/timeline rows; zoom 'day' | 'week';
   * [t0, t1) the window; width the pixels available; byBranch: one swimlane per branch, else per repository.
   */
  function html({ rows, geo, zoom, t0, t1, width = 1000, byBranch = false, threshold = 200000, selected = null, now = Date.now() }) {
    const byId = new Map(rows.map((s) => [s.id, s]));
    const items = geo.filter((g) => byId.has(g.id) && g.end >= t0 && g.start < t1).map((g) => ({ g, s: byId.get(g.id) }));
    const seg = (name, opts, cur) => '<span class="seg" data-name="' + name + '">' + opts.map(([v, l]) => '<button type="button" data-v="' + v + '" class="' + (v === cur ? 'on' : '') + '">' + l + '</button>').join('') + '</span>';
    const families = C.FAMILIES.filter(([f]) => items.some((x) => x.g.family === f));
    let out = '<div class="tl-bar">' + seg('zoom', [['day', 'Day'], ['week', 'Week']], zoom) +
      '<span class="seg" data-name="nav"><button type="button" data-v="-1" aria-label="Previous ' + zoom + '">‹</button><button type="button" data-v="latest">Latest</button><button type="button" data-v="1" aria-label="Next ' + zoom + '">›</button></span>' +
      '<b class="tl-win">' + esc(windowLabel(zoom, t0, t1)) + '</b><span class="meta">' + items.length + ' session' + (items.length === 1 ? '' : 's') + ' · one row per ' + (byBranch ? 'branch' : 'repository') + '</span>' +
      '<span class="tl-legend">' + families.map(([f, l]) => '<span><i style="background:' + C.famColor(f) + '"></i>' + esc(l) + '</span>').join('') +
      '<span><svg width="10" height="12" aria-hidden="true"><line x1="5" y1="0" x2="5" y2="12" stroke="var(--t-wait)" stroke-width="2"/></svg>context ≥ ' + Math.round(threshold / 1000) + 'k</span>' +
      '<span><svg width="10" height="8" aria-hidden="true"><line x1="5" y1="1" x2="5" y2="7" stroke="var(--t-text2)" stroke-width="1.5"/></svg>commit within the hour</span></span></div>';
    if (!items.length) return out + '<div class="tl-wrap"><div class="tl-empty">No session in this window. Use ‹ › or Latest.</div></div>';

    // Swimlanes, newest first; overlapping sessions of one swimlane packed into sub-rows, oldest first.
    const keyOf = (s) => (byBranch ? s.branch || '(no branch)' : s.repo_name || 'no repository');
    const groups = new Map();
    items.sort((a, b) => a.g.start - b.g.start || (a.g.id < b.g.id ? -1 : 1)).forEach((x) => { const k = keyOf(x.s); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(x); });
    const order = [...groups].sort(([, p], [, q]) => Math.max(...q.map((x) => x.g.end)) - Math.max(...p.map((x) => x.g.end)));

    const plotW = Math.max(width - LABEL - 2, 360) - 16;
    const x = (t) => Math.round((8 + ((Math.min(Math.max(t, t0), t1) - t0) / (t1 - t0)) * plotW) * 10) / 10;
    let y = AXIS + 4;
    const lab = [], bars = [], seps = [];
    for (const [k, xs] of order) {
      const ends = [];
      xs.forEach((it) => { let r = ends.findIndex((e) => e + 60e3 < it.g.start); if (r === -1) { r = ends.length; ends.push(0); } ends[r] = it.g.end; it.row = r; });
      const h = ends.length * ROW + GAP;
      const name = k.length > 28 ? k.slice(0, 27) + '…' : k;
      lab.push('<g><title>' + esc(k) + '</title><text x="14" y="' + (y + 15) + '" fill="var(--t-text)">' + esc(name) + '</text>' +
        '<text x="14" y="' + (y + 28) + '" fill="var(--t-muted)" font-size="10.5">' + xs.length + ' session' + (xs.length === 1 ? '' : 's') + '</text></g>');
      seps.push('<line x1="0" y1="' + (y + h - GAP / 2) + '" x2="100%" y2="' + (y + h - GAP / 2) + '" stroke="var(--t-line)"/>');
      for (const { g, s, row } of xs) {
        const by = y + row * ROW + 4, x0 = x(g.start), x1 = Math.max(x(g.end), x0 + 3);
        const ticks = g.commits.filter((t) => t >= t0 && t <= t1).map((t) => 'M' + x(t) + ' ' + (by + 13) + 'v6').join('');
        const cross = g.crossed !== null && g.crossed >= t0 && g.crossed < t1
          ? '<line x1="' + x(g.crossed) + '" y1="' + (by - 2) + '" x2="' + x(g.crossed) + '" y2="' + (by + 12) + '" stroke="var(--t-panel)" stroke-width="4"/><line x1="' + x(g.crossed) + '" y1="' + (by - 2) + '" x2="' + x(g.crossed) + '" y2="' + (by + 12) + '" stroke="var(--t-wait)" stroke-width="2"/>' : '';
        const hx = Math.min(x0, ...g.commits.filter((t) => t >= t0 && t <= t1).map(x)) - 2;
        const hw = Math.max(x1, ...g.commits.filter((t) => t >= t0 && t <= t1).map(x)) + 2 - hx;
        bars.push('<g class="tl-s' + (g.id === selected ? ' sel' : '') + '" data-id="' + esc(g.id) + '" tabindex="0" role="button" aria-label="' + esc('Session ' + (s.repo_name || '') + ' ' + hm(g.start) + ' to ' + hm(g.end) + ', ' + g.family) + '">' +
          '<rect class="tl-hit" x="' + hx + '" y="' + (by - 3) + '" width="' + Math.max(hw, 8) + '" height="' + (ROW - 2) + '" fill="transparent"/>' +
          '<rect class="tl-b" x="' + x0 + '" y="' + by + '" width="' + Math.round((x1 - x0) * 10) / 10 + '" height="10" rx="2" fill="' + C.famColor(g.family) + '"/>' + cross +
          (ticks ? '<path d="' + ticks + '" stroke="var(--t-text2)" stroke-width="1.5"/>' : '') + '</g>');
      }
      y += h;
    }
    const H = y + 4;
    // Axis: two-hour ticks over a day, days over a week; midnight lines stronger.
    let axis = '';
    const d = new Date(t0);
    for (let i = 0; ; i++) {
      const t = zoom === 'week' ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), i * 6).getTime() : new Date(d.getFullYear(), d.getMonth(), d.getDate(), i * 2).getTime();
      if (t > t1) break;
      const midnight = new Date(t).getHours() === 0;
      const labelled = zoom === 'day' || midnight;
      axis += '<line x1="' + x(t) + '" y1="' + (AXIS - 6) + '" x2="' + x(t) + '" y2="' + H + '" stroke="' + (midnight ? 'var(--t-line3)' : 'var(--t-line)') + '"/>';
      if (labelled && t < t1) axis += '<text class="mono" x="' + (x(t) + 3) + '" y="' + (AXIS - 9) + '" fill="var(--t-muted)">' + (zoom === 'week' ? WD[new Date(t).getDay()] + ' ' + new Date(t).getDate() : hm(t)) + '</text>';
    }
    if (now >= t0 && now < t1) axis += '<line x1="' + x(now) + '" y1="4" x2="' + x(now) + '" y2="' + H + '" stroke="var(--t-accent)"/><text class="mono" x="' + (x(now) + 3) + '" y="11" fill="var(--t-accent)">now</text>';
    const label = 'Timeline, ' + windowLabel(zoom, t0, t1) + ': ' + items.length + ' sessions in ' + order.length + (byBranch ? ' branches' : ' repositories');
    return out + '<div class="tl-wrap tl-split' + (selected ? ' tl-dim' : '') + '">' +
      '<svg class="tl-labels" width="' + LABEL + '" height="' + H + '" aria-hidden="true">' + lab.join('') + '</svg>' +
      '<div class="tl-scroll"><svg class="tl-plot" width="' + (plotW + 16) + '" height="' + H + '" role="img" aria-label="' + esc(label) + '"><title>' + esc(label) + '</title>' + seps.join('') + axis + bars.join('') + '</svg></div></div>' +
      '<div class="tl-pop" id="tl-pop" hidden></div><div class="tl-note meta">Hover a bar for the session; click it, or press Enter on it, to select it in Sessions.</div>';
  }

  /** The popover of one session: the Sessions row fields, plus the times the bar encodes. */
  function popHtml(s, g, threshold) {
    const c = B.sessionCells(s, threshold, new Date());
    const ub = B.unitOrBranch(s);
    const rows = [['Day', c.day + ' · ' + c.start + ' to ' + hm(g.end)], ['Repository', c.repo], [ub.kind === 'unit' ? 'Unit' : 'Branch', c.ub], ['Link', c.link], ['Duration', c.duration],
      ['Calls', c.calls], ['Context peak', c.peak + (g.crossed !== null ? ' <span class="dim">(≥ ' + Math.round(threshold / 1000) + 'k at ' + hm(g.crossed) + ')</span>' : '')], ['Cost', c.cost],
      ['Models', c.models], ['Commit ≤ 1 h', c.commit + (g.commits.length ? ' <span class="dim">(' + g.commits.length + ' commit' + (g.commits.length === 1 ? '' : 's') + ')</span>' : '')]];
    return '<div class="hd">' + esc(s.id) + '</div><table>' + rows.map(([k, v]) => '<tr><td>' + k + '</td><td>' + v + '</td></tr>').join('') + '</table>';
  }

  root.TackTimeline = { html, popHtml, windowOf, shift };
  if (typeof document === 'undefined') return;

  const view = { zoom: 'day', t0: null, data: null };
  function render(state, box) {
    if (view.data !== state.timeline) { view.data = state.timeline; view.t0 = null; } // a new selection opens on its latest session
    const geo = state.timeline.sessions;
    const latest = geo.length ? Math.max(...geo.map((g) => g.start)) : Date.now();
    const [t0, t1] = view.t0 === null ? windowOf(view.zoom, latest) : windowOf(view.zoom, view.t0);
    view.t0 = t0;
    const keep = box.querySelector('.tl-scroll');
    box.innerHTML = html({ rows: state.data.sessions, geo, zoom: view.zoom, t0, t1, width: box.clientWidth || 1000, byBranch: state.data.repo !== null, threshold: state.threshold, selected: state.selected });
    if (keep) { const sc = box.querySelector('.tl-scroll'); if (sc) sc.scrollLeft = keep.scrollLeft; }
    wire(state, box, geo);
  }

  function wire(state, box, geo) {
    const pop = box.querySelector('#tl-pop');
    const byGeo = new Map(geo.map((g) => [g.id, g]));
    const byRow = new Map(state.data.sessions.map((s) => [s.id, s]));
    box.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
      const name = b.parentElement.dataset.name, v = b.dataset.v;
      if (name === 'zoom') { view.zoom = v; view.t0 = windowOf(v, view.t0)[0]; }
      else if (v === 'latest') view.t0 = null;
      else view.t0 = shift(view.zoom, view.t0, Number(v))[0];
      render(state, box);
    }));
    box.querySelectorAll('g.tl-s').forEach((el) => {
      const id = el.dataset.id;
      const show = (ev) => {
        if (!pop) return;
        pop.innerHTML = popHtml(byRow.get(id), byGeo.get(id), state.threshold);
        pop.hidden = false;
        const r = ev.clientX !== undefined && ev.type !== 'focus' ? { x: ev.clientX, y: ev.clientY } : (() => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.bottom }; })();
        const w = pop.offsetWidth, h = pop.offsetHeight;
        pop.style.left = Math.max(8, Math.min(r.x + 14, innerWidth - w - 8)) + 'px';
        pop.style.top = (r.y + 16 + h > innerHeight ? Math.max(8, r.y - h - 10) : r.y + 16) + 'px';
      };
      el.addEventListener('mousemove', show);
      el.addEventListener('focus', show);
      el.addEventListener('mouseleave', () => { if (pop) pop.hidden = true; });
      el.addEventListener('blur', () => { if (pop) pop.hidden = true; });
      el.addEventListener('click', () => B.selectSession(id));
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); B.selectSession(id); } });
    });
  }

  root.TackViews.timeline = { render };
})(typeof window !== 'undefined' ? window : globalThis);
