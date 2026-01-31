/**
 * Label Component
 *
 * Form label with support for required indicator (red asterisk).
 * Always use with form inputs for accessibility.
 *
 * @example
 * <Label htmlFor="email" required>Email Address</Label>
 * <input id="email" type="email" />
 */

import React from 'react';
import styles from './Label.module.css';

export interface LabelProps {
  /**
   * Associates label with input via id
   */
  htmlFor?: string;

  /**
   * Shows red asterisk (*) after label text
   */
  required?: boolean;

  /**
   * Label text content
   */
  children: React.ReactNode;

  /**
   * Additional CSS class names
   */
  className?: string;
}

export const Label: React.FC<LabelProps> = ({
  htmlFor,
  required = false,
  children,
  className = '',
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`${styles.label} ${className}`.trim()}
    >
      {children}
      {required && <span className={styles.required} aria-label="required">*</span>}
    </label>
  );
};
