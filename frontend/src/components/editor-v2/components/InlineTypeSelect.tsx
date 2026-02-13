import { useState, useRef, useEffect, useCallback } from 'react';
import { useNodes } from '@xyflow/react';
import { E_DATA_TYPES } from '../types';
import type { EnumNodeData } from '../types';

interface InlineTypeSelectProps {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
}

/**
 * Compact inline dropdown for selecting attribute types.
 * Shows primitive types and enumerations from the current metamodel.
 */
function InlineTypeSelect({ value, onChange, onClose }: InlineTypeSelectProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [highlighted, setHighlighted] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const nodes = useNodes();

    // Get enumerations from current metamodel
    const enums = nodes
        .filter(n => n.type === 'enumNode')
        .map(n => (n.data as EnumNodeData).label);

    // Build options list: primitives first, then enums
    const options = [
        ...E_DATA_TYPES,
        ...enums,
    ];

    // Find initial highlighted index
    useEffect(() => {
        const idx = options.indexOf(value);
        if (idx >= 0) setHighlighted(idx);
    }, [value, options]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (listRef.current) {
            const items = listRef.current.children;
            if (items[highlighted]) {
                (items[highlighted] as HTMLElement).scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlighted]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlighted(h => Math.min(h + 1, options.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted(h => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            onChange(options[highlighted]);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    }, [highlighted, options, onChange, onClose]);

    const handleSelect = (type: string) => {
        onChange(type);
    };

    return (
        <div
            ref={containerRef}
            className="inline-type-select"
            onKeyDown={handleKeyDown}
            tabIndex={0}
            autoFocus
        >
            <div ref={listRef} className="inline-type-select__list">
                {E_DATA_TYPES.length > 0 && (
                    <div className="inline-type-select__group">Primitives</div>
                )}
                {E_DATA_TYPES.map((type, idx) => (
                    <div
                        key={type}
                        className={`inline-type-select__option ${value === type ? 'selected' : ''} ${highlighted === idx ? 'highlighted' : ''}`}
                        onClick={() => handleSelect(type)}
                        onMouseEnter={() => setHighlighted(idx)}
                    >
                        {type}
                    </div>
                ))}
                {enums.length > 0 && (
                    <>
                        <div className="inline-type-select__group">Enumerations</div>
                        {enums.map((enumName, i) => {
                            const idx = E_DATA_TYPES.length + i;
                            return (
                                <div
                                    key={enumName}
                                    className={`inline-type-select__option ${value === enumName ? 'selected' : ''} ${highlighted === idx ? 'highlighted' : ''}`}
                                    onClick={() => handleSelect(enumName)}
                                    onMouseEnter={() => setHighlighted(idx)}
                                >
                                    {enumName}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
}

export default InlineTypeSelect;
