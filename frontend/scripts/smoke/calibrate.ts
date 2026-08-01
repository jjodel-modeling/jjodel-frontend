/**
 * calibrate.ts — smoke calibration run (docs/PROTOCOL.md P8).
 *
 * This script contains NO assertions and never fails on a measurement: it opens
 * the known states and prints the numbers needed to choose the thresholds and
 * the two allowlists (modals, console noise) that run.ts will later encode as
 * named constants.
 *
 * Run: npm run smoke:calibrate   (dev server must already be up)
 */

import { chromium } from '@playwright/test';
import type { Browser, BrowserContext, ConsoleMessage, Page } from '@playwright/test';

// The dev server listens on [::1] only: `localhost` resolves there, 127.0.0.1
// does not. See frontend/vite.config.ts (server.port) and docs/PROTOCOL.md P8.
const BASE_URL = 'http://localhost:3000';

// Measurements are only comparable across runs at a fixed viewport.
const VIEWPORT_WIDTH = 1440;
const VIEWPORT_HEIGHT = 900;

// Grace period after the app settles, to catch late console output and layout.
const SETTLE_MS = 3000;

// Waits for the app's own async boot (Redux state init, dock mount). The app
// has no readiness signal to await, so these are empirical.
const BOOT_MS = 4000;
const NAV_MS = 7000;
const TAB_MS = 8000;

/**
 * The offline user exactly as the app writes it to localStorage when the
 * "Offline mode" button on the auth page is pressed (pages/Auth.tsx:660 ->
 * AuthApi.offline() -> DUser.offline(), joiner/classes.ts:2734). Injecting it
 * reproduces that state without driving the login UI and without touching any
 * application code.
 */
const OFFLINE_USER = {
    className: 'DUser',
    id: 'Pointer_OfflineUser',
    pointedBy: [],
    _state: {},
    name: 'Offline',
    surname: 'User',
    nickname: 'Unknown',
    country: 'Unknown',
    affiliation: 'Unknown',
    newsletter: false,
    email: 'Unknown',
    token: 'Unknown',
    projects: [],
    project: '',
    autoReport: false,
    layout: {},
    autosaveLayout: true,
    activeLayout: '1',
    __isDUser: true,
};

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface FixedElement {
    selector: string;
    rect: Rect;
    zIndex: string;
    intersectsStatusbar: boolean;
}

interface Measurements {
    viewport: Rect;
    canvas: Rect | null;
    main: Rect | null;
    statusbar: Rect | null;
    statusbarPosition: string | null;
    canvasOverMainRatio: number | null;
    nodeCount: number;
    edgeCount: number;
    minimapCount: number;
    fixedElements: FixedElement[];
}

interface LogLine {
    type: string;
    text: string;
}

interface StateResult {
    id: string;
    note: string;
    reached: boolean;
    measurements: Measurements | null;
    logs: LogLine[];
    pageErrors: string[];
}

function pad(n: number): string {
    return String(Math.round(n)).padStart(5, ' ');
}

function fmtRect(r: Rect | null): string {
    if (!r) return 'ABSENT';
    return `x=${pad(r.x)} y=${pad(r.y)} w=${pad(r.w)} h=${pad(r.h)}  (right=${Math.round(r.x + r.w)}, bottom=${Math.round(r.y + r.h)})`;
}

/** Collects every measurement in one browser round-trip. */
async function measure(page: Page): Promise<Measurements> {
    return await page.evaluate(() => {
        const toRect = (el: Element): { x: number; y: number; w: number; h: number } => {
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, w: r.width, h: r.height };
        };
        const rectOf = (sel: string) => {
            const el = document.querySelector(sel);
            return el ? toRect(el) : null;
        };

        // A short, human-identifiable selector for an arbitrary element.
        const describe = (el: Element): string => {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : '';
            const cls = typeof el.className === 'string' && el.className.trim()
                ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
                : '';
            return `${tag}${id}${cls}`;
        };

        const statusbarEl = document.querySelector('.app-statusbar');
        const sbRect = statusbarEl ? toRect(statusbarEl) : null;

        const overlaps = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean =>
            a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

        const fixedElements: FixedElement[] = [];
        for (const el of Array.from(document.querySelectorAll('*'))) {
            const cs = window.getComputedStyle(el);
            if (cs.position !== 'fixed') continue;
            // Only elements that actually occupy space and are visible.
            const r = toRect(el);
            if (r.w === 0 || r.h === 0) continue;
            if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
            fixedElements.push({
                selector: describe(el),
                rect: r,
                zIndex: cs.zIndex,
                intersectsStatusbar: sbRect ? overlaps(r, sbRect) : false,
            });
        }

        const canvas = rectOf('.editor-v2__canvas');
        const main = rectOf('.editor-v2__main');

        return {
            viewport: { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight },
            canvas,
            main,
            statusbar: sbRect,
            statusbarPosition: statusbarEl ? window.getComputedStyle(statusbarEl).position : null,
            canvasOverMainRatio: canvas && main && main.w > 0 ? canvas.w / main.w : null,
            nodeCount: document.querySelectorAll('.react-flow__node').length,
            edgeCount: document.querySelectorAll('.react-flow__edge').length,
            minimapCount: document.querySelectorAll('.react-flow__minimap').length,
            fixedElements,
        };
    }) as Measurements;
}

/** Seeds localStorage before the first script of the page runs. */
async function seed(ctx: BrowserContext, advanced: boolean): Promise<void> {
    await ctx.addInitScript(
        (args: { user: typeof OFFLINE_USER; advanced: boolean }) => {
            localStorage.setItem('offline', 'true');
            localStorage.setItem('user', JSON.stringify(args.user));
            // WelcomeModal renders a full-screen backdrop that swallows clicks
            // (components/WelcomeModal/WelcomeModal.tsx:4).
            localStorage.setItem('jjodel_welcome_3_seen', '1');
            localStorage.setItem('jjodel.interfaceMode', args.advanced ? 'advanced' : 'basic');
        },
        { user: OFFLINE_USER, advanced },
    );
}

/** Creates a project through the real UI and returns its id, or null. */
async function createProject(page: Page, name: string): Promise<string | null> {
    await page.goto(`${BASE_URL}/#/allProjects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(BOOT_MS);
    await page.locator('button', { hasText: 'New Project' }).first().click();
    await page.waitForTimeout(1200);
    await page.locator('input[type="text"]').first().fill(name);
    await page.locator('button', { hasText: /^Create/ }).last().click();
    await page.waitForTimeout(5000);
    return await page.evaluate(() => {
        const raw = localStorage.getItem('projects');
        if (!raw) return null;
        const arr = JSON.parse(raw) as Array<{ id: string }>;
        return arr.length ? arr[arr.length - 1].id : null;
    });
}

async function runState(
    browser: Browser,
    id: string,
    note: string,
    advanced: boolean,
    openMetamodelTab: boolean,
): Promise<StateResult> {
    const ctx = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
    const logs: LogLine[] = [];
    const pageErrors: string[] = [];

    await seed(ctx, advanced);
    const page = await ctx.newPage();
    // Attached before any navigation so nothing from the first load is missed.
    page.on('console', (m: ConsoleMessage) => logs.push({ type: m.type(), text: m.text() }));
    page.on('pageerror', (e: Error) => pageErrors.push(e.message));

    let reached = false;
    let measurements: Measurements | null = null;

    try {
        const pid = await createProject(page, `SmokeCalib_${id}`);
        if (pid) {
            await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(NAV_MS);

            if (openMetamodelTab) {
                const nm = page.getByText('New metamodel', { exact: true });
                if ((await nm.count()) > 0) {
                    await nm.first().click();
                    await page.waitForTimeout(TAB_MS);
                }
            }

            await page.waitForTimeout(SETTLE_MS);
            measurements = await measure(page);
            reached = true;
        }
    } catch (err) {
        pageErrors.push(`SETUP FAILED: ${err instanceof Error ? err.message : String(err)}`);
    }

    await ctx.close();
    return { id, note, reached, measurements, logs, pageErrors };
}

function report(r: StateResult): void {
    console.log('');
    console.log('═'.repeat(78));
    console.log(`STATE: ${r.id}`);
    console.log(r.note);
    console.log('═'.repeat(78));

    if (!r.reached || !r.measurements) {
        console.log('  NOT REACHED — setup did not complete.');
        for (const e of r.pageErrors) console.log(`  pageerror: ${e}`);
        return;
    }

    const m = r.measurements;

    console.log('');
    console.log('-- 7. viewport --------------------------------------------------------');
    console.log(`  ${m.viewport.w} x ${m.viewport.h}  (fixed constant, not the window size)`);

    console.log('');
    console.log('-- 1. canvas vs main --------------------------------------------------');
    console.log(`  .editor-v2__canvas   ${fmtRect(m.canvas)}`);
    console.log(`  .editor-v2__main     ${fmtRect(m.main)}`);
    console.log(
        `  ratio canvas.w / main.w = ${m.canvasOverMainRatio === null ? 'N/A (one of the two is absent)' : m.canvasOverMainRatio.toFixed(4)}`,
    );

    console.log('');
    console.log('-- 2. node and edge counts --------------------------------------------');
    console.log(`  .react-flow__node    ${m.nodeCount}`);
    console.log(`  .react-flow__edge    ${m.edgeCount}`);
    console.log(`  .react-flow__minimap ${m.minimapCount}`);

    console.log('');
    console.log('-- 3. onlyRenderVisibleElements ---------------------------------------');
    console.log('  Not set on <ReactFlow> anywhere in the codebase (grep over frontend/src');
    console.log('  returns no hit; the props block is EditorV2.tsx:3791-3830). The library');
    console.log('  default is false, so every node is mounted regardless of the viewport:');
    console.log('  the count above does NOT depend on zoom or pan.');

    console.log('');
    console.log('-- 4. status bar ------------------------------------------------------');
    console.log(`  .app-statusbar       ${fmtRect(m.statusbar)}`);
    console.log(`  computed position    ${m.statusbarPosition ?? 'N/A'}${m.statusbarPosition === 'fixed' ? '   <-- IS fixed' : '   (not fixed)'}`);

    console.log('');
    console.log('-- 5. visible position:fixed elements ---------------------------------');
    if (m.fixedElements.length === 0) {
        console.log('  none');
    } else {
        console.log(`  ${m.fixedElements.length} element(s). "HITS" = intersects the status bar rect.`);
        for (const f of m.fixedElements) {
            const flag = f.intersectsStatusbar ? 'HITS ' : '     ';
            console.log(`  ${flag} z=${(f.zIndex || 'auto').padStart(6)}  ${fmtRect(f.rect)}  ${f.selector}`);
        }
    }

    console.log('');
    console.log('-- 6. console output --------------------------------------------------');
    if (r.logs.length === 0) {
        console.log('  none');
    } else {
        console.log(`  ${r.logs.length} message(s), in order, full text:`);
        for (const l of r.logs) console.log(`  [${l.type}] ${l.text}`);
    }
    if (r.pageErrors.length > 0) {
        console.log(`  ${r.pageErrors.length} uncaught page error(s):`);
        for (const e of r.pageErrors) console.log(`  [pageerror] ${e}`);
    }
}

async function main(): Promise<void> {
    console.log('smoke calibration — no assertions, measurements only');
    console.log(`base url : ${BASE_URL}`);
    console.log(`viewport : ${VIEWPORT_WIDTH}x${VIEWPORT_HEIGHT}`);

    const browser = await chromium.launch();
    try {
        const results: StateResult[] = [];

        results.push(
            await runState(
                browser,
                'empty-project',
                'Project open, no tab. This is "progetto vuoto" read literally.',
                false,
                false,
            ),
        );

        results.push(
            await runState(
                browser,
                'empty-metamodel-tab',
                'Project open + one fresh metamodel tab. Added beyond the two states\n' +
                'requested: it is the minimal state that actually mounts a canvas, so\n' +
                'without it points 1-3 have nothing to measure.',
                false,
                true,
            ),
        );

        results.push(
            await runState(
                browser,
                'advanced-mode',
                'Same as empty-metamodel-tab, with jjodel.interfaceMode = "advanced".',
                true,
                true,
            ),
        );

        for (const r of results) report(r);

        console.log('');
        console.log('═'.repeat(78));
        console.log('SUMMARY');
        console.log('═'.repeat(78));
        for (const r of results) {
            const m = r.measurements;
            const ratio = m?.canvasOverMainRatio;
            console.log(
                `  ${r.id.padEnd(22)} reached=${String(r.reached).padEnd(5)} ` +
                `canvas=${m?.canvas ? `${Math.round(m.canvas.w)}x${Math.round(m.canvas.h)}` : 'ABSENT'} ` +
                `ratio=${ratio === null || ratio === undefined ? 'N/A' : ratio.toFixed(4)} ` +
                `nodes=${m?.nodeCount ?? '-'} fixed=${m?.fixedElements.length ?? '-'} logs=${r.logs.length}`,
            );
        }
        console.log('');
        console.log('No thresholds are proposed here by design: they are decided from these');
        console.log('numbers and encoded as named constants in states.ts.');
    } finally {
        await browser.close();
    }
}

await main();
