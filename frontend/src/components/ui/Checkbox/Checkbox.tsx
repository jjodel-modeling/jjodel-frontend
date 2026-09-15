import React from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  /** Controlled checked state */
  checked: boolean;

  /** Change handler */
  onChange: (checked: boolean) => void;

  /** Label text (rendered to the right of the box) */
  label?: string;

  /** Disabled state */
  disabled?: boolean;

  /** ID for accessibility (associates the label with the control) */
  id?: string;
}

/**
 * Checkbox component. Controlled, presentational, token-based.
 * Checked fill is slate (#334155); cyan is used only for the focus ring.
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
}) => {
  const handleToggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  const boxClasses = [
    styles.box,
    checked && styles.boxChecked,
    disabled && styles.boxDisabled,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        className={boxClasses}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        {checked && <i className="bi bi-check" aria-hidden="true" />}
      </button>

      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
