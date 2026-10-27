/**
 * rc26_review_sheet.ts — writes review/rc26_review.md, the sheet on which Alfonso judges the RC-26 rows of the
 * 1630 dataset (P-2026-10-11-1725, item 3). The lane prepares the sheet; it writes no verdict.
 *
 * Rows: the 71 positives of the 1630 hand check (68 rule candidates judged tp, 3 sampled negatives judged fn)
 * and the 30 sampled negatives (27 tn plus the same 3 fn): 98 distinct rows, ordered by header date. Each row
 * carries the header as first written, the row's own title (bold opening or first sentence, not a paraphrase),
 * the class the agent assigned and the regex classes that matched, whether it waited (with the status marker
 * at introduction), any delegation the row cites, the agent's note, and an empty `verdict` column.
 *
 * Inputs: data/decisions.csv and scripts/rc26-hand-check.json of the 1630 dataset; the register text at each
 * row's introducing commit (git, pinned through decisions.csv). Refuses to overwrite a sheet that already
 * carries a verdict, unless --force.
 *
 * Run from the repository root: node --experimental-strip-types docs/research/cain-2027/scripts/rc26_review_sheet.ts [--force]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HERE, RESEARCH, catBlobs, readData } from './rq_common.ts';

const SHEET = join(RESEARCH, 'review', 'rc26_review.md');


const force = process.argv.includes('--force');
const hand: Record<string, { v: string; cls?: string; note: string }> = JSON.parse(readFileSync(join(HERE, 'rc26-hand-check.json'), 'utf8'));
const decisions = new Map(readData('decisions.csv').map((d) => [d.id, d]));
const ids = Object.keys(hand).filter((k) => ['tp', 'fn', 'tn'].includes(hand[k].v));
/** Data flags of P-2026-10-11-1725 on the 1630 crossings (detection-evidence.json), shown after the agent's note. */
const evidence: Record<string, { first_act: string; alfonso_act: string }> = JSON.parse(readFileSync(join(HERE, 'detection-evidence.json'), 'utf8')).rc26;
const FLAG: Record<string, string> = {
    'alfonso-before-trunk': 'your word is recorded before the trunk; the header still says provisional',
    'section-ratified': 'the section intro records your ratification before the rows; the 1630 reader missed it',
    'id-reuse': 'the provisional first appearance is another row (id reused); this row was written ratified',
};
const flagOf = (id: string): string => {
    const e = evidence[id];
    if (!e) return '';
    const parts = [FLAG[e.first_act] ?? '', e.first_act === 'delegation' && e.alfonso_act === 'before-trunk' ? 'under delegation, and your review is recorded before the trunk' : ''].filter(Boolean);
    return parts.length ? ` [1725: ${parts.join('; ')}]` : '';
};

/** The block of row `key` in a register text: header line plus continuation lines (the 1630 lenient opener). */
function blockOf(text: string, key: string): string {
    const lines = text.split('\n');
    const esc = key.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    const open = new RegExp(`^(- )?\\*\\*${esc}\\*\\* \\(\\d{4}-\\d{2}-\\d{2}`);
    const i = lines.findIndex((l) => open.test(l));
    if (i < 0) return '';
    const out = [lines[i]];
    for (let j = i + 1; j < lines.length; j++) {
        const n = lines[j];
        if (n.trim() === '' || n.startsWith('#') || n.startsWith('- ') || /^(- )?\*\*[^*]{1,60}\*\* \(\d{4}-\d{2}-\d{2}/.test(n)) break;
        out.push(n.trim());
    }
    return out.join(' ');
}
/** Header parenthesis (balanced) and the title after it, as governance-dataset.ts:216-241 reads them. */
function headerAndTitle(block: string): { paren: string; title: string } {
    const open = block.indexOf(' (', block.indexOf('**', 2) + 2);
    let depth = 0;
    let end = block.length;
    for (let k = open + 1; k < block.length; k++) {
        if (block[k] === '(') depth++;
        else if (block[k] === ')') {
            depth--;
            if (depth === 0) {
                end = k;
                break;
            }
        }
    }
    const after = block.slice(end + 1).replace(/^[:.]|^ —/, '').trim();
    const bold = /^\*\*(.+?)\*\*/.exec(after);
    return { paren: block.slice(open + 2, end), title: (bold ? bold[1] : after.split(/(?<=[.!?])\s/)[0]).slice(0, 160) };
}
const DELEGATION = /[^,(]{0,40}\b(delega\w*|delegation|delegated|decidi tu|on Alfonso'?s (?:word|delegation|behalf))\b[^,)«]*(«[^»]*»)?/i;
const MARKER = /(provisional[^,)]*|awaiting Alfonso|ratified[^,)]*|decided[^,)]*|adopted[^,)]*|approved[^,)]*|delegation[^,)]*)/i;
const cell = (s: string): string => s.replace(/\|/g, '/').replace(/\s+/g, ' ').trim();

const specs = ids.map((id) => `${decisions.get(id)!.intro_commit}:docs/decisions.md`);
const texts = catBlobs(specs);
let headerMismatch = 0;
const rows = ids.map((id, i) => {
    const d = decisions.get(id)!;
    const h = hand[id];
    const block = blockOf(texts[i] ?? '', id);
    const { paren, title } = headerAndTitle(block);
    if (paren.slice(0, 300) !== d.header_at_intro) headerMismatch++;
    const del = DELEGATION.exec(block);
    const m = MARKER.exec(d.header_at_intro)?.[1]?.trim() ?? '';
    const marker = m.length > 60 ? `${m.slice(0, 60)}…` : m;
    const waited = d.waited === 'yes';
    const waitedCell = `${waited ? 'yes' : 'no'} (${d.status_at_intro}${marker ? `: «${marker}»` : ''})`;
    const set = h.v === 'tp' ? 'positive' : h.v === 'fn' ? 'positive (sampled negative)' : 'negative sample';
    const matched = d.rc26_rule_classes ? `regex: ${d.rc26_rule_classes.replace(/;/g, ', ')}` : 'no regex (sampled negative)';
    return {
        id, date: d.header_date, time: d.intro_time, set,
        header: d.header_at_intro, title,
        cls: h.v === 'tn' ? '—' : (h.cls || '').replace(/;/g, ', '),
        matched, waited: waitedCell, delegation: del ? `«${del[0].trim()}»` : '', note: h.note + flagOf(id),
    };
});
rows.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
if (headerMismatch) {
    console.error(`header as first written differs from decisions.csv header_at_intro on ${headerMismatch} rows`);
    process.exit(1);
}

if (existsSync(SHEET) && !force) {
    const old = readFileSync(SHEET, 'utf8');
    const filled = old.split('\n').filter((l) => /^\| \d+ \|/.test(l) && !/\|\s*\|\s*$/.test(l));
    if (filled.length) {
        console.error(`${SHEET} carries ${filled.length} verdicts: not overwritten (use --force)`);
        process.exit(1);
    }
}

const head = [
    '# RC-26 review sheet: the rows that should have waited for Alfonso',
    '',
    'To fill it: in the last column of each row write exactly one of `mine` (an RC-26 item that was yours to decide), `delegated` (an RC-26 item you had delegated), `not-RC-26` (outside the RC-26 list); leave it empty to skip a row.',
    'Judge the decision against the RC-26 list (`docs/decisions.md`, RC-26), not the agent: the `class`, `matched by` and `agent note` columns are the 1630 lane\'s reading, given as context only.',
    'Then run `node --experimental-strip-types docs/research/cain-2027/scripts/rc26_apply_review.ts` from the repository root: it rewrites `data/rc26_reviewed.csv` and prints how many rows are reviewed.',
    '',
    `Prepared by P-2026-10-11-1725 from the 1630 dataset (\`data/decisions.csv\`, \`scripts/rc26-hand-check.json\`): ${rows.filter((r) => r.set !== 'negative sample').length} positives`,
    `(68 rule candidates the agent confirmed, 3 sampled negatives it found positive) and ${rows.filter((r) => r.set !== 'positive').length} sampled negatives (the 3 counted in both), ${rows.length} rows in all, ordered by header date.`,
    'The 40 rule candidates the agent rejected are not in the sheet. «Waited» is the status at introduction; the delegation column quotes the row when it names one; a `[1725: …]` flag marks a crossing whose marker understates what the history records.',
    '',
    '| # | id | date | set | header as written | what it decides (the row\'s own title) | class (agent) | matched by | waited | delegation cited | agent note | verdict |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|',
];
const body = rows.map((r, i) =>
    `| ${i + 1} | ${cell(r.id)} | ${r.date} | ${r.set} | ${cell(r.header)} | ${cell(r.title)} | ${cell(r.cls)} | ${cell(r.matched)} | ${cell(r.waited)} | ${cell(r.delegation)} | ${cell(r.note)} |  |`,
);
mkdirSync(join(RESEARCH, 'review'), { recursive: true });
writeFileSync(SHEET, [...head, ...body].join('\n') + '\n');
console.log(`wrote ${SHEET}: ${rows.length} rows (${rows.filter((r) => r.set.startsWith('positive')).length} positives, ${rows.filter((r) => r.set !== 'positive').length} sampled negatives)`);
