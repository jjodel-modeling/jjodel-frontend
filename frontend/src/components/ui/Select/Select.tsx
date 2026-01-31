import React from 'react';
import styles from './Select.module.css';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * Size of select
   * @default 'md'
   */
  size?: SelectSize;

  /**
   * Options to display
   */
  options: SelectOption[];

  /**
   * Placeholder option
   * @default 'Select...'
   */
  placeholder?: string;

  /**
   * Error state
   */
  error?: boolean;

  /**
   * Full width of container
   * @default false
   */
  fullWidth?: boolean;
}

/**
 * Select dropdown component
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = 'md',
      options,
      placeholder = 'Select...',
      error = false,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClass = {
      sm: styles.selectSm,
      md: styles.selectMd,
      lg: styles.selectLg,
    }[size];

    const wrapperClasses = [
      styles.wrapper,
      fullWidth && styles.fullWidth,
    ]
      .filter(Boolean)
      .join(' ');

    const selectClasses = [
      styles.select,
      sizeClass,
      error && styles.selectError,
      disabled && styles.selectDisabled,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        <select
          ref={ref}
          className={selectClasses}
          disabled={disabled}
          aria-invalid={error}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        <span className={styles.icon} aria-hidden="true">
          <i className="bi bi-chevron-down" />
        </span>
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
