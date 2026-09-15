/**
 * ErrorText Component
 *
 * Displays error/validation messages below form inputs.
 * Includes warning icon and role="alert" for screen readers.
 *
 * @example
 * <ErrorText>Name is required</ErrorText>
 */

import React from 'react';
import styles from './ErrorText.module.css';

export interface ErrorTextProps {
  /**
   * Error message content
   */
  children: React.ReactNode;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * ID for aria-describedby linking
   */
  id?: string;
}

export const ErrorText: React.FC<ErrorTextProps> = ({
  children,
  className = '',
  id,
}) => {
  return (
    <p
      id={id}
      role="alert"
      className={`${styles.errorText} ${className}`.trim()}
    >
      <i
        className="bi bi-exclamation-triangle"
        aria-hidden="true"
        style={{ fontSize: 'var(--icon-size-sm)' }}
      />
      <span>{children}</span>
    </p>
  );
};
