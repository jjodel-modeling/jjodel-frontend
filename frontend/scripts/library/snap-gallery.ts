/**
 * snap-gallery (P-2026-10-19-1617, lane L-C): the card preview of each gallery project of the Templates page,
 * frontend/public/library/gallery/<id>/<n>.preview.png, next to the package <n>.jjodel it shows (R-LIB-16).
 *
 * The preview is the real diagram, rendered by the app, not drawn by hand. For each catalog entry of kind
 * `galleryProject` (docs/library/catalog.json), at its current version `n`, in a fresh browser context:
 *   - the package <id>/<n>.jjodel is stored as the browser stores a saved project (the `STORE` of build-gallery.ts),
 *     so it opens with its own ids, and the project page is opened;
 *   - one diagram is opened with DockManager.open2: a template shows a metamodel (the one DIAGRAM names, else the
 *     first), an example its model in its notation (the one DIAGRAM names: the model with the scenario);
 *   - after the settle (the 3 s re-layout watcher of a fresh graph), a metamodel gets a capture-only stylesheet
 *     (`page.addStyleTag`, VARIANT_D) over the metamodel editor's class names: the handoff's variant D, white nodes
 *     with a slate-300 hairline and an 8px radius, names in 600, slate-500 edges. No source file changes;
 *   - CanvasExportService.renderTarget fits the React Flow viewport to the diagram (no background, no dot grid, no
 *     minimap) and html-to-image writes a PNG at pixelRatio 2 with a transparent background: the card paints the dot
 *     grid itself. A template is cropped instead (CROP, P-2026-10-19-1651): the whole metamodel at 300×136 lands at
 *     16-23 % and no name reads, so the frame shows the root class and its neighbours at 45 % or more.
 * The package is never touched: the preview of a published version sits beside it and does not change its bytes.
 *
 * A written preview is not overwritten: when <id>/<n>.preview.png exists the run refuses it (a FAIL line, exit 1)
 * unless SNAP_REWRITE names it. Each preview also reports the scale at which it fits the card's 300×136 box.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/library/snap-gallery.ts \
 *         --port 3096 --id P-2026-10-19-1617
 * Env:  SNAP_ID       one catalog id (default: every galleryProject)
 *       SNAP_DIR      the gallery folder, packages in and previews out (default frontend/public/library/gallery)
 *       SNAP_REWRITE  the existing previews the run may overwrite, `<id>@<n>` comma separated
 *       PROBE_URL     the dev server (set by lane-run probe; default http://localhost:3096/)
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3096/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const DIR = process.env.SNAP_DIR || new globalThis.URL('../../public/library/gallery', import.meta.url).pathname;

interface Entry { id: string; kind: string; label: string; tier?: string; version?: number }
const catalog = JSON.parse(readFileSync(new globalThis.URL('../../../docs/library/catalog.json', import.meta.url), 'utf8')) as { entries: Entry[] };
const GALLERY = catalog.entries.filter(e => e.kind === 'galleryProject');

/** The diagram a preview shows, by name: a metamodel for a template, a model for an example (required there). */
const DIAGRAM: Record<string, string> = {
    'families-persons': 'Families',
    turnstile: 'demoESM',
    'petri-producer-consumer': 'producerConsumer',
};

/** The card's preview box (handoff §3: 136 px high, about 2.2:1). */
const BOX = { width: 300, height: 136 };
const PIXEL_RATIO = 2;

/** Variant D over the metamodel editor (EditorV2.scss `.mm-node`, `.mm-class`, `.mm-enum`, the edge tokens
 *  `--edge-color` and `--edge-marker-stroke` of `.reference-edge`, `.inheritance-edge`, `.reference-marker`): capture
 *  only. A rename of those classes or tokens makes it inert, not wrong: the plain editor is captured. */
const VARIANT_D = `
.react-flow .mm-node:not(.viewpoint-wrapper) {
  background: #ffffff !important; border: 1px solid #cbd5e1 !important; border-radius: 8px !important;
  box-shadow: none !important; outline: none !important; overflow: hidden;
}
.react-flow .mm-class.abstract:not(.viewpoint-wrapper) { border-style: dashed !important; }
.react-flow .mm-node .mm-node__header {
  background: #ffffff !important; color: #0f172a !important; border-bottom: 1px solid #cbd5e1 !important;
}
.react-flow .mm-enum .mm-node__header { background: #faeeda !important; color: #854f0b !important; }
.react-flow .mm-node .mm-node__name { font-weight: 600 !important; }
.react-flow { --edge-color: #64748b; --edge-marker-stroke: #64748b; }
.react-flow .reference-edge, .react-flow .inheritance-edge { stroke-width: 1.2 !important; }
`;

const IDS = process.env.SNAP_ID ? [process.env.SNAP_ID] : GALLERY.map(e => e.id);
const REWRITE = new Set((process.env.SNAP_REWRITE || '').split(',').filter(Boolean));

let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

async function poll<T>(page: Page, expr: string, ms: number): Promise<T | null> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        const v = await page.evaluate(expr).catch(() => null) as T | null;
        if (v) return v;
        await wait(page, 250);
    }
    return null;
}

/** The package and the preview of the entry's current version; null, after a FAIL, when the preview exists and
 *  SNAP_REWRITE does not name it, or when there is no package to show. */
function paths(entry: Entry): { pkg: string; out: string } | null {
    const ref = `${entry.id}@${entry.version}`;
    if (!entry.version) { check(`${entry.id}: has a current version`, false, ''); return null; }
    const pkg = `${DIR}/${entry.id}/${entry.version}.jjodel`;
    const out = `${DIR}/${entry.id}/${entry.version}.preview.png`;
    if (!existsSync(pkg)) { check(`${ref}: has its package`, false, pkg); return null; }
    if (existsSync(out) && !REWRITE.has(ref)) { check(`${ref}: the preview is not rewritten (SNAP_REWRITE=${ref} to overwrite)`, false, out); return null; }
    return { pkg, out };
}

// ── Page side (plain strings: no transform) ─────────────────────────────────────────────────────

/** The open project's metamodels and models. */
const INFO = String.raw`(async () => {
  try {
    const j = await import('/src/joiner/index.ts');
    const p = j.L.fromPointer(j.DUser.current).project;
    if (!p) return null;
    return { id: p.id, name: p.name,
      metamodels: (p.metamodels || []).map((m) => ({ id: m.id, name: m.name })),
      models: (p.models || []).filter((m) => !m.isMetamodel).map((m) => ({ id: m.id, name: m.name })) };
  } catch (e) { return null; }
})()`;

/** The package stored as a saved project (build-gallery.ts `STORE`), so it opens with its own ids. */
const STORE = (text: string) => String.raw`(() => {
  const json = JSON.parse(${JSON.stringify(text)});
  const a = JSON.parse(localStorage.getItem('projects') || '[]').filter((p) => p.id !== json.id);
  a.push(json);
  localStorage.setItem('projects', JSON.stringify(a));
  return json.id;
})()`;

const PANE = (id: string) => `document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${id}"]')`;

/** The crop of a template preview (P-2026-10-19-1651): a frame with the card's aspect, shown at the card's 300×136 at
 *  a scale of at least MIN_SCALE and at most 1, around the root class (the class that owns the most containment
 *  references; tie: the first class) and its direct neighbours (the types of its references, the classes whose
 *  references target it, its superclasses and subclasses). Every node name lies wholly inside or wholly outside the
 *  frame; among the frames that keep the root whole, the one with the most whole neighbours, then the most whole nodes,
 *  then the nearest to the centre of root and neighbours. Coordinates at zoom 1, in the `.react-flow__viewport`. */
const MIN_SCALE = 0.45;
const CROP = (id: string, mmId: string) => String.raw`(async () => {
  const pane = ${PANE(id)};
  const vp = pane && pane.querySelector('.react-flow__viewport');
  if (!vp) return { error: 'no viewport' };
  const mm = window.LPointerTargetable.fromPointer(${JSON.stringify(mmId)});
  let classes = [];
  try { classes = Array.from(mm.classes || []); } catch (e) {}
  if (!classes.length) try { classes = (mm.packages || []).flatMap((p) => Array.from(p.classes || [])); } catch (e) {}
  if (!classes.length) return { error: 'no classes' };
  const refs = (c) => { try { return Array.from(c.references || []); } catch (e) { return []; } };
  const owned = (c) => refs(c).filter((r) => r.containment).length;
  let root = classes[0];
  for (const c of classes) if (owned(c) > owned(root)) root = c;
  const near = new Set();
  for (const r of refs(root)) { try { r.type && near.add(r.type.name); } catch (e) {} }
  for (const c of classes) for (const r of refs(c)) { try { if (r.type && r.type.id === root.id) near.add(c.name); } catch (e) {} }
  try { for (const s of root.extends || []) near.add(s.name); } catch (e) {}
  try { for (const s of root.extendedBy || []) near.add(s.name); } catch (e) {}
  near.delete(root.name);

  const screen = vp.getBoundingClientRect();
  const zoom = screen.width / vp.offsetWidth;
  const box = (r) => ({ x: (r.left - screen.left) / zoom, y: (r.top - screen.top) / zoom, w: r.width / zoom, h: r.height / zoom });
  const nodes = Array.from(vp.querySelectorAll('.react-flow__node')).map((el) => {
    const n = el.querySelector('.mm-node__name');
    const name = n ? (n.value || n.textContent || '').trim() : '';
    return { name, box: box(el.getBoundingClientRect()), label: n ? box(n.getBoundingClientRect()) : null };
  }).filter((n) => n.box.w > 0 && n.box.h > 0);
  const r0 = nodes.find((n) => n.name === root.name);
  if (!r0) return { error: 'root ' + root.name + ' has no node' };
  const group = [r0, ...nodes.filter((n) => near.has(n.name))];
  const M = 16;
  const gx = Math.min(...group.map((n) => n.box.x)) - M, gy = Math.min(...group.map((n) => n.box.y)) - M;
  const gw = Math.max(...group.map((n) => n.box.x + n.box.w)) + M - gx, gh = Math.max(...group.map((n) => n.box.y + n.box.h)) + M - gy;
  const W = ${BOX.width}, H = ${BOX.height};
  const k = Math.max(${MIN_SCALE}, Math.min(1, W / gw, H / gh));
  const cw = W / k, ch = H / k;
  const cx0 = gx + gw / 2, cy0 = gy + gh / 2;
  const inside = (b, x, y) => b.x >= x && b.y >= y && b.x + b.w <= x + cw && b.y + b.h <= y + ch;
  const outside = (b, x, y) => b.x + b.w <= x || b.y + b.h <= y || b.x >= x + cw || b.y >= y + ch;
  let best = null;
  const lo = (a, b) => Math.min(a, b), hi = (a, b) => Math.max(a, b);
  const xs = [lo(r0.box.x + r0.box.w - cw, r0.box.x), hi(r0.box.x + r0.box.w - cw, r0.box.x)];
  const ys = [lo(r0.box.y + r0.box.h - ch, r0.box.y), hi(r0.box.y + r0.box.h - ch, r0.box.y)];
  for (let x = xs[0] - M; x <= xs[1] + M; x += 4) for (let y = ys[0] - M; y <= ys[1] + M; y += 4) {
    if (!inside(r0.box, x, y)) continue;
    if (nodes.some((n) => n.label && !inside(n.label, x, y) && !outside(n.label, x, y))) continue;
    const whole = nodes.filter((n) => inside(n.box, x, y));
    const score = whole.filter((n) => near.has(n.name)).length * 1e6 + whole.length * 1e3 - Math.hypot(x + cw / 2 - cx0, y + ch / 2 - cy0);
    if (!best || score > best.score) best = { x, y, score, whole: whole.map((n) => n.name) };
  }
  if (!best) return { error: 'no frame keeps every name whole', root: root.name };
  const font = parseFloat(getComputedStyle(pane.querySelector('.mm-node__name')).fontSize);
  return { root: root.name, owned: owned(root), near: [...near], x: Math.round(best.x), y: Math.round(best.y),
    width: Math.round(cw), height: Math.round(ch), scale: k, whole: best.whole, font, namePx: Math.round(font * k * 10) / 10 };
})()`;

interface Crop { x: number; y: number; width: number; height: number }

/** The diagram of one editor pane as a PNG data URL, with its size at zoom 1 and what the PNG holds: its pixel size
 *  and the alpha of its four corners (0 when the background is transparent). With a crop, the frame of the crop at
 *  zoom 1 instead of the whole diagram. */
const SNAP = (id: string, crop?: Crop) => String.raw`(async () => {
  const pane = ${PANE(id)};
  if (!pane) return { error: 'no pane' };
  const S = (await import('/src/services/CanvasExportService.ts')).CanvasExportService;
  const t0 = performance.now();
  const t = S.renderTarget(pane, { type: 'png', pixelRatio: ${PIXEL_RATIO}, quality: 1 });
  const crop = ${JSON.stringify(crop ?? null)};
  if (crop) t.options = { ...t.options, width: crop.width, height: crop.height,
    style: { width: crop.width + 'px', height: crop.height + 'px', transform: 'translate(' + (-crop.x) + 'px, ' + (-crop.y) + 'px) scale(1)' } };
  let url;
  try { url = await S.generateDataUrl(t.node, t.options); } finally { t.restore(); }
  const ms = Math.round(performance.now() - t0);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const a = (x, y) => g.getImageData(x, y, 1, 1).data[3];
  const corners = [a(0, 0), a(c.width - 1, 0), a(0, c.height - 1), a(c.width - 1, c.height - 1)];
  return { ms, url, width: t.options.width, height: t.options.height, png: [img.naturalWidth, img.naturalHeight], corners,
    nodes: pane.querySelectorAll('.react-flow__node').length, edges: pane.querySelectorAll('.react-flow__edge').length };
})()`;

async function snap(browser: Browser, entry: Entry): Promise<void> {
    const t0 = Date.now();
    const ref = `${entry.id}@${entry.version}`;
    const where = paths(entry);
    if (!where) return;
    const example = entry.tier === 'example';
    if (example && !DIAGRAM[entry.id]) { check(`${ref}: an example names its model in DIAGRAM`, false, ''); return; }
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    await seed(ctx, true);
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e: Error) => errors.push('pageerror: ' + e.message));
    try {
        await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        await poll(page, `!!(window.windoww && window.windoww.store && window.LPointerTargetable)`, 120000);
        const json = JSON.parse(readFileSync(where.pkg, 'utf8'));
        const pid = await page.evaluate(STORE(JSON.stringify(json))) as string | null;
        check(`${ref}: the package is stored with its own id`, pid === json.id, String(pid));
        if (!pid) return;
        await page.goto(`${URL}/?open=${encodeURIComponent(pid)}#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        const info = await poll<any>(page, `(async () => { const i = await ${INFO}; return i && i.id === ${JSON.stringify(pid)} ? i : null; })()`, 120000);
        check(`${ref}: the project page is open`, !!info, '');
        if (!info) return;
        await wait(page, 2000);

        const pool = example ? info.models : info.metamodels;
        const want = DIAGRAM[entry.id];
        const diagram = want ? pool.find((m: any) => m.name === want) : pool[0];
        check(`${ref}: the ${example ? 'model' : 'metamodel'} ${want ?? '(first)'} is in the project`, !!diagram,
            pool.map((m: any) => m.name));
        if (!diagram) return;

        await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(diagram.id)})); })()`);
        const nodes = await poll<number>(page, `(() => { const p = ${PANE(diagram.id)}; return p ? p.querySelectorAll('.react-flow__node').length : 0; })()`, 60000);
        check(`${ref}: the editor of ${diagram.name} shows its nodes`, (nodes ?? 0) > 0, String(nodes));
        if (!nodes) return;
        // The first layout of a fresh graph arms a 3 s re-layout (reLayoutWatcher.ts): captured after it.
        await wait(page, 4500);
        if (!example) {
            await page.addStyleTag({ content: VARIANT_D });
            await wait(page, 300);
            const applied = await page.evaluate(String.raw`(() => {
              const p = ${PANE(diagram.id)};
              const h = p.querySelector('.mm-class .mm-node__header');
              const e = p.querySelector('.reference-edge, .inheritance-edge');
              return { header: h && getComputedStyle(h).backgroundColor, edge: e && getComputedStyle(e).stroke };
            })()`) as { header: string | null; edge: string | null };
            check(`${ref}: variant D holds on the metamodel editor (white header, slate-500 edge)`,
                applied.header === 'rgb(255, 255, 255)' && (applied.edge === null || applied.edge === 'rgb(100, 116, 139)'), applied);
        }

        let crop: any = null;
        if (!example) {
            crop = await page.evaluate(CROP(diagram.id, diagram.id)).catch((e: unknown) => ({ error: String(e).slice(0, 300) }));
            check(`${ref}: the crop frames the root class at ${MIN_SCALE * 100} % or more, no name cut`, !!crop && !crop.error && crop.scale >= MIN_SCALE, crop);
            if (!crop || crop.error) return;
        }
        const got = await page.evaluate(SNAP(diagram.id, crop ?? undefined)).catch((e: unknown) => ({ error: String(e).slice(0, 300) })) as any;
        if (!got || got.error || !got.url) { check(`${ref}: the diagram is rendered`, false, got?.error ?? 'no data'); return; }
        const bytes = Buffer.from(got.url.slice(got.url.indexOf(',') + 1), 'base64');
        writeFileSync(where.out, bytes);
        const transparent = got.corners.every((a: number) => a === 0);
        check(`${ref}: the preview is a PNG at pixelRatio ${PIXEL_RATIO}`,
            bytes.subarray(1, 4).toString() === 'PNG' && got.png[0] === Math.round(got.width * PIXEL_RATIO) && got.png[1] === Math.round(got.height * PIXEL_RATIO),
            `${where.out} ${statSync(where.out).size} bytes ${got.png[0]}×${got.png[1]}`);
        check(`${ref}: the background is transparent (corner alpha)`, transparent, got.corners);
        const scale = Math.min(BOX.width / got.width, BOX.height / got.height);
        console.log(`MEAS  ${ref}  ${JSON.stringify({
            diagram: `${example ? 'M1' : 'M2'} ${diagram.name}`, size: `${got.width}×${got.height}`, nodes: got.nodes, edges: got.edges,
            bytes: bytes.length, exportMs: got.ms, scale: Math.round(scale * 1000) / 10, fitted: `${Math.round(got.width * scale)}×${Math.round(got.height * scale)}`,
            totalMs: Date.now() - t0 })}`);
        check(`${ref}: no page error`, errors.length === 0, errors.slice(0, 3));
    } finally {
        await ctx.close();
    }
}

const browser = await chromium.launch();
for (const id of IDS) {
    const entry = GALLERY.find(e => e.id === id);
    if (!entry) { check(`${id}: is a galleryProject of the catalog`, false, ''); continue; }
    await snap(browser, entry);
}
await browser.close();
console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  (${DIR})`);
process.exit(failures === 0 ? 0 : 1);
