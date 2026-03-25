/**
 * ElementBadge - Reusable badge component for element types
 * Used in tabs, tree views, and anywhere else we need to show element type indicators
 * Matches tree view style with colored backgrounds and single-letter labels
 */

import React from 'react';
import './element-badge.scss';
import { resolveEntityType, entityLetter } from '../../common/entityMeta';

interface ElementBadgeProps {
    type: 'metamodel' | 'model' | 'package' | 'class' | 'enum' | 'attribute' | 'reference' | 'operation' | 'viewpoint' | string;
    label?: string; // Optional override for letter (default: first letter of type)
    className?: string;
    filled?: boolean; // For viewpoint filled/outline distinction
}

export const ElementBadge: React.FC<ElementBadgeProps> = ({ type, label, className = '' }) => {
    // Remove 'D' prefix if present: DModel -> model, DClass -> class
    const normalizedType = type.replace(/^D/, '').toLowerCase();
    const resolved = resolveEntityType(normalizedType);
    const badgeClass = `element-badge element-badge--${normalizedType}`;
    const displayLetter = label || (resolved ? entityLetter(resolved) : type.charAt(0).toUpperCase());

    return (
        <span className={`${badgeClass} ${className}`}>
            {displayLetter}
        </span>
    );
};

export default ElementBadge;
