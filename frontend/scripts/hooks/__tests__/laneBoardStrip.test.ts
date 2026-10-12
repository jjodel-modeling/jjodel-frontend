import { describe, test, expect, afterAll } from 'vitest';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

// lane-board.mjs: the status strip of the tab bar and the `resolved` colour in Timeline and
// Insights (P-2026-10-10-2103, slice S4 of discovery P-2026-10-10-1806, ported from branch
// harness-req-tab 35240a582). The counting is imported; the board runs as a child process
// against a fake lanes folder and a fake lane-run, as in laneBoard.test.ts (temp JJODEL_REPO,
// temp LANE_BOARD_CACHE). The page's own script and the board's timeline.js and insights.js,
// fetched from the board, run in node:vm on a stub DOM whose fetch reaches the same board.
// A test name states the mutation that turns it red (CLAUDE.md 5); the bench that
// established it is in the commit message.
//
// LANE_BOARD points the suite at another copy of the script (the mutation bench).

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = process.env.LANE_BOARD ? resolve(process.env.LANE_BOARD) : resolve(HERE, '..', '..', 'lane-board', 'lane-board.mjs');
process.env.LANE_BOARD_PORT = '0';
const lb = await import(pathToFileURL(SCRIPT).href);

const dirs: string[] = [];
const children: ChildProcess[] = [];
afterAll(() => {
    for (const c of children) c.kill('SIGKILL');
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
});
const tmp = () => { const d = realpathSync(mkdtempSync(join(tmpdir(), 'lane-board-strip-'))); dirs.push(d); return d; };

type Row = Record<string, any>;
const row = (o: Partial<Row>): Row => ({ id: 'P-2026-10-05-0900', state: 'exited', outcome: 'done', chain: false, live: false, recent: true, ...o });
const ZERO = { running: 0, question: 0, 'hard-stop': 0, blocked: 0, resolved: 0, done: 0 };

describe('the status strip: counting', () => {
    test('kills "a key missing", "the order changed": six keys, in the order of the strip', () => {
        expect(lb.STRIP.map((s: string[]) => s[0])).toEqual(['running', 'question', 'hard-stop', 'blocked', 'resolved', 'done']);
        expect(lb.stripCounts([])).toEqual(ZERO);
    });

    test('kills "outcomes misread": running by state, the four outcomes by their word, a suffix tolerated, no outcome uncounted', () => {
        const rows = [
            row({ state: 'running', outcome: 'none', live: true }),
            row({ state: 'blocked', outcome: 'none', live: true }),
            row({ outcome: 'question' }),
            row({ outcome: 'hard-stop' }),
            row({ outcome: 'hard-stop (visual check due)' }),
            row({ outcome: 'blocked' }),
            row({ outcome: 'resolved' }),
            row({ outcome: 'none' }),
            row({ outcome: 'unparsed' }),
        ];
        expect(lb.stripCounts(rows)).toEqual({ running: 1, question: 1, 'hard-stop': 2, blocked: 2, resolved: 1, done: 0 });
    });

    test('kills "done counted without the 24 h window": done counts only the lanes of the last 24 hours, the other outcomes count all', () => {
        const rows = [row({ outcome: 'done', recent: true }), row({ outcome: 'done', recent: false }), row({ outcome: 'question', recent: false })];
        expect(lb.stripCounts(rows)).toMatchObject({ done: 1, question: 1 });
        expect(lb.stripKey(row({ outcome: 'done', recent: false }))).toBe(null);
    });

    test('kills "a chain read by its outcome column": a chain row counts by its state', () => {
        const chain = (state: string, recent = true) => row({ id: 'chain-P-2026-10-05-0800', chain: true, state, outcome: '2/3 P-2026-10-05-0801', recent });
        expect(lb.stripCounts([chain('running'), chain('done'), chain('done', false), chain('stopped'), chain('lost')])).toEqual({ ...ZERO, running: 1, done: 1 });
        expect(lb.stripKey(row({ id: 'chain-P-2026-10-05-0800', chain: true, state: 'running', outcome: 'blocked' }))).toBe('running');
    });
});

// ── the board as a process ───────────────────────────────────────────────────

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

/** A row of the fake `lane-run status --all`; a P- lane also gets a folder, and an exited one a log whose turns end
 *  on `Outcome: <turn>` (one turn on `outcome` unless `turns` lists them), a turn every ten minutes up to now. */
type Spec = { id: string; state: string; outcome: string; resolved?: boolean; turns?: string[] };

function laneFolder(root: string, s: Spec) {
    const dir = join(root, s.id);
    mkdirSync(dir);
    const turns = s.turns || [s.outcome];
    const events: Row[] = [{ type: 'system', subtype: 'init', model: 'claude-opus-5-5', claude_code_version: '2.1.0' }];
    turns.forEach((o, i) => {
        const input = join(dir, 'input-' + (i + 1) + '.md');
        writeFileSync(input, i ? 'GO\n' : '# Prompt: ' + s.outcome + '\n\nPrompt-ID: ' + s.id + '\nLane: fast\n');
        const at = new Date(Date.now() - (turns.length - i) * 600_000);
        utimesSync(input, at, at);
        const text = 'Stopped.\nOutcome: ' + o;
        events.push({ type: 'assistant', message: { content: [{ type: 'text', text }] } }, { type: 'result', duration_ms: 60000, num_turns: 3, result: text });
    });
    if (s.state === 'exited') {
        writeFileSync(join(dir, 'log.jsonl'), events.map((e) => JSON.stringify(e)).join('\n') + '\n');
        writeFileSync(join(dir, 'exit.txt'), '0\n');
    }
    if (s.resolved) writeFileSync(join(dir, 'resolved.txt'), '2026-10-05 10:00 · Alfonso · fixed by hand\n');
}

/** The board as launchd runs it, on a free port, against these lanes. */
async function board(specs: Spec[]): Promise<{ base: string }> {
    const root = tmp();
    // launcherOf reads `git log --all` of JJODEL_REPO: an empty repo here, never a real checkout.
    const repo = tmp();
    spawnSync('git', ['init', '-q', repo]);
    for (const s of specs) if (!s.id.startsWith('chain-')) laneFolder(root, s);
    const fake = join(root, 'fake-lane-run.mjs');
    const lines = ['id  state  outcome  elapsed', ...specs.map((s) => [s.id, s.state, s.outcome, '5 min'].join('   '))];
    writeFileSync(fake, lines.map((l) => 'console.log(' + JSON.stringify(l) + ');').join('\n') + '\n');
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
    return { base: 'http://127.0.0.1:' + port };
}
const text = async (base: string, path: string) => (await fetch(base + path)).text();

// ── a stub DOM for the page's script and the board's assets ─────────────────

type Stub = Record<string, any>;
function stubEl(extra: Stub = {}): Stub {
    const cls = new Set<string>();
    const on: Record<string, ((e: any) => void)[]> = {};
    const kids = new Map<string, Stub>();
    return {
        innerHTML: '', textContent: '', hidden: false, title: '', dataset: {}, style: {}, cls, on,
        addEventListener: (t: string, f: (e: any) => void) => { (on[t] ||= []).push(f); },
        classList: {
            toggle: (c: string, f?: boolean) => { const v = f === undefined ? !cls.has(c) : !!f; if (v) cls.add(c); else cls.delete(c); return v; },
            add: (c: string) => cls.add(c), remove: (c: string) => cls.delete(c), contains: (c: string) => cls.has(c),
        },
        querySelector: (s: string) => { if (!kids.has(s)) kids.set(s, stubEl()); return kids.get(s); },
        querySelectorAll: () => [],
        appendChild: () => {},
        // insights.js measures SVG text: six pixels a character is enough for a layout nobody looks at.
        getBBox() { return { width: 6 * String(this.textContent).length, height: 12 }; },
        ...extra,
    };
}

/** A browser-like context: elements by id and by selector are created on first use; fetch goes to the board. */
function dom(base: string, store: Record<string, string> = {}) {
    const byId = new Map<string, Stub>(), bySel = new Map<string, Stub>();
    const get = (m: Map<string, Stub>, k: string) => { if (!m.has(k)) m.set(k, stubEl()); return m.get(k)!; };
    const tabs = ['table', 'timeline', 'insights'].map((t) => stubEl({ dataset: { tab: t } }));
    const ls = new Map(Object.entries(store));
    const window: Stub = { addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }), innerWidth: 1400, innerHeight: 900 };
    const document = {
        title: '', head: stubEl(), body: stubEl(), createElement: () => stubEl(),
        getElementById: (id: string) => get(byId, id),
        querySelector: (s: string) => get(bySel, s),
        querySelectorAll: (s: string) => (s === '.tabs button' ? tabs : []),
    };
    const ctx = vm.createContext({
        window, document, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {},
        matchMedia: window.matchMedia, innerWidth: 1400, innerHeight: 900,
        localStorage: { getItem: (k: string) => (ls.has(k) ? ls.get(k)! : null), setItem: (k: string, v: string) => { ls.set(k, String(v)); } },
        fetch: (u: string, o?: RequestInit) => fetch(base + u, o),
    });
    return { window, byId, bySel, run: (code: string) => vm.runInContext(code, ctx) };
}

const pad = (n: number) => String(n).padStart(2, '0');
const pidAt = (ms: number) => { const d = new Date(ms); return 'P-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()); };
const NOW = Date.now();
const RUN = pidAt(NOW - 60 * 60000), D1 = pidAt(NOW - 61 * 60000), D2 = pidAt(NOW - 62 * 60000);

// Two running (one a chain), none in question, four hard-stops, two blocked (one over its limit while
// running), one resolved, three done in the last 24 h (one a chain, one holding a resolved.txt it ignores).
const LANES: Spec[] = [
    { id: RUN, state: 'running', outcome: 'none' },
    { id: D1, state: 'exited', outcome: 'done', resolved: true },
    { id: D2, state: 'exited', outcome: 'done' },
    { id: 'P-2026-10-05-0950', state: 'blocked', outcome: 'none' },
    { id: 'P-2026-10-05-0940', state: 'exited', outcome: 'hard-stop' },
    { id: 'P-2026-10-05-0935', state: 'exited', outcome: 'hard-stop' },
    { id: 'P-2026-10-05-0930', state: 'exited', outcome: 'hard-stop' },
    { id: 'P-2026-10-05-0920', state: 'exited', outcome: 'hard-stop' },
    { id: 'P-2026-10-05-0910', state: 'exited', outcome: 'blocked' },
    { id: 'P-2026-10-05-0900', state: 'exited', outcome: 'blocked', resolved: true },
    { id: 'P-2026-10-05-0850', state: 'exited', outcome: 'done' },
    { id: 'P-2026-10-05-0840', state: 'exited', outcome: 'unparsed' },
    { id: 'chain-' + RUN, state: 'running', outcome: '1/2 ' + RUN },
    { id: 'chain-' + D1, state: 'done', outcome: '2/2 ' + D1 },
    { id: 'chain-P-2026-10-05-0830', state: 'stopped', outcome: '1/2 P-2026-10-05-0830' },
];
const COUNTS = { running: 2, question: 0, 'hard-stop': 4, blocked: 2, resolved: 1, done: 3 };

let lanesBoard: Promise<{ base: string }> | null = null;
const lanes = () => (lanesBoard ||= board(LANES));

/** The page's own script, run on the stub DOM after its first tick. */
async function page(base: string) {
    const html = await text(base, '/');
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).pop()!;
    const d = dom(base);
    d.run(script);
    await d.run('tick()');
    const click = (k: string) => d.byId.get('strip')!.on.click.forEach((f: (e: any) => void) => f({ target: { closest: () => ({ dataset: { k } }) }, preventDefault() {} }));
    return { ...d, html, click };
}

describe('the board: resolved, the strip and its filter', () => {
    test('kills "resolved.txt ignored by the board", "resolved.txt read on any outcome": blocked plus resolved.txt counts as resolved, not blocked', async () => {
        const { base } = await lanes();
        const d = JSON.parse(await text(base, '/api'));
        const by = (id: string) => d.rows.find((r: Row) => r.id === id);
        expect(by('P-2026-10-05-0900').outcome).toBe('resolved');
        expect(by('P-2026-10-05-0910').outcome).toBe('blocked');
        expect(by(D1).outcome).toBe('done');
        expect(lb.stripCounts(d.rows)).toEqual(COUNTS);
    });

    test('kills "the strip outside the tab bar", "the page counting with other code", "a pill in another colour": the strip follows the last tab button, six pills, the counting the tests import', async () => {
        const { base } = await lanes();
        const html = await text(base, '/');
        const nav = /<nav class="tabs">([\s\S]*?)<\/nav>/.exec(html)![1];
        expect(nav).toMatch(/<button data-tab="[a-z]+">[^<]+<\/button><div class="strip" id="strip"/);
        expect(nav.slice(nav.indexOf('class="strip"'))).not.toContain('<button');
        expect((nav.match(/data-k="/g) || []).length).toBe(6);
        expect([...nav.matchAll(/class="pill sp ([\w-]+) zero" data-k="([\w-]+)"/g)].map((m) => m[2] + ':' + m[1]))
            .toEqual(['running:running', 'question:question', 'hard-stop:hard-stop', 'blocked:blocked-o', 'resolved:resolved', 'done:done']);
        expect(html).toContain('.hard-stop{color:var(--hs)}');
        expect(html).toContain('const stripKey=' + lb.stripKey.toString() + ';');
    });

    test('kills "the page counts other rows", "zero counts not dimmed": each pill shows the count of /api, the empty one dimmed', async () => {
        const { base } = await lanes();
        const p = await page(base);
        for (const [k, n] of Object.entries(COUNTS)) {
            const pill = p.bySel.get('#strip [data-k="' + k + '"]');
            expect(pill, k).toBeDefined();
            expect(String(pill!.querySelector('b').textContent), k).toBe(String(n));
            expect(pill!.cls.has('zero'), k).toBe(n === 0);
            expect(pill!.cls.has('on'), k).toBe(false);
        }
    });

    test('kills "the filter shows other states", "the filtered view off the trunk table": a pill filters the Lanes tab through table(), running and exited apart', async () => {
        const { base } = await lanes();
        const p = await page(base);
        p.click('blocked');
        const f = p.byId.get('lanes-filt')!, all = p.byId.get('lanes-all')!;
        expect([f.hidden, all.hidden]).toEqual([false, true]);
        expect(p.bySel.get('#strip [data-k="blocked"]')!.cls.has('on')).toBe(true);
        expect(f.innerHTML).toContain('<span>blocked · 2 lanes</span><a id="clearf">show all lanes</a>');
        const ids = [...f.innerHTML.matchAll(/<td class="id">(P-[\d-]+|chain-P-[\d-]+)/g)].map((m) => m[1]);
        expect(ids).toEqual(['P-2026-10-05-0950', 'P-2026-10-05-0910']);
        // The trunk table(): its fixed widths, the Running columns for the live row, the exited ones for the other.
        expect((f.innerHTML.match(/<table class="lfx"><colgroup><col style="width:200px">/g) || []).length).toBe(2);
        expect(f.innerHTML).toContain('<th>Phase</th>');
        expect(f.innerHTML).toContain('<th>Outcome</th>');
        expect(f.innerHTML).toContain('<th>Launched by</th>');

        p.click('resolved');
        expect(f.innerHTML).toContain('<span>resolved · 1 lane</span>');
        expect(f.innerHTML).toContain('<span class="pill resolved">resolved</span>');
        p.click('question');
        expect(f.innerHTML).toContain('No lane in this state.');
    });

    test('kills "no way back to all lanes", "the filter lost at refresh": a second click on the pill, or "show all lanes", clears the filter; a refresh keeps it', async () => {
        const { base } = await lanes();
        const p = await page(base);
        const f = p.byId.get('lanes-filt')!, all = p.byId.get('lanes-all')!;
        p.click('hard-stop');
        await p.run('tick()');
        expect([f.hidden, all.hidden]).toEqual([false, true]);
        expect(f.innerHTML).toContain('<span>hard-stop · 4 lanes</span>');
        p.click('hard-stop');
        expect([f.hidden, all.hidden]).toEqual([true, false]);
        expect(p.bySel.get('#strip [data-k="hard-stop"]')!.cls.has('on')).toBe(false);
        expect(p.byId.get('recent')!.innerHTML).toContain(D2);

        p.click('done');
        expect(f.hidden).toBe(false);
        const clear = p.byId.get('clearf')!.on.click;
        clear[clear.length - 1]({ preventDefault() {} });
        expect([f.hidden, all.hidden]).toEqual([true, false]);
        expect(p.bySel.get('#strip [data-k="done"]')!.cls.has('on')).toBe(false);
    });
});

// ── resolved in Timeline and Insights ────────────────────────────────────────

const RES = 'P-2026-10-05-0700', BLK = 'P-2026-10-05-0600';
let tlBoard: Promise<{ base: string }> | null = null;
// Only a resolved lane, stopped once before it ended blocked, and a blocked one: no done lane paints the ok colour.
const tl = () => (tlBoard ||= board([
    { id: RES, state: 'exited', outcome: 'blocked', resolved: true, turns: ['hard-stop', 'blocked'] },
    { id: BLK, state: 'exited', outcome: 'blocked' },
]));
const escTip = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('resolved in Timeline and Insights', () => {
    test('kills "the Timeline told nothing", "the flag set on any blocked lane": /api/timeline flags a resolved lane beside its raw outcome', async () => {
        const { base } = await tl();
        const d = JSON.parse(await text(base, '/api/timeline'));
        const by = (id: string) => d.lanes.find((l: Row) => l.id === id);
        expect([by(RES).outcome, by(RES).resolved]).toEqual(['blocked', true]);
        expect([by(BLK).outcome, by(BLK).resolved]).toEqual(['blocked', false]);
    });

    test('kills "the last turn keeps the blocked colour", "every turn painted resolved", "no resolved in the legends", "the tip missing", "the title or the detail silent": Timeline paints the last turn of a resolved lane ok and says why', async () => {
        const { base } = await tl();
        const d = dom(base, { 'laneTL.range': 'all', 'laneTL.selected': RES, 'laneTL.colorBy': 'outcome', 'laneTL.expanded': '{"unknown":true}' });
        d.run(await text(base, '/timeline.js'));
        await d.window.TL.refresh();
        const html = d.byId.get('tl')!.innerHTML;
        // The turns of a lane in the plot (its label group is tl-lane-lab), as [fill, title].
        const turns = (id: string) => {
            const g = new RegExp('<g class="tl-lane(?: [^"]*)?" data-id="' + id + '">([\\s\\S]*?)</g>').exec(html)![1];
            return [...g.matchAll(/<rect class="tl-turn"[^>]*fill="([^"]+)"><title>([^<]*)<\/title>/g)].map((m) => [m[1], m[2]]);
        };
        expect(turns(RES).map((t) => t[0])).toEqual(['var(--hs)', 'var(--ok)']);
        expect(turns(BLK).map((t) => t[0])).toEqual(['var(--bad)']);
        expect(turns(RES)[0][1]).toMatch(/Outcome: hard-stop$/);
        expect(turns(RES)[1][1]).toMatch(/Outcome: blocked, resolved$/);
        expect(turns(BLK)[0][1]).toMatch(/Outcome: blocked$/);

        const tip = d.window.LANE_OUTCOME_TIPS.resolved;
        expect(tip).toMatch(/^Resolved: /);
        expect(html).toContain('<span title="' + escTip(tip) + '"><i style="background:var(--ok)"></i>resolved</span>');
        // The parallelism legend (its tip as an SVG title) and the work of the resolved lane in its strip.
        expect(html).toMatch(new RegExp('<title>' + reEsc(escTip(tip)) + '</title><rect [^>]*fill="var\\(--ok\\)"/><text [^>]*>resolved</text>'));
        expect(html).toMatch(/<rect x="[^"]+" y="[^"]+" width="[^"]+" height="[^"]+" fill="var\(--ok\)"\/>/);
        // The detail of the selected lane.
        expect(html).toContain('<td>hard-stop</td></tr>');
        expect(html).toContain('<td>blocked, resolved</td></tr>');
    });

    test('kills "Insights counts a resolved lane as blocked", "no resolved in the Insights legend": the outcome bars count it apart, in the ok colour', async () => {
        const { base } = await tl();
        const d = dom(base, { 'laneINS.range': '0' });
        d.run(await text(base, '/timeline.js'));
        d.run(await text(base, '/insights.js'));
        await d.window.INS.refresh();
        const html = d.byId.get('ins')!.innerHTML;
        expect(html).toContain('fill="var(--ok)" data-tip="Fast|1 resolved"');
        expect(html).toContain('fill="var(--bad)" data-tip="Fast|1 blocked / failed"');
        expect(html).toContain('<span class="in-key" title="' + escTip(d.window.LANE_OUTCOME_TIPS.resolved) + '"><i style="background:var(--ok)"></i>resolved</span>');
    });
});
