import React from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant - ALL ARE OUTLINE STYLE
   * @default 'secondary'
   */
  variant?: ButtonVariant;

  /**
   * Size of button
   * @default 'md'
   */
  size?: ButtonSize;

  /**
   * Icon to display before label (Bootstrap Icon component)
   */
  icon?: React.ReactNode;

  /**
   * Icon to display after label
   */
  iconRight?: React.ReactNode;

  /**
   * Button content
   */
  children: React.ReactNode;

  /**
   * Full width of container
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Loading state with spinner
   * @default false
   */
  loading?: boolean;
}

/**
 * Outline-style button component
 * All variants use border + transparent background
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  children,
  fullWidth = false,
  loading = false,
  disabled = false,
  className,
  type = 'button',
  ...props
}) => {
  const variantClass = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    danger: styles.buttonDanger,
    ghost: styles.buttonGhost,
  }[variant];

  const sizeClass = {
    sm: styles.buttonSm,
    md: styles.buttonMd,
    lg: styles.buttonLg,
  }[size];

  const classes = [
    styles.button,
    variantClass,
    sizeClass,
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <span className={styles.spinner} aria-hidden="true">
          <svg className={styles.spinnerIcon} viewBox="0 0 16 16">
            <circle
              cx="8"
              cy="8"
              r="6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="28"
              strokeDashoffset="28"
            />
          </svg>
        </span>
      )}

      {!loading && icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}

      <span className={styles.label}>{children}</span>

      {!loading && iconRight && (
        <span className={styles.icon} aria-hidden="true">
          {iconRight}
        </span>
      )}
    </button>
  );
};

export default Button;
