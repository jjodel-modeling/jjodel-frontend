import React, { useEffect, useRef, useCallback } from 'react';
import './EdgeTypePopup.scss';

export type EdgeTypeChoice = 'association' | 'composition' | 'aggregation' | 'inheritance';

interface EdgeTypePopupProps {
    /** Screen coordinates (clientX/clientY) of the drop point */
    position: { x: number; y: number };
    /** Ref to the editor container (for offset and bounds calculation) */
    containerRef: React.RefObject<HTMLDivElement>;
    onSelect: (choice: EdgeTypeChoice) => void;
    onCancel: () => void;
}

const EDGE_TYPE_OPTIONS: Array<{ value: EdgeTypeChoice; label: string }> = [
    { value: 'association', label: 'Association' },
    { value: 'composition', label: 'Composition' },
    { value: 'aggregation', label: 'Aggregation' },
    { value: 'inheritance', label: 'Inheritance' },
];

// --- SVG Icons ---
//
// The four UML line ends, drawn as a 26x10 strip: the glyph IS the edge it
// creates, so it reads as a line with a decoration on each end rather than as a
// pictogram in a square. `currentColor` funnels the colour back to the host
// button, where `--float-icon` declares it once for both themes.

function AssociationIcon({ className }: { className?: string }) {
    return (
        <svg width="26" height="10" viewBox="0 0 26 10" className={className} aria-hidden="true">
            <line x1="1" y1="5" x2="19" y2="5" stroke="currentColor" strokeWidth="1.3" />
            <polyline points="18,1.5 24.5,5 18,8.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

function CompositionIcon({ className }: { className?: string }) {
    return (
        <svg width="26" height="10" viewBox="0 0 26 10" className={className} aria-hidden="true">
            <polygon points="1,5 5,1.8 9,5 5,8.2" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            <line x1="9" y1="5" x2="19" y2="5" stroke="currentColor" strokeWidth="1.3" />
            <polyline points="18,1.5 24.5,5 18,8.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

function AggregationIcon({ className }: { className?: string }) {
    return (
        <svg width="26" height="10" viewBox="0 0 26 10" className={className} aria-hidden="true">
            <polygon points="1,5 5,1.8 9,5 5,8.2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <line x1="9" y1="5" x2="19" y2="5" stroke="currentColor" strokeWidth="1.3" />
            <polyline points="18,1.5 24.5,5 18,8.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

function InheritanceIcon({ className }: { className?: string }) {
    return (
        <svg width="26" height="10" viewBox="0 0 26 10" className={className} aria-hidden="true">
            <line x1="1" y1="5" x2="17.5" y2="5" stroke="currentColor" strokeWidth="1.3" />
            <polygon points="17,1 24.5,5 17,9" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
    );
}

const ICONS: Record<EdgeTypeChoice, React.FC<{ className?: string }>> = {
    association: AssociationIcon,
    composition: CompositionIcon,
    aggregation: AggregationIcon,
    inheritance: InheritanceIcon,
};

// --- Main Component ---

export function EdgeTypePopup({ position, containerRef, onSelect, onCancel }: EdgeTypePopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);

    const getPopupStyle = useCallback((): React.CSSProperties => {
        const container = containerRef.current;
        if (!container) return { display: 'none' };

        const containerRect = container.getBoundingClientRect();
        let left = position.x - containerRect.left + 8;
        let top = position.y - containerRect.top + 8;

        const popupWidth = 170;
        // 6px padding + eyebrow + 4 rows of 34px + 6px padding. Tracks the row
        // geometry in EdgeTypePopup.scss: it is what decides the flip-up.
        const popupHeight = 176;

        if (left + popupWidth > containerRect.width) {
            left = position.x - containerRect.left - popupWidth - 8;
        }
        if (top + popupHeight > containerRect.height) {
            top = position.y - containerRect.top - popupHeight - 8;
        }

        left = Math.max(4, left);
        top = Math.max(4, top);

        return {
            position: 'absolute',
            left: `${left}px`,
            top: `${top}px`,
            zIndex: 1000,
        };
    }, [position, containerRef]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    // Close on click outside (delayed to avoid catching the mouseup from the drag)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                onCancel();
            }
        };
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 50);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onCancel]);

    // Auto-focus for accessibility
    useEffect(() => {
        popupRef.current?.focus();
    }, []);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const items = popupRef.current?.querySelectorAll<HTMLButtonElement>('.edge-type-popup__option');
            if (!items) return;
            const current = document.activeElement;
            const index = Array.from(items).indexOf(current as HTMLButtonElement);
            const next = e.key === 'ArrowDown'
                ? items[(index + 1) % items.length]
                : items[(index - 1 + items.length) % items.length];
            next?.focus();
        }
    };

    return (
        <div
            ref={popupRef}
            className="edge-type-popup"
            style={getPopupStyle()}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            role="menu"
            aria-label="Select edge type"
        >
            <div className="edge-type-popup__header">Edge Type</div>
            {EDGE_TYPE_OPTIONS.map(({ value, label }) => {
                const Icon = ICONS[value];
                return (
                    <button
                        key={value}
                        className="edge-type-popup__option"
                        onClick={() => onSelect(value)}
                        role="menuitem"
                        tabIndex={0}
                    >
                        <Icon className="edge-type-popup__icon" />
                        <span className="edge-type-popup__label">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
