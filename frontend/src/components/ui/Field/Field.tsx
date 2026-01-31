import React from 'react';
import { Label } from '../Label';
import { HelpText } from '../HelpText';
import { ErrorText } from '../ErrorText';
import styles from './Field.module.css';

export interface FieldProps {
  /**
   * Label text
   */
  label?: string;

  /**
   * For attribute for label
   */
  htmlFor?: string;

  /**
   * Show required indicator
   */
  required?: boolean;

  /**
   * Error message
   */
  error?: string;

  /**
   * Help text (shown when no error)
   */
  helpText?: string;

  /**
   * Form input element(s)
   */
  children: React.ReactNode;
}

/**
 * Field wrapper component combining label, input, help text, and error
 */
export const Field: React.FC<FieldProps> = ({
  label,
  htmlFor,
  required,
  error,
  helpText,
  children,
}) => {
  const helpTextId = htmlFor ? `${htmlFor}-help` : undefined;
  const errorTextId = htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className={styles.field}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}

      {children}

      {!error && helpText && (
        <HelpText id={helpTextId}>{helpText}</HelpText>
      )}

      {error && (
        <ErrorText id={errorTextId}>{error}</ErrorText>
      )}
    </div>
  );
};

export default Field;
