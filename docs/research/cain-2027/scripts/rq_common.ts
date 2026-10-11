/**
 * rq_common.ts — shared reading for the RQ tables of the CAIN 2027 full paper (P-2026-10-11-1725).
 *
 * Research material, not harness code: no gate, hook or npm script runs it. It reads git at the
 * pinned ref of the 1630 dataset and the CSVs that governance-dataset.ts wrote into data/; it never
 * rewrites those CSVs. governance-dataset.ts exports nothing and writes its CSVs when imported, so
 * the RQ scripts do not import it: rq1_check_position.ts calls it as a subprocess into a temporary
 * directory and checks its own per-commit facts against the comparison.csv it regenerates.
 *
 * The four commit facts below (origin, hook in tree, Model: trailer, subject length, docs/code mix)
 * re-apply the definitions of governance-dataset.ts:883-921 one by one; rq1_check_position.ts fails
 * when its counts disagree with comparison.csv on any series of those definitions.
 */

process.env.TZ = 'Europe/Rome'; // the 1630 script dates commits by the local calendar of this machine

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO = resolve(HERE, '..', '..', '..', '..');
export const RESEARCH = resolve(HERE, '..');
export const DATA = join(RESEARCH, 'data');
export const LANES = join(homedir(), '.jjodel-lanes');

/** The ref of the 1630 dataset; every git read is pinned to it. */
export const REF = '154311f55';
/** The ratification merge of P-2026-10-11-1559: the series end just before it (1630 §11, question 2). */
export const CUT = 'c6804f3d3';
/** The commit that added bash-guard and critical-zone (P-2026-09-21-1620). */
export const HOOK_COMMIT = '1172230c9';
/** RC-25..RC-28 ratified: the grammar and the judgment rules start binding. */
export const JUDGMENT_FROM = '2026-09-26';
/** First full day the hook ran (the 1630 calendar cut for the checked period). */
export const HOOK_FROM = '2026-09-22';

// ── git ─────────────────────────────────────────────────────────────────────

export function git(args: string[]): string {
    const r = spawnSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 30 });
    if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed (exit ${r.status}): ${r.stderr}`);
    return r.stdout;
}

/** Contents of many `<rev>:<path>` specs in one `git cat-file --batch`; null when missing. */
export function catBlobs(specs: string[]): (string | null)[] {
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

export interface Commit {
    sha: string;
    ct: number;
    at: number;
    author: string;
    subject: string;
    body: string;
    parents: string[];
}

export function commitsOf(args: string[]): Commit[] {
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

export const sha9 = (s: string): string => s.slice(0, 9);
export const CUT_SHA = (): string => git(['rev-parse', CUT]).trim();
export const CUT_CT = (): number => +git(['log', '-1', '--format=%ct', CUT]).trim();

// ── time ────────────────────────────────────────────────────────────────────

const pad = (n: number): string => String(n).padStart(2, '0');
export function dayOf(sec: number): string {
    const d = new Date(sec * 1000);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function isoOf(sec: number): string {
    const d = new Date(sec * 1000);
    return `${dayOf(sec)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
/** Epoch seconds of `YYYY-MM-DD HH:mm` (local), as the 1630 CSVs write times. */
export function secOf(iso: string): number {
    return Math.round(new Date(iso.replace(' ', 'T') + ':00').getTime() / 1000);
}
export function addDays(day: string, n: number): string {
    const d = new Date(`${day}T12:00:00`);
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function daysBetween(a: string, b: string): number {
    return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000);
}
export function dayRange(from: string, to: string): string[] {
    const out: string[] = [];
    for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
    return out;
}
export const startOfDay = (day: string): number => Math.round(new Date(`${day}T00:00:00`).getTime() / 1000);
export function median(xs: number[]): number | '' {
    if (xs.length === 0) return '';
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// ── CSV ─────────────────────────────────────────────────────────────────────

export function parseCsv(text: string): Record<string, string>[] {
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
        } else if (c !== '\r') f += c;
    }
    if (f !== '' || r.length) {
        r.push(f);
        rows.push(r);
    }
    const [h, ...body] = rows;
    return body.map((x) => Object.fromEntries(h.map((k, i) => [k, x[i] ?? ''])));
}
export const readCsv = (path: string): Record<string, string>[] => parseCsv(readFileSync(path, 'utf8'));
export const readData = (name: string): Record<string, string>[] => readCsv(join(DATA, name));

export function csvCell(v: unknown): string {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(3)) : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function writeCsv(path: string, header: string[], rows: unknown[][]): void {
    mkdirSync(dirname(path), { recursive: true });
    const text = [header.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n') + '\n';
    writeFileSync(path, text);
    console.log(`wrote ${path.replace(REPO + '/', '')}: ${rows.length} rows`);
}

// ── commit facts (governance-dataset.ts:883-921, re-applied) ────────────────

export const PID = /P-\d{4}-\d{2}-\d{2}-\d{4}/;
export const CID = /C-\d{4}-\d{2}-\d{2}-\d{4}/;
export const lanePidOfCommit = (c: Commit): string => {
    const m = PID.exec(c.subject) ?? /^Prompt-ID:\s*(P-\d{4}-\d{2}-\d{2}-\d{4})/m.exec(c.body);
    return m ? (m[1] ?? m[0]) : '';
};
const LANE_RUN_TEMPLATE = /^docs: add prompt P-\S+, merge |^docs: Status flip and log entry for the \S+ merge /;
const CHAT_SUBJECT = /^docs\(prompts\)|^docs: add prompt|^docs\(sessioni\)/;
/** chat | lane-run-script | lane-or-local: the 1630 heuristic (report §2.3). */
export function originOf(c: Commit): string {
    if (LANE_RUN_TEMPLATE.test(c.subject)) return 'lane-run-script';
    if (/^Claude-Session:/m.test(c.body) || CHAT_SUBJECT.test(c.subject)) return 'chat';
    return 'lane-or-local';
}
export const hasModel = (c: Commit): boolean => /^Model: \S/m.test(c.body);
export const subjectLength = (c: Commit): number => [...c.subject.replace(/ \(P-\d{4}-\d{2}-\d{2}-\d{4}\)$/, '')].length;
/** bash-guard.mjs isDocPath: docs/, or a file named CLAUDE.md or AGENTS.md anywhere. */
export const isDocPath = (f: string): boolean => f.startsWith('docs/') || /(^|\/)(CLAUDE|AGENTS)\.md$/.test(f);

/** Every commit whose tree carries the hook: the hook commit and its descendants up to REF. */
export function hookedSet(): Set<string> {
    const full = git(['rev-parse', HOOK_COMMIT]).trim();
    return new Set([full, ...git(['rev-list', '--ancestry-path', `${HOOK_COMMIT}..${REF}`]).split('\n').filter(Boolean)]);
}

/** Files of every non-merge commit since a date, keyed by full sha. */
export function filesSince(since: string): Map<string, string[]> {
    const out = new Map<string, string[]>();
    const raw = git(['log', '--no-merges', `--since=${since}`, '--format=>%H', '--name-only', REF]);
    let cur = '';
    for (const l of raw.split('\n')) {
        if (l.startsWith('>')) {
            cur = l.slice(1);
            out.set(cur, []);
        } else if (l.trim() && cur) out.get(cur)!.push(l.trim());
    }
    return out;
}

/** One line per commit sha (full or abbreviated): subject, body, times. */
export function commitsByShas(shas: string[]): Map<string, Commit> {
    const uniq = [...new Set(shas.filter(Boolean))];
    const out = new Map<string, Commit>();
    for (let i = 0; i < uniq.length; i += 400) {
        for (const c of commitsOf(['--no-walk=unsorted', ...uniq.slice(i, i + 400)])) {
            out.set(c.sha, c);
            out.set(sha9(c.sha), c);
        }
    }
    return out;
}

export const fmt3 = (x: number | ''): number | '' => (x === '' ? '' : Math.round(x * 1000) / 1000);
export const rate = (v: number, n: number): number | '' => (n ? v / n : '');
