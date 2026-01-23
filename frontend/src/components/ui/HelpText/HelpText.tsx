/**
 * HelpText Component
 *
 * Displays help/hint text below form inputs.
 * Optional info icon for additional context.
 *
 * @example
 * <HelpText icon>
 *   Must be unique. Used as identifier in code generation.
 * </HelpText>
 */

import React from 'react';
import styles from './HelpText.module.css';

export interface HelpTextProps {
  /**
   * Help text content
   */
  children: React.ReactNode;

  /**
   * Show info icon before text
   */
  icon?: boolean;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * ID for aria-describedby linking
   */
  id?: string;
}

export const HelpText: React.FC<HelpTextProps> = ({
  children,
  icon = true,
  className = '',
  id,
}) => {
  return (
    <p
      id={id}
      className={`${styles.helpText} ${className}`.trim()}
    >
      {icon && (
        <i
          className="bi bi-info-circle"
          aria-hidden="true"
          style={{ fontSize: 'var(--icon-size-sm)' }}
        />
      )}
      <span>{children}</span>
    </p>
  );
};
