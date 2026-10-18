import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runScript, file, REPO } from './hookRunner.ts';

// rule-trigger.mjs run as a child process with the event on stdin (P11), against a
// fixture map passed through JJODEL_RULE_TRIGGERS and a temp dir of its own per test
// (TMPDIR, read by os.tmpdir()). A test name states the mutation that turns it red.

const EV2 = 'frontend/src/components/editor-v2/CLAUDE.md';
const SYNC_DOC = 'docs/harness/sync-probe.md#Sync';
const MAP = {
    schema: 1,
    entries: [
        { glob: 'frontend/src/components/editor-v2/**', docs: [EV2], why: 'editor-v2 rules' },
        { glob: 'frontend/src/components/editor-v2/sync/*.ts', docs: [SYNC_DOC], why: 'sync rules' },
        { glob: 'frontend/src/jjtl/*', docs: ['frontend/src/jjtl/CLAUDE.md'], why: 'one level only' },
        { glob: '**/RULES-PROBE.md', docs: ['docs/probe.md'], why: 'any depth' },
    ],
};

let dir: string;
let mapFile: string;
let tmp: string;

beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'rule-trigger-test-'));
    tmp = join(dir, 'tmp');
    mkdirSync(tmp);
    mapFile = join(dir, 'map.json');
    writeFileSync(mapFile, JSON.stringify(MAP));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function run(path: string, opts: { session?: string; tool?: 'Edit' | 'Write' | 'NotebookEdit'; env?: Record<string, string>; payload?: unknown } = {}) {
    const tool = opts.tool ?? 'Edit';
    const input = tool === 'NotebookEdit' ? { notebook_path: path, new_source: 'x' } : tool === 'Write' ? { file_path: path, content: 'x' } : { file_path: path, old_string: 'a', new_string: 'b' };
    const payload = opts.payload ?? { ...file(tool, input), session_id: opts.session ?? 'sess-A', permission_mode: 'bypassPermissions' };
    return runScript('rule-trigger.mjs', payload, { CLAUDE_PROJECT_DIR: REPO, JJODEL_RULE_TRIGGERS: mapFile, TMPDIR: tmp, ...(opts.env ?? {}) });
}
const abs = (rel: string) => join(REPO, rel);
const markers = () => readdirSync(tmp).filter((n) => n.startsWith('jjodel-rule-trigger-'));

describe('rule-trigger: once per session per entry', () => {
    test('kills "never denies": the first write under editor-v2 is denied and names the doc', () => {
        const r = run(abs('frontend/src/components/editor-v2/hooks/useAlignment.ts'));
        expect(r.status).toBe(0);
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain(EV2);
        expect(r.reason).toContain('retry the same write');
        expect(markers()).toEqual(['jjodel-rule-trigger-sess-A.json']);
    });

    test('kills "the marker is not read or not written": the retry in the same session is allowed', () => {
        const p = abs('frontend/src/components/editor-v2/Canvas.tsx');
        expect(run(p).decision).toBe('deny');
        const again = run(p);
        expect(again.decision).toBeNull();
        expect(again.stdout).toBe('');
        expect(run(abs('frontend/src/components/editor-v2/panels/Other.tsx'), { tool: 'Write' }).decision).toBeNull();
    });

    test('kills "the marker is not per session": a new session fires again', () => {
        const p = abs('frontend/src/components/editor-v2/Canvas.tsx');
        expect(run(p, { session: 'sess-A' }).decision).toBe('deny');
        expect(run(p, { session: 'sess-B' }).decision).toBe('deny');
        expect(run(p, { session: 'sess-A' }).decision).toBeNull();
    });

    test('kills "one fired entry silences the others": another entry in the same session fires', () => {
        expect(run(abs('frontend/src/components/editor-v2/Canvas.tsx')).decision).toBe('deny');
        const r = run(abs('frontend/src/jjtl/parser.ts'));
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('frontend/src/jjtl/CLAUDE.md');
        expect(r.reason).not.toContain(EV2);
    });

    test('kills "only the first match fires": two globs on one path fire together, in one denial', () => {
        const r = run(abs('frontend/src/components/editor-v2/sync/syncState.ts'));
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain(EV2);
        expect(r.reason).toContain(SYNC_DOC);
        expect(run(abs('frontend/src/components/editor-v2/sync/syncState.ts')).decision).toBeNull();
    });

    test('kills "NotebookEdit path ignored": notebook_path is read', () => {
        expect(run(abs('frontend/src/components/editor-v2/n.ipynb'), { tool: 'NotebookEdit' }).decision).toBe('deny');
    });

    test('kills "path taken relative to cwd only": a relative file_path resolves against the project dir', () => {
        expect(run('frontend/src/components/editor-v2/x.ts').decision).toBe('deny');
    });
});

describe('rule-trigger: the glob matcher', () => {
    test('kills "** limited to one segment": a deep path under editor-v2/** fires', () => {
        expect(run(abs('frontend/src/components/editor-v2/a/b/c/d.ts')).decision).toBe('deny');
    });

    test('kills "* crosses a slash": jjtl/* fires one level down and not two', () => {
        expect(run(abs('frontend/src/jjtl/lexer/lexer.ts')).decision).toBeNull();
        expect(markers()).toEqual([]);
        expect(run(abs('frontend/src/jjtl/lexer.ts')).decision).toBe('deny');
    });

    test('kills "glob not anchored": a path that only contains the glob passes', () => {
        expect(run(abs('x/frontend/src/components/editor-v2/a.ts')).decision).toBeNull();
        expect(run(abs('frontend/src/components/editor-v2-old/a.ts')).decision).toBeNull();
    });
});

describe('rule-trigger: paths outside the map', () => {
    test('kills "fires everywhere": a path outside every glob is allowed and writes no marker', () => {
        const r = run(abs('frontend/src/utils/defaultViewTemplate.ts'));
        expect(r.decision).toBeNull();
        expect(r.stdout).toBe('');
        expect(markers()).toEqual([]);
    });

    test('kills "outside-repo allow removed": a path outside the repository is allowed, its in-repo twin is not', () => {
        const outside = run(join(dir, 'elsewhere', 'RULES-PROBE.md'));
        expect(outside.decision).toBeNull();
        expect(markers()).toEqual([]);
        expect(run(abs('docs/RULES-PROBE.md')).decision).toBe('deny');
    });
});

describe('rule-trigger: fails open with no decision', () => {
    const p = () => abs('frontend/src/components/editor-v2/Canvas.tsx');
    const quiet = (r: ReturnType<typeof run>) => {
        expect(r.status).toBe(0);
        expect(r.decision).toBeNull();
        expect(r.stdout).toBe('');
    };

    test('unparsable stdin', () => quiet(run(p(), { payload: '{not json' })));
    test('empty stdin', () => quiet(run(p(), { payload: '' })));
    test('no session_id', () => {
        const { session_id: _drop, ...rest } = { ...file('Edit', { file_path: p() }), session_id: 'x' };
        quiet(run(p(), { payload: rest }));
    });
    test('no file path', () => quiet(run(p(), { payload: { ...file('Edit', { old_string: 'a' }), session_id: 's' } })));
    test('missing map', () => quiet(run(p(), { env: { JJODEL_RULE_TRIGGERS: join(dir, 'absent.json') } })));
    test('map not JSON', () => {
        writeFileSync(mapFile, '{"schema": 1,');
        quiet(run(p()));
    });
    test('map not schema 1', () => {
        writeFileSync(mapFile, JSON.stringify({ ...MAP, schema: 2 }));
        quiet(run(p()));
    });
    test('map entry without docs', () => {
        writeFileSync(mapFile, JSON.stringify({ schema: 1, entries: [{ glob: 'frontend/**', docs: [] }] }));
        quiet(run(p()));
    });
    test('unwritable temp dir: no marker, so no denial', () => quiet(run(p(), { env: { TMPDIR: join(dir, 'no', 'such', 'dir') } })));
    test('a corrupt marker re-fires and is rewritten, it does not throw', () => {
        writeFileSync(join(tmp, 'jjodel-rule-trigger-sess-A.json'), 'garbage');
        expect(run(p()).decision).toBe('deny');
        expect(JSON.parse(readFileSync(join(tmp, 'jjodel-rule-trigger-sess-A.json'), 'utf8')).fired).toContain('frontend/src/components/editor-v2/**');
        expect(run(p()).decision).toBeNull();
    });
});

describe('rule-trigger: the live map', () => {
    test('the default map path is read when JJODEL_RULE_TRIGGERS is unset', () => {
        const r = runScript(
            'rule-trigger.mjs',
            { ...file('Write', { file_path: abs('frontend/src/jjel/x.ts'), content: 'x' }), session_id: 'live-map' },
            { CLAUDE_PROJECT_DIR: REPO, JJODEL_RULE_TRIGGERS: '', TMPDIR: tmp },
        );
        expect(r.decision).toBe('deny');
        expect(r.reason).toContain('frontend/src/jjel/CLAUDE.md');
    });
});
