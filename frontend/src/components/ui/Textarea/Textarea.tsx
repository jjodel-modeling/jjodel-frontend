import React, { useState, useEffect } from 'react';
import styles from './Textarea.module.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Error state
   */
  error?: boolean;

  /**
   * Show character counter
   * @default false
   */
  showCharCount?: boolean;

  /**
   * Full width of container
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Resize behavior
   * @default 'vertical'
   */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

/**
 * Multiline text input component
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      error = false,
      showCharCount = false,
      fullWidth = false,
      resize = 'vertical',
      maxLength,
      value,
      defaultValue,
      className,
      disabled,
      onChange,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
      if (showCharCount) {
        const currentValue = value ?? defaultValue ?? '';
        setCharCount(String(currentValue).length);
      }
    }, [value, defaultValue, showCharCount]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (showCharCount) {
        setCharCount(e.target.value.length);
      }
      onChange?.(e);
    };

    const wrapperClasses = [
      styles.wrapper,
      fullWidth && styles.fullWidth,
    ]
      .filter(Boolean)
      .join(' ');

    const textareaClasses = [
      styles.textarea,
      styles[`resize-${resize}`],
      error && styles.textareaError,
      disabled && styles.textareaDisabled,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        <textarea
          ref={ref}
          className={textareaClasses}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={error}
          onChange={handleChange}
          {...props}
        />

        {showCharCount && (
          <div className={styles.charCount}>
            {charCount}
            {maxLength && ` / ${maxLength}`}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
