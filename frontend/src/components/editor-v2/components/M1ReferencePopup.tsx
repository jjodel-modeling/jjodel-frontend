import React, { useEffect, useRef, useCallback } from 'react';
import type { CompatibleReference } from '../utils/compositionCompat';
import type { MetaclassReference } from '../hooks/useEditorMode';
import './EdgeTypePopup.scss'; // reuse same styling

// --- SVG Icons ---
//
// Same drawing language as the four UML glyphs of EdgeTypePopup.tsx: a 26x10
// strip where the glyph IS the edge it creates, on `currentColor` so the colour
// is declared once on the host button (`--float-icon`). Line ends, stroke widths
// and the arrowhead are the ones used there; keep the two in step.

function CompositionIcon({ className }: { className?: string }) {
    return (
        <svg width="26" height="10" viewBox="0 0 26 10" className={className} aria-hidden="true">
            <polygon points="1,5 5,1.8 9,5 5,8.2" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            <line x1="9" y1="5" x2="19" y2="5" stroke="currentColor" strokeWidth="1.3" />
            <polyline points="18,1.5 24.5,5 18,8.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

function ReferenceIcon({ className }: { className?: string }) {
    return (
        <svg width="26" height="10" viewBox="0 0 26 10" className={className} aria-hidden="true">
            <line x1="1" y1="5" x2="19" y2="5" stroke="currentColor" strokeWidth="1.3" />
            <polyline points="18,1.5 24.5,5 18,8.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

function ObjectEdgeIcon({ className }: { className?: string }) {
    return (
        <svg width="26" height="10" viewBox="0 0 26 10" className={className} aria-hidden="true">
            <line x1="1" y1="5" x2="8.5" y2="5" stroke="currentColor" strokeWidth="1.3" />
            <rect x="8.5" y="1.8" width="6.4" height="6.4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <line x1="14.9" y1="5" x2="19" y2="5" stroke="currentColor" strokeWidth="1.3" />
            <polyline points="18,1.5 24.5,5 18,8.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
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

        // Le due costanti decidono il ribaltamento, e seguono la geometria di
        // EdgeTypePopup.scss: 6px di padding + eyebrow + righe da 34px + 6px di
        // padding, con il glifo a 26px invece dei 16 di prima.
        const popupWidth = 228;
        const rowCount = options.length + (objectEdgeOptions?.length ?? 0);
        const popupHeight = 40 + rowCount * 34; // padding + eyebrow + righe

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
                        <span className="edge-type-popup__label-type">
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
