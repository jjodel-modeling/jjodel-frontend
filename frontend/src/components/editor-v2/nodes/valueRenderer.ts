/**
 * valueRenderer — which visual treatment a slot of an instance node gets.
 *
 * Design handoff: docs/design/design_handoff_instance_node/README.md, "Value
 * renderers" and "Value-renderer detection".
 *
 * Two of the five renderers are decided by the model, not inferred: a slot of a
 * DReference is a `reference`, a slot holding more than one value is a
 * `collection`. The inference only ever answers ONE question — is this scalar a
 * colour — and it answers it with the handoff's priority ladder:
 *
 *   1. the metamodel declaration (the only authoritative source)
 *   2. the value, parsed syntactically (a lexer, not a heuristic)
 *   3. an enumeration whose EVERY literal is a CSS colour name
 *   4. the attribute name, only to break a tie between two already-plausible
 *      readings — never as a sole trigger
 *
 * Every decision carries the rule that produced it in `reason`. The handoff
 * requires the inference to be visible and reversible; this slice makes it
 * visible (the row's tooltip), and `reason` is the string the correction menu
 * of the next slice will show and then promote to a rule-1 declaration.
 */

// ─── CSS colour names ────────────────────────────────────────────────────────

/**
 * The CSS named colours. Needed by rules 3 and 4, which ask whether a literal
 * IS a colour name — not what it is worth: the swatch paints the name itself,
 * since `background: Green` is exactly what the browser resolves. Case is
 * irrelevant to CSS, so the set is lowercase and lookups normalise.
 */
const CSS_COLOR_NAMES: ReadonlySet<string> = new Set([
    'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque',
    'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood',
    'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk',
    'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray',
    'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta', 'darkolivegreen',
    'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen',
    'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise',
    'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue',
    'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro',
    'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey',
    'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
    'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral',
    'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey',
    'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray',
    'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen',
    'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue',
    'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue',
    'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue',
    'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace',
    'olive', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod',
    'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff',
    'peru', 'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple', 'red',
    'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen',
    'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray',
    'slategrey', 'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle',
    'tomato', 'turquoise', 'violet', 'wheat', 'white', 'whitesmoke', 'yellow',
    'yellowgreen',
]);

/**
 * Colour words that are NOT CSS keywords, with the value the swatch paints.
 *
 * This exists because of one measured contradiction in the handoff. Rule 3 is
 * stated as "every literal maps to a known CSS color name", and the worked
 * example given for it is `Status { Green, Amber, Red }`, asserted to pass —
 * but `amber` has never been a CSS keyword, so under the rule as written the
 * handoff's only example of rule 3 fails, and the traffic-light enum (the case
 * the rule is most obviously FOR) never gets a swatch.
 *
 * So the rule keeps its criterion and the vocabulary is widened by exactly the
 * words the handoff itself treats as colours. One entry, not a synonym
 * dictionary: every addition here widens rule 3, and a wrong one puts a swatch
 * on something that is not a colour.
 *
 * The hex is DATA, not chrome — it is the colour the value denotes, the same
 * way `#22c55e` in the reference is the value of the attribute and not a token.
 */
const NON_CSS_COLOR_WORDS: Readonly<Record<string, string>> = {
    amber: '#f59e0b',
};

/** Metamodel type names that DECLARE a colour (rule 1). */
const COLOR_TYPE_NAMES: ReadonlySet<string> = new Set([
    'color', 'colour', 'ecolor', 'ecolour', 'rgb', 'rgba', 'rgbcolor', 'hexcolor',
]);

/**
 * Attribute names that make a colour reading plausible (rule 4). Deliberately
 * NOT a trigger: the handoff is explicit that `color` on a Printer may be a CMYK
 * integer, so this set only ever breaks a tie where the value ALREADY parses or
 * names a colour.
 */
const COLOR_NAME_HINTS: ReadonlySet<string> = new Set([
    'color', 'colour', 'background', 'backgroundcolor', 'bg', 'bgcolor', 'fill',
    'fillcolor', 'stroke', 'strokecolor', 'tint', 'foreground', 'border',
    'bordercolor', 'accent',
]);

// ─── Syntactic colour lexer (rule 2) ─────────────────────────────────────────

const HEX_RE = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const HEX_0X_RE = /^0x(?:[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNC_RE = /^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(\s*[^()]*\)$/i;

/**
 * True when the string is a colour by its own syntax, with no model knowledge.
 * A lexer, not a heuristic: every form here is unambiguous.
 */
export function isSyntacticColor(raw: string): boolean {
    const s = raw.trim();
    if (!s) return false;
    return HEX_RE.test(s) || HEX_0X_RE.test(s) || FUNC_RE.test(s);
}

/**
 * True when the string names a colour: a CSS keyword, or one of the few colour
 * words the handoff treats as colours without CSS agreeing (see
 * NON_CSS_COLOR_WORDS).
 */
export function isNamedColor(raw: string): boolean {
    const k = raw.trim().toLowerCase();
    return CSS_COLOR_NAMES.has(k) || k in NON_CSS_COLOR_WORDS;
}

/**
 * The CSS value that paints this colour, or null when the string is not one the
 * browser can resolve. `0xRRGGBB` is the one form CSS does not read, so it is
 * rewritten to `#RRGGBB`; every other accepted form is already CSS.
 */
export function toCssColor(raw: string): string | null {
    const s = raw.trim();
    if (!s) return null;
    if (HEX_0X_RE.test(s)) return `#${s.slice(2)}`;
    if (HEX_RE.test(s) || FUNC_RE.test(s)) return s;
    const k = s.toLowerCase();
    if (CSS_COLOR_NAMES.has(k)) return s;      // the name itself is what CSS paints
    if (k in NON_CSS_COLOR_WORDS) return NON_CSS_COLOR_WORDS[k];
    return null;
}

// ─── The decision ────────────────────────────────────────────────────────────

export type RendererKind = 'empty' | 'scalar' | 'color' | 'collection' | 'reference';

export interface RendererDecision {
    kind: RendererKind;
    /** For `color`: a CSS colour string the swatch can paint. */
    swatch?: string;
    /** Which rule decided, in the handoff's own words. Shown as the row tooltip. */
    reason: string;
}

export interface SlotShape {
    /** Display value of the slot (the first value, for a single-valued slot). */
    value: string;
    /** Every value held, for a multi-valued slot. */
    values?: string[];
    /** DReference slot, as opposed to DAttribute. */
    isReference?: boolean;
    /** Declared multi-valued in the metamodel (upperBound ≠ 1). */
    isMany?: boolean;
    /** Name of the slot's metamodel type, e.g. `EString`, `Color`, `Status`. */
    typeName?: string;
    /** Literal names, when the type is an enumeration. */
    enumLiteralNames?: string[];
    /** Name of the metamodel feature, e.g. `color`, `tags`. */
    featureName?: string;
}

/** A slot holds nothing: no values, or a single blank one. */
export function isEmptySlot(slot: SlotShape): boolean {
    const many = slot.values;
    if (many && many.length > 0) return many.every((v) => v == null || String(v).trim() === '');
    if (many && many.length === 0) return true;
    return slot.value == null || String(slot.value).trim() === '' || slot.value === '—';
}

/**
 * The colour ladder. Returns the swatch and the rule that produced it, or null
 * when no rule fires. Exported on its own so the tests can walk the ladder rung
 * by rung, and so the correction menu of the next slice can re-run it.
 */
export function detectColor(slot: SlotShape): { swatch: string; reason: string } | null {
    const value = (slot.value ?? '').trim();
    if (!value) return null;

    const declaredType = (slot.typeName ?? '').trim().toLowerCase();
    const painted = toCssColor(value);

    // Rule 1 — the metamodel declares it. The only source that can be right for
    // an enum literal carrying no RGB of its own. A declaration with a value the
    // browser cannot paint yields no swatch, and the handoff is clear that the
    // swatch never replaces the text: without one there is nothing to draw, so
    // the slot falls through to `scalar` rather than rendering a blank chip.
    if (COLOR_TYPE_NAMES.has(declaredType) && painted) {
        return { swatch: painted, reason: `declared ${slot.typeName} in the metamodel` };
    }

    // Rule 2 — the value parses. Unambiguous, no model knowledge needed.
    if (isSyntacticColor(value) && painted) {
        return { swatch: painted, reason: 'parsed from the value syntax' };
    }

    // Rule 3 — every literal of the enumeration is a colour name. Testing the
    // WHOLE literal set, not the single value, is what makes this safe.
    const literals = slot.enumLiteralNames;
    if (literals && literals.length > 0 && painted) {
        if (literals.every((l) => isNamedColor(l))) {
            return { swatch: painted, reason: 'inferred from: CSS colour enum' };
        }
    }

    // Rule 4 — the attribute name, and only as a tie-break: the value must
    // already name a colour, so this never triggers a colour on its own.
    if (painted && isNamedColor(value)) {
        const fname = (slot.featureName ?? '').trim().toLowerCase();
        if (COLOR_NAME_HINTS.has(fname)) {
            return { swatch: painted, reason: `tie-break on the name "${slot.featureName}"` };
        }
    }

    return null;
}

/**
 * The renderer for one slot. Order matters: emptiness and cardinality come from
 * the model and settle the question before any inference runs.
 */
export function detectValueRenderer(slot: SlotShape): RendererDecision {
    if (isEmptySlot(slot)) {
        return { kind: 'empty', reason: 'the slot holds no value' };
    }

    if (slot.isReference) {
        return { kind: 'reference', reason: 'the slot is a reference to another object' };
    }

    const count = slot.values?.length ?? 0;
    if (count > 1 || (slot.isMany && count >= 1)) {
        return { kind: 'collection', reason: 'the slot is multi-valued' };
    }

    const colour = detectColor(slot);
    if (colour) return { kind: 'color', swatch: colour.swatch, reason: colour.reason };

    return { kind: 'scalar', reason: 'no colour rule fired' };
}
