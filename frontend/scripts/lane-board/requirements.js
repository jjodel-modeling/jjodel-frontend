// Requirements tab of the Jjodel lane board (P-2026-10-05-1720, ported to this board by P-2026-10-11-0008): every
// row of docs/decisions.md, grouped by co-citation cluster and then by milestone, with what realized it on the
// trunk and its goal-model contributions. Below (P-2026-10-11-1735): the softgoal balance, one diverging bar per
// softgoal under its macro goal, the realized rows that hurt it left of the axis and those that help it right, one
// segment per cluster, on one scale; the clusters by macro goal matrix; the side effects between softgoals; last, the
// pairs of realized rows that pull a softgoal both ways, one closed group per declared conflict. Read-only.
// Data from /api/requirements (req-trace.mjs); drawn as plain HTML, no libraries. Every table has fixed widths, so
// neither a filter nor an opened group moves a column. A cluster's written description (docs/goals/
// cluster-descriptions.json, P-2026-10-11-1510) is one line of fixed height under its title, empty when there is none,
// and the whole text inside the group, with a muted line when members joined or left since it was written.
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
  // The open lists of the balance (softgoal -> cluster key, one per softgoal) and the open cell of the matrix.
  let sbOpen = {};
  try { sbOpen = JSON.parse(store.get('sbOpen', '{}')) || {}; } catch (e) { sbOpen = {}; }
  let mxOpen = store.get('mxOpen', '');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const POS = new Set(['make', 'help', 'some+']);
  const NEG = new Set(['some-', 'hurt', 'break']);
  const UNCL = '(unclustered)';
  const OTHER = '(other)';
  const byId = (a, b) => String(a).localeCompare(String(b), 'en', { numeric: true });
  // req-trace names a cluster `families <em dash> title words`; the tab writes ` · ` in place of the em dash.
  const undash = (s) => String(s ?? '').replace(/\s*\u2014\s*/g, ' · ');
  // Column widths in px, 0 for the column that takes the rest (as COL_W in the Lanes tab).
  const REQ_W = [0, 104, 112, 96, 240];
  const PAIR_W = [0, 0, 240];
  // The balance: a label of 200 px, then a track of TRACK_W px for both sides of every bar; MX_W, a matrix column.
  const TRACK_W = 720, SEG_GAP = 2, MX_W = 120;

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
  #req summary:has(>.rq-desc){display:grid;grid-template-columns:auto auto minmax(0,1fr);column-gap:16px;row-gap:2px;align-items:baseline}
  .rq-desc{grid-column:2/4;grid-row:2;display:block;min-width:0;height:16px;line-height:16px;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .rq-about{margin:0;padding:8px 12px;font-size:12px;border-bottom:1px solid var(--line)}
  .rq-drift{margin:0;padding:4px 12px;font-size:11px;color:var(--muted);border-bottom:1px solid var(--line)}
  .sb-mg{margin:0 0 16px}.sb-mg h3{font-size:13px;font-weight:600;margin:12px 0 2px}
  .sb-mgd{margin:0 0 8px;font-size:12px;color:var(--muted);max-width:920px}
  .sb-sg{margin:0 0 4px}
  .sb-row{display:flex;align-items:center;height:36px}
  .sb-lab{flex:none;width:200px;box-sizing:border-box;padding-right:12px;min-width:0}
  .sb-lab b,.sb-n{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:16px}
  .sb-lab b{font-size:12px;font-weight:600}.sb-n{font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums}
  .sb-bar{display:flex;align-items:center;height:24px}
  .sb-l{flex:none;display:flex;justify-content:flex-end}
  .sb-ax{flex:none;width:1px;height:24px;background:var(--fg)}
  .sb-r{flex:none;display:flex;gap:2px}
  .sb-hurt,.sb-seg{flex:none;display:block;height:14px}
  .sb-hurt{background:#e34948;border-radius:4px 0 0 4px}
  .sb-seg{cursor:pointer}.sb-seg:last-child{border-radius:0 4px 4px 0}
  .sb-b0{background:#2a78d6}.sb-b1{background:#86b6ef}
  .sb-on{box-shadow:0 0 0 2px var(--fg)}
  .sb-chips{display:flex;flex-wrap:wrap;gap:2px 4px;padding-left:200px}
  .sb-chip,.cx-chip{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;line-height:14px;padding:0 4px;border-radius:3px;cursor:help;white-space:nowrap}
  .sb-chip{background:#fde8e8;color:var(--bad)}.cx-chip{background:var(--bg);border:1px solid var(--line)}
  .sb-open{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:16px;margin:6px 0 12px;padding:8px 12px;background:var(--card);border:1px solid var(--line);border-radius:8px}
  .sb-col{min-width:0}.sb-lh{margin:0 0 4px;font-size:12px;font-weight:600}
  .sb-li,.mx-li{display:grid;column-gap:8px;align-items:baseline;font-size:12px;line-height:20px;border-top:1px solid var(--line)}
  .sb-li{grid-template-columns:96px minmax(0,1fr) 48px 64px}.mx-li{grid-template-columns:96px minmax(0,1fr) 280px}
  .sb-id{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sb-t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sb-k,.sb-e{font-size:11px;color:var(--muted)}
  table.rq-t th.mx-th{text-align:center}
  table.rq-t td.mx-c{text-align:center;white-space:nowrap;font-variant-numeric:tabular-nums;color:#0f172a;cursor:pointer}
  .mx-s1{background:#cde2fb}.mx-s2{background:#b7d3f6}.mx-s3{background:#9ec5f4}.mx-s4{background:#86b6ef}.mx-s5{background:#6da7ec}
  table.rq-t td.mx-on{box-shadow:inset 0 0 0 2px var(--fg)}
  .mx-open{margin:8px 0 12px;padding:8px 12px;background:var(--card);border:1px solid var(--line);border-radius:8px}
  .mx-h{margin:0 0 6px;font-size:12px}
  .cx-li{display:grid;grid-template-columns:200px 16px 200px 56px minmax(0,1fr);column-gap:8px;align-items:baseline;padding:6px 12px;font-size:12px;border-bottom:1px solid var(--line);cursor:help}
  .cx-sg{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cx-to{color:var(--muted)}
  .cx-w{display:flex;flex-wrap:wrap;gap:2px 4px}
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
    return '<span class="rq-yes" title="' + esc(lines.map(undash).join('\n')) + '">yes · ' + r.commits.length + '</span>';
  }

  function contribCell(r, sgName) {
    return (r.contributions || []).map((c) => {
      const pos = POS.has(c.kind), neg = NEG.has(c.kind);
      const tip = c.softgoal + ' ' + (sgName.get(c.softgoal) || '') + ': ' + c.kind + ' (evidence ' + c.evidence + ', verified ' + c.verified + ')' + (c.why ? '\n' + c.why : '');
      return '<span class="rq-c ' + (pos ? 'rq-help' : neg ? 'rq-hurt' : '') + '" title="' + esc(tip.split('\n').map(undash).join('\n')) + '">' + (pos ? '+' : neg ? '−' : '') + esc(c.softgoal) + '</span>';
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

  /** The opposing pairs by the declared conflict they match (same softgoal, same two rows, either order), one group
   *  per conflict in the order of conflicts.json, empty ones included; `rest`, the pairs no conflict names. */
  function conflictGroups(gm) {
    const pairs = gm.opposing || [];
    const named = new Set();
    const groups = (gm.conflicts || []).map((c) => {
      const ps = pairs.filter((p) => p.softgoal === c.softgoal && ((p.a === c.a && p.b === c.b) || (p.a === c.b && p.b === c.a)));
      ps.forEach((p) => named.add(p));
      return { key: 'cf:' + c.softgoal + ':' + c.a + ':' + c.b, conflict: c, pairs: ps };
    });
    return { groups, named: named.size, rest: pairs.filter((p) => !named.has(p)) };
  }

  const idCell = (byRow, id) => { const r = byRow.get(id); return '<td class="id">' + esc(id) + (r ? '<span class="title">' + esc(r.title) + '</span>' : '') + '</td>'; };

  function pairTable(c, pairs, byRow, sgName) {
    if (!pairs.length) return '<div class="empty">No opposing pair: both rows must be realized, one helping ' + esc(c.softgoal) + ' and the other hurting it.</div>';
    let h = '<table class="rq-t">' + colgroup(PAIR_W) + '<thead><tr><th>Helps</th><th>Hurts</th><th>Softgoal</th></tr></thead><tbody>';
    for (const p of pairs) h += '<tr>' + idCell(byRow, p.a) + idCell(byRow, p.b) + '<td>' + esc(p.softgoal + ' ' + (sgName.get(p.softgoal) || '')) + '</td></tr>';
    return h + '</tbody></table>';
  }

  const rowTitle = (byRow, id) => undash((byRow.get(id) || {}).title || '');
  const sgLabel = (sgName, sg) => sg + ' ' + undash(sgName.get(sg) || '');

  /** The softgoal balance (P-2026-10-11-1735): one block per macro goal of the tree, in its order, then "Other
   *  softgoals"; one bar per softgoal on one scale for the section, px per row from the largest hurt and help counts
   *  and the most gaps, so the left sides share a width and every axis sits at the same x. The helping rows of a
   *  softgoal form one segment per cluster, the largest first, ties in the order of the cluster groups. */
  function balanceSection(gm, byRow, groups, sgName) {
    const bal = gm.balance || [];
    const rank = new Map(groups.map((g, i) => [g.key, i]));
    const name = new Map(groups.map((g) => [g.key, undash(g.name)]));
    const at = (k) => (rank.has(k) ? rank.get(k) : rank.size);
    const segsOf = (b) => {
      const by = new Map();
      for (const id of b.help) { const k = (byRow.get(id) || {}).cluster || UNCL; if (!by.has(k)) by.set(k, []); by.get(k).push(id); }
      return [...by].map(([key, ids]) => ({ key, ids })).sort((x, y) => y.ids.length - x.ids.length || at(x.key) - at(y.key));
    };
    const segs = new Map(bal.map((b) => [b.softgoal, segsOf(b)]));
    const maxHurt = Math.max(0, ...bal.map((b) => b.hurt.length));
    const maxHelp = Math.max(0, ...bal.map((b) => b.help.length));
    const maxGaps = Math.max(0, ...[...segs.values()].map((s) => s.length - 1));
    const px = maxHurt + maxHelp ? (TRACK_W - SEG_GAP * maxGaps) / (maxHurt + maxHelp) : 0;
    const w = (n) => +(n * px).toFixed(2);
    const leftW = w(maxHurt), rightW = +(TRACK_W - leftW).toFixed(2);
    const li = (sg, id, kinds) => {
      const c = ((byRow.get(id) || {}).contributions || []).find((x) => x.softgoal === sg && kinds.has(x.kind)) || {};
      const t = rowTitle(byRow, id);
      return '<div class="sb-li"><span class="sb-id">' + esc(id) + '</span><span class="sb-t" title="' + esc(t) + '">' + esc(t) + '</span><span class="sb-k">' + esc(c.kind || '') + '</span><span class="sb-e">' + esc(c.evidence || '') + '</span></div>';
    };
    const softgoal = (b) => {
      const sg = b.softgoal, n = b.help.length, m = b.hurt.length, on = sbOpen[sg];
      const ss = segs.get(sg);
      const hurt = m ? '<span class="sb-hurt" style="width:' + w(m) + 'px" title="' + esc(plural(m, 'row') + ' ' + (m === 1 ? 'hurts ' : 'hurt ') + sg) + '"></span>' : '';
      const seg = ss.map((s, i) => '<span class="sb-seg sb-b' + (i % 2) + (on === s.key ? ' sb-on' : '') + '" data-sb-sg="' + esc(sg) + '" data-sb-cl="' + esc(s.key) + '" data-n="' + s.ids.length +
        '" style="width:' + w(s.ids.length) + 'px" title="' + esc((name.get(s.key) || s.key) + ' · ' + plural(s.ids.length, 'row') + (s.ids.length === 1 ? ' helps ' : ' help ') + sg) + '"></span>').join('');
      let h = '<div class="sb-sg" data-sg="' + esc(sg) + '"><div class="sb-row"><div class="sb-lab"><b title="' + esc(sgLabel(sgName, sg)) + '">' + esc(sgLabel(sgName, sg)) + '</b><span class="sb-n">' + n + ' help · ' + m + ' hurt</span></div>' +
        '<div class="sb-bar"><div class="sb-l" style="width:' + leftW + 'px">' + hurt + '</div><span class="sb-ax"></span><div class="sb-r" style="width:' + rightW + 'px">' + seg + '</div></div></div>' +
        '<div class="sb-chips">' + b.hurt.map((id) => '<span class="sb-chip" title="' + esc(rowTitle(byRow, id)) + '">' + esc(id) + '</span>').join('') + '</div>';
      const opened = on !== undefined && ss.find((s) => s.key === on);
      if (opened) {
        h += '<div class="sb-open"><div class="sb-col"><p class="sb-lh">Help ' + esc(sg) + ': ' + esc(name.get(opened.key) || opened.key) + ' · ' + plural(opened.ids.length, 'row') + '</p>' + opened.ids.map((id) => li(sg, id, POS)).join('') + '</div>' +
          '<div class="sb-col"><p class="sb-lh">Hurt ' + esc(sg) + ' · ' + plural(m, 'row') + '</p>' + (m ? b.hurt.map((id) => li(sg, id, NEG)).join('') : '<div class="empty">No realized row hurts ' + esc(sg) + '.</div>') + '</div></div>';
      }
      return h + '</div>';
    };
    const bySg = new Map(bal.map((b) => [b.softgoal, b]));
    const placed = new Set();
    const block = (key, head, desc, sgs) => '<div class="sb-mg" data-mg="' + esc(key) + '"><h3>' + esc(head) + '</h3>' + (desc ? '<p class="sb-mgd">' + esc(undash(desc)) + '</p>' : '') + sgs.map((sg) => softgoal(bySg.get(sg))).join('') + '</div>';
    let h = '<h2>Softgoal balance</h2><p class="rq-note">For each softgoal, its realized rows: those that hurt it left of the axis, those that help it right, one segment per cluster, the largest first. ' +
      'One scale for every bar (' + (Math.round(px * 10) / 10) + ' px per row), so the bars compare across softgoals; under each bar, the rows that hurt it. Click a segment to list its rows beside them.</p>';
    for (const mg of gm.tree || []) {
      const sgs = (mg.softgoals || []).filter((sg) => bySg.has(sg) && !placed.has(sg));
      if (!sgs.length) continue;
      sgs.forEach((sg) => placed.add(sg));
      h += block(mg.id, mg.id + ' ' + undash(mg.name), mg.description, sgs);
    }
    const rest = bal.map((b) => b.softgoal).filter((sg) => !placed.has(sg));
    if (rest.length) h += block(OTHER, 'Other softgoals', '', rest);
    return h;
  }

  /** The macro goals as matrix columns, in tree order, then "Other" for the softgoals in none. */
  function macroColumns(gm) {
    const tree = gm.tree || [];
    const inTree = new Set(tree.flatMap((mg) => mg.softgoals || []));
    const cols = tree.map((mg) => ({ key: mg.id, head: mg.id + ' ' + undash(mg.name), tip: undash(mg.description || ''), sgs: new Set(mg.softgoals || []) }));
    const other = (gm.softgoals || []).map((s) => s.id).filter((id) => !inTree.has(id));
    if (other.length) cols.push({ key: OTHER, head: 'Other', tip: 'Softgoals in no macro goal: ' + other.join(', '), sgs: new Set(other) });
    return cols;
  }

  /** Clusters by macro goal (P-2026-10-11-1735): per cluster group and macro goal, the realized rows that help any of
   *  its softgoals and those that hurt any of them; a row counts once on each side of a cell, so a row that helps one
   *  softgoal of the macro goal and hurts another counts on both. Five steps of one blue by h + k. */
  function matrixSection(gm, rows, byRow, groups, sgName) {
    const cols = macroColumns(gm);
    const grid = groups.map((g) => cols.map((col) => {
      const help = [], hurt = [];
      for (const r of rows) {
        if (!r.realized || !g.members.has(r.id)) continue;
        const cs = (r.contributions || []).filter((c) => col.sgs.has(c.softgoal));
        if (cs.some((c) => POS.has(c.kind))) help.push(r.id);
        if (cs.some((c) => NEG.has(c.kind))) hurt.push(r.id);
      }
      return { help, hurt };
    }));
    const max = Math.max(0, ...grid.flat().map((c) => c.help.length + c.hurt.length));
    let h = '<h2>Clusters by macro goal</h2><p class="rq-note">Per cluster, its realized rows that help (+) and that hurt (−) any softgoal of a macro goal; a row counts once on each side of a cell. ' +
      'The darker the cell, the more rows. Click a cell to list its rows.</p>';
    h += '<table class="rq-t">' + colgroup([0].concat(cols.map(() => MX_W))) + '<thead><tr><th>Cluster</th>' + cols.map((c) => '<th class="mx-th" title="' + esc(c.tip) + '">' + esc(c.head) + '</th>').join('') + '</tr></thead><tbody>';
    groups.forEach((g, i) => {
      h += '<tr><td title="' + esc(g.key) + '">' + esc(undash(g.name)) + '</td>';
      cols.forEach((col, j) => {
        const c = grid[i][j], n = c.help.length + c.hurt.length;
        if (!n) { h += '<td></td>'; return; }
        const key = g.key + '|' + col.key;
        const tip = undash(g.name) + ', ' + col.head + ': ' + c.help.length + ' help, ' + c.hurt.length + ' hurt. Click to list them.';
        h += '<td class="mx-c mx-s' + Math.min(5, Math.ceil((5 * n) / max)) + (mxOpen === key ? ' mx-on' : '') + '" data-mx="' + esc(key) + '" title="' + esc(tip) + '">+' + c.help.length + ' / ' +
          (c.hurt.length ? '<span class="rq-hurt">−' + c.hurt.length + '</span>' : '−0') + '</td>';
      });
      h += '</tr>';
    });
    h += '</tbody></table>';
    const cut = mxOpen.indexOf('|');
    const gi = cut < 0 ? -1 : groups.findIndex((g) => g.key === mxOpen.slice(0, cut));
    const ci = cut < 0 ? -1 : cols.findIndex((c) => c.key === mxOpen.slice(cut + 1));
    if (gi >= 0 && ci >= 0) {
      const c = grid[gi][ci], col = cols[ci];
      const ids = [...new Set(c.help.concat(c.hurt))].sort(byId);
      if (ids.length) {
        h += '<div class="mx-open"><p class="mx-h"><b>' + esc(undash(groups[gi].name)) + '</b> · ' + esc(col.head) + ': ' + c.help.length + ' help, ' + c.hurt.length + ' hurt</p>';
        for (const id of ids) {
          const r = byRow.get(id) || {};
          const t = rowTitle(byRow, id);
          h += '<div class="mx-li"><span class="sb-id">' + esc(id) + '</span><span class="sb-t" title="' + esc(t) + '">' + esc(t) + '</span><span class="mx-cs">' +
            contribCell({ contributions: (r.contributions || []).filter((x) => col.sgs.has(x.softgoal)) }, sgName) + '</span></div>';
        }
        h += '</div>';
      }
    }
    return h;
  }

  /** Side effects between softgoals (docs/goals/correlations.json): one closed group, one line per link, ordered by
   *  the macro goal of `from`, then of `to` (a softgoal in none after them), the file's order inside. */
  function correlationsGroup(gm, byRow, sgName) {
    const cs = gm.correlations || [];
    if (!cs.length) return '';
    const tree = gm.tree || [];
    const mgAt = new Map();
    tree.forEach((mg, i) => (mg.softgoals || []).forEach((sg) => { if (!mgAt.has(sg)) mgAt.set(sg, i); }));
    const at = (sg) => (mgAt.has(sg) ? mgAt.get(sg) : tree.length);
    const sorted = cs.map((c, i) => [c, i]).sort((x, y) => at(x[0].from) - at(y[0].from) || at(x[0].to) - at(y[0].to) || x[1] - y[1]).map(([c]) => c);
    const sgCell = (sg) => '<span class="cx-sg" title="' + esc(sgLabel(sgName, sg)) + '">' + esc(sgLabel(sgName, sg)) + '</span>';
    let body = '';
    for (const c of sorted) {
      const pos = POS.has(c.kind), neg = NEG.has(c.kind);
      body += '<div class="cx-li" title="' + esc(undash(c.why || '')) + '">' + sgCell(c.from) + '<span class="cx-to">→</span>' + sgCell(c.to) +
        '<span class="rq-c ' + (pos ? 'rq-help' : neg ? 'rq-hurt' : '') + '">' + esc(c.kind) + '</span><span class="cx-w">' +
        (c.witnesses || []).map((id) => '<span class="cx-chip" title="' + esc(rowTitle(byRow, id)) + '">' + esc(id) + '</span>').join('') + '</span></div>';
    }
    const nPos = cs.filter((c) => POS.has(c.kind)).length, nNeg = cs.filter((c) => NEG.has(c.kind)).length;
    const key = 'corr';
    return '<details data-key="' + key + '"' + (open.has(key) ? ' open' : '') + '><summary><b>Side effects between softgoals (' + cs.length + ')</b><span class="meta">' + nPos + ' positive, ' + nNeg +
      ' negative · serving the first softgoal moves the second; witnesses: the rows whose decision does both</span></summary><div class="wrap rq-wrap">' + body + '</div></details>';
  }

  function opposingSection(gm, rows, sgName) {
    const byRow = new Map(rows.map((r) => [r.id, r]));
    const { groups, named, rest } = conflictGroups(gm);
    const details = (key, tip, head, body) => '<details data-key="' + esc(key) + '"' + (open.has(key) ? ' open' : '') + '><summary' + (tip ? ' title="' + esc(tip) + '"' : '') + '>' + head + '</summary><div class="wrap rq-wrap">' + body + '</div></details>';
    let h = '<h2>Opposing contributions</h2><p class="rq-note">' + plural(gm.opposing.length, 'pair') + ' of realized rows pull a softgoal both ways: ' +
      named + ' match one of the ' + plural(gm.conflicts.length, 'declared conflict') + ' (same softgoal, same two rows, either order)' +
      (rest.length ? ', ' + rest.length + ' do not; the softgoal balance above holds their rows' : '') + '. Open a group to see its pairs.</p>';
    for (const g of groups) {
      const c = g.conflict;
      const why = c.why ? '<p class="rq-why">' + esc(c.why) + (c.evidence ? ' (evidence: ' + esc(c.evidence) + ')' : '') + '</p>' : '';
      h += details(g.key, c.why, '<b>' + esc(c.a) + ' vs ' + esc(c.b) + '</b><span class="meta">' + esc(c.softgoal + ' ' + (sgName.get(c.softgoal) || '')) + ' · ' + plural(g.pairs.length, 'pair') + '</span>',
        why + pairTable(c, g.pairs, byRow, sgName));
    }
    return h;
  }

  /** Under a cluster's title, its description on one line, the whole text in the title; an empty line without one, so
   *  every summary row has the same height. */
  const descLine = (g) => g.description ? '<span class="rq-desc" title="' + esc(undash(g.description)) + '">' + esc(undash(g.description)) + '</span>' : '<span class="rq-desc"></span>';

  /** Inside the group: the whole description, then one muted line when members joined or left since it was written. */
  function about(g) {
    if (!g.description) return '';
    let h = '<p class="rq-about">' + esc(undash(g.description)) + '</p>';
    const d = g.drift;
    if (d && (d.added.length || d.removed.length)) {
      const then = g.members.size - d.added.length + d.removed.length;
      const tip = [d.added.length ? 'Added: ' + d.added.join(', ') : '', d.removed.length ? 'Removed: ' + d.removed.join(', ') : '', d.by ? 'Written by ' + d.by : ''].filter(Boolean).join('\n');
      h += '<p class="rq-drift" title="' + esc(tip) + '">Written ' + esc(d.written) + ' for ' + plural(then, 'row') + '; since then ' + d.added.length + ' added, ' + d.removed.length + ' removed.</p>';
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

    const groups = cl.list.map((k) => ({ key: k.key, name: k.name, goals: k.goals, members: new Set(k.members), description: k.description || null, drift: k.descriptionDrift || null }));
    groups.push({ key: UNCL, name: 'Unclustered: rows no prompt co-cites', goals: null, members: new Set(rows.filter((r) => !r.cluster).map((r) => r.id)), description: null, drift: null });
    const order = ms.map((m) => [m.id, m.name + ' · ' + m.date]).concat([['__after', 'Realized after the last milestone'], ['__no', 'Not realized']]);
    const slot = (r) => r.realized ? (r.milestone || '__after') : '__no';
    for (const g of groups) {
      const rs = shownRows.filter((r) => g.members.has(r.id));
      if (!rs.length) continue;
      const nReal = rs.filter((r) => r.realized).length;
      let inner = about(g);
      for (const [mid, label] of order) {
        const part = rs.filter((r) => slot(r) === mid);
        if (!part.length) continue;
        inner += '<div class="rq-ms">' + esc(label) + ' · ' + part.length + '</div>' + table(part, sgName);
      }
      h += '<details data-key="' + esc(g.key) + '"' + (open.has(g.key) ? ' open' : '') + '><summary><b>' + esc(undash(g.name)) + '</b><span class="meta">' + (g.key === UNCL ? '' : esc(g.key) + ' · ') + rs.length + ' row' + (rs.length > 1 ? 's' : '') + ' · ' + nReal + ' realized' + totals(g.goals, sgName) + '</span>' + descLine(g) + '</summary><div class="wrap rq-wrap">' + inner + '</div></details>';
    }
    if (gm.present) {
      const byRow = new Map(rows.map((r) => [r.id, r]));
      if ((gm.balance || []).length) h += balanceSection(gm, byRow, groups, sgName);
      if ((gm.softgoals || []).length) h += matrixSection(gm, rows, byRow, groups, sgName);
      h += correlationsGroup(gm, byRow, sgName);
      if (gm.opposing.length || gm.conflicts.length) h += opposingSection(gm, rows, sgName);
    }
    box.innerHTML = h;
    if (!box.dataset.rqClick) { box.dataset.rqClick = '1'; box.addEventListener('click', onClick); }
    box.querySelectorAll('select[data-f]').forEach((s) => s.addEventListener('change', () => { filter[s.dataset.f] = s.value; store.set(s.dataset.f, s.value); render(); }));
    box.querySelectorAll('details[data-key]').forEach((d) => d.addEventListener('toggle', () => { d.open ? open.add(d.dataset.key) : open.delete(d.dataset.key); store.set('open', JSON.stringify([...open])); }));
  }

  /** A click on a balance segment opens its list under the softgoal, or closes it when it is the open one; a click on
   *  a matrix cell does the same for the cell's rows under the matrix. Both are remembered per viewer. */
  function onClick(e) {
    const t = e && e.target;
    if (!t || !t.closest) return;
    const seg = t.closest('[data-sb-cl]');
    if (seg) {
      const sg = seg.dataset.sbSg, k = seg.dataset.sbCl;
      if (sbOpen[sg] === k) delete sbOpen[sg]; else sbOpen[sg] = k;
      store.set('sbOpen', JSON.stringify(sbOpen));
      render();
      return;
    }
    const cell = t.closest('[data-mx]');
    if (cell) { mxOpen = mxOpen === cell.dataset.mx ? '' : cell.dataset.mx; store.set('mxOpen', mxOpen); render(); }
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
