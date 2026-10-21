// Tack board, chart helpers: inline SVG as strings, no dependency, no canvas. Loaded before board.js,
// timeline.js and insights.js; test/charts.test.mjs runs this same file in a vm, so nothing here
// touches the DOM. Colours are the board's tokens (board.css), so both themes repaint with no re-render.
'use strict';
(function (root) {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
  const r1 = (v) => Math.round(v * 10) / 10;

  // Model families, in the fixed order of the categorical palette (validated in light and dark).
  const FAMILIES = [['opus', 'Opus'], ['sonnet', 'Sonnet'], ['haiku', 'Haiku'], ['other', 'Other model'], ['unattributed', 'No model recorded']];
  const famColor = (f) => 'var(--f-' + (FAMILIES.some(([k]) => k === f) ? f : 'other') + ')';
  /** The family of a model id; the same rule as modelFamily in src/metrics/layer1.mjs. */
  const family = (model) => (/opus/i.test(model) ? 'opus' : /sonnet/i.test(model) ? 'sonnet' : /haiku/i.test(model) ? 'haiku' : 'other');
  /** A short model name: vendor, claude- and date suffix dropped, the version dotted (claude-opus-5-5 -> opus 5.5). */
  function modelShort(id) {
    let m = String(id).replace(/^[\w.-]+\//, '').replace(/^claude-/, '');
    const big = /\[1m\]$/i.test(m);
    m = m.replace(/\[1m\]$/i, '').replace(/-\d{8}$/, '');
    const v = /^(opus|sonnet|haiku)-(\d+)(?:[-.](\d+))?$/.exec(m);
    if (v) m = v[1] + ' ' + v[2] + (v[3] ? '.' + v[3] : '');
    return m + (big ? ' 1M' : '');
  }

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  /** 'YYYY-MM-DD' as 'Oct 19', with the year only when it is not the current one ('Oct 19, 2025'). */
  function dayLabel(day, now = new Date()) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day || '');
    if (!m) return '–';
    const s = MONTHS[Number(m[2]) - 1] + ' ' + Number(m[3]);
    return Number(m[1]) === now.getFullYear() ? s : s + ', ' + m[1];
  }
  /** 'YYYY-MM-DD' as 'Oct 19', never with the year: for axis labels. */
  const dayShort = (day) => { const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(day || ''); return m ? MONTHS[Number(m[1]) - 1] + ' ' + Number(m[2]) : '–'; };
  const pad = (n) => String(n).padStart(2, '0');
  const dayKey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  /** Every local day from the smallest to the largest key, inclusive; [] for no key. */
  function dayRange(keys) {
    const ks = keys.filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
    if (!ks.length) return [];
    const out = [];
    const [y, m, d] = ks[0].split('-').map(Number);
    for (let i = 0; out.length < 3660; i++) {
      const k = dayKey(new Date(y, m - 1, d + i));
      out.push(k);
      if (k >= ks[ks.length - 1]) break;
    }
    return out;
  }

  /** The smallest 1, 2 or 5 times a power of ten at or above v; 1 for v <= 0. */
  function niceMax(v) {
    if (!(v > 0)) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    return [1, 2, 5, 10].map((k) => k * p).find((x) => x >= v * (1 - 1e-9));
  }

  const empty = (msg) => '<div class="ch-empty" role="note">' + esc(msg || 'No data in this selection.') + '</div>';
  // In the page every chart is drawn twice: first at the default width, then by fit() at the pixel width of its
  // container, so one viewBox unit is one CSS pixel and the 10 px axis text (board.css) stays 10 px at any width.
  // The options of each drawn chart are kept by id for that second pass; outside a DOM nothing is kept.
  const specs = new Map();
  let seq = 0;
  const keep = (kind, o) => { if (typeof document === 'undefined') return ''; const id = 'c' + ++seq; specs.set(id, { kind, o }); return ' data-chart="' + id + '"'; };
  const frame = (W, H, label, body, k = '') => '<svg class="ch"' + k + ' viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="' + esc(label) + '"><title>' + esc(label) + '</title>' + body + '</svg>';
  // A bar whose data end has 4 px rounded corners and whose baseline end is square.
  const topBar = (x, y, w, h) => {
    const r = Math.min(4, w / 2, h);
    return 'M' + r1(x) + ' ' + r1(y + h) + 'V' + r1(y + r) + 'Q' + r1(x) + ' ' + r1(y) + ' ' + r1(x + r) + ' ' + r1(y) + 'H' + r1(x + w - r) +
      'Q' + r1(x + w) + ' ' + r1(y) + ' ' + r1(x + w) + ' ' + r1(y + r) + 'V' + r1(y + h) + 'Z';
  };
  const W0 = 520, H = 180, L = 44, R = 8, T = 14, B = 24, MIN_W = 240;
  /** The viewBox width of a chart drawn in a container of px CSS pixels: px itself, never below 240; 520 when unknown. */
  const chartWidth = (px) => (isNum(px) && px > 0 ? Math.max(MIN_W, Math.round(px)) : W0);
  const LABEL_GAP = 56; // px between two axis labels: «Oct 19» at 10 px is about 36 px wide
  /**
   * Which of n category labels an axis W wide shows: every step-th, the last always, and a label dropped when
   * it sits closer than LABEL_GAP to the last one where the last is drawn (labelX may move it left).
   */
  function xLabels(n, W = W0) {
    const bw = (W - L - R) / n;
    const fit = Math.max(2, Math.floor((W - L - R) / LABEL_GAP));
    const step = Math.max(1, Math.ceil(n / fit));
    const lastX = Math.min(L + (n - 1) * bw + bw / 2, W - 18);
    return (i) => i === n - 1 || (i % step === 0 && lastX - (L + i * bw + bw / 2) >= LABEL_GAP);
  }
  /** The x of an axis label centred at x, moved left so that half a label (18 px) stays inside W. */
  const labelX = (x, W) => r1(Math.min(x, W - 18));
  function yAxis(max, fmt, W) {
    const base = H - B;
    let s = '';
    for (let k = 1; k <= 4; k++) {
      const y = r1(base - (k * (base - T)) / 4);
      s += '<line x1="' + L + '" y1="' + y + '" x2="' + (W - R) + '" y2="' + y + '" stroke="var(--t-line)" shape-rendering="crispEdges"/>';
      if (k % 2 === 0) s += '<text x="' + (L - 6) + '" y="' + (y + 3) + '" text-anchor="end" fill="var(--t-muted)">' + esc(fmt((max * k) / 4)) + '</text>';
    }
    return s + '<line x1="' + L + '" y1="' + base + '" x2="' + (W - R) + '" y2="' + base + '" stroke="var(--t-line3)" shape-rendering="crispEdges"/>' +
      '<text x="' + (L - 6) + '" y="' + (base + 3) + '" text-anchor="end" fill="var(--t-muted)">0</text>';
  }

  /**
   * Vertical bars, stacked when there are several series. o.cats: [{ key, label }]; o.stacks: [{ name,
   * color, values }] with one value per category, a missing or non-numeric value drawn as nothing,
   * never as 0; o.marks: optional count per category drawn as a hollow «?» marker above the bar
   * (o.markLabel names it); o.fmt formats a value; o.label is the text alternative.
   */
  function bars(o) {
    const cats = o.cats || [], stacks = o.stacks || [], fmt = o.fmt || String, marks = o.marks || [];
    const total = (i) => stacks.reduce((a, st) => a + (isNum(st.values[i]) ? st.values[i] : 0), 0);
    const hasValue = cats.some((_, i) => stacks.some((st) => isNum(st.values[i])) || marks[i] > 0);
    if (!cats.length || !hasValue) return empty(o.empty);
    const max = niceMax(Math.max(0, ...cats.map((_, i) => total(i))));
    const W = chartWidth(o.width);
    const base = H - B, ph = base - T, bw = (W - L - R) / cats.length, w = Math.max(2, Math.min(36, bw - Math.max(1, bw * 0.25)));
    const show = xLabels(cats.length, W);
    let s = yAxis(max, fmt, W);
    cats.forEach((c, i) => {
      const x = L + i * bw + (bw - w) / 2;
      let y = base;
      const segs = stacks.map((st) => [st, st.values[i]]).filter(([, v]) => isNum(v) && v > 0);
      segs.forEach(([st, v], j) => {
        const h = (v / max) * ph;
        const gap = j < segs.length - 1 && h > 3 ? 2 : 0; // a 2 px surface gap between stacked segments
        s += j === segs.length - 1
          ? '<path d="' + topBar(x, y - h, w, h) + '" fill="' + st.color + '"/>'
          : '<rect x="' + r1(x) + '" y="' + r1(y - h + gap) + '" width="' + r1(w) + '" height="' + r1(Math.max(h - gap, 0.5)) + '" fill="' + st.color + '"/>';
        y -= h;
      });
      if (marks[i] > 0) s += '<g class="ch-unk"><circle cx="' + r1(x + w / 2) + '" cy="' + r1(y - 9) + '" r="5.5" fill="var(--t-panel)" stroke="var(--t-muted)" stroke-width="1.2"/>' +
        '<text x="' + r1(x + w / 2) + '" y="' + r1(y - 6) + '" text-anchor="middle" fill="var(--t-text2)" font-size="8.5">?</text></g>';
      if (show(i)) s += '<text x="' + labelX(x + w / 2, W) + '" y="' + (base + 15) + '" text-anchor="middle" fill="var(--t-muted)">' + esc(c.label) + '</text>';
      const tip = [c.label].concat(stacks.map((st) => (stacks.length > 1 || st.name ? st.name + ': ' : '') + (isNum(st.values[i]) ? fmt(st.values[i]) : '–')),
        marks[i] > 0 ? [marks[i] + ' ' + (o.markLabel || 'unknown')] : []).join('\n');
      s += '<rect class="ch-hit" x="' + r1(L + i * bw) + '" y="' + T + '" width="' + r1(bw) + '" height="' + (ph + B) + '" fill="transparent"><title>' + esc(tip) + '</title></rect>';
    });
    return frame(W, H, o.label || '', s, keep('bars', o));
  }

  /** A 2 px line over categories; a missing value breaks it. o.cats, o.values, o.color, o.fmt, o.label as for bars. */
  function line(o) {
    const cats = o.cats || [], vals = o.values || [], fmt = o.fmt || String, color = o.color || 'var(--t-accent)';
    if (!cats.length || !vals.some(isNum)) return empty(o.empty);
    const max = niceMax(Math.max(0, ...vals.filter(isNum)));
    const W = chartWidth(o.width);
    const base = H - B, ph = base - T, bw = (W - L - R) / cats.length;
    const px = (i) => L + i * bw + bw / 2, py = (v) => base - (v / max) * ph;
    const show = xLabels(cats.length, W);
    let s = yAxis(max, fmt, W), d = '', open = false;
    vals.forEach((v, i) => {
      if (!isNum(v)) { open = false; return; }
      d += (open ? 'L' : 'M') + r1(px(i)) + ' ' + r1(py(v));
      open = true;
    });
    if (d.includes('L')) s += '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    vals.forEach((v, i) => {
      const alone = isNum(v) && !isNum(vals[i - 1]) && !isNum(vals[i + 1]);
      if (isNum(v) && (alone || cats.length <= 31)) s += '<circle cx="' + r1(px(i)) + '" cy="' + r1(py(v)) + '" r="4" fill="' + color + '" stroke="var(--t-panel)" stroke-width="2"/>';
      if (show(i)) s += '<text x="' + labelX(px(i), W) + '" y="' + (base + 15) + '" text-anchor="middle" fill="var(--t-muted)">' + esc(cats[i].label) + '</text>';
      s += '<rect class="ch-hit" x="' + r1(L + i * bw) + '" y="' + T + '" width="' + r1(bw) + '" height="' + (ph + B) + '" fill="transparent"><title>' + esc(cats[i].label + '\n' + (isNum(v) ? fmt(v) : '–')) + '</title></rect>';
    });
    return frame(W, H, o.label || '', s, keep('line', o));
  }

  /** Horizontal share meters, one per part: { label, value (0..1) or null, detail }. Null reads «unknown», never 0 %. */
  function meters(o) {
    const parts = o.parts || [];
    if (!parts.length) return empty(o.empty);
    const MW = chartWidth(o.width), RH = 34, LW = 150, VW = 64, TW = MW - LW - VW;
    let s = '';
    parts.forEach((p, i) => {
      const y = i * RH + 6, known = isNum(p.value), v = known ? Math.max(0, Math.min(1, p.value)) : 0;
      s += '<text x="0" y="' + (y + 10) + '" fill="var(--t-text2)">' + esc(p.label) + '</text>' +
        '<rect x="' + LW + '" y="' + y + '" width="' + TW + '" height="12" rx="3" fill="var(--t-tag)"/>' +
        (known && v > 0 ? '<rect x="' + LW + '" y="' + y + '" width="' + r1(Math.max(TW * v, 3)) + '" height="12" rx="3" fill="' + (p.color || 'var(--t-accent)') + '"/>' : '') +
        '<text x="' + MW + '" y="' + (y + 10) + '" text-anchor="end" fill="var(--t-text)">' + (known ? r1(100 * p.value) + '%' : 'unknown') + '</text>' +
        (p.detail ? '<text x="' + LW + '" y="' + (y + 25) + '" fill="var(--t-muted)">' + esc(p.detail) + '</text>' : '') +
        '<rect class="ch-hit" x="0" y="' + (y - 4) + '" width="' + MW + '" height="' + RH + '" fill="transparent"><title>' + esc(p.label + ': ' + (known ? r1(100 * p.value) + '%' : 'unknown') + (p.detail ? '\n' + p.detail : '')) + '</title></rect>';
    });
    return frame(MW, parts.length * RH + 4, o.label || '', s, keep('meters', o));
  }

  /**
   * The second pass (DOM only): redraws every chart under box at the pixel width of its container, and forgets
   * the options of charts no longer in the page. Call after inserting charts and on resize.
   */
  function fit(box) {
    const draw = { bars, line, meters };
    for (const svg of box.querySelectorAll('svg.ch[data-chart]')) {
      const spec = specs.get(svg.dataset.chart);
      const px = svg.parentNode ? svg.parentNode.clientWidth : 0;
      if (!spec || !(px > 0) || chartWidth(px) === Number(svg.viewBox.baseVal.width)) continue;
      svg.outerHTML = draw[spec.kind]({ ...spec.o, width: px });
    }
    const live = new Set([...document.querySelectorAll('svg.ch[data-chart]')].map((x) => x.dataset.chart));
    for (const id of specs.keys()) if (!live.has(id)) specs.delete(id);
  }

  /** Small multiples: panels side by side, each { title, kind: 'bars' | 'line', ...its options }, each with its own axis. */
  function multiples(panels) {
    if (!panels || !panels.length) return empty();
    return '<div class="ch-multi">' + panels.map((p) => '<div class="ch-panel"><div class="ch-pt">' + esc(p.title) + '</div>' + (p.kind === 'line' ? line(p) : bars(p)) + '</div>').join('') + '</div>';
  }

  /** Legend entries [[label, colour, title]], colour 'unknown' for the «?» marker: a swatch beside text in text ink, never text in the series colour. */
  const legend = (items) => '<div class="ch-legend">' + items.map(([label, color, title]) => '<span' + (title ? ' title="' + esc(title) + '"' : '') + '>' + (color === 'unknown' ? '<i class="q" aria-hidden="true">?</i>' : '<i style="background:' + color + '"></i>') + esc(label) + '</span>').join('') + '</div>';

  root.TackCharts = { esc, isNum, FAMILIES, famColor, family, modelShort, dayLabel, dayShort, dayKey, dayRange, niceMax, chartWidth, xLabels, empty, bars, line, meters, multiples, legend, fit };
})(typeof window !== 'undefined' ? window : globalThis);
