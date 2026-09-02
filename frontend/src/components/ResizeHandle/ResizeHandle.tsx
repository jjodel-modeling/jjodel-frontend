import React from 'react';
import './resize-handle.scss';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  isDragging: boolean;
  orientation?: 'horizontal' | 'vertical';
  onDoubleClick?: () => void;
  className?: string;
  /** Accessible name. Defaults to the generic one, which is right only for a lone splitter. */
  label?: string;
  /** Current size, in px, of the pane the handle governs. Feeds `aria-valuenow` and the drag readout. */
  value?: number;
  min?: number;
  max?: number;
  /** Keyboard step, in px. Ignored without `onResizeBy`. */
  step?: number;
  /**
   * Keyboard resize. Given, the arrows along the handle's axis move the split by
   * `step` px, signed: positive grows the pane before the handle. Omitted, the handle
   * stays focusable but inert to the keyboard.
   */
  onResizeBy?: (deltaPx: number) => void;
  /** Prefix of the drag readout, e.g. `h` renders `h 296`. The chip shows only while dragging. */
  readoutPrefix?: string;
  /** Hover hint, shown after ~600ms. Deliberately not a `title`: the native tooltip is what it replaces. */
  hint?: string;
}

const DEFAULT_KEYBOARD_STEP = 8;

/**
 * ResizeHandle - draggable divider between two panes.
 *
 * Design "grip pill" (2026-08-28): a grab strip wider than what it draws, carrying a
 * hairline and, at its centre, a pill that says the strip can be dragged. Hover widens
 * the pill, the drag turns the line cyan and puts the live size in a chip. The whole
 * visual is in `resize-handle.scss` and works in both orientations, the vertical one
 * being the same graphic rotated.
 *
 * The drag itself belongs to the caller: this renders the affordance and reports the
 * gesture. Keyboard resize and the readout are opt-in, via `onResizeBy` and `value`.
 */
export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onMouseDown,
  isDragging,
  orientation = 'horizontal',
  onDoubleClick,
  className = '',
  label = 'Resize panel',
  value,
  min,
  max,
  step = DEFAULT_KEYBOARD_STEP,
  onResizeBy,
  readoutPrefix,
  hint
}) => {
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onMouseDown(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onResizeBy) return;
    const grow = orientation === 'horizontal' ? 'ArrowDown' : 'ArrowRight';
    const shrink = orientation === 'horizontal' ? 'ArrowUp' : 'ArrowLeft';
    if (e.key !== grow && e.key !== shrink) return;
    e.preventDefault();
    onResizeBy(e.key === grow ? step : -step);
  };

  const showReadout = isDragging && typeof value === 'number';

  return (
    <div
      className={`resize-handle resize-handle--${orientation} ${isDragging ? 'dragging' : ''} ${className}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
      onKeyDown={handleKeyDown}
      role="separator"
      aria-orientation={orientation}
      aria-label={label}
      aria-valuenow={typeof value === 'number' ? Math.round(value) : undefined}
      aria-valuemin={typeof min === 'number' ? Math.round(min) : undefined}
      aria-valuemax={typeof max === 'number' ? Math.round(max) : undefined}
      tabIndex={0}
    >
      {hint && (
        <span className="resize-handle__hint" aria-hidden="true">{hint}</span>
      )}
      {showReadout && (
        <span className="resize-handle__readout" aria-hidden="true">
          {readoutPrefix ? `${readoutPrefix} ` : ''}{Math.round(value as number)}
        </span>
      )}
    </div>
  );
};

export default ResizeHandle;
