// Requirements tab of the Jjodel lane board (P-2026-10-05-1720, ported to this board by P-2026-10-11-0008): every
// row of docs/decisions.md, grouped by co-citation cluster and then by milestone, with what realized it on the
// trunk and its goal-model contributions; below, the pairs of realized rows that pull a softgoal both ways, one
// closed group per declared conflict, the pairs no conflict names last. Read-only. Data from /api/requirements
// (req-trace.mjs); drawn as plain HTML, no libraries. Every table has fixed widths, so neither a filter nor an
// opened group moves a column.
(function () {
  const store = {
    get(k, d) { try { const v = localStorage.getItem('laneREQ.' + k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('laneREQ.' + k, v); } catch (e) { /* per-viewer convenience only */ } },
  };
  let data = null;
  let shown = '';
  const filter = { family: store.get('family', ''), status: store.get('status', ''), realized: store.get('realized', ''), softgoal: store.get('softgoal', '') };
  let open = new Set();
  try { open = new Set(JSON.parse(store.get('open', '[]'))); } catch (e) { open = new Set(); }
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const POS = new Set(['make', 'help', 'some+']);
  const NEG = new Set(['some-', 'hurt', 'break']);
  const UNCL = '(unclustered)';
  const UNASSIGNED = 'cf:unassigned';
  // Column widths in px, 0 for the column that takes the rest (as COL_W in the Lanes tab).
  const REQ_W = [0, 104, 112, 96, 240];
  const PAIR_W = [0, 0, 240];

  const css = `
  .rq-bar{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;margin:8px 0 12px}
  .rq-bar label{font-size:12px;color:var(--muted);display:inline-flex;gap:6px;align-items:center}
  .rq-bar select{font:inherit;font-size:12px;background:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:4px 6px}
  .rq-shown{margin-left:auto;font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}
  .rq-head{margin:0 0 4px}.rq-note{color:var(--muted);font-size:12px;margin:0 0 12px}
  .rq-ms{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);padding:8px 12px;border-bottom:1px solid var(--line);background:var(--bg)}
  .rq-st-ratified{color:var(--ok)}.rq-st-provisional{color:var(--warn)}.rq-st-superseded{color:var(--muted)}
  .rq-yes{color:var(--ok);font-weight:600;cursor:help}.rq-no{color:var(--muted)}
  .rq-c{display:inline-block;font-size:10px;font-weight:600;padding:0 5px;border-radius:4px;margin:0 3px 2px 0;border:1px solid currentColor;cursor:help}
  .rq-help{color:var(--ok)}.rq-hurt{color:var(--bad)}
  .rq-tot{font-size:11px;margin-left:4px}
  .rq-why{margin:0;padding:8px 12px;color:var(--muted);font-size:12px;border-bottom:1px solid var(--line)}
  table.rq-t{table-layout:fixed;width:100%;min-width:900px}table.rq-t th,table.rq-t td{overflow:hidden;overflow-wrap:anywhere}
  table.rq-t .pill{white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}table.rq-t .title{max-width:none}
  `;

  function el(tag, html) { const e = document.createElement(tag); e.innerHTML = html; return e; }
  function ensureCss() { if (document.getElementById('rq-css')) return; const s = el('style', css); s.id = 'rq-css'; document.head.appendChild(s); }

  const short = (sha) => String(sha || '').slice(0, 9);
  const day = (iso) => String(iso || '').slice(0, 10);
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const colgroup = (ws) => '<colgroup>' + ws.map((w) => '<col' + (w ? ' style="width:' + w + 'px"' : '') + '>').join('') + '</colgroup>';

  function realizedCell(r) {
    if (!r.realized) return '<span class="rq-no">no</span>';
    const lines = r.commits.map((c) => short(c.sha) + ' ' + day(c.date) + ' ' + c.subject + (c.promptId && !c.subject.includes(c.promptId) ? ' (' + c.promptId + ')' : ''));
    lines.push(r.trunkMerge ? 'Brought in by ' + short(r.trunkMerge.sha) + ' ' + day(r.trunkMerge.date) + ' ' + r.trunkMerge.subject : 'Committed on the trunk itself');
    return '<span class="rq-yes" title="' + esc(lines.join('\n')) + '">yes · ' + r.commits.length + '</span>';
  }

  function contribCell(r, sgName) {
    return (r.contributions || []).map((c) => {
      const pos = POS.has(c.kind), neg = NEG.has(c.kind);
      const tip = c.softgoal + ' ' + (sgName.get(c.softgoal) || '') + ': ' + c.kind + ' (evidence ' + c.evidence + ', verified ' + c.verified + ')' + (c.why ? '\n' + c.why : '');
      return '<span class="rq-c ' + (pos ? 'rq-help' : neg ? 'rq-hurt' : '') + '" title="' + esc(tip) + '">' + (pos ? '+' : neg ? '−' : '') + esc(c.softgoal) + '</span>';
    }).join('');
  }

  function idTip(r) {
    const evo = (r.citedBy && r.citedBy.evolution || []).map((e) => e.id + ' ' + e.kind);
    const out = (r.evolves || []).map((e) => e.kind + ' ' + e.id);
    const other = r.citedBy && r.citedBy.other || [];
    return [r.date ? 'Date: ' + r.date : '', r.evidence ? 'Evidence: ' + r.evidence + (r.verified ? ', verified: ' + r.verified : '') : '',
      out.length ? 'This row: ' + out.join('; ') : '', evo.length ? 'Evolved by: ' + evo.join('; ') : '', other.length ? 'Cited by: ' + other.join(', ') : ''].filter(Boolean).join('\n');
  }

  function table(rows, sgName) {
    let h = '<table class="rq-t">' + colgroup(REQ_W) + '<thead><tr><th>Requirement</th><th>Family</th><th>Status</th><th>Realized</th><th>Contributions</th></tr></thead><tbody>';
    for (const r of rows) {
      h += '<tr><td class="id" title="' + esc(idTip(r)) + '">' + esc(r.id) + '<span class="title">' + esc(r.title) + '</span></td>' +
        '<td>' + esc(r.family) + '</td><td><span class="pill rq-st-' + esc(r.status) + '">' + esc(r.status) + '</span></td>' +
        '<td>' + realizedCell(r) + '</td><td>' + contribCell(r, sgName) + '</td></tr>';
    }
    return h + '</tbody></table>';
  }

  function totals(goals, sgName) {
    return Object.entries(goals || {}).map(([sg, t]) => '<span class="rq-tot" title="' + esc(sg + ' ' + (sgName.get(sg) || '')) + '">' + esc(sg) + ' <span class="rq-help">+' + t.help + '</span>/<span class="rq-hurt">−' + t.hurt + '</span></span>').join('');
  }

  /** The opposing pairs grouped by the declared conflict they match (same softgoal, same two rows, either order),
   *  in the order of conflicts.json, every conflict with its group; the pairs no conflict names last, as unassigned. */
  function conflictGroups(gm) {
    const pairs = gm.opposing || [];
    const named = new Set();
    const groups = (gm.conflicts || []).map((c) => {
      const ps = pairs.filter((p) => p.softgoal === c.softgoal && ((p.a === c.a && p.b === c.b) || (p.a === c.b && p.b === c.a)));
      ps.forEach((p) => named.add(p));
      return { key: 'cf:' + c.softgoal + ':' + c.a + ':' + c.b, conflict: c, pairs: ps };
    });
    const rest = pairs.filter((p) => !named.has(p));
    if (rest.length) groups.push({ key: UNASSIGNED, conflict: null, pairs: rest });
    return { groups, named: named.size, unassigned: rest.length };
  }

  function pairTable(c, pairs, byRow, sgName) {
    if (!pairs.length) return '<div class="empty">No opposing pair: both rows must be realized, one helping ' + esc(c.softgoal) + ' and the other hurting it.</div>';
    const cell = (id) => { const r = byRow.get(id); return '<td class="id">' + esc(id) + (r ? '<span class="title">' + esc(r.title) + '</span>' : '') + '</td>'; };
    let h = '<table class="rq-t">' + colgroup(PAIR_W) + '<thead><tr><th>Helps</th><th>Hurts</th><th>Softgoal</th></tr></thead><tbody>';
    for (const p of pairs) h += '<tr>' + cell(p.a) + cell(p.b) + '<td>' + esc(p.softgoal + ' ' + (sgName.get(p.softgoal) || '')) + '</td></tr>';
    return h + '</tbody></table>';
  }

  function opposingSection(gm, rows, sgName) {
    const byRow = new Map(rows.map((r) => [r.id, r]));
    const { groups, named, unassigned } = conflictGroups(gm);
    let h = '<h2>Opposing contributions</h2><p class="rq-note">' + plural(gm.opposing.length, 'pair') + ' of realized rows pull a softgoal both ways: ' +
      named + ' match one of the ' + plural(gm.conflicts.length, 'declared conflict') + ' (same softgoal, same two rows, either order), ' + unassigned + ' unassigned. Open a group to see its pairs.</p>';
    for (const g of groups) {
      const c = g.conflict;
      const n = plural(g.pairs.length, 'pair');
      const head = c ? '<b>' + esc(c.a) + ' vs ' + esc(c.b) + '</b><span class="meta">' + esc(c.softgoal + ' ' + (sgName.get(c.softgoal) || '')) + ' · ' + n + '</span>'
        : '<b>unassigned</b><span class="meta">' + n + ' no declared conflict names</span>';
      const why = c && c.why ? '<p class="rq-why">' + esc(c.why) + (c.evidence ? ' (evidence: ' + esc(c.evidence) + ')' : '') + '</p>' : '';
      h += '<details data-key="' + esc(g.key) + '"' + (open.has(g.key) ? ' open' : '') + '><summary' + (c && c.why ? ' title="' + esc(c.why) + '"' : '') + '>' + head + '</summary>' +
        '<div class="wrap rq-wrap">' + why + pairTable(c || {}, g.pairs, byRow, sgName) + '</div></details>';
    }
    return h;
  }

  const pass = (r) => (!filter.family || r.family === filter.family) && (!filter.status || r.status === filter.status) &&
    (!filter.realized || (filter.realized === 'yes') === !!r.realized) &&
    (!filter.softgoal || (r.contributions || []).some((c) => c.softgoal === filter.softgoal));

  function select(name, label, options, value, disabled) {
    return '<label>' + label + ' <select data-f="' + name + '"' + (disabled ? ' disabled' : '') + '>' +
      options.map(([v, t]) => '<option value="' + esc(v) + '"' + (v === value ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></label>';
  }

  function render() {
    const box = document.getElementById('req');
    if (!box || !data) return;
    ensureCss();
    if (data.error) { box.innerHTML = '<div class="err">' + esc(data.error) + '</div>'; return; }
    const rows = data.rows || [];
    const gm = data.goalModel || { present: false, softgoals: [], conflicts: [], opposing: [] };
    const sgName = new Map((gm.softgoals || []).map((s) => [s.id, s.name]));
    const c = data.counts || {};
    const cl = data.clusters || { list: [] };
    const ms = data.milestones || [];
    const fams = {};
    rows.forEach((r) => { fams[r.family] = (fams[r.family] || 0) + 1; });
    const famOpts = [['', 'all']].concat(Object.entries(fams).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([f, n]) => [f, f + ' (' + n + ')']));
    const shownRows = rows.filter(pass);

    let h = '<p class="meta rq-head"><b>' + c.rows + '</b> requirements · <b>' + c.realized + '</b> realized on ' + esc(data.trunk ? data.trunk.ref + ' ' + short(data.trunk.sha) : '?') +
      ' · ' + c.ratified + ' ratified, ' + c.provisional + ' provisional, ' + c.superseded + ' superseded · <b>' + cl.list.length + '</b> clusters, modularity ' + Number(cl.modularity || 0).toFixed(3) +
      ', ' + Math.round((cl.unclusteredShare || 0) * 100) + '% unclustered · milestones: ' + ms.map((m) => esc(m.name) + ' ' + esc(m.date)).join(', ') + (ms[0] && ms[0].source === 'built-in' ? ' (built-in)' : '') + '</p>';
    h += '<p class="rq-note">' + (gm.present
      ? 'Goal model: ' + gm.softgoals.length + ' softgoals, ' + rows.reduce((a, r) => a + (r.contributions || []).length, 0) + ' contributions, ' + gm.conflicts.length + ' declared conflicts, ' + gm.opposing.length + ' pairs of realized rows pulling a softgoal both ways.'
      : 'The goal model is not there yet: docs/goals/softgoals.json and docs/goals/contributions.json are absent from this checkout, so no contributions are shown.') +
      ' Clusters: co-citation in ' + (cl.prompts ? cl.prompts.used + ' prompts (' + cl.prompts.excluded + ' merge or wide prompts left out)' : 'the prompts') + ', Louvain seed ' + (cl.seed ?? 1) + '.</p>';
    h += '<div class="rq-bar">' +
      select('family', 'Family', famOpts, filter.family) +
      select('status', 'Status', [['', 'all'], ['ratified', 'ratified'], ['provisional', 'provisional'], ['superseded', 'superseded']], filter.status) +
      select('realized', 'Realized', [['', 'all'], ['yes', 'realized'], ['no', 'not realized']], filter.realized) +
      select('softgoal', 'Softgoal', [['', 'all']].concat((gm.softgoals || []).map((s) => [s.id, s.id + ' ' + s.name])), filter.softgoal, !gm.present) +
      '<span class="rq-shown">Showing <b>' + shownRows.length + '</b> of ' + rows.length + '</span></div>';

    const groups = cl.list.map((k) => ({ key: k.key, name: k.name, goals: k.goals, members: new Set(k.members) }));
    groups.push({ key: UNCL, name: 'Unclustered: rows no prompt co-cites', goals: null, members: new Set(rows.filter((r) => !r.cluster).map((r) => r.id)) });
    const order = ms.map((m) => [m.id, m.name + ' · ' + m.date]).concat([['__after', 'Realized after the last milestone'], ['__no', 'Not realized']]);
    const slot = (r) => r.realized ? (r.milestone || '__after') : '__no';
    for (const g of groups) {
      const rs = shownRows.filter((r) => g.members.has(r.id));
      if (!rs.length) continue;
      const nReal = rs.filter((r) => r.realized).length;
      let inner = '';
      for (const [mid, label] of order) {
        const part = rs.filter((r) => slot(r) === mid);
        if (!part.length) continue;
        inner += '<div class="rq-ms">' + esc(label) + ' · ' + part.length + '</div>' + table(part, sgName);
      }
      h += '<details data-key="' + esc(g.key) + '"' + (open.has(g.key) ? ' open' : '') + '><summary><b>' + esc(g.name) + '</b><span class="meta">' + (g.key === UNCL ? '' : esc(g.key) + ' · ') + rs.length + ' row' + (rs.length > 1 ? 's' : '') + ' · ' + nReal + ' realized' + totals(g.goals, sgName) + '</span></summary><div class="wrap rq-wrap">' + inner + '</div></details>';
    }
    if (gm.present && (gm.opposing.length || gm.conflicts.length)) h += opposingSection(gm, rows, sgName);
    box.innerHTML = h;
    box.querySelectorAll('select[data-f]').forEach((s) => s.addEventListener('change', () => { filter[s.dataset.f] = s.value; store.set(s.dataset.f, s.value); render(); }));
    box.querySelectorAll('details[data-key]').forEach((d) => d.addEventListener('toggle', () => { d.open ? open.add(d.dataset.key) : open.delete(d.dataset.key); store.set('open', JSON.stringify([...open])); }));
  }

  let busy = false;
  async function refresh() {
    if (busy) return; busy = true;
    const box = document.getElementById('req');
    if (box && !data) box.innerHTML = '<div class="empty">Tracing the register against the trunk…</div>';
    try {
      const d = await (await fetch('/api/requirements', { cache: 'no-store' })).json();
      const key = d.error || [d.trunk && d.trunk.sha, d.head, JSON.stringify(d.counts), d.goalModel && d.goalModel.present].join('|');
      if (key !== shown || !data) { data = d; shown = key; render(); }
    } catch (e) { if (box) box.innerHTML = '<div class="err">requirements unreachable: ' + esc(e.message) + '</div>'; }
    finally { busy = false; }
  }
  window.REQ = { refresh };
})();
