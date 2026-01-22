/**
 * CollapsibleSection Component
 *
 * A collapsible/expandable section for progressive disclosure.
 * Used in Advanced Mode to organize advanced features.
 */

import React, { ReactNode } from 'react';
import './mode-system.scss';

export type SectionBadge = 'Intermediate' | 'Advanced' | 'Expert';

interface CollapsibleSectionProps {
    /** Section title */
    title: string;
    /** Section content */
    children: ReactNode;
    /** Whether the section is expanded */
    expanded: boolean;
    /** Toggle callback */
    onToggle: () => void;
    /** Optional badge to indicate complexity level */
    badge?: SectionBadge;
    /** Optional icon (Bootstrap Icons class name without 'bi-' prefix) */
    icon?: string;
    /** Short description shown when collapsed */
    description?: string;
    /** Additional class names */
    className?: string;
    /** Disable the section */
    disabled?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    children,
    expanded,
    onToggle,
    badge,
    icon,
    description,
    className = '',
    disabled = false
}) => {
    const handleToggle = () => {
        if (!disabled) {
            onToggle();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            onToggle();
        }
    };

    return (
        <div
            className={`collapsible-section ${expanded ? 'collapsible-section--expanded' : 'collapsible-section--collapsed'} ${disabled ? 'collapsible-section--disabled' : ''} ${className}`}
        >
            <button
                className="collapsible-section__header"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                aria-expanded={expanded}
                aria-disabled={disabled}
                disabled={disabled}
                type="button"
            >
                <div className="collapsible-section__header-left">
                    <i className={`bi ${expanded ? 'bi-chevron-down' : 'bi-chevron-right'} collapsible-section__chevron`} />
                    {icon && <i className={`bi bi-${icon} collapsible-section__icon`} />}
                    <span className="collapsible-section__title">{title}</span>
                    {badge && (
                        <span className={`collapsible-section__badge collapsible-section__badge--${badge.toLowerCase()}`}>
                            {badge}
                        </span>
                    )}
                </div>

                {description && !expanded && (
                    <span className="collapsible-section__description">{description}</span>
                )}
            </button>

            {expanded && (
                <div className="collapsible-section__content">
                    {children}
                </div>
            )}
        </div>
    );
};

export default CollapsibleSection;
