import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runScript, file, HOOKS_DIR, REPO } from './hookRunner.ts';

// critical-zone.mjs run as a child process with the event on stdin (P11); a test
// name states the mutation of the script that turns it red (CLAUDE.md 5).

const SIX = [
    'frontend/src/components/editor-v2/hooks/useJjomSync.ts',
    'frontend/src/components/editor-v2/sync/syncState.ts',
    'frontend/src/components/editor-v2/sync/canvasToJjom.ts',
    'frontend/src/components/editor-v2/utils/portDistribution.ts',
    'frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts',
    'frontend/src/redux/VersionFixer.tsx',
];
const ROOTS = ['/Users/alfonso/jjodel-release/', '/Users/alfonso/jjodel/', '/tmp/other-checkout/'];

function zone(tool: 'Edit' | 'Write' | 'NotebookEdit', toolInput: Record<string, unknown>) {
    return runScript('critical-zone.mjs', file(tool, toolInput));
}
const edit = (path: string, extra: Record<string, unknown> = {}) =>
    zone('Edit', { file_path: path, old_string: 'a', new_string: 'b', replace_all: false, ...extra });

describe('critical-zone: the six files of CLAUDE.md 3.2', () => {
    test.each(SIX.flatMap((f) => ROOTS.map((r) => [f, r] as const)))(
        'kills "file missing from the list / matched by another root": %s under %s asks',
        (f, root) => {
            const r = edit(root + f);
            expect(r.decision).toBe('ask');
            expect(r.status).toBe(0);
            expect(r.reason).toContain('3.2');
            expect(r.reason).toContain(basename(f));
        },
    );

    test('kills "a Write is not checked": a Write of one of the six asks too', () => {
        expect(zone('Write', { file_path: ROOTS[0] + SIX[0], content: 'x' }).decision).toBe('ask');
    });

    test('kills "matched by basename": the same file name in another directory passes', () => {
        expect(edit('/x/frontend/src/other/useJjomSync.ts').decision).toBeNull();
        expect(edit('/x/frontend/src/components/editor-v2/hooks/VersionFixer.tsx').decision).toBeNull();
    });

    test('kills "matched by prefix": a file whose name only starts like one of the six passes', () => {
        expect(edit(ROOTS[0] + SIX[0] + '.bak').decision).toBeNull();
        expect(edit(ROOTS[0] + 'frontend/src/components/editor-v2/sync/syncState.test.ts').decision).toBeNull();
    });
});

describe('critical-zone: the 3.1 rows that are not 3.2 files stay quiet', () => {
    test.each([
        'frontend/src/components/editor-v2/viewpoint/authoring/TextStyleEditor.tsx',
        'frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts',
        'frontend/src/components/editor-v2/problems/registry.ts',
        'frontend/src/common/DV.tsx',
        'frontend/src/utils/defaultViewTemplate.ts',
        'frontend/src/components/editor-v2/hooks/useAlignment.ts',
        'docs/PROTOCOL.md',
        'CLAUDE.md',
    ])('kills "matcher widened to the 3.1 table": %s passes', (f) => {
        expect(edit(ROOTS[0] + f).decision).toBeNull();
    });
});

describe('critical-zone: D-layer write paths', () => {
    const anywhere = ROOTS[0] + 'frontend/src/common/x.tsx';
    test.each([['DVertex.new(a)'], ['DVoidEdge.new2(a)'], ['DVoidEdge.new3(a)']])(
        'kills "creator not matched": %s in new text asks',
        (call) => {
            const r = zone('Edit', { file_path: anywhere, old_string: 'a', new_string: 'const v = ' + call });
            expect(r.decision).toBe('ask');
            expect(r.reason).toContain(call.split('(')[0]);
        },
    );

    test('kills "only new text is read": a creator in the removed text asks', () => {
        expect(zone('Edit', { file_path: anywhere, old_string: 'DVertex.new(a)', new_string: '' }).decision).toBe('ask');
    });

    test('kills "Write content is not read": a creator in a written file asks', () => {
        expect(zone('Write', { file_path: anywhere, content: 'DVoidEdge.new2(x)' }).decision).toBe('ask');
    });

    test.each(['DVertex.newer(a)', 'xDVertex.new(a)', 'DVoidEdge.new23(a)', 'DVoidEdge.new(a)'])(
        'kills "token matched as a substring": %s passes',
        (text) => {
            expect(zone('Edit', { file_path: anywhere, old_string: 'a', new_string: text }).decision).toBeNull();
        },
    );

    test('kills "tests are in the zone": a creator in a test passes', () => {
        const t = ROOTS[0] + 'frontend/src/common/__tests__/x.test.ts';
        expect(zone('Edit', { file_path: t, old_string: 'a', new_string: 'DVertex.new(a)' }).decision).toBeNull();
        const u = ROOTS[0] + 'frontend/src/common/x.test.tsx';
        expect(zone('Edit', { file_path: u, old_string: 'a', new_string: 'DVertex.new(a)' }).decision).toBeNull();
    });

    test('kills "any path is under frontend/src": a creator named outside frontend/src passes', () => {
        const md = { old_string: 'a', new_string: 'DVertex.new(a)' };
        expect(zone('Edit', { file_path: ROOTS[0] + 'docs/PROTOCOL.md', ...md }).decision).toBeNull();
        expect(zone('Edit', { file_path: ROOTS[0] + 'frontend/scripts/x.ts', ...md }).decision).toBeNull();
    });

    test('kills "any file is source": a creator named in Markdown under frontend/src passes', () => {
        const md = { old_string: 'a', new_string: 'DVertex.new(a)' };
        expect(zone('Edit', { file_path: ROOTS[0] + 'frontend/src/common/NOTES.md', ...md }).decision).toBeNull();
    });

    test('kills "SetFieldAction matched everywhere": it asks in the sync directory and only there', () => {
        const text = { old_string: 'a', new_string: 'SetFieldAction.new(id, "f", 1)' };
        const sync = ROOTS[0] + 'frontend/src/components/editor-v2/sync/m1EdgeSweep.ts';
        expect(zone('Edit', { file_path: sync, ...text }).decision).toBe('ask');
        const hooks = ROOTS[0] + 'frontend/src/components/editor-v2/hooks/useClassRemoval.ts';
        expect(zone('Edit', { file_path: hooks, ...text }).decision).toBeNull();
        expect(zone('Edit', { file_path: anywhere, ...text }).decision).toBeNull();
    });

    test('kills "an edit to the sync directory always asks": no token, no ask', () => {
        const sync = ROOTS[0] + 'frontend/src/components/editor-v2/sync/m1EdgeSweep.ts';
        expect(zone('Edit', { file_path: sync, old_string: 'a', new_string: 'b' }).decision).toBeNull();
    });
});

describe('critical-zone: the shape of the answer and the failure mode', () => {
    test('a notebook edit is quiet for a notebook', () => {
        const r = zone('NotebookEdit', { notebook_path: '/x/notes.ipynb', new_source: 'x' });
        expect(r.status).toBe(0);
        expect(r.stdout).toBe('');
    });

    test('kills "notebook_path not read": the path of a NotebookEdit is judged like a file_path', () => {
        // No notebook can be one of the six .ts files; the input is synthetic and pins the reading.
        expect(zone('NotebookEdit', { notebook_path: ROOTS[0] + SIX[0], new_source: 'x' }).decision).toBe('ask');
    });

    test('kills "wrong output envelope": ask carries hookEventName, decision and a reason on stdout, exit 0', () => {
        const r = edit(ROOTS[0] + SIX[5]);
        const out = JSON.parse(r.stdout);
        expect(out.hookSpecificOutput.hookEventName).toBe('PreToolUse');
        expect(out.hookSpecificOutput.permissionDecision).toBe('ask');
        expect(out.hookSpecificOutput.permissionDecisionReason).toMatch(/Layer Impact Report/);
        expect(r.status).toBe(0);
    });

    test.each([
        ['not json', 'not json'],
        ['empty stdin', ''],
        ['no tool_input', '{"tool_name":"Edit"}'],
        ['no path', JSON.stringify({ tool_input: { old_string: 'a' } })],
        ['a path that is not a string', JSON.stringify({ tool_input: { file_path: 7 } })],
    ])('kills "an internal problem blocks": %s exits 0 with nothing on stdout', (_name, stdin) => {
        const r = runScript('critical-zone.mjs', stdin);
        expect(r.status).toBe(0);
        expect(r.stdout).toBe('');
    });
});

// ── The list against CLAUDE.md 3.2 ───────────────────────────────────────────

/** The differences between the constants of the script and the 3.2 sentence. */
function driftFrom(md: string, mod: { CRITICAL_FILES: string[]; D_LAYER_CREATORS: string[]; SYNC_TOKEN: string }) {
    const start = md.indexOf('### 3.2 ');
    const line = md.slice(start).split('\n').find((l) => l.startsWith('If the task explicitly touches')) || '';
    const tokens = [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    const files = tokens.filter((t) => /\.tsx?$/.test(t));
    const rest = tokens.filter((t) => !/\.tsx?$/.test(t));
    const drift: string[] = [];
    const have = new Set(mod.CRITICAL_FILES.map((f) => basename(f)));
    for (const f of files) if (!have.has(f)) drift.push('3.2 names ' + f + ', the script does not');
    for (const f of have) if (!files.includes(f)) drift.push('the script lists ' + f + ', 3.2 does not');
    const known = new Set([...mod.D_LAYER_CREATORS, mod.SYNC_TOKEN]);
    for (const t of rest) if (!known.has(t)) drift.push('3.2 names ' + t + ', the script does not');
    if (files.length === 0) drift.push('no file parsed out of 3.2');
    return { drift, files, rest };
}

describe('critical-zone: the constants against CLAUDE.md 3.2', () => {
    const md = readFileSync(resolve(REPO, 'CLAUDE.md'), 'utf8');
    const load = () => import(pathToFileURL(resolve(HOOKS_DIR, 'critical-zone.mjs')).href);

    test('the script and the 3.2 sentence name the same six files and the same D-layer tokens', async () => {
        const mod = await load();
        const { drift, files, rest } = driftFrom(md, mod);
        expect(files).toHaveLength(6); // the parse found the sentence: not an empty comparison
        expect(rest).toEqual(['DVoidEdge.new2', 'DVertex.new', 'SetFieldAction']);
        expect(drift).toEqual([]);
        expect(mod.CRITICAL_FILES.slice().sort()).toEqual(SIX.slice().sort());
    });

    test('the comparison discriminates: a file dropped from, or added to, 3.2 is reported', async () => {
        const mod = await load();
        expect(driftFrom(md.replace('`VersionFixer.tsx`, ', ''), mod).drift.length).toBeGreaterThan(0);
        expect(driftFrom(md.replace('`syncState.ts`,', '`syncState.ts`, `useAlignment.ts`,'), mod).drift.length).toBeGreaterThan(0);
        expect(driftFrom(md.replace('`DVertex.new`,', '`DVertex.new`, `DEdge.new`,'), mod).drift.length).toBeGreaterThan(0);
    });

    test('the third creator of the script is anchored in rule 12 of CLAUDE.md', async () => {
        const mod = await load();
        for (const token of mod.D_LAYER_CREATORS) expect(md).toContain(token);
    });

    test('every listed file exists in the tree: a rename cannot leave a dead entry', async () => {
        const mod = await load();
        for (const f of mod.CRITICAL_FILES) expect(() => readFileSync(resolve(REPO, f))).not.toThrow();
    });
});
