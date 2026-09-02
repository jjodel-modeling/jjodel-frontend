/**
 * jjform/widgetValue — the pure half of the extended form widgets (FL3).
 *
 * Every widget of the form is the WRITE-SIDE TWIN of a Row view: the same value
 * renders identically in the table cell, in the node compartment and in the form —
 * one renderer, two sizes, read and write (`form-autolayout-spec.md`, "Widgets =
 * write-side Row views"). The read half already exists and decides in
 * `components/editor-v2/nodes/valueRenderer.ts`; this file is what the write half
 * needs in order to emit values that half can read back, and nothing more.
 *
 * So the contract of every function here is stated in terms of the READ side:
 *
 *   normalizeIsoDate      -> a string `absoluteDate` reads as a date
 *   normalizeIsoDateTime  -> the same, with the time the form lets one type
 *   parseDuration         -> the NUMBER a `numberUnit` row prints, given the unit
 *                            the metamodel declared
 *   normalizeHex          -> a string `toCssColor` paints
 *   checkEmail/checkUrl   -> a verdict for the inline check; the VALUE stays the
 *                            string the row already renders
 *
 * ── Why this is restated here and not imported ────────────────────────────────
 *
 * `valueRenderer.ts` lives under `components/`, and nothing under `jjform/` imports
 * from `joiner/`, `redux/`, `react` or `components/` (the invariant stated in
 * `shape.ts`'s header and kept by every file in this directory). So the colour and
 * date rules are RESTATED, exactly as `widgetRenderer.withoutViewWidget` restates
 * `FormAuthoringBody.pruneForm`'s pruning rules — and for the same reason, with the
 * same safeguard: `ir/widgets/__tests__/extendedWidgets.test.ts` asserts that what
 * this module emits is what `detectValueRenderer` reads, one fixture per type, so
 * the restatement cannot drift in silence.
 *
 * The one rule NOT restated is the whole of `toCssColor`: it carries 148 CSS colour
 * names, four functional notations and the `0x` form, and a copy of that would be a
 * second vocabulary rather than a restatement. `normalizeHex` covers the hex forms
 * the widget's own field produces; the widget takes the read side's `toCssColor` as
 * a prop for everything else, so the swatch in the form paints exactly what the
 * swatch in the row paints. See `ColorWidget`.
 *
 * Zero imports, like every file in this directory.
 */

// ─── The verdict of an inline check ──────────────────────────────────────────

/**
 * Three states, not two. `empty` is NOT `invalid`: an optional field left blank is
 * a fact about the model, and painting a red cross on it would be the form telling
 * the user off for something the metamodel allows. Whether empty is a problem is
 * the cardinality's answer (`missingRequired` on the read side), never this one's.
 */
export type CheckStatus = 'empty' | 'valid' | 'invalid';

export interface FieldCheck {
    readonly status: CheckStatus;
    /** Why it is invalid, in words a field can print. Absent unless `invalid`. */
    readonly reason?: string;
}

const EMPTY_CHECK: FieldCheck = { status: 'empty' };
const VALID_CHECK: FieldCheck = { status: 'valid' };

const invalidCheck = (reason: string): FieldCheck => ({ status: 'invalid', reason });

// ─── Email ───────────────────────────────────────────────────────────────────

/**
 * A local part, an `@`, and a dotted domain — deliberately not RFC 5322.
 *
 * The full grammar accepts quoted local parts, comments and bare hostnames, none of
 * which a form's green tick can usefully tell a modeller about, and rejecting a
 * valid-but-exotic address is worse than accepting one the mail server will bounce.
 * This is the shape that catches the four mistakes a person actually makes: the
 * missing `@`, the missing domain, the missing TLD, and the stray space.
 *
 * Neither `[^\s@]+` may hold an `@`, so `a@@b.com` fails on the second one; and the
 * dotted tail requires at least one character per label, so `a@b..com` fails too.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

/** The inline verdict of an `@email` field. The VALUE is never rewritten: the row
 *  renders the string the user typed, and a check is a diagnostic, not a filter. */
export function checkEmail(raw: string): FieldCheck {
    const v = (raw ?? '').trim();
    if (!v) return EMPTY_CHECK;
    if (!v.includes('@')) return invalidCheck('An address needs an @');
    if (!EMAIL_RE.test(v)) return invalidCheck('Not a valid email address');
    return VALID_CHECK;
}

// ─── URL ─────────────────────────────────────────────────────────────────────

/**
 * Schemes the open-link affordance may hand to the browser.
 *
 * An allowlist and not a denylist, because the button turns a value the MODEL holds
 * into a navigation: `javascript:` and `data:` in an href execute in the app's own
 * origin, and a model is a document that travels between people. A value carrying
 * one of those is reported as invalid and gets no button — it is still shown, still
 * editable, and still rendered by the row, since refusing to DISPLAY it would hide
 * the thing the user has to fix.
 */
const SAFE_URL_SCHEMES: readonly string[] = ['http:', 'https:', 'mailto:', 'ftp:', 'ftps:'];

/** `scheme:` at the head of the string, by the RFC 3986 production. */
const HAS_SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

export interface UrlCheck extends FieldCheck {
    /**
     * The absolute URL the open-link affordance may use, present only when the
     * status is `valid` AND the scheme is one of `SAFE_URL_SCHEMES`. Absent means
     * "no button", never "use the raw value instead".
     */
    readonly href?: string;
    /** The value had no scheme and `https://` was assumed to build `href`. The
     *  stored value keeps the user's own text; only the link is completed. */
    readonly schemeAdded?: boolean;
}

/**
 * The inline verdict of an `@url` field, with and without a scheme.
 *
 * `example.com` is a URL a person means: the check accepts it and completes the
 * href with `https://`, WITHOUT rewriting the stored value. A bare word with no dot
 * (`draft`, `todo`) is not — it is far more likely to be prose in a mistyped field
 * than a hostname, and the read side renders it as text either way.
 */
export function checkUrl(raw: string): UrlCheck {
    const v = (raw ?? '').trim();
    if (!v) return EMPTY_CHECK;
    if (/\s/.test(v)) return invalidCheck('A URL cannot contain spaces');

    const explicit = HAS_SCHEME_RE.test(v);
    let parsed: URL;
    try {
        parsed = new URL(explicit ? v : `https://${v}`);
    } catch {
        return invalidCheck('Not a valid URL');
    }

    if (explicit && !SAFE_URL_SCHEMES.includes(parsed.protocol)) {
        return invalidCheck(`The ${parsed.protocol.replace(':', '')} scheme cannot be opened from here`);
    }
    // A completed host must look like a host: `https://draft` parses, and offering
    // to open it would send the reader to a name that does not resolve.
    if (!explicit && !parsed.hostname.includes('.')) {
        return invalidCheck('Not a valid URL');
    }
    return { status: 'valid', href: parsed.href, schemeAdded: !explicit || undefined };
}

// ─── Duration ────────────────────────────────────────────────────────────────

/** The two units the width map declares for `duration`. */
export type DurationUnit = 'ms' | 's';

export interface Duration {
    /** The number as typed, in `unit`. */
    readonly amount: number;
    readonly unit: DurationUnit;
    /** The same quantity in milliseconds, so two durations compare. */
    readonly ms: number;
}

const DURATION_RE = /^([+-]?(?:\d+\.?\d*|\.\d+))\s*(ms|s)?$/i;

/**
 * `250ms`, `2s`, `1.5 s`, and a bare `250` read in the unit the metamodel declared.
 *
 * The unit is a PARAMETER and never an inference from the value or the attribute
 * name, which is the same rule the read side's `numberUnit` obeys — «naming an
 * attribute `durationSeconds` prints no unit». A bare number with no declared unit
 * has no dimension and returns null rather than defaulting to one.
 *
 * Anything else is null: a form does not block editing, but it does not write a
 * NaN into the model either (the rule `NumberWidget.commit` already applies).
 */
export function parseDuration(raw: string, declared?: DurationUnit): Duration | null {
    const m = DURATION_RE.exec((raw ?? '').trim());
    if (!m) return null;
    const amount = Number(m[1]);
    if (!Number.isFinite(amount)) return null;
    const unit = (m[2]?.toLowerCase() as DurationUnit | undefined) ?? declared;
    if (!unit) return null;
    return { amount, unit, ms: unit === 's' ? amount * 1000 : amount };
}

/** `250ms`, `2s` — the written form, for a tooltip or a value with no declared unit. */
export function formatDuration(d: Duration): string {
    return `${d.amount}${d.unit}`;
}

/**
 * The number a `numberUnit` row prints, given the unit the metamodel declared.
 *
 * This is the twin's whole point: the row shows `250` and a dimmed `ms` that comes
 * from `jjodel/unit`, so what the slot holds is the NUMBER. Typing `2s` into a
 * field declared in `ms` therefore stores `2000`, not `2s` — the field converts,
 * the model stays in one unit, and the row keeps printing the declared one.
 *
 * Null when the text does not parse, which the widget reads as "snap back".
 */
export function durationValueIn(raw: string, declared: DurationUnit): string | null {
    const d = parseDuration(raw, declared);
    if (!d) return null;
    const inDeclared = declared === 's' ? d.ms / 1000 : d.ms;
    // Trailing zeros of a float division ("2.5" and not "2.5000000000000004") —
    // 12 significant digits is past any duration a model holds and short of the
    // place where binary floating point starts printing its own noise.
    return String(Number(inDeclared.toPrecision(12)));
}

// ─── Colour ──────────────────────────────────────────────────────────────────

const HEX_BODY_RE = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const HEX_0X_RE = /^0x([0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * The canonical `#rrggbb` (or `#rrggbbaa`) of a hex colour, or null.
 *
 * Accepts what a person types — with or without the `#`, in either case, in the 3
 * and 4 digit short forms, and in the `0xRRGGBB` form the read side also reads —
 * and emits the ONE form `toCssColor` paints. Short forms are expanded rather than
 * passed through so that two spellings of one colour compare equal in the model.
 *
 * Null is not "invalid colour": `Green` and `rgb(0,0,0)` are colours this function
 * says nothing about, and the widget hands those to the read side's `toCssColor`
 * untouched. See the module header.
 */
export function normalizeHex(raw: string): string | null {
    const v = (raw ?? '').trim();
    if (!v) return null;

    const zeroX = HEX_0X_RE.exec(v);
    if (zeroX) return `#${zeroX[1].toLowerCase()}`;

    const m = HEX_BODY_RE.exec(v);
    if (!m) return null;
    const body = m[1].toLowerCase();
    // 3 and 4 digits double each nibble: `#0af` is `#00aaff`, `#0af8` is `#00aaff88`.
    if (body.length === 3 || body.length === 4) {
        return `#${body.split('').map(c => c + c).join('')}`;
    }
    return `#${body}`;
}

/** True when the text is a hex colour in any accepted spelling — the question the
 *  colour field asks before deciding whether to canonicalise what was typed. */
export function isHexColor(raw: string): boolean {
    return normalizeHex(raw) !== null;
}

// ─── Date and datetime ───────────────────────────────────────────────────────

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/;

/** Calendar fields that could denote a day. Not a calendar: February the 30th
 *  passes, and the native control never produces it. What this rejects is the
 *  hand-edited `2026-13-45` that would make the row print a month that is not one. */
function plausibleDate(y: number, mo: number, d: number): boolean {
    return y >= 1 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31;
}

/**
 * `YYYY-MM-DD`, the exact shape `absoluteDate` reads back, or null.
 *
 * Parsed from the string's OWN calendar fields, never through `new Date()`. The
 * read side spells out why, and the reason is the same on the way in: a plain ISO
 * date parses as UTC midnight, and formatting it back west of Greenwich prints the
 * day before. «A model is a document, and a document that changes date when opened
 * in another office is a bug, not a rounding.»
 */
export function normalizeIsoDate(raw: string): string | null {
    const v = (raw ?? '').trim();
    if (!v) return null;
    const m = ISO_DATE_RE.exec(v) ?? ISO_DATETIME_RE.exec(v);
    if (!m) return null;
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (!plausibleDate(y, mo, d)) return null;
    return `${m[1]}-${m[2]}-${m[3]}`;
}

/**
 * `YYYY-MM-DDTHH:mm`, or null.
 *
 * Seconds are dropped, not kept: the field that produces this is a
 * `datetime-local` without a step, so it never offers them, and carrying a `:00`
 * the user never typed would make the value differ from what the control shows.
 * A value that arrives WITH seconds keeps its date and minute and loses the rest —
 * the read side reads the first ten characters either way.
 */
export function normalizeIsoDateTime(raw: string): string | null {
    const v = (raw ?? '').trim();
    if (!v) return null;
    const m = ISO_DATETIME_RE.exec(v);
    if (!m) {
        // A bare date is a legal datetime with the time at midnight, which is what
        // the control shows when it is handed one.
        const date = normalizeIsoDate(v);
        return date ? `${date}T00:00` : null;
    }
    const [y, mo, d, h, mi] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5])];
    if (!plausibleDate(y, mo, d)) return null;
    if (h > 23 || mi > 59) return null;
    return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
}

// ─── The state of a control ──────────────────────────────────────────────────

export interface ControlFlags {
    /** Derived, non-changeable, or a form opened read-only. */
    readOnly?: boolean;
    /** A diagnostic of severity `error` is on this field. */
    invalid?: boolean;
}

export interface ControlDecision {
    /**
     * The user can operate the control. FALSE for read-only, and it is the
     * acceptance criterion of the slice in one field: «readOnly: the widget renders
     * the disabled variant, never an active input».
     */
    readonly interactive: boolean;
    /** BEM modifier suffixes for the widget's own block class, in a stable order so
     *  two renders of the same state produce the same string. */
    readonly modifiers: readonly string[];
}

/**
 * Read-only and invalid are ORTHOGONAL, not ranked.
 *
 * A derived slot can hold a value that does not conform, and the form already draws
 * that pair: `irFormStyle.scss` gives `.ir-field--error .ir-field__readonly` the red
 * border. So both modifiers can be present at once, and neither suppresses the
 * other; what read-only alone decides is `interactive`.
 */
export function controlDecision(flags: ControlFlags): ControlDecision {
    const modifiers: string[] = [];
    if (flags.readOnly) modifiers.push('readonly');
    if (flags.invalid) modifiers.push('invalid');
    return { interactive: !flags.readOnly, modifiers };
}

/** `block` plus one `block--modifier` per modifier, plus anything the caller adds.
 *  The whole className of a widget's root, built in one place so the six widgets
 *  cannot spell the same state two ways. */
export function controlClass(block: string, decision: ControlDecision, extra?: string): string {
    const parts = [block, ...decision.modifiers.map(m => `${block}--${m}`)];
    if (extra) parts.push(extra);
    return parts.join(' ');
}
