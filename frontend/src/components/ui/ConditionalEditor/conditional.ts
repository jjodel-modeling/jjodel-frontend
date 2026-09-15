/**
 * conditional — pure discriminator for Conditional<T> values (authoring phase
 * B2b-i). Exported to become the single source replacing the four local
 * `isConditional` copies (VertexAuthoringPanel, LabelEntryEditor, BadgeListEditor,
 * FieldCompartmentListEditor) when they are wired in B2b-ii; those copies are NOT
 * touched here.
 *
 * A Conditional<T> is either a flat T (scalar) or an object carrying `when`
 * (single rule) / `rules` (multi-rule). Only the object forms return true.
 */
import type { Predicate } from '../../editor-v2/viewpoint/ir/irTypes';

export function isConditionalValue(
    x: unknown,
): x is { when: Predicate; then: unknown; else?: unknown } | { rules: unknown[]; default?: unknown } {
    return x !== null && typeof x === 'object' && ('when' in (x as any) || 'rules' in (x as any));
}
