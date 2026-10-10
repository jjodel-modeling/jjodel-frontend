import { describe, test, expect, afterAll } from 'vitest';
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// lane-board.mjs: how far a running lane has got (P-2026-10-05-1705). The pure part
// (milestones, the API shape, the log reader, the estimate) is imported; the board
// runs as a child process against a fake lanes folder and a fake lane-run. Fixture
// logs are in fixtures/lane-board/: four synthetic ones, one per kind, and a trimmed
// real one (P-2026-10-05-1110, a fast lane). A test name states the mutation of the
// script that turns it red (CLAUDE.md 5); the bench that established it is in the
// commit message.
//
// Ported to the trunk board in lane-board/ by P-2026-10-10-2021 (discovery
// P-2026-10-10-1806 §5): the board runs against a temp git repo (JJODEL_REPO), so
// launcherOf never reads a real checkout; the Running table draws the progress inside
// the Phase cell, without a column of its own (R1); an exited blocked lane holding
// resolved.txt reads resolved in /api and nowhere else (D5).
//
// LANE_BOARD points the suite at another copy of the script (the mutation bench).

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = process.env.LANE_BOARD ? resolve(process.env.LANE_BOARD) : resolve(HERE, '..', '..', 'lane-board', 'lane-board.mjs');
const FIX = join(HERE, 'fixtures', 'lane-board');

// The board read --port and LANE_BOARD_PORT before it learnt not to listen on import:
// a free port, never the live 4700, whatever the copy under test does.
process.env.LANE_BOARD_PORT = '0';

type Ev = Record<string, any>;
type Step = { name: string; reached: boolean; state: string };
type Milestones = { steps: Step[]; current: string };

const load = () => import(pathToFileURL(SCRIPT).href);
const events = (name: string): Ev[] =>
    readFileSync(join(FIX, name + '.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

/** The events of a log as it reads right after the result of its k-th tool call (0-based). */
function upTo(evs: Ev[], k: number): Ev[] {
    let n = 0, id = '', use = -1;
    evs.forEach((e, i) => {
        if (e.type !== 'assistant') return;
        for (const c of e.message?.content || []) {
            if (c.type !== 'tool_use') continue;
            if (n === k) { id = c.id; use = i; }
            n++;
        }
    });
    if (use < 0) throw new Error('no tool call ' + k);
    const res = evs.findIndex((e) => e.type === 'user' && (e.message?.content || []).some((c: Ev) => c.tool_use_id === id));
    return evs.slice(0, Math.max(use, res) + 1);
}

/** The log without its k-th tool call and that call's result. */
function without(evs: Ev[], k: number): Ev[] {
    let n = 0, id = '';
    for (const e of evs) for (const c of e.type === 'assistant' ? e.message?.content || [] : []) if (c.type === 'tool_use') { if (n === k) id = c.id; n++; }
    return evs.filter((e) => !(e.message?.content || []).some((c: Ev) => c.id === id || c.tool_use_id === id));
}

const view = (m: Milestones) => m.steps.map((s) => s.name + ':' + s.state);

const PHASE2 = ['Orient', 'Read', 'Tests first', 'Code', 'Gates', 'Probe', 'Commit', 'Closure'];

const dirs: string[] = [];
const children: ChildProcess[] = [];
afterAll(() => {
    for (const c of children) c.kill('SIGTERM');
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});
const tmp = () => { const d = mkdtempSync(join(tmpdir(), 'lane-board-')); dirs.push(d); return d; };

describe('milestones: phase2 ladder', () => {
    test('a full log reaches the eight milestones in order, the last one current', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('phase2', events('phase2'));
        expect(m.steps.map((s) => s.name)).toEqual(PHASE2);
        expect(m.steps.every((s) => s.reached && s.state === 'reached')).toBe(true);
        expect(m.current).toBe('Closure');
    });

    test('pwd and git log at the start reach Orient, nothing else (Orient not anchored before the first edit)', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('phase2', upTo(events('phase2'), 0));
        expect(view(m)).toEqual(['Orient:reached', ...PHASE2.slice(1).map((n) => n + ':pending')]);
        expect(m.current).toBe('Orient');
    });

    test('a typecheck before the code is a baseline, not Gates (Gates not anchored after Code)', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('phase2', upTo(events('phase2'), 1));
        expect(m.steps.find((s) => s.name === 'Gates')!.state).toBe('pending');
        expect(m.current).toBe('Orient');
    });

    test('a command that only names vitest runs nothing (vitest read as a bare word)', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('phase2', upTo(events('phase2'), 3));
        expect(view(m).slice(0, 3)).toEqual(['Orient:reached', 'Read:reached', 'Tests first:pending']);
        expect(m.current).toBe('Read');
    });

    test('a test file written before the code reaches Tests first', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('phase2', upTo(events('phase2'), 4));
        expect(m.current).toBe('Tests first');
    });

    test('an edit under frontend/src reaches Code, the later milestones stay pending', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('phase2', upTo(events('phase2'), 6));
        expect(view(m)).toEqual([
            'Orient:reached', 'Read:reached', 'Tests first:reached', 'Code:reached',
            'Gates:pending', 'Probe:pending', 'Commit:pending', 'Closure:pending',
        ]);
        expect(m.current).toBe('Code');
    });

    test('a commit line printed by a command that is not a commit is no commit (commit lines read from any result)', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('phase2', upTo(events('phase2'), 8));
        expect(view(m).slice(4)).toEqual(['Gates:reached', 'Probe:pending', 'Commit:pending', 'Closure:pending']);
    });

    test('lane-run probe after the code reaches Probe; the code commit reaches Commit and is no closure though its body names docs/log-inbox', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('phase2', upTo(events('phase2'), 10));
        expect(view(m).slice(4)).toEqual(['Gates:reached', 'Probe:reached', 'Commit:reached', 'Closure:pending']);
        expect(m.current).toBe('Commit');
    });

    test('a commit before any code is not the lane\'s commit (Commit not anchored after Code)', async () => {
        const { milestones } = await load();
        const evs = events('phase2');
        // The code commit moved to the start: a lane that commits a verbatim port first.
        const early = [...upTo(evs, 0), ...upTo(evs, 10).slice(upTo(evs, 9).length)];
        const m: Milestones = milestones('phase2', early);
        expect(m.steps.find((s) => s.name === 'Commit')!.state).toBe('pending');
        expect(m.current).toBe('Orient');
    });

    test('fast reads the phase2 ladder', async () => {
        const { milestones } = await load();
        expect(milestones('fast', []).steps.map((s: Step) => s.name)).toEqual(PHASE2);
    });
});

describe('milestones: fast, a harness lane', () => {
    test('code under frontend/scripts counts; tests after the code and a lane without probe read skipped', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('fast', events('fast'));
        expect(view(m)).toEqual([
            'Orient:reached', 'Read:reached', 'Tests first:skipped', 'Code:reached',
            'Gates:reached', 'Probe:skipped', 'Commit:reached', 'Closure:reached',
        ]);
        expect(m.current).toBe('Closure');
    });

    test('a test written after the code is not Tests first (Tests first not bounded by Code)', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('fast', upTo(events('fast'), 3));
        expect(view(m).slice(0, 4)).toEqual(['Orient:reached', 'Read:reached', 'Tests first:skipped', 'Code:reached']);
    });

    test('words inside a heredoc body are not commands (heredocs not stripped)', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('fast', upTo(events('fast'), 5));
        expect(view(m).slice(4)).toEqual(['Gates:reached', 'Probe:pending', 'Commit:pending', 'Closure:pending']);
        expect(m.current).toBe('Gates');
    });

    test('a commit the hook refused is no commit (is_error ignored)', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('fast', upTo(events('fast'), 6));
        expect(m.steps.find((s) => s.name === 'Commit')!.state).toBe('pending');
        expect(m.current).toBe('Gates');
    });

    test('a quiet commit reads its subject from the command (quiet commits dropped)', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('fast', upTo(events('fast'), 7));
        expect(m.current).toBe('Commit');
    });

    test('a call still waiting for its result is not a commit (pending result read as success)', async () => {
        const { milestones } = await load();
        const evs = events('fast');
        const cut = upTo(evs, 8);
        const m: Milestones = milestones('fast', cut.slice(0, cut.length - 1));
        expect(m.current).toBe('Commit');
    });
});

describe('milestones: discovery ladder', () => {
    test('a full log reaches Orient, Read, Probe, Report, Commit and Closure', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('discovery', events('discovery'));
        expect(m.steps.map((s) => s.name)).toEqual(['Orient', 'Read', 'Probe', 'Report', 'Commit', 'Closure']);
        expect(m.steps.every((s) => s.state === 'reached')).toBe(true);
    });

    test('a grep of frontend/src in the shell reaches Read (shell reads ignored)', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('discovery', upTo(events('discovery'), 1));
        expect(m.current).toBe('Read');
    });

    test('the report commit is a commit, not the closure (closure without log-inbox or Status)', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('discovery', upTo(events('discovery'), 5));
        expect(view(m).slice(3)).toEqual(['Report:reached', 'Commit:reached', 'Closure:pending']);
        expect(m.current).toBe('Commit');
    });

    test('without a probe, Probe reads skipped once the report is written', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('discovery', upTo(without(events('discovery'), 3), 3));
        expect(view(m)).toEqual(['Orient:reached', 'Read:reached', 'Probe:skipped', 'Report:reached', 'Commit:pending', 'Closure:pending']);
    });
});

describe('milestones: merge ladder', () => {
    test('a full log reaches Measure, Merge, Gates, Commit and Closure', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('merge', events('merge'));
        expect(m.steps.map((s) => s.name)).toEqual(['Measure', 'Merge', 'Gates', 'Commit', 'Closure']);
        expect(m.steps.every((s) => s.state === 'reached')).toBe(true);
    });

    test('git merge --abort is no merge (abort read as a merge)', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('merge', upTo(events('merge'), 2));
        expect(view(m)).toEqual(['Measure:reached', 'Merge:pending', 'Gates:pending', 'Commit:pending', 'Closure:pending']);
    });

    test('a quiet docs commit with the pathspec docs closes when the prompt was edited since the last commit', async () => {
        const { milestones } = await load();
        const evs = events('merge');
        expect((milestones('merge', upTo(evs, 6)) as Milestones).current).toBe('Commit');
        expect((milestones('merge', upTo(evs, 7)) as Milestones).current).toBe('Closure');
        // The same commit without the Edit of the prompt before it: no closure.
        expect((milestones('merge', without(evs, 6)) as Milestones).current).toBe('Commit');
    });

    test('a merge that commits by itself reaches Commit; the gates after it are still read', async () => {
        const { milestones } = await load();
        const use = (id: string, command: string) => ({ type: 'assistant', message: { content: [{ type: 'tool_use', id, name: 'Bash', input: { command } }] } });
        const res = (id: string, content: string) => ({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content }] } });
        const merged = [use('a', 'git merge --no-ff --no-edit sim-x'), res('a', "Merge made by the 'ort' strategy.\n 3 files changed")];
        expect(view(milestones('merge', merged))).toEqual(['Measure:skipped', 'Merge:reached', 'Gates:skipped', 'Commit:reached', 'Closure:pending']);
        const gated = [...merged, use('b', 'cd frontend && npm run build'), res('b', 'built')];
        expect(view(milestones('merge', gated))).toEqual(['Measure:skipped', 'Merge:reached', 'Gates:reached', 'Commit:reached', 'Closure:pending']);
    });
});

describe('milestones: edges', () => {
    test('a kind without a ladder has no milestones', async () => {
        const { milestones, progressOf } = await load();
        expect(milestones('', events('phase2'))).toBeNull();
        expect(progressOf('', events('phase2'))).toBeNull();
    });

    test('an empty log: every milestone pending, no current one', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('phase2', []);
        expect(m.steps.every((s) => s.state === 'pending')).toBe(true);
        expect(m.current).toBe('');
    });

    test('a git log after the first edit is not the opening: Orient reads skipped', async () => {
        const { milestones } = await load();
        const use = (id: string, name: string, input: Ev) => ({ type: 'assistant', message: { content: [{ type: 'tool_use', id, name, input }] } });
        const late = [use('a', 'Edit', { file_path: '/w/frontend/src/a.ts' }), use('b', 'Bash', { command: 'git log -1 --oneline' })];
        expect(view(milestones('phase2', late)).slice(0, 4)).toEqual(['Orient:skipped', 'Read:skipped', 'Tests first:skipped', 'Code:reached']);
    });

    test('events without a message or with odd content do not throw', async () => {
        const { milestones } = await load();
        const odd = [null, {}, { type: 'assistant' }, { type: 'assistant', message: { content: 'text' } }, { type: 'user', message: { content: [null] } }];
        expect(milestones('phase2', odd).current).toBe('');
    });
});

describe('milestones: files written through the shell', () => {
    // Lanes edit as often with a python3 heredoc or a redirection as with Edit: measured on the
    // logs of 2026-10-03..05, seven code lanes never used Edit on their code.
    const sh = (command: string, result = '') => {
        const id = 'toolu_' + Math.random().toString(36).slice(2);
        return [
            { type: 'assistant', message: { content: [{ type: 'tool_use', id, name: 'Bash', input: { command } }] } },
            { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content: result }] } },
        ];
    };
    const at = async (kind: string, evs: Ev[], name: string) => {
        const { milestones } = await load();
        return (milestones(kind, evs) as Milestones).steps.find((s) => s.name === name)!.state;
    };

    test('a python3 heredoc that opens a file under frontend/src to write reaches Code (program heredocs not read)', async () => {
        const evs = sh("cd /w/frontend && python3 - <<'EOF'\np = 'src/a.ts'\ns = open(p).read()\nopen(p, 'w').write(s.replace('a', 'b'))\nEOF");
        expect(await at('phase2', evs, 'Code')).toBe('reached');
    });

    test('a python3 heredoc that only reads a source file is no edit (any open read as a write)', async () => {
        const evs = sh("cd /w/frontend && python3 - <<'EOF'\nprint(open('src/a.ts').read())\nEOF");
        expect(await at('phase2', evs, 'Code')).toBe('pending');
    });

    test('a file literal in a program is not written unless the program opens it to write (every literal read as a write)', async () => {
        const evs = sh("cd /w/frontend/src/x/__tests__ && python3 - <<'EOF'\np = 'a.test.ts'\nnew = \"const f = '/w/frontend/src/b.ts'\"\nopen(p, 'w').write(new)\nEOF");
        expect(await at('phase2', evs, 'Code')).toBe('pending');
        expect(await at('phase2', evs, 'Tests first')).toBe('reached');
    });

    test('the cd before a heredoc places its relative path (cd ignored)', async () => {
        const evs = sh("cd /w/frontend/src/components && python3 - <<'EOF'\nopen('Panel.tsx', 'w').write('x')\nEOF");
        expect(await at('phase2', evs, 'Code')).toBe('reached');
    });

    test('a node heredoc that calls writeFileSync on a source file reaches Code', async () => {
        const evs = sh("node --input-type=module - <<'EOF'\nimport { writeFileSync } from 'node:fs';\nwriteFileSync('frontend/src/c.ts', '');\nEOF");
        expect(await at('phase2', evs, 'Code')).toBe('reached');
    });

    test('a redirection into frontend/src is code, into a _tmp_ probe or /tmp it is not', async () => {
        expect(await at('phase2', sh("cat > frontend/src/b.ts <<'EOF'\nexport {};\nEOF"), 'Code')).toBe('reached');
        expect(await at('phase2', sh("cat > frontend/scripts/smoke/_tmp_x.ts <<'EOF'\nx\nEOF"), 'Code')).toBe('pending');
        expect(await at('phase2', sh('cd frontend && npm run build > /tmp/build.txt 2>&1'), 'Code')).toBe('pending');
    });

    test('a redirection of a log under frontend/scripts is no code (source extension not required)', async () => {
        expect(await at('phase2', sh('cd frontend && npx vitest run scripts/hooks > scripts/hooks/out.txt'), 'Code')).toBe('pending');
    });

    test('sed -i on a source file is code; a > or a sed -i inside quotes is text (quotes not emptied)', async () => {
        expect(await at('phase2', sh("sed -i '' 's/a/b/' frontend/src/a.ts"), 'Code')).toBe('reached');
        expect(await at('phase2', sh("sed 's/=.*/=<x>/' frontend/src/a.ts | head"), 'Code')).toBe('pending');
        expect(await at('phase2', sh("command grep -rn \"sed -i\" frontend/src/a.ts"), 'Code')).toBe('pending');
    });

    test('a log entry appended through the shell lets a quiet docs commit from a message file close the lane', async () => {
        const evs = [
            ...sh("cd /w && python3 - <<'EOF'\np = 'docs/log-inbox/harness.md'\nopen(p, 'a').write('## entry')\nEOF"),
            ...sh('git commit -q -F /tmp/msg.txt -- docs'),
        ];
        expect(await at('phase2', evs, 'Closure')).toBe('reached');
        expect(await at('phase2', sh('git commit -q -F /tmp/msg.txt -- docs'), 'Closure')).toBe('pending');
    });

    test('pwd alone, or git log alone, opens a lane (one of the two dropped from Orient)', async () => {
        expect(await at('phase2', sh('pwd'), 'Orient')).toBe('reached');
        expect(await at('phase2', sh('git log -1 --oneline'), 'Orient')).toBe('reached');
    });

    test('a docs closure before any code is not the lane\'s closure (Closure not anchored after the code)', async () => {
        const evs = [
            ...sh("git commit -q -F - -- docs/prompts/p.md <<'EOF'\ndocs: Phase 1 Status (P-2026-10-05-0900)\nEOF"),
            ...sh("sed -i '' 's/a/b/' frontend/src/a.ts"),
        ];
        expect(await at('phase2', evs, 'Closure')).toBe('pending');
        expect(await at('phase2', evs.slice(0, 2), 'Closure')).toBe('reached');
    });

    test('a probe before the code is a negative control, not Probe (Probe not anchored after Code)', async () => {
        const probe = sh('~/.local/bin/node frontend/scripts/lane-run.mjs probe /w frontend/scripts/probe/a.ts --port 3090');
        const code = sh("sed -i '' 's/a/b/' frontend/src/a.ts");
        expect(await at('phase2', [...probe, ...code], 'Probe')).toBe('pending');
        expect(await at('phase2', [...code, ...probe], 'Probe')).toBe('reached');
    });

    test('a commit that git refused while the command still exited 0 is no commit (failure markers ignored)', async () => {
        const evs = [
            ...sh("sed -i '' 's/a/b/' frontend/src/a.ts"),
            ...sh("git commit -q -F - -- frontend/src/a.ts <<'EOF'\nfix: a (P-2026-10-05-0900)\nEOF\necho \"exit=$?\"", 'nothing added to commit but untracked files present\nexit=1'),
        ];
        expect(await at('phase2', evs, 'Commit')).toBe('pending');
    });

    test('a discovery commit before the report is not its commit (Commit not anchored after Report)', async () => {
        const evs = [
            ...sh("git commit -q -F - -- docs/notes.md <<'EOF'\ndocs: notes (P-2026-10-05-0900)\nEOF"),
            ...sh("cat > docs/discovery/discovery_2026-10-05_x.md <<'EOF'\n# x\nEOF"),
        ];
        expect(await at('discovery', evs, 'Report')).toBe('reached');
        expect(await at('discovery', evs, 'Commit')).toBe('pending');
    });

    test('a merge lane\'s docs commit before the merge is not its closure (Closure not anchored after the merge)', async () => {
        const evs = [
            ...sh("git commit -q -F - -- docs/prompts/p.md <<'EOF'\ndocs: Status (P-2026-10-05-0900)\nEOF"),
            ...sh('git merge --no-ff --no-commit sim-x'),
        ];
        expect(await at('merge', evs, 'Closure')).toBe('pending');
    });

    test('a redirect to /tmp before the opening git log is not a write in the tree (Orient bounded by any write)', async () => {
        const evs = [...sh('cd frontend && npm run typecheck > /tmp/base.txt 2>&1'), ...sh('pwd; git log -1 --oneline')];
        expect(await at('phase2', evs, 'Orient')).toBe('reached');
    });
});

describe('milestones: the real log of P-2026-10-05-1110 (fast, trimmed)', () => {
    test('seven of eight: no test before the code, so Tests first reads skipped', async () => {
        const { milestones } = await load();
        const m: Milestones = milestones('fast', events('real-fast-P-2026-10-05-1110'));
        expect(view(m)).toEqual([
            'Orient:reached', 'Read:reached', 'Tests first:skipped', 'Code:reached',
            'Gates:reached', 'Probe:reached', 'Commit:reached', 'Closure:reached',
        ]);
    });

    test('along the way: Code at the first edit, Gates at the typecheck, Probe at lane-run probe, Commit at the fix', async () => {
        const { milestones } = await load();
        const evs = events('real-fast-P-2026-10-05-1110');
        const at = (k: number) => (milestones('fast', upTo(evs, k)) as Milestones).current;
        expect([at(0), at(1), at(5), at(6), at(12), at(13), at(29), at(30), at(44), at(45), at(47), at(48)]).toEqual([
            'Orient', 'Read', 'Read', 'Code', 'Code', 'Gates', 'Gates', 'Probe', 'Probe', 'Commit', 'Commit', 'Closure',
        ]);
    });
});

describe('progressOf: the shape /api serves', () => {
    test('reached, total, current and the steps with their state', async () => {
        const { progressOf } = await load();
        expect(progressOf('phase2', upTo(events('phase2'), 6))).toEqual({
            reached: 4, total: 8, current: 'Code',
            steps: PHASE2.map((name, i) => ({ name, state: i < 4 ? 'reached' : 'pending' })),
        });
    });

    test('reached counts the reached steps, not the position of the current one', async () => {
        const { progressOf } = await load();
        const p = progressOf('fast', events('fast'));
        expect([p.reached, p.total, p.current]).toEqual([6, 8, 'Closure']);
    });
});

describe('compactEvent and laneEvents: the log as the board reads it', () => {
    test('compaction keeps everything the milestones read (a field the ladder reads dropped)', async () => {
        const { milestones, compactEvent } = await load();
        const cases: [string, string][] = [['phase2', 'phase2'], ['fast', 'fast'], ['discovery', 'discovery'], ['merge', 'merge'], ['fast', 'real-fast-P-2026-10-05-1110'], ['phase2', 'fast']];
        // A commit only git's line names: the message from a file, no pathspec, the log entry edited before it.
        const use = (id: string, name: string, input: Ev) => ({ type: 'assistant', message: { content: [{ type: 'tool_use', id, name, input }] } });
        const res = (id: string, content: string) => ({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content }] } });
        const byLine = [use('a', 'Edit', { file_path: '/w/docs/log-inbox/harness.md' }), use('b', 'Bash', { command: 'git commit -F /tmp/msg.txt' }), res('b', '[lane 1234567] docs: log entry (P-2026-10-05-0900)\n 1 file changed')];
        expect((milestones('phase2', byLine) as Milestones).current).toBe('Closure');
        expect(milestones('phase2', byLine.map(compactEvent).filter(Boolean))).toEqual(milestones('phase2', byLine));
        for (const [kind, name] of cases) {
            const evs = events(name);
            const small = evs.map(compactEvent).filter(Boolean);
            expect(milestones(kind, small)).toEqual(milestones(kind, evs));
            expect(JSON.stringify(small).length).toBeLessThan(JSON.stringify(evs).length);
        }
    });

    test('compaction keeps the milestones at every step of a log, not only at its end (a refused commit\'s is_error, a merge\'s own commit line dropped)', async () => {
        const { milestones, compactEvent } = await load();
        const cases: [string, string][] = [['phase2', 'phase2'], ['fast', 'fast'], ['discovery', 'discovery'], ['merge', 'merge'], ['fast', 'real-fast-P-2026-10-05-1110']];
        for (const [kind, name] of cases) {
            const evs = events(name);
            const calls = evs.reduce((n, e) => n + (e.type === 'assistant' ? (e.message?.content || []).filter((c: Ev) => c.type === 'tool_use').length : 0), 0);
            for (let k = 0; k < calls; k++) {
                const cut = upTo(evs, k);
                expect(milestones(kind, cut.map(compactEvent).filter(Boolean))).toEqual(milestones(kind, cut));
            }
        }
        // A merge that commits by itself: only git's "Merge made by" line says so.
        const use = (id: string, command: string) => ({ type: 'assistant', message: { content: [{ type: 'tool_use', id, name: 'Bash', input: { command } }] } });
        const res = (id: string, content: string) => ({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content }] } });
        const merged = [use('a', 'git merge --no-ff --no-edit sim-x'), res('a', "Merge made by the 'ort' strategy.\n 3 files changed")];
        expect((milestones('merge', merged) as Milestones).current).toBe('Commit');
        expect(milestones('merge', merged.map(compactEvent).filter(Boolean))).toEqual(milestones('merge', merged));
    });

    test('a growing log is read from where the last read stopped, a half-written line only once complete', async () => {
        const { laneEvents, compactEvent } = await load();
        const d = tmp();
        const log = join(d, 'log.jsonl');
        const text = readFileSync(join(FIX, 'phase2.jsonl'), 'utf8');
        const whole = text.split('\n').filter(Boolean).map((l) => compactEvent(JSON.parse(l))).filter(Boolean);
        const cut = text.indexOf('"tool_result"', text.length / 2);
        writeFileSync(log, text.slice(0, cut));
        const first = laneEvents(log).length;
        expect(first).toBeGreaterThan(0);
        expect(first).toBeLessThan(whole.length);
        appendFileSync(log, text.slice(cut));
        expect(laneEvents(log)).toEqual(whole);
        expect(laneEvents(log)).toEqual(whole);
    });

    test('a log that shrank is read again from the start (offset kept past a truncation)', async () => {
        const { laneEvents, compactEvent } = await load();
        const d = tmp();
        const log = join(d, 'log.jsonl');
        writeFileSync(log, readFileSync(join(FIX, 'phase2.jsonl')));
        laneEvents(log);
        const fast = readFileSync(join(FIX, 'fast.jsonl'), 'utf8');
        writeFileSync(log, fast);
        expect(laneEvents(log)).toEqual(fast.split('\n').filter(Boolean).map((l) => compactEvent(JSON.parse(l))).filter(Boolean));
    });

    test('a missing log reads as no events', async () => {
        const { laneEvents } = await load();
        expect(laneEvents(join(tmp(), 'nope.jsonl'))).toEqual([]);
    });
});

describe('estimate: the milestone fraction blended with the phase rule', () => {
    const steps = (names: string[], k: number) => names.map((name, i) => ({ name, state: i <= k ? 'reached' : 'pending' }));
    const prog = (k: number) => ({ reached: k + 1, total: 8, current: k < 0 ? '' : PHASE2[k], steps: steps(PHASE2, k) });

    test('without progress the rule is the old one, word for word', async () => {
        const { estimate } = await load();
        expect(estimate('phase2', 10, '', 1)).toBe('about 28 min');
        expect(estimate('phase2', 10, 'Run the tests first', 1)).toBe('about 30 min');
        expect(estimate('phase2', 10, 'Typecheck baseline', 1)).toBe('about 30 min');
        expect(estimate('fast', 10, '', 1)).toBe('past the median');
        expect(estimate('phase2', 10, 'Run the gates', 1)).toBe('under 5 min');
        expect(estimate('phase2', 10, 'Status flip', 1)).toBe('under 5 min');
        expect(estimate('phase2', 10, 'Run the probe', 1)).toBe('about 5-15 min');
        expect(estimate('phase2', 10, '', 25)).toBe('about 42 min');
        expect(estimate('', 10, '', 1)).toBe('?');
    });

    test('halfway up the ladder: the mean of the median left by the milestones and the phase rule', async () => {
        const { estimate } = await load();
        // Code is the 4th of 8: fraction 0.5, 38 x 0.5 = 19; the phase rule 38 - 10 = 28; the mean 23.5.
        expect(estimate('phase2', 10, '', 1, prog(3))).toBe('about 24 min');
        expect(estimate('phase2', 10, '', 25, prog(3))).toBe('about 35 min');
    });

    test('the fraction is the position of the current milestone: skipped steps count as behind', async () => {
        const { estimate } = await load();
        const state = (name: string) => (name === 'Orient' || name === 'Gates' ? 'reached' : PHASE2.indexOf(name) < 4 ? 'skipped' : 'pending');
        const p = { reached: 2, total: 8, current: 'Gates', steps: PHASE2.map((name) => ({ name, state: state(name) })) };
        // Gates is the 5th of 8: 38 x 3/8 = 14.25; with 28 from the phase rule, 21.125.
        expect(estimate('phase2', 10, '', 1, p)).toBe('about 21 min');
    });

    test('nothing reached yet: the full median on the milestone side', async () => {
        const { estimate } = await load();
        expect(estimate('phase2', 10, '', 1, prog(-1))).toBe('about 33 min');
    });

    test('far past the median, the blend still says so', async () => {
        const { estimate } = await load();
        expect(estimate('phase2', 60, '', 1, prog(4))).toBe('past the median');
    });

    test('at the last milestone the lane is closing (closure milestone ignored)', async () => {
        const { estimate } = await load();
        expect(estimate('phase2', 10, 'Read the log', 1, prog(7))).toBe('under 5 min');
    });

    test('the phase rule still wins where it names a gate or a probe', async () => {
        const { estimate } = await load();
        expect(estimate('phase2', 10, 'Run the gates', 1, prog(3))).toBe('under 5 min');
        expect(estimate('phase2', 10, 'Run the probe', 1, prog(3))).toBe('about 5-15 min');
    });
});

function freePort(): Promise<number> {
    return new Promise((res, rej) => {
        const s = createServer();
        s.once('error', rej);
        s.listen(0, '127.0.0.1', () => {
            const a = s.address();
            s.close(() => res(typeof a === 'object' && a ? a.port : 0));
        });
    });
}

/** An exited lane whose session ended on `Outcome: <outcome>`, as its log.jsonl records it. */
function exitedLane(root: string, id: string, outcome: string, resolved: boolean) {
    const dir = join(root, id);
    mkdirSync(dir);
    writeFileSync(join(dir, 'input-1.md'), '# Prompt: ' + outcome + '\n\nPrompt-ID: ' + id + '\nLane: fast\n');
    const text = 'Stopped.\nOutcome: ' + outcome;
    writeFileSync(join(dir, 'log.jsonl'), [
        { type: 'system', subtype: 'init', model: 'claude-opus-5-5', claude_code_version: '2.1.0' },
        { type: 'assistant', message: { content: [{ type: 'text', text }] } },
        { type: 'result', duration_ms: 60000, num_turns: 3, result: text },
    ].map((e) => JSON.stringify(e)).join('\n') + '\n');
    writeFileSync(join(dir, 'exit.txt'), '0\n');
    if (resolved) writeFileSync(join(dir, 'resolved.txt'), '2026-10-05 10:00 · Alfonso · fixed by hand\n');
}

/** The board as launchd runs it, against a lanes folder with two running lanes (one a direct merge) and four exited. */
async function board(): Promise<{ port: number; root: string }> {
    const root = tmp();
    // launcherOf reads `git log --all` of JJODEL_REPO: an empty repo here, never a real checkout.
    const repo = tmp();
    spawnSync('git', ['init', '-q', repo]);
    const lane = join(root, 'P-2026-10-05-0900');
    mkdirSync(lane);
    writeFileSync(join(lane, 'input-1.md'), '# Prompt: a lane\n\nPrompt-ID: P-2026-10-05-0900\nChat: C-2026-10-05-0800\nLane: full (harness)\nStatus: da eseguire\n');
    writeFileSync(join(lane, 'worktree.txt'), '/tmp/jjodel-w-fixture\n');
    writeFileSync(join(lane, 'tier.txt'), 'heavy claude-opus-5-5\n');
    writeFileSync(join(lane, 'log.jsonl'), upTo(events('phase2'), 6).map((e) => JSON.stringify(e)).join('\n') + '\n');
    const done = join(root, 'P-2026-10-05-0800');
    mkdirSync(done);
    writeFileSync(join(done, 'input-1.md'), '# Prompt: done\n\nLane: fast\n');
    // A direct merge: lane-run's worker writes this log, with no tool call a ladder could read (R3).
    const direct = join(root, 'P-2026-10-05-1000');
    mkdirSync(direct);
    writeFileSync(join(direct, 'input-1.md'), '# Prompt: merge\n\nPrompt-ID: P-2026-10-05-1000\nLane: full (merge; direct)\n');
    writeFileSync(join(direct, 'direct.json'), '{}\n');
    writeFileSync(join(direct, 'log.jsonl'), events('merge').map((e) => JSON.stringify(e)).join('\n') + '\n');
    exitedLane(root, 'P-2026-10-05-0700', 'blocked', true);
    exitedLane(root, 'P-2026-10-05-0600', 'blocked', false);
    exitedLane(root, 'P-2026-10-05-0500', 'done', true);
    const fake = join(root, 'fake-lane-run.mjs');
    writeFileSync(fake, [
        'id                  state    outcome  elapsed',
        'P-2026-10-05-1000   running  none     2 min',
        'P-2026-10-05-0900   running  none     12 min',
        'P-2026-10-05-0800   exited   done     6 min',
        'P-2026-10-05-0700   exited   blocked  20 min',
        'P-2026-10-05-0600   exited   blocked  20 min',
        'P-2026-10-05-0500   exited   done     20 min',
    ].map((l) => 'console.log(' + JSON.stringify(l) + ');').join('\n') + '\n');
    const port = await freePort();
    const child = spawn(process.execPath, [SCRIPT, '--port', String(port), '--refresh', '30'], {
        env: { ...process.env, JJODEL_LANES: root, LANE_RUN: fake, LANE_BOARD_PORT: '', JJODEL_REPO: repo, LANE_BOARD_CACHE: join(root, 'timeline-cache.json') },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.push(child);
    await new Promise<void>((res, rej) => {
        const t = setTimeout(() => rej(new Error('board did not start')), 10000);
        child.stdout!.on('data', (b) => { if (String(b).includes('lane-board on')) { clearTimeout(t); res(); } });
        child.on('exit', (code) => { clearTimeout(t); rej(new Error('board exited ' + code)); });
    });
    return { port, root };
}

describe('the board: /api and the page', () => {
    test('importing the board does not listen: its port can be taken (server started on import)', async () => {
        const held = createServer();
        const port = await new Promise<number>((res) => held.listen(0, '127.0.0.1', () => res((held.address() as { port: number }).port)));
        try {
            const code = "await import(process.argv[1]); console.log('imported');";
            const r = await new Promise<{ status: number | null; out: string }>((res) => {
                const c = spawn(process.execPath, ['--input-type=module', '-e', code, pathToFileURL(SCRIPT).href], {
                    env: { ...process.env, LANE_BOARD_PORT: String(port), JJODEL_LANES: tmp() }, stdio: ['ignore', 'pipe', 'pipe'],
                });
                let out = '';
                c.stdout!.on('data', (b) => { out += b; });
                c.stderr!.on('data', (b) => { out += b; });
                const t = setTimeout(() => c.kill('SIGKILL'), 10000);
                c.on('exit', (status) => { clearTimeout(t); res({ status, out }); });
            });
            expect(r.out).toContain('imported');
            expect(r.status).toBe(0);
        } finally {
            held.close();
        }
    });

    test('run through a symlinked path the board listens, with or without --preserve-symlinks-main (a side of the guard left unresolved)', async () => {
        const d = tmp();
        const link = join(d, 'lane-board.mjs');
        symlinkSync(SCRIPT, link);
        const listens = async (flags: string[]) => {
            const port = await freePort();
            const c = spawn(process.execPath, [...flags, link, '--port', String(port)], {
                env: { ...process.env, JJODEL_LANES: tmp(), LANE_BOARD_PORT: '', LANE_BOARD_CACHE: join(d, 'cache.json') }, stdio: ['ignore', 'pipe', 'pipe'],
            });
            children.push(c);
            return new Promise<boolean>((res) => {
                const t = setTimeout(() => { c.kill('SIGTERM'); res(false); }, 5000);
                c.stdout!.on('data', (b) => { if (String(b).includes('lane-board on')) { clearTimeout(t); c.kill('SIGTERM'); res(true); } });
                c.on('exit', () => { clearTimeout(t); res(false); });
            });
        };
        // Without the flag argv[1] is the link and import.meta.url the target; with it, both are the link.
        expect(await listens([])).toBe(true);
        expect(await listens(['--preserve-symlinks', '--preserve-symlinks-main'])).toBe(true);
    });

    test('/api gives a running row its progress and leaves the other rows as they were', async () => {
        const { port } = await board();
        const d = await (await fetch('http://127.0.0.1:' + port + '/api')).json();
        const live = d.rows.find((r: Ev) => r.id === 'P-2026-10-05-0900');
        const old = d.rows.find((r: Ev) => r.id === 'P-2026-10-05-0800');
        expect(live.kind).toBe('phase2');
        expect(live.progress).toEqual({
            reached: 4, total: 8, current: 'Code',
            steps: PHASE2.map((name, i) => ({ name, state: i < 4 ? 'reached' : 'pending' })),
        });
        expect(live.phase).toBe('Run the new tests (red)');
        // 12 minutes of a 38 median: 26 by the phase rule, 19 by the milestones (Code, 4 of 8), the mean 22.5.
        expect(live.left).toBe(Number(d.load[0]) > 20 ? 'about 34 min' : 'about 23 min');
        expect('progress' in old).toBe(false);
        expect(Object.keys(old).sort()).toEqual([
            'chain', 'chat', 'chatUrl', 'chatUrlFrom', 'chatUrlVia', 'day', 'end', 'id', 'kind', 'lane', 'launcher', 'left',
            'live', 'minutes', 'outcome', 'phase', 'recent', 'start', 'state', 't', 'tier', 'title', 'work', 'worktree',
        ]);

        // R1: no Progress column; the Phase cell draws the segments, the n/m and the phase text.
        const page = await (await fetch('http://127.0.0.1:' + port + '/')).text();
        expect(page).toContain("'Left','Phase','Worktree'");
        expect(page).not.toContain("'Progress'");
        expect(page).toMatch(/class="segs"/);
    });

    test('a direct merge running has progress null: its log is the worker\'s, not a session\'s (direct.json ignored)', async () => {
        const { port } = await board();
        const d = await (await fetch('http://127.0.0.1:' + port + '/api')).json();
        const row = d.rows.find((r: Ev) => r.id === 'P-2026-10-05-1000');
        expect(row.kind).toBe('merge');
        expect(row.live).toBe(true);
        expect('progress' in row).toBe(true);
        expect(row.progress).toBeNull();
    });

    test('an exited blocked lane holding resolved.txt reads resolved in /api; without it, or done, it keeps its outcome (overlay dropped or widened)', async () => {
        const { port } = await board();
        const d = await (await fetch('http://127.0.0.1:' + port + '/api')).json();
        const out = (id: string) => d.rows.find((r: Ev) => r.id === id).outcome;
        expect([out('P-2026-10-05-0700'), out('P-2026-10-05-0600'), out('P-2026-10-05-0500')]).toEqual(['resolved', 'blocked', 'done']);
        const page = await (await fetch('http://127.0.0.1:' + port + '/')).text();
        expect(page).toMatch(/\.resolved\b[^{]*\{color:var\(--ok\)\}/);
    });

    test('the Timeline data, the XES and trace exports and Insights keep the raw outcome of a resolved lane (overlay leaked past the Lanes tab)', async () => {
        const { port } = await board();
        const get = async (path: string) => (await fetch('http://127.0.0.1:' + port + path)).text();
        const tl = JSON.parse(await get('/api/timeline'));
        expect(tl.lanes.find((l: Ev) => l.id === 'P-2026-10-05-0700').outcome).toBe('blocked');
        const xes = await get('/export/lanes.xes');
        const trace = xes.split('<trace>').find((t) => t.includes('value="P-2026-10-05-0700"'))!;
        expect(trace).toContain('<string key="outcome" value="blocked"/>');
        expect(xes).not.toContain('resolved');
        expect(await get('/export/trace.json')).not.toContain('resolved');
        const ins = JSON.parse(await get('/api/insights'));
        expect(ins.lanes.find((l: Ev) => l.id === 'P-2026-10-05-0700').final).toBe('blocked');
    });
});
