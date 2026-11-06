// Tack board, Insights view: drawn from /api/metrics only. A KPI strip, then one card per layer-1 metric
// (each names the metric and the layer it needs), then the layer-2/3 metrics: a card with figures where the
// selection has the data, else a card that says what they need, never an empty chart. Adapted from Jjodel's lane-board insights.js (P-2026-10-19-1520):
// the KPI strip, the card grid and the bar anatomy; none of its lane, outcome or launcher concepts.
// html() is pure (test/board.test.mjs runs it in a vm).
'use strict';
(function (root) {
  const C = root.TackCharts, B = root.TackBoard;
  const esc = C.esc;
  const k = (n) => (n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(Math.round(n)));
  const usd0 = (n) => '$' + (n >= 100 ? Math.round(n).toLocaleString('en-US') : n.toFixed(n >= 10 ? 0 : 2));
  const hours = (ms) => (ms / 3600e3).toFixed(ms < 36e6 ? 1 : 0) + ' h';
  const PEAK_BINS = [[50e3, '< 50k'], [100e3, '50–100k'], [150e3, '100–150k'], [200e3, '150–200k'], [300e3, '200–300k'], [500e3, '300–500k'], [1e6, '500k–1M'], [Infinity, '≥ 1M']];

  const card = (name, layer, title, sub, body, wide) => '<section class="in-card' + (wide ? ' in-wide' : '') + '" aria-label="' + esc(title) + '"><h3>' + esc(title) +
    '<span class="in-layer" title="Needs layer ' + layer + ' data; metric ' + esc(name) + '">Layer ' + layer + ' · ' + esc(name) + '</span></h3><div class="sub">' + esc(sub) + '</div>' + body + '</section>';

  const n0 = (x) => String(Math.round(x));
  const med = (x) => (x === null || x === undefined ? '–' : String(Math.round(x * 10) / 10));
  const counts = (pairs, label, empty, fmt = n0) => C.bars({ cats: pairs.map(([key]) => ({ key, label: key })), stacks: [{ name: 'Count', color: 'var(--t-accent)', values: pairs.map(([, n]) => n) }], fmt, label, empty });

  /** A card for a computed layer-2/3 metric: its figures, and a bar chart or a meter where there is a distribution. */
  function layerCard(x) {
    const v = x.value;
    const facts = (items) => '<div class="in-note">' + items.map(esc).join(' · ') + '</div>';
    let body;
    switch (x.name) {
      case 'commits_per_unit':
        body = facts([v.units + ' units', v.commits + ' commits', 'median ' + med(v.median), 'max ' + med(v.max)]);
        break;
      case 'cost_per_unit':
        body = facts([B.usd(v.usd) + ' over ' + v.units + ' units', 'median ' + (v.median === null ? '–' : B.usd(v.median)), 'max ' + (v.max === null ? '–' : B.usd(v.max)),
          v.sessions + ' sessions with a unit (prompt ' + v.source.prompt + ', commit ' + v.source.commit + ')', v.sessionsWithoutUnit + ' without']) +
          counts(v.top.slice(0, 8).map((t) => [t.unit, t.usd]), 'Cost of the most expensive units', 'No unit.', usd0);
        break;
      case 'resumes_per_unit':
        body = counts([['0', v.histogram[0]], ['1', v.histogram[1]], ['2+', v.histogram['2+']]], 'Units by resumes: ' + v.resumes + ' resumes over ' + v.units + ' units') +
          facts(['median ' + med(v.median), 'max ' + med(v.max)]);
        break;
      case 'outcome': {
        const keys = ['done', 'breakpoint', 'ceiling', 'hard-stop', 'question', 'blocked', 'unparsed', 'none', 'running'];
        body = (v.lanes ? counts(keys.map((k) => [k, v.lanes[k]]), 'Lanes by final Outcome line, ' + v.lanes.lanes + ' lanes') : '') +
          facts(['log: completed ' + v.log.completed, 'partial ' + v.log.partial, 'problems ' + v.log.problems + ' of ' + v.log.entries + ' task entries']);
        break;
      }
      case 'first_shot':
        body = C.meters({ label: 'First-shot share ' + B.pct(v.share), parts: [{ label: 'First-shot', value: v.share, detail: v.firstShot + ' of ' + v.n + (v.rule === 'lanes' ? ' lanes' : ' units') }] }) +
          (v.rule === 'lanes' ? facts(['rework ' + v.rework, 'failed run ' + v.failedRun, 'running ' + v.running]) : facts(['by the log: no later entry corrects the unit']));
        break;
      case 'cause_tally':
        body = counts(Object.entries(v.causes), 'Entries by cause letter, ' + v.total + ' with a cause', 'No entry with a cause.');
        break;
      default:
        body = C.meters({ label: x.name + ' ' + B.pct(v.share), parts: [{ label: 'Yes', value: v.share, detail: v.yes + ' of ' + (v.yes + v.no) + ' answering; ' + v.unknown + ' unknown' }] });
    }
    return card(x.name, x.layer, x.name.replace(/_/g, ' '), x.definition, body);
  }

  /** The view as HTML from a /api/metrics response. */
  function html(m) {
    const by = Object.fromEntries(m.metrics.map((x) => [x.name, x]));
    const v = (n) => (by[n] && by[n].state === 'computed' ? by[n].value : null);
    const cost = v('cost_per_day'), spd = v('sessions_per_day'), peak = v('context_peak'), waits = v('waits'), ov = v('overlap'), prox = v('commit_proximity'), sub = v('subagent_share');
    const tile = (val, label, note) => '<div class="in-kpi"><div class="v">' + val + '</div><div class="l">' + esc(label) + '</div><div class="w">' + esc(note) + '</div></div>';
    let out = '<div class="in-kpis" aria-label="Summary">' +
      tile(B.int(m.sessions), 'Sessions', spd && spd.undated ? spd.undated + ' without a time' : 'by day of first event') +
      tile(cost ? B.usd(cost.total.usd) : '–', 'Cost, known', cost ? cost.total.known + ' known · ' + cost.total.unknown + ' unknown' : '') +
      tile(peak && peak.median !== null ? B.int(peak.median) : '–', 'Context peak, median', peak ? peak.n + ' sessions with calls' : '') +
      tile(peak && peak.max !== null ? B.int(peak.max) : '–', 'Context peak, max', peak ? peak.noCalls + ' without a call' : '') +
      tile(peak && peak.n ? B.pct(peak.atOrAbove / peak.n) : '–', 'Share ≥ ' + k(peak ? peak.threshold : 200e3), peak ? peak.atOrAbove + ' of ' + peak.n : '') +
      tile(prox ? B.pct(prox.total.share) : '–', 'Commit within the hour', prox ? prox.total.yes + ' of ' + (prox.total.yes + prox.total.no) + ' · ' + prox.total.unknown + ' unknown' : '') + '</div>';

    const keys = C.dayRange([].concat(Object.keys(spd ? spd.days : {}), Object.keys(cost ? cost.days : {}), Object.keys(waits ? waits.days : {}), Object.keys(ov ? ov.days : {})));
    const cats = keys.map((d) => ({ key: d, label: C.dayShort(d) }));
    const span = keys.length ? C.dayLabel(keys[0]) + ' to ' + C.dayLabel(keys[keys.length - 1]) : 'no day';
    const charts = [];

    if (cost) {
      const fams = C.FAMILIES.filter(([f]) => keys.some((d) => cost.days[d] && cost.days[d].families && cost.days[d].families[f] > 0));
      const stacks = fams.map(([f, l]) => ({ name: l, color: C.famColor(f), values: keys.map((d) => (cost.days[d] && cost.days[d].families ? cost.days[d].families[f] ?? null : null)) }));
      const body = C.bars({ cats, stacks, marks: keys.map((d) => (cost.days[d] ? cost.days[d].unknown : 0)), markLabel: 'sessions with unknown cost (not counted)', fmt: usd0,
        label: 'Known cost per day by model family, ' + span + '; total ' + B.usd(cost.total.usd) + ', ' + cost.total.unknown + ' sessions with unknown cost', empty: 'No session with a known cost in this selection.' }) +
        C.legend(fams.map(([f, l]) => [l, C.famColor(f)]).concat([['sessions with unknown cost, never counted as 0', 'unknown']])) +
        (cost.total.partial || cost.undated ? '<div class="in-note">' + (cost.total.partial ? cost.total.partial + ' sessions have a cost with some model unpriced. ' : '') + (cost.undated ? cost.undated + ' sessions without a time are in the total only.' : '') + '</div>' : '');
      charts.push(card('cost_per_day', 1, 'Cost per day', 'Known session cost by the day of its first event, split by model family.', body, true));
    }
    if (spd) {
      charts.push(card('sessions_per_day', 1, 'Sessions per day', 'Sessions by the local day of their first event.',
        C.bars({ cats, stacks: [{ name: 'Sessions', color: 'var(--t-accent)', values: keys.map((d) => spd.days[d] ?? 0) }], fmt: (x) => String(Math.round(x)), label: 'Sessions per day, ' + span + ', ' + spd.total + ' in all' })));
    }
    if (peak) {
      const n = PEAK_BINS.map(() => 0);
      peak.sessions.forEach((x) => { n[PEAK_BINS.findIndex(([hi]) => x.peak < hi)]++; });
      const pc = PEAK_BINS.map(([, l]) => ({ key: l, label: l }));
      const hi = PEAK_BINS.map(([top]) => top > peak.threshold);
      charts.push(card('context_peak', 1, 'Context peak distribution', 'Sessions by their largest main-thread context; amber at or above ' + k(peak.threshold) + '.',
        C.bars({ cats: pc, stacks: [{ name: 'Below ' + k(peak.threshold), color: 'var(--t-accent)', values: n.map((x, i) => (hi[i] ? null : x)) }, { name: 'At or above ' + k(peak.threshold), color: 'var(--t-wait)', values: n.map((x, i) => (hi[i] ? x : null)) }],
          fmt: (x) => String(Math.round(x)), label: 'Context peak distribution: ' + peak.n + ' sessions, ' + peak.atOrAbove + ' at or above ' + k(peak.threshold), empty: 'No session with a call in this selection.' }) +
        C.legend([['Below ' + k(peak.threshold), 'var(--t-accent)'], ['At or above ' + k(peak.threshold), 'var(--t-wait)']]) +
        (peak.noCalls ? '<div class="in-note">' + peak.noCalls + ' sessions without a main-thread call are left out.</div>' : '')));
    }
    if (waits) {
      charts.push(card('waits', 1, 'Waits per day', 'Gaps longer than ' + Math.round(waits.gapMs / 60000) + ' min between consecutive calls of a session, by the day the gap starts.',
        C.multiples([
          { title: 'Count', cats, stacks: [{ name: 'Waits', color: 'var(--t-accent)', values: keys.map((d) => (waits.days[d] ? waits.days[d].count : 0)) }], fmt: (x) => String(Math.round(x)), label: 'Waits per day, count; ' + waits.total.count + ' in all' },
          { title: 'Hours', cats, stacks: [{ name: 'Hours', color: 'var(--t-accent)', values: keys.map((d) => (waits.days[d] ? waits.days[d].ms / 3600e3 : 0)) }], fmt: (x) => (x >= 10 ? Math.round(x) : x.toFixed(1)) + ' h', label: 'Waits per day, hours; ' + hours(waits.total.ms) + ' in all' },
        ])));
    }
    if (ov) {
      charts.push(card('overlap', 1, 'Overlap per day', 'Largest number of sessions of one repository active at the same instant.',
        C.line({ cats, values: keys.map((d) => ov.days[d] ?? 0), fmt: (x) => String(Math.round(x)), label: 'Overlap per day, ' + span + '; peak ' + Math.max(0, ...Object.values(ov.days)) }) +
        (ov.unlinked ? '<div class="in-note">' + ov.unlinked + ' sessions without a repository are left out.</div>' : '')));
    }
    if (sub) {
      charts.push(card('subagent_share', 1, 'Subagent share', 'Subagent calls over all calls; subagent cost over known cost, each model\'s cost split by price-weighted tokens.',
        C.meters({ label: 'Subagent share: calls ' + B.pct(sub.calls.share) + ', cost ' + B.pct(sub.cost.share), parts: [
          { label: 'Calls', value: sub.calls.share, detail: B.int(sub.calls.subagent) + ' of ' + B.int(sub.calls.total) + ' calls' },
          { label: 'Cost', value: sub.cost.share, detail: B.usd(sub.cost.subagentUsd) + ' of ' + B.usd(sub.cost.totalUsd) + (sub.cost.unattributedUsd ? ', ' + B.usd(sub.cost.unattributedUsd) + ' unattributed' : '') },
        ] })));
    }
    out += '<div class="in-grid">' + charts.join('') + '</div>';

    const up = m.metrics.filter((x) => x.layer > 1);
    const done = up.filter((x) => x.state === 'computed');
    const rest = up.filter((x) => x.state !== 'computed');
    out += '<h2>Layers 2 and 3<span class="h2n">' + done.length + ' of ' + up.length + ' metrics with data</span></h2>';
    if (done.length) out += '<div class="in-grid">' + done.map(layerCard).join('') + '</div>';
    if (rest.length) out += '<div class="in-grid in-small">' + rest.map((x) =>
      '<section class="in-card in-na" aria-label="' + esc(x.name) + '"><h3>' + esc(x.name) + '<span class="in-layer">Layer ' + x.layer + '</span></h3><div class="sub">' + esc(x.definition) + '</div>' +
      '<div class="in-state"><span class="st">Not adopted: needs ' + esc(x.enabledBy) + '</span></div></section>').join('') + '</div>';
    return out;
  }

  root.TackInsights = { html };
  if (typeof document === 'undefined') return;
  root.TackViews.insights = { render: (state, box) => { box.innerHTML = html(state.metrics); C.fit(box); } };
})(typeof window !== 'undefined' ? window : globalThis);
