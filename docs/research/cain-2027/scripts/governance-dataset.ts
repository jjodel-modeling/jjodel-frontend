/**
 * governance-dataset.ts — the governance-drift dataset of the CAIN 2027 short paper (P-2026-10-11-1630).
 *
 * Research material, not harness code: no gate, hook or npm script runs it. It only reads: the git
 * history of the repository at a pinned ref, docs/decisions.md through the header parser of
 * frontend/scripts/gates/docs-digest.ts (imported, never copied), the prompts under docs/prompts/,
 * and the lane folders of ~/.jjodel-lanes/. It writes CSVs under docs/research/cain-2027/data/ and
 * a candidates file for the RC-26 hand check under /tmp.
 *
 * Run from the repository root (Node 22+, type stripping):
 *   node --experimental-strip-types docs/research/cain-2027/scripts/governance-dataset.ts \
 *        [--ref <sha>] [--lanes <dir>] [--out <dir>] [--until YYYY-MM-DD]
 *
 * Defaults: --ref 154311f55 (the trunk tip the dataset was cut from), --lanes ~/.jjodel-lanes,
 * --out docs/research/cain-2027/data, --until 2026-10-11. The lane folders are not versioned: a
 * later run reads more lanes, so autonomy_weekly.csv is reproducible only on a copy of that folder.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HeaderParseError, parseRows } from '../../../../frontend/scripts/gates/docs-digest.ts';

// ── arguments ────────────────────────────────────────────────────────────────

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..');
const argv = process.argv.slice(2);
const opt = (name: string, def: string): string => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const REF = opt('--ref', '154311f55');
const LANES = opt('--lanes', join(homedir(), '.jjodel-lanes'));
const OUT = resolve(REPO, opt('--out', 'docs/research/cain-2027/data'));
const UNTIL = opt('--until', '2026-10-11');
const REGISTER = 'docs/decisions.md';

// Dates that frame the series (docs/decisions.md rows, read 2026-10-11).
const GRAMMAR_FROM = '2026-09-26'; // RC-25..RC-28 ratified
const RC26_FROM = '2026-09-26';
const RC18_FROM = '2026-09-25';
const SERIES_FROM = '2026-09-01'; // commit-message series start, for a before/after view

// ── helpers ──────────────────────────────────────────────────────────────────

function git(args: string[]): string {
    const r = spawnSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 30 });
    if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.stderr}`);
    return r.stdout;
}

/** Contents of many `<rev>:<path>` specs in one `git cat-file --batch`; null when missing. */
function catBlobs(specs: string[]): (string | null)[] {
    if (specs.length === 0) return [];
    const r = spawnSync('git', ['cat-file', '--batch'], { cwd: REPO, input: specs.join('\n') + '\n', maxBuffer: 1 << 30 });
    const buf = r.stdout as unknown as Buffer;
    const out: (string | null)[] = [];
    let pos = 0;
    for (let i = 0; i < specs.length; i++) {
        const nl = buf.indexOf(10, pos);
        const head = buf.subarray(pos, nl).toString('utf8');
        pos = nl + 1;
        if (/ (missing|ambiguous)$/.test(head)) {
            out.push(null);
            continue;
        }
        const size = Number(head.split(' ')[2]);
        out.push(buf.subarray(pos, pos + size).toString('utf8'));
        pos += size + 1;
    }
    return out;
}

const pad = (n: number): string => String(n).padStart(2, '0');
/** Local calendar day of an epoch in seconds. */
function dayOf(sec: number): string {
    const d = new Date(sec * 1000);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function isoOf(sec: number): string {
    const d = new Date(sec * 1000);
    return `${dayOf(sec)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function addDays(day: string, n: number): string {
    const d = new Date(`${day}T12:00:00`);
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function daysBetween(a: string, b: string): number {
    return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000);
}
function mondayOf(day: string): string {
    const d = new Date(`${day}T12:00:00`);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function dayRange(from: string, to: string): string[] {
    const out: string[] = [];
    for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
    return out;
}
function csvCell(v: unknown): string {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(3)) : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function writeCsv(name: string, header: string[], rows: unknown[][]): void {
    mkdirSync(OUT, { recursive: true });
    const text = [header.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n') + '\n';
    writeFileSync(join(OUT, name), text);
    console.log(`wrote ${name}: ${rows.length} rows`);
}
const PID = /P-\d{4}-\d{2}-\d{2}-\d{4}/;
const CID = /C-\d{4}-\d{2}-\d{2}-\d{4}/;

// ── commits ──────────────────────────────────────────────────────────────────

interface Commit {
    sha: string;
    ct: number;
    at: number;
    author: string;
    subject: string;
    body: string;
    parents: string[];
}
function commitsOf(args: string[]): Commit[] {
    const raw = git(['log', '--format=%H%x1f%ct%x1f%at%x1f%an%x1f%P%x1f%s%x1f%b%x1e', ...args]);
    return raw
        .split('\x1e')
        .map((s) => s.replace(/^\n/, ''))
        .filter((s) => s.trim() !== '')
        .map((s) => {
            const [sha, ct, at, author, parents, subject, body] = s.split('\x1f');
            return { sha, ct: +ct, at: +at, author, subject, body: body ?? '', parents: parents.split(' ').filter(Boolean) };
        });
}
const lanePidOfCommit = (c: Commit): string => {
    const m = PID.exec(c.subject) ?? /^Prompt-ID:\s*(P-\d{4}-\d{2}-\d{2}-\d{4})/m.exec(c.body);
    return m ? (m[1] ?? m[0]) : '';
};

// ── prompts: the Chat: line of a Prompt-ID ──────────────────────────────────

const promptFiles = git(['ls-tree', '--name-only', REF, 'docs/prompts/']).split('\n').filter(Boolean);
const promptByPid = new Map<string, string>();
for (const f of promptFiles) {
    const m = /claude_(\d{4}-\d{2}-\d{2})_(\d{4})_/.exec(f);
    if (m && !/_prompt_merge_/.test(f)) promptByPid.set(`P-${m[1]}-${m[2]}`, f);
}
const promptText = new Map<string, string>();
{
    const files = [...promptByPid.values()];
    const blobs = catBlobs(files.map((f) => `${REF}:${f}`));
    files.forEach((f, i) => promptText.set(f, blobs[i] ?? ''));
}
function chatOfPid(pid: string): string {
    const f = promptByPid.get(pid);
    if (!f) return '';
    const m = /^Chat:\s*(C-\d{4}-\d{2}-\d{2}-\d{4})/m.exec(promptText.get(f) ?? '');
    return m ? m[1] : '';
}

// ── decision rows, lenient: every dated bold id at column 0 ─────────────────

/** A decision id: RC-n, R-SERIES-n, R-A, D-UI-n, D3 … (the bold may carry a qualifier after it). */
const ID_TOKEN = /^((?:RC|R|D)(?:-[A-Za-z0-9/.]+)+|D\d+)$/;
const LENIENT = /^(- )?\*\*([^*]{1,60})\*\* \((\d{4}-\d{2}-\d{2})/;

interface LRow {
    key: string; // the whole bold text, unique in the register
    token: string; // its first token, the id proper
    dash: boolean;
    date: string;
    line: number;
    headerLine: string;
    paren: string; // balanced header parenthesis, across lines
    block: string; // header plus continuation lines
    title: string;
    section: string;
    sectionIntro: string;
}

function lenientRows(text: string): LRow[] {
    const lines = text.split('\n');
    const out: LRow[] = [];
    let section = '';
    let sectionIntro = '';
    let introOpen = false;
    for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        const h = /^#{2,3} (.*)$/.exec(l);
        if (h) {
            section = h[1].trim();
            sectionIntro = '';
            introOpen = true;
            continue;
        }
        const m = LENIENT.exec(l);
        const token = m ? m[2].split(/[ ,]/)[0] : '';
        if (!m || !ID_TOKEN.test(token)) {
            if (introOpen && l.trim() !== '' && sectionIntro.length < 600) sectionIntro += ' ' + l.trim();
            continue;
        }
        introOpen = false;
        const blockLines = [l];
        for (let j = i + 1; j < lines.length; j++) {
            const n = lines[j];
            if (n.trim() === '' || n.startsWith('#') || n.startsWith('- ') || LENIENT.test(n)) break;
            blockLines.push(n.trim());
        }
        const block = blockLines.join(' ');
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
        const paren = block.slice(open + 2, end);
        const after = block.slice(end + 1).replace(/^[:.]|^ —/, '').trim();
        const bold = /^\*\*(.+?)\*\*/.exec(after);
        out.push({
            key: m[2].trim(),
            token,
            dash: !!m[1],
            date: m[3],
            line: i + 1,
            headerLine: l,
            paren,
            block,
            title: (bold ? bold[1] : after.split(/(?<=[.!?])\s/)[0]).slice(0, 140),
            section,
            sectionIntro: sectionIntro.trim().slice(0, 600),
        });
    }
    return out;
}

/** Status of a row as its header parenthesis (and, for a bare date, its section) states it. */
function statusOf(r: LRow): string {
    const p = r.paren;
    if (/provisional|provvisori/i.test(p)) return /awaiting Alfonso/i.test(p) ? 'provisional-awaiting' : 'provisional';
    if (/ratified by digest/i.test(p)) return 'ratified-digest';
    if (/ratified as recommended/i.test(p)) return 'ratified-as-recommended';
    if (/(ratified|ratificat\w*|decided|requested|approved|chosen)( in principle)? (by|da) Alfonso|principle ratified by Alfonso|Alfonso'?s (decision|word|GO)/i.test(p)) return 'ratified-alfonso';
    if (/(decided|adopted|ratified) by (the )?chat|delegation|delega/i.test(p)) return 'chat-decided';
    const rest = p.replace(/^\d{4}-\d{2}-\d{2}/, '').replace(/,?\s*(evidence|verified|reversible):\s*\S+/g, '').replace(/[,;\s]+/g, ' ').trim();
    if (rest === '' || rest === 'unattended') {
        const ctx = `${r.section} ${r.sectionIntro}`;
        if (/ratified by Alfonso|ratificat\w* (da|by) Alfonso|«procedi»|«vai»|«si ratifichiamo|ratifiche/i.test(ctx) && !/adopted by the chat|under RC-25|provisional/i.test(ctx)) return 'ratified-section';
        if (/adopted by the chat|under RC-25|decided by (the )?chat|provisional/i.test(ctx)) return 'chat-section';
        return 'unmarked';
    }
    return 'other';
}
const keyed = (p: string, k: string): string => {
    const m = new RegExp(`${k}:\\s*([a-z]+)`).exec(p);
    return m ? m[1] : '';
};
const ratDate = (p: string): string => {
    const m = /(?:ratified|ratificat\w*)(?: in principle)? (?:by|da) (?:Alfonso|digest)[^0-9]{0,12}(\d{4}-\d{2}-\d{2})/i.exec(p);
    return m ? m[1] : '';
};

// ── 1. the register over time ────────────────────────────────────────────────

console.log(`ref ${REF} = ${git(['rev-parse', REF]).trim()}`);
const regCommitsAll = commitsOf(['--full-history', REF, '--', REGISTER]).sort((a, b) => a.ct - b.ct);
const regCommitsFp = commitsOf(['--first-parent', REF, '--', REGISTER]).sort((a, b) => a.ct - b.ct);
const fpSet = new Set(regCommitsFp.map((c) => c.sha));
const regTexts = new Map<string, string>();
{
    const shas = [...new Set([...regCommitsAll, ...regCommitsFp].map((c) => c.sha))];
    const blobs = catBlobs(shas.map((s) => `${s}:${REGISTER}`));
    shas.forEach((s, i) => regTexts.set(s, blobs[i] ?? ''));
}
const rowsAt = new Map<string, Map<string, LRow>>();
const rowsOf = (sha: string): Map<string, LRow> => {
    let m = rowsAt.get(sha);
    if (!m) {
        m = new Map(lenientRows(regTexts.get(sha) ?? '').map((r) => [r.key, r]));
        rowsAt.set(sha, m);
    }
    return m;
};
const headText = git(['show', `${REF}:${REGISTER}`]);
const current = lenientRows(headText);
console.log(`register at ${REF}: ${current.length} lenient rows; ${regCommitsAll.length} commits touch it (${regCommitsFp.length} on the first-parent trunk)`);

// The parser, imported: one header line at a time. 'parsed' | 'invisible-dash' | 'invisible-id' | 'fail:<reason>'.
const verdictCache = new Map<string, string>();
function parserVerdict(headerLine: string): string {
    let v = verdictCache.get(headerLine);
    if (v !== undefined) return v;
    const one = (t: string): string => {
        try {
            return parseRows(t).length === 1 ? 'parsed' : 'invisible';
        } catch (e) {
            if (e instanceof HeaderParseError) return `fail:${e.failures[0].reason}`;
            throw e;
        }
    };
    v = one(headerLine);
    if (v === 'invisible') v = headerLine.startsWith('- ') ? 'invisible-id' : one(`- ${headerLine}`) === 'invisible' ? 'invisible-id' : 'invisible-dash';
    verdictCache.set(headerLine, v);
    return v;
}
function failKind(v: string): string {
    if (!v.startsWith('fail:')) return v;
    const r = v.slice(5);
    if (r.startsWith('no parenthesis')) return 'no-paren';
    if (r.startsWith('the parenthesis does not close')) return 'multiline-header';
    if (r.startsWith('the separator')) return 'separator';
    if (r.startsWith('the first field')) return 'not-a-date';
    if (r.startsWith('an empty field')) return 'empty-field';
    if (r.startsWith('unknown field in a provisional')) return 'free-text-in-provisional';
    if (r.startsWith('evidence, verified and reversible')) return 'keys-partial';
    if (/ is outside /.test(r)) return 'outside-vocabulary';
    return 'other';
}

interface Hist {
    first: Commit;
    firstRow: LRow;
    trunk: Commit | null;
    trunkRow: LRow | null;
    changes: { c: Commit; status: string }[]; // header-status changes on the trunk
    textChanges: Commit[]; // trunk commits where the row's block text changed
    ratified: { c: Commit; marker: string } | null; // first trunk commit with a ratified status after a non-ratified one
    firstFail: { c: Commit; kind: string } | null;
    fixed: Commit | null;
}
const hist = new Map<string, Hist>();
for (const c of regCommitsAll) {
    for (const [key, r] of rowsOf(c.sha)) {
        if (!hist.has(key)) hist.set(key, { first: c, firstRow: r, trunk: null, trunkRow: null, changes: [], textChanges: [], ratified: null, firstFail: null, fixed: null });
        const h = hist.get(key)!;
        const v = failKind(parserVerdict(r.headerLine));
        if (v !== 'parsed' && !h.firstFail) h.firstFail = { c, kind: v };
    }
}
const RATIFIED = new Set(['ratified-alfonso', 'ratified-digest', 'ratified-as-recommended', 'ratified-section']);
for (const c of regCommitsFp) {
    for (const [key, r] of rowsOf(c.sha)) {
        const h = hist.get(key);
        if (!h) continue;
        const st = statusOf(r);
        if (!h.trunk) {
            h.trunk = c;
            h.trunkRow = r;
            h.changes.push({ c, status: st });
            continue;
        }
        const last = h.changes[h.changes.length - 1];
        if (last.status !== st) {
            h.changes.push({ c, status: st });
            if (RATIFIED.has(st) && !RATIFIED.has(last.status) && !h.ratified) h.ratified = { c, marker: ratDate(r.paren) };
        }
        if (h.firstFail && !h.fixed && h.firstFail.c.ct <= c.ct && failKind(parserVerdict(r.headerLine)) === 'parsed') h.fixed = c;
    }
}
// Block-text amendments on the trunk.
for (let i = 1; i < regCommitsFp.length; i++) {
    const a = rowsOf(regCommitsFp[i - 1].sha);
    const b = rowsOf(regCommitsFp[i].sha);
    for (const [key, r] of b) {
        const o = a.get(key);
        if (o && o.block !== r.block) hist.get(key)?.textChanges.push(regCommitsFp[i]);
    }
}
const everKeys = [...hist.keys()];
const currentKeys = new Set(current.map((r) => r.key));
const goneKeys = everKeys.filter((k) => !currentKeys.has(k));

// ── 2. RC-26 classes ─────────────────────────────────────────────────────────

const RC26_RULES: { cls: string; re: RegExp }[] = [
    { cls: 'critical-zone', re: /useJjomSync|portDistribution|canvasToJjom|syncState\.ts|useM1ReferenceEdges|VersionFixer|defaultViewTemplate|\bDV\.tsx|viewpoint\/ir\/|viewpoint\/authoring\/|editor-v2\/problems|critical[- ]zone|zona critica|Layer Impact|\bLIR\b|\bcore\b/i },
    { cls: 'exported-interface', re: /\bexport(?:ed|ata)?\b[^.;]{0,60}\b(interface|type|field|prop|signature|API|interfaccia)\b|\bbreak(?:s|ing)? (?:a |the |its )?consumers?\b/i },
    { cls: 'deletion', re: /\b(delet\w*|cancell\w*|elimin\w*|rimuov\w*|rimoss\w*|remov\w*)\b[^.;]{0,50}\b(files?|data|dati|persist\w*|salvat\w*|saved)\b/i },
    { cls: 'demo', re: /\bdemo\b|\bMODELS\b/ },
    { cls: 'model-effort-cost', re: /claude-(opus|sonnet|haiku)|\bOpus\b|\bSonnet\b|\beffort(Level)?\b|\btier\b|\bcosts?\b|\bcosto\b|\bbudget\b|rate_limit|--model\b/i },
    { cls: 'push', re: /\bgit push\b|\bpushe[sd]?\b|\bpush\b(?! (?:of )?(the )?(button|event|press))/i },
];
const AMEND = /\b(amends?|amending|amended|emenda|emendat\w*|supersed\w*|sostituisce|replaces?|reinterpret\w*|withdraws?|revok\w*|overrides?)\b[^.;]{0,60}?\b((?:RC|R)-[A-Z0-9]+(?:-[A-Z0-9]+)*|RC-\d+)\b/gi;

/** Status of row `key` on the trunk just before commit time `ct` (or at first appearance). */
function statusBefore(key: string, ct: number): string {
    const h = hist.get(key);
    if (!h) return 'absent';
    let st = 'absent';
    for (const ch of h.changes) if (ch.c.ct < ct) st = ch.status;
    if (st === 'absent' && h.first.ct < ct) st = statusOf(h.firstRow);
    return st;
}

interface Rc26 {
    classes: string[];
    snippets: string[];
    amendTargets: string[];
}
function rc26Of(key: string): Rc26 {
    const h = hist.get(key)!;
    const cur = current.find((r) => r.key === key);
    const text = `${h.firstRow.block} ${cur && cur.block !== h.firstRow.block ? cur.block : ''}`;
    const classes: string[] = [];
    const snippets: string[] = [];
    for (const { cls, re } of RC26_RULES) {
        const m = re.exec(text);
        if (m) {
            classes.push(cls);
            snippets.push(`${cls}: …${text.slice(Math.max(0, m.index - 50), m.index + 70)}…`);
        }
    }
    const targets: string[] = [];
    for (const m of text.matchAll(AMEND)) {
        const t = m[2];
        if (t === key || t === h.firstRow.token) continue;
        const st = statusBefore(t, h.first.ct);
        if (RATIFIED.has(st)) targets.push(`${t}(${st})`);
    }
    if (targets.length) {
        classes.push('amends-ratified');
        snippets.push(`amends-ratified: ${targets.join(' ')}`);
    }
    return { classes, snippets, amendTargets: targets };
}

// Hand check, read 2026-10-11 by the lane, one verdict per candidate: true positive (tp) or false positive (fp)
// for every rule-positive row dated >= RC26_FROM, and tn/fn for the 30 sampled negatives.
// Filled after the first run printed the candidates; keyed by row key.
const HAND: Record<string, { v: 'tp' | 'fp' | 'tn' | 'fn'; cls?: string; note: string }> = JSON.parse(
    existsSync(join(HERE, 'rc26-hand-check.json')) ? readFileSync(join(HERE, 'rc26-hand-check.json'), 'utf8') : '{}',
);

/** A deterministic sample: rank by a string hash of the key. */
function hash(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
    return h;
}

const WAITED = new Set(['ratified-alfonso', 'ratified-section', 'provisional-awaiting']);
const decisionRows: unknown[][] = [];
const candidates: string[] = [];
const negatives: { key: string; text: string }[] = [];
for (const r of current) {
    const h = hist.get(r.key)!;
    const intro = h.firstRow;
    const st0 = statusOf(intro);
    const introPid = lanePidOfCommit(h.first);
    const chatRow = CID.exec(intro.block)?.[0] ?? '';
    const chatSection = CID.exec(`${intro.section} ${intro.sectionIntro}`)?.[0] ?? '';
    const chatPrompt = introPid ? chatOfPid(introPid) : '';
    const chat = chatRow || chatSection || chatPrompt;
    const chatSrc = chatRow ? 'row' : chatSection ? 'section' : chatPrompt ? 'prompt' : '';
    const adopter = WAITED.has(st0) && st0 !== 'provisional-awaiting' ? 'alfonso' : /chat|provisional|as-recommended/.test(st0) ? 'chat' : st0 === 'unmarked' ? 'unknown' : 'unknown';
    const ratMarker = ratDate(r.paren);
    const rat = h.ratified;
    const ratDay = rat ? rat.marker || dayOf(rat.c.ct) : RATIFIED.has(st0) ? ratDate(intro.paren) || '' : '';
    const latency = ratDay ? daysBetween(intro.date, ratDay) : '';
    const rc = rc26Of(r.key);
    const inWindow = intro.date >= RC26_FROM;
    const waited = WAITED.has(st0);
    const hand = HAND[r.key];
    const handPositive = hand ? hand.v === 'tp' || hand.v === 'fn' : rc.classes.length > 0;
    const crossing = inWindow && handPositive && !waited;
    if (inWindow && rc.classes.length > 0) {
        candidates.push(`### ${r.key} (${intro.date}, status at intro: ${st0}) line ${r.line}\n${rc.snippets.map((s) => `- ${s}`).join('\n')}\nINTRO: ${intro.block.slice(0, 900)}\n`);
    }
    if (inWindow && rc.classes.length === 0) negatives.push({ key: r.key, text: intro.block.slice(0, 700) });
    decisionRows.push([
        r.key,
        r.token,
        r.token.replace(/-?\d+(?:-bis)?$/, '').replace(/\/.*$/, '') || r.token,
        r.line,
        r.section,
        r.dash ? 'yes' : 'no',
        r.date,
        h.first.sha.slice(0, 9),
        isoOf(h.first.ct),
        introPid,
        h.trunk ? h.trunk.sha.slice(0, 9) : '',
        h.trunk ? isoOf(h.trunk.ct) : '',
        h.first.author,
        chat,
        chatSrc,
        adopter,
        st0,
        intro.paren.slice(0, 300),
        keyed(intro.paren, 'evidence'),
        keyed(intro.paren, 'verified'),
        keyed(intro.paren, 'reversible'),
        statusOf(r),
        r.paren.slice(0, 300),
        rat ? rat.c.sha.slice(0, 9) : '',
        rat ? isoOf(rat.c.ct) : '',
        ratMarker || (rat ? rat.marker : ''),
        latency,
        h.changes.map((x) => `${dayOf(x.c.ct)}:${x.status}`).join(' > '),
        h.textChanges.length,
        h.textChanges.map((c) => c.sha.slice(0, 9)).join(' '),
        intro.title === r.title ? 'same' : 'changed',
        failKind(parserVerdict(r.headerLine)),
        h.firstFail ? h.firstFail.kind : '',
        rc.classes.join(';'),
        hand ? hand.v : '',
        hand ? hand.note : '',
        inWindow ? 'yes' : 'no',
        waited ? 'yes' : 'no',
        crossing ? 'yes' : 'no',
    ]);
}
writeCsv(
    'decisions.csv',
    [
        'id', 'id_token', 'series', 'line', 'section', 'leading_dash', 'header_date',
        'intro_commit', 'intro_time', 'intro_prompt_id', 'trunk_commit', 'trunk_time', 'intro_author',
        'adopting_chat', 'chat_source', 'adopter_by_marker', 'status_at_intro', 'header_at_intro',
        'evidence_at_intro', 'verified_at_intro', 'reversible_at_intro', 'status_now', 'header_now',
        'ratification_commit', 'ratification_time', 'ratification_marker_date', 'latency_days',
        'status_path_on_trunk', 'text_amendments', 'amendment_commits', 'title_vs_intro',
        'parser_now', 'parser_first_failure', 'rc26_rule_classes', 'rc26_hand', 'rc26_hand_note',
        'rc26_window', 'waited', 'rc26_crossing',
    ],
    decisionRows,
);
// Candidates and a deterministic negative sample for the hand check.
negatives.sort((a, b) => hash(a.key) - hash(b.key));
const sample = negatives.slice(0, 30);
writeFileSync('/tmp/p1630/rc26_candidates.md', candidates.join('\n'));
writeFileSync('/tmp/p1630/rc26_negatives.md', sample.map((n) => `### ${n.key}\n${n.text}\n`).join('\n'));
console.log(`rc26: ${candidates.length} rule-positive rows in the window, ${negatives.length} negatives, sample ${sample.length}`);
console.log(`rows ever seen ${everKeys.length}, gone from the register ${goneKeys.length}: ${goneKeys.slice(0, 40).join(' ')}`);

// ── 3. grammar conformance, one trunk commit per day ─────────────────────────

const trunkFp = commitsOf(['--first-parent', REF]).sort((a, b) => a.ct - b.ct);
function trunkAt(day: string): Commit | null {
    let best: Commit | null = null;
    for (const c of trunkFp) if (dayOf(c.ct) <= day) best = c;
    return best;
}
const KINDS = ['multiline-header', 'free-text-in-provisional', 'keys-partial', 'outside-vocabulary', 'separator', 'not-a-date', 'no-paren', 'empty-field', 'other'];
const confRows: unknown[][] = [];
// One extra snapshot inside 2026-10-11: the trunk just before the ratification merge (P-2026-10-11-1559).
const EXTRA: [string, string, string][] = [['2026-10-11', 'c6804f3d3^1', 'trunk before the ratification merge P-2026-10-11-1559']];
const snapshots: [string, Commit | null, string][] = dayRange(GRAMMAR_FROM, UNTIL).map((d) => [d, trunkAt(d), 'last trunk commit of the day']);
for (const [d, rev, note] of EXTRA) {
    const sha = git(['rev-parse', rev]).trim();
    snapshots.push([d, trunkFp.find((c) => c.sha === sha) ?? null, note]);
}
for (const [day, c, note] of snapshots) {
    if (!c) continue;
    const text = git(['show', `${c.sha}:${REGISTER}`]);
    const lrows = lenientRows(text);
    let parsedTotal = 0;
    let failures: { line: number; reason: string }[] = [];
    try {
        parsedTotal = parseRows(text).length;
    } catch (e) {
        if (!(e instanceof HeaderParseError)) throw e;
        failures = e.failures.map((f) => ({ line: f.line, reason: f.reason }));
        const lines = text.split('\n');
        for (const f of failures) lines[f.line - 1] = '';
        parsedTotal = parseRows(lines.join('\n')).length;
    }
    const byKind = new Map<string, number>();
    for (const f of failures) {
        const k = failKind(`fail:${f.reason}`);
        byKind.set(k, (byKind.get(k) ?? 0) + 1);
    }
    let invDash = 0;
    let invId = 0;
    let prov = 0;
    let provInvisible = 0;
    let provStale = 0;
    const fresh = { n: 0, parsed: 0, failing: 0, invisible: 0 };
    for (const r of lrows) {
        const v = parserVerdict(r.headerLine);
        if (v === 'invisible-dash') invDash++;
        if (v === 'invisible-id') invId++;
        const p = /^provisional/.test(statusOf(r));
        if (p) prov++;
        if (p && v.startsWith('invisible')) provInvisible++;
        if (p && r.date <= addDays(day, -2)) provStale++;
        if (r.date >= GRAMMAR_FROM) {
            fresh.n++;
            if (v === 'parsed') fresh.parsed++;
            else if (v.startsWith('fail:')) fresh.failing++;
            else fresh.invisible++;
        }
    }
    confRows.push([
        day, c.sha.slice(0, 9), lrows.length, parsedTotal, failures.length,
        ...KINDS.map((k) => byKind.get(k) ?? 0),
        invDash, invId, invDash + invId, lrows.length - parsedTotal - failures.length - invDash - invId,
        prov, provInvisible, failures.length === 0 ? 0 : 2,
        fresh.n, fresh.parsed, fresh.failing, fresh.invisible, provStale, note,
    ]);
}
writeCsv(
    'conformance_daily.csv',
    ['date', 'trunk_commit', 'rows_lenient', 'rows_parsed', 'rows_failing', ...KINDS.map((k) => `fail_${k}`), 'invisible_no_dash', 'invisible_non_r_id', 'invisible_total', 'unaccounted', 'provisional_rows', 'provisional_invisible', 'docs_digest_exit', 'rows_since_grammar', 'since_grammar_parsed', 'since_grammar_failing', 'since_grammar_invisible', 'provisional_older_than_2d', 'snapshot'],
    confRows,
);
// Each failing or invisible header: when it first appeared, who introduced it, when it was fixed.
const failRows: unknown[][] = [];
for (const [key, h] of hist) {
    if (!h.firstFail) continue;
    const c = h.firstFail.c;
    const pid = lanePidOfCommit(c);
    const row = rowsOf(c.sha).get(key)!;
    const chat = CID.exec(row.block)?.[0] || CID.exec(`${row.section} ${row.sectionIntro}`)?.[0] || (pid ? chatOfPid(pid) : '');
    const now = current.find((r) => r.key === key);
    failRows.push([
        key, h.firstFail.kind, c.sha.slice(0, 9), isoOf(c.ct), fpSet.has(c.sha) ? 'trunk' : 'branch', pid, chat, c.author,
        h.first.sha === c.sha ? 'yes' : 'no', row.date,
        h.fixed ? h.fixed.sha.slice(0, 9) : '', h.fixed ? isoOf(h.fixed.ct) : '',
        now ? failKind(parserVerdict(now.headerLine)) : 'gone',
    ]);
}
failRows.sort((a, b) => String(a[3]).localeCompare(String(b[3])));
writeCsv('conformance_failures.csv', ['id', 'kind', 'first_commit', 'first_time', 'first_on', 'prompt_id', 'chat', 'author', 'at_row_intro', 'row_header_date', 'fixed_commit', 'fixed_time', 'state_now'], failRows);

// ── 4. RC-18: harness-only share of code lanes, 7-day sliding window ─────────

const allNonMerge = commitsOf(['--no-merges', `--since=${addDays(SERIES_FROM, -7)}`, REF]);
const filesOf = new Map<string, string[]>();
{
    const raw = git(['log', '--no-merges', `--since=${addDays(SERIES_FROM, -7)}`, '--format=>%H', '--name-only', REF]);
    let cur = '';
    for (const l of raw.split('\n')) {
        if (l.startsWith('>')) {
            cur = l.slice(1);
            filesOf.set(cur, []);
        } else if (l.trim() && cur) filesOf.get(cur)!.push(l.trim());
    }
}
const HARNESS = (f: string): boolean => f.startsWith('frontend/scripts/') || f.startsWith('.claude/') || f.startsWith('docs/');
const GOVERNANCE = (f: string): boolean => /(^|\/)(CLAUDE|AGENTS)\.md$/.test(f);
interface Lane {
    pid: string;
    day: string;
    commits: number;
    harness: boolean;
    harnessGov: boolean;
}
const lanes = new Map<string, Lane>();
const codeCommitsByDay = new Map<string, { code: number; noPid: number }>();
for (const c of allNonMerge) {
    const files = filesOf.get(c.sha) ?? [];
    const code = files.some((f) => !f.startsWith('docs/'));
    if (!code) continue;
    const day = dayOf(c.at);
    const e = codeCommitsByDay.get(day) ?? { code: 0, noPid: 0 };
    e.code++;
    const pid = lanePidOfCommit(c);
    if (!pid) {
        e.noPid++;
        codeCommitsByDay.set(day, e);
        continue;
    }
    codeCommitsByDay.set(day, e);
    const harness = files.every(HARNESS);
    const harnessGov = files.every((f) => HARNESS(f) || GOVERNANCE(f));
    const l = lanes.get(pid) ?? { pid, day: pid.slice(2, 12), commits: 0, harness: true, harnessGov: true };
    l.commits++;
    l.harness &&= harness;
    l.harnessGov &&= harnessGov;
    lanes.set(pid, l);
}
const rc18Rows: unknown[][] = [];
for (const day of dayRange(RC18_FROM, UNTIL)) {
    const from = addDays(day, -6);
    const win = [...lanes.values()].filter((l) => l.day >= from && l.day <= day);
    const h = win.filter((l) => l.harness).length;
    const hg = win.filter((l) => l.harnessGov).length;
    let code = 0;
    let noPid = 0;
    for (const d of dayRange(from, day)) {
        const e = codeCommitsByDay.get(d);
        if (e) {
            code += e.code;
            noPid += e.noPid;
        }
    }
    rc18Rows.push([day, from, win.length, h, win.length ? h / win.length : '', hg, win.length ? hg / win.length : '', win.length ? (h / win.length > 0.25 ? 'over' : 'within') : '', code, noPid, code ? noPid / code : '']);
}
writeCsv('rc18_daily.csv', ['date', 'window_from', 'code_lanes', 'harness_only_lanes', 'share', 'harness_or_governance_lanes', 'share_with_governance', 'rc18_budget_0_25', 'code_commits', 'code_commits_without_lane_id', 'share_without_lane_id'], rc18Rows);

// ── 5. decision autonomy by week (the method of P-2026-10-11-1150 §3) ───────

function results(buf: Buffer): { outcome: string; text: string }[] {
    const out: { outcome: string; text: string }[] = [];
    const key = Buffer.from('"type":"result"');
    let at = buf.indexOf(key);
    while (at !== -1) {
        const s0 = buf.lastIndexOf(10, at) + 1;
        let s1 = buf.indexOf(10, at);
        if (s1 === -1) s1 = buf.length;
        try {
            const e = JSON.parse(buf.subarray(s0, s1).toString('utf8'));
            const notTurn = (e.origin && e.origin.kind === 'task-notification') || (e.num_turns === 0 && !e.result);
            if (e.type === 'result' && !notTurn) {
                const r = String(e.result || '');
                const m = [...r.matchAll(/Outcome:\s*`?([a-z][a-z-]*)/gi)];
                out.push({ outcome: m.length ? m[m.length - 1][1].toLowerCase() : '', text: r });
            }
        } catch {
            /* a truncated line */
        }
        at = buf.indexOf(key, s1);
    }
    return out;
}
function answerClass(text: string): string {
    const t = text.replace(/^#?\s*\[P-[^\]]*\]\s*/, '').slice(0, 2500);
    const OVER = /\bwith one change\b|\bnot as (you )?recommend|\binstead of (your|the) recommend|\bagainst (the|your) recommend|\boverrid(e|es|den|ing) (the|your) recommend|\brecommendation (is )?(rejected|not adopted)\b|\bdo not adopt\b|\brather than (your|the) recommend|\bnot your recommend/i;
    const ALF = /\bAlfonso (decided|ratified|approved|granted|answered|chose|asked|says|wants|confirmed|vetoed|rejected)\b|\bdecision by Alfonso\b|\b(GO|answer|decision|ratification|reply) (from|of|by) Alfonso\b|\bAlfonso'?s (answer|decision|GO|reply|choice|go-ahead)\b/i;
    const ADOPT = /adopted as recommended|as recommended|ratified as recommended|Recommended(?: answer)? adopted|Recommendation adopted|your Recommended|as you recommend|(implement|on) your recommendation|your recommended answers|as your report recommends|exactly as you recommended|adopted (by|unattended)|adopt your Recommended/i;
    const GO = /^(Visual )?GO\b|^GO[.,:]|^Phase 2 GO|^ACK\b|^Small GO/i;
    if (OVER.test(t)) return 'overturned';
    if (ALF.test(t)) return 'alfonso';
    if (ADOPT.test(t)) return 'adopted';
    if (GO.test(t.split('\n').map((x) => x.trim()).find(Boolean) || '')) return 'bare-go';
    return 'other';
}
interface Week {
    lanes: number;
    asking: Set<string>;
    asks: number;
    qExit: number;
    recStop: number;
    aligned: number;
    answered: number;
    cls: Record<string, number>;
    notResumed: number;
}
const weeks = new Map<string, Week>();
const wk = (w: string): Week => {
    let e = weeks.get(w);
    if (!e) {
        e = { lanes: 0, asking: new Set(), asks: 0, qExit: 0, recStop: 0, aligned: 0, answered: 0, cls: { adopted: 0, alfonso: 0, overturned: 0, 'bare-go': 0, other: 0 }, notResumed: 0 };
        weeks.set(w, e);
    }
    return e;
};
const laneDirs = existsSync(LANES) ? readdirSync(LANES).filter((n) => /^P-\d{4}-\d{2}-\d{2}-\d{4}$/.test(n)).sort() : [];
let laneDirsUsed = 0;
for (const id of laneDirs) {
    if (id.slice(2, 12) > UNTIL) continue;
    const dir = join(LANES, id);
    if (existsSync(join(dir, 'direct.json'))) continue;
    let buf: Buffer;
    try {
        buf = readFileSync(join(dir, 'log.jsonl'));
    } catch {
        continue;
    }
    laneDirsUsed++;
    const w = wk(mondayOf(id.slice(2, 12)));
    w.lanes++;
    const runs = results(buf);
    const names = readdirSync(dir);
    const inputs = new Map<number, string>();
    for (const n of names) {
        const m = /^input-(\d+)\.md$/.exec(n);
        if (m) inputs.set(+m[1], readFileSync(join(dir, n), 'utf8'));
    }
    const aligned = id >= 'P-2026-09-28-1545';
    runs.forEach((run, i) => {
        const rec = (run.text.match(/^\s*(?:[-*]\s*)?(?:\*\*)?Recommended(?:\*\*)?:/gm) || []).length;
        if (!(run.outcome === 'question' || rec > 0)) return;
        w.asks++;
        w.asking.add(id);
        if (run.outcome === 'question') w.qExit++;
        else w.recStop++;
        const ans = aligned ? inputs.get(i + 2) : undefined;
        if (aligned) w.aligned++;
        if (ans === undefined) {
            w.notResumed++;
            return;
        }
        w.answered++;
        w.cls[answerClass(ans)]++;
    });
}
const autoRows = [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([w, e]) => [w, e.lanes, e.asking.size, e.asks, e.lanes ? e.asks / e.lanes : '', e.qExit, e.recStop, e.aligned, e.answered, e.cls.adopted, e.cls.alfonso, e.cls.overturned, e.cls['bare-go'], e.cls.other, e.notResumed, e.answered ? e.cls.alfonso / e.answered : '']);
writeCsv('autonomy_weekly.csv', ['week', 'session_lanes', 'asking_lanes', 'asks', 'asks_per_lane', 'question_exits', 'recommended_stops', 'asks_pairable', 'answered_by_resume', 'adopted_by_chat', 'alfonso', 'overturned', 'bare_go', 'other', 'not_resumed', 'alfonso_share_of_answered'], autoRows);
console.log(`autonomy: ${laneDirs.length} lane folders, ${laneDirsUsed} session lanes with a log`);

// ── 6/7. compliance families: prompt header lines and commit messages ───────

// Prompts as first committed (diff-filter=A), non-merge.
const added = git(['log', '--diff-filter=A', '--format=>%H %ct', '--name-only', REF, '--', 'docs/prompts/']);
const promptAdds: { file: string; sha: string; ct: number }[] = [];
{
    let sha = '';
    let ct = 0;
    for (const l of added.split('\n')) {
        if (l.startsWith('>')) {
            [sha, ct] = [l.slice(1).split(' ')[0], +l.split(' ')[1]];
        } else if (l.trim().endsWith('.md') && /claude_\d{4}-\d{2}-\d{2}_\d{4}_/.test(l)) promptAdds.push({ file: l.trim(), sha, ct });
    }
}
const addBlobs = catBlobs(promptAdds.map((p) => `${p.sha}:${p.file}`));
const refBlobs = catBlobs(promptAdds.map((p) => `${REF}:${p.file}`));
interface PromptRow {
    pid: string;
    day: string;
    merge: boolean;
    has: Record<string, boolean>;
    hasAtRef: Record<string, boolean>; // the same lines in the file as it is at --ref: a later repair
}
const headerLines = (header: string): Record<string, boolean> => ({
    depends: /^Depends:[ \t]*\S/m.test(header),
    request: /^Request:[ \t]*\S/m.test(header),
    front: /^Front:[ \t]*\S/m.test(header),
    chat: /^Chat:[ \t]*C-\d{4}-\d{2}-\d{2}-\d{4}/m.test(header),
    lane: /^Lane:[ \t]*(fast|full)/m.test(header),
    status: /^Status:/m.test(header),
    promptId: /^Prompt-ID:[ \t]*P-/m.test(header),
});
const prompts: PromptRow[] = promptAdds.map((p, i) => {
    const text = addBlobs[i] ?? '';
    const header = text.split(/\n## /)[0];
    const m = /claude_(\d{4}-\d{2}-\d{2})_(\d{4})_/.exec(p.file)!;
    const merge = /_prompt_merge_/.test(p.file) || /^Lane:\s*full \(merge\b/m.test(header);
    return {
        pid: `P-${m[1]}-${m[2]}`,
        day: m[1],
        merge,
        has: headerLines(header),
        hasAtRef: headerLines((refBlobs[i] ?? '').split(/\n## /)[0]),
    };
});

interface RuleSeries {
    rule: string;
    enforcement: string; // the strongest mechanism once it exists (rules.csv has the evidence)
    from: string; // first day the rule binds
    checkFrom: string; // first day its check runs, '' for a text-only rule
    repaired?: () => number; // violations no longer present at --ref (prompt header lines only)
    unit: string;
    test: (day: string) => { n: number; v: number };
}
const promptRule = (rule: string, line: keyof PromptRow['has'], fromPid: string, enforcement: string, checkFrom: string): RuleSeries => ({
    rule,
    enforcement,
    from: fromPid.slice(2, 12),
    checkFrom,
    unit: 'non-merge prompt committed',
    test: (day) => {
        const ps = prompts.filter((p) => !p.merge && p.day === day && p.pid >= fromPid);
        return { n: ps.length, v: ps.filter((p) => !p.has[line]).length };
    },
    repaired: () => prompts.filter((p) => !p.merge && p.pid >= fromPid && p.day <= UNTIL && !p.has[line] && p.hasAtRef[line]).length,
});

interface MsgFacts {
    day: string;
    kind: string;
    origin: string; // chat | lane-run-script | lane-or-local (heuristic, see ORIGIN)
    hooked: boolean; // the commit's tree carries bash-guard (descends from HOOK_COMMIT)
    model: boolean;
    long: boolean;
    mixed: boolean;
    pid: boolean;
}
// Who made a commit. The lane hooks (bash-guard) see only commits a Claude Code session makes through its
// Bash tool in a tree that carries the hooks. lane-run's own commits use two subject templates; the
// project chat's commits carry a Claude-Session trailer or add prompts, checkpoints and Status flips.
const LANE_RUN_TEMPLATE = /^docs: add prompt P-\S+, merge |^docs: Status flip and log entry for the \S+ merge /;
const CHAT_SUBJECT = /^docs\(prompts\)|^docs: add prompt|^docs\(sessioni\)/;
function originOf(c: Commit): string {
    if (LANE_RUN_TEMPLATE.test(c.subject)) return 'lane-run-script';
    if (/^Claude-Session:/m.test(c.body) || CHAT_SUBJECT.test(c.subject)) return 'chat';
    return 'lane-or-local';
}
// A commit is in the hook's reach when its tree carries bash-guard: it descends from the commit that added it.
const HOOK_COMMIT = '1172230c9';
const hookFull = git(['rev-parse', HOOK_COMMIT]).trim();
const hooked = new Set([hookFull, ...git(['rev-list', '--ancestry-path', `${HOOK_COMMIT}..${REF}`]).split('\n').filter(Boolean)]);
const msgFacts: MsgFacts[] = allNonMerge.map((c) => {
    const files = filesOf.get(c.sha) ?? [];
    const docs = files.filter((f) => f.startsWith('docs/'));
    // bash-guard.mjs isDocPath: docs/, or a file named CLAUDE.md or AGENTS.md anywhere.
    const isDoc = (f: string): boolean => f.startsWith('docs/') || /(^|\/)(CLAUDE|AGENTS)\.md$/.test(f);
    const nDoc = files.filter(isDoc).length;
    const kind = files.length > 0 && files.every((f) => f.startsWith('docs/prompts/'))
        ? 'prompt'
        : /^docs: Status flip|Status flip and log entry/i.test(c.subject)
          ? 'closure'
          : docs.length === files.length
            ? 'docs'
            : 'code';
    const subject = c.subject.replace(/ \(P-\d{4}-\d{2}-\d{2}-\d{4}\)$/, '');
    return {
        day: dayOf(c.ct),
        kind,
        origin: originOf(c),
        hooked: hooked.has(c.sha),
        model: /^Model: \S/m.test(c.body),
        long: [...subject].length > 72,
        mixed: nDoc > 0 && nDoc < files.length,
        pid: !!lanePidOfCommit(c),
    };
});
const msgRule = (rule: string, from: string, enforcement: string, checkFrom: string, pick: (m: MsgFacts) => boolean, bad: (m: MsgFacts) => boolean, unit: string): RuleSeries => ({
    rule,
    enforcement,
    from,
    checkFrom,
    unit,
    test: (day) => {
        const ms = msgFacts.filter((m) => m.day === day && pick(m));
        return { n: ms.length, v: ms.filter(bad).length };
    },
});

// Decision-row families, from the register history.
const rowRule = (rule: string, from: string, enforcement: string, checkFrom: string, test: (day: string) => { n: number; v: number }, unit: string): RuleSeries => ({ rule, enforcement, from, checkFrom, unit, test });
const confByDay = new Map(confRows.filter((r) => r[26] === 'last trunk commit of the day').map((r) => [String(r[0]), r]));
// conformance_daily.csv order: 21 rows_since_grammar, 23 since_grammar_failing, 24 since_grammar_invisible, 25 provisional_older_than_2d.
const provisionalOutstanding = (day: string): { n: number; v: number } => {
    const r = confByDay.get(day);
    return r ? { n: Number(r[21]), v: Number(r[25]) } : { n: 0, v: 0 };
};
const headersFailing = (day: string): { n: number; v: number } => {
    const r = confByDay.get(day);
    return r ? { n: Number(r[21]), v: Number(r[23]) + Number(r[24]) } : { n: 0, v: 0 };
};
// decisions.csv order: 0 id, 6 header date, 33 rule classes, 34 hand verdict, 36 window, 38 crossing.
const handClasses = (r: unknown[]): string[] => {
    const h = HAND[String(r[0])];
    if (h) return h.v === 'tp' || h.v === 'fn' ? (h.cls ?? '').split(/[;,]\s*/).filter(Boolean) : [];
    return String(r[33]).split(';').filter(Boolean);
};
const rc26ByDay = (pick: (cls: string[]) => boolean) => (day: string): { n: number; v: number } => {
    const rows = decisionRows.filter((r) => r[6] === day && r[36] === 'yes' && handClasses(r).length > 0 && pick(handClasses(r)));
    return { n: rows.length, v: rows.filter((r) => r[38] === 'yes').length };
};
const rc18ByDay = new Map(rc18Rows.map((r) => [String(r[0]), r]));
const rc18 = (day: string): { n: number; v: number } => {
    const r = rc18ByDay.get(day);
    return r && r[2] ? { n: 1, v: r[7] === 'over' ? 1 : 0 } : { n: 0, v: 0 };
};

const SERIES: RuleSeries[] = [
    promptRule('RC-42 Depends: line', 'depends', 'P-2026-10-06-0000', 'none', ''),
    promptRule('RC-43 Request: line', 'request', 'P-2026-10-10-0000', 'warn', '2026-10-10'),
    promptRule('RC-44 Front: line', 'front', 'P-2026-10-11-0000', 'block-auto', '2026-10-10'),
    promptRule('RC-33 Chat: line', 'chat', 'P-2026-09-28-2300', 'report', '2026-09-28'),
    promptRule('RC-17 Lane: line', 'lane', 'P-2026-09-25-1200', 'warn', '2026-09-28'),
    msgRule('P6 Model: trailer (lane-or-local)', '2026-09-18', 'block-auto', '2026-09-22', (m) => m.origin === 'lane-or-local', (m) => !m.model, 'non-merge commit of origin lane-or-local'),
    msgRule('P6 Model: trailer (chat)', '2026-09-18', 'none (outside the hook scope)', '', (m) => m.origin === 'chat', (m) => !m.model, 'non-merge commit of origin chat'),
    msgRule('P6 Model: trailer (lane-run-script)', '2026-09-18', 'none (outside the hook scope)', '', (m) => m.origin === 'lane-run-script', (m) => !m.model, 'non-merge commit of origin lane-run-script'),
    msgRule('CLAUDE.md 6.2 subject <= 72 (lane-or-local)', SERIES_FROM, 'block-auto', '2026-09-22', (m) => m.origin === 'lane-or-local', (m) => m.long, 'non-merge commit of origin lane-or-local'),
    msgRule('CLAUDE.md 6.2 subject <= 72 (chat)', SERIES_FROM, 'none (outside the hook scope)', '', (m) => m.origin === 'chat', (m) => m.long, 'non-merge commit of origin chat'),
    msgRule('CLAUDE.md 6.2 subject <= 72 (lane-run-script)', SERIES_FROM, 'none (outside the hook scope)', '', (m) => m.origin === 'lane-run-script', (m) => m.long, 'non-merge commit of origin lane-run-script'),
    msgRule('RC-13 docs and code apart (lane-or-local)', SERIES_FROM, 'block-auto', '2026-09-22', (m) => m.origin === 'lane-or-local', (m) => m.mixed, 'non-merge commit of origin lane-or-local'),
    msgRule('RC-13 docs and code apart (chat)', SERIES_FROM, 'none (outside the hook scope)', '', (m) => m.origin === 'chat', (m) => m.mixed, 'non-merge commit of origin chat'),
    msgRule('P6 Model: trailer (lane-or-local, hook in tree)', '2026-09-22', 'block-auto', '2026-09-22', (m) => m.origin === 'lane-or-local' && m.hooked, (m) => !m.model, 'non-merge commit of origin lane-or-local whose tree carries the hook'),
    msgRule('P6 Model: trailer (lane-or-local, no hook in tree)', '2026-09-22', 'none (outside the hook scope)', '', (m) => m.origin === 'lane-or-local' && !m.hooked, (m) => !m.model, 'non-merge commit of origin lane-or-local whose tree lacks the hook'),
    msgRule('CLAUDE.md 6.2 subject <= 72 (lane-or-local, hook in tree)', '2026-09-22', 'block-auto', '2026-09-22', (m) => m.origin === 'lane-or-local' && m.hooked, (m) => m.long, 'non-merge commit of origin lane-or-local whose tree carries the hook'),
    msgRule('CLAUDE.md 6.2 subject <= 72 (lane-or-local, no hook in tree)', '2026-09-22', 'none (outside the hook scope)', '', (m) => m.origin === 'lane-or-local' && !m.hooked, (m) => m.long, 'non-merge commit of origin lane-or-local whose tree lacks the hook'),
    rowRule('RC-25..27 header grammar (rows since 2026-09-26)', GRAMMAR_FROM, 'block-manual', '', headersFailing, 'register row dated >= 2026-09-26 (daily snapshot)'),
    rowRule('RC-25 provisional row acknowledged within 2 days', GRAMMAR_FROM, 'report', '', provisionalOutstanding, 'register row dated >= 2026-09-26 (daily snapshot)'),
    rowRule('RC-26 waits for Alfonso (critical-zone class)', RC26_FROM, 'block-auto partial (hook guards 6 files; go-ahead set by the chat)', RC26_FROM, rc26ByDay((c) => c.includes('critical-zone')), 'row in the class introduced'),
    rowRule('RC-26 waits for Alfonso (other classes)', RC26_FROM, 'none', '', rc26ByDay((c) => !c.includes('critical-zone')), 'row in the class introduced'),
    rowRule('RC-18 harness budget', RC18_FROM, 'none', '', rc18, 'day (7-day window)'),
];
const vRows: unknown[][] = [];
for (const s of SERIES) {
    for (const day of dayRange(addDays(s.from, -7) < SERIES_FROM ? SERIES_FROM : addDays(s.from, -7), UNTIL)) {
        const { n, v } = s.test(day);
        const period = day < s.from ? 'before' : s.checkFrom && day >= s.checkFrom ? 'checked' : 'text-only';
        vRows.push([day, s.rule, s.enforcement, period, s.unit, n, v, n ? v / n : '']);
    }
}
writeCsv('violations_daily.csv', ['date', 'rule', 'enforcement', 'period', 'unit', 'opportunities', 'violations', 'rate'], vRows);

// Summary per rule: the text-only period (rule in force, no check yet), the checked period, the last 7 days,
// and the peak day. A snapshot unit sums row-days, so its rate is the mean daily share.
const cmp: unknown[][] = [];
for (const s of SERIES) {
    const sum = (from: string, to: string): { n: number; v: number } => {
        let n = 0;
        let v = 0;
        if (from > to) return { n, v };
        for (const d of dayRange(from, to)) {
            const r = s.test(d);
            n += r.n;
            v += r.v;
        }
        return { n, v };
    };
    const rate = (x: { n: number; v: number }): number | string => (x.n ? x.v / x.n : '');
    const textTo = s.checkFrom ? addDays(s.checkFrom, -1) : UNTIL;
    const textP = sum(s.from, textTo);
    const checkP = s.checkFrom ? sum(s.checkFrom > s.from ? s.checkFrom : s.from, UNTIL) : { n: 0, v: 0 };
    const last = sum(addDays(UNTIL, -6), UNTIL);
    let peak = { day: '', v: -1, n: 0 };
    for (const d of dayRange(s.from, UNTIL)) {
        const r = s.test(d);
        if (r.v > peak.v) peak = { day: d, v: r.v, n: r.n };
    }
    cmp.push([s.rule, s.enforcement, s.from, s.checkFrom, s.unit, textP.n, textP.v, rate(textP), checkP.n, checkP.v, rate(checkP), last.n, last.v, rate(last), peak.day, peak.v, peak.n, s.repaired ? s.repaired() : '']);
}
writeCsv('comparison.csv', ['rule', 'enforcement', 'rule_from', 'check_from', 'unit', 'text_only_n', 'text_only_violations', 'text_only_rate', 'checked_n', 'checked_violations', 'checked_rate', 'last7_n', 'last7_violations', 'last7_rate', 'peak_date', 'peak_violations', 'peak_n', 'violations_repaired_at_ref'], cmp);

// Commit-message facts by kind, for the report.
const kinds = new Map<string, { n: number; noModel: number }>();
for (const m of msgFacts.filter((x) => x.day >= '2026-09-22')) {
    const k = `${m.origin}/${m.kind}`;
    const e = kinds.get(k) ?? { n: 0, noModel: 0 };
    e.n++;
    if (!m.model) e.noModel++;
    kinds.set(k, e);
}
console.log('Model: trailer missing since 2026-09-22, by origin/kind:', JSON.stringify(Object.fromEntries(kinds)));
console.log(`prompts added: ${prompts.length} (${prompts.filter((p) => p.merge).length} merge prompts)`);

// ── 6. rules.csv: the curated enforcement map joined with the register history and the series ─────────

function parseCsv(text: string): Record<string, string>[] {
    const rows: string[][] = [];
    let r: string[] = [];
    let f = '';
    let q = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (q) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    f += '"';
                    i++;
                } else q = false;
            } else f += c;
        } else if (c === '"') q = true;
        else if (c === ',') {
            r.push(f);
            f = '';
        } else if (c === '\n') {
            r.push(f);
            rows.push(r);
            r = [];
            f = '';
        } else f += c;
    }
    if (f !== '' || r.length) {
        r.push(f);
        rows.push(r);
    }
    const [h, ...body] = rows;
    return body.map((x) => Object.fromEntries(h.map((k, i) => [k, x[i] ?? ''])));
}
const enforcement = parseCsv(readFileSync(join(HERE, 'rules-enforcement.csv'), 'utf8'));
const cmpByRule = new Map(cmp.map((r) => [String(r[0]), r]));
const ruleRows: unknown[][] = enforcement.map((e) => {
    const regId = /^RC-\d+/.exec(e.rule_id)?.[0] ?? '';
    const h = regId ? hist.get(regId) : undefined;
    const series = e.series ? e.series.split(';') : [];
    const sv = series.map((name) => cmpByRule.get(name)).filter(Boolean) as unknown[][];
    // comparison.csv order: 7 text_only_rate, 10 checked_rate, 13 last7_rate.
    const fmt = (i: number): string => sv.map((r) => `${r[0]}: ${r[i] === '' ? '-' : Number(r[i]).toFixed(3)}`).join('; ');
    return [
        e.rule_id, e.short, e.category, e.checks, e.check_scope, e.enforced_by || 'none', e.enforcement_mode, e.wired_into,
        h ? h.firstRow.date : e.rule_text_date,
        h ? h.first.sha.slice(0, 9) : e.rule_text_commit,
        h ? isoOf(h.first.ct) : '',
        h ? h.textChanges.map((c) => `${dayOf(c.ct)}:${c.sha.slice(0, 9)}`).join(' ') : '',
        e.rule_text_where || (regId ? `docs/decisions.md ${regId}` : ''),
        e.check_since_date, e.check_since_commit,
        e.check_since_date && (h ? h.firstRow.date : e.rule_text_date) ? daysBetween(h ? h.firstRow.date : e.rule_text_date, e.check_since_date) : '',
        e.series, fmt(7), fmt(10), fmt(13), e.evidence, e.violation_measure,
    ];
});
writeCsv('rules.csv', ['rule_id', 'short', 'category', 'checks', 'check_scope', 'enforced_by', 'enforcement_mode', 'wired_into', 'rule_date', 'rule_commit', 'rule_commit_time', 'rule_text_amendments', 'rule_where', 'check_since_date', 'check_since_commit', 'check_lag_days', 'series', 'text_only_rate', 'checked_rate', 'last7_rate', 'evidence', 'violation_measure'], ruleRows);
