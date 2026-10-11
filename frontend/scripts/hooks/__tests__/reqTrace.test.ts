import { describe, test, expect, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// req-trace.mjs (P-2026-10-05-1720): the register parser, the git side, the
// co-citation clusters, the milestones and the goal-model join. The git side runs
// the script as a child process on a fixture repository, the way the board runs
// it (P11); the pure parts are called through the module's exports. A test name
// states the mutation that turns it red (CLAUDE.md 5).
//
// REQ_TRACE points the suite at another copy of the script (the mutation bench).

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = process.env.REQ_TRACE ? resolve(process.env.REQ_TRACE) : resolve(HERE, '..', '..', 'req-trace.mjs');
const rt = await import(pathToFileURL(SCRIPT).href);

const dirs: string[] = [];
afterAll(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

const REGISTER = `# Decisions

## Processo

- **RC-3** (2026-08-05) — Due corsie.

## Serie R-X — a family

- **R-X-1** (2026-09-01, ratified by Alfonso 2026-09-02, evidence: measured, verified: alfonso) — **The board shows lanes.**
  The rest of the row runs on a second line
  and cites R-Y-2 in passing.
- **R-X-2** (2026-09-03, provisional, unattended, evidence: read, verified: none) — **A second head.** Amends R-X-1 on the colour.
- **R-X-3** (2026-09-04) — No bold head here. It refines R-X-2.

**R-Y-1** (2026-08-30) — **Paragraph row, not a bullet.** Supersedes R-Y-9.

**R-Y-2-bis** (2026-08-31) — **The bis row.** Completes R-Y-2.

**R-Y-2** (2026-08-29) — **Base of the bis.**

- **R-X-10** (2026-10-02, provisional, evidence: measured, verified: none) — **Renumbered row.**
    Was R-X-4 on the branch, renumbered by P-2026-10-02-1506.

## Superate

- **R-Y-9** (2026-08-01) — **Old rule.** Superata da R-Y-1 il 2026-08-30.

**R-Y-8** (2026-07-01) — **Old paragraph rule.** Nothing else points at it.
`;

describe('req-trace: the register parser', () => {
    const { rows, byId } = rt.parseRegister(REGISTER);

    test('kills "RC rows emitted without the flag", "a paragraph row dropped": R- rows only, bullet and paragraph alike, RC behind --with-rc', () => {
        expect(rows.map((r: any) => r.id)).toEqual(['R-X-1', 'R-X-2', 'R-X-3', 'R-Y-1', 'R-Y-2-bis', 'R-Y-2', 'R-X-10', 'R-Y-9', 'R-Y-8']);
        const withRc = rt.parseRegister(REGISTER, { withRc: true });
        expect(withRc.rows[0].id).toBe('RC-3');
        expect(withRc.rows[0].rc).toBe(true);
    });

    test('kills "the row cut at its first line": a multi-line row keeps its continuation lines and its citation', () => {
        expect(byId.get('R-X-1').text).toContain('and cites R-Y-2 in passing.');
        expect(byId.get('R-Y-2').citedBy.other).toContain('R-X-1');
    });

    test('kills "head, date, status, evidence, verified misread", "the Superate section ignored": the fields of a row', () => {
        const a = byId.get('R-X-1');
        expect(a).toMatchObject({ family: 'R-X', title: 'The board shows lanes.', date: '2026-09-01', status: 'ratified', evidence: 'measured', verified: 'alfonso' });
        const b = byId.get('R-X-2');
        expect(b).toMatchObject({ status: 'provisional', evidence: 'read', verified: 'none', title: 'A second head.' });
        expect(byId.get('R-X-3').title).toBe('No bold head here.');
        expect(byId.get('R-Y-9').status).toBe('superseded');
        expect(byId.get('R-Y-8').status).toBe('superseded');
    });

    test('kills "-bis read as its base", "R-X-1 matching inside R-X-10": a -bis row is its own id with its base family', () => {
        const bis = byId.get('R-Y-2-bis');
        expect(bis.family).toBe('R-Y');
        expect(bis.title).toBe('The bis row.');
        expect(byId.get('R-Y-2').citedBy.evolution).toEqual([{ id: 'R-Y-2-bis', kind: 'refines' }]);
        expect(rt.idsIn('see R-X-10 and R-Y-2-bis', new Set(['R-X-1', 'R-X-10', 'R-Y-2', 'R-Y-2-bis']))).toEqual(['R-X-10', 'R-Y-2-bis']);
        expect(rt.idsIn('R-X-1..3', new Set(['R-X-1', 'R-X-2', 'R-X-3']))).toEqual(['R-X-1', 'R-X-2', 'R-X-3']);
    });

    test('kills "evolution links lumped with citations": amends, supersedes, refines and renumbered are evolution links', () => {
        expect(byId.get('R-X-1').citedBy.evolution).toEqual([{ id: 'R-X-2', kind: 'amends' }]);
        expect(byId.get('R-X-2').citedBy.evolution).toEqual([{ id: 'R-X-3', kind: 'refines' }]);
        expect(byId.get('R-Y-9').citedBy.evolution).toEqual([{ id: 'R-Y-1', kind: 'supersedes' }]);
        // R-X-4 is not a row of the register: the renumbered link is kept on the row that carries it.
        expect(byId.get('R-X-10').evolves).toEqual([{ id: 'R-X-4', kind: 'renumbered' }]);
    });
});

// ── the heads besides `**<id>**` (P-2026-10-11-2025) ─────────────────────────

describe('req-trace: a head with a label or a sub-number, and the near miss', () => {
    // The three heads as docs/decisions.md writes them (:369, :392, :471), a C- item between them, and the bold
    // sentence of :3693 that opens with an id and is prose, not a row.
    const HEADS = `# Decisions

## Serie R-D

- **R-C** (2026-08-05) — Before the labelled head.
- **R-D, emendamento a R-1 di E-obj** (2026-08-05) — Scrittura atomica dei capi: entrambe le
  chiavi o nessuna, sempre.
- **C-1..C-4** (2026-08-05) — Messaggistica dei capi, not an R- row.
- **R-2/3.6** (2026-08-07) — Finestra Style, rilevamento del css globale. Cites R-D in passing.
- **R-B12, gate del registry** (2026-08-03, implementato il 2026-08-06) — \`registerEdgePath\`
  è condiviso con gli edge classici.

**R-STR-5 e' superata nella sua delimitazione**, non nella sua lettura di \`FormSpec\`: prose, not a row.

**R-E** (2026-08-06) — After the prose.
`;
    const { rows, byId } = rt.parseRegister(HEADS);

    test('kills "the comma label refused", "the sub-number refused", "the family of R-2/3.6 ends in a dot": R-D, R-2/3.6 and R-B12 are rows, with their head, date, title and family', () => {
        expect(rows.map((r: any) => r.id)).toEqual(['R-C', 'R-D', 'R-2/3.6', 'R-B12', 'R-E']);
        expect(byId.get('R-D')).toMatchObject({ family: 'R-D', date: '2026-08-05', status: 'ratified', title: 'Scrittura atomica dei capi: entrambe le chiavi o nessuna, sempre.' });
        expect(byId.get('R-D').text).not.toContain('Messaggistica');
        expect(byId.get('R-2/3.6')).toMatchObject({ family: 'R-2/3', date: '2026-08-07', title: 'Finestra Style, rilevamento del css globale.' });
        expect(byId.get('R-B12')).toMatchObject({ family: 'R-B', date: '2026-08-03', title: '`registerEdgePath` è condiviso con gli edge classici.' });
        expect(byId.get('R-D').citedBy.other).toEqual(['R-2/3.6']);
    });

    test('kills "a space after the id read as a label": a bold sentence that opens with an id and a space is prose, not a row', () => {
        expect(byId.has('R-STR-5')).toBe(false);
        expect(byId.get('R-B12').text).not.toContain('superata');
        expect(byId.get('R-E').date).toBe('2026-08-06');
    });

    test('kills "the head label blanked": the label is read like the rest of the row, so R-D amends R-1', () => {
        expect(byId.get('R-D').evolves).toEqual([{ id: 'R-1', kind: 'amends' }]);
        expect(byId.get('R-B12').evolves).toEqual([]);
    });
});

// ── the git side, end to end ─────────────────────────────────────────────────

function git(cwd: string, args: string[], date?: string) {
    const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } as Record<string, string>;
    if (date) { env.GIT_AUTHOR_DATE = date; env.GIT_COMMITTER_DATE = date; }
    const r = spawnSync('git', args, { cwd, encoding: 'utf8', env });
    if (r.status !== 0) throw new Error('git ' + args.join(' ') + ': ' + r.stderr);
    return r.stdout.trim();
}

function commit(cwd: string, file: string, message: string, date: string) {
    writeFileSync(join(cwd, file), message + '\n');
    git(cwd, ['add', file]);
    git(cwd, ['commit', '-q', '-m', message], date);
    return git(cwd, ['rev-parse', 'HEAD']);
}

/** A repository with a trunk, a merged feature branch, a direct fix and an unmerged branch. */
function fixtureRepo() {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'req-trace-')));
    dirs.push(root);
    const repo = join(root, 'repo');
    mkdirSync(join(repo, 'docs', 'prompts'), { recursive: true });
    git(repo, ['init', '-q', '-b', 'trunk']);
    writeFileSync(join(repo, 'docs', 'decisions.md'), '# D\n\n- **R-A-1** (2026-09-01) — **First.**\n- **R-A-2** (2026-09-02) — **Second.**\n- **R-B-1** (2026-09-03) — **Third.**\n');
    git(repo, ['add', 'docs/decisions.md']);
    git(repo, ['commit', '-q', '-m', 'docs: the register, R-A-1 R-A-2 R-B-1'], '2026-09-01T10:00:00');
    git(repo, ['checkout', '-q', '-b', 'feature']);
    const feat = commit(repo, 'a.txt', 'feat(a): the first one (P-2026-10-01-1000)\n\nImplements R-A-1.', '2026-10-01T10:00:00');
    git(repo, ['checkout', '-q', 'trunk']);
    git(repo, ['merge', '-q', '--no-ff', '-m', 'merge: feature into trunk (P-2026-10-01-1100)', 'feature'], '2026-10-01T11:00:00');
    const merge = git(repo, ['rev-parse', 'HEAD']);
    const fix = commit(repo, 'b.txt', 'fix: R-A-2 on the trunk', '2026-10-09T09:00:00');
    commit(repo, 'c.txt', 'docs: a note after the fix', '2026-10-09T10:00:00');
    git(repo, ['checkout', '-q', '-b', 'unmerged']);
    commit(repo, 'd.txt', 'feat: R-B-1 never merged', '2026-10-09T11:00:00');
    git(repo, ['checkout', '-q', 'trunk']);
    return { root, repo, feat, merge, fix };
}

function reqTrace(args: string[]) {
    const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', timeout: 30000 });
    if (r.status !== 0) throw new Error('req-trace exit ' + r.status + ': ' + r.stderr);
    return JSON.parse(r.stdout);
}

describe('req-trace: realized, on a fixture history', () => {
    test('kills "any commit type counts", "unreachable commits count", "the trunk merge not found": realized rows, their commits and the merge that brought them in', () => {
        const fx = fixtureRepo();
        const cache = join(fx.root, 'cache');
        const out = reqTrace(['--repo', fx.repo, '--trunk', 'trunk', '--cache-dir', cache]);
        const row = (id: string) => out.rows.find((r: any) => r.id === id);
        expect(row('R-A-1').realized).toBe(true);
        expect(row('R-A-1').commits.map((c: any) => c.sha)).toEqual([fx.feat]);
        expect(row('R-A-1').commits[0].promptId).toBe('P-2026-10-01-1000');
        expect(row('R-A-1').trunkMerge.sha).toBe(fx.merge);
        expect(row('R-A-2').realized).toBe(true);
        expect(row('R-A-2').trunkMerge).toBe(null);
        expect(row('R-B-1').realized).toBe(false);
        expect(row('R-B-1').commits).toEqual([]);
        expect(out.counts).toMatchObject({ rows: 3, realized: 2 });
        // Milestones: none in docs/goals, so the built-in one; R-A-2 lands after it.
        expect(out.milestones).toEqual([{ id: 'MODELS', name: 'MODELS freeze', date: '2026-10-07', source: 'built-in' }]);
        expect(row('R-A-1').milestone).toBe('MODELS');
        expect(row('R-A-2').milestone).toBe(null);
    });

    test('negative control: the code commit of R-A-2 removed from the history turns realized false (and the cache follows the trunk sha)', () => {
        const fx = fixtureRepo();
        const cache = join(fx.root, 'cache');
        expect(reqTrace(['--repo', fx.repo, '--trunk', 'trunk', '--cache-dir', cache]).rows.find((r: any) => r.id === 'R-A-2').realized).toBe(true);
        git(fx.repo, ['rebase', '-q', '--onto', fx.fix + '~1', fx.fix, 'trunk']);
        const after = reqTrace(['--repo', fx.repo, '--trunk', 'trunk', '--cache-dir', cache]);
        expect(after.rows.find((r: any) => r.id === 'R-A-2').realized).toBe(false);
        expect(after.rows.find((r: any) => r.id === 'R-A-1').realized).toBe(true);
    });

    test('kills "process.exit before the pipe drains": a document far above 64 KB reaches a piped reader whole', () => {
        const fx = fixtureRepo();
        const many = Array.from({ length: 900 }, (_, i) => `- **R-M-${i + 1}** (2026-09-01, provisional, evidence: read, verified: none) — **Row ${i + 1} of a long register.** Cites R-A-1.`).join('\n');
        writeFileSync(join(fx.repo, 'docs', 'decisions.md'), '# D\n\n- **R-A-1** (2026-09-01) — **First.**\n' + many + '\n');
        const r = spawnSync(process.execPath, [SCRIPT, '--repo', fx.repo, '--trunk', 'trunk', '--no-cache'], { encoding: 'utf8', timeout: 30000, maxBuffer: 64 * 1024 * 1024 });
        expect(r.status, r.stderr).toBe(0);
        expect(r.stdout.length).toBeGreaterThan(256 * 1024);
        expect(JSON.parse(r.stdout).rows).toHaveLength(901);
    });

    test('kills "milestones.json ignored": a milestones file replaces the built-in one', () => {
        const fx = fixtureRepo();
        mkdirSync(join(fx.repo, 'docs', 'goals'));
        writeFileSync(join(fx.repo, 'docs', 'goals', 'milestones.json'), JSON.stringify([{ id: 'M2', name: 'Later', date: '2026-10-31' }, { id: 'M1', name: 'Early', date: '2026-10-02' }]));
        const out = reqTrace(['--repo', fx.repo, '--trunk', 'trunk', '--no-cache']);
        expect(out.milestones.map((m: any) => m.id)).toEqual(['M1', 'M2']);
        expect(out.rows.find((r: any) => r.id === 'R-A-1').milestone).toBe('M1');
        expect(out.rows.find((r: any) => r.id === 'R-A-2').milestone).toBe('M2');
    });
});

// ── clusters ─────────────────────────────────────────────────────────────────

describe('req-trace: Louvain and the co-citation graph', () => {
    // Two 4-cliques joined by one edge: m = 13, each side in = 12 (twice its 6 edges), tot = 13.
    const A = ['a1', 'a2', 'a3', 'a4'], B = ['b1', 'b2', 'b3', 'b4'];
    const clique = (xs: string[]) => xs.flatMap((x, i) => xs.slice(i + 1).map((y) => [x, y, 1]));
    const edges = [...clique(A), ...clique(B), ['a1', 'b1', 1]];

    test('kills "no local moving", "modularity misread": two cliques and a bridge split in two, Q = 2(12/26 - (13/26)^2)', () => {
        const { membership, modularity } = rt.louvain([...A, ...B], edges, { seed: 7 });
        const ca = new Set(A.map((x) => membership.get(x)));
        const cb = new Set(B.map((x) => membership.get(x)));
        expect(ca.size).toBe(1);
        expect(cb.size).toBe(1);
        expect([...ca][0]).not.toBe([...cb][0]);
        expect(modularity).toBeCloseTo(2 * (12 / 26 - (13 / 26) ** 2), 6);
    });

    test('kills "an unseeded order", "the seed ignored": on a 12-ring, where the visiting order decides, the same seed repeats and different seeds differ', () => {
        const ring12 = Array.from({ length: 12 }, (_, i) => 'c' + i);
        const ringEdges = ring12.map((x, i) => [x, ring12[(i + 1) % 12], 1]);
        const parts = new Set<string>();
        for (let s = 1; s <= 30; s++) {
            const one = JSON.stringify([...rt.louvain(ring12, ringEdges, { seed: s }).membership.entries()]);
            const two = JSON.stringify([...rt.louvain(ring12, ringEdges, { seed: s }).membership.entries()]);
            expect(two).toBe(one);
            parts.add(one);
        }
        expect(parts.size).toBeGreaterThan(1);
    });

    test('kills "cliques merged": a ring of six 4-cliques splits into the six cliques', () => {
        const ring: any[] = [];
        const nodes: string[] = [];
        for (let k = 0; k < 6; k++) {
            const xs = [0, 1, 2, 3].map((i) => 'n' + k + '_' + i);
            nodes.push(...xs);
            ring.push(...clique(xs), ['n' + k + '_0', 'n' + ((k + 1) % 6) + '_1', 1]);
        }
        const one = rt.louvain(nodes, ring, { seed: 42 });
        const two = rt.louvain(nodes, ring, { seed: 42 });
        expect([...one.membership.entries()]).toEqual([...two.membership.entries()]);
        expect(new Set(one.membership.values()).size).toBe(6);
    });

    test('kills "prompts above 25 rows kept", "merge prompts kept": the co-citation graph drops both', () => {
        const known = new Set(Array.from({ length: 30 }, (_, i) => 'R-Z-' + (i + 1)));
        const prompts = [
            { name: 'claude_2026-10-01_1000_prompt_a.md', text: '# Prompt: a\n\nLane: fast\n\nR-Z-1 and R-Z-2' },
            { name: 'claude_2026-10-01_1100_prompt_merge_b.md', text: '# Prompt: merge b into trunk\n\nLane: full (merge)\n\nR-Z-1 and R-Z-3' },
            { name: 'claude_2026-10-01_1200_prompt_c.md', text: '# Prompt: c\n\nLane: fast\n\nR-Z-1..26' },
        ];
        const g = rt.coCitation(prompts, known);
        expect(g.edges).toEqual([['R-Z-1', 'R-Z-2', 1]]);
        expect(g.excluded.sort()).toEqual(['claude_2026-10-01_1100_prompt_merge_b.md', 'claude_2026-10-01_1200_prompt_c.md']);
    });

    test('kills "the key not the smallest member", "cluster-names.json ignored": a stable key, an automatic label, and a human name that wins', () => {
        const rows = [
            { id: 'R-Q-10', family: 'R-Q', title: 'Board lanes colour' },
            { id: 'R-Q-9', family: 'R-Q', title: 'Board lanes timeline' },
            { id: 'R-P-1', family: 'R-P', title: 'Board lanes insights' },
            { id: 'R-W-1', family: 'R-W', title: 'Alone' },
        ];
        const prompts = [{ name: 'p1.md', text: 'R-Q-10 R-Q-9 R-P-1' }];
        const auto = rt.clusterRows(rows, prompts, { seed: 1 });
        expect(auto.list).toHaveLength(1);
        expect(auto.list[0].key).toBe('R-P-1');
        expect(auto.list[0].auto).toMatch(/^R-Q · R-P — board, lanes, (colour|insights|timeline)$/);
        expect(auto.list[0].name).toBe(auto.list[0].auto);
        expect(auto.unclusteredShare).toBeCloseTo(1 / 4, 6);
        const named = rt.clusterRows(rows, prompts, { seed: 1, names: { 'R-P-1': 'The lane board' } });
        expect(named.list[0].name).toBe('The lane board');
    });
});

// ── the goal model ───────────────────────────────────────────────────────────

describe('req-trace: the goal-model join', () => {
    const rows = [
        { id: 'R-A-1', realized: true, cluster: 'R-A-1' },
        { id: 'R-A-2', realized: true, cluster: 'R-A-1' },
        { id: 'R-A-3', realized: false, cluster: 'R-A-1' },
        { id: 'R-B-1', realized: true, cluster: null },
    ];
    const clusters = { list: [{ key: 'R-A-1', members: ['R-A-1', 'R-A-2', 'R-A-3'] }] };
    const goals = {
        softgoals: [{ id: 'SG-1', name: 'Speed', description: '' }, { id: 'SG-2', name: 'Clarity', description: '' }],
        contributions: [
            { req: 'R-A-1', softgoal: 'SG-1', kind: 'help', evidence: 'measured', verified: 'agent', why: 'faster' },
            { req: 'R-A-2', softgoal: 'SG-1', kind: 'break', evidence: 'read', verified: 'none', why: 'slower' },
            { req: 'R-A-3', softgoal: 'SG-1', kind: 'hurt', evidence: 'inferred', verified: 'none', why: 'not built' },
            { req: 'R-B-1', softgoal: 'SG-2', kind: 'some+', evidence: 'read', verified: 'none', why: 'clearer' },
        ],
        conflicts: [{ a: 'R-A-1', b: 'R-A-2', softgoal: 'SG-1', why: 'declared', evidence: 'read' }],
    };

    test('kills "contributions not joined", "help and hurt swapped", "unrealized rows in the opposing pairs": per row, per cluster, and the opposing pairs', () => {
        const g = rt.joinGoals(rows, clusters, goals);
        expect(g.present).toBe(true);
        expect(rows[0]).toHaveProperty('contributions');
        expect((rows[0] as any).contributions).toEqual([{ softgoal: 'SG-1', kind: 'help', evidence: 'measured', verified: 'agent', why: 'faster' }]);
        expect((clusters.list[0] as any).goals).toEqual({ 'SG-1': { help: 1, hurt: 2 } });
        expect(g.opposing).toEqual([{ a: 'R-A-1', b: 'R-A-2', softgoal: 'SG-1' }]);
        expect(g.conflicts).toHaveLength(1);
        expect(g.softgoals.map((s: any) => s.id)).toEqual(['SG-1', 'SG-2']);
    });

    test('kills "an absent goal model read as empty": no files, present false and no contributions', () => {
        const rs = [{ id: 'R-A-1', realized: true, cluster: null }];
        const g = rt.joinGoals(rs, { list: [] }, null);
        expect(g.present).toBe(false);
        expect((rs[0] as any).contributions).toEqual([]);
    });
});

// ── the goal tree, the correlations and the balance (P-2026-10-11-1735) ──────

describe('req-trace: the goal tree, the correlations and the balance per softgoal', () => {
    // Rows out of id order (R-A-10 before R-A-2, as a register may list them); R-A-3 is not realized. SG-3 is in no
    // macro goal and has no realized contribution; SG-2 is helped by no realized row.
    const rows = () => [
        { id: 'R-A-10', realized: true, cluster: 'R-A-1' },
        { id: 'R-B-1', realized: true, cluster: null },
        { id: 'R-A-2', realized: true, cluster: 'R-A-1' },
        { id: 'R-A-3', realized: false, cluster: 'R-A-1' },
        { id: 'R-A-1', realized: true, cluster: 'R-A-1' },
    ];
    const clusters = () => ({ list: [{ key: 'R-A-1', members: ['R-A-1', 'R-A-2', 'R-A-3', 'R-A-10'] }] });
    const c = (req: string, softgoal: string, kind: string) => ({ req, softgoal, kind, evidence: 'read', verified: 'none', why: req });
    const tree = [{ id: 'MG-1', name: 'Usability', description: 'The first macro goal.', softgoals: ['SG-1', 'SG-2'] }];
    const correlations = [{ from: 'SG-1', to: 'SG-2', kind: 'some-', witnesses: ['R-A-1', 'R-A-2'], evidence: 'read', verified: 'agent', why: 'One costs the other.' }];
    const goals = (extra: Record<string, unknown> = {}) => ({
        softgoals: [{ id: 'SG-1', name: 'One', description: '' }, { id: 'SG-2', name: 'Two', description: '' }, { id: 'SG-3', name: 'Three', description: '' }],
        contributions: [
            c('R-A-10', 'SG-1', 'help'), c('R-B-1', 'SG-1', 'hurt'), c('R-A-2', 'SG-1', 'some+'), c('R-A-3', 'SG-1', 'help'), c('R-A-1', 'SG-1', 'make'),
            c('R-A-2', 'SG-2', 'some-'), c('R-A-3', 'SG-2', 'some+'), c('R-B-1', 'SG-2', 'break'), c('R-A-10', 'SG-2', 'hurt'), c('R-A-3', 'SG-3', 'hurt'),
        ],
        conflicts: [],
        ...extra,
    });

    test('kills "balance over unrealized rows", "help and hurt swapped", "ids in register order", "ids in string order", "a softgoal without contributions left out": one entry per softgoal, in softgoals order, realized rows only, ids in natural id order', () => {
        const g = rt.joinGoals(rows(), clusters(), goals({ tree, correlations }));
        expect(g.balance).toEqual([
            { softgoal: 'SG-1', help: ['R-A-1', 'R-A-2', 'R-A-10'], hurt: ['R-B-1'] },
            { softgoal: 'SG-2', help: [], hurt: ['R-A-2', 'R-A-10', 'R-B-1'] },
            { softgoal: 'SG-3', help: [], hurt: [] },
        ]);
    });

    test('kills "the tree or the correlations not passed through", "opposing changed": tree and correlations are the files as read, and opposing is still the product of the two sides of the balance', () => {
        const g = rt.joinGoals(rows(), clusters(), goals({ tree, correlations }));
        expect(g.tree).toEqual(tree);
        expect(g.correlations).toEqual(correlations);
        const product = g.balance.flatMap((b: any) => b.help.flatMap((a: string) => b.hurt.filter((x: string) => x !== a).map((x: string) => a + ' ' + x + ' ' + b.softgoal)));
        expect(g.opposing.map((p: any) => p.a + ' ' + p.b + ' ' + p.softgoal).sort()).toEqual(product.sort());
        expect(g.opposing).toEqual([{ a: 'R-A-10', b: 'R-B-1', softgoal: 'SG-1' }, { a: 'R-A-2', b: 'R-B-1', softgoal: 'SG-1' }, { a: 'R-A-1', b: 'R-B-1', softgoal: 'SG-1' }]);
    });

    test('kills "an absent tree or correlations file an error or undefined", "no balance without a goal model": absent files give empty arrays', () => {
        const g = rt.joinGoals(rows(), clusters(), goals());
        expect([g.tree, g.correlations]).toEqual([[], []]);
        expect(g.balance).toHaveLength(3);
        const none = rt.joinGoals(rows(), clusters(), null);
        expect([none.present, none.tree, none.correlations, none.balance]).toEqual([false, [], [], []]);
    });

    test('kills "goal-tree.json not read", "correlations.json not read", "an absent file an error": end to end, both files reach goalModel as written, and without them the run exits 0 with empty arrays', () => {
        const fx = fixtureRepo();
        mkdirSync(join(fx.repo, 'docs', 'goals'));
        writeFileSync(join(fx.repo, 'docs', 'goals', 'softgoals.json'), JSON.stringify(goals().softgoals));
        writeFileSync(join(fx.repo, 'docs', 'goals', 'contributions.json'), JSON.stringify([c('R-A-2', 'SG-1', 'help'), c('R-A-1', 'SG-1', 'some-'), c('R-B-1', 'SG-1', 'help'), c('R-B-1', 'SG-3', 'hurt')]));
        const bare = reqTrace(['--repo', fx.repo, '--trunk', 'trunk', '--no-cache']);
        expect([bare.goalModel.tree, bare.goalModel.correlations]).toEqual([[], []]);
        // R-B-1 is not realized (its commit never reached the trunk): on neither side.
        expect(bare.goalModel.balance).toEqual([
            { softgoal: 'SG-1', help: ['R-A-2'], hurt: ['R-A-1'] }, { softgoal: 'SG-2', help: [], hurt: [] }, { softgoal: 'SG-3', help: [], hurt: [] },
        ]);
        writeFileSync(join(fx.repo, 'docs', 'goals', 'goal-tree.json'), JSON.stringify(tree));
        writeFileSync(join(fx.repo, 'docs', 'goals', 'correlations.json'), JSON.stringify(correlations));
        const out = reqTrace(['--repo', fx.repo, '--trunk', 'trunk', '--no-cache']);
        expect(out.goalModel.tree).toEqual(tree);
        expect(out.goalModel.correlations).toEqual(correlations);
        expect(out.goalModel.opposing).toEqual([{ a: 'R-A-2', b: 'R-A-1', softgoal: 'SG-1' }]);
    });
});

// ── mixed rows and a second entry of one sign (P-2026-10-11-2025) ────────────

describe('req-trace: a mixed row, and a second entry of the same sign', () => {
    const rows = () => [
        { id: 'R-A-1', realized: true, cluster: 'R-A-1' },
        { id: 'R-A-2', realized: true, cluster: 'R-A-1' },
        { id: 'R-B-1', realized: true, cluster: null },
    ];
    const clusters = () => ({ list: [{ key: 'R-A-1', members: ['R-A-1', 'R-A-2'] }] as any[] });
    const c = (req: string, softgoal: string, kind: string, why = req) => ({ req, softgoal, kind, evidence: 'read', verified: 'none', why });
    const softgoals = [{ id: 'SG-1', name: 'One', description: '' }];

    test('kills "a mixed row on one side only", "a mixed row paired with itself", "the negative of a mixed row refused": R-A-1 helps and hurts SG-1, so it is in both lists of the balance and opposes every other row of the other side, never itself', () => {
        const rs = rows(), cl = clusters();
        const g = rt.joinGoals(rs, cl, { softgoals, contributions: [c('R-A-1', 'SG-1', 'help'), c('R-A-2', 'SG-1', 'some-'), c('R-A-1', 'SG-1', 'some-'), c('R-B-1', 'SG-1', 'some+')], conflicts: [] });
        expect(g.balance).toEqual([{ softgoal: 'SG-1', help: ['R-A-1', 'R-B-1'], hurt: ['R-A-1', 'R-A-2'] }]);
        expect(g.opposing).toEqual([{ a: 'R-A-1', b: 'R-A-2', softgoal: 'SG-1' }, { a: 'R-B-1', b: 'R-A-1', softgoal: 'SG-1' }, { a: 'R-B-1', b: 'R-A-2', softgoal: 'SG-1' }]);
        expect((rs[0] as any).contributions.map((x: any) => x.kind)).toEqual(['help', 'some-']);
        expect(cl.list[0].goals).toEqual({ 'SG-1': { help: 1, hurt: 2 } });
        expect(g.duplicates).toEqual([]);
    });

    test('kills "a second entry of one sign joined", "the first entry dropped instead", "the refusal silent": a second entry of the same sign on one pair is refused, the first in file order joined and the other listed in duplicates; the opposite sign still joins', () => {
        const rs = rows(), cl = clusters();
        const g = rt.joinGoals(rs, cl, {
            softgoals, conflicts: [],
            contributions: [c('R-A-1', 'SG-1', 'help', 'first'), c('R-A-1', 'SG-1', 'some+', 'second'), c('R-A-2', 'SG-1', 'hurt', 'one'), c('R-A-2', 'SG-1', 'some-', 'two'), c('R-A-2', 'SG-1', 'help', 'mixed')],
        });
        expect((rs[0] as any).contributions.map((x: any) => x.why)).toEqual(['first']);
        expect((rs[1] as any).contributions.map((x: any) => x.why)).toEqual(['one', 'mixed']);
        expect(cl.list[0].goals).toEqual({ 'SG-1': { help: 2, hurt: 1 } });
        expect(g.duplicates).toEqual([{ req: 'R-A-1', softgoal: 'SG-1', kind: 'some+' }, { req: 'R-A-2', softgoal: 'SG-1', kind: 'some-' }]);
        expect(rt.joinGoals(rows(), clusters(), null).duplicates).toEqual([]);
    });
});

// ── the written descriptions of the clusters (P-2026-10-11-1510) ─────────────

describe('req-trace: the written descriptions of the clusters', () => {
    const list = () => [
        { key: 'R-A-1', members: ['R-A-1', 'R-A-2', 'R-A-3', 'R-A-10'] },
        { key: 'R-C-1', members: ['R-C-1', 'R-C-2'] },
        { key: 'R-D-1', members: ['R-D-1', 'R-D-2'] },
    ];
    const descriptions = {
        'R-Z-9': { description: 'A cluster that is gone.', members: ['R-Z-9', 'R-Z-10'], written: '2026-10-01', by: 'P-2026-10-01-0900' },
        'R-C-1': { description: 'The C rows.', members: ['R-C-2', 'R-C-1'], written: '2026-10-09', by: 'P-2026-10-09-1000' },
        'R-A-1': { description: 'The A rows.', members: ['R-B-1', 'R-A-1', 'R-A-3', 'R-A-20'], written: '2026-10-11', by: 'P-2026-10-11-1510' },
        'R-B-5': { description: 'Another orphan.', members: ['R-B-5'], written: '2026-10-02', by: 'P-2026-10-02-0900' },
    };

    test('kills "attached by position", "attached to a key it does not name", "drift without a description": a description joins the cluster of its key; a cluster with none has description and drift null', () => {
        const l = list();
        rt.attachDescriptions(l, descriptions);
        expect(l.map((c: any) => c.description)).toEqual(['The A rows.', 'The C rows.', null]);
        expect(l[2].descriptionDrift).toBe(null);
        expect(l[1].descriptionDrift).toEqual({ written: '2026-10-09', by: 'P-2026-10-09-1000', added: [], removed: [] });
    });

    test('kills "added and removed swapped", "removed never computed", "the drift in file order": the members gained and lost since the writing, each in id order', () => {
        const l = list();
        rt.attachDescriptions(l, descriptions);
        expect(l[0].descriptionDrift).toEqual({ written: '2026-10-11', by: 'P-2026-10-11-1510', added: ['R-A-2', 'R-A-10'], removed: ['R-A-20', 'R-B-1'] });
    });

    test('kills "orphans dropped", "orphans in file order": the keys no cluster carries are returned in id order and attached nowhere', () => {
        const l = list();
        expect(rt.attachDescriptions(l, descriptions)).toEqual(['R-B-5', 'R-Z-9']);
        expect(l.map((c: any) => c.description)).not.toContain('A cluster that is gone.');
    });

    test('kills "no descriptions file read as an error": without descriptions every cluster has null and null, and no orphan', () => {
        const l = list();
        expect(rt.attachDescriptions(l, null)).toEqual([]);
        expect(l.map((c: any) => [c.description, c.descriptionDrift])).toEqual([[null, null], [null, null], [null, null]]);
    });

    test('kills "cluster-descriptions.json not read", "orphans not in the document", "an absent file an error": end to end, the file joins by key, its orphans sit at the top level, and without it the run still exits 0', () => {
        const fx = fixtureRepo();
        writeFileSync(join(fx.repo, 'docs', 'prompts', 'claude_2026-10-01_0900_prompt_a.md'), '# Prompt: a\n\nLane: fast\n\nRows R-A-1 and R-A-2.\n');
        const bare = reqTrace(['--repo', fx.repo, '--trunk', 'trunk', '--no-cache']);
        expect(bare.clusters.list.map((c: any) => [c.key, c.description, c.descriptionDrift])).toEqual([['R-A-1', null, null]]);
        expect(bare.orphanDescriptions).toEqual([]);
        mkdirSync(join(fx.repo, 'docs', 'goals'));
        writeFileSync(join(fx.repo, 'docs', 'goals', 'cluster-descriptions.json'), JSON.stringify({
            'R-Q-1': { description: 'Orphan.', members: ['R-Q-1'], written: '2026-10-01', by: 'P-2026-10-01-0900' },
            'R-A-1': { description: 'First and second.', members: ['R-A-1', 'R-B-1'], written: '2026-10-11', by: 'P-2026-10-11-1510' },
        }));
        const out = reqTrace(['--repo', fx.repo, '--trunk', 'trunk', '--no-cache']);
        expect(out.clusters.list[0]).toMatchObject({ key: 'R-A-1', description: 'First and second.', descriptionDrift: { written: '2026-10-11', by: 'P-2026-10-11-1510', added: ['R-A-2'], removed: ['R-B-1'] } });
        expect(out.orphanDescriptions).toEqual(['R-Q-1']);
    });
});
