// Tack board, page script: no build step, no dependency. The selection lives in the URL
// (?repo=<key>|all&since=&until=, #<tab>; Lanes is the first and default tab); the page writes nothing anywhere else. The helpers above
// the DOM guard are pure (test/board.test.mjs runs them in a vm); timeline.js and insights.js
// register their views in TackViews and read the data loaded here.
'use strict';
(function (root) {
  const C = root.TackCharts;
  const esc = C.esc;
  const int = (n) => Math.round(n).toLocaleString('en-US');
  const usd = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (x) => (x === null ? '–' : (100 * x).toFixed(1) + '%');
  const hhmm = (iso) => { const d = new Date(iso); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const dur = (m) => (m === null ? '–' : m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0'));
  const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

  /** What the Unit / branch column shows: the unit when the session has one (layer 2), else the branch. */
  const unitOrBranch = (s) => (s.unit ? { kind: 'unit', text: s.unit } : s.branch ? { kind: 'branch', text: s.branch } : { kind: null, text: null });
  const modelsShort = (models) => [...new Set(models.map(C.modelShort))].join(', ');

  /** The cells of a Sessions row, as HTML, keyed by column; the Timeline popover shows the same fields. */
  function sessionCells(s, threshold, now) {
    const ub = unitOrBranch(s);
    return {
      day: s.day ? esc(C.dayLabel(s.day, now)) : '–',
      start: s.start ? hhmm(s.start) : '–',
      repo: s.repo ? '<span title="' + esc(s.repo) + '">' + esc(s.repo_name) + '</span>' : '<span class="dim" title="No repository">– ' + esc(s.missing) + '</span>',
      ub: ub.kind === 'unit' ? '<span class="unit" title="' + (s.unit_source === 'prompt' ? 'Unit named by the first user message' : 'Unit of the nearest commit reachable from the session branch, within the hour (proximity, not authorship)') + (s.branch ? '; branch ' + esc(s.branch) : '') + '">' + esc(ub.text) + '</span>'
        : ub.kind === 'branch' ? '<span title="Branch ' + esc(ub.text) + '">' + esc(ub.text) + '</span>' : '<span class="dim">–</span>',
      link: '<span class="tag">' + esc(s.link) + '</span>',
      duration: dur(s.duration_min),
      calls: int(s.calls),
      peak: s.calls ? '<span class="' + (s.context_peak >= threshold ? 'hi' : '') + '">' + int(s.context_peak) + '</span>' : '<span class="dim">–</span>',
      cost: s.cost_usd === null ? '<span class="dim" title="Cost unknown">?</span>' : usd(s.cost_usd) + (s.cost_partial ? '<span class="dim" title="Some model cost unknown">+?</span>' : ''),
      models: s.models.length ? esc(modelsShort(s.models)) : '<span class="dim">–</span>',
      commit: '<span class="' + esc(s.commit_within_hour) + '">' + esc(s.commit_within_hour) + '</span>',
    };
  }

  function sessionRow(s, threshold, now = new Date()) {
    const c = sessionCells(s, threshold, now);
    return '<tr data-id="' + esc(s.id) + '" title="' + esc(s.id) + '"><td class="n">' + c.day + '</td><td class="n">' + c.start + '</td><td>' + c.repo +
      '</td><td class="c">' + c.ub + '</td><td>' + c.link + '</td><td class="n r">' + c.duration + '</td><td class="n r">' + c.calls + '</td><td class="n r">' + c.peak +
      '</td><td class="n r">' + c.cost + '</td><td class="c" title="' + esc(s.models.join(', ')) + '">' + c.models + '</td><td>' + c.commit + '</td></tr>';
  }

  /** The one line every tab shows for a repository with no recorded session (api.mjs noSessionLine). */
  const noSessionLine = (name) => 'No Claude Code sessions recorded for ' + name + ' yet.';

  const B = root.TackBoard = { esc, int, usd, pct, hhmm, dur, median, unitOrBranch, modelsShort, sessionCells, sessionRow, noSessionLine };
  root.TackViews = root.TackViews || {};
  if (typeof document === 'undefined') return;

  const $ = (id) => document.getElementById(id);
  const TABS = ['lanes', 'sessions', 'timeline', 'insights', 'settings'];
  const state = B.state = { repos: [], preselected: null, unrecorded: null, data: null, metrics: null, timeline: null, threshold: 200000, tab: 'lanes', selected: null };

  async function get(path) {
    const r = await fetch(path, { cache: 'no-store' });
    const body = await r.json();
    if (!r.ok) throw new Error(body.error || r.status);
    return body;
  }

  function params() { return new URL(location.href).searchParams; }
  function setParams(next) {
    const u = new URL(location.href);
    for (const [k, v] of Object.entries(next)) { if (v) u.searchParams.set(k, v); else u.searchParams.delete(k); }
    history.replaceState(null, '', u);
  }
  const repoSel = () => params().get('repo') || 'all';
  // The start work tree the store does not hold, when it is the selection.
  const unrecordedSel = () => { const u = state.unrecorded; const cur = repoSel(); return u && (cur === u.key || (cur.length >= 4 && u.key.startsWith(cur))) ? u : null; };
  function query() {
    const p = params(); const q = new URLSearchParams();
    q.set('repo', repoSel());
    for (const k of ['since', 'until']) if (p.get(k)) q.set(k, p.get(k));
    return q.toString();
  }

  /** Draws a registered view into its section when it is the visible tab and its data are in. */
  function renderView(t) {
    const v = root.TackViews[t];
    // The lanes and settings views load their own data: they draw before the sessions arrive.
    if (!v || t !== state.tab || (!state.data && t !== 'settings' && t !== 'lanes')) return;
    // The lanes view gets the same line from /api/lanes.
    const u = (t === 'timeline' || t === 'insights') && unrecordedSel();
    if (u) { $('tab-' + t).innerHTML = '<div class="empty">' + esc(noSessionLine(u.name)) + '</div>'; return; }
    v.render(state, $('tab-' + t));
    if (t === 'insights' && B.drawnMs === undefined) B.drawnMs = Math.round(performance.now());
  }

  function showTab(t) {
    if (!TABS.includes(t)) t = 'lanes';
    state.tab = t;
    for (const x of TABS) { $('tab-' + x).hidden = x !== t; document.querySelector('nav.tabs>button[data-tab=' + x + ']').classList.toggle('on', x === t); }
    $('vt').textContent = t[0].toUpperCase() + t.slice(1);
    if (location.hash !== '#' + t) history.replaceState(null, '', '#' + t);
    renderView(t);
  }

  function renderRepos() {
    const sel = $('repo');
    const u = state.unrecorded;
    const opts = ['<option value="all">All repositories</option>'].concat(u ? ['<option value="' + esc(u.key) + '">' + esc(u.name) + ' · no recorded session</option>'] : [], state.repos.map((r) =>
      '<option value="' + esc(r.key) + '">' + esc(r.name) + ' · ' + esc(r.key.slice(0, 8)) + ' · ' + r.sessions + ' sessions' + (r.state === 'gone' ? ' (gone)' : '') + '</option>'));
    sel.innerHTML = opts.join('');
    const cur = repoSel();
    const hit = state.repos.find((r) => r.key === cur || (cur.length >= 4 && r.key.startsWith(cur))) || unrecordedSel();
    sel.value = hit ? hit.key : 'all';
    $('p-repo').textContent = hit ? hit.name : 'all repositories';
    $('p-repo').title = hit ? hit.toplevel || '' : '';
  }

  function renderHealth(h) {
    $('f-sessions').textContent = int(h.counts.sessions);
    $('f-repos').textContent = int(h.counts.repos);
    $('f-schema').textContent = h.schema + (h.schema === h.schemaExpected ? '' : ' (expected ' + h.schemaExpected + ')');
    $('f-host').textContent = location.host; $('f-host').title = 'Store ' + h.store;
    $('f-days').textContent = h.days.replace(/^local \((.*)\)$/, '$1');
    const s = h.lastScan; const el = $('scan');
    el.classList.toggle('bad', !!(s && !s.ok));
    $('f-dot').className = 'ok-dot ' + (s && s.ok ? 'ok' : s ? 'down' : '');
    if (!s) { el.textContent = 'Not scanned'; return; }
    const d = new Date(s.at);
    el.textContent = (s.ok ? 'Last scan ' : 'Scan failed ') + d.toLocaleDateString('en-CA') + ' ' + hhmm(s.at) + ' · ' + (s.durationMs / 1000).toFixed(1) + ' s';
    el.title = s.ok ? 'Rows added: sessions ' + s.added.sessions + ', calls ' + s.added.calls + ', commits ' + s.added.commits : 'Error: ' + s.error;
  }

  function filtered() {
    const hi = $('only-hi').checked, unk = $('only-unk').checked;
    return state.data.sessions.filter((s) => (!hi || s.context_peak >= state.threshold) && (!unk || s.cost_usd === null));
  }

  function renderSummary(rows) {
    const known = rows.filter((s) => s.cost_usd !== null);
    const peaks = rows.filter((s) => s.calls > 0).map((s) => s.context_peak);
    const yes = rows.filter((s) => s.commit_within_hour === 'yes').length, no = rows.filter((s) => s.commit_within_hour === 'no').length;
    const med = median(peaks);
    $('k-n').textContent = int(rows.length); $('k-n2').textContent = 'of ' + int(state.data.sessions.length);
    $('k-cost').textContent = usd(known.reduce((a, s) => a + s.cost_usd, 0)); $('k-cost2').textContent = (rows.length - known.length) + ' unknown';
    $('k-med').textContent = med === null ? '–' : int(med); $('k-med2').textContent = peaks.filter((p) => p >= state.threshold).length + ' at ≥ 200k';
    $('k-max').textContent = peaks.length ? int(Math.max(...peaks)) : '–'; $('k-max2').textContent = (rows.length - peaks.length) + ' without a call';
    $('k-commit').textContent = pct(yes + no ? yes / (yes + no) : null); $('k-commit2').textContent = yes + ' of ' + (yes + no) + ', ' + (rows.length - yes - no) + ' unknown';
  }

  function renderSessions() {
    if (!state.data) return;
    const rows = filtered();
    renderSummary(rows);
    const units = state.data.sessions.some((s) => s.unit);
    $('h-branch').textContent = units ? 'Unit / branch' : 'Branch';
    $('shown').textContent = rows.length + ' of ' + state.data.sessions.length + ' sessions · days ' + state.data.days;
    const now = new Date();
    $('rows').innerHTML = rows.length ? rows.map((s) => sessionRow(s, state.threshold, now)).join('') : '<tr><td colspan="11" class="empty">' + (unrecordedSel() ? esc(noSessionLine(unrecordedSel().name)) : 'No session in this selection.') + '</td></tr>';
    markSelected(false);
  }

  function markSelected(scroll) {
    for (const tr of document.querySelectorAll('#rows tr.sel')) tr.classList.remove('sel');
    if (!state.selected) return;
    const tr = [...document.querySelectorAll('#rows tr[data-id]')].find((x) => x.dataset.id === state.selected);
    if (!tr) return;
    tr.classList.add('sel');
    if (scroll) tr.scrollIntoView({ block: 'center' });
  }

  /** Selects a session in the Sessions tab (the Timeline's click): clears a filter that hides it, scrolls to its row. */
  B.selectSession = (id) => {
    state.selected = id;
    const s = state.data && state.data.sessions.find((x) => x.id === id);
    if (s && !filtered().includes(s)) { $('only-hi').checked = $('only-unk').checked = false; renderSessions(); }
    showTab('sessions');
    markSelected(true);
  };

  async function load() {
    $('err').textContent = '';
    try {
      const q = query();
      const [d, m, h, tl] = await Promise.all([get('/api/sessions?' + q), get('/api/metrics?' + q), get('/api/health'), get('/api/timeline?' + q)]);
      state.data = d; state.metrics = m; state.timeline = tl; state.threshold = d.threshold;
      state.repoName = (state.repos.find((r) => r.key === d.repo) || (state.unrecorded && state.unrecorded.key === d.repo ? state.unrecorded : {})).name || null;
      renderSessions(); renderHealth(h); renderView(state.tab);
    } catch (e) { $('err').textContent = 'Could not load: ' + e.message; }
  }

  async function init() {
    const r = await get('/api/repos');
    state.repos = r.repos; state.preselected = r.preselected; state.unrecorded = r.unrecorded || null;
    if (!params().get('repo') && r.preselected) setParams({ repo: r.preselected });
    const p = params(); $('since').value = p.get('since') || ''; $('until').value = p.get('until') || '';
    renderRepos();
    showTab(location.hash.slice(1) || (location.pathname === '/settings' ? 'settings' : ''));
    await load();
  }

  $('repo').addEventListener('change', (e) => { setParams({ repo: e.target.value }); renderRepos(); load(); if (state.tab === 'settings') renderView('settings'); });
  for (const id of ['since', 'until']) $(id).addEventListener('change', (e) => { setParams({ [id]: e.target.value }); load(); });
  for (const id of ['only-hi', 'only-unk']) $(id).addEventListener('change', renderSessions);
  $('clear').addEventListener('click', (e) => { e.preventDefault(); $('since').value = $('until').value = ''; $('only-hi').checked = $('only-unk').checked = false; setParams({ since: '', until: '' }); load(); });
  $('filt').addEventListener('submit', (e) => e.preventDefault());
  document.querySelector('nav.tabs').addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if (b) showTab(b.dataset.tab); });
  window.addEventListener('hashchange', () => showTab(location.hash.slice(1)));
  let resizing = 0;
  window.addEventListener('resize', () => { clearTimeout(resizing); resizing = setTimeout(() => { if (state.tab === 'timeline') renderView('timeline'); else if (state.tab === 'insights') C.fit($('tab-insights')); }, 150); });
  $('rescan').addEventListener('click', async () => {
    const b = $('rescan'); b.disabled = true; $('spin').hidden = false;
    try {
      const r = await fetch('/api/rescan', { method: 'POST' });
      if (!r.ok) $('err').textContent = 'Rescan failed: ' + ((await r.json()).lastScan || {}).error;
      const repos = await get('/api/repos'); state.repos = repos.repos; state.unrecorded = repos.unrecorded || null; renderRepos();
      await load();
    } catch (e) { $('err').textContent = 'Rescan failed: ' + e.message; }
    b.disabled = false; $('spin').hidden = true;
  });
  // The view scripts load after this one: start once the document has parsed them.
  const start = () => init().catch((e) => { $('err').textContent = 'Could not load: ' + e.message; });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(typeof window !== 'undefined' ? window : globalThis);
