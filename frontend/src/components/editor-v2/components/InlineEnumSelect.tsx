import { useState, useRef, useEffect, useCallback } from 'react';

interface EnumLiteral {
    name: string;
}

interface InlineEnumSelectProps {
    value: string;
    enumName: string;
    literals: EnumLiteral[];
    isStale?: boolean;
    onChange: (value: string) => void;
    onClose: () => void;
}

/**
 * Popover dropdown for selecting enum literal values.
 * Reuses the same visual style as InlineTypeSelect (`.inline-type-select` classes).
 */
function InlineEnumSelect({ value, enumName, literals, isStale, onChange, onClose }: InlineEnumSelectProps) {
    const [highlighted, setHighlighted] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Options: empty (clear) + literals; if stale, add the invalid value
    const options: Array<{ value: string; label: string; stale?: boolean }> = [];
    options.push({ value: '', label: '(none)' });
    if (isStale && value) {
        options.push({ value, label: `${value} (invalid)`, stale: true });
    }
    for (const lit of literals) {
        options.push({ value: lit.name, label: lit.name });
    }

    // Find initial highlighted index
    useEffect(() => {
        const idx = options.findIndex(o => o.value === value);
        if (idx >= 0) setHighlighted(idx);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Focus container on mount so keyboard events work
    useEffect(() => {
        const raf = requestAnimationFrame(() => containerRef.current?.focus());
        return () => cancelAnimationFrame(raf);
    }, []);

    // Close on Escape (document-level fallback)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); onClose(); }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

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
            const items = listRef.current.querySelectorAll('.inline-type-select__option');
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
            onChange(options[highlighted].value);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    }, [highlighted, options, onChange, onClose]);

    return (
        <div
            ref={containerRef}
            className="inline-type-select"
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            tabIndex={0}
            autoFocus
        >
            <div ref={listRef} className="inline-type-select__list">
                <div className="inline-type-select__group">{enumName}</div>
                {options.map((opt, idx) => (
                    <div
                        key={opt.value || '__none__'}
                        className={
                            `inline-type-select__option` +
                            (value === opt.value ? ' selected' : '') +
                            (highlighted === idx ? ' highlighted' : '') +
                            (opt.stale ? ' inline-type-select__option--stale' : '')
                        }
                        onClick={() => onChange(opt.value)}
                        onMouseEnter={() => setHighlighted(idx)}
                    >
                        {opt.label}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default InlineEnumSelect;
