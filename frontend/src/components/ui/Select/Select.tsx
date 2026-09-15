import React from 'react';
import styles from './Select.module.css';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * A titled set of options, rendered as an `<optgroup>`.
 *
 * Widening only: `options` still accepts the flat `SelectOption[]` every existing
 * caller passes, and the flat branch renders exactly as before. Groups are for the
 * pickers whose entries come from more than one namespace and whose labels can
 * collide across them (the metaclass pickers of the IR authoring panels: two
 * metamodels may both declare `Person`).
 */
export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

/** What `Select` accepts: a flat list, or a list of groups. Never mixed. */
export type SelectOptions = SelectOption[] | SelectOptionGroup[];

const isOptionGroup = (o: SelectOption | SelectOptionGroup): o is SelectOptionGroup =>
  Array.isArray((o as SelectOptionGroup).options);

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * Size of select
   * @default 'md'
   */
  size?: SelectSize;

  /**
   * Options to display: a flat list, or a list of `<optgroup>`s
   */
  options: SelectOptions;

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
          {(options as Array<SelectOption | SelectOptionGroup>).map((option) =>
            isOptionGroup(option) ? (
              <optgroup key={option.label} label={option.label}>
                {option.options.map((o) => (
                  <option key={o.value} value={o.value} disabled={o.disabled}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            )
          )}
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
