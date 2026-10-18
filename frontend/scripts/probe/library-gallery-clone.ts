/**
 * library-gallery-clone (P-2026-10-18-1800, slice S2): clones each gallery project from the Templates page, as a user
 * does, and checks the clone against its package file (frontend/public/library/gallery/<id>/<n>.jjodel, the current
 * version: R-LIB-9, P-2026-10-18-2300).
 *
 * For each catalog `galleryProject`, in one browser context (so the names collide as in a real workspace):
 *   - Templates → the card's «Clone to my workspace» → the modal, «Project name» prefilled with the label (the graph
 *     entry types its own name) → «Clone & open»;
 *   - the project that opens: its id differs from the file's, its name is the chosen one with no « copy», the
 *     DProject entry carries `_clonedFrom: <id>@<n>`, its metamodels, models and objects are the file's, and
 *     each model's editor shows its nodes;
 *   - a template opens on its hand-written viewpoint (R-LIB-9: the first one, named after its metamodel), and each model
 *     is measured from the DOM against the criteria of P-2026-10-18-2300 (vertex, arc and row counts, labels, forms,
 *     frames holding their children, no arc between a container and its children, every vertex visible after fit: its
 *     four corners hit it and its box lies in the canvas left of the properties panel, clear of the minimap; arc labels
 *     overlap no label and no vertex, each arc touches its source, two arcs between the same vertices run apart), then screenshot as <id>.png (<id>-<model>.png when there are more); an example
 *     is screenshot on each of its viewpoints, its rendering recorded, not asserted;
 *   - an explicit save, then a reopen from the page load: name and `_clonedFrom` survive.
 * The page shows «Templates» then «Examples», each card with its `<id>@<n>`; the deep links `#/templates/graph@1` (the
 * clone dialog of that version, prefilled) and `#/templates/nope@9` (one line, the page as usual) are screenshot.
 * Then a second Library clone takes «Library (1)», and a package with one user-defined megamodel edge is cloned to
 * measure where the import registers it (projects.ts, `registerSerializedMegamodel(json.id, …)`).
 * The Templates shell is checked against the Projects page's, the dialog at rest (animations ended), and the Quick Tip
 * and the donation banner are closed before each screenshot. Screenshots at 1440×900, light theme, into docs/discovery/assets/library-gallery/.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/probe/library-gallery-clone.ts \
 *         --port 3098 --id P-2026-10-18-1800
 * Env:  CLONE_ONLY  comma list of catalog ids to clone (default: every entry)
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import lz from 'async-lz-string';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3098/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const SHOTS = new globalThis.URL('../../../docs/discovery/assets/library-gallery', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

interface Entry { id: string; kind: string; label: string; status: string; tier?: string; version?: number; versions?: Array<{ n: number; file: string }> }
const catalog = JSON.parse(readFileSync(new globalThis.URL('../../../docs/library/catalog.json', import.meta.url), 'utf8')) as { entries: Entry[] };
const ONLY = (process.env.CLONE_ONLY || '').split(',').filter(Boolean);
const GALLERY = catalog.entries.filter(e => e.kind === 'galleryProject' && e.status === 'available');
const refOf = (e: Entry) => `${e.id}@${e.version}`;
const fileOf = (e: Entry) => e.versions!.find(v => v.n === e.version)!.file;
/** The entry whose clone gets a name typed by the user, not the prefilled label. */
const TYPED: Record<string, string> = { graph: 'My Graph' };

let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
};
const meas = (label: string, detail: unknown) => console.log(`MEAS  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

async function poll<T>(page: Page, expr: string, ms: number): Promise<T | null> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        // Bounded: an evaluate begun while the clone's full reload tears the page down can hang past any deadline.
        const v = await Promise.race([page.evaluate(expr).catch(() => null), new Promise(r => setTimeout(() => r(null), 5000))]) as T | null;
        if (v) return v;
        await wait(page, 250);
    }
    return null;
}

/** The file's own project: id, metamodel names, and each model by name with its number of objects. */
async function expected(entry: Entry) {
    const json = JSON.parse(readFileSync(new globalThis.URL(`../../public/${fileOf(entry)}`, import.meta.url), 'utf8'));
    const lk = JSON.parse(await lz.decompressFromUTF16(json.state)).idlookup as Record<string, any>;
    const under = (id: string, root: string) => { let d = lk[lk[id]?.father]; for (let i = 0; d && i < 60; i++) { if (d.id === root) return true; d = lk[d.father]; } return false; };
    const objs = Object.values(lk).filter((d: any) => d?.className === 'DObject') as any[];
    return {
        id: json.id as string,
        metamodels: (json.metamodels as string[]).map(i => lk[i].name).sort(),
        models: Object.fromEntries((json.models as string[]).map(i => [lk[i].name, objs.filter(o => under(o.id, i)).length])) as Record<string, number>,
    };
}

// ── Page side (plain strings: no transform) ─────────────────────────────────────────────────────

const INFO = String.raw`(async () => {
  try {
    const j = await import('/src/joiner/index.ts');
    const lk = window.windoww.store.getState().idlookup;
    const p = j.L.fromPointer(j.DUser.current).project;
    if (!p) return null;
    const under = (id, root) => { let d = lk[lk[id] && lk[id].father]; for (let i = 0; d && i < 60; i++) { if (d.id === root) return true; d = lk[d.father]; } return false; };
    const objs = Object.values(lk).filter((d) => d && d.className === 'DObject');
    const rec = JSON.parse(localStorage.getItem('projects') || '[]').find((r) => r.id === p.id);
    return {
      id: p.id, name: p.name, clonedFrom: (lk[p.id] || {})._clonedFrom ?? null, recordName: rec ? rec.name : null,
      active: (lk[(lk[p.id] || {}).activeViewpoint] || {}).name ?? null, root: (lk[window.windoww.store.getState().viewpoint] || {}).name ?? null,
      viewpoints: ((lk[p.id] || {}).viewpoints || []).map((v) => lk[v]).filter((v) => v && !/^Pointer_/.test(v.id)).map((v) => v.name),
      metamodels: (p.metamodels || []).map((m) => m.name).sort(),
      models: (p.models || []).filter((m) => !m.isMetamodel).map((m) => ({ id: m.id, name: m.name, objects: objs.filter((o) => under(o.id, m.id)).length })),
    };
  } catch (e) { return null; }
})()`;

const SAVE = String.raw`(async () => {
  const j = await import('/src/joiner/index.ts');
  const api = await import('/src/api/persistance/projects.ts');
  await api.ProjectsApi.save(j.L.fromPointer(j.DUser.current).project);
  await new Promise((r) => setTimeout(r, 800));
  return true;
})()`;

/** The Quick Tip and the donation banner cover the page: closed (their own close buttons) before every screenshot,
 *  then the page's animations are let finish, so no popup is caught sliding in. */
async function closeTip(page: Page): Promise<void> {
    // The banner shows 30 s after load (useDonationBanner.ts), so it can arrive after a first pass: three passes.
    for (let pass = 0; pass < 3; pass++) {
        await wait(page, 1500);
        // A DOM click: in the editor the banner sits under the right panel, where a pointer click cannot reach it.
        await page.evaluate(`document.querySelectorAll('.notification-widget.is-tip .notification-close, .donation-banner__close').forEach((b) => b.click())`);
        await poll(page, `!document.querySelector('.notification-widget.is-tip') && !document.querySelector('.donation-banner')`, 5000);
        await poll(page, `document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity)`, 5000);
    }
    meas('before the screenshot', await page.evaluate(`({ mode: localStorage.getItem('jjodel.interfaceMode'), toggle: [...document.querySelectorAll('button')].filter((b) => /^(Basic|Advanced)$/.test((b.textContent || '').trim())).map((b) => b.textContent.trim() + ':' + b.className + ':' + b.getAttribute('aria-pressed')).join(' | '), popups: document.querySelectorAll('.notification-widget.is-tip, .donation-banner').length })`));
}

/** Where the title row and the content below it start, and the shell's padding: the Projects page is the reference. */
const SHELL = String.raw`(() => {
  const t = document.querySelector('.dashboard-page-title'), row = document.querySelector('.dashboard-cta-row'), main = document.querySelector('.dashboard-main-content'), dash = document.querySelector('.dash-content');
  if (!t || !row || !main || !dash || !row.nextElementSibling) return null;
  const r = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; };
  return { title: r(t), content: r(row.nextElementSibling), mainPadding: getComputedStyle(main).padding, dash: dash.className.replace(/\s+/g, ' ').trim(), dashBg: getComputedStyle(dash).backgroundColor };
})()`;

async function openTemplates(page: Page, id: string, hash = '#/templates'): Promise<boolean> {
    await page.goto(`${URL}/${hash}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    const card = `document.querySelector('[data-gallery-id="${id}"]')`;
    const ready = await poll(page, `(() => { const c = ${card}; const t = c && c.querySelector('.templates-card__counts'); return !!(t && /metamodel/.test(t.textContent)); })()`, 120000);
    return !!ready;
}

/** Templates → card → modal → «Clone & open»; returns the name in the modal and the id of the project that opens. */
async function cloneFromTemplates(page: Page, entry: Entry, typed?: string, shot?: string): Promise<{ prefilled: string; chosen: string; info: any } | null> {
    if (!(await openTemplates(page, entry.id))) { check(`${entry.id}: the Templates card shows its counts`, false, ''); return null; }
    if (shot) {
        await closeTip(page);
        const shell = await page.evaluate(SHELL) as any;
        meas('Templates shell', shell);
        check('Templates: title and content start where the Projects page\'s do, same padding',
            !!shell && !!projectsShell && JSON.stringify(shell.title) === JSON.stringify(projectsShell.title)
            && JSON.stringify(shell.content) === JSON.stringify(projectsShell.content) && shell.mainPadding === projectsShell.mainPadding,
            { templates: shell && [shell.title, shell.content], projects: projectsShell && [projectsShell.title, projectsShell.content] });
        const sections = await page.evaluate(`[...document.querySelectorAll('.templates-section')].map((s) => ({ tier: s.dataset.galleryTier, title: s.querySelector('.templates-section__title').textContent, cards: [...s.querySelectorAll('.templates-card')].map((c) => c.dataset.galleryId + ' ' + c.querySelector('.templates-card__ref').textContent) }))`) as any[];
        const want = ['template', 'example'].map(t => ({ tier: t, title: t === 'template' ? 'Templates' : 'Examples', cards: GALLERY.filter(e => e.tier === t).map(e => `${e.id} ${refOf(e)}`) }));
        check('Templates: «Templates» then «Examples», cards in catalog order, each with its <id>@<n>', JSON.stringify(sections) === JSON.stringify(want), sections);
        // Each card: the title on one line, the id on its own line under it, one line, not cut.
        const cards = await page.evaluate(`[...document.querySelectorAll('.templates-card')].map((c) => {
          const t = c.querySelector('.templates-card__label'), r = c.querySelector('.templates-card__ref');
          const lh = (e) => parseFloat(getComputedStyle(e).lineHeight) || 20;
          return { id: c.dataset.galleryId, titleLines: Math.round(t.getBoundingClientRect().height / lh(t)), refLines: Math.round(r.getBoundingClientRect().height / lh(r)),
            below: r.getBoundingClientRect().top >= t.getBoundingClientRect().bottom - 1, cut: r.scrollWidth > r.clientWidth || t.scrollWidth > t.clientWidth, mono: getComputedStyle(r).fontFamily };
        })`) as any[];
        check('Templates: every card has its title on one line and its <id>@<n> on its own line below, unwrapped, not cut',
            cards.length === GALLERY.length && cards.every((c: any) => c.titleLines === 1 && c.refLines === 1 && c.below && !c.cut), cards);
        await page.screenshot({ path: `${SHOTS}/${shot}-page.png` });
    }
    await page.locator(`[data-gallery-id="${entry.id}"] button`, { hasText: 'Clone to my workspace' }).click();
    const input = page.locator('#templates-clone-name');
    await input.waitFor({ timeout: 10000 });
    const prefilled = await input.inputValue();
    if (typed) await input.fill(typed);
    const chosen = typed ?? prefilled;
    if (shot) {
        await closeTip(page);
        // The dialog slides up in 200 ms (create-project-dialog.scss): the screenshot waits for its animations to end.
        const dlg = await poll<any>(page, String.raw`(() => {
          const d = document.querySelector('.templates-clone-dialog'), o = document.querySelector('.dialog-overlay');
          if (!d || !o || ![...d.getAnimations(), ...o.getAnimations()].every((a) => a.playState === 'finished')) return null;
          const cs = getComputedStyle(d), b = d.getBoundingClientRect();
          const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
          return { opacity: cs.opacity, zIndex: cs.zIndex, background: cs.backgroundColor, overlayZ: getComputedStyle(o).zIndex, onTop: !!top && d.contains(top), value: document.querySelector('#templates-clone-name').value };
        })()`, 10000);
        meas('clone dialog at rest', dlg);
        check('the clone dialog is opaque, white, above the overlay, prefilled', !!dlg && dlg.opacity === '1' && dlg.background === 'rgb(255, 255, 255)'
            && Number(dlg.zIndex) > Number(dlg.overlayZ) && dlg.onTop && dlg.value === chosen, dlg);
        await page.screenshot({ path: `${SHOTS}/${shot}-modal.png` });
    }
    const before = await page.evaluate(`JSON.parse(localStorage.getItem('projects') || '[]').map((r) => r.id)`) as string[];
    await page.locator('.templates-clone-dialog button[type="submit"]').click();
    await page.waitForURL(/project\?id=/, { timeout: 60000 }).catch(() => undefined);
    await page.waitForLoadState('domcontentloaded');
    await wait(page, 3000);
    const info = await poll<any>(page, `(async () => { if (!location.hash.includes('project?id=')) return null; const i = await ${INFO}; return i && !${JSON.stringify(before)}.includes(i.id) && i.models.length > 0 && document.querySelector('.dock-tab') ? i : null; })()`, 120000);
    return info ? { prefilled, chosen, info } : null;
}

// ── The criteria of the template viewpoints (P-2026-10-18-2300), measured from the DOM ──────────────────────────

/** The viewpoints of each template, in order; the first is active on open, the model named here is drawn by the other. */
const VIEWPOINTS: Record<string, string[]> = {
    library: ['Library'], 'families-persons': ['Families', 'Persons'], 'state-machine': ['StateMachine'], graph: ['Graph'], shapes: ['Shapes'],
};
const PICK: Record<string, string> = { 'sample-Persons': 'Persons' };

/** The model's pane, fitted: every drawn vertex (object, class, text, form, header, border), every arc (its two
 *  objects, drawn or clear), the rows, the pane and the minimap boxes, the edge label texts. */
const MEASURE = (modelId: string) => String.raw`(() => {
  const pane = document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${modelId}"] .react-flow');
  if (!pane) return null;
  const lk = window.windoww.store.getState().idlookup;
  const cls = (o) => (lk[(lk[o] || {}).instanceof] || {}).name || '';
  const box = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; };
  const nodes = [...pane.querySelectorAll('.react-flow__node')].map((n) => {
    const obj = (lk[n.dataset.id] || {}).model || null;
    const c = n.querySelector('.ir-node-content');
    const header = n.querySelector('.ir-header-band');
    const b = n.getBoundingClientRect();
    // Visible: the element under each corner, inset 2 px, is this node (the panel, the minimap or another node is not).
    const corners = [[b.left + 2, b.top + 2], [b.right - 2, b.top + 2], [b.left + 2, b.bottom - 2], [b.right - 2, b.bottom - 2]]
      .map(([x, y]) => { const e = document.elementFromPoint(x, y); return !!e && n.contains(e); });
    const dot = n.querySelector('.node-problem-dot');
    const outside = n.querySelector('.ir-label--outside');
    return { vid: n.dataset.id, obj, cls: cls(obj), text: (n.textContent || '').trim(), form: c ? ([...c.classList].find((k) => k.startsWith('ir-shape--')) || '').slice(10) : '',
      header: header ? header.textContent.trim() : null, border: c ? getComputedStyle(c).borderTopStyle : '', box: box(n), content: c ? box(c) : box(n),
      corners, marker: !!(c && c.querySelector('.ir-marker-svg')), problem: dot ? dot.className.replace('node-problem-dot ', '') + ' | ' + dot.title : null,
      outsideLabel: outside ? box(outside) : null };
  });
  // The canvas the user sees ends where the properties panel begins: the first x, along the middle row, whose element
  // is not inside the pane (the pane itself runs on under the panel).
  const pb = pane.getBoundingClientRect();
  let right = pb.right;
  for (let x = pb.left + 10; x < pb.right; x += 4) { const e = document.elementFromPoint(x, pb.top + pb.height / 2); if (!e || !pane.contains(e)) { right = x; break; } }
  const canvas = { x: Math.round(pb.left), y: Math.round(pb.top), w: Math.round(right - pb.left), h: Math.round(pb.height) };
  const objOf = Object.fromEntries(nodes.map((n) => [n.vid, n.obj]));
  const edges = [...pane.querySelectorAll('.react-flow__edge')].map((g) => {
    const m = (g.getAttribute('aria-label') || '').match(/^Edge from (\S+) to (\S+)$/);
    // An edge draws transparent hit paths too: it is clear when none of its strokes shows.
    const inked = [...g.querySelectorAll('path, line, polyline')].filter((p) => { const cs = getComputedStyle(p); return !/^(none|transparent|rgba\(0, 0, 0, 0\))$/.test(cs.stroke) && parseFloat(cs.strokeWidth) > 0 && cs.opacity !== '0'; });
    // The longest inked path is the line; its ends and middle in screen px.
    const line = inked.filter((p) => p.getTotalLength).sort((a, b) => b.getTotalLength() - a.getTotalLength())[0];
    const at = (t) => { if (!line) return null; const L = line.getTotalLength(); const q = line.getPointAtLength(L * t); const k = line.getScreenCTM(); const r = new DOMPoint(q.x, q.y).matrixTransform(k); return [Math.round(r.x), Math.round(r.y)]; };
    return { id: g.dataset.id || '', src: m ? objOf[m[1]] || m[1] : '', tgt: m ? objOf[m[2]] || m[2] : '', clear: inked.length === 0,
      marker: inked.map((p) => p.getAttribute('marker-end') || '').filter(Boolean).join(' '), ends: [at(0), at(1)], mid: at(0.5) };
  });
  const isChild = (a, b) => { const f = (lk[b] || {}).father; return f === a || (lk[f] || {}).father === a; };
  const mini = pane.querySelector('.react-flow__minimap');
  return { nodes, edges, rows: pane.querySelectorAll('.ir-row').length, pane: box(pane), canvas, minimap: mini ? box(mini) : null,
    labels: [...pane.querySelectorAll('.edge-label__text')].map((e) => e.textContent.trim()).filter(Boolean),
    labelBoxes: [...pane.querySelectorAll('.edge-label__text')].filter((e) => e.textContent.trim() && e.getBoundingClientRect().width > 0).map((e) => ({ text: e.textContent.trim(), box: box(e) })),
    containmentArcs: edges.filter((e) => isChild(e.src, e.tgt) || isChild(e.tgt, e.src)).length,
    names: Object.fromEntries(nodes.map((n) => [n.obj, n.text])) };
})()`;

const inside = (b: any, f: any) => b.x >= f.x && b.y >= f.y && b.x + b.w <= f.x + f.w && b.y + b.h <= f.y + f.h;
const overlaps = (a: any, b: any) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const sorted = (a: string[]) => [...a].sort();
/** Distance from a point to the border of a box: 0 on it, positive off it on either side. */
const toBorder = ([x, y]: number[], b: any) => {
    const dx = Math.max(b.x - x, 0, x - (b.x + b.w)), dy = Math.max(b.y - y, 0, y - (b.y + b.h));
    if (dx > 0 || dy > 0) return Math.hypot(dx, dy);
    return Math.min(x - b.x, b.x + b.w - x, y - b.y, b.y + b.h - y);
};

/** The criteria of one model of a template; `d` is the MEASURE of its fitted pane. */
function criteria(id: string, model: string, d: any): void {
    const drawn = d.edges.filter((e: any) => !e.clear);
    const of = (c: string) => d.nodes.filter((n: any) => n.cls === c);
    const texts = (ns: any[]) => sorted(ns.map((n: any) => n.text));
    const tag = `${id} ${model}`;
    check(`${tag}: 0 rows, 0 containment arcs`, d.rows === 0 && d.containmentArcs === 0, { rows: d.rows, containmentArcs: d.containmentArcs });
    const hidden = d.nodes.filter((n: any) => !n.corners.every(Boolean) || !inside(n.box, d.canvas) || (d.minimap && overlaps(n.box, d.minimap)));
    check(`${tag}: every vertex visible after fit: four corners hit, inside the canvas left of the panel, clear of the minimap`, hidden.length === 0,
        { hidden: hidden.map((n: any) => `${n.text}:${n.corners.map((c: boolean) => c ? 1 : 0).join('')}:${JSON.stringify(n.box)}`), canvas: d.canvas });
    const lb = d.labelBoxes;
    const clash = [
        ...lb.flatMap((a: any, i: number) => lb.slice(i + 1).filter((b: any) => overlaps(a.box, b.box)).map((b: any) => `${a.text}~${b.text}`)),
        ...lb.flatMap((a: any) => d.nodes.filter((n: any) => !n.header && overlaps(a.box, n.content)).map((n: any) => `${a.text}~${n.text}`)),
    ];
    check(`${tag}: no arc label overlaps another label or a vertex`, clash.length === 0, clash);
    // The canvas ends every edge at the outer edge of its 8 px handle, centred on the border (.mm-anchor): ~5 px off the
    // ink on every arc of every syntax. Measured per arc; the check fails beyond that offset, i.e. on a wrong source.
    const gaps = drawn.map((e: any) => { const s = d.nodes.find((n: any) => n.obj === e.src); return s && e.ends[0] ? Math.round(Math.min(...e.ends.map((p: number[]) => toBorder(p, s.content)))) : -1; });
    if (gaps.length) meas(`${tag}: px between each arc and its source's border`, gaps);
    const detached = drawn.filter((e: any, i: number) => gaps[i] < 0 || gaps[i] > 6);
    check(`${tag}: every arc leaves from its source (within the canvas's 6 px handle offset)`, detached.length === 0,
        detached.map((e: any) => { const s = d.nodes.find((n: any) => n.obj === e.src); return `${d.names[e.src]}>${d.names[e.tgt]} ends ${JSON.stringify(e.ends)} source ${JSON.stringify(s?.content)} node ${JSON.stringify(s?.box)}`; }));
    const close = drawn.flatMap((a: any, i: number) => drawn.slice(i + 1).filter((b: any) => [a.src, a.tgt].sort().join() === [b.src, b.tgt].sort().join()
        && a.mid && b.mid && Math.hypot(a.mid[0] - b.mid[0], a.mid[1] - b.mid[1]) < 16).map((b: any) => `${d.names[a.src]}>${d.names[a.tgt]} ~ ${d.names[b.src]}>${d.names[b.tgt]}`));
    check(`${tag}: two arcs between the same vertices run at least 16 px apart`, close.length === 0, close);
    const problems = d.nodes.filter((n: any) => n.problem).map((n: any) => `${n.text}: ${n.problem}`);
    if (problems.length) meas(`${tag}: problem dots`, problems);
    const arcs = (ns: any) => sorted(drawn.map((e: any) => `${d.names[e.src] ?? e.src}>${d.names[e.tgt] ?? e.tgt}`));
    if (id === 'graph') {
        check(`${tag}: 4 Node vertices labelled by name, the Graph not drawn`, d.nodes.length === 4 && JSON.stringify(texts(of('Node'))) === '["A","B","C","D"]', texts(d.nodes));
        check(`${tag}: one open-arrow arc per (Edge, target), node to node`, JSON.stringify(arcs(d)) === JSON.stringify(sorted(['A>B', 'B>C', 'C>D', 'D>A', 'A>C', 'A>D'])) && drawn.every((e: any) => /url\(/.test(e.marker)), { arcs: arcs(d), markers: [...new Set(drawn.map((e: any) => e.marker))] });
    } else if (id === 'library') {
        check(`${tag}: Book, Magazine, Writer and Member vertices, the Library not drawn`, of('Book').length === 3 && of('Magazine').length === 1 && of('Writer').length === 2 && of('Member').length === 2 && d.nodes.length === 8, texts(d.nodes));
        const want = sorted(['Pride and Prejudice>Jane Austen', 'Emma>Jane Austen', 'The Hobbit>J. R. R. Tolkien', 'Pride and Prejudice>Anna', 'The Hobbit>Luca']);
        check(`${tag}: one arc per authors value and per borrowedBy value`, JSON.stringify(arcs(d).map((a: string) => a.replace(/author$|borrowed by$/, ''))) === JSON.stringify(want), arcs(d));
    } else if (id === 'state-machine') {
        const st = (name: string) => d.nodes.find((n: any) => n.cls === 'State' && n.text.startsWith(name));
        check(`${tag}: one vertex per State, the StateMachine not drawn`, of('State').length === 6 && d.nodes.length === 6, texts(d.nodes));
        check(`${tag}: initial states a filled dot, the final one a bullseye (circle with an inner dot, about 28 px)`, st('Idle')?.form === 'circle' && !st('Idle')?.marker && st('Warmup')?.form === 'circle'
            && st('Off')?.form === 'circle' && st('Off')?.marker && Math.abs(st('Off').content.w - 28) <= 2 && st('Broken')?.form === 'rounded',
            ['Idle', 'Warmup', 'Off', 'Broken', 'Steady'].map(n => `${n}:${st(n)?.form}:${st(n)?.marker ? 'marker' : ''}:${st(n)?.content.w}`));
        const warm = st('Warmup'), frameBox = st('Running')?.content;
        check(`${tag}: Warmup's label clears Running's bottom edge by at least 8 px`, !!warm?.outsideLabel && !!frameBox && frameBox.y + frameBox.h - (warm.outsideLabel.y + warm.outsideLabel.h) >= 8,
            { label: warm?.outsideLabel, frame: frameBox });
        const running = st('Running');
        check(`${tag}: Running a frame headed by its name, holding Warmup and Steady`, !!running && running.header === 'Running' && inside(st('Warmup').box, running.box) && inside(st('Steady').box, running.box), running && { header: running.header, box: running.box });
        check(`${tag}: one arc per Transition, labelled trigger [guard]`, drawn.length === 3 && JSON.stringify(sorted(d.labels)) === JSON.stringify(sorted(['power', 'power [temp > 60]'])), { arcs: arcs(d), labels: d.labels });
    } else if (id === 'families-persons' && model === 'sample-Families') {
        const fams = of('Family');
        check(`${tag}: each Family a frame headed by lastName`, JSON.stringify(sorted(fams.map((f: any) => f.header))) === '["March","Sailor"]', fams.map((f: any) => f.header));
        const members = of('Member');
        const holds = fams.every((f: any) => members.filter((m: any) => inside(m.box, f.box)).length === (f.header === 'March' ? 4 : 5));
        check(`${tag}: its Members inside it, labelled by firstName`, members.length === 9 && holds && texts(members).includes('Brandon'), texts(members));
        check(`${tag}: no arc drawn`, drawn.length === 0, arcs(d));
    } else if (id === 'families-persons') {
        const male = of('Male'), female = of('Female');
        check(`${tag}: Male and Female vertices by fullName`, male.length === 5 && female.length === 4 && texts(male).includes('Jim March') && texts(female).includes('Kelly Sailor'), texts(d.nodes));
        check(`${tag}: Male and Female told apart by shape`, new Set(male.map((n: any) => n.form)).size === 1 && new Set(female.map((n: any) => n.form)).size === 1 && male[0].form !== female[0].form, { male: male[0]?.form, female: female[0]?.form });
        check(`${tag}: no arc drawn`, drawn.length === 0, arcs(d));
    } else if (id === 'shapes') {
        const canvas = of('Canvas')[0];
        check(`${tag}: the Canvas a frame headed by its name, holding the shapes`, !!canvas && canvas.header === 'Sketch' && [...of('Circle'), ...of('Square')].every((n: any) => inside(n.box, canvas.box)), canvas && canvas.header);
        check(`${tag}: Circle a circle, Square a square, each labelled`, of('Circle').every((n: any) => n.form === 'circle') && of('Square').every((n: any) => n.form === 'rect' && Math.abs(n.box.w - n.box.h) <= 1)
            && JSON.stringify(texts([...of('Circle'), ...of('Square')])) === '["house","sun","wheel"]', d.nodes.map((n: any) => `${n.cls}:${n.form}:${n.text}:${n.box.w}x${n.box.h}`));
    }
}

/** The level button runs the fit (Toolbar.tsx: `handleResetZoom`, `fitView({padding, maxZoom: 1})`). */
async function fit(page: Page): Promise<void> {
    const button = page.locator('.toolbar-commands__level').filter({ visible: true });
    const before = await button.first().textContent().catch(() => null);
    if (await button.count()) { await button.first().click(); await wait(page, 1500); }
    meas('fit', { buttons: await button.count(), before, after: await button.first().textContent().catch(() => null) });
}

async function pickViewpoint(page: Page, name: string): Promise<void> {
    await page.locator('.toolbar-viewpoint-trigger:not([disabled]):visible').first().click();
    await wait(page, 400);
    await page.locator('.toolbar-viewpoint-menu__option', { hasText: name }).first().click();
    await wait(page, 4000);
}

let projectsShell: any = null;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
await seed(ctx, true);
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e: Error) => errors.push('pageerror: ' + e.message));
try {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await poll(page, `!!(window.windoww && window.windoww.store && window.LPointerTargetable)`, 120000);
    await wait(page, 2000);
    projectsShell = await poll<any>(page, SHELL, 30000);
    meas('Projects shell (reference)', projectsShell);
    await closeTip(page);
    await page.screenshot({ path: `${SHOTS}/projects-page.png` });

    for (const entry of GALLERY) {
        if (ONLY.length && !ONLY.includes(entry.id)) continue;
        const exp = await expected(entry);
        const shot = entry.id === 'library' ? 'templates' : undefined;
        const got = await cloneFromTemplates(page, entry, TYPED[entry.id], shot);
        check(`${entry.id}: «Clone & open» opens a new project`, !!got, '');
        if (!got) continue;
        const { info } = got;
        check(`${entry.id}: the modal is prefilled with the label`, got.prefilled === entry.label, got.prefilled);
        check(`${entry.id}: the new id differs from the file's`, info.id !== exp.id, `${info.id} vs ${exp.id}`);
        check(`${entry.id}: the name is the chosen one, in the store and the stored record`, info.name === got.chosen && info.recordName === got.chosen, { store: info.name, record: info.recordName, chosen: got.chosen });
        check(`${entry.id}: _clonedFrom is ${refOf(entry)}`, info.clonedFrom === refOf(entry), String(info.clonedFrom));
        check(`${entry.id}: the metamodels are the file's`, JSON.stringify(info.metamodels) === JSON.stringify(exp.metamodels), info.metamodels);
        const counts = Object.fromEntries(info.models.map((m: any) => [m.name, m.objects]));
        check(`${entry.id}: the models and their objects are the file's`, JSON.stringify(counts) === JSON.stringify(exp.models), { clone: counts, file: exp.models });
        if (entry.tier === 'template') {
            check(`${entry.id}: its viewpoints, the first active on open`, JSON.stringify(info.viewpoints) === JSON.stringify(VIEWPOINTS[entry.id])
                && info.active === VIEWPOINTS[entry.id][0] && info.root === VIEWPOINTS[entry.id][0], { viewpoints: info.viewpoints, active: info.active, root: info.root });
        } else meas(`${entry.id}: viewpoints`, { viewpoints: info.viewpoints, active: info.active, root: info.root });

        for (const m of info.models) {
            await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(m.id)})); })()`);
            const pane = `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m.id}"]'))`;
            const nodes = await poll<number>(page, `(() => { const p = ${pane}; const n = p ? p.querySelectorAll('.react-flow__node').length : 0; return n > 0 ? n : 0; })()`, 60000);
            check(`${entry.id}: the editor of ${m.name} shows its nodes`, (nodes ?? 0) > 0, `${nodes} nodes, ${m.objects} objects`);
            await wait(page, 1500);
            if (entry.tier === 'template' && PICK[m.name]) await pickViewpoint(page, PICK[m.name]);
            await closeTip(page);
            await fit(page);
            const d = await page.evaluate(MEASURE(m.id)) as any;
            meas(`${entry.id} ${m.name}`, d && { nodes: d.nodes.map((n: any) => `${n.cls}:${n.form}:${n.text}`), edges: d.edges.map((e: any) => `${d.names[e.src] ?? e.src}>${d.names[e.tgt] ?? e.tgt}${e.clear ? ' (clear)' : ''}`), labels: d.labels, rows: d.rows, containmentArcs: d.containmentArcs });
            if (entry.tier === 'template' && d) criteria(entry.id, m.name, d);
            // What a problem dot says: the registry's problems of that vertex (or its object), with their violations.
            for (const n of (d?.nodes ?? []).filter((x: any) => x.problem)) {
                meas(`${entry.id} ${m.name}: problems of ${n.text}`, await page.evaluate(String.raw`(async () => { const r = await import('/src/components/editor-v2/problems/registry.ts');
                  return [${JSON.stringify(n.vid)}, ${JSON.stringify(n.obj)}].flatMap((k) => r.getNodeProblemsSnapshot(k)).map((p) => ({ title: p.title, kind: p.kind, conformance: p.conformance })); })()`));
            }
            await page.screenshot({ path: `${SHOTS}/${entry.id}${info.models.length > 1 ? '-' + m.name : ''}.png` });
        }

        await page.evaluate(SAVE);
        await page.goto(`${URL}/?open=${encodeURIComponent(info.id)}#/project?id=${info.id}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        const reopened = await poll<any>(page, `(async () => { const i = await ${INFO}; return i && i.id === ${JSON.stringify(info.id)} && i.models.length > 0 && document.querySelector('.dock-tab') ? i : null; })()`, 120000);
        check(`${entry.id}: after save and reopen, name and _clonedFrom survive`,
            !!reopened && reopened.name === got.chosen && reopened.clonedFrom === refOf(entry), reopened ? { name: reopened.name, clonedFrom: reopened.clonedFrom } : null);
        if (reopened) {
            const again = Object.fromEntries(reopened.models.map((m: any) => [m.name, m.objects]));
            check(`${entry.id}: after reopen, the models and objects are the file's`, JSON.stringify(again) === JSON.stringify(exp.models), again);
        }
    }

    // The deep links: a version's clone dialog, prefilled; an unknown reference, one line and the page as usual.
    const graph = GALLERY.find(e => e.id === 'graph')!;
    await openTemplates(page, 'graph', '#/templates/graph@1');
    const deep = await poll<any>(page, `(() => { const i = document.querySelector('#templates-clone-name'); const h = document.querySelector('.templates-clone-dialog h2'); return i && h ? { value: i.value, title: h.textContent } : null; })()`, 15000);
    check('#/templates/graph@1: the clone dialog of graph@1 is open, prefilled with the label', !!deep && deep.value === graph.label && /graph@1/.test(deep.title), deep);
    await closeTip(page);
    await page.screenshot({ path: `${SHOTS}/templates-deeplink-graph-1.png` });
    await openTemplates(page, 'graph', '#/templates/nope@9');
    const nope = await page.evaluate(`({ notice: [...document.querySelectorAll('.templates-page__notice')].map((p) => p.textContent), dialog: !!document.querySelector('.templates-clone-dialog'), cards: document.querySelectorAll('.templates-card').length, firstSection: (document.querySelector('.templates-page__notice') || {}).nextElementSibling?.className })`) as any;
    check('#/templates/nope@9: one line «No gallery entry nope@9.» above the sections, no dialog, every card', JSON.stringify(nope.notice) === JSON.stringify(['No gallery entry nope@9.']) && !nope.dialog && nope.cards === GALLERY.length && nope.firstSection === 'templates-section', nope);
    await closeTip(page);
    await page.screenshot({ path: `${SHOTS}/templates-deeplink-nope-9.png` });

    // A second clone of the same entry, with the prefilled label: the (1) convention.
    const lib = GALLERY.find(e => e.id === 'library')!;
    if (!ONLY.length || ONLY.includes('library')) {
        const second = await cloneFromTemplates(page, lib);
        check('library again: the second clone is named «Library (1)»', !!second && second.info.name === 'Library (1)' && second.info.recordName === 'Library (1)', second ? second.info.name : null);
    }

    // The megamodel registration of the import (projects.ts, before duplicateProject): one user-defined edge.
    const mega = await page.evaluate(String.raw`(async () => {
      const api = await import('/src/api/persistance/projects.ts');
      const mp = await import('/src/model/megamodelPersistence.ts');
      const json = JSON.parse(await (await fetch('/library/gallery/families-persons/1.jjodel')).text());
      const [a, b] = json.metamodels;
      json.megamodel = { megamodelVersion: '1.0', edges: [{ id: 'probe-edge', source: { id: a, kind: 'metamodel' }, target: { id: b, kind: 'metamodel' }, type: 'transformsTo', origin: 'user-defined' }] };
      const id = await api.ProjectsApi.importFromText(JSON.stringify(json), 'Megamodel probe', Date.now(), { clonedFrom: 'families-persons@1' });
      const atNew = mp.getSerializedMegamodel(id);
      const atOld = mp.getSerializedMegamodel(json.id);
      return { newId: id, oldId: json.id, atNew: atNew ? atNew.edges.length : null, atOld: atOld ? atOld.edges.length : null };
    })()`) as any;
    meas('megamodel registration of an imported user-defined edge', mega);

    check('no page error', errors.length === 0, errors.slice(0, 3));
} finally {
    await ctx.close();
    await browser.close();
}
console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
