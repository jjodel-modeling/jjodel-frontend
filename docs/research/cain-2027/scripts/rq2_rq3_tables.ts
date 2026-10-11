/**
 * rq2_rq3_tables.ts — RQ2 (judgment rules) and RQ3 (detection and repair) of the CAIN 2027 full paper
 * (P-2026-10-11-1725, items 2 and 4).
 *
 * data/rq2_judgment.csv, two kinds of record:
 *   day       per rule and day, opportunities, violations, rate: RC-26 (rows in an RC-26 class introduced that day,
 *             crossings), RC-25 (provisional rows written that day, not acknowledged within 2 days; and the daily
 *             snapshot of outstanding provisional rows older than 2 days), RC-18 (code lanes and harness-only lanes
 *             of the 7-day window, verdict). Period `series` up to 2026-10-10, `intervention` for 2026-10-11.
 *   crossing  one per RC-26 crossing, RC-25 late row and RC-18 day over budget: how and when it was noticed, with
 *             the evidence (commit and file:line).
 * data/rq3_detection_repair.csv: one row per drift episode (every header of conformance_failures.csv, every RC-25
 * row acknowledged late or never, every RC-18 day over budget): introduced, first detected, repaired, the two
 * latencies, and whether the repair was part of a batch (more than 10 repairs in one commit or merge).
 *
 * Inputs: the 1630 CSVs (decisions, conformance_daily, conformance_failures, rc18_daily), read only;
 * scripts/detection-evidence.json, the curated detection record (who noticed, when, evidence), built by this lane
 * from a read-only helper agent's search and checked by hand; git at REF for commit times.
 *
 * Run from the repository root: node --experimental-strip-types docs/research/cain-2027/scripts/rq2_rq3_tables.ts
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    CUT, CUT_CT, DATA, HERE, JUDGMENT_FROM, commitsByShas, dayRange, isoOf, rate, readData, secOf, sha9, writeCsv,
} from './rq_common.ts';

const SERIES_TO = '2026-10-10'; // the day before the ratification merge c6804f3d3
const INTERVENTION = '2026-10-11';
const cutCt = CUT_CT();
const cut9 = sha9(CUT);

interface Notice {
    noticed_by: string; // digest | lane-report | chat | alfonso | never
    noticed_as?: string; // rc26 | provisional | delegation | budget | grammar | none
    noticed_date: string; // YYYY-MM-DD HH:mm, '' for never
    evidence: string; // commit and file:line, '; '-separated
    research_line?: string; // yes when the noticing artifact belongs to the research line (1150, 1430, 1630)
    first_act?: string; // RC-26 crossings: none | delegation | delegation-partial | alfonso-before-trunk | section-ratified | id-reuse
    alfonso_act?: string; // RC-26 crossings: before-trunk | after-trunk | none recorded
    repaired_commit?: string; // grammar rows: overrides the 1630 fixed_commit (see detection-evidence.json _source)
    note?: string;
}
const EV: {
    rc26: Record<string, Notice>;
    rc25: { batches: Record<string, Notice>; rows: Record<string, Notice> };
    rc18: Record<string, Notice>;
    grammar: { window: Notice; pre_grammar: Notice; rows: Record<string, Notice> };
} = JSON.parse(readFileSync(process.argv.includes('--evidence') ? process.argv[process.argv.indexOf('--evidence') + 1] : join(HERE, 'detection-evidence.json'), 'utf8'));

const decisions = readData('decisions.csv');
const byId = new Map(decisions.map((d) => [d.id, d]));
const conformance = readData('conformance_daily.csv');
const failures = readData('conformance_failures.csv');
const rc18 = readData('rc18_daily.csv');
const hand: Record<string, { v: string }> = JSON.parse(readFileSync(join(HERE, 'rc26-hand-check.json'), 'utf8'));
const shas = commitsByShas([
    ...decisions.flatMap((d) => [d.intro_commit, d.trunk_commit, d.ratification_commit]),
    ...failures.flatMap((f) => [f.first_commit, f.fixed_commit]),
    ...Object.values(EV.grammar.rows).map((n) => n.repaired_commit ?? ''),
]);
const ctOf = (s: string): number | null => (s ? shas.get(s)?.ct ?? null : null);
const days = (a: number | null, b: number | null): number | '' => (a !== null && b !== null ? Math.round(((b - a) / 86400) * 100) / 100 : '');
const periodOf = (day: string): string => (day <= SERIES_TO ? 'series' : day === INTERVENTION ? 'intervention' : 'after');
const noticeSec = (n: Notice | undefined): number | null => (n && n.noticed_date ? secOf(n.noticed_date) : null);

const rq2: unknown[][] = [];
const R2 = (o: Record<string, unknown>): void => {
    rq2.push(RQ2_COLS.map((c) => o[c] ?? ''));
};
const RQ2_COLS = ['record', 'rule', 'date', 'period', 'item', 'opportunities', 'violations', 'rate', 'verdict', 'status_at_intro', 'delegation_cited', 'first_act', 'alfonso_act', 'noticed_by', 'noticed_as', 'noticed_date', 'notice_latency_days', 'research_line', 'evidence', 'note'];

// ── RC-26 ─────────────────────────────────────────────────────────────────────

const positive = (d: Record<string, string>): boolean => d.rc26_window === 'yes' && (hand[d.id]?.v === 'tp' || hand[d.id]?.v === 'fn');
for (const day of [...dayRange(JUDGMENT_FROM, SERIES_TO), INTERVENTION]) {
    const ps = decisions.filter((d) => positive(d) && d.header_date === day);
    const v = ps.filter((d) => d.rc26_crossing === 'yes');
    R2({ record: 'day', rule: 'RC-26 waits for Alfonso', date: day, period: periodOf(day), item: 'rows in an RC-26 class introduced (agent hand check)', opportunities: ps.length, violations: v.length, rate: rate(v.length, ps.length) });
}
const rc26Cross = decisions.filter((d) => positive(d) && d.rc26_crossing === 'yes').sort((a, b) => a.intro_time.localeCompare(b.intro_time));
for (const d of rc26Cross) {
    const n = EV.rc26[d.id];
    if (!n) throw new Error(`detection-evidence.json: no rc26 record for ${d.id}`);
    const intro = ctOf(d.intro_commit);
    R2({
        record: 'crossing', rule: 'RC-26 waits for Alfonso', date: d.header_date, period: periodOf(d.header_date), item: d.id,
        status_at_intro: d.status_at_intro, delegation_cited: /delegation|delega/i.test(d.header_at_intro) ? 'yes' : 'no',
        first_act: n.first_act ?? '', alfonso_act: n.alfonso_act ?? '',
        noticed_by: n.noticed_by, noticed_as: n.noticed_as ?? '', noticed_date: n.noticed_date,
        notice_latency_days: days(intro, noticeSec(n)), research_line: n.research_line ?? 'no', evidence: n.evidence, note: n.note ?? '',
    });
}

// ── RC-25 ─────────────────────────────────────────────────────────────────────

const provisional = decisions.filter((d) => d.header_date >= JUDGMENT_FROM && d.status_at_intro.startsWith('provisional'));
/** The day a provisional row was acknowledged: the ratification marker, else the commit that ratified it, else the
 * marker of a row that arrived on the trunk already ratified (ratified on its branch). */
const ackDay = (d: Record<string, string>): string => d.ratification_marker_date || (d.ratification_time ? d.ratification_time.slice(0, 10) : '');
const ackCommit = (d: Record<string, string>): string => d.ratification_commit || (d.status_now.startsWith('ratified') && d.ratification_marker_date ? d.trunk_commit : '');
const late = (d: Record<string, string>): boolean => {
    const a = ackDay(d);
    return !a || dayRange(d.header_date, a).length - 1 > 2;
};
for (const day of [...dayRange(JUDGMENT_FROM, SERIES_TO), INTERVENTION]) {
    const ps = provisional.filter((d) => d.header_date === day);
    const v = ps.filter(late);
    const byIntervention = ps.filter((d) => d.ratification_commit === cut9 && !late(d)).length;
    R2({ record: 'day', rule: 'RC-25 provisional row acknowledged within 2 days', date: day, period: periodOf(day), item: 'provisional rows written that day', opportunities: ps.length, violations: v.length, rate: rate(v.length, ps.length), note: byIntervention ? `${byIntervention} acknowledged within 2 days only by the intervention merge` : '' });
}
for (const c of conformance) {
    const pre = c.snapshot.startsWith('trunk before');
    const period = pre ? 'intervention' : periodOf(c.date);
    R2({ record: 'day', rule: 'RC-25 outstanding provisional rows older than 2 days (snapshot)', date: c.date, period, item: pre ? `snapshot before ${cut9}` : 'last trunk commit of the day', opportunities: c.rows_since_grammar, violations: c.provisional_older_than_2d, rate: rate(+c.provisional_older_than_2d, +c.rows_since_grammar) });
}
for (const d of provisional.filter(late).sort((a, b) => a.intro_time.localeCompare(b.intro_time))) {
    const batch = ackCommit(d);
    const n = EV.rc25.rows[d.id] ?? EV.rc25.batches[batch || 'never'];
    if (!n) throw new Error(`detection-evidence.json: no rc25 record for ${d.id} (batch ${batch || 'never'})`);
    R2({
        record: 'crossing', rule: 'RC-25 provisional row acknowledged within 2 days', date: d.header_date, period: periodOf(d.header_date), item: d.id,
        status_at_intro: d.status_at_intro, noticed_by: n.noticed_by, noticed_as: n.noticed_as ?? 'provisional', noticed_date: n.noticed_date,
        notice_latency_days: days(ctOf(d.intro_commit), noticeSec(n)), research_line: n.research_line ?? 'no', evidence: n.evidence,
        note: [`acknowledged ${ackDay(d) || 'never'}${batch ? ` by ${batch}` : ''}`, n.note ?? ''].filter(Boolean).join('; '),
    });
}

// ── RC-18 ─────────────────────────────────────────────────────────────────────

for (const r of rc18) {
    if (r.date < JUDGMENT_FROM && r.date !== '2026-09-25') continue;
    R2({ record: 'day', rule: 'RC-18 harness budget', date: r.date, period: periodOf(r.date), item: `7-day window from ${r.window_from}`, opportunities: r.code_lanes, violations: r.harness_only_lanes, rate: r.share, verdict: r.rc18_budget_0_25 });
}
for (const r of rc18.filter((x) => x.rc18_budget_0_25 === 'over')) {
    const n = EV.rc18[r.date];
    if (!n) throw new Error(`detection-evidence.json: no rc18 record for ${r.date}`);
    R2({
        record: 'crossing', rule: 'RC-18 harness budget', date: r.date, period: periodOf(r.date), item: `share ${r.share}`, verdict: 'over',
        noticed_by: n.noticed_by, noticed_as: n.noticed_as ?? 'budget', noticed_date: n.noticed_date,
        notice_latency_days: days(secOf(`${r.date} 23:59`), noticeSec(n)), research_line: n.research_line ?? 'no', evidence: n.evidence, note: n.note ?? '',
    });
}
writeCsv(join(DATA, 'rq2_judgment.csv'), RQ2_COLS, rq2);

// ── RQ3: drift episodes ───────────────────────────────────────────────────────

interface Episode {
    family: string;
    item: string;
    kind: string;
    inWindow: string;
    introDate: string;
    introCommit: string;
    introCt: number | null;
    introChat: string;
    introOn: string;
    notice: Notice;
    repairCommit: string;
    repairCt: number | null;
    repairDate: string;
    state: string;
    note: string;
}
const eps: Episode[] = [];
for (const f of failures) {
    const inWindow = f.row_header_date >= JUDGMENT_FROM;
    const n = EV.grammar.rows[f.id] ?? (inWindow ? EV.grammar.window : EV.grammar.pre_grammar);
    const fixed = n.repaired_commit ?? f.fixed_commit;
    eps.push({
        family: 'grammar', item: f.id, kind: f.kind, inWindow: inWindow ? 'yes' : 'no',
        introDate: f.first_time.slice(0, 10), introCommit: f.first_commit, introCt: ctOf(f.first_commit), introChat: f.chat, introOn: f.first_on,
        notice: n, repairCommit: fixed, repairCt: ctOf(fixed), repairDate: fixed ? isoOf(ctOf(fixed)!).slice(0, 10) : '', state: f.state_now,
        note: [f.at_row_intro === 'yes' ? 'non-conforming from the row\'s first commit' : 'became non-conforming by a later edit', n.repaired_commit ? `repair commit corrected from the 1630 ${f.fixed_commit} to the trunk arrival ${n.repaired_commit}` : ''].filter(Boolean).join('; '),
    });
}
for (const d of provisional.filter(late)) {
    const batch = ackCommit(d);
    const n = EV.rc25.rows[d.id] ?? EV.rc25.batches[batch || 'never'];
    eps.push({
        family: 'rc25-late', item: d.id, kind: d.status_at_intro, inWindow: 'yes',
        introDate: d.intro_time.slice(0, 10), introCommit: d.intro_commit, introCt: ctOf(d.intro_commit), introChat: d.adopting_chat, introOn: d.intro_commit === d.trunk_commit ? 'trunk' : 'branch',
        notice: n, repairCommit: batch, repairCt: ctOf(batch), repairDate: ackDay(d), state: d.status_now,
        note: d.ratification_commit ? '' : batch ? 'ratified on its branch; the commit is the trunk arrival' : 'never acknowledged',
    });
}
for (const r of rc18.filter((x) => x.rc18_budget_0_25 === 'over')) {
    eps.push({
        family: 'rc18-over', item: r.date, kind: `share ${r.share}`, inWindow: 'yes',
        introDate: r.date, introCommit: '', introCt: secOf(`${r.date} 23:59`), introChat: '', introOn: '',
        notice: EV.rc18[r.date], repairCommit: '', repairCt: null, repairDate: '', state: 'over at the end of the series',
        note: 'no window returned within budget by REF',
    });
}
// Batch: more than 10 repairs, across families, in one commit or merge.
const perCommit = new Map<string, number>();
for (const e of eps) if (e.repairCommit) perCommit.set(e.repairCommit, (perCommit.get(e.repairCommit) ?? 0) + 1);
const rq3 = eps.map((e) => {
    const nSec = noticeSec(e.notice);
    const size = e.repairCommit ? perCommit.get(e.repairCommit)! : 0;
    return [
        e.family, e.item, e.kind, e.inWindow, e.introDate, e.introCommit, e.introChat, e.introOn,
        e.notice.noticed_date.slice(0, 10), e.notice.noticed_by, e.notice.research_line ?? 'no', e.notice.evidence,
        e.repairDate, e.repairCommit, e.repairCommit === cut9 ? 'yes' : 'no',
        days(e.introCt, nSec), days(nSec, e.repairCt), e.repairCommit ? (size > 10 ? 'yes' : 'no') : '', size || '',
        e.state, [e.note, e.notice.note ?? ''].filter(Boolean).join('; '),
    ];
});
writeCsv(join(DATA, 'rq3_detection_repair.csv'), [
    'family', 'item', 'kind', 'in_grammar_window', 'introduced_date', 'introduced_commit', 'introduced_chat', 'introduced_on',
    'detected_date', 'detected_by', 'detected_by_research_line', 'detection_evidence',
    'repaired_date', 'repaired_commit', 'repaired_by_intervention', 'latency_intro_to_detect_days', 'latency_detect_to_repair_days',
    'repair_batch', 'repairs_in_that_commit', 'state_at_ref', 'note',
], rq3);
console.log(`episodes: ${eps.length} (grammar ${eps.filter((e) => e.family === 'grammar').length}, in window ${eps.filter((e) => e.family === 'grammar' && e.inWindow === 'yes').length}; rc25-late ${eps.filter((e) => e.family === 'rc25-late').length}; rc18-over ${eps.filter((e) => e.family === 'rc18-over').length}); cut ${isoOf(cutCt)}`);
