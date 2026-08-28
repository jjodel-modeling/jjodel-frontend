/**
 * RowValue — the Row view library, drawn once and used in both positions.
 *
 * Design handoff: `Instance Node Proposal.dc.html`, Turno 5 (`5a` the library,
 * `5b` collections and broken references), and README.md, "The three-level
 * style model", level 3:
 *
 *   «a value must render identically whether it appears as a row inside a
 *    compartment or as a standalone Row-view node on the canvas. One renderer,
 *    two sizes.»
 *
 * So this file is the whole painting side of the library, and
 * `valueRenderer.ts` is the whole deciding side. A caller passes the decision
 * and this renders it; no caller re-derives a renderer, and no renderer exists
 * in two places. That is the same split as `singletonShape.ts` /
 * `SingletonPill.tsx`, of which this is the generalisation — the singleton pill
 * was the library's first member and stays its `node` variant.
 *
 * ── Why `variant: 'node'` covers three renderers and not nine ───────────────
 *
 * `swatch`, `enumChip` and `refPill` are the only members whose value can be an
 * OBJECT in its own right: a colour, an enum literal and a referenced instance
 * can each be a thing on the canvas with its own identity. The other six cannot.
 * A boolean is not an instance, a date is not an instance, a progress bar is
 * certainly not an instance — they are values of a slot, and a slot is where
 * they live.
 *
 * This is a deliberate boundary, not an unfinished one. If a future notation
 * genuinely needs a date as a canvas node, it arrives as a NEW library member
 * with its own semantics, not by widening these six into a shape they have no
 * meaning in. Asking for `variant="node"` on one of the six is therefore a
 * caller bug; it renders the row form rather than throwing, because a canvas
 * that loses a node is worse than one that draws a small one.
 *
 * ── No renderer introduces colour that isn't information ────────────────────
 *
 * Colour appears in exactly three places here: the swatch, where the colour IS
 * the datum; the cyan reference pill, where it marks a navigable object; and
 * the broken-reference icon, where it flags a state. Everything else is slate.
 */

import type { RendererDecision } from './valueRenderer';
import { relativeAge } from './valueRenderer';
import SingletonPill from './SingletonPill';

/**
 * Chips rendered before the `+k` overflow affordance.
 *
 * A FIXED COUNT, deliberately, and not a fit against the available width. An
 * elastic threshold reflows the node on zoom and on any sibling resize, so the
 * same model would read differently at two zoom levels — unacceptable on a
 * canvas where position carries meaning. The `[k]` suffix on the label keeps
 * showing the true total regardless of how many chips are drawn.
 */
export const MAX_CHIPS = 4;

export interface RowValueTarget {
    id: string;
    name: string;
    /** The pointer no longer resolves to an object. */
    broken?: boolean;
}

export interface RowValueProps {
    /** The renderer, already decided by `detectValueRenderer`. */
    decision: RendererDecision;
    /** Every value the slot holds. Single-valued renderers read `[0]`. */
    values: string[];
    /** `node` on the canvas, `row` inside a compartment. */
    variant: 'node' | 'row';
    /** Reference targets, for `refPill` and `brokenRef`. */
    targets?: RowValueTarget[];
    /**
     * Targets that draw as a singleton pill on this canvas: id → the superclass
     * half of the label. Membership IS the answer to "is this target a pill".
     */
    pillTargets?: Map<string, string | null>;
    /** The target is also drawn as an edge on this canvas. */
    hasEdge?: boolean;
    onTargetClick?: (id: string) => void;
    /** Collection expansion. Owned by the caller: it is per-node UI state. */
    expanded?: boolean;
    onExpand?: () => void;
    /**
     * `now`, for the relative half of a date. A parameter rather than a
     * `Date.now()` call so the same inputs always paint the same pixels.
     */
    now?: number;
    /** Extra label for the `node` variant, when the value is an object. */
    nodeSuperclassName?: string | null;
    nodeInstanceName?: string;
    selected?: boolean;
}

// ─── The nine, one function each ─────────────────────────────────────────────

/**
 * The swatch square. `inset` rather than a border so the 10px box keeps its
 * 10px: a border would grow it to 12 and misalign the row against its
 * neighbours. The hairline is what keeps `#ffffff` and `Yellow` visible against
 * a white node — without it a pale swatch is an invisible one, and the row
 * would read as if the property held nothing.
 */
function Swatch({ color, size }: { color: string; size: 'row' | 'node' }) {
    return (
        <span
            className={`mm-object__swatch mm-object__swatch--${size}`}
            style={{ ['--inode-swatch' as string]: color } as React.CSSProperties}
        />
    );
}

/**
 * `true` / `false` as a dot plus the word.
 *
 * Filled for true, hollow for false — legible in greyscale, and legible to a
 * reader who cannot distinguish the two hues at all. Deliberately NOT a
 * checkbox: a checkbox is an affordance, and this row does not accept a click
 * to toggle it. Drawing one would promise an interaction that is not there.
 */
function BooleanValue({ value }: { value: boolean }) {
    return (
        <span className={`mm-object__bool mm-object__bool--${value ? 'true' : 'false'}`}>
            <span className="mm-object__bool-dot" />
            {value ? 'true' : 'false'}
        </span>
    );
}

/**
 * A number and, only if the metamodel declared one, its unit.
 *
 * The unit comes from `jjodel/unit=…` and from nowhere else. Naming an
 * attribute `durationSeconds`, `widthPx` or `sizeInMeters` prints no unit — the
 * name of a property is not a statement about its dimension, and a renderer
 * that guessed one would be wrong on `pxCount` and unarguable about it.
 */
function NumberUnit({ text, unit }: { text: string; unit?: string }) {
    return (
        <span className="mm-object__number">
            {text}
            {unit ? <span className="mm-object__unit">{unit}</span> : null}
        </span>
    );
}

/**
 * The absolute date, always, and the age after it.
 *
 * «Never relative alone: a model is a document, not a feed.» A feed's reader
 * wants to know how fresh something is; a model's reader wants to know WHEN,
 * because that date is a fact about the artefact and will still be quoted in a
 * year. So the ISO date is the value and the age is an annotation on it.
 */
function DateValue({ iso, raw, now }: { iso: string; raw: string; now: number }) {
    const age = relativeAge(raw, now);
    return (
        <span className="mm-object__date" title={raw}>
            <span className="mm-object__date-abs">{iso}</span>
            {age ? <span className="mm-object__date-rel">{age}</span> : null}
        </span>
    );
}

/**
 * A bar, and the number after it — never the bar alone.
 *
 * The bar answers "where in the range", the number answers "what is the value",
 * and a reader auditing a model needs the second one. `progress` only ever
 * renders when BOTH bounds are declared; with one missing, `detectValueRenderer`
 * has already returned a `numberUnit` decision instead, so there is no
 * unbounded bar to draw here.
 */
function Progress({ ratio, text, unit }: { ratio: number; text: string; unit?: string }) {
    return (
        <span className="mm-object__progress">
            <span className="mm-object__progress-track">
                <span className="mm-object__progress-fill" style={{ width: `${Math.round(ratio * 100)}%` }} />
            </span>
            <span className="mm-object__progress-value">
                {text}
                {unit ? <span className="mm-object__unit">{unit}</span> : null}
            </span>
        </span>
    );
}

/**
 * A broken reference: the icon carries the severity, the strikethrough carries
 * the meaning.
 *
 * NOT a filled red pill. One delete can break ten references at once, and ten
 * filled red pills read as a system failure rather than as ten instances of one
 * recoverable condition — the surrounding model has to stay readable while the
 * user fixes them. And deliberately NOT the cyan reference treatment: a broken
 * reference is not navigable, so it must not wear the affordance that says it is.
 */
function BrokenRef({ name }: { name: string }) {
    return (
        <span className="mm-object__broken" title={`The target "${name}" no longer exists`}>
            <i className="bi bi-exclamation-circle-fill mm-object__broken-icon" />
            <span className="mm-object__broken-name">{name}</span>
        </span>
    );
}

// ─── The dispatcher ──────────────────────────────────────────────────────────

function RowValue(props: RowValueProps) {
    const {
        decision, values, variant, targets = [], pillTargets, hasEdge = false,
        onTargetClick, expanded = false, onExpand, now = Date.now(),
        nodeSuperclassName = null, nodeInstanceName, selected = false,
    } = props;

    const text = values[0] ?? '';
    const isNode = variant === 'node';

    switch (decision.kind) {
        // ── Empty. The row stays and the dash IS the information: a property
        // with no value is a fact about the model, and hiding it would leave a
        // reader unable to tell "unset" from "not declared". ──
        case 'dash':
            return <span className="mm-object__dash">—</span>;

        case 'brokenRef':
            return (
                <>
                    {targets.map((t, i) => <BrokenRef key={`${t.id}_${i}`} name={t.name} />)}
                    {targets.length === 0 ? <BrokenRef name={text} /> : null}
                </>
            );

        case 'swatch': {
            const color = decision.swatch ?? text;
            // The canvas form: the singleton pill with the square prepended.
            // The swatch travels INSIDE the pill rather than beside it, because
            // the colour annotates the value and the pill is the value.
            if (isNode) {
                return (
                    <SingletonPill
                        parts={{ superclassName: nodeSuperclassName, instanceName: nodeInstanceName ?? text }}
                        variant="node"
                        selected={selected}
                        leading={<Swatch color={color} size="node" />}
                    />
                );
            }
            // The swatch and the text always travel together: the square
            // annotates the value, it never replaces it. A reader who cannot
            // see the hue still reads `Green`.
            return (
                <>
                    <Swatch color={color} size="row" />
                    <span className="mm-object__scalar" title={decision.reason}>{text}</span>
                </>
            );
        }

        case 'enumChip': {
            if (isNode) {
                return (
                    <SingletonPill
                        parts={{ superclassName: nodeSuperclassName, instanceName: nodeInstanceName ?? text }}
                        variant="node"
                        selected={selected}
                    />
                );
            }
            return <span className="mm-object__chip" title={decision.reason}>{text}</span>;
        }

        case 'refPill':
            return (
                <>
                    {targets.map((t, i) => {
                        if (t.broken) return <BrokenRef key={`${t.id}_${i}`} name={t.name} />;
                        // A target that draws as a pill on the canvas draws as
                        // the SAME pill here, one size down — the level-3 parity
                        // requirement, and the component is shared precisely so
                        // the two cannot drift.
                        //
                        // A target that draws as a RECTANGLE keeps the cyan
                        // reference pill: a rectangle cannot be inlined in a row,
                        // and the cyan one is the navigation affordance, not a
                        // shape claim about the target.
                        if (pillTargets?.has(t.id)) {
                            return (
                                <SingletonPill
                                    key={`${t.id}_${i}`}
                                    parts={{ superclassName: pillTargets.get(t.id) ?? null, instanceName: t.name }}
                                    variant={isNode ? 'node' : 'row'}
                                    title={`Go to ${t.name}`}
                                    onClick={(e) => { e.stopPropagation(); onTargetClick?.(t.id); }}
                                />
                            );
                        }
                        return (
                            <span
                                key={`${t.id}_${i}`}
                                className="mm-object__ref-pill"
                                title={`Go to ${t.name}`}
                                onClick={(e) => { e.stopPropagation(); onTargetClick?.(t.id); }}
                            >
                                <i className="bi bi-link-45deg" />
                                {t.name}
                            </span>
                        );
                    })}
                    {/* The marker says the target is ALSO drawn as an edge. The
                        row is never removed for it: the edge shows the topology,
                        the row shows that this property holds that value. */}
                    {hasEdge ? <i className="bi bi-arrow-up-right mm-object__edge-marker" /> : null}
                </>
            );

        case 'boolean':
            return <BooleanValue value={!!decision.boolValue} />;

        case 'numberUnit':
            return <NumberUnit text={text} unit={decision.unit} />;

        case 'date':
            return <DateValue iso={decision.dateIso ?? text} raw={text} now={now} />;

        case 'progress':
            return <Progress ratio={decision.ratio ?? 0} text={text} unit={decision.unit} />;

        case 'code':
            return <span className="mm-object__code" title={decision.reason}>{text}</span>;

        // ── One chip per value, then `+k`. ──
        case 'collection': {
            const shown = expanded ? values : values.slice(0, MAX_CHIPS);
            const hidden = values.length - shown.length;
            return (
                <>
                    {shown.map((v, i) => <span key={i} className="mm-object__chip">{v}</span>)}
                    {hidden > 0 && (
                        <span
                            className="mm-object__chip mm-object__chip--more"
                            title={`Show the other ${hidden}`}
                            onClick={(e) => { e.stopPropagation(); onExpand?.(); }}
                        >
                            +{hidden}
                        </span>
                    )}
                </>
            );
        }

        // ── The library's floor: one line, ellipsis, whole value in the
        // tooltip. Every slot has a rendering, so there is no case in which a
        // value the model holds fails to appear. ──
        case 'truncatedText':
        default:
            return <span className="mm-object__scalar" title={text || decision.reason}>{text}</span>;
    }
}

export default RowValue;
