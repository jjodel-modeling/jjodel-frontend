import type { CSSProperties } from 'react';

/**
 * Read-only chip for a value a Basic surface preserves verbatim but cannot edit:
 * an unsupported source, an advanced predicate, a widget override that survives a
 * treatment change, a `basic` entry naming no feature.
 *
 * An inline style and not a CSS class, deliberately. The chip belongs to the authoring
 * panels, which are styled by their own stylesheets, and every authoring surface that
 * needs it would otherwise have to import a class it does not own. It was written four
 * times, identically, before it was extracted here (2026-08-28).
 *
 * Every value is a token: the chip is dashed and italic because it says "this is shown,
 * not offered", and that reading has to survive both themes.
 */
export const PRESERVED_CHIP: CSSProperties = {
    display: 'inline-block',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-tertiary)',
    fontStyle: 'italic',
    padding: '2px 6px',
    border: '1px dashed var(--color-border-primary)',
    borderRadius: 'var(--radius-sm)',
};
