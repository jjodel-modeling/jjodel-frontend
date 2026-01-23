/**
 * Input Component
 *
 * Text input with support for icons, validation states, and sizes.
 * Follows Jjodel form design system (40px height, 14px/16px padding).
 *
 * @example
 * <Input
 *   label="Name"
 *   type="text"
 *   placeholder="Enter your name"
 *   required
 *   error="Name is required"
 * />
 */

import React from 'react';
import { Label } from '../Label';
import { HelpText } from '../HelpText';
import { ErrorText } from '../ErrorText';
import styles from './Input.module.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Label text displayed above input
   */
  label?: string;

  /**
   * Input type
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel' | 'search';

  /**
   * Error message (shows ErrorText below input)
   */
  error?: string;

  /**
   * Help text (shows HelpText below input when no error)
   */
  helpText?: string;

  /**
   * Mark field as required (shows red asterisk)
   */
  required?: boolean;

  /**
   * Icon displayed on the left side of input
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon displayed on the right side of input
   */
  rightIcon?: React.ReactNode;

  /**
   * Input size
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Make input full width
   */
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      type = 'text',
      error,
      helpText,
      required = false,
      disabled = false,
      readOnly = false,
      leftIcon,
      rightIcon,
      size = 'md',
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${React.useId()}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;
    const hasError = Boolean(error);

    const inputClasses = [
      styles.input,
      styles[`input-${size}`],
      leftIcon && styles['input-with-left-icon'],
      rightIcon && styles['input-with-right-icon'],
      hasError && styles['input-error'],
      fullWidth && styles['input-full-width'],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={`${styles.inputWrapper} ${fullWidth ? styles['wrapper-full-width'] : ''}`.trim()}>
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}

        <div className={styles.inputContainer}>
          {leftIcon && <div className={styles.leftIconContainer}>{leftIcon}</div>}

          <input
            ref={ref}
            id={inputId}
            type={type}
            className={inputClasses}
            disabled={disabled}
            readOnly={readOnly}
            aria-required={required}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : helpText ? helpId : undefined}
            {...props}
          />

          {rightIcon && <div className={styles.rightIconContainer}>{rightIcon}</div>}
        </div>

        {!hasError && helpText && <HelpText id={helpId}>{helpText}</HelpText>}
        {hasError && <ErrorText id={errorId}>{error}</ErrorText>}
      </div>
    );
  }
);

Input.displayName = 'Input';
