import { describe, test, expect, afterAll } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// AM-1 (RC-49 (2), report docs/discovery/discovery_2026-10-15_lean_context_model_routing.md
// §5.4; batch B8c, P-2026-10-18-2125): the three model IDs live in .claude/settings.json
// (`model`, env.JJODEL_LIGHT_MODEL, env.JJODEL_REPORT_MODEL), and every agent or skill
// file whose frontmatter names a model names one of them. The read-only agents Explore,
// explorer and general-purpose name exactly env.JJODEL_LIGHT_MODEL (RC-49 (2) and (3), B7).
// The default input is the .claude/ of this worktree; the negative cases build their own
// in a temp dir. A test name states the mutation that turns it red.

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..');

const READ_ONLY = ['Explore', 'explorer', 'general-purpose'];
const SETTINGS = '.claude/settings.json';
const KEYS = [['heavy', 'model'], ['light', 'env.JJODEL_LIGHT_MODEL'], ['report', 'env.JJODEL_REPORT_MODEL']] as const;

type Ids = { heavy?: string; light?: string; report?: string };
type Result = { ids: Ids; covered: string[]; problems: string[] };

function wellFormed(id: unknown): id is string {
    if (typeof id !== 'string') return false;
    if (!id.startsWith('claude-')) return false;
    if (/\s/.test(id)) return false;
    return id.length > 'claude-'.length;
}

function readIds(root: string, problems: string[]): Ids {
    const path = join(root, SETTINGS);
    let json: { model?: unknown; env?: Record<string, unknown> };
    try {
        json = JSON.parse(readFileSync(path, 'utf8'));
    } catch (e) {
        problems.push(`${SETTINGS}: unreadable (${(e as Error).message})`);
        return {};
    }
    const raw = { heavy: json.model, light: json.env?.JJODEL_LIGHT_MODEL, report: json.env?.JJODEL_REPORT_MODEL };
    const ids: Ids = {};
    for (const [tier, key] of KEYS) {
        const v = raw[tier];
        if (v === undefined) problems.push(`${SETTINGS}: ${key} is missing; expected a model ID (claude-...)`);
        else if (!wellFormed(v)) problems.push(`${SETTINGS}: ${key} is ${JSON.stringify(v)}, not a model ID (claude- prefix, no spaces)`);
        else ids[tier] = v;
    }
    return ids;
}

// The model: line of the YAML frontmatter only: the file opens with a --- line and the
// frontmatter ends at the next --- line. A model: line in the body does not count.
function frontmatterModel(text: string): string | undefined {
    const lines = text.split(/\r?\n/);
    if (lines[0] !== '---') return undefined;
    const end = lines.indexOf('---', 1);
    if (end < 0) return undefined;
    for (const line of lines.slice(1, end)) {
        const m = /^model:\s*(.*?)\s*$/.exec(line);
        if (m) return m[1].replace(/^(["'])(.*)\1$/, '$2');
    }
    return undefined;
}

function modelFiles(root: string): string[] {
    const out: string[] = [];
    const agents = join(root, '.claude', 'agents');
    if (existsSync(agents)) {
        for (const f of readdirSync(agents).sort()) if (f.endsWith('.md')) out.push(`.claude/agents/${f}`);
    }
    const skills = join(root, '.claude', 'skills');
    if (existsSync(skills)) {
        for (const d of readdirSync(skills).sort()) {
            if (existsSync(join(skills, d, 'SKILL.md'))) out.push(`.claude/skills/${d}/SKILL.md`);
        }
    }
    return out;
}

function checkModels(root: string): Result {
    const problems: string[] = [];
    const ids = readIds(root, problems);
    const known = [ids.heavy, ids.light, ids.report].filter((x): x is string => !!x);
    const covered: string[] = [];
    for (const rel of modelFiles(root)) {
        const model = frontmatterModel(readFileSync(join(root, rel), 'utf8'));
        if (model === undefined) continue;
        covered.push(rel);
        const agent = /^\.claude\/agents\/(.+)\.md$/.exec(rel)?.[1];
        if (agent !== undefined && READ_ONLY.includes(agent)) {
            if (model !== ids.light) problems.push(`${rel}: read-only agent names ${model}; expected env.JJODEL_LIGHT_MODEL ${ids.light ?? '(not set)'}`);
        } else if (!known.includes(model)) {
            problems.push(`${rel}: names ${model}; expected one of ${known.join(', ') || '(no ID in settings)'}`);
        }
    }
    for (const agent of READ_ONLY) {
        if (!covered.includes(`.claude/agents/${agent}.md`)) {
            problems.push(`.claude/agents/${agent}.md: no model: line; expected env.JJODEL_LIGHT_MODEL ${ids.light ?? '(not set)'}`);
        }
    }
    return { ids, covered, problems };
}

// ---- temp fixtures ----

const HEAVY = 'claude-heavy-test';
const LIGHT = 'claude-light-test';
const REPORT = 'claude-report-test';
// The tests' own copy of the read-only names, so that a mutant of READ_ONLY cannot shrink them too.
const READ_ONLY_AGENTS = ['Explore', 'explorer', 'general-purpose'];
const dirs: string[] = [];

afterAll(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

function agent(name: string, model: string | undefined, body = 'Body.\n'): string {
    return ['---', `name: ${name}`, 'description: test agent', ...(model === undefined ? [] : [`model: ${model}`]), '---', '', body].join('\n');
}

function skill(name: string, model: string | undefined, body = 'Body.\n'): string {
    return ['---', `name: ${name}`, 'description: test skill', ...(model === undefined ? [] : [`model: ${model}`]), '---', '', body].join('\n');
}

type Fixture = { settings?: object; agents?: Record<string, string>; skills?: Record<string, string> };

function lab(f: Fixture = {}): string {
    const root = mkdtempSync(join(tmpdir(), 'agent-models-test-'));
    dirs.push(root);
    mkdirSync(join(root, '.claude', 'agents'), { recursive: true });
    mkdirSync(join(root, '.claude', 'skills'), { recursive: true });
    const settings = f.settings ?? { model: HEAVY, env: { JJODEL_LIGHT_MODEL: LIGHT, JJODEL_REPORT_MODEL: REPORT } };
    writeFileSync(join(root, SETTINGS), JSON.stringify(settings));
    const agents = f.agents ?? Object.fromEntries(READ_ONLY_AGENTS.map((n) => [n, agent(n, LIGHT)]));
    for (const [n, text] of Object.entries(agents)) writeFileSync(join(root, '.claude', 'agents', `${n}.md`), text);
    for (const [n, text] of Object.entries(f.skills ?? {})) {
        mkdirSync(join(root, '.claude', 'skills', n));
        writeFileSync(join(root, '.claude', 'skills', n, 'SKILL.md'), text);
    }
    return root;
}

function readOnlyOn(model: string, which: string): Record<string, string> {
    return Object.fromEntries(READ_ONLY_AGENTS.map((n) => [n, agent(n, n === which ? model : LIGHT)]));
}

// ---- the real .claude/ of this worktree ----

describe('the .claude/ of this worktree (AM-1)', () => {
    test('kills "settings not read", "ID check removed": the three IDs of settings.json are present and well formed', () => {
        const problems: string[] = [];
        const ids = readIds(REPO, problems);
        expect(problems).toEqual([]);
        for (const id of [ids.heavy, ids.light, ids.report]) {
            expect(id).toMatch(/^claude-\S+$/);
        }
    });

    test('kills "membership removed", "read-only rule removed": every agent and skill model is a settings ID, the read-only agents on the light one', () => {
        const r = checkModels(REPO);
        expect(r.problems).toEqual([]);
        expect(r.covered).toEqual(expect.arrayContaining(READ_ONLY_AGENTS.map((n) => `.claude/agents/${n}.md`)));
    });
});

// ---- the checker on temp fixtures ----

describe('settings IDs', () => {
    test('a complete fixture passes: no false alarm', () => {
        const r = checkModels(lab({ skills: { s1: skill('s1', REPORT), s2: skill('s2', undefined) } }));
        expect(r.problems).toEqual([]);
        expect(r.covered).toEqual(['.claude/agents/Explore.md', '.claude/agents/explorer.md', '.claude/agents/general-purpose.md', '.claude/skills/s1/SKILL.md']);
    });

    test('kills "missing key not reported": a missing env key fails naming the file and the key', () => {
        for (const [key, env] of [
            ['env.JJODEL_LIGHT_MODEL', { JJODEL_REPORT_MODEL: REPORT }],
            ['env.JJODEL_REPORT_MODEL', { JJODEL_LIGHT_MODEL: LIGHT }],
        ] as const) {
            const r = checkModels(lab({ settings: { model: HEAVY, env } }));
            expect(r.problems).toContain(`.claude/settings.json: ${key} is missing; expected a model ID (claude-...)`);
        }
        const noEnv = checkModels(lab({ settings: { model: HEAVY } }));
        expect(noEnv.problems.filter((p) => p.startsWith('.claude/settings.json:'))).toHaveLength(2);
        expect(noEnv.problems).toContain('.claude/agents/Explore.md: read-only agent names claude-light-test; expected env.JJODEL_LIGHT_MODEL (not set)');
    });

    test('kills "prefix unchecked", "spaces allowed": a malformed ID fails naming the file and the key', () => {
        const noPrefix = checkModels(lab({ settings: { model: 'opus-5-5', env: { JJODEL_LIGHT_MODEL: LIGHT, JJODEL_REPORT_MODEL: REPORT } } }));
        expect(noPrefix.problems).toEqual(['.claude/settings.json: model is "opus-5-5", not a model ID (claude- prefix, no spaces)']);
        const spaced = checkModels(lab({ settings: { model: HEAVY, env: { JJODEL_LIGHT_MODEL: LIGHT, JJODEL_REPORT_MODEL: 'claude-haiku 5-5' } } }));
        expect(spaced.problems).toEqual(['.claude/settings.json: env.JJODEL_REPORT_MODEL is "claude-haiku 5-5", not a model ID (claude- prefix, no spaces)']);
    });
});

describe('agent and skill models', () => {
    test('kills "membership always true", "membership by prefix": a stale ID in an agent or a skill fails naming the file and the expected IDs', () => {
        const r = checkModels(lab({
            agents: { ...readOnlyOn(LIGHT, ''), writer: agent('writer', 'claude-opus-5') },
            skills: { s1: skill('s1', 'claude-sonnet-5') },
        }));
        expect(r.problems).toEqual([
            `.claude/agents/writer.md: names claude-opus-5; expected one of ${HEAVY}, ${LIGHT}, ${REPORT}`,
            `.claude/skills/s1/SKILL.md: names claude-sonnet-5; expected one of ${HEAVY}, ${LIGHT}, ${REPORT}`,
        ]);
    });

    test('kills "report ID dropped from the set", "heavy ID dropped from the set": every one of the three IDs is accepted outside the read-only agents', () => {
        const r = checkModels(lab({
            agents: { ...readOnlyOn(LIGHT, ''), a: agent('a', HEAVY), b: agent('b', LIGHT), c: agent('c', REPORT) },
        }));
        expect(r.problems).toEqual([]);
    });

    test('kills "read-only rule removed", "a read-only name dropped": each read-only agent on the heavy ID fails naming the file and the light ID', () => {
        for (const which of READ_ONLY_AGENTS) {
            const r = checkModels(lab({ agents: readOnlyOn(HEAVY, which) }));
            expect(r.problems).toEqual([`.claude/agents/${which}.md: read-only agent names ${HEAVY}; expected env.JJODEL_LIGHT_MODEL ${LIGHT}`]);
        }
    });

    test('kills "read-only compared with the heavy ID": a read-only agent on the report ID fails too', () => {
        const r = checkModels(lab({ agents: readOnlyOn(REPORT, 'explorer') }));
        expect(r.problems).toEqual([`.claude/agents/explorer.md: read-only agent names ${REPORT}; expected env.JJODEL_LIGHT_MODEL ${LIGHT}`]);
    });

    test('kills "absent read-only model tolerated": a read-only agent with no model: line, or no file, fails naming the light ID', () => {
        const noLine = checkModels(lab({ agents: { ...readOnlyOn(LIGHT, ''), Explore: agent('Explore', undefined) } }));
        expect(noLine.problems).toEqual([`.claude/agents/Explore.md: no model: line; expected env.JJODEL_LIGHT_MODEL ${LIGHT}`]);
        const { 'general-purpose': _gone, ...two } = readOnlyOn(LIGHT, '');
        const noFile = checkModels(lab({ agents: two }));
        expect(noFile.problems).toEqual([`.claude/agents/general-purpose.md: no model: line; expected env.JJODEL_LIGHT_MODEL ${LIGHT}`]);
    });

    test('kills "skills not scanned": a skill is checked like an agent', () => {
        const r = checkModels(lab({ skills: { s1: skill('s1', 'claude-stale') } }));
        expect(r.covered).toContain('.claude/skills/s1/SKILL.md');
        expect(r.problems).toEqual([`.claude/skills/s1/SKILL.md: names claude-stale; expected one of ${HEAVY}, ${LIGHT}, ${REPORT}`]);
    });
});

describe('frontmatter parser', () => {
    test('kills "body counted": a model: line in the body is not the file\'s model', () => {
        const body = 'Example frontmatter:\n\n---\nmodel: claude-stale\n---\n\nmodel: claude-opus-5\n';
        const r = checkModels(lab({ agents: { ...readOnlyOn(LIGHT, ''), writer: agent('writer', undefined, body) }, skills: { s1: skill('s1', undefined, body) } }));
        expect(r.problems).toEqual([]);
        expect(r.covered).not.toContain('.claude/agents/writer.md');
        expect(r.covered).not.toContain('.claude/skills/s1/SKILL.md');
    });

    test('kills "frontmatter anywhere": a --- block that does not open the file is not frontmatter', () => {
        const text = 'Intro line.\n---\nmodel: claude-stale\n---\n';
        const r = checkModels(lab({ agents: { ...readOnlyOn(LIGHT, ''), writer: text } }));
        expect(r.problems).toEqual([]);
        expect(r.covered).not.toContain('.claude/agents/writer.md');
        expect(frontmatterModel('Intro line.\nmodel: claude-stale\n---\n')).toBeUndefined();
    });

    test('kills "quotes kept": a quoted model in the frontmatter is read unquoted', () => {
        const r = checkModels(lab({ agents: { ...readOnlyOn(LIGHT, ''), a: agent('a', `"${HEAVY}"`), b: agent('b', `'claude-stale'`) } }));
        expect(r.problems).toEqual([`.claude/agents/b.md: names claude-stale; expected one of ${HEAVY}, ${LIGHT}, ${REPORT}`]);
    });

    test('kills "unclosed frontmatter read": a file whose frontmatter never closes names no model', () => {
        expect(frontmatterModel('---\nname: x\nmodel: claude-stale\n')).toBeUndefined();
        expect(frontmatterModel('---\nname: x\nmodel: claude-ok\n---\n')).toBe('claude-ok');
    });
});
