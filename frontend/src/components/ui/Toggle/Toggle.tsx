import React from 'react';
import styles from './Toggle.module.css';

export type ToggleSize = 'xs' | 'sm' | 'md';

export interface ToggleProps {
  /**
   * Controlled checked state
   */
  checked?: boolean;

  /**
   * Default checked state (uncontrolled)
   */
  defaultChecked?: boolean;

  /**
   * Change handler
   */
  onChange?: (checked: boolean) => void;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Size of toggle
   * @default 'md'
   */
  size?: ToggleSize;

  /**
   * Label text
   */
  label?: string;

  /**
   * Description text (shown below label)
   */
  description?: string;

  /**
   * ID for accessibility
   */
  id?: string;
}

/**
 * Toggle/Switch component
 */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  id,
}) => {
  const [internalChecked, setInternalChecked] = React.useState(
    defaultChecked ?? false
  );

  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  const handleChange = () => {
    if (disabled) return;

    const newChecked = !isChecked;

    if (!isControlled) {
      setInternalChecked(newChecked);
    }

    onChange?.(newChecked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleChange();
    }
  };

  const sizeClass = {
    xs: styles.toggleXs,
    sm: styles.toggleSm,
    md: styles.toggleMd,
  }[size];

  const toggleClasses = [
    styles.toggle,
    sizeClass,
    isChecked && styles.toggleChecked,
    disabled && styles.toggleDisabled,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      {(label || description) && (
        <div className={styles.labelWrapper}>
          {label && (
            <label htmlFor={id} className={styles.label}>
              {label}
            </label>
          )}
          {description && (
            <span className={styles.description}>{description}</span>
          )}
        </div>
      )}

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        className={toggleClasses}
        onClick={handleChange}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.thumb} aria-hidden="true" />
      </button>
    </div>
  );
};

export default Toggle;
