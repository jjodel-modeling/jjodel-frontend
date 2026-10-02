/**
 * «Color by metaclass» (P-2026-09-30-1815, R-VP-27..31; reworked by P-2026-09-30-2022,
 * R-VP-37..39): the pure half of the viewpoint option.
 *
 * With the option on, every M1 object node shown under the viewpoint is filled with the colour
 * of its metaclass: one of twelve pastel swatches, chosen so that two metaclasses connected by
 * a reference or a generalization get swatches far apart in hue, unless the user picked one
 * for that metaclass. Its text turns black or white, whichever contrasts more with the fill;
 * its border is the fill's hue at 55 % lightness, or transparent. The two render points
 * (`ObjectNode.tsx` for the native branch, `IRNodeContent.tsx` for the IR one) ask
 * `resolveMetaclassColoring` and paint what it answers; the panel (`ViewpointProperties.tsx`)
 * lists the same colours through `metaclassColorTable`. A node a derived notation draws as a
 * glyph (`isNotationGlyph`, R-VP-50) is not painted; its class keeps its colour in the palette.
 *
 * NO IMPORTS, on purpose: this module is what the test bench executes (CLAUDE.md §5, the
 * `nameLookup.ts` pattern). It reads the store's plain shape (`viewpoint`, `idlookup`), never an
 * L proxy, and the colour math is written by hand (no dependency).
 */

/** The setting as persisted on the viewpoint's D object (`DViewElement.metaclassColoring`). */
export interface MetaclassColoring {
    enabled: boolean;
    baseColor: string;
    border: boolean;
    /**
     * The colour the user picked for a metaclass, keyed by the metaclass ID (not its name, so a
     * rename keeps it). Absent when there is none. An entry whose class is gone is ignored.
     */
    overrides?: Record<string, string>;
}

/** What a node paints when the option is on. `stroke` is the border shade, drawn only with `border`. */
export interface MetaclassColorOverride {
    fill: string;
    text: '#000000' | '#ffffff';
    stroke: string;
    border: boolean;
}

/** The classes of one metamodel in metamodel order, and who is connected to whom (both ways). */
export interface MetaclassGraph {
    ids: string[];
    adjacency: Record<string, string[]>;
}

/** One metamodel as the panel lists it. */
export interface MetaclassColorRow {
    modelId: string;
    modelName: string;
    classes: { id: string; name: string; color: string; overridden: boolean }[];
}

export const DEFAULT_METACLASS_BASE_COLOR = '#0ea5e9';

/**
 * The twelve pastel swatches (R-VP-37): swatch k has hue 30·k (within 1°), saturation 55..70 %
 * and lightness 82..88 %, read back from the hex. Tuned by a search over S and L so that any two
 * are at least 12.5 ΔE76 apart (the rule asks 10; S 60 / L 85 for all gave 8.0, on 240/270).
 * Black text wins on every one.
 */
export const PASTEL_SWATCHES: readonly string[] = [
    '#f3cbcb', '#f3dfcb', '#ededc0', '#d5f2b8', '#b2f1b2', '#baebd2',
    '#cbf3f3', '#cbdef0', '#b2b2f1', '#d6c0ed', '#eeb5ee', '#ebbad2',
];
const SWATCH_STEP = 30;
/** The border of a coloured node: the fill's hue and saturation at this lightness. */
const BORDER_L = 55;

/** `#rgb` or `#rrggbb`, any case, to lowercase `#rrggbb`; anything else is null. */
function normalizeHex(hex: unknown): string | null {
    if (typeof hex !== 'string') return null;
    const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim());
    if (!m) return null;
    const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
    return '#' + h.toLowerCase();
}

function rgbOf(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** HSL of a normalized hex: h 0..360, s and l 0..100, unrounded. */
function hslOf(hex: string): [number, number, number] {
    const [r, g, b] = rgbOf(hex).map((c) => c / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    const l = (max + min) / 2;
    if (d === 0) return [0, 0, l * 100];
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
    return [h, s * 100, l * 100];
}

function hexOfHsl(h: number, s: number, l: number): string {
    const hh = ((h % 360) + 360) % 360;
    const ss = s / 100, ll = l / 100;
    const c = (1 - Math.abs(2 * ll - 1)) * ss;
    const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
    const m = ll - c / 2;
    const [r, g, b] = hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x]
        : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
    return '#' + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}

/** Distance between two hues round the wheel, 0..180. */
function hueDistance(a: number, b: number): number {
    const d = Math.abs(a - b) % 360;
    return Math.min(d, 360 - d);
}

/** The hue a colour counts with: a swatch's nominal 30·k, any other hex its own. */
function hueOfColor(hex: string): number {
    const k = PASTEL_SWATCHES.indexOf(hex);
    return k >= 0 ? k * SWATCH_STEP : hslOf(hex)[0];
}

/**
 * The swatch the scheme starts from: the one nearest in hue to the base colour (R-VP-37). A
 * tie goes to the lower index; an achromatic base reads as hue 0; an invalid one as the default.
 */
export function seedSwatchIndex(baseColor: string): number {
    const [h] = hslOf(normalizeHex(baseColor) ?? DEFAULT_METACLASS_BASE_COLOR);
    let best = 0;
    for (let k = 1; k < PASTEL_SWATCHES.length; k++) {
        if (hueDistance(k * SWATCH_STEP, h) < hueDistance(best * SWATCH_STEP, h)) best = k;
    }
    return best;
}

/**
 * The position of swatch k in the analogous order round the seed: the seed 0, then +30° 1,
 * −30° 2, +60° 3, −60° 4, …, +180° 11. The last tie-break of the assignment.
 */
function seedRank(k: number, seed: number): number {
    const n = PASTEL_SWATCHES.length;
    const delta = ((k - seed) % n + n) % n;
    if (delta === 0) return 0;
    const d = Math.min(delta, n - delta);
    return 2 * d - (delta <= n / 2 ? 1 : 0);
}

/**
 * `count` colours in the ANALOGOUS ORDER round the seed (R-VP-29 as amended by R-VP-37): the
 * swatch nearest the base, then one step up, one down, two up, two down, …, the opposite one
 * last; past twelve the order starts again. What classes with no connection get, in metamodel
 * order. Deterministic; an invalid base falls back to the default.
 */
export function metaclassPalette(baseColor: string, count: number): string[] {
    if (count <= 0) return [];
    const seed = seedSwatchIndex(baseColor);
    const order = PASTEL_SWATCHES.map((_, k) => k).sort((a, b) => seedRank(a, seed) - seedRank(b, seed));
    return Array.from({ length: count }, (_, i) => PASTEL_SWATCHES[order[i % order.length]]);
}

/**
 * One colour per class, REFERENCE-AWARE (R-VP-38). `adjacency` lists who is connected to
 * whom; it is read both ways, so a directed list does. Greedy, in the order of `ids`:
 *  1. an override (a valid hex; one on a class not in `ids` is ignored) is taken as is, first,
 *     and uses its swatch up;
 *  2. every other class takes, among the FREE swatches (all of them once none is free), the
 *     one whose smallest hue distance to its already coloured neighbours is the largest;
 *  3. ties go to the least used swatch (only past twelve), then to the analogous order round
 *     the seed, so a class with no coloured neighbour takes the next swatch of that order.
 * Deterministic: the result depends on the order of `ids`, not on the order of the lists.
 */
export function assignMetaclassColors(
    ids: readonly string[],
    adjacency: Readonly<Record<string, readonly string[]>>,
    baseColor: string,
    overrides?: Readonly<Record<string, string>>,
): Record<string, string> {
    const seed = seedSwatchIndex(baseColor);
    const known = new Set(ids);
    const near = new Map<string, Set<string>>();
    for (const id of ids) near.set(id, new Set());
    for (const [a, list] of Object.entries(adjacency ?? {})) {
        if (!known.has(a)) continue;
        for (const b of list ?? []) {
            if (b === a || !known.has(b)) continue;
            near.get(a)!.add(b);
            near.get(b)!.add(a);
        }
    }
    const out = new Map<string, string>();
    const uses = PASTEL_SWATCHES.map(() => 0);
    for (const id of ids) {
        const hex = normalizeHex(overrides?.[id]);
        if (!hex || out.has(id)) continue;
        out.set(id, hex);
        const k = PASTEL_SWATCHES.indexOf(hex);
        if (k >= 0) uses[k]++;
    }
    for (const id of ids) {
        if (out.has(id)) continue;
        const hues = [...near.get(id)!].filter((n) => out.has(n)).map((n) => hueOfColor(out.get(n)!));
        const anyFree = uses.some((u) => u === 0);
        let best = -1, bestDist = -1;
        for (let k = 0; k < PASTEL_SWATCHES.length; k++) {
            if (anyFree && uses[k] > 0) continue;
            const dist = hues.length ? Math.min(...hues.map((h) => hueDistance(k * SWATCH_STEP, h))) : Infinity;
            const better = best < 0 || dist > bestDist
                || (dist === bestDist && (uses[k] < uses[best]
                    || (uses[k] === uses[best] && seedRank(k, seed) < seedRank(best, seed))));
            if (better) { best = k; bestDist = dist; }
        }
        out.set(id, PASTEL_SWATCHES[best]);
        uses[best]++;
    }
    return Object.fromEntries(ids.filter((id) => out.has(id)).map((id) => [id, out.get(id)!]));
}

/** WCAG 2.x relative luminance of a normalized hex. */
function luminance(hex: string): number {
    const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const [r, g, b] = rgbOf(hex);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Black or white, whichever has the higher WCAG 2.x contrast ratio against the fill; a tie
 * goes to black. An invalid fill reads as the default base.
 */
export function contrastText(fill: string): '#000000' | '#ffffff' {
    const L = luminance(normalizeHex(fill) ?? DEFAULT_METACLASS_BASE_COLOR);
    const onBlack = (L + 0.05) / 0.05;
    const onWhite = 1.05 / (L + 0.05);
    return onBlack >= onWhite ? '#000000' : '#ffffff';
}

/** The border of a coloured node (R-VP-37): same hue and saturation, lightness 55 %. */
export function borderShade(fill: string): string {
    const [h, s] = hslOf(normalizeHex(fill) ?? DEFAULT_METACLASS_BASE_COLOR);
    return hexOfHsl(h, s, BORDER_L);
}

/** The valid entries of a stored overrides map, lowercased; null when none is. */
function readOverrides(raw: unknown): Record<string, string> | null {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const out: Record<string, string> = {};
    for (const [id, color] of Object.entries(raw as Record<string, unknown>)) {
        const hex = normalizeHex(color);
        if (hex) out[id] = hex;
    }
    return Object.keys(out).length ? out : null;
}

/**
 * The setting of a viewpoint D object as the panel shows it. ABSENT IS A VALUE: a viewpoint
 * that never used the option reads as off, with the default base and the border on, and old
 * projects need no migration. Only an invalid base is repaired; invalid overrides are dropped,
 * and `overrides` is there only when one is valid.
 */
export function readMetaclassColoring(vp: { readonly [key: string]: any } | null | undefined): MetaclassColoring {
    const raw: Partial<MetaclassColoring> | undefined = vp?.metaclassColoring;
    const overrides = readOverrides(raw?.overrides);
    return {
        enabled: raw?.enabled === true,
        baseColor: normalizeHex(raw?.baseColor) ?? DEFAULT_METACLASS_BASE_COLOR,
        border: raw?.border !== false,
        ...(overrides ? { overrides } : {}),
    };
}

/**
 * The setting with the override of one metaclass set to `color`, or removed when `color` is
 * null or not a valid hex (the panel's «Reset»). The last removal drops the key. Never mutates.
 */
export function withMetaclassOverride(setting: MetaclassColoring, classId: string, color: string | null): MetaclassColoring {
    const { overrides, ...rest } = setting;
    const next: Record<string, string> = { ...(overrides ?? {}) };
    const hex = normalizeHex(color);
    if (hex) next[classId] = hex;
    else delete next[classId];
    return Object.keys(next).length ? { ...rest, overrides: next } : rest;
}

/** The setting with no override at all (the panel's «Reset all»). Never mutates. */
export function clearMetaclassOverrides(setting: MetaclassColoring): MetaclassColoring {
    const { overrides, ...rest } = setting;
    return rest;
}

/** The id of the model a class belongs to, climbing `father` (cycle-safe); null outside one. */
export function modelOfClass(idlookup: Record<string, any>, classId: string): string | null {
    const cls = idlookup?.[classId];
    if (!cls) return null;
    const climbed = new Set<string>();
    for (let p = cls.father; typeof p === 'string' && !climbed.has(p); p = idlookup[p]?.father) {
        climbed.add(p);
        const d = idlookup[p];
        if (!d) break;
        if (d.className === 'DModel') return p;
    }
    return null;
}

/**
 * The classes of a model in the metamodel's own order: `DModel.packages` in order, and in each
 * package its `classes`, then its `subpackages`, depth first. It survives reloads and renames
 * (the arrays persist in order); every class is listed, abstract ones included.
 */
function classesOfModel(idlookup: Record<string, any>, modelId: string): string[] {
    const model = idlookup?.[modelId];
    const order: string[] = [];
    if (!model) return order;
    const seen = new Set<string>();
    const walk = (pkgId: string) => {
        const pkg = idlookup[pkgId];
        if (!pkg || seen.has(pkgId)) return;
        seen.add(pkgId);
        for (const c of pkg.classes ?? []) order.push(c);
        for (const sp of pkg.subpackages ?? []) walk(sp);
    };
    for (const pkgId of model.packages ?? []) walk(pkgId);
    return order;
}

/**
 * The position of a class among the classes of its metamodel, and how many there are (the
 * order of `classesOfModel`). Null when the class or its model is not in the lookup.
 * TODO: cleanup — no longer read by the resolver since R-VP-38 (the reference-aware
 * assignment replaced the index); kept, and tested, per the no-removal rule.
 */
export function metaclassOrder(idlookup: Record<string, any>, classId: string): { index: number; count: number } | null {
    const modelId = modelOfClass(idlookup, classId);
    if (!modelId) return null;
    const order = classesOfModel(idlookup, modelId);
    const index = order.indexOf(classId);
    return index < 0 ? null : { index, count: order.length };
}

/**
 * The classes of a model and their connections (R-VP-38): two classes are adjacent when a
 * DECLARED reference of one (containment included) is typed by the other, or one extends the
 * other, in either direction. Forward links only (`references` → `type`, `extends`); a
 * self-reference, a reference missing from the lookup and a class of another model make no
 * edge. Every neighbour is listed once.
 */
export function metaclassGraph(idlookup: Record<string, any>, modelId: string): MetaclassGraph {
    const ids = classesOfModel(idlookup, modelId);
    const known = new Set(ids);
    const adjacency: Record<string, string[]> = {};
    for (const id of ids) adjacency[id] = [];
    const link = (a: string, b: unknown) => {
        if (typeof b !== 'string' || b === a || !known.has(b)) return;
        if (!adjacency[a].includes(b)) adjacency[a].push(b);
        if (!adjacency[b].includes(a)) adjacency[b].push(a);
    };
    for (const id of ids) {
        const cls = idlookup[id];
        for (const ref of cls?.references ?? []) link(id, idlookup[ref]?.type);
        for (const sup of cls?.extends ?? []) link(id, sup);
    }
    return { ids, adjacency };
}

/** The colour of every class of a model under a setting. */
function modelColors(idlookup: Record<string, any>, modelId: string, setting: MetaclassColoring): { graph: MetaclassGraph; colors: Record<string, string> } {
    const graph = metaclassGraph(idlookup, modelId);
    return { graph, colors: assignMetaclassColors(graph.ids, graph.adjacency, setting.baseColor, setting.overrides) };
}

/**
 * What an M1 object node of class `classId` paints, or null to paint as it always has. Only
 * the ACTIVE viewpoint (`state.viewpoint`, the one root every canvas reads) is consulted, and
 * only when its toggle is on: another viewpoint's setting, or none, changes nothing.
 */
export function resolveMetaclassColoring(
    state: { viewpoint?: string | null; idlookup?: Record<string, any> } | null | undefined,
    classId: string | null | undefined,
): MetaclassColorOverride | null {
    const vpId = state?.viewpoint;
    if (!vpId || !classId) return null;
    const idlookup = state?.idlookup ?? {};
    const setting = readMetaclassColoring(idlookup[vpId]);
    if (!setting.enabled) return null;
    const modelId = modelOfClass(idlookup, classId);
    if (!modelId) return null;
    const fill = modelColors(idlookup, modelId, setting).colors[classId];
    if (!fill) return null;
    return { fill, text: contrastText(fill), stroke: borderShade(fill), border: setting.border };
}

/**
 * The panel's list (R-VP-39): each model of `modelIds` that is a model and has classes, with
 * its classes in metamodel order, the colour the resolver paints under `setting`, and whether
 * that colour is an override. A class with no name shows its id.
 */
export function metaclassColorTable(idlookup: Record<string, any>, modelIds: readonly string[], setting: MetaclassColoring): MetaclassColorRow[] {
    const rows: MetaclassColorRow[] = [];
    for (const modelId of modelIds ?? []) {
        const model = idlookup?.[modelId];
        if (!model || model.className !== 'DModel') continue;
        const { graph, colors } = modelColors(idlookup, modelId, setting);
        if (!graph.ids.length) continue;
        rows.push({
            modelId,
            modelName: model.name ?? '',
            classes: graph.ids.map((id) => ({
                id,
                name: idlookup[id]?.name || id,
                color: colors[id],
                overridden: !!normalizeHex(setting.overrides?.[id]),
            })),
        });
    }
    return rows;
}

/** The inks a derived notation fills a glyph with: the name ink (`NAME_INK`, viewpointDerivation.ts) and the catalogue's (`INK`, notationCatalog.ts). */
const GLYPH_INKS: ReadonlySet<unknown> = new Set(['var(--color-inode-name)', '#334155']);
/** The markers of a bull's-eye: the catalogue's final state (`dot`) and Activity (UML)'s final (`dot-large`). */
const BULLSEYE_MARKERS: ReadonlySet<unknown> = new Set(['dot', 'dot-large']);

/**
 * Whether a view draws its node as a NOTATION GLYPH (P-2026-10-02-2045, R-VP-50): a view a
 * derivation created (`generated` set; a view written by hand never is one) drawn as a `bar`
 * (fork, join, a Petri transition), as a `circle` filled in an ink (an initial disc), or as a
 * `circle` with the `dot` or `dot-large` marker (a final bull's-eye). Such a node is not
 * coloured by metaclass: its shape carries its meaning. A conditional form, fill or marker
 * never matches, so the classic Petri place, whose token marker is one, stays coloured.
 */
export function isNotationGlyph(
    ir: { readonly kind?: unknown; readonly generated?: unknown; readonly shape?: { readonly form?: unknown; readonly fill?: unknown; readonly marker?: unknown } } | null | undefined,
): boolean {
    const shape = ir?.generated ? ir.shape : undefined;
    if (!shape) return false;
    if (shape.form === 'bar') return true;
    return shape.form === 'circle' && (GLYPH_INKS.has(shape.fill) || BULLSEYE_MARKERS.has(shape.marker));
}

/**
 * The classes viewpoint `viewpointId` draws only as notation glyphs (R-VP-50), for the panel:
 * each class a glyph view of that viewpoint is pinned to (`authoringMetaclassPins`) and no other
 * node view of it is. The views are read as the resolver's index reads them (`viewelements`,
 * `viewpoint`). The palette still assigns these classes their colour; they are just not painted.
 */
export function notationGlyphClasses(
    state: { idlookup?: Record<string, any>; viewelements?: readonly string[] } | null | undefined,
    viewpointId: string | null | undefined,
): string[] {
    if (!viewpointId) return [];
    const idlookup = state?.idlookup ?? {};
    const glyph = new Set<string>();
    const other = new Set<string>();
    for (const vid of state?.viewelements ?? []) {
        const ir = idlookup[vid]?.viewpoint === viewpointId ? idlookup[vid].ir : null;
        if (!ir || typeof ir !== 'object' || (ir.kind !== 'vertex' && ir.kind !== 'graphVertex')) continue;
        const into = isNotationGlyph(ir) ? glyph : other;
        for (const classId of Object.values(ir.authoringMetaclassPins ?? {})) if (typeof classId === 'string') into.add(classId);
    }
    return [...glyph].filter((id) => !other.has(id));
}

/**
 * The `--color-inode-*` tokens a coloured node sets inline, so that every surface drawn with
 * them follows: the native card's fill, border and header rule, and the text of names, labels,
 * values and footers (the row values of IR nodes too). Border off is `transparent`, never a
 * width of 0: the node keeps its size. Chips and ref pills keep their own grounds and inks.
 *
 * Selected, the native header keeps the fill and its rule (R-VP-30): the two selected-header
 * tokens are pointed at the unselected look, so the name keeps its contrast and selection shows
 * through the cyan border and ring alone. Set only while coloured: off, selection is untouched.
 */
export function metaclassColoringVars(o: MetaclassColorOverride): Record<string, string> {
    const rule = o.border ? o.stroke : 'transparent';
    return {
        '--color-inode-surface': o.fill,
        '--color-inode-border': rule,
        '--color-inode-selected-header-bg': 'transparent',
        '--color-inode-selected-header-border': rule,
        '--color-inode-name': o.text,
        '--color-inode-label': o.text,
        '--color-inode-quiet': o.text,
        '--color-inode-footer': o.text,
    };
}

/**
 * The rebinding of `metaclassColoringVars` undone, for what a coloured node draws OUTSIDE its box
 * (R-VP-51: the outside labels, the entry mark). They sit on the canvas, not on the fill, so they
 * keep the notation's ink: the name ink points back at `--color-canvas-ink`, which the token files
 * resolve at `:root`, where no node's inline rebinding reaches.
 */
export function metaclassOutsideInkVars(): Record<string, string> {
    return { '--color-inode-name': 'var(--color-canvas-ink)' };
}
