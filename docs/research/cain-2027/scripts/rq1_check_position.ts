/**
 * rq1_check_position.ts — RQ1 of the CAIN 2027 full paper (P-2026-10-11-1725): how well a checkable
 * rule is kept, depending on where its check runs.
 *
 * One row per (rule, check position, commit path, window) into data/rq1_check_position.csv.
 * Paths are the 1630 commit origins: lane (lane-or-local, split by whether the tree carries the
 * hook), chat, lane-run (its own templated commits). Windows: from the rule's checked start to the
 * ratification merge c6804f3d3 (exclusive), and the same restricted to 2026-09-26 on (the period
 * confound of item 5). Positions, strongest first: hook-on-commit, blocking-at-launch, warning-only,
 * report-only, no-check, check-exists-not-run.
 *
 * Inputs: git at REF; data/decisions.csv and data/conformance_failures.csv of the 1630 dataset
 * (read, never rewritten); the lane folders of ~/.jjodel-lanes (read only) for hook denials and the
 * prompt text each lane was launched with. Parity: before writing, the per-commit and per-prompt
 * facts are summed over the 1630 windows and compared with data/comparison.csv; any difference
 * exits 1.
 *
 * Run from the repository root: node --experimental-strip-types docs/research/cain-2027/scripts/rq1_check_position.ts
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
    CUT_CT, DATA, HERE, HOOK_FROM, JUDGMENT_FROM, LANES, REF, addDays, catBlobs, commitsByShas, commitsOf, dayOf, dayRange,
    filesSince, git, hasModel, hookedSet, isDocPath, isoOf, lanePidOfCommit, median, originOf, rate, readData, secOf,
    startOfDay, subjectLength, writeCsv, type Commit,
} from './rq_common.ts';

const UNTIL = '2026-10-11';
const cutCt = CUT_CT();
const failures: string[] = [];

// ── commit facts ─────────────────────────────────────────────────────────────

const SINCE = '2026-08-25'; // governance-dataset.ts:638, addDays(SERIES_FROM, -7)
const commits = commitsOf(['--no-merges', `--since=${SINCE}`, REF]);
const files = filesSince(SINCE);
const hooked = hookedSet();
interface Fact {
    c: Commit;
    day: string;
    origin: string;
    hooked: boolean;
    model: boolean;
    long: boolean;
    mixed: boolean;
    pid: boolean;
}
const facts: Fact[] = commits.map((c) => {
    const fs = files.get(c.sha) ?? [];
    const nDoc = fs.filter(isDocPath).length;
    return {
        c,
        day: dayOf(c.ct),
        origin: originOf(c),
        hooked: hooked.has(c.sha),
        model: hasModel(c),
        long: subjectLength(c) > 72,
        mixed: nDoc > 0 && nDoc < fs.length,
        pid: !!lanePidOfCommit(c),
    };
});

// ── parity with comparison.csv (the 1630 series of governance-dataset.ts:968-979) ─────────────

const cmp = new Map(readData('comparison.csv').map((r) => [r.rule, r]));
type Pick = (f: Fact) => boolean;
const MSG_SERIES: [string, string, string, Pick, Pick][] = [
    ['P6 Model: trailer (lane-or-local)', '2026-09-18', '2026-09-22', (f) => f.origin === 'lane-or-local', (f) => !f.model],
    ['P6 Model: trailer (chat)', '2026-09-18', '', (f) => f.origin === 'chat', (f) => !f.model],
    ['P6 Model: trailer (lane-run-script)', '2026-09-18', '', (f) => f.origin === 'lane-run-script', (f) => !f.model],
    ['CLAUDE.md 6.2 subject <= 72 (lane-or-local)', '2026-09-01', '2026-09-22', (f) => f.origin === 'lane-or-local', (f) => f.long],
    ['CLAUDE.md 6.2 subject <= 72 (chat)', '2026-09-01', '', (f) => f.origin === 'chat', (f) => f.long],
    ['CLAUDE.md 6.2 subject <= 72 (lane-run-script)', '2026-09-01', '', (f) => f.origin === 'lane-run-script', (f) => f.long],
    ['RC-13 docs and code apart (lane-or-local)', '2026-09-01', '2026-09-22', (f) => f.origin === 'lane-or-local', (f) => f.mixed],
    ['RC-13 docs and code apart (chat)', '2026-09-01', '', (f) => f.origin === 'chat', (f) => f.mixed],
    ['P6 Model: trailer (lane-or-local, hook in tree)', '2026-09-22', '2026-09-22', (f) => f.origin === 'lane-or-local' && f.hooked, (f) => !f.model],
    ['P6 Model: trailer (lane-or-local, no hook in tree)', '2026-09-22', '', (f) => f.origin === 'lane-or-local' && !f.hooked, (f) => !f.model],
    ['CLAUDE.md 6.2 subject <= 72 (lane-or-local, hook in tree)', '2026-09-22', '2026-09-22', (f) => f.origin === 'lane-or-local' && f.hooked, (f) => f.long],
    ['CLAUDE.md 6.2 subject <= 72 (lane-or-local, no hook in tree)', '2026-09-22', '', (f) => f.origin === 'lane-or-local' && !f.hooked, (f) => f.long],
];
function sumDays(pick: Pick, bad: Pick, from: string, to: string): { n: number; v: number } {
    const days = new Set(from > to ? [] : dayRange(from, to));
    const ms = facts.filter((f) => days.has(f.day) && pick(f));
    return { n: ms.length, v: ms.filter(bad).length };
}
for (const [rule, from, checkFrom, pick, bad] of MSG_SERIES) {
    const r = cmp.get(rule);
    if (!r) {
        failures.push(`parity: ${rule} missing from comparison.csv`);
        continue;
    }
    const textP = sumDays(pick, bad, from, checkFrom ? addDays(checkFrom, -1) : UNTIL);
    const checkP = checkFrom ? sumDays(pick, bad, checkFrom > from ? checkFrom : from, UNTIL) : { n: 0, v: 0 };
    const want = [+r.text_only_n, +r.text_only_violations, +r.checked_n, +r.checked_violations];
    const got = [textP.n, textP.v, checkP.n, checkP.v];
    if (want.join() !== got.join()) failures.push(`parity: ${rule} comparison.csv ${want.join('/')} vs ${got.join('/')}`);
}

// ── hook denials in the lane logs (bash-guard, PreToolUse) ──────────────────

interface Denial {
    lane: string;
    t: number; // epoch seconds
    kinds: string[]; // model | subject | mixed
    landedAfter: number | null; // seconds to the next successful git commit of the same session
}
const denials: Denial[] = [];
/** What a successful `git commit` prints: `[branch sha] subject`, or `sha subject` under `-q` with a `--format` echo. */
const COMMITTED = /\[[^\]\s]+ [0-9a-f]{7,12}\]|(^|\s)[0-9a-f]{7,12} (feat|fix|docs|refactor|test|chore|merge|perf|style|build|ci|revert)(\([^)]*\))?!?: /m;
const laneDirs = existsSync(LANES) ? readdirSync(LANES).filter((n) => /^P-\d{4}-\d{2}-\d{2}-\d{4}$/.test(n)).sort() : [];
for (const lane of laneDirs) {
    const p = join(LANES, lane, 'log.jsonl');
    if (!existsSync(p)) continue;
    const text = readFileSync(p, 'utf8');
    if (!text.includes('git commit')) continue;
    const commitUses = new Set<string>();
    const events: { t: number; kind: 'deny' | 'ok'; kinds: string[] }[] = [];
    for (const line of text.split('\n')) {
        if (!line.includes('git commit') && !line.includes('hook error: bash-guard')) {
            if (!line.includes('"tool_result"')) continue;
        }
        let e: any;
        try {
            e = JSON.parse(line);
        } catch {
            continue;
        }
        const content = e?.message?.content;
        if (!Array.isArray(content)) continue;
        for (const item of content) {
            if (item.type === 'tool_use' && item.name === 'Bash' && /\bgit\b[^\n|;&]*\bcommit\b/.test(String(item.input?.command ?? ''))) commitUses.add(item.id);
            if (item.type !== 'tool_result') continue;
            const body = typeof item.content === 'string' ? item.content : Array.isArray(item.content) ? item.content.map((x: any) => x.text ?? '').join('') : '';
            const t = Date.parse(e.timestamp) / 1000;
            if (body.startsWith('PreToolUse:Bash hook error: bash-guard:')) {
                const kinds: string[] = [];
                if (/P6: the message has no "Model:/.test(body)) kinds.push('model');
                if (/6\.2: the subject is \d+ characters/.test(body)) kinds.push('subject');
                if (/docs and code never in the same commit/.test(body)) kinds.push('mixed');
                if (kinds.length) events.push({ t, kind: 'deny', kinds });
            } else if (commitUses.has(item.tool_use_id) && !item.is_error && COMMITTED.test(body)) {
                events.push({ t, kind: 'ok', kinds: [] });
            }
        }
    }
    events.forEach((ev, i) => {
        if (ev.kind !== 'deny') return;
        const next = events.slice(i + 1).find((x) => x.kind === 'ok');
        denials.push({ lane, t: ev.t, kinds: ev.kinds, landedAfter: next ? next.t - ev.t : null });
    });
}

// ── prompts as first committed ───────────────────────────────────────────────

const added = git(['log', '--diff-filter=A', '--format=>%H %ct', '--name-only', REF, '--', 'docs/prompts/']);
const promptAdds: { file: string; sha: string; ct: number }[] = [];
{
    let sha = '';
    let ct = 0;
    for (const l of added.split('\n')) {
        if (l.startsWith('>')) [sha, ct] = [l.slice(1).split(' ')[0], +l.split(' ')[1]];
        else if (l.trim().endsWith('.md') && /claude_\d{4}-\d{2}-\d{2}_\d{4}_/.test(l)) promptAdds.push({ file: l.trim(), sha, ct });
    }
}
const header = (text: string): string => text.split(/\n## /)[0];
const LINES = {
    depends: /^Depends:[ \t]*\S/m,
    request: /^Request:[ \t]*\S/m,
    front: /^Front:[ \t]*\S/m,
    chat: /^Chat:[ \t]*C-\d{4}-\d{2}-\d{2}-\d{4}/m,
    lane: /^Lane:[ \t]*(fast|full)/m,
} as const; // governance-dataset.ts:828-836
type LineKey = keyof typeof LINES;
const addBlobs = catBlobs(promptAdds.map((p) => `${p.sha}:${p.file}`));
const addCommits = commitsByShas(promptAdds.map((p) => p.sha));
interface Prompt {
    pid: string;
    day: string;
    file: string;
    sha: string;
    ct: number;
    origin: string;
    merge: boolean;
    has: Record<LineKey, boolean>;
    repairCt: Partial<Record<LineKey, number>>; // first later commit whose header carries the line
    launchedAt: number | null; // epoch seconds from started.txt
    launchedHas: Partial<Record<LineKey, boolean>>;
}
const prompts: Prompt[] = promptAdds.map((p, i) => {
    const text = addBlobs[i] ?? '';
    const h = header(text);
    const m = /claude_(\d{4}-\d{2}-\d{2})_(\d{4})_/.exec(p.file)!;
    const pid = `P-${m[1]}-${m[2]}`;
    const has = Object.fromEntries(Object.entries(LINES).map(([k, re]) => [k, re.test(h)])) as Record<LineKey, boolean>;
    const dir = join(LANES, pid);
    let launchedAt: number | null = null;
    const launchedHas: Partial<Record<LineKey, boolean>> = {};
    if (existsSync(join(dir, 'started.txt')) && existsSync(join(dir, 'input-1.md'))) {
        launchedAt = Math.round(Number(readFileSync(join(dir, 'started.txt'), 'utf8').trim()) / 1000);
        const lh = header(readFileSync(join(dir, 'input-1.md'), 'utf8'));
        if (/^Prompt-ID:\s*P-/m.test(lh)) for (const [k, re] of Object.entries(LINES)) launchedHas[k as LineKey] = re.test(lh);
        else launchedAt = null;
    }
    return {
        pid, day: m[1], file: p.file, sha: p.sha, ct: p.ct,
        origin: originOf(addCommits.get(p.sha)!),
        merge: /_prompt_merge_/.test(p.file) || /^Lane:\s*full \(merge\b/m.test(h),
        has, repairCt: {}, launchedAt, launchedHas,
    };
});
// Repairs: walk the later versions of every prompt that missed a line when committed.
for (const p of prompts) {
    const missing = (Object.keys(LINES) as LineKey[]).filter((k) => !p.has[k]);
    if (p.merge || missing.length === 0) continue;
    const later = git(['log', '--reverse', '--format=%H %ct', REF, '--', p.file]).split('\n').filter(Boolean).map((l) => l.split(' ')).filter(([, ct]) => +ct > p.ct);
    if (later.length === 0) continue;
    const blobs = catBlobs(later.map(([s]) => `${s}:${p.file}`));
    for (const k of missing) {
        const i = blobs.findIndex((b) => b !== null && LINES[k].test(header(b)));
        if (i >= 0) p.repairCt[k] = +later[i][1];
    }
}

// Parity with the prompt series (governance-dataset.ts:963-967): text-only and checked n/v, and repairs at REF.
const PROMPT_SERIES: [string, LineKey, string, string][] = [
    ['RC-42 Depends: line', 'depends', 'P-2026-10-06-0000', ''],
    ['RC-43 Request: line', 'request', 'P-2026-10-10-0000', '2026-10-10'],
    ['RC-44 Front: line', 'front', 'P-2026-10-11-0000', '2026-10-10'],
    ['RC-33 Chat: line', 'chat', 'P-2026-09-28-2300', '2026-09-28'],
    ['RC-17 Lane: line', 'lane', 'P-2026-09-25-1200', '2026-09-28'],
];
for (const [rule, k, fromPid, checkFrom] of PROMPT_SERIES) {
    const r = cmp.get(rule)!;
    const ps = prompts.filter((p) => !p.merge && p.pid >= fromPid && p.day <= UNTIL);
    const text = ps.filter((p) => !checkFrom || p.day < checkFrom);
    const chk = checkFrom ? ps.filter((p) => p.day >= checkFrom) : [];
    const got = [text.length, text.filter((p) => !p.has[k]).length, chk.length, chk.filter((p) => !p.has[k]).length, ps.filter((p) => !p.has[k] && p.repairCt[k] !== undefined).length];
    const want = [+r.text_only_n, +r.text_only_violations, +r.checked_n, +r.checked_violations, +r.violations_repaired_at_ref];
    if (want.join() !== got.join()) failures.push(`parity: ${rule} comparison.csv ${want.join('/')} vs ${got.join('/')}`);
}

if (failures.length) {
    console.error(failures.join('\n'));
    process.exit(1);
}
console.log('parity with comparison.csv: every commit and prompt series matches');

// ── RQ1 rows ─────────────────────────────────────────────────────────────────

const RANK: Record<string, number> = { 'hook-on-commit': 1, 'blocking-at-launch': 2, 'warning-only': 3, 'report-only': 4, 'no-check': 5, 'check-exists-not-run': 6 };
const out: unknown[][] = [];
const secs = (s: number): number => Math.round(s);
const WINDOWS: [string, string][] = [['to-cut', ''], ['from-2026-09-26-to-cut', JUDGMENT_FROM]];

interface MsgRule {
    rule: string;
    ruleRef: string;
    bad: (f: Fact) => boolean;
    denialKind: string;
}
const MSG_RULES: MsgRule[] = [
    { rule: 'Model: trailer', ruleRef: 'docs/PROTOCOL.md P6', bad: (f) => !f.model, denialKind: 'model' },
    { rule: 'subject <= 72 characters', ruleRef: 'CLAUDE.md 6.2', bad: (f) => f.long, denialKind: 'subject' },
    { rule: 'docs and code apart', ruleRef: 'docs/PROTOCOL.md P13 (RC-13)', bad: (f) => f.mixed, denialKind: 'mixed' },
];
const PATHS: { path: string; detail: string; position: string; enforcedBy: string; pick: (f: Fact) => boolean; note: string }[] = [
    { path: 'lane', detail: 'tree carries the hook', position: 'hook-on-commit', enforcedBy: 'frontend/scripts/hooks/bash-guard.mjs', pick: (f) => f.origin === 'lane-or-local' && f.hooked, note: 'lane-or-local origin: lane sessions and local interactive sessions, not separable from git' },
    { path: 'lane', detail: 'tree lacks the hook', position: 'no-check', enforcedBy: 'none', pick: (f) => f.origin === 'lane-or-local' && !f.hooked, note: 'branch cut before 1172230c9: the hook exists but not in this tree' },
    { path: 'chat', detail: 'project chat', position: 'no-check', enforcedBy: 'none', pick: (f) => f.origin === 'chat', note: 'the chat commits outside any Claude Code session that loads the hooks' },
    { path: 'lane-run', detail: "lane-run's own commits", position: 'no-check', enforcedBy: 'none', pick: (f) => f.origin === 'lane-run-script', note: 'the subject and the trailer come from the lane-run.mjs template, no check' },
];
for (const [win, from] of WINDOWS) {
    const lo = startOfDay(from || HOOK_FROM);
    for (const r of MSG_RULES) {
        for (const p of PATHS) {
            const ms = facts.filter((f) => f.c.ct >= lo && f.c.ct < cutCt && p.pick(f));
            const v = ms.filter(r.bad);
            const withPid = ms.filter((f) => f.pid);
            const ds = p.position === 'hook-on-commit' ? denials.filter((d) => d.t >= lo && d.t < cutCt && d.kinds.includes(r.denialKind)) : [];
            const landed = ds.filter((d) => d.landedAfter !== null);
            out.push([
                r.rule, r.ruleRef, p.position, RANK[p.position], p.enforcedBy, p.path, p.detail,
                'non-merge commit reachable from REF', win, isoOf(lo), isoOf(cutCt),
                ms.length, v.length, rate(v.length, ms.length),
                p.path === 'lane' ? withPid.length : '', p.path === 'lane' ? withPid.filter(r.bad).length : '',
                p.position === 'hook-on-commit' ? ds.length : '', p.position === 'hook-on-commit' ? landed.length : '',
                p.position === 'hook-on-commit' ? median(landed.map((d) => d.landedAfter!)) : '',
                '', '', '', v.length, '', 'commit message immutable once committed: no later repair is possible. ' + p.note,
            ]);
        }
    }
}

// Prompt header lines.
interface PromptRule {
    rule: string;
    ruleRef: string;
    key: LineKey;
    fromPid: string;
    position: string;
    enforcedBy: string;
    note: string;
}
const PROMPT_RULES: PromptRule[] = [
    { rule: 'prompt header Front: line', ruleRef: 'RC-44', key: 'front', fromPid: 'P-2026-10-11-0000', position: 'blocking-at-launch', enforcedBy: 'frontend/scripts/lane-run.mjs;frontend/scripts/lane-tracking.mjs;frontend/scripts/gates/check-docs.ts', note: 'lane-run start refuses the prompt (check from 2026-10-10, 73af7bbac)' },
    { rule: 'prompt header Request: line', ruleRef: 'RC-43', key: 'request', fromPid: 'P-2026-10-10-0000', position: 'warning-only', enforcedBy: 'frontend/scripts/lane-run.mjs', note: 'lane-run start prints a warning and launches (lane-run.mjs:920)' },
    { rule: 'prompt header Lane: line', ruleRef: 'RC-17', key: 'lane', fromPid: 'P-2026-09-28-0000', position: 'warning-only', enforcedBy: 'frontend/scripts/lane-run.mjs;frontend/scripts/gates/trace-index.ts', note: 'warned by lane-run status and trace-index, both run on request (check from 2026-09-28)' },
    { rule: 'prompt header Chat: line', ruleRef: 'RC-33', key: 'chat', fromPid: 'P-2026-09-28-2300', position: 'report-only', enforcedBy: 'frontend/scripts/gates/trace-index.ts', note: 'listed as a miss by trace-index, run on request' },
    { rule: 'prompt header Depends: line', ruleRef: 'RC-42', key: 'depends', fromPid: 'P-2026-10-06-0000', position: 'no-check', enforcedBy: 'none', note: 'displayed by the lane board, never checked' },
];
for (const [win, from] of WINDOWS) {
    for (const r of PROMPT_RULES) {
        for (const path of ['chat', 'lane', 'lane-run']) {
            const origin = path === 'lane' ? 'lane-or-local' : path === 'lane-run' ? 'lane-run-script' : 'chat';
            const ps = prompts.filter((p) => !p.merge && p.pid >= r.fromPid && (!from || p.day >= from) && p.ct < cutCt && p.origin === origin);
            if (ps.length === 0) continue;
            const v = ps.filter((p) => !p.has[r.key]);
            const rep = v.filter((p) => p.repairCt[r.key] !== undefined);
            const repBefore = rep.filter((p) => p.repairCt[r.key]! < cutCt);
            const launched = ps.filter((p) => p.launchedAt !== null && p.launchedAt < cutCt && p.launchedHas[r.key] !== undefined);
            const launchedBad = launched.filter((p) => !p.launchedHas[r.key]);
            out.push([
                r.rule, r.ruleRef, r.position, RANK[r.position], r.enforcedBy, path,
                path === 'chat' ? 'prompt added by the project chat' : path === 'lane' ? 'prompt added by a lane or a local session' : 'prompt added by lane-run',
                'non-merge prompt as first committed', win, from ? `${from} 00:00` : `${r.fromPid}`, isoOf(cutCt),
                ps.length, v.length, rate(v.length, ps.length),
                '', '', '', '', '',
                repBefore.length, median(repBefore.map((p) => secs(p.repairCt[r.key]! - p.ct))), rep.length - repBefore.length,
                v.length - rep.length, `${launchedBad.length}/${launched.length}`,
                r.note + '. launched_while_violating reads input-1.md of the lane folder (the prompt as launched).',
            ]);
        }
    }
}

// Decision-row header grammar: rows dated on or after 2026-09-26, judged at the row's first commit.
const decisions = readData('decisions.csv').filter((d) => d.header_date >= JUDGMENT_FROM);
const failsByRow = new Map(readData('conformance_failures.csv').map((f) => [f.id, f]));
const introCommits = commitsByShas(decisions.map((d) => d.intro_commit));
// The CSV times are truncated to the minute and c6804f3d3 itself repaired most headers: compare commit times, not CSV times.
const fixCommits = commitsByShas([...failsByRow.values()].map((f) => f.fixed_commit).filter(Boolean));
const firstCommits = commitsByShas([...failsByRow.values()].map((f) => f.first_commit).filter(Boolean));
// detection-evidence.json corrects the 1630 fixed_commit where governance-dataset.ts:358-362 skips the trunk-arrival commit.
const override: Record<string, string> = Object.fromEntries(
    Object.entries(JSON.parse(readFileSync(join(HERE, 'detection-evidence.json'), 'utf8')).grammar.rows as Record<string, { repaired_commit?: string }>)
        .filter(([, n]) => n.repaired_commit)
        .map(([id, n]) => [id, n.repaired_commit!]),
);
const overrideCommits = commitsByShas(Object.values(override));
for (const [id, c] of Object.entries(override)) {
    const f = failsByRow.get(id);
    if (f) {
        f.fixed_commit = c;
        fixCommits.set(c, overrideCommits.get(c)!);
    }
}
const fixedCt = (f: Record<string, string>): number => fixCommits.get(f.fixed_commit)!.ct;
for (const [win] of WINDOWS) {
    for (const path of ['chat', 'lane', 'lane-run']) {
        const origin = path === 'lane' ? 'lane-or-local' : path === 'lane-run' ? 'lane-run-script' : 'chat';
        const rows = decisions.filter((d) => originOf(introCommits.get(d.intro_commit)!) === origin && secOf(d.intro_time) < cutCt);
        if (rows.length === 0) continue;
        const atIntro = rows.filter((d) => failsByRow.get(d.id)?.at_row_intro === 'yes');
        const later = rows.filter((d) => failsByRow.get(d.id)?.at_row_intro === 'no');
        const bad = [...atIntro, ...later].map((d) => failsByRow.get(d.id)!);
        const fixed = bad.filter((f) => f.fixed_commit);
        const fixedBefore = fixed.filter((f) => fixedCt(f) < cutCt);
        out.push([
            'decision-row header grammar', 'RC-25..RC-27 grammar (docs-digest.ts header)', 'check-exists-not-run', RANK['check-exists-not-run'],
            'frontend/scripts/gates/docs-digest.ts', path,
            path === 'chat' ? 'row first committed by the project chat' : path === 'lane' ? 'row first committed by a lane or a local session' : 'row first committed by lane-run',
            'register row dated >= 2026-09-26, judged at its first commit', win, `${JUDGMENT_FROM} 00:00`, isoOf(cutCt),
            rows.length, atIntro.length, rate(atIntro.length, rows.length),
            '', '', '', '', '',
            fixedBefore.length, median(fixedBefore.map((f) => secs(fixedCt(f) - firstCommits.get(f.first_commit)!.ct))), fixed.length - fixedBefore.length,
            bad.length - fixed.length, '',
            `violations counts headers non-conforming at the row's first commit; ${later.length} more became non-conforming by a later edit (in open_at_ref and repairs). The generator exits 2 on any of them and nothing runs it`,
        ]);
    }
}

writeCsv(join(DATA, 'rq1_check_position.csv'), [
    'rule', 'rule_ref', 'check_position', 'position_rank', 'enforced_by', 'path', 'path_detail', 'unit', 'window', 'window_from', 'window_to',
    'n', 'violations', 'rate', 'n_with_lane_id', 'violations_with_lane_id',
    'blocked_at_check', 'blocked_then_committed', 'blocked_to_commit_median_s',
    'repaired_before_cut', 'repaired_median_latency_s', 'repaired_at_or_after_cut', 'open_at_ref', 'launched_while_violating', 'note',
], out);

// Summary for the report.
const byKind = (k: string) => denials.filter((d) => d.kinds.includes(k));
console.log(`hook denials in lane logs (all time): ${denials.length}; model ${byKind('model').length}, subject ${byKind('subject').length}, mixed ${byKind('mixed').length}; lanes ${new Set(denials.map((d) => d.lane)).size}; first ${denials.length ? isoOf(Math.min(...denials.map((d) => d.t))) : '-'}`);
console.log(`prompts: ${prompts.length} added, ${prompts.filter((p) => p.launchedAt !== null).length} with a launched input-1.md`);
