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

// ── The shared containment poser ────────────────────────────────────────────

/**
 * `link` — pose a value into a slot, and assert the shape it built.
 *
 * Probes kept re-deriving the append index from the store:
 *
 *     const idx = (idlookup[slotId]?.values ?? []).length;   // <- stale
 *     lslot.setValueAtPosition(idx, target.id);
 *
 * Inside the propagation window that read is stale, so two consecutive appends
 * both compute the same index: the second overwrites the first, and the first
 * occupant is left with `father` on a slot that no longer lists it — an orphan,
 * returned as `{success: true}`. Measured in
 * `docs/discovery/discovery_2026-09-01_eng1_containment_core.md` §B.1-B.4: no
 * read cures it, because `store.getState()` is exactly as stale as
 * `context.data` until the deferred dispatch lands (`redux/action/action.ts:349`).
 *
 * Two decisions follow, and they are the whole of this helper:
 *
 *  1. **The index is never re-derived.** A per-slot cursor on `window` is seeded
 *     from the store on first use and then owned by this function. Each call
 *     writes the whole array through a single `values = [...]` (`set_values`,
 *     `LModelElement.tsx:7896`), the one form whose indices are assigned by the
 *     caller on an array it holds — coherent by construction (ENG1 arm A8).
 *     That funnel goes through `get_setValueAtPosition` per index, so it also
 *     writes `father` on containment, which a raw
 *     `SetFieldAction.new(slot,'values',id,'+=')` does not.
 *  2. **The shape is asserted, not waited for** (README-probes.md §"Assert the
 *     setup, do not wait for it"). The poll below ends on the assertion, and a
 *     timeout returns `ok: false` carrying its last measurement — never a
 *     silence that reads like a pass.
 *
 * The containment check carries its own per contrasto: on a non-containment
 * reference it asserts the father is *not* the slot, so a helper that wrote the
 * father unconditionally would fail instead of passing on half the evidence.
 */
export interface LinkResult {
    /** Every assertion below held within the poll window. */
    ok: boolean;
    /** Populated on failure, and on any lookup that did not resolve. */
    error?: string;
    slotId?: string;
    /**
     * The array this call claims to have built (cursor, not a re-read). It is
     * asserted as a **prefix** of `actual`, not as its whole content: what this
     * call owns is that its values landed at the indices the cursor assigned.
     * Trailing entries written by another poser are not this call's business —
     * and a value lost or overwritten still breaks the prefix, which is the
     * failure this helper exists to catch.
     */
    expected?: string[];
    /** `values` as the store reports them when the poll ended. */
    actual?: string[];
    /** The DReference is a composition: `composition || containment` (§3.8). */
    containment?: boolean;
    /** className of the target's father: 'DValue' when contained, else 'DModel'. */
    fatherKind?: string;
    /** id of the target's father. */
    fatherId?: string;
    /** ms the assertion took to hold. */
    settledMs?: number;
}

/** Poll budget for the assertion. The window measured in ENG1 §B.4 is ~50ms. */
const LINK_ASSERT_TIMEOUT_MS = 4000;
const LINK_POLL_MS = 100;

/**
 * Appends `target` to `owner`'s `ref` slot and asserts the result.
 *
 * Objects and the reference are addressed **by name** (README-probes.md
 * §"Select by name, never by index"). The reference is looked up on the
 * instance's own metaclass, without walking supertypes: an inherited reference
 * comes back as `ok: false` with the reason, not as a silent skip.
 */
export async function link(
    page: Page,
    owner: string,
    ref: string,
    target: string,
): Promise<LinkResult> {
    const posed = await page.evaluate(
        (a: { owner: string; ref: string; target: string }) => {
            const w = window as any;
            try {
                const idl = w.windoww.store.getState().idlookup;
                const byName = (n: string) => {
                    for (const id in idl) {
                        const e = idl[id];
                        if (e?.className === 'DObject' && e.name === n) return e;
                    }
                    return null;
                };
                const from = byName(a.owner);
                if (!from) return { error: `istanza ${a.owner} non trovata` };
                const to = byName(a.target);
                if (!to) return { error: `istanza ${a.target} non trovata` };
                const refDef = (Object.values(idl) as any[]).find(
                    (e) =>
                        e?.className === 'DReference' &&
                        e.name === a.ref &&
                        idl[from.instanceof]?.references?.includes(e.id),
                );
                if (!refDef) return { error: `referenza ${a.ref} non trovata su ${a.owner}` };
                const slotId = (from.features ?? []).find(
                    (f: string) => idl[f]?.instanceof === refDef.id,
                );
                if (!slotId) return { error: `slot ${a.ref} assente su ${a.owner}` };

                // The cursor: seeded once from the store, owned from then on.
                if (!w.__smokeLinkCursor) w.__smokeLinkCursor = {};
                const prev: string[] =
                    w.__smokeLinkCursor[slotId] ?? ((idl[slotId]?.values ?? []).slice() as string[]);
                const next = [...prev, to.id];
                w.__smokeLinkCursor[slotId] = next;

                // One single set_values: the indices are assigned on the array
                // held here, never re-read from a store that cannot see them yet.
                w.LPointerTargetable.fromPointer(slotId).values = next;

                return {
                    slotId,
                    targetId: to.id,
                    expected: next,
                    // CLAUDE.md §3.8: `composition` is the canonical D-layer
                    // field; `containment` is the legacy spelling, still written
                    // by some paths. Reading only the second one gives `false`
                    // on every reference the L-layer calls a composition — the
                    // first version of this helper did exactly that, and the
                    // per contrasto below then failed on a correct write.
                    containment: refDef.composition === true || refDef.containment === true,
                };
            } catch (e) {
                return { error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) };
            }
        },
        { owner, ref, target },
    );

    if ((posed as any).error) return { ok: false, error: (posed as any).error };
    const p = posed as {
        slotId: string;
        targetId: string;
        expected: string[];
        containment: boolean;
    };

    const started = Date.now();
    let last: { actual: string[]; fatherKind: string; fatherId: string } = {
        actual: [],
        fatherKind: 'NON-LETTO',
        fatherId: '',
    };
    while (Date.now() - started < LINK_ASSERT_TIMEOUT_MS) {
        last = await page.evaluate(
            (a: { slotId: string; targetId: string }) => {
                const idl = (window as any).windoww.store.getState().idlookup;
                const t = idl[a.targetId];
                const f = t ? idl[t.father] : undefined;
                return {
                    actual: ((idl[a.slotId]?.values ?? []) as string[]).slice(),
                    fatherKind: f?.className ?? (t?.father ? 'FUORI-LOOKUP' : 'NESSUNO'),
                    fatherId: t?.father ?? '',
                };
            },
            { slotId: p.slotId, targetId: p.targetId },
        );
        const valuesOk =
            last.actual.length >= p.expected.length &&
            p.expected.every((v, i) => last.actual[i] === v);
        // Per contrasto inside the assertion: on a plain reference the father
        // must NOT be the slot, so an unconditional father write fails here.
        const fatherOk = p.containment
            ? last.fatherId === p.slotId
            : last.fatherId !== p.slotId;
        if (valuesOk && fatherOk) {
            return {
                ok: true,
                slotId: p.slotId,
                expected: p.expected,
                actual: last.actual,
                containment: p.containment,
                fatherKind: last.fatherKind,
                fatherId: last.fatherId,
                settledMs: Date.now() - started,
            };
        }
        await page.waitForTimeout(LINK_POLL_MS);
    }

    return {
        ok: false,
        error:
            `la forma non si e' assestata in ${LINK_ASSERT_TIMEOUT_MS}ms: ` +
            `values attesi in testa ${JSON.stringify(p.expected)}, letti ${JSON.stringify(last.actual)}; ` +
            `containment=${p.containment}, father=${last.fatherKind} (${last.fatherId})`,
        slotId: p.slotId,
        expected: p.expected,
        actual: last.actual,
        containment: p.containment,
        fatherKind: last.fatherKind,
        fatherId: last.fatherId,
    };
}
