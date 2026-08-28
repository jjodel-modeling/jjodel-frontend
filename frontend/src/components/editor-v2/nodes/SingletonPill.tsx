/**
 * SingletonPill — a singleton instance, drawn once and used in both positions.
 *
 * Design handoff: docs/design/design_handoff_instance_node/README.md, "The
 * three-level style model", level 3:
 *
 *   «a value must render identically whether it appears as a row inside a
 *    compartment or as a standalone Row-view node on the canvas. In the current
 *    default it does not — `Green` is a bordered node on the canvas and flat
 *    text inside `Shape_0`, two unrelated representations of one piece of
 *    information. One renderer, two sizes.»
 *
 * So this component is the whole rendering: shape, surface, border, label. The
 * canvas node mounts it inside a wrapper stripped of its own chrome
 * (`.mm-object--pill`, see instanceNode.scss) rather than painting a second
 * pill around it — if the wrapper drew anything, there would be two sources for
 * one appearance again.
 *
 * Exactly two things may differ between the positions, and both are here rather
 * than in the caller:
 *
 *   - SCALE — 13px / 7px 16px on canvas, 12px / 2px 10px inline.
 *   - UNDERLINE — the canvas node is an instance specification, so the UML
 *     object-diagram underline applies; the inline row is a value sitting in a
 *     slot, and does not take it.
 *
 * The underline follows the INSTANCE NAME, never the whole run: `Color::Red`
 * has to read "a Red, which is a Color", not "an instance named Color::Red".
 * On the pill the name is the right-hand half, which is the only thing that
 * changes from the rectangle header — the rule itself is the same one.
 */

import type { SingletonLabelParts } from './singletonShape';

export interface SingletonPillProps {
    /** Resolved label halves. Built by `singletonLabelParts`, never inline. */
    parts: SingletonLabelParts;
    /** `node` on the canvas, `row` inside a compartment. */
    variant: 'node' | 'row';
    /** Canvas selection. Ignored in the `row` variant, which cannot be selected. */
    selected?: boolean;
    title?: string;
    onClick?: (e: React.MouseEvent) => void;
}

/**
 * The label, in two spans plus a separator, so the underline can span the name
 * alone and the two halves can carry different weights and colours.
 */
function SingletonPill({ parts, variant, selected = false, title, onClick }: SingletonPillProps) {
    const { superclassName, instanceName } = parts;

    const className = [
        'mm-object__pill',
        `mm-object__pill--${variant}`,
        selected && variant === 'node' ? 'mm-object__pill--selected' : '',
    ].filter(Boolean).join(' ');

    return (
        <span
            className={className}
            title={title ?? (superclassName ? `${instanceName} : ${superclassName}` : instanceName)}
            onClick={onClick}
        >
            {/* No abstract direct superclass means the name IS the complete
                label: for a singleton the type carries no information the name
                does not already carry, so nothing is printed in its place. */}
            {superclassName && (
                <>
                    <span className="mm-object__pill-super">{superclassName}</span>
                    {/* `::`, not ` : `. The design prototype draws a single
                        spaced colon; the double colon was chosen over it
                        (Alfonso, 2026-08-28) because it is the qualified-name
                        operator, and a qualified name is exactly what this
                        label is — `Color::Red` names the literal inside the
                        closed set, where a spaced colon would read as the
                        instance-of relation the rectangle header already
                        carries. No surrounding spaces: they are part of the
                        other reading, not this one. */}
                    <span className="mm-object__pill-sep">::</span>
                </>
            )}
            <span className="mm-object__pill-name">{instanceName}</span>
        </span>
    );
}

export default SingletonPill;
