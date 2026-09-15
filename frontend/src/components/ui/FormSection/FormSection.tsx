import React from 'react';
import styles from './FormSection.module.css';

export interface FormSectionProps {
  /**
   * Section title (will be uppercase)
   */
  title: string;

  /**
   * Show divider below title
   * @default true
   */
  divider?: boolean;

  /**
   * Section content
   */
  children: React.ReactNode;
}

/**
 * Form section with uppercase title and optional divider
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  divider = true,
  children,
}) => {
  return (
    <section className={styles.section}>
      <h3 className={styles.title}>{title}</h3>
      {divider && <div className={styles.divider} />}
      <div className={styles.content}>{children}</div>
    </section>
  );
};

export default FormSection;
