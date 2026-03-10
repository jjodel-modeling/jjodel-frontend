/**
 * Editor V3 — EdgeTypePopup: popup for choosing edge type on connection.
 *
 * Appears where the connection drag ended. User picks:
 * - Association (arrow)
 * - Composition (filled diamond + arrow)
 * - Aggregation (hollow diamond + arrow)
 * - Inheritance (hollow triangle)
 */

import React, { useCallback, useEffect, useRef, memo } from 'react';
import type { UnifiedEdgeData } from '../types';

export type EdgeTypeChoice = Extract<
    UnifiedEdgeData['edgeKind'],
    'reference' | 'composition' | 'aggregation' | 'inheritance'
>;

export interface EdgeTypePopupProps {
    x: number;
    y: number;
    onSelect: (kind: EdgeTypeChoice) => void;
    onCancel: () => void;
}

const OPTIONS: { kind: EdgeTypeChoice; label: string; icon: string }[] = [
    { kind: 'reference', label: 'Association', icon: '→' },
    { kind: 'composition', label: 'Composition', icon: '◆→' },
    { kind: 'aggregation', label: 'Aggregation', icon: '◇→' },
    { kind: 'inheritance', label: 'Inheritance', icon: '▷' },
];

function EdgeTypePopupInner({ x, y, onSelect, onCancel }: EdgeTypePopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);
    const selectedRef = useRef(0);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                onCancel();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onCancel]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedRef.current = Math.min(selectedRef.current + 1, OPTIONS.length - 1);
            focusOption(selectedRef.current);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedRef.current = Math.max(selectedRef.current - 1, 0);
            focusOption(selectedRef.current);
        } else if (e.key === 'Enter') {
            onSelect(OPTIONS[selectedRef.current].kind);
        }
    }, [onCancel, onSelect]);

    function focusOption(index: number) {
        const buttons = popupRef.current?.querySelectorAll('button');
        buttons?.[index]?.focus();
    }

    // Auto-focus first option
    useEffect(() => {
        const timer = setTimeout(() => focusOption(0), 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            ref={popupRef}
            className="v3-edge-type-popup"
            style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
            }}
            onKeyDown={handleKeyDown}
        >
            {OPTIONS.map((opt, i) => (
                <button
                    key={opt.kind}
                    className="v3-edge-type-popup__option"
                    onClick={() => onSelect(opt.kind)}
                    onFocus={() => { selectedRef.current = i; }}
                >
                    <span className="v3-edge-type-popup__icon">{opt.icon}</span>
                    <span className="v3-edge-type-popup__label">{opt.label}</span>
                </button>
            ))}
        </div>
    );
}

export const EdgeTypePopup = memo(EdgeTypePopupInner);
