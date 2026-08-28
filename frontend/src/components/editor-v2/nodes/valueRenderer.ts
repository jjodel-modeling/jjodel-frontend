/**
 * valueRenderer — which visual treatment a slot of an instance node gets.
 *
 * Design handoff: docs/design/design_handoff_instance_node/README.md, "Value
 * renderers" and "Value-renderer detection", and `Instance Node Proposal.dc.html`
 * Turno 5a, which is the specimen every geometry and colour value comes from.
 *
 * This is the pure half of the Row view library: the nine renderers plus `dash`
 * for an empty slot, `collection` for the chip layout, and `brokenRef` for a
 * reference whose target is gone. The presentational half is `RowValue.tsx`,
 * which paints what this module decides and nothing else — the same split as
 * `singletonShape.ts` / `SingletonPill.tsx`, and for the same reason: one
 * decision, two positions, no way for them to drift.
 *
 * Most of the library is settled by the MODEL rather than inferred. Brokenness,
 * emptiness, reference-ness, cardinality, and the declared type all decide
 * outright. The inference only ever answers ONE question — is this scalar a
 * colour — and it answers it with the handoff's priority ladder:
 *
 *   1. the metamodel declaration (the only authoritative source)
 *   2. the value, parsed syntactically (a lexer, not a heuristic)
 *   3. an enumeration whose EVERY literal is a CSS colour name
 *   4. the attribute name, only to break a tie between two already-plausible
 *      readings — never as a sole trigger
 *
 * Three renderers take no inference at all, by design: a unit, a pair of bounds
 * and a mono treatment come from a metamodel annotation or they do not happen.
 * The handoff says so three separate times, and the acceptance criterion is
 * explicit that naming an attribute `durationSeconds` must not print a unit.
 *
 * Every decision carries the rule that produced it in `reason`, shown as the
 * row's tooltip. `traceLadder` reports the SAME walk rung by rung, including
 * the rungs that did not fire and the ones never reached, which is what the
 * inspector shows and what makes rule 4 safe to keep in the ladder at all.
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

// ─── Type families ───────────────────────────────────────────────────────────
//
// The metamodel primitives, from `ShortAttribETypes` (`common/U.tsx:3322`).
// Matching is case-insensitive and covers the bare name, because an imported
// metamodel may name a type `EInt` or carry a custom EDataType that shadows it;
// only the exact primitive names decide, never a substring.

const BOOLEAN_TYPE_NAMES: ReadonlySet<string> = new Set(['eboolean', 'boolean', 'bool']);

const DATE_TYPE_NAMES: ReadonlySet<string> = new Set(['edate', 'date', 'datetime', 'timestamp']);

const NUMERIC_TYPE_NAMES: ReadonlySet<string> = new Set([
    'ebyte', 'eshort', 'eint', 'einteger', 'elong', 'efloat', 'edouble',
    'ebigdecimal', 'ebiginteger', 'int', 'integer', 'long', 'float', 'double',
    'number', 'decimal',
]);

const normType = (t: string | undefined | null): string => (t ?? '').trim().toLowerCase();

export function isColorType(typeName?: string): boolean { return COLOR_TYPE_NAMES.has(normType(typeName)); }
export function isBooleanType(typeName?: string): boolean { return BOOLEAN_TYPE_NAMES.has(normType(typeName)); }
export function isDateType(typeName?: string): boolean { return DATE_TYPE_NAMES.has(normType(typeName)); }
export function isNumericType(typeName?: string): boolean { return NUMERIC_TYPE_NAMES.has(normType(typeName)); }

/**
 * `true` / `false` from a slot value. Returns null when the string is neither,
 * which keeps a malformed EBoolean rendering as text instead of silently
 * reading as false — a dot that says "false" about a value that says `maybe`
 * would be a lie the row cannot be argued with.
 */
export function parseBoolean(raw: string): boolean | null {
    const v = raw.trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes') return true;
    if (v === 'false' || v === '0' || v === 'no') return false;
    return null;
}

/** A finite number from a slot value, or null. */
export function parseNumber(raw: string): number | null {
    const v = raw.trim();
    if (v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

// ─── Dates ───────────────────────────────────────────────────────────────────

/**
 * The absolute half of the date renderer: `2026-08-28`.
 *
 * The date is printed from the string's own calendar fields when it already is
 * an ISO date, and only parsed when it is not. `new Date('2026-08-28')` is UTC
 * midnight, and formatting that back in a timezone west of Greenwich prints
 * `2026-08-27` — a model is a document, and a document that changes date when
 * opened in another office is a bug, not a rounding.
 */
export function absoluteDate(raw: string): string | null {
    const v = raw.trim();
    if (!v) return null;
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const t = Date.parse(v);
    if (Number.isNaN(t)) return null;
    const d = new Date(t);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * The relative half: `19h`, `3g`, `2 mesi`. Never shown alone — «a model is a
 * document, not a feed» — so this is only ever the dimmed suffix after the ISO
 * date, and returning null simply drops the suffix.
 *
 * `now` is a parameter rather than a `Date.now()` call so the renderer is a
 * pure function of its inputs and the tests do not have to freeze the clock.
 */
export function relativeAge(raw: string, now: number): string | null {
    const t = Date.parse(raw.trim());
    if (Number.isNaN(t)) return null;
    const secs = Math.round((now - t) / 1000);
    const abs = Math.abs(secs);
    if (abs < 60) return 'ora';
    if (abs < 3600) return `${Math.floor(abs / 60)}min`;
    if (abs < 86400) return `${Math.floor(abs / 3600)}h`;
    if (abs < 2592000) return `${Math.floor(abs / 86400)}g`;
    if (abs < 31536000) {
        const m = Math.floor(abs / 2592000);
        return m === 1 ? '1 mese' : `${m} mesi`;
    }
    const y = Math.floor(abs / 31536000);
    return y === 1 ? '1 anno' : `${y} anni`;
}

// ─── The decision ────────────────────────────────────────────────────────────

/**
 * The library, one member per renderer.
 *
 * `dash` is the confirmed default for an empty slot and `collection` is the
 * layout the chips sit in, so the nine renderers of the handoff are the rest.
 * `brokenRef` is a state of `refPill`, not a tenth notation: it renders where a
 * pill would have and says why there is no pill.
 */
export type RendererKind =
    | 'dash'
    | 'swatch'
    | 'enumChip'
    | 'refPill'
    | 'boolean'
    | 'numberUnit'
    | 'date'
    | 'truncatedText'
    | 'progress'
    | 'code'
    | 'collection'
    | 'brokenRef';

/** Every kind that can be declared by a rule-1 annotation. */
export const DECLARABLE_RENDERERS: readonly RendererKind[] = [
    'swatch', 'enumChip', 'boolean', 'numberUnit', 'date', 'truncatedText', 'progress', 'code',
];

export function isDeclarableRenderer(kind: string): kind is RendererKind {
    return (DECLARABLE_RENDERERS as readonly string[]).includes(kind);
}

export interface RendererDecision {
    kind: RendererKind;
    /** For `swatch`: a CSS colour string the square can paint. */
    swatch?: string;
    /** For `numberUnit` and `progress`: the declared unit, never an inferred one. */
    unit?: string;
    /** For `boolean`: the parsed value. */
    boolValue?: boolean;
    /** For `date`: the absolute ISO half. The relative half is computed at render. */
    dateIso?: string;
    /** For `progress`: the declared bounds and the position between them, 0..1. */
    min?: number;
    max?: number;
    ratio?: number;
    /** For `numberUnit` and `progress`: the parsed number. */
    numValue?: number;
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
    /**
     * Rule-1 renderer declaration, from `jjodel/renderer=…`. Settles the
     * question outright and stops the ladder — see `rowViewAnnotations.ts`.
     */
    rendererOverride?: string;
    /**
     * Unit suffix, from `jjodel/unit=…` and from nowhere else. The handoff is
     * explicit: never inferred from the attribute name.
     */
    unit?: string;
    /** Bounds, from `jjodel/min=…` and `jjodel/max=…`. `progress` needs BOTH. */
    min?: number;
    max?: number;
    /** The reference points at an object that no longer resolves. */
    isBroken?: boolean;
}

/** A slot holds nothing: no values, or a single blank one. */
export function isEmptySlot(slot: SlotShape): boolean {
    const many = slot.values;
    if (many && many.length > 0) return many.every((v) => v == null || String(v).trim() === '');
    if (many && many.length === 0) return true;
    return slot.value == null || String(slot.value).trim() === '' || slot.value === '—';
}

// ─── The colour ladder, rung by rung ─────────────────────────────────────────

export type RungStatus = 'fired' | 'not-fired' | 'not-evaluated';

export interface LadderRung {
    /** 1..4, the handoff's own numbering. */
    index: number;
    /** The rung's name, as the inspector prints it. */
    title: string;
    status: RungStatus;
    /**
     * What it found, or why it did not fire. Empty for a rung never reached:
     * a rung that was not evaluated has no evidence to state, and inventing one
     * would be the exact failure the whole-ladder display exists to prevent.
     */
    evidence: string;
}

export interface LadderTrace {
    rungs: LadderRung[];
    /** The colour the winning rung produced, when one did. */
    swatch: string | null;
    /** Index of the winning rung, or null when none fired. */
    winner: number | null;
}

const RUNG_TITLES = [
    'Metamodel declaration',
    'Parsed value',
    'CSS colour enum',
    'Attribute name',
];

/**
 * Walk all four rungs and report every one of them.
 *
 * This is the inspector's data, and it is deliberately NOT a by-product of
 * `detectColor`: «a heuristic that shows only its answer cannot be argued with,
 * and the user's only recourse is to override every property by hand. Showing
 * the discarded rungs is what makes rule 4 safe to keep in the ladder at all.»
 * So the trace states, for each rung, either what it found or why it did not
 * fire — and rungs after the winner are marked `not-evaluated` rather than
 * silently omitted, because "it did not apply" and "we never asked" are
 * different facts about the model.
 */
export function traceLadder(slot: SlotShape): LadderTrace {
    const value = (slot.value ?? '').trim();
    const painted = toCssColor(value);
    const declaredType = normType(slot.typeName);
    const featureName = (slot.featureName ?? '').trim();
    const literals = slot.enumLiteralNames ?? [];

    const rungs: LadderRung[] = RUNG_TITLES.map((title, i) => ({
        index: i + 1, title, status: 'not-evaluated' as RungStatus, evidence: '',
    }));
    const fire = (i: number, evidence: string) => { rungs[i].status = 'fired'; rungs[i].evidence = evidence; };
    const miss = (i: number, evidence: string) => { rungs[i].status = 'not-fired'; rungs[i].evidence = evidence; };

    // Rung 1 — the metamodel declaration, the only authoritative source.
    if (slot.rendererOverride) {
        fire(0, `annotation jjodel/renderer=${slot.rendererOverride}`);
        return { rungs, swatch: slot.rendererOverride === 'swatch' ? painted : null, winner: 1 };
    }
    if (COLOR_TYPE_NAMES.has(declaredType) && painted) {
        fire(0, `declared type ${slot.typeName}`);
        return { rungs, swatch: painted, winner: 1 };
    }
    miss(0, COLOR_TYPE_NAMES.has(declaredType)
        ? `type ${slot.typeName} is declared a colour, but "${value}" is not paintable`
        : (featureName ? `no annotation on ${featureName}` : 'no annotation on the property'));

    // Rung 2 — the value, parsed syntactically. A lexer, not a heuristic.
    if (isSyntacticColor(value) && painted) {
        fire(1, `"${value}" is a colour literal`);
        return { rungs, swatch: painted, winner: 2 };
    }
    miss(1, value ? `"${value}" is not a colour literal` : 'the slot has no value');

    // Rung 3 — EVERY literal of the enumeration is a colour name. Testing the
    // whole literal set rather than the single value is what makes this safe.
    if (literals.length > 0) {
        const offender = literals.find((l) => !isNamedColor(l));
        if (!offender && painted) {
            const shown = literals.slice(0, 6).join(', ');
            const enumName = slot.typeName ? ` of ${slot.typeName}` : '';
            fire(2, `All ${literals.length} literals${enumName} are CSS colour names: ${shown}`);
            return { rungs, swatch: painted, winner: 3 };
        }
        miss(2, offender
            ? `"${offender}" is not a CSS colour name`
            : `"${value}" is not paintable`);
    } else {
        miss(2, 'the property is not typed on an enumeration');
    }

    // Rung 4 — the attribute name, and ONLY as a tie-break: the value must
    // already name a colour, so this never triggers a colour on its own.
    if (painted && isNamedColor(value) && COLOR_NAME_HINTS.has(featureName.toLowerCase())) {
        fire(3, `tie broken on the name "${featureName}"`);
        return { rungs, swatch: painted, winner: 4 };
    }
    miss(3, !isNamedColor(value)
        ? `"${value}" does not name a colour, so there is no tie to break`
        : `"${featureName || 'the property'}" is not a name that suggests a colour`);

    return { rungs, swatch: null, winner: null };
}

/**
 * The renderer the METAMODEL alone settles, with no instance in hand.
 *
 * `detectValueRenderer` answers for a slot, and most of what it consults is the
 * slot's VALUE: it short-circuits on `isEmptySlot`, and ladder rungs 2 to 4 read
 * the value, then the enum literals against the value, then the attribute name
 * but only as a tie-break on a value that already names a colour. Called with no
 * value it answers `dash` for every attribute in the model, which is true of the
 * slot and useless about the feature.
 *
 * What CAN be answered without a value is exactly what the four Display
 * annotations govern: the rule-1 declaration, the declared type, and the pair of
 * bounds that chooses between `progress` and `numberUnit`. This returns that and
 * says nothing else — the M2 panel states the fact it can reach instead of
 * claiming a verdict it cannot, which is the failure the inspector exists to
 * prevent, committed one level up.
 *
 * The order below is `detectValueRenderer`'s own order with the value-dependent
 * rungs removed, and it is duplicated here rather than shared because the two
 * answer different questions: one is "what does this slot render as", the other
 * is "what has the modeller settled". `swatch` is reported for a declared colour
 * TYPE because that is a metamodel fact; whether a given instance paints is not.
 */
export interface MetamodelRendererVerdict {
    kind: RendererKind;
    reason: string;
    /** The verdict comes from `jjodel/renderer`, so the ladder never runs. */
    fromDeclaration: boolean;
}

export function metamodelRenderer(slot: SlotShape): MetamodelRendererVerdict {
    if (slot.rendererOverride && isDeclarableRenderer(slot.rendererOverride)) {
        return {
            kind: slot.rendererOverride,
            reason: `declared jjodel/renderer=${slot.rendererOverride}`,
            fromDeclaration: true,
        };
    }
    const no = (kind: RendererKind, reason: string): MetamodelRendererVerdict =>
        ({ kind, reason, fromDeclaration: false });

    if (slot.isReference) return no('refPill', 'the feature is a reference');
    if (slot.isMany) return no('collection', 'the feature is multi-valued');
    if (isColorType(slot.typeName)) return no('swatch', `declared ${slot.typeName} type`);
    if (isBooleanType(slot.typeName)) return no('boolean', 'declared EBoolean type');
    if (isDateType(slot.typeName)) return no('date', 'declared date type');
    if (isNumericType(slot.typeName)) {
        return slot.min != null && slot.max != null
            ? no('progress', 'declared numeric type, with both bounds')
            : no('numberUnit', 'declared numeric type');
    }
    if ((slot.enumLiteralNames?.length ?? 0) > 0) {
        return no('enumChip', 'the feature is typed on an enumeration');
    }
    return no('truncatedText', 'no metamodel rule settles this; instances decide by value');
}

/**
 * The colour ladder. Returns the swatch and the rule that produced it, or null
 * when no rule fires. Exported on its own so the tests can walk the ladder rung
 * by rung, and so the inspector can re-run it after a correction.
 */
export function detectColor(slot: SlotShape): { swatch: string; reason: string } | null {
    const trace = traceLadder(slot);
    if (!trace.swatch || trace.winner == null) return null;
    const reason = trace.winner === 1
        ? (slot.rendererOverride ? 'declared in the metamodel' : `declared ${slot.typeName} in the metamodel`)
        : trace.winner === 2
            ? 'parsed from the value syntax'
            : trace.winner === 3
                ? 'inferred from: CSS colour enum'
                : `tie-break on the name "${slot.featureName}"`;
    return { swatch: trace.swatch, reason };
}

// ─── The renderer ────────────────────────────────────────────────────────────

/**
 * Build the decision for a kind that carries payload, so the override path and
 * the inferred path produce byte-identical decisions. A declared `progress`
 * with no bounds has to fall back exactly the way an inferred one does.
 */
function decide(kind: RendererKind, slot: SlotShape, reason: string): RendererDecision {
    const value = (slot.value ?? '').trim();

    switch (kind) {
        case 'swatch': {
            const painted = toCssColor(value);
            // The swatch never replaces the text, so with nothing to paint
            // there is no swatch to draw and the value stays a string.
            return painted
                ? { kind: 'swatch', swatch: painted, reason }
                : { kind: 'truncatedText', reason: `${reason}, but "${value}" is not paintable` };
        }
        case 'boolean': {
            const b = parseBoolean(value);
            return b === null
                ? { kind: 'truncatedText', reason: `${reason}, but "${value}" is neither true nor false` }
                : { kind: 'boolean', boolValue: b, reason };
        }
        case 'date': {
            const iso = absoluteDate(value);
            return iso
                ? { kind: 'date', dateIso: iso, reason }
                : { kind: 'truncatedText', reason: `${reason}, but "${value}" is not a date` };
        }
        case 'progress': {
            const n = parseNumber(value);
            const { min, max } = slot;
            // Both bounds, distinct, and a number to place between them.
            // «Without bounds it falls back to numberUnit» — and to the SAME
            // numberUnit, which is why this returns that decision rather than a
            // progress one with a null ratio.
            if (n == null || min == null || max == null || max === min) {
                return decide('numberUnit', slot, reason);
            }
            const ratio = Math.min(1, Math.max(0, (n - min) / (max - min)));
            return { kind: 'progress', numValue: n, min, max, ratio, unit: slot.unit, reason };
        }
        case 'numberUnit': {
            const n = parseNumber(value);
            return { kind: 'numberUnit', numValue: n ?? undefined, unit: slot.unit, reason };
        }
        default:
            return { kind, reason };
    }
}

/**
 * The renderer for one slot.
 *
 * Order matters, and it is the handoff's own: what the MODEL settles comes
 * before anything inferred. Brokenness, emptiness, reference-ness and
 * cardinality are all facts about the slot; only after them does the ladder run
 * and only ever to answer "is this a colour".
 */
export function detectValueRenderer(slot: SlotShape): RendererDecision {
    // A dangling pointer outranks emptiness: a reference that HELD something and
    // lost it is not the same fact as one never set, and the row has to say so.
    if (slot.isBroken) {
        return { kind: 'brokenRef', reason: 'the reference target no longer exists' };
    }

    if (isEmptySlot(slot)) {
        return { kind: 'dash', reason: 'the slot holds no value' };
    }

    if (slot.isReference) {
        return { kind: 'refPill', reason: 'the slot is a reference to another object' };
    }

    const count = slot.values?.length ?? 0;
    if (count > 1 || (slot.isMany && count >= 1)) {
        return { kind: 'collection', reason: 'the slot is multi-valued' };
    }

    // ── Rule 1, the whole of it ──
    //
    // A renderer declaration is a rule-1 declaration exactly like a `Color`
    // type is, so it is honoured here and the ladder never runs. This is the
    // mechanism behind «a user correction promotes to the metamodel, and the
    // heuristic stops running for that property».
    if (slot.rendererOverride && isDeclarableRenderer(slot.rendererOverride)) {
        return decide(slot.rendererOverride, slot, `declared jjodel/renderer=${slot.rendererOverride}`);
    }

    // ── The model's own type, before any inference ──
    //
    // A declared type is a fact, and it outranks a value that happens to read
    // like something else: `0xFF00AA` in an EInt is a number written in hex,
    // not a colour, and only rule 1 may say otherwise.
    if (isBooleanType(slot.typeName)) return decide('boolean', slot, 'declared EBoolean type');
    if (isDateType(slot.typeName)) return decide('date', slot, 'declared date type');
    if (isNumericType(slot.typeName)) {
        // Bounds decide between the two numeric renderers; the unit rides along
        // with either, and comes from the annotation or not at all.
        return decide(slot.min != null && slot.max != null ? 'progress' : 'numberUnit', slot, 'declared numeric type');
    }

    // ── The colour ladder ──
    const colour = detectColor(slot);
    if (colour) return { kind: 'swatch', swatch: colour.swatch, reason: colour.reason };

    // ── An enumeration whose literals are not colours ──
    if ((slot.enumLiteralNames?.length ?? 0) > 0) {
        return { kind: 'enumChip', reason: 'the slot is typed on an enumeration' };
    }

    // The string renderer, and the library's floor: one line, ellipsis, and the
    // whole value in the tooltip. Every slot has a rendering.
    return { kind: 'truncatedText', reason: 'no colour rule fired' };
}
