/**
 * «Color by metaclass» (P-2026-09-30-1815, R-VP-27..31): the pure half of the viewpoint option.
 *
 * With the option on, every M1 object node shown under the viewpoint is filled with the colour
 * of its metaclass, taken from a palette derived from one base colour; its text turns black or
 * white, whichever contrasts more with the fill; its border is a darker shade of the fill, or
 * transparent. The two render points (`ObjectNode.tsx` for the native branch,
 * `IRNodeContent.tsx` for the IR one) ask `resolveMetaclassColoring` and paint what it answers.
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
}

/** What a node paints when the option is on. `stroke` is the border shade, drawn only with `border`. */
export interface MetaclassColorOverride {
    fill: string;
    text: '#000000' | '#ffffff';
    stroke: string;
    border: boolean;
}

export const DEFAULT_METACLASS_BASE_COLOR = '#0ea5e9';

/** Analogous scheme (R-VP-29): the hues stay within ±60° of the base, one step apart. */
const HUE_WINDOW = 60;
const STEP_MAX = 30, STEP_MIN = 15;
/** Past the window the hues cycle again, 10 lightness points darker, then lighter, and so on. */
const L_STEP = 10;
const S_MIN = 40, S_MAX = 80;
const L_MIN = 35, L_MAX = 75;
const SHADE_STEP = 25, SHADE_FLOOR = 10;

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

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

/**
 * One colour per metaclass, `count` of them, ANALOGOUS to the base (R-VP-29): a scheme that goes
 * with the picked colour, not a categorical wheel.
 *
 * Colour 0 is the base exactly as picked (the default `#0ea5e9` has S 89 %, above the clamp).
 * From colour 1 the hues spread inside ±60° of the base hue, +1 step, −1 step, +2, −2, …, the step
 * 120° / (count − 1) kept within 15°..30°: 30° up to five classes, tighter above, never under the
 * 15° that keeps two neighbours apart. When the window is used up the hues cycle again (the base
 * hue first) with the lightness moved 10 points, darker, then lighter, then 20 darker, …, inside
 * L 35..75, a level outside it skipped. Saturation is the base's, clamped to 40..80 %.
 * Deterministic; an invalid base falls back to the default.
 */
export function metaclassPalette(baseColor: string, count: number): string[] {
    const base = normalizeHex(baseColor) ?? DEFAULT_METACLASS_BASE_COLOR;
    if (count <= 0) return [];
    const [h, s, l] = hslOf(base);
    const sat = clamp(s, S_MIN, S_MAX);
    const light = clamp(l, L_MIN, L_MAX);
    const step = clamp((2 * HUE_WINDOW) / Math.max(count - 1, 1), STEP_MIN, STEP_MAX);
    const offsets: number[] = [];
    for (let k = 1; k * step <= HUE_WINDOW + 1e-9; k++) offsets.push(k * step, -k * step);
    const levels: number[] = [];
    for (let d = L_STEP; d <= L_MAX - L_MIN; d += L_STEP) {
        for (const v of [light - d, light + d]) if (v >= L_MIN && v <= L_MAX) levels.push(v);
    }
    const out: string[] = [base];
    for (const o of offsets) {
        if (out.length >= count) break;
        out.push(hexOfHsl(h + o, sat, light));
    }
    for (let round = 0; out.length < count; round++) {
        const lv = levels[round % levels.length];
        for (const o of [0, ...offsets]) {
            if (out.length >= count) break;
            out.push(hexOfHsl(h + o, sat, lv));
        }
    }
    return out;
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

/** The border of a coloured node: same hue and saturation, lightness minus 25 points, floor 10 %. */
export function borderShade(fill: string): string {
    const [h, s, l] = hslOf(normalizeHex(fill) ?? DEFAULT_METACLASS_BASE_COLOR);
    return hexOfHsl(h, s, Math.max(SHADE_FLOOR, l - SHADE_STEP));
}

/**
 * The setting of a viewpoint D object as the panel shows it. ABSENT IS A VALUE: a viewpoint
 * that never used the option reads as off, with the default base and the border on, and old
 * projects need no migration. Only an invalid base is repaired.
 */
export function readMetaclassColoring(vp: { readonly [key: string]: any } | null | undefined): MetaclassColoring {
    const raw: Partial<MetaclassColoring> | undefined = vp?.metaclassColoring;
    return {
        enabled: raw?.enabled === true,
        baseColor: normalizeHex(raw?.baseColor) ?? DEFAULT_METACLASS_BASE_COLOR,
        border: raw?.border !== false,
    };
}

/**
 * The position of a class among the classes of its metamodel, and how many there are. The
 * order is the metamodel's own: `DModel.packages` in order, and in each package its `classes`,
 * then its `subpackages`, depth first. It survives reloads and renames (the arrays persist in
 * order); every class has an index, abstract ones included. Null when the class or its model
 * is not in the lookup.
 */
export function metaclassOrder(idlookup: Record<string, any>, classId: string): { index: number; count: number } | null {
    const cls = idlookup?.[classId];
    if (!cls) return null;
    let model: any = null;
    const climbed = new Set<string>();
    for (let p = cls.father; typeof p === 'string' && !climbed.has(p); p = idlookup[p]?.father) {
        climbed.add(p);
        const d = idlookup[p];
        if (!d) break;
        if (d.className === 'DModel') { model = d; break; }
    }
    if (!model) return null;
    const order: string[] = [];
    const seen = new Set<string>();
    const walk = (pkgId: string) => {
        const pkg = idlookup[pkgId];
        if (!pkg || seen.has(pkgId)) return;
        seen.add(pkgId);
        for (const c of pkg.classes ?? []) order.push(c);
        for (const sp of pkg.subpackages ?? []) walk(sp);
    };
    for (const pkgId of model.packages ?? []) walk(pkgId);
    const index = order.indexOf(classId);
    return index < 0 ? null : { index, count: order.length };
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
    const pos = metaclassOrder(idlookup, classId);
    if (!pos) return null;
    const fill = metaclassPalette(setting.baseColor, pos.count)[pos.index];
    return { fill, text: contrastText(fill), stroke: borderShade(fill), border: setting.border };
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
