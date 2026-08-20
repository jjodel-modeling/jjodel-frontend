/**
 * states.ts — environment, seeding and the known states the smoke opens.
 *
 * Shared by run.ts (assertions) and calibrate.ts (measurements only), so the
 * two never drift on how a state is reached.
 *
 * Every threshold here is a decision, not a measurement: they are fixed
 * constants, never recomputed at runtime and never adaptive.
 */

import type { Browser, BrowserContext, Page } from '@playwright/test';

// The dev server listens on [::1] only: `localhost` resolves there, 127.0.0.1
// does not. See frontend/vite.config.ts (server.port) and docs/PROTOCOL.md P8.
export const BASE_URL = 'http://localhost:3000';

// Measurements are only comparable across runs at a fixed viewport.
export const VIEWPORT_WIDTH = 1440;
export const VIEWPORT_HEIGHT = 900;

// ── Thresholds (decided from the 2026-08-01 calibration run) ────────────────

/**
 * Minimum for rect('.editor-v2__canvas').width / rect('.editor-v2__main').width.
 * Measured 1.0000 in every calibrated state; a canvas collapsed to 30% gives
 * 0.30. Do not soften.
 */
export const CANVAS_MAIN_RATIO_MIN = 0.95;

/** Strict intersection against the status bar: no slack. */
export const STATUSBAR_INTERSECT_TOLERANCE_PX = 0;

/**
 * A5 — slack allowed on each seam of the chrome stack. Sub-pixel only: the seams
 * are meant to be exact, and 0.5px absorbs device-pixel rounding without letting
 * a real gap through (the bug A5 exists for measured 9.73px).
 */
export const CHROME_GAP_TOLERANCE_PX = 0.5;

/**
 * The one seam that is legitimately not zero: rc-dock paints a 1px border-top on
 * .dock-panel between the app bar and the canvas toolbar. Library CSS, not ours —
 * `.properties-tree-overlay`'s `top` composes this literal on purpose
 * (properties-with-tree-view.scss). If rc-dock changes it, A5 fails and points here.
 */
export const DOCK_PANEL_BORDER_PX = 1;

/**
 * Elements exempt from A3.
 *
 * `#root` is position:fixed at full viewport (src/index.scss:31), so it
 * intersects the status bar by construction: a structural false positive.
 *
 * The rest are modal backdrops, fixed and full-screen by design. Selector
 * names verified by grep against the SCSS, not guessed:
 *   .unified-settings-backdrop   components/Settings/UnifiedSettingsModal/UnifiedSettingsModal.scss:40
 *   .explain-modal-overlay       components/ExplainModal.scss:1
 *   .dialog-overlay              components/CreateProjectDialog/create-project-dialog.scss:6
 *   .add-tag-dialog-backdrop     components/AddTagDialog/add-tag-dialog.scss:7
 *   .add-tag-dialog              components/AddTagDialog/add-tag-dialog.scss:19
 *   .wm-backdrop                 components/WelcomeModal/WelcomeModal.scss:1
 *
 * None of these is open in the three calibrated states, so this part of the
 * allowlist is prophylaxis for states added later, not something the current
 * run exercises.
 *
 * The list is explicit on purpose: `[role="dialog"]` would be broader than
 * "modal" and would exempt .app-notif-popover (src/components/NotificationCenter.tsx:105)
 * and NodeProblemOverlay (src/components/editor-v2/problems/NodeProblemOverlay.tsx:180),
 * which are fixed too — the very regressions A3 exists to catch. The explicit
 * list takes the opposite risk: a new modal not yet listed here is a false
 * positive. That is the right way round to be wrong. When you add a modal, add
 * it here.
 *
 * Matching is exact (el.matches), never el.closest: with `#root` in the list,
 * an ancestor-based match would exempt the entire document.
 */
export const FIXED_ALLOWLIST: string[] = [
    '#root',
    '.unified-settings-backdrop',
    '.explain-modal-overlay',
    '.dialog-overlay',
    '.add-tag-dialog-backdrop',
    '.add-tag-dialog',
    '.wm-backdrop',
];

// ── Timing ──────────────────────────────────────────────────────────────────
// The app exposes no readiness signal to await, so these are empirical.

export const BOOT_MS = 4000;
export const NAV_MS = 7000;
export const TAB_MS = 8000;
export const SETTLE_MS = 3000;

/**
 * The offline user exactly as the app writes it to localStorage when the
 * "Offline mode" button on the auth page is pressed (src/pages/Auth.tsx:660 ->
 * AuthApi.offline() -> DUser.offline(), src/joiner/classes.ts:2734). Injecting
 * it reproduces that state without driving the login UI and without touching
 * any application code.
 */
export const OFFLINE_USER = {
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

export type AssertionId = 'A1' | 'A2' | 'A3' | 'A4' | 'A5';

export interface SkipDeclaration {
    assertion: AssertionId;
    reason: string;
}

export interface SmokeState {
    id: string;
    note: string;
    /** localStorage['jjodel.interfaceMode'] = 'advanced' when true. */
    advanced: boolean;
    /** Click "New metamodel" after opening the project. */
    openMetamodelTab: boolean;
    /** Assertions that do not apply here. Reported as skipped, never as passed. */
    skip: SkipDeclaration[];
}

export const STATES: SmokeState[] = [
    {
        id: 'empty-project',
        note: 'Project open, no tab. "Progetto vuoto" read literally.',
        advanced: false,
        openMetamodelTab: false,
        skip: [
            {
                assertion: 'A1',
                reason: 'no tab is open, so the editor is legitimately not mounted',
            },
            {
                assertion: 'A2',
                reason: 'no canvas to measure without a mounted editor',
            },
        ],
    },
    {
        id: 'empty-metamodel-tab',
        note: 'Project open + one fresh metamodel tab. The minimal state that mounts a canvas.',
        advanced: false,
        openMetamodelTab: true,
        skip: [],
    },
    {
        id: 'advanced-mode',
        note: 'Same as empty-metamodel-tab, with jjodel.interfaceMode = "advanced".',
        advanced: true,
        openMetamodelTab: true,
        skip: [],
    },
];

/** Seeds localStorage before the first script of the page runs. */
export async function seed(ctx: BrowserContext, advanced: boolean): Promise<void> {
    await ctx.addInitScript(
        (args: { user: typeof OFFLINE_USER; advanced: boolean }) => {
            localStorage.setItem('offline', 'true');
            localStorage.setItem('user', JSON.stringify(args.user));
            // WelcomeModal renders a full-screen backdrop that swallows clicks
            // (src/components/WelcomeModal/WelcomeModal.tsx:4).
            localStorage.setItem('jjodel_welcome_3_seen', '1');
            localStorage.setItem('jjodel.interfaceMode', args.advanced ? 'advanced' : 'basic');
        },
        { user: OFFLINE_USER, advanced },
    );
}

/** Creates a project through the real UI and returns its id, or null. */
export async function createProject(page: Page, name: string): Promise<string | null> {
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

export interface OpenedState {
    page: Page;
    ctx: BrowserContext;
    logs: Array<{ type: string; text: string }>;
    pageErrors: string[];
    reached: boolean;
}

/**
 * Brings a fresh browser context to the given state. The caller owns ctx and
 * must close it.
 */
export async function openState(browser: Browser, state: SmokeState): Promise<OpenedState> {
    const ctx = await browser.newContext({
        viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    });
    const logs: Array<{ type: string; text: string }> = [];
    const pageErrors: string[] = [];

    await seed(ctx, state.advanced);
    const page = await ctx.newPage();
    // Attached before any navigation so nothing from the first load is missed.
    page.on('console', (m) => logs.push({ type: m.type(), text: m.text() }));
    page.on('pageerror', (e: Error) => pageErrors.push(e.message));

    let reached = false;
    try {
        const pid = await createProject(page, `Smoke_${state.id}`);
        if (pid) {
            await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(NAV_MS);

            if (state.openMetamodelTab) {
                const nm = page.getByText('New metamodel', { exact: true });
                if ((await nm.count()) > 0) {
                    await nm.first().click();
                    await page.waitForTimeout(TAB_MS);
                }
            }

            await page.waitForTimeout(SETTLE_MS);
            reached = true;
        }
    } catch (err) {
        pageErrors.push(`SETUP FAILED: ${err instanceof Error ? err.message : String(err)}`);
    }

    return { page, ctx, logs, pageErrors, reached };
}

/**
 * Coverage deliberately left out of the smoke. Printed by run.ts on every run:
 * a gap that is stated is a known gap, a gap that is silent reads as a pass.
 */
export const NOT_COVERED: Array<{ what: string; why: string }> = [
    {
        what: 'node count > 0',
        why: 'every calibrated state has 0 nodes, correctly: the assertion was meant for the '
            + 'populated viewpoint, which is out of coverage for lack of a fixture. A1 (structure '
            + 'mounted) replaces it as the white-screen proxy.',
    },
    {
        what: 'children clipped beyond tolerance (docs/PROTOCOL.md P8, point 5)',
        why: 'the calibration produced no element from which to define it without false positives.',
    },
    {
        what: 'states properties-panel-open and viewpoint-populated',
        why: 'they need data-testid attributes and a project fixture, neither of which is authorized.',
    },
];
