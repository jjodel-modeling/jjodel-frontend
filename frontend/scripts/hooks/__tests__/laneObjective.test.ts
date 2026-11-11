import { afterEach, describe, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { linkLane, readObjective, recordVerdict } from '../../lane-objective.mjs';

const dirs: string[] = [];
const A = 'P-2026-11-11-1000';
const B = 'P-2026-11-11-1001';
const C = 'P-2026-11-11-1002';
function lab() {
    const root = mkdtempSync(join(tmpdir(), 'lane-objective-'));
    dirs.push(root);
    for (const id of [A, B, C]) mkdirSync(join(root, id));
    return root;
}
afterEach(() => { for (const path of dirs.splice(0)) rmSync(path, { recursive: true, force: true }); });
const link = (root: string, lane = A, extra: Record<string, unknown> = {}) =>
    linkLane(root, { objective: 'feature-1', lane, kind: 'implementation', actor: 'reviewer', evidence: 'commit:abc', ...extra });

describe('objective evidence', () => {
    test('done is not acceptance, correction reopens and retains the acceptance history', () => {
        const root = lab();
        link(root, A, { kind: 'discovery' });
        link(root, B, { parent: A });
        writeFileSync(join(root, B, 'log.jsonl'), JSON.stringify({ type: 'result', result: 'Outcome: done' }));
        expect(readObjective(root, 'feature-1').state).toBe('open');
        expect(() => recordVerdict(root, { objective: 'feature-1', type: 'accept', actor: 'reviewer', evidence: '' })).toThrow('evidence');
        recordVerdict(root, { objective: 'feature-1', type: 'accept', actor: 'reviewer', evidence: 'smoke:passed' });
        expect(readObjective(root, 'feature-1').state).toBe('accepted');
        const before = readFileSync(join(root, '_objectives', 'events.jsonl'), 'utf8');
        link(root, C, { kind: 'correction', parent: B, reason: 'reproduced wrong output' });
        expect(readObjective(root, 'feature-1').state).toBe('open');
        expect(readFileSync(join(root, '_objectives', 'events.jsonl'), 'utf8').startsWith(before)).toBe(true);
        expect(readObjective(root, 'feature-1').events.map((e: any) => e.type)).toEqual(['link', 'link', 'accept', 'link', 'reopen']);
    });

    test('conflicting relinks, cycles, foreign parents and missing correction reasons are refused without a write', () => {
        const root = lab();
        link(root);
        link(root); // idempotent, not a second observation
        const file = join(root, '_objectives', 'events.jsonl');
        const before = readFileSync(file, 'utf8');
        for (const extra of [{ objective: 'other' }, { parent: A }, { kind: 'discovery' }]) expect(() => link(root, A, extra)).toThrow();
        expect(() => link(root, B, { kind: 'continuation', parent: C })).toThrow('parent');
        expect(() => link(root, B, { kind: 'correction', parent: A })).toThrow('reason');
        expect(() => link(root, B, { kind: 'continuation' })).toThrow('parent');
        expect(readFileSync(file, 'utf8')).toBe(before);
    });

    test('a held writer lock and corrupt journal refuse changes rather than overwriting history', () => {
        const root = lab();
        link(root);
        const lock = join(root, '_objectives', 'write.lock');
        mkdirSync(lock);
        expect(() => link(root, B)).toThrow('busy');
        rmSync(lock, { recursive: true });
        writeFileSync(join(root, '_objectives', 'events.jsonl'), '{bad');
        expect(() => link(root, B)).toThrow();
        expect(readFileSync(join(root, '_objectives', 'events.jsonl'), 'utf8')).toBe('{bad');
    });

    test('the CLI writes explicit acceptance and refuses a path-shaped ID', () => {
        const root = lab();
        const script = resolve(import.meta.dirname, '../../lane-objective.mjs');
        const run = (...args: string[]) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', env: { ...process.env, JJODEL_LANES: root } });
        expect(run('link', 'objective-a', A, '--kind', 'implementation', '--by', 'human', '--evidence', 'prompt:1').status).toBe(0);
        const accepted = run('accept', 'objective-a', '--by', 'human', '--evidence', 'test:12');
        expect(accepted.status, accepted.stderr).toBe(0);
        expect(JSON.parse(accepted.stdout).state).toBe('accepted');
        expect(run('show', '../outside').status).toBe(2);
    });
});
