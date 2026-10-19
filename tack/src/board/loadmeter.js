// Tack board, host load strip in the top bar: 60 thin bars (one per 5 s sample, the newest on the right),
// the 1-minute load in figures beside them, a dashed line at the launch threshold, bar colour by zone, and a
// tick above the bar where a lane started or ended. Polls GET /api/load every 5 s while the page is visible.
// zone(), tickBar() and stripSvg() are pure (test/load.test.mjs runs them in a vm).
'use strict';
(function (root) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const BAR = 2, GAP = 1, H = 22, TOP = 4, SLOTS = 60;

  /** red above the threshold, amber from 85 % of it up to it (both ends included), neutral below. */
  const zone = (v, T) => (v > T ? 'red' : v >= 0.85 * T ? 'amber' : 'neutral');

  /** The bar a lane event at time t falls on: the sample i with times[i-1] < t <= times[i]; -1 outside the strip. */
  function tickBar(times, t, step = 5000) {
    for (let i = 0; i < times.length; i++) {
      const lo = i === 0 ? times[0] - step : times[i - 1];
      if (t > lo && t <= times[i]) return i;
    }
    return -1;
  }

  /** The strip as SVG: bars right-aligned to the 60 slots, the threshold line, the ticks; values raw or per core. */
  function stripSvg({ samples = [], threshold = 20, ticks = [], normalised = false, cores = null } = {}) {
    const div = normalised && cores ? cores : 1;
    const T = threshold / div;
    const vals = samples.map((s) => s.load1 / div);
    const max = Math.max(T * 1.25, ...vals, 0.01);
    const W = SLOTS * (BAR + GAP);
    const y = (v) => TOP + H - (Math.min(v, max) / max) * H;
    const off = SLOTS - samples.length;
    const times = samples.map((s) => s.t);
    const bars = samples.map((s, i) => {
      const v = vals[i], top = y(v);
      const tip = 'load ' + [s.load1, s.load5, s.load15].map((x) => (x / div).toFixed(2)).join(' / ') + (normalised && cores ? ' per core' : '') + ' · lanes running ' + (s.running ?? 0);
      return '<rect class="lm-b lm-' + zone(v, T) + '" x="' + (off + i) * (BAR + GAP) + '" y="' + top.toFixed(1) + '" width="' + BAR + '" height="' + Math.max(TOP + H - top, 1).toFixed(1) + '"><title>' + esc(tip) + '</title></rect>';
    });
    const marks = ticks.map((k) => [tickBar(times, k.t), k.kind]).filter(([i]) => i >= 0)
      .map(([i, kind]) => '<rect class="lm-t lm-' + kind + '" x="' + (off + i) * (BAR + GAP) + '" y="0" width="' + BAR + '" height="3"/>');
    const ty = y(T).toFixed(1);
    return '<svg class="lm-svg" width="' + W + '" height="' + (TOP + H) + '" viewBox="0 0 ' + W + ' ' + (TOP + H) + '" aria-hidden="true"><g class="lm-bars">' + bars.join('') + '</g>' +
      marks.join('') + '<line class="lm-th" x1="0" x2="' + W + '" y1="' + ty + '" y2="' + ty + '"/></svg>';
  }

  /** The figure beside the strip: the current 1-minute load and its zone. */
  function figure({ samples = [], threshold = 20, normalised = false, cores = null } = {}) {
    const s = samples.at(-1);
    if (!s) return { text: '–', zone: 'neutral' };
    const div = normalised && cores ? cores : 1;
    return { text: (s.load1 / div).toFixed(normalised ? 2 : 1), zone: zone(s.load1 / div, threshold / div) };
  }

  root.TackLoad = { zone, tickBar, stripSvg, figure };
  if (typeof document === 'undefined') return;

  const el = document.getElementById('lm');
  let last = 0;
  async function poll() {
    if (document.visibilityState !== 'visible') return;
    try {
      const repo = new URL(location.href).searchParams.get('repo') || 'all';
      const r = await fetch('/api/load?repo=' + encodeURIComponent(repo), { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      const f = figure(d);
      const moved = d.samples.length && d.samples.at(-1).t !== last;
      last = d.samples.length ? d.samples.at(-1).t : 0;
      el.innerHTML = stripSvg(d) + '<b class="lm-v lm-' + f.zone + '">' + esc(f.text) + '</b>';
      el.title = 'Host load, 1 minute' + (d.normalised && d.cores ? ' per core (' + d.cores + ' cores)' : '') + '; dashed line: launch threshold ' + d.threshold + ' (raw); ticks: lane start or end';
      if (moved) el.classList.remove('lm-in'), void el.offsetWidth, el.classList.add('lm-in');
    } catch { /* the next poll retries */ }
  }
  poll();
  setInterval(poll, 5000);
  document.addEventListener('visibilitychange', poll);
})(typeof window !== 'undefined' ? window : globalThis);
