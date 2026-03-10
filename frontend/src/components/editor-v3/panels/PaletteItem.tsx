/**
 * Editor V3 — PaletteItem: single draggable item in the palette sidebar.
 *
 * Sets dataTransfer MIME types:
 *   - application/jjodel-palette-type → the action type (createClass, createEnum, etc.)
 *   - application/jjodel-palette-data → JSON payload for the action
 */

import React, { useCallback, memo } from 'react';

export interface PaletteItemProps {
    /** Bootstrap icon class (e.g., 'bi-diagram-3') */
    icon: string;
    /** Display label */
    label: string;
    /** Optional sublabel (e.g., "3 attrs, 2 refs") */
    sublabel?: string;
    /** Palette action type (e.g., 'createClass') */
    paletteType: string;
    /** Optional extra data for the action */
    paletteData?: Record<string, unknown>;
    /** Hint text (e.g., "drop on node") */
    hint?: string;
    /** Extra CSS class */
    className?: string;
}

function PaletteItemInner({
    icon,
    label,
    sublabel,
    paletteType,
    paletteData,
    hint,
    className,
}: PaletteItemProps) {
    const handleDragStart = useCallback((event: React.DragEvent) => {
        event.dataTransfer.setData('application/jjodel-palette-type', paletteType);
        if (paletteData) {
            event.dataTransfer.setData(
                'application/jjodel-palette-data',
                JSON.stringify(paletteData),
            );
        }
        event.dataTransfer.effectAllowed = 'move';
    }, [paletteType, paletteData]);

    return (
        <div
            className={`v3-palette-item ${className ?? ''}`}
            draggable
            onDragStart={handleDragStart}
        >
            <i className={`bi ${icon} v3-palette-item__icon`} />
            <div className="v3-palette-item__text">
                <span className="v3-palette-item__label">{label}</span>
                {sublabel && (
                    <span className="v3-palette-item__sublabel">{sublabel}</span>
                )}
            </div>
            {hint && (
                <span className="v3-palette-item__hint">{hint}</span>
            )}
        </div>
    );
}

export const PaletteItem = memo(PaletteItemInner);
