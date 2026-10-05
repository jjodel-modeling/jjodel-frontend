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
