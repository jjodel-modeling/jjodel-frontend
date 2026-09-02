import React from 'react';
import styles from './SegmentedControl.module.css';

export interface SegmentedControlOption<T extends string = string> {
  /**
   * Value committed to onChange when this segment is chosen.
   */
  value: T;

  /**
   * Visible label. For a segment that opens a secondary control instead of
   * fully resolving the choice (e.g. "Custom…"), end the label with an
   * ellipsis — that is the project's convention for "this opens more UI",
   * not a decorative choice (see claude/2026-08-05_design_property_card_sintassi_astratta.md, D1).
   */
  label: string;

  /**
   * Optional Bootstrap Icons suffix (e.g. 'diagram-2' for 'bi-diagram-2').
   * Rendered only on the selected segment, in cyan-500 — an unselected
   * segment never shows the glyph.
   */
  icon?: string;

  /**
   * Disables this segment alone, leaving the rest of the group live. Click and
   * keyboard navigation both skip it. For a choice that is legal in the schema but
   * not on THIS subject (the IR form authoring disables Inline on a multivalued
   * feature): dropping the segment instead would make the control show two options
   * here and three there, and the reader would have to guess why.
   */
  disabled?: boolean;

  /**
   * Native tooltip of this segment. The place to say WHY a segment is disabled,
   * next to the segment rather than in a note under the row.
   */
  title?: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;

  /**
   * Accessible name for the group (role="radiogroup"). Required — this
   * control has no visible group label of its own.
   */
  ariaLabel: string;

  disabled?: boolean;
  id?: string;
}

/**
 * Segmented control — the single pattern for an exclusive choice among a
 * few values (project decision D1, 2026-08-05: "segmented in rilievo").
 * Track background, radius-6 selected chip with shadow, cyan glyph only on
 * the selected segment, slate keyboard-focus ring distinct from the cyan
 * used for selection. Wraps onto a second row instead of squeezing when the
 * host panel is narrow — width is fit-content, never 100%, so the track
 * never splits into two visually separate pill groups while wrapping.
 *
 * Not wired to any model field yet. Consumers decide what values, in what
 * order, and whether a trailing "Custom…" segment reveals more UI below —
 * that mapping is a per-field decision, not part of this primitive.
 */
export function SegmentedControl<T extends string = string>(props: SegmentedControlProps<T>) {
  const { options, value, onChange, ariaLabel, disabled = false, id } = props;

  const selectedIndex = Math.max(0, options.findIndex(o => o.value === value));

  const select = (index: number) => {
    const opt = options[index];
    if (!opt || disabled || opt.disabled) return;
    onChange(opt.value);
  };

  /**
   * Next selectable segment in `step` direction, wrapping. Returns the starting index
   * when every other segment is disabled, so an all-disabled group cannot spin here.
   */
  const nextEnabled = (from: number, step: number): number => {
    const n = options.length;
    let i = from;
    for (let k = 0; k < n; k++) {
      i = (i + step + n) % n;
      if (!options[i]?.disabled) return i;
    }
    return from;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        select(nextEnabled(index, 1));
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        select(nextEnabled(index, -1));
        break;
      case 'Home':
        e.preventDefault();
        select(nextEnabled(options.length - 1, 1));
        break;
      case 'End':
        e.preventDefault();
        select(nextEnabled(0, -1));
        break;
    }
  };

  return (
    <div
      id={id}
      className={`${styles.track} ${disabled ? styles.trackDisabled : ''}`}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((opt, index) => {
        const selected = index === selectedIndex;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled || opt.disabled}
            title={opt.title}
            tabIndex={selected ? 0 : -1}
            className={`${styles.segment} ${selected ? styles.segmentSelected : ''}`}
            onClick={() => select(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {opt.icon && selected && (
              <i className={`bi bi-${opt.icon} ${styles.segmentIcon}`} aria-hidden="true" />
            )}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
