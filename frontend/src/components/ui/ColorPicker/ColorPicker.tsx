import React from 'react';
import styles from './ColorPicker.module.css';

export interface ColorPickerProps {
  /** Current color as a hex string (e.g. "#334155"). */
  value: string;

  /** Called with the new hex when the swatch changes or a valid hex is typed. */
  onChange: (hex: string) => void;

  /** Label text displayed above the control. */
  label?: string;

  /** Disabled state. */
  disabled?: boolean;

  /** ID for accessibility. */
  id?: string;
}

/** Accepts #rgb or #rrggbb. */
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const FULL_HEX_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * ColorPicker component. Native color swatch + a synchronized hex text field
 * (so a hex value can be pasted). Presentational, token-based, no new deps.
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  id,
}) => {
  const rid = React.useId();
  const inputId = id || `colorpicker-${rid}`;
  const [text, setText] = React.useState(value);

  // Re-sync the text field when the controlled value changes externally.
  React.useEffect(() => {
    setText(value);
  }, [value]);

  const handleSwatch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setText(hex);
    onChange(hex);
  };

  const handleText = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setText(next);
    if (HEX_RE.test(next)) onChange(next);
  };

  // Native <input type="color"> only accepts #rrggbb.
  const swatchValue = FULL_HEX_RE.test(value) ? value : '#000000';

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.row}>
        <input
          id={inputId}
          type="color"
          className={styles.swatch}
          value={swatchValue}
          onChange={handleSwatch}
          disabled={disabled}
          aria-label={label || 'color'}
        />
        <input
          type="text"
          className={styles.hex}
          value={text}
          onChange={handleText}
          disabled={disabled}
          spellCheck={false}
          placeholder="#000000"
        />
      </div>
    </div>
  );
};

export default ColorPicker;
