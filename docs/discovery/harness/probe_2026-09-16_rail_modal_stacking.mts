/**
 * probe_2026-09-16_rail_modal_stacking — chi vince fra il rail delle Properties e la
 * modale del Symbol Editor, misurato sul DOM vivo e non sugli SCSS.
 *
 * Origine: il primo run di `scripts/smoke/_tmp_rules_editor_verify.ts` (slice 1 del
 * rules editor) a 1600px si e' fermato su un click bloccato, con Playwright che
 * nominava `properties-tree-overlay subtree intercepts pointer events` sopra le
 * sezioni Fill e Marker della modale. La sonda della slice 1 ha aggirato il problema
 * portando il viewport a 2400; questa lo misura.
 *
 * ── Cosa misura ──────────────────────────────────────────────────────────────────
 *
 *  A. LA CATENA. Per `.properties-tree-overlay` e per `.symbol-editor-modal-backdrop`,
 *     l'intera catena degli antenati fino a <html>, con per ciascuno position, z-index
 *     e la RAGIONE per cui crea (o non crea) un contesto di impilamento. Il verdetto
 *     non si legge nei due z-index: si legge in quale antenato di ciascuno partecipa
 *     al contesto radice, e con quale z-index.
 *
 *  B. CHI VINCE AL PIXEL. `document.elementsFromPoint` sui pixel delle sezioni Fill e
 *     Marker: i primi tre elementi in ordine di pittura, con il selettore di ciascuno
 *     e l'appartenenza al sottoalbero del rail o della modale.
 *
 *  C. GLI ESPERIMENTI, che distinguono la diagnosi dalle alternative. Sono mutazioni
 *     a runtime sullo stile inline, nessun file toccato, ciascuna annullata:
 *       E1  z-index del rail portato a 0 -> se vince ancora, non e' una gara di
 *           z-index fra pari: e' contenimento.
 *       E2  #root con z-index 10000 -> se la modale torna sopra, il tetto e' #root.
 *       E3  un <div> sintetico dentro #root, position:fixed, z-index 999999 (il
 *           massimo del design system, --z-debug): se il rail lo copre lo stesso,
 *           NESSUN z-index scritto dentro #root puo' vincere, e la questione non e'
 *           il valore 9999 della modale.
 *
 *  D. LE LARGHEZZE. Sweep del viewport con il rail alla sua larghezza di prima
 *     apertura, rect di rail e modale e sovrapposizione in px a ogni passo, piu' la
 *     bisezione del confine. Secondo contesto aperto a 1440 per il bucket di larghezza
 *     rail inferiore (`firstOpenOverlayWidth`: <1600 -> 360, <2200 -> 400, poi 560).
 *
 * ── Controlli positivi (P12) ─────────────────────────────────────────────────────
 *  - un pixel della modale lontano dal rail deve restituire la modale: senza, un
 *    «vince il rail» non si distingue da un elementsFromPoint che non legge nulla;
 *  - un pixel del rail fuori dalla modale deve restituire il rail;
 *  - a viewport largo la stessa sezione Fill deve tornare cliccabile: senza, «bloccato»
 *    non si distingue da «sezione mai renderizzata».
 *
 * Non coperto, dichiarato: le altre modali di pari struttura (ImportSummaryModal,
 * ValidationResultsModal, ValidationRulesModal) non vengono aperte; E3 misura la
 * classe di difetto che le riguarda tutte, il singolo caso no.
 *
 * Col dev server su (P8: porta 3000):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-16_rail_modal_stacking.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import type { Browser, BrowserContext, Page } from '@playwright/test';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';
import { JjodelEvents } from '../../../frontend/src/events/registry.ts';

const SHOT_DIR = process.env.PROBE_SHOT_DIR
    ?? '/private/tmp/claude-501/-Users-alfonso-jjodel/a6fa064e-ed10-490e-b533-550df5244836/scratchpad';
const VIEW = 'Pointer_IRDemoBaseView_State';
const VP = 'Pointer_IRDemoViewpoint_State';

let pass = 0, fail = 0;
const check = (l: string, ok: boolean, d: unknown) => {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${l}\n        ${typeof d === 'string' ? d : JSON.stringify(d)}`);
    ok ? pass++ : fail++;
};
const note = (l: string, d: unknown) => console.log(`  MISURA  ${l}\n        ${typeof d === 'string' ? d : JSON.stringify(d)}`);

// ── the in-page toolkit, injected once per page ─────────────────────────────────
const TOOLKIT = () => {
    const w = window as any;
    const sel = (el: Element | null): string => {
        if (!el) return '(null)';
        if (el === document.documentElement) return 'html';
        if (el === document.body) return 'body';
        const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : '';
        const cls = typeof el.className === 'string' && el.className
            ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
            : '';
        return `${el.tagName.toLowerCase()}${id}${cls}`;
    };
    /** Why this element does (or does not) create a stacking context, per the CSS rules. */
    const scReasons = (el: Element): string[] => {
        const cs = getComputedStyle(el);
        const out: string[] = [];
        if (el === document.documentElement) out.push('root element');
        if (cs.position === 'fixed' || cs.position === 'sticky') out.push(`position:${cs.position}`);
        if ((cs.position === 'relative' || cs.position === 'absolute') && cs.zIndex !== 'auto') out.push(`position:${cs.position} + z-index:${cs.zIndex}`);
        const pd = el.parentElement ? getComputedStyle(el.parentElement).display : '';
        if (/flex|grid/.test(pd) && cs.zIndex !== 'auto') out.push(`flex/grid item + z-index:${cs.zIndex}`);
        if (parseFloat(cs.opacity) < 1) out.push(`opacity:${cs.opacity}`);
        if (cs.transform !== 'none') out.push(`transform:${cs.transform}`);
        if (cs.filter !== 'none') out.push(`filter:${cs.filter}`);
        if ((cs as any).backdropFilter && (cs as any).backdropFilter !== 'none') out.push('backdrop-filter');
        if (cs.perspective !== 'none') out.push('perspective');
        if (cs.clipPath && cs.clipPath !== 'none') out.push('clip-path');
        if ((cs as any).maskImage && (cs as any).maskImage !== 'none') out.push('mask');
        if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') out.push(`mix-blend-mode:${cs.mixBlendMode}`);
        if ((cs as any).isolation === 'isolate') out.push('isolation:isolate');
        if (cs.willChange && /transform|opacity|filter|perspective|z-index|contain/.test(cs.willChange)) out.push(`will-change:${cs.willChange}`);
        if (cs.contain && /paint|layout|strict|content/.test(cs.contain)) out.push(`contain:${cs.contain}`);
        if (cs.containerType && cs.containerType !== 'normal') out.push(`container-type:${cs.containerType}`);
        return out;
    };
    /** Ancestor chain, nearest first, up to <html>. */
    w.__chain = (s: string) => {
        const start = document.querySelector(s);
        if (!start) return null;
        const rows: any[] = [];
        let el: Element | null = start;
        while (el) {
            const cs = getComputedStyle(el);
            const r = scReasons(el);
            rows.push({
                el: sel(el),
                position: cs.position,
                zIndex: cs.zIndex,
                createsSC: r.length > 0,
                why: r,
            });
            el = el.parentElement;
        }
        return rows;
    };
    /**
     * The ancestor (or the element itself) that participates DIRECTLY in the root
     * stacking context: the outermost SC-creating element below <html>.
     */
    w.__participant = (s: string) => {
        const start = document.querySelector(s);
        if (!start) return null;
        let el: Element | null = start;
        let best: Element | null = null;
        while (el && el !== document.documentElement) {
            if (scReasons(el).length > 0) best = el;
            el = el.parentElement;
        }
        if (!best) return { el: '(none: painted in the root context by its nearest positioned/SC ancestor)', zIndex: 'n/a' };
        const cs = getComputedStyle(best);
        const sib = Array.from(document.body.children).indexOf(best as any);
        return { el: sel(best), position: cs.position, zIndex: cs.zIndex, bodyChildIndex: sib, why: scReasons(best) };
    };
    /** Paint order at a pixel: the first `n` hits, with subtree membership. */
    w.__hits = (x: number, y: number, n = 4) => {
        const rail = document.querySelector('.properties-tree-overlay');
        const modal = document.querySelector('.symbol-editor-modal-backdrop');
        return (document.elementsFromPoint(x, y) || []).slice(0, n).map((e) => ({
            el: sel(e),
            inRail: !!rail && rail.contains(e),
            inModal: !!modal && modal.contains(e),
            z: getComputedStyle(e).zIndex,
        }));
    };
    w.__rect = (s: string) => {
        const el = document.querySelector(s);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) };
    };
    /**
     * Census of the modal's interactive controls. «Blocked» is not a rect
     * intersection: it is the hit test the browser itself runs on the control's
     * centre pixel — the same question a click asks.
     */
    w.__census = () => {
        const rail = document.querySelector('.properties-tree-overlay');
        const modal = document.querySelector('.symbol-editor-modal');
        if (!modal) return null;
        const mr = modal.getBoundingClientRect();
        const name = (e: Element) => (e.getAttribute('aria-label') || (e.textContent ?? '').replace(/\s+/g, ' ').trim() || e.tagName).slice(0, 34);
        const out = { visible: 0, blocked: [] as any[], reachable: 0 };
        for (const e of Array.from(modal.querySelectorAll('button,[role=radio],[role=switch],[role=tab],input,select,textarea'))) {
            const r = e.getBoundingClientRect();
            // inside the modal's own visible box: the panes clip, and a control
            // scrolled out of the pane is not on screen at all.
            if (r.width <= 0 || r.height <= 0) continue;
            if (r.top < mr.top || r.bottom > mr.bottom || r.left < mr.left || r.right > mr.right) continue;
            out.visible++;
            const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
            const top = document.elementFromPoint(cx, cy);
            if (rail && top && rail.contains(top)) {
                (e as HTMLElement).setAttribute('data-probe-blocked', '1');
                out.blocked.push({ name: name(e), x: Math.round(r.x), right: Math.round(r.right), y: Math.round(r.y), blockedBy: sel(top) });
            } else out.reachable++;
        }
        return out;
    };
    /** The body-level scale: every child of <body>, in DOM order, with its level. */
    w.__bodyChildren = () => Array.from(document.body.children).map((e) => {
        const cs = getComputedStyle(e);
        return { el: sel(e), position: cs.position, zIndex: cs.zIndex, createsSC: scReasons(e).length > 0 };
    });
    /** The value of a custom property as the browser resolves it on :root. */
    w.__token = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    /**
     * Every section of the appearance tab, with its rect and how many of its own
     * controls the rail is covering. Which named section sits in the covered column
     * is not a constant: the tab is a column flow and the sections move with their
     * own content height, so the invariant is the strip, not the name.
     */
    w.__sections = () => {
        const rail = document.querySelector('.properties-tree-overlay');
        const body = document.querySelector('.ir-tab-body--appearance');
        if (!body) return null;
        return Array.from(body.querySelectorAll('section')).map((s) => {
            const r = s.getBoundingClientRect();
            const title = (s.querySelector('h3,h4')?.textContent ?? '').trim().slice(0, 24);
            let blocked = 0, total = 0;
            for (const e of Array.from(s.querySelectorAll('button,[role=radio],[role=switch],input,select,textarea'))) {
                const er = e.getBoundingClientRect();
                if (er.width <= 0 || er.height <= 0) continue;
                total++;
                const top = document.elementFromPoint(er.x + er.width / 2, er.y + er.height / 2);
                if (rail && top && rail.contains(top)) blocked++;
            }
            return { title, x: Math.round(r.x), right: Math.round(r.right), y: Math.round(r.y), bottom: Math.round(r.bottom), controls: total, blocked };
        });
    };
    /** Scrolls the modal pane that owns the given title, so the section comes on screen. */
    w.__scrollTo = (title: string) => {
        const root = document.querySelector('.symbol-editor-modal-backdrop');
        if (!root) return false;
        const leaf = Array.from(root.querySelectorAll('*')).find((e) => e.children.length === 0 && (e.textContent ?? '').trim() === title);
        if (!leaf) return false;
        leaf.scrollIntoView({ block: 'center' });
        return true;
    };
};

/** The Fill / Marker / Shape section: nearest ancestor of the title with one Value mode group. */
const tagSection = (page: Page, title: string) => page.evaluate((t: string) => {
    const root = document.querySelector('.symbol-editor-modal-backdrop');
    if (!root) return null;
    const leaves = Array.from(root.querySelectorAll('*')).filter((e) => e.children.length === 0 && (e.textContent ?? '').trim() === t);
    for (const leaf of leaves) {
        let el: HTMLElement | null = leaf.parentElement;
        while (el && el !== root) {
            const groups = el.querySelectorAll('[role=radiogroup][aria-label="Value mode"]');
            if (groups.length === 1) {
                el.setAttribute('data-probe-section', t);
                const r = el.getBoundingClientRect();
                const g = groups[0].getBoundingClientRect();
                return {
                    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), right: Math.round(r.right), bottom: Math.round(r.bottom) },
                    radios: { x: Math.round(g.x), y: Math.round(g.y), w: Math.round(g.width), right: Math.round(g.right) },
                };
            }
            if (groups.length > 1) break;
            el = el.parentElement;
        }
    }
    return null;
}, title);

// ── fixture ─────────────────────────────────────────────────────────────────────
async function buildFixture(browser: Browser, width: number, height: number, railWidth?: number): Promise<{ ctx: BrowserContext; page: Page; errors: string[] } | null> {
    const ctx = await browser.newContext({ viewport: { width, height } });
    await seed(ctx, true);
    if (railWidth !== undefined) {
        await ctx.addInitScript((wpx: number) => { localStorage.setItem('jjodel_property_overlay_width', String(wpx)); }, railWidth);
    }
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded', timeout: NAV_MS });
    await page.waitForTimeout(SETTLE_MS);
    const pid = await createProject(page, `Smoke_Stack_${Date.now()}`);
    await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(NAV_MS + SETTLE_MS);

    const built = await page.evaluate(async () => {
        const w = window as any;
        try {
            const project = w.LProject.getProject();
            const dM2 = w.DModel.new('StackM2', undefined, true);
            const lM2 = w.LModel.fromD(dM2);
            const dG2 = w.DGraph.new(0, dM2.id);
            w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
            w.SetFieldAction.new(project.id, 'graphs', dG2.id, '+=', true);
            w.SetFieldAction.new(dG2.id, 'graphStyle', 'v2-flow', '', false);
            const lPkg = w.LPackage.fromD(lM2.addChild('package'));
            lPkg.name = 'chart';
            const lState = w.LClass.fromD(lPkg.addClass('State'));
            lState.addAttribute('name', 'Pointer_ESTRING');
            for (const a of ['isInitial', 'isFinal', 'isHistory']) lState.addAttribute(a, 'Pointer_EBOOLEAN');
            w.DVertex.new(lState.id, dG2.id);

            const dM1 = w.DModel.new('StackM1', dM2.id, false, true);
            const dG1 = w.DGraph.new(0, dM1.id);
            w.SetFieldAction.new(dG1.id, 'graphStyle', 'v2-flow', '', false);
            w.SetFieldAction.new(project.id, 'models', dM1.id, '+=', true);
            w.SetRootFieldAction.new('graphs', dG1.id, '+=', true);
            w.SetFieldAction.new(project.id, 'graphs', dG1.id, '+=', true);
            return { ok: true, m1: dM1.id, g1: dG1.id, state: lState.id };
        } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
    });
    if (!built.ok) { console.log('FIXTURE FAILED ' + (built as any).error); await ctx.close(); return null; }
    await page.waitForTimeout(2500);

    const made = await page.evaluate((a: { m1: string; g1: string; state: string }) => {
        const w = window as any;
        try {
            const put = (v: any, x: number, y: number) => { w.SetFieldAction.new(v.id, 'x', x, '', false); w.SetFieldAction.new(v.id, 'y', y, '', false); };
            for (const [name, x] of [['Idle', 80], ['Running', 360], ['Done', 640]] as const) {
                const o = w.DObject.new(a.state, a.m1, w.DModel, name, true);
                put(w.DVertex.new(o.id, a.g1), x, 160);
            }
            return 'ok';
        } catch (e) { return e instanceof Error ? e.message : String(e); }
    }, built as any);
    if (made !== 'ok') { console.log('FIXTURE FAILED (objects) ' + made); await ctx.close(); return null; }
    await page.waitForTimeout(2500);

    await page.evaluate(async (vp: string) => {
        const w = window as any;
        w.__jjodelInstallIRDemo('State', 'isHistory');
        await new Promise(r => setTimeout(r, 500));
        const lv: any = await import('/src/utils/lastViewpoint.ts');
        lv.activateViewpoint(vp);
        await new Promise(r => setTimeout(r, 500));
    }, VP);
    await page.evaluate((m1: string) => { const w = window as any; w.DockManager.open2(w.LModel.fromPointer(m1)); }, built.m1);
    await page.waitForTimeout(5000);
    await page.evaluate(TOOLKIT);
    return { ctx, page, errors };
}

const openModal = async (page: Page) => {
    await page.evaluate(({ ev, v }: { ev: string; v: string }) => window.dispatchEvent(new CustomEvent(ev, { detail: { viewId: v } })), { ev: JjodelEvents.SYMBOL_EDITOR_OPEN, v: VIEW });
    await page.waitForTimeout(2500);
};

const browser = await chromium.launch();

// ══ RUN A — 1600x1000, the reported width ═══════════════════════════════════════
console.log('\n════ RUN A — 1600x1000 ════');
const A = await buildFixture(browser, 1600, 1000);
if (!A) { await browser.close(); process.exit(1); }
const page = A.page;

const railRect0 = await page.evaluate(() => (window as any).__rect('.properties-tree-overlay'));
check('A0a the rail is mounted and on screen', !!railRect0 && railRect0.w > 0, railRect0);
note('A0b rail width at first open (firstOpenOverlayWidth: <1600->360, <2200->400, else 560)', railRect0?.w);
await openModal(page);
const modalRect = await page.evaluate(() => (window as any).__rect('.symbol-editor-modal'));
const backRect = await page.evaluate(() => (window as any).__rect('.symbol-editor-modal-backdrop'));
check('A0c the modal is open', !!modalRect && modalRect.w > 0, { modal: modalRect, backdrop: backRect });

// ── A. the chains ──────────────────────────────────────────────────────────────
console.log('\n== A. stacking chains ==');
const railChain = await page.evaluate(() => (window as any).__chain('.properties-tree-overlay'));
const modalChain = await page.evaluate(() => (window as any).__chain('.symbol-editor-modal-backdrop'));
note('A1 rail chain (nearest first)', railChain);
note('A2 modal chain (nearest first)', modalChain);
const railPart = await page.evaluate(() => (window as any).__participant('.properties-tree-overlay'));
const modalPart = await page.evaluate(() => (window as any).__participant('.symbol-editor-modal-backdrop'));
note('A3 rail participant in the ROOT stacking context', railPart);
note('A4 modal participant in the ROOT stacking context', modalPart);
check('A5 the rail is portaled to <body>, sibling of #root', railChain?.[1]?.el === 'body', railChain?.[1]?.el);
check('A6 the modal lives inside #root', (modalChain ?? []).some((r: any) => r.el.startsWith('div#root')), (modalChain ?? []).map((r: any) => r.el));
check('A7 #root creates a stacking context', (modalChain ?? []).some((r: any) => r.el.startsWith('div#root') && r.createsSC), (modalChain ?? []).find((r: any) => r.el.startsWith('div#root')));
const bodyKids = await page.evaluate(() => (window as any).__bodyChildren());
note('A8 the body-level scale: every child of <body> (D-UI-14 census, re-measured)', bodyKids);
const zTok = await page.evaluate(() => ({ modal: (window as any).__token('--z-modal'), alert: (window as any).__token('--z-alert'), dropdown: (window as any).__token('--z-dropdown-menu') }));
note('A9 the tokens as the browser resolves them', zTok);
check('A10 --z-modal resolves to 1050, not the 9999 the SCSS declares (two token files)', zTok.modal === '1050', zTok.modal);

// ── B. who wins at the pixel ───────────────────────────────────────────────────
console.log('\n== B. who wins at the pixel ==');
const fill = await tagSection(page, 'Fill');
const marker = await tagSection(page, 'Marker');
note('B0 Fill section rect / radios', fill);
note('B0b Marker section rect / radios', marker);
const hitsAt = (x: number, y: number) => page.evaluate(([px, py]: number[]) => (window as any).__hits(px, py), [x, y]);
const pt = (s: any) => [s.rect.right - 8, Math.round(s.rect.y + 12)] as const;
const census = () => page.evaluate(() => (window as any).__census());
if (fill && marker) {
    const [fx, fy] = pt(fill);
    const hFill = await hitsAt(fx, fy);
    note(`B1 elementsFromPoint at the Fill section's right edge (${fx},${fy})`, hFill);
    check('B2 the rail wins over the Fill section', hFill[0]?.inRail === true, hFill[0]);
    const cIn = await hitsAt(Math.round(modalRect.x + 40), Math.round(modalRect.y + modalRect.h / 2));
    check('B3 CONTROL a modal pixel far from the rail returns the modal', cIn[0]?.inModal === true, cIn[0]);
    const cRail = await hitsAt(Math.round(railRect0.x + railRect0.w / 2), Math.round(railRect0.y + railRect0.h - 40));
    check('B4 CONTROL a rail pixel outside the modal returns the rail', cRail[0]?.inRail === true, cRail[0]);

    // The rules table, which is what the slice 1 probe was driving: Fill -> Conditional,
    // then one rule, so the row actions of the mockup 2b table actually exist.
    await page.locator('[data-probe-section="Fill"] [role=radio]', { hasText: /^Conditional$/ }).click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(900);
    await tagSection(page, 'Fill');
    await page.locator('[data-probe-section="Fill"]').getByRole('button', { name: /Add first rule/ }).click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(900);
    const fill2 = await tagSection(page, 'Fill');
    note('B5 Fill section rect with the rules table open', fill2);

    const cen = await census();
    note('B6 census of the modal controls on screen', { visible: cen?.visible, reachable: cen?.reachable, blocked: cen?.blocked.length });
    note('B7 the blocked controls, by name', cen?.blocked);
    check('B8 at least one interactive control of the modal is blocked by the rail', (cen?.blocked.length ?? 0) > 0, cen?.blocked.length);
    const closeRect = await page.evaluate(() => (window as any).__rect('.symbol-editor-modal__close-btn'));
    const closeTop = closeRect ? await hitsAt(Math.round(closeRect.x + closeRect.w / 2), Math.round(closeRect.y + closeRect.h / 2)) : null;
    check('B8b the modal\'s own Close button is covered by the rail', closeTop?.[0]?.inRail === true, { closeRect, top: closeTop?.[0] });

    // The real gesture: Playwright's own actionability check names the blocker.
    const clickErr = await page.locator('[data-probe-blocked]').first().click({ timeout: 3000 }).then(() => null).catch((e) => String(e));
    const named = !!clickErr && /properties-tree-overlay/.test(clickErr);
    check('B9 clicking a blocked control fails, and Playwright names the rail as the blocker', named,
        clickErr ? (clickErr.split('\n').find((l) => /intercepts pointer events/.test(l)) ?? clickErr.split('\n').slice(0, 2).join(' | ')) : 'click succeeded');

    // Which named section is in the covered column, in THIS state.
    const secs = await page.evaluate(() => (window as any).__sections());
    note('B10 sections of the appearance tab: rect and blocked controls', secs);

    // Marker sits further down the same flow: bring it on screen and measure it there.
    await page.evaluate(() => (window as any).__scrollTo('Marker'));
    await page.waitForTimeout(500);
    const marker2 = await tagSection(page, 'Marker');
    const secs2 = await page.evaluate(() => (window as any).__sections());
    note('B11 Marker section rect after scrolling it into view', marker2);
    note('B12 sections after the scroll', secs2);
    if (marker2) {
        const [mx, my] = pt(marker2);
        const hMark = await hitsAt(mx, my);
        note(`B13 elementsFromPoint at Marker (${mx},${my})`, hMark);
    }
    const cen2 = await census();
    note('B14 census after the scroll', { visible: cen2?.visible, reachable: cen2?.reachable, blocked: cen2?.blocked.map((b: any) => b.name) });
    await page.screenshot({ path: `${SHOT_DIR}/stacking_A_1600.png` });
}

// ── C. the experiments ─────────────────────────────────────────────────────────
console.log('\n== C. experiments ==');
if (fill) {
    const [fx, fy] = pt(fill);
    const e1 = await page.evaluate(([px, py]: number[]) => {
        const w = window as any;
        const rail = document.querySelector('.properties-tree-overlay') as HTMLElement;
        const prev = rail.style.zIndex;
        rail.style.zIndex = '0';
        const hits = w.__hits(px, py);
        rail.style.zIndex = prev;
        return hits;
    }, [fx, fy]);
    check('C1 E1 rail forced to z-index 0: the rail STILL wins (not a peer contest)', e1[0]?.inRail === true, e1[0]);

    const e2 = await page.evaluate(([px, py]: number[]) => {
        const w = window as any;
        const root = document.getElementById('root') as HTMLElement;
        const prev = root.style.zIndex;
        root.style.zIndex = '10000';
        const hits = w.__hits(px, py);
        root.style.zIndex = prev;
        return hits;
    }, [fx, fy]);
    check('C2 E2 #root lifted to z-index 10000: the modal wins (the cap is #root)', e2[0]?.inModal === true, e2[0]);

    const e3 = await page.evaluate(([px, py]: number[]) => {
        const w = window as any;
        const probe = document.createElement('div');
        probe.id = '__sc_probe';
        probe.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(255,0,0,0.01)';
        document.getElementById('root')!.appendChild(probe);
        const hits = w.__hits(px, py);
        const top = hits[0];
        probe.remove();
        return { hits, probeOnTop: top?.el === 'div#__sc_probe' };
    }, [fx, fy]);
    check('C3 E3 a z-index 999999 fixed div INSIDE #root is still covered by the rail', e3.probeOnTop === false && e3.hits[0]?.inRail === true, e3);
}

// ── D. widths (rail pinned at its first-open width) ────────────────────────────
console.log('\n== D. widths, rail pinned at the first-open width ==');
const sweep = async (widths: number[]) => {
    const rows: any[] = [];
    for (const wpx of widths) {
        await page.setViewportSize({ width: wpx, height: 1000 });
        await page.waitForTimeout(700);
        const r = await page.evaluate(() => (window as any).__rect('.properties-tree-overlay'));
        const m = await page.evaluate(() => (window as any).__rect('.symbol-editor-modal'));
        const s = await tagSection(page, 'Fill');
        const overlapModal = r && m ? Math.max(0, m.right - r.x) : null;
        const overlapFill = r && s ? Math.max(0, s.rect.right - r.x) : null;
        const overlapRadios = r && s ? Math.max(0, s.radios.right - r.x) : null;
        let top: any = null;
        if (s) { const [px, py] = pt(s); top = (await hitsAt(px, py))[0]; }
        const cen = await census();
        rows.push({ vw: wpx, railX: r?.x, railW: r?.w, modalRight: m?.right, overlapModal, overlapFill, overlapRadios, topAtFill: top?.el, railWins: top?.inRail ?? null, blockedControls: cen?.blocked.length ?? null, blockedNames: (cen?.blocked ?? []).map((b: any) => b.name) });
    }
    return rows;
};
const rows = await sweep([1280, 1366, 1440, 1600, 1680, 1760, 1800, 1840, 1880, 1920, 2200, 2400]);
for (const r of rows) note(`D1 vw=${r.vw}`, r);
const biten = rows.filter(r => (r.blockedControls ?? 0) > 0).map(r => r.vw);
const clean = rows.filter(r => r.blockedControls === 0).map(r => r.vw);
note('D2 widths with at least one blocked control', biten);
note('D3 widths with none', clean);
check('D4 CONTROL at a wide viewport every control of the modal is reachable', clean.length > 0, { clean });
// Two boundaries, and they are not the same number: the rail stops overlapping the
// modal's BOX at one width, and stops covering the last CONTROL at a smaller one.
const fine = await sweep([1764, 1772, 1780, 1788, 1796, 1836, 1840, 1844]);
for (const r of fine) note(`D5 bisection vw=${r.vw}`, r);
const lastBlocked = fine.filter(r => (r.blockedControls ?? 0) > 0).map(r => r.vw);
const firstOverlapFree = fine.filter(r => r.overlapModal === 0).map(r => r.vw);
note('D6 widths of the bisection where a control is still blocked', lastBlocked);
note('D7 widths of the bisection with zero rail/modal box overlap', firstOverlapFree);

note('A-run page errors', A.errors.slice(0, 5));
await A.ctx.close();

// ══ RUN B — 1440 first open: the 360px rail bucket ══════════════════════════════
console.log('\n════ RUN B — first open at 1440 (rail bucket 360) ════');
const B = await buildFixture(browser, 1440, 900);
if (B) {
    const rb = await B.page.evaluate(() => (window as any).__rect('.properties-tree-overlay'));
    note('B-run rail width at first open', rb?.w);
    await openModal(B.page);
    const s = await tagSection(B.page, 'Fill');
    const m = await B.page.evaluate(() => (window as any).__rect('.symbol-editor-modal'));
    let top: any = null;
    if (s) { const [px, py] = pt(s); top = await B.page.evaluate(([x, y]: number[]) => (window as any).__hits(x, y), [px, py]); }
    const cenB = await B.page.evaluate(() => (window as any).__census());
    note('B-run rail/modal/Fill at 1440', { rail: rb, modal: m, fill: s?.rect, top: top?.[0] });
    note('B-run census at 1440', { visible: cenB?.visible, blocked: cenB?.blocked.map((b: any) => b.name) });
    check('E1 at 1440 with a 360px rail the rail still wins over Fill', top?.[0]?.inRail === true, top?.[0]);
    await B.page.screenshot({ path: `${SHOT_DIR}/stacking_B_1440.png` });
    await B.ctx.close();
}

await browser.close();
console.log(`\n== ${pass} PASS  ${fail} FAIL ==`);
process.exit(fail === 0 ? 0 : 1);
