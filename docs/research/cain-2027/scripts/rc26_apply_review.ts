/**
 * rc26_apply_review.ts — reads Alfonso's verdicts from review/rc26_review.md and recomputes the RC-26 numbers of
 * the 1630 dataset into data/rc26_reviewed.csv (P-2026-10-11-1725, item 3).
 *
 * A verdict is `mine` (an RC-26 item that was Alfonso's to decide), `delegated` (an RC-26 item Alfonso had delegated) or
 * `not-RC-26`; an empty cell is a row not reviewed. Any other value stops the script (exit 1) with the rows.
 *
 * One CSV row per metric, three estimates side by side:
 *   agent     the 1630 numbers: the agent's hand check (tp/fn positive, tn negative), delegation as the row cites it;
 *   reviewed  the reviewed rows only, Alfonso's verdict;
 *   combined  Alfonso's verdict where given, the agent's elsewhere.
 * `waited` is the 1630 status at introduction (decisions.csv). A crossing is an RC-26 row that did not wait;
 * strict counts `mine` only, with_delegated counts `mine` and `delegated` (the agent's 34 is with_delegated).
 * Regex precision keeps the agent's verdict on the 40 rejected rule candidates, which the sheet does not carry.
 *
 * Run from the repository root: node --experimental-strip-types docs/research/cain-2027/scripts/rc26_apply_review.ts
 *   [--sheet <file>] [--out <csv>]   (defaults: review/rc26_review.md, data/rc26_reviewed.csv)
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA, HERE, RESEARCH, readData, writeCsv } from './rq_common.ts';

const opt = (name: string, def: string): string => {
    const i = process.argv.indexOf(name);
    return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
};
const SHEET = opt('--sheet', join(RESEARCH, 'review', 'rc26_review.md'));
const OUT = opt('--out', join(DATA, 'rc26_reviewed.csv'));
const VALID = new Map([['mine', 'mine'], ['delegated', 'delegated'], ['not-rc-26', 'not-RC-26']]);

const hand: Record<string, { v: string }> = JSON.parse(readFileSync(join(HERE, 'rc26-hand-check.json'), 'utf8'));
/** first_act of each 1630 crossing (detection-evidence.json): only `none` and `delegation-partial` had neither a full
 * delegation nor an act of Alfonso before the trunk; a row with no record counts as `none`. */
const firstAct: Record<string, string> = Object.fromEntries(
    Object.entries(JSON.parse(readFileSync(join(HERE, 'detection-evidence.json'), 'utf8')).rc26 as Record<string, { first_act: string }>).map(([id, n]) => [id, n.first_act]),
);
const bare = (id: string): boolean => ['none', 'delegation-partial', undefined].includes(firstAct[id]);
const decisions = new Map(readData('decisions.csv').map((d) => [d.id, d]));

// ── the sheet ────────────────────────────────────────────────────────────────

interface Row {
    id: string;
    agent: 'pos' | 'neg';
    regexHit: boolean;
    waited: boolean;
    delegationCited: boolean;
    verdict: string; // '' when not reviewed
}
const lines = readFileSync(SHEET, 'utf8').split('\n');
const header = lines.find((l) => l.startsWith('| # |'));
if (!header) {
    console.error(`${SHEET}: no table header`);
    process.exit(1);
}
const cols = header.split('|').slice(1, -1).map((c) => c.trim());
const at = (name: string): number => {
    const i = cols.indexOf(name);
    if (i < 0) {
        console.error(`${SHEET}: no column «${name}»`);
        process.exit(1);
    }
    return i;
};
const [iId, iVerdict, iDelegation] = [at('id'), at('verdict'), at('delegation cited')];
const rows: Row[] = [];
const bad: string[] = [];
for (const l of lines) {
    if (!/^\| \d+ \|/.test(l)) continue;
    const c = l.split('|').slice(1, -1).map((x) => x.trim());
    const id = c[iId];
    const d = decisions.get(id);
    const h = hand[id];
    if (!d || !h) {
        bad.push(`${id}: not in decisions.csv or rc26-hand-check.json`);
        continue;
    }
    const raw = (c[iVerdict] ?? '').replace(/`/g, '').trim();
    const verdict = raw === '' ? '' : VALID.get(raw.toLowerCase()) ?? null;
    if (verdict === null) bad.push(`${id}: verdict «${raw}» is not mine, delegated or not-RC-26`);
    rows.push({
        id,
        agent: h.v === 'tp' || h.v === 'fn' ? 'pos' : 'neg',
        regexHit: d.rc26_rule_classes !== '',
        waited: d.waited === 'yes',
        delegationCited: (c[iDelegation] ?? '') !== '',
        verdict: verdict ?? '',
    });
}
if (bad.length) {
    console.error(bad.join('\n'));
    process.exit(1);
}
if (rows.length !== 98) console.warn(`warning: ${rows.length} rows in the sheet, 98 expected`);

// ── the numbers ──────────────────────────────────────────────────────────────

type Label = 'mine' | 'delegated' | 'not-RC-26';
const agentLabel = (r: Row): Label => (r.agent === 'neg' ? 'not-RC-26' : r.delegationCited ? 'delegated' : 'mine');
const reviewed = rows.filter((r) => r.verdict !== '');
const combinedLabel = (r: Row): Label => (r.verdict ? (r.verdict as Label) : agentLabel(r));
const isRc26 = (l: Label): boolean => l !== 'not-RC-26';

function metrics(set: Row[], label: (r: Row) => Label) {
    const rc26 = set.filter((r) => isRc26(label(r)));
    const mine = set.filter((r) => label(r) === 'mine');
    const crossStrict = mine.filter((r) => !r.waited);
    const crossAll = rc26.filter((r) => !r.waited);
    const crossBare = mine.filter((r) => !r.waited && bare(r.id));
    return { crossBare: crossBare.length, n: set.length, rc26: rc26.length, mine: mine.length, delegated: rc26.length - mine.length, crossStrict: crossStrict.length, crossAll: crossAll.length, shareStrict: mine.length ? crossStrict.length / mine.length : '', shareAll: rc26.length ? crossAll.length / rc26.length : '' };
}
const A = metrics(rows, agentLabel);
const R = metrics(reviewed, (r) => r.verdict as Label);
const C = metrics(rows, combinedLabel);

// Agent precision against Alfonso: reviewed agent positives judged to be in RC-26; misses among reviewed agent negatives.
const revPos = reviewed.filter((r) => r.agent === 'pos');
const revNeg = reviewed.filter((r) => r.agent === 'neg');
const agentPrecision = revPos.length ? revPos.filter((r) => isRc26(r.verdict as Label)).length / revPos.length : '';
const negMisses = revNeg.filter((r) => isRc26(r.verdict as Label)).length;
// Regex precision over the 108 rule candidates: 40 rejected candidates keep the agent's verdict (not in the sheet).
const rejected = Object.entries(hand).filter(([, h]) => h.v === 'fp').length;
const regexRows = rows.filter((r) => r.regexHit);
const regexPrec = (label: (r: Row) => Label): number => regexRows.filter((r) => isRc26(label(r))).length / (regexRows.length + rejected);

const out: unknown[][] = [
    ['rows_in_sheet', 'sheet', rows.length, reviewed.length, rows.length, 'reviewed column: rows with a verdict'],
    ['agent_positives_reviewed', 'sheet', rows.filter((r) => r.agent === 'pos').length, revPos.length, '', 'of the 71 positives'],
    ['agent_negatives_reviewed', 'sheet', rows.filter((r) => r.agent === 'neg').length, revNeg.length, '', 'of the 27 sampled negatives the agent kept negative'],
    ['rc26_rows', 'rows judged in RC-26 (mine or delegated)', A.rc26, reviewed.length ? R.rc26 : '', C.rc26, ''],
    ['rc26_mine', 'rows judged mine', A.mine, reviewed.length ? R.mine : '', C.mine, 'agent: positives that cite no delegation'],
    ['rc26_delegated', 'rows judged delegated', A.delegated, reviewed.length ? R.delegated : '', C.delegated, 'agent: positives whose row cites a delegation'],
    ['crossings_with_delegated', 'RC-26 rows that did not wait', A.crossAll, reviewed.length ? R.crossAll : '', C.crossAll, 'the 1630 «34 of 71»'],
    ['crossings_strict', 'mine rows that did not wait', A.crossStrict, reviewed.length ? R.crossStrict : '', C.crossStrict, ''],
    ['crossings_no_prior_act', 'mine rows that did not wait, with no act of Alfonso before the trunk and no delegation', A.crossBare, reviewed.length ? R.crossBare : '', C.crossBare, 'first_act none or delegation-partial in detection-evidence.json'],
    ['share_not_waited_with_delegated', 'crossings_with_delegated / rc26_rows', A.shareAll, reviewed.length ? R.shareAll : '', C.shareAll, ''],
    ['share_not_waited_strict', 'crossings_strict / rc26_mine', A.shareStrict, reviewed.length ? R.shareStrict : '', C.shareStrict, ''],
    ['agent_precision_vs_review', 'reviewed agent positives judged RC-26', '', agentPrecision, '', 'empty until a positive is reviewed'],
    ['agent_negative_sample_misses', 'reviewed sampled negatives judged RC-26', 3, reviewed.length ? negMisses : '', '', 'agent: the 3 sampled negatives it found positive (counted among the positives)'],
    ['regex_precision', 'rule candidates in RC-26 / 108 candidates', regexPrec(agentLabel), '', regexPrec(combinedLabel), 'the 40 rejected candidates keep the agent verdict'],
];
writeCsv(OUT, ['metric', 'basis', 'agent', 'reviewed', 'combined', 'note'], out);
console.log(`${reviewed.length} reviewed of ${rows.length} rows (${revPos.length} positives, ${revNeg.length} sampled negatives)`);
console.log(`crossings with delegated: agent ${A.crossAll} of ${A.rc26}, combined ${C.crossAll} of ${C.rc26}`);
