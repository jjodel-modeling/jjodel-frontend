// Tack board, page script: no build step, no dependency. The selection lives in the URL
// (?repo=<key>|all&since=&until=, #<tab>); the page writes nothing anywhere else.
'use strict';
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const int = (n) => Math.round(n).toLocaleString('en-US');
const usd = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (x) => (x === null ? '–' : (100 * x).toFixed(1) + '%');
const hhmm = (iso) => { const d = new Date(iso); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const dur = (m) => (m === null ? '–' : m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0'));
const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

const TABS = ['sessions', 'timeline', 'insights'];
const state = { repos: [], preselected: null, data: null, threshold: 200000 };

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
function query() {
  const p = params(); const q = new URLSearchParams();
  q.set('repo', repoSel());
  for (const k of ['since', 'until']) if (p.get(k)) q.set(k, p.get(k));
  return q.toString();
}

function showTab(t) {
  if (!TABS.includes(t)) t = 'sessions';
  for (const x of TABS) { $('tab-' + x).hidden = x !== t; document.querySelector('nav.tabs>button[data-tab=' + x + ']').classList.toggle('on', x === t); }
  $('vt').textContent = t[0].toUpperCase() + t.slice(1);
  if (location.hash !== '#' + t) history.replaceState(null, '', '#' + t);
}

function renderRepos() {
  const sel = $('repo');
  const opts = ['<option value="all">All repositories</option>'].concat(state.repos.map((r) =>
    '<option value="' + esc(r.key) + '">' + esc(r.name) + ' · ' + esc(r.key.slice(0, 8)) + ' · ' + r.sessions + ' sessions' + (r.state === 'gone' ? ' (gone)' : '') + '</option>'));
  sel.innerHTML = opts.join('');
  const cur = repoSel();
  const hit = state.repos.find((r) => r.key === cur || (cur.length >= 4 && r.key.startsWith(cur)));
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

function row(s) {
  const repo = s.repo ? '<span title="' + esc(s.repo) + '">' + esc(s.repo_name) + '</span>' : '<span class="dim" title="No repository">– ' + esc(s.missing) + '</span>';
  const bu = state.data.layer2 ? s.unit : s.branch;
  const cost = s.cost_usd === null ? '<span class="dim" title="Cost unknown">?</span>' : usd(s.cost_usd) + (s.cost_partial ? '<span class="dim" title="Some model cost unknown">+?</span>' : '');
  const peak = s.calls ? '<span class="' + (s.context_peak >= state.threshold ? 'hi' : '') + '">' + int(s.context_peak) + '</span>' : '<span class="dim">–</span>';
  return '<tr title="' + esc(s.id) + '"><td class="n">' + esc(s.day || '–') + '</td><td class="n">' + (s.start ? hhmm(s.start) : '–') + '</td><td>' + repo +
    '</td><td class="c">' + (bu ? esc(bu) : '<span class="dim">–</span>') + '</td><td><span class="tag">' + esc(s.link) + '</span></td><td class="n r">' + dur(s.duration_min) +
    '</td><td class="n r">' + int(s.calls) + '</td><td class="n r">' + peak + '</td><td class="n r">' + cost + '</td><td class="c" title="' + esc(s.models.join(', ')) + '">' +
    (s.models.length ? esc(s.models.join(', ')) : '<span class="dim">–</span>') + '</td><td><span class="' + esc(s.commit_within_hour) + '">' + esc(s.commit_within_hour) + '</span></td></tr>';
}

function renderSessions() {
  if (!state.data) return;
  const rows = filtered();
  renderSummary(rows);
  $('h-branch').textContent = state.data.layer2 ? 'Unit' : 'Branch';
  $('shown').textContent = rows.length + ' of ' + state.data.sessions.length + ' sessions · days ' + state.data.days;
  $('rows').innerHTML = rows.length ? rows.map(row).join('') : '<tr><td colspan="11" class="empty">No session in this selection.</td></tr>';
}

function renderLayers(m) {
  const up = m.metrics.filter((x) => x.layer > 1);
  $('n-layers').textContent = up.length + ' metrics';
  $('layers').innerHTML = up.map((x) => '<tr><td class="c" title="' + esc(x.definition) + '">' + esc(x.name) + '</td><td>' + x.layer + '</td><td><span class="st' + (x.state === 'not-adopted' ? '' : ' ni') + '">' +
    (x.state === 'not-adopted' ? 'not adopted' : 'adopted, not implemented') + '</span></td><td class="c">' + esc(x.enabledBy || '') + '</td></tr>').join('');
}

async function load() {
  $('err').textContent = '';
  try {
    const q = query();
    const [d, m, h] = await Promise.all([get('/api/sessions?' + q), get('/api/metrics?' + q), get('/api/health')]);
    state.data = d; state.threshold = d.threshold;
    renderSessions(); renderLayers(m); renderHealth(h);
  } catch (e) { $('err').textContent = 'Could not load: ' + e.message; }
}

async function init() {
  const r = await get('/api/repos');
  state.repos = r.repos; state.preselected = r.preselected;
  if (!params().get('repo') && r.preselected) setParams({ repo: r.preselected });
  const p = params(); $('since').value = p.get('since') || ''; $('until').value = p.get('until') || '';
  renderRepos();
  showTab(location.hash.slice(1));
  await load();
}

$('repo').addEventListener('change', (e) => { setParams({ repo: e.target.value }); renderRepos(); load(); });
for (const id of ['since', 'until']) $(id).addEventListener('change', (e) => { setParams({ [id]: e.target.value }); load(); });
for (const id of ['only-hi', 'only-unk']) $(id).addEventListener('change', renderSessions);
$('clear').addEventListener('click', (e) => { e.preventDefault(); $('since').value = $('until').value = ''; $('only-hi').checked = $('only-unk').checked = false; setParams({ since: '', until: '' }); load(); });
$('filt').addEventListener('submit', (e) => e.preventDefault());
document.querySelector('nav.tabs').addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if (b) showTab(b.dataset.tab); });
window.addEventListener('hashchange', () => showTab(location.hash.slice(1)));
$('rescan').addEventListener('click', async () => {
  const b = $('rescan'); b.disabled = true; $('spin').hidden = false;
  try {
    const r = await fetch('/api/rescan', { method: 'POST' });
    if (!r.ok) $('err').textContent = 'Rescan failed: ' + ((await r.json()).lastScan || {}).error;
    const repos = await get('/api/repos'); state.repos = repos.repos; renderRepos();
    await load();
  } catch (e) { $('err').textContent = 'Rescan failed: ' + e.message; }
  b.disabled = false; $('spin').hidden = true;
});
init().catch((e) => { $('err').textContent = 'Could not load: ' + e.message; });
