import React, { useEffect, useRef, useCallback } from 'react';
import type { CompatibleReference } from '../utils/compositionCompat';
import type { MetaclassReference } from '../hooks/useEditorMode';
import './EdgeTypePopup.scss'; // reuse same styling

// --- SVG Icons (inline, 16x16) ---

function CompositionIcon({ className }: { className?: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" className={className}>
            <polygon points="1,8 4,5 7,8 4,11" fill="currentColor" stroke="currentColor" strokeWidth="1" />
            <line x1="7" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <polyline points="10,5 13,8 10,11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

function ReferenceIcon({ className }: { className?: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" className={className}>
            <line x1="1" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <polyline points="10,5 13,8 10,11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

function ObjectEdgeIcon({ className }: { className?: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" className={className}>
            <line x1="1" y1="8" x2="5" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <rect x="5.5" y="5.5" width="5" height="5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <line x1="11" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <polyline points="10,5 13,8 10,11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" transform="translate(1,0)" />
        </svg>
    );
}

// --- Main Component ---

/** Object-as-edge creation option (IR connect rule); `key` identifies the match at the caller. */
export interface ObjectEdgeOption {
    key: string;
    label: string;
}

interface M1ReferencePopupProps {
    /** Screen coordinates (clientX/clientY) of the drop point */
    position: { x: number; y: number };
    /** Ref to the editor container (for offset and bounds calculation) */
    containerRef: React.RefObject<HTMLDivElement>;
    /** Compatible references to choose from */
    options: CompatibleReference[];
    onSelect: (ref: MetaclassReference) => void;
    onCancel: () => void;
    /** Optional object-as-edge creation entries (IR connect rules), rendered after the references. */
    objectEdgeOptions?: ObjectEdgeOption[];
    onSelectObjectEdge?: (key: string) => void;
}

export function M1ReferencePopup({ position, containerRef, options, onSelect, onCancel, objectEdgeOptions, onSelectObjectEdge }: M1ReferencePopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);

    const getPopupStyle = useCallback((): React.CSSProperties => {
        const container = containerRef.current;
        if (!container) return { display: 'none' };

        const containerRect = container.getBoundingClientRect();
        let left = position.x - containerRect.left + 8;
        let top = position.y - containerRect.top + 8;

        const popupWidth = 210;
        const rowCount = options.length + (objectEdgeOptions?.length ?? 0);
        const popupHeight = 32 + rowCount * 34; // header + rows

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
    }, [position, containerRef, options.length, objectEdgeOptions?.length]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
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

    // Auto-focus
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
            aria-label="Select reference"
        >
            <div className="edge-type-popup__header">Link Reference</div>
            {options.map(({ ref, isContainment }) => (
                <button
                    key={ref.id}
                    className="edge-type-popup__option"
                    onClick={() => onSelect(ref)}
                    role="menuitem"
                    tabIndex={0}
                >
                    {isContainment
                        ? <CompositionIcon className="edge-type-popup__icon" />
                        : <ReferenceIcon className="edge-type-popup__icon" />
                    }
                    <span className="edge-type-popup__label">
                        {ref.name}
                        <span style={{ opacity: 0.5, marginLeft: 4, fontSize: '0.9em' }}>
                            : {ref.targetClassName}
                        </span>
                    </span>
                </button>
            ))}
            {(objectEdgeOptions ?? []).map(opt => (
                <button
                    key={opt.key}
                    className="edge-type-popup__option"
                    onClick={() => onSelectObjectEdge?.(opt.key)}
                    role="menuitem"
                    tabIndex={0}
                >
                    <ObjectEdgeIcon className="edge-type-popup__icon" />
                    <span className="edge-type-popup__label">{opt.label}</span>
                </button>
            ))}
        </div>
    );
}
