/**
 * IncludedModelsCombobox Component
 * The «Also include» field of the run dialog: a multi-value select whose values are pills (R-JTG-27).
 * The field keeps the height of one input row: the pills that do not fit collapse into a +N pill.
 * Styles live in execute-transformation-dialog.scss, with the dialog that hosts it.
 */

import React, { useLayoutEffect, useRef, useState } from 'react';

export interface IncludedModelOption {
    id: string;
    name: string;
}

export interface IncludedModelsComboboxProps {
    inputId: string;
    /** The models a run can include: same metamodel, not the primary */
    candidates: IncludedModelOption[];
    /** The included models, in the order the run takes them */
    selected: IncludedModelOption[];
    metamodelName: string;
    disabled?: boolean;
    onAdd: (id: string) => void;
    onRemove: (id: string) => void;
}

/** The candidates not yet included whose name contains the typed text. */
export function availableOptions(
    candidates: IncludedModelOption[],
    selected: IncludedModelOption[],
    query: string
): IncludedModelOption[] {
    const typed = query.trim().toLowerCase();
    return candidates.filter(c =>
        !selected.some(s => s.id === c.id) && c.name.toLowerCase().includes(typed)
    );
}

/** How many pills fit in `available`, in order, keeping room for the +N pill when some do not. */
export function visiblePillCount(
    pillWidths: number[],
    available: number,
    moreWidth: number,
    gap: number
): number {
    const total = pillWidths.reduce((sum, width, i) => sum + width + (i > 0 ? gap : 0), 0);
    if (total <= available) return pillWidths.length;
    let used = moreWidth;
    let count = 0;
    for (const width of pillWidths) {
        if (used + gap + width > available) break;
        used += gap + width;
        count++;
    }
    return count;
}

export type ComboboxKeyResult =
    | { action: 'ignore' }
    | { action: 'swallow' }
    | { action: 'removeLast' }
    | { action: 'close' }
    | { action: 'add' }
    | { action: 'highlight'; index: number };

/**
 * What a key does in the field. `ignore` leaves it to the input and to the dialog: Escape
 * with the list closed still closes the dialog. Enter never submits the form from here.
 */
export function comboboxKeyResult(
    key: string,
    state: { isOpen: boolean; query: string; optionCount: number; activeIndex: number; pillCount: number }
): ComboboxKeyResult {
    const { isOpen, query, optionCount, activeIndex, pillCount } = state;
    switch (key) {
        case 'Backspace':
            return query === '' && pillCount > 0 ? { action: 'removeLast' } : { action: 'ignore' };
        case 'Escape':
            return isOpen ? { action: 'close' } : { action: 'ignore' };
        case 'Enter':
            return isOpen && optionCount > 0 ? { action: 'add' } : { action: 'swallow' };
        case 'ArrowDown':
            return { action: 'highlight', index: isOpen ? Math.min(activeIndex + 1, optionCount - 1) : 0 };
        case 'ArrowUp':
            return { action: 'highlight', index: isOpen ? Math.max(activeIndex - 1, 0) : 0 };
        default:
            return { action: 'ignore' };
    }
}

const Pill: React.FC<{ name: string; disabled?: boolean; onRemove?: () => void }> = ({ name, disabled, onRemove }) => (
    <span className="included-models-pill" title={name}>
        <span className="included-models-pill-name">{name}</span>
        <button
            type="button"
            className="included-models-pill-remove"
            aria-label={onRemove ? `Remove ${name}` : undefined}
            tabIndex={onRemove ? undefined : -1}
            disabled={disabled}
            // Pressing the x must not reach the field, which would open the list
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onRemove}
        >
            <i className="bi bi-x" />
        </button>
    </span>
);

export const IncludedModelsCombobox: React.FC<IncludedModelsComboboxProps> = ({
    inputId,
    candidates,
    selected,
    metamodelName,
    disabled = false,
    onAdd,
    onRemove,
}) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const [visibleCount, setVisibleCount] = useState(selected.length);

    const fieldRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const chevronRef = useRef<HTMLElement>(null);
    const rulerRef = useRef<HTMLDivElement>(null);

    const selectedKey = selected.map(s => s.id).join('\n');

    // The pills are measured in the hidden ruler, so that what fits does not depend on what is shown
    useLayoutEffect(() => {
        const field = fieldRef.current;
        const ruler = rulerRef.current;
        const input = inputRef.current;
        const chevron = chevronRef.current;
        if (!field || !ruler || !input || !chevron) return undefined;
        const measure = () => {
            const widths = Array.from(ruler.children).map(el => el.getBoundingClientRect().width);
            const moreWidth = widths.pop() ?? 0;
            const style = getComputedStyle(field);
            const gap = parseFloat(style.columnGap) || 0;
            const reserved = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
                + parseFloat(getComputedStyle(input).minWidth) + chevron.getBoundingClientRect().width + 2 * gap;
            setVisibleCount(visiblePillCount(widths, field.clientWidth - reserved, moreWidth, gap));
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(field);
        return () => observer.disconnect();
    }, [selectedKey]);

    const hasNoCandidate = candidates.length === 0;
    const isDisabled = disabled || hasNoCandidate;
    const options = availableOptions(candidates, selected, query);
    const activeIndex = Math.min(highlight, options.length - 1);
    const showDropdown = isOpen && !isDisabled && (options.length > 0 || query !== '');
    const listId = `${inputId}-list`;
    const optionId = (index: number) => `${inputId}-option-${index}`;

    const shownPills = selected.slice(0, visibleCount);
    const hiddenPills = selected.slice(visibleCount);

    const placeholder = hasNoCandidate
        ? `No other instance of ${metamodelName}`
        : selected.length === 0 ? 'Select models to include...' : undefined;

    const add = (option: IncludedModelOption) => {
        onAdd(option.id);
        setQuery('');
        setHighlight(0);
    };

    const remove = (id: string) => {
        onRemove(id);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const result = comboboxKeyResult(e.key, { isOpen: showDropdown, query, optionCount: options.length, activeIndex, pillCount: selected.length });
        if (result.action === 'ignore') return;
        e.preventDefault();
        // Escape handled here must not reach the window listener that closes the dialog
        e.stopPropagation();
        switch (result.action) {
            case 'removeLast':
                onRemove(selected[selected.length - 1].id);
                break;
            case 'close':
                setIsOpen(false);
                break;
            case 'add':
                add(options[activeIndex]);
                break;
            case 'highlight':
                setIsOpen(true);
                setHighlight(result.index);
                break;
        }
    };

    const handleFieldMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDisabled) return;
        // Keeps the caret in the input when the press lands on a pill or on the padding
        if (e.target !== inputRef.current) e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
    };

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsOpen(false);
    };

    return (
        <div className="included-models-combobox" onBlur={handleBlur}>
            <div
                ref={fieldRef}
                className={`included-models-field${isDisabled ? ' included-models-field--disabled' : ''}`}
                onMouseDown={handleFieldMouseDown}
            >
                {shownPills.map(model => (
                    <Pill key={model.id} name={model.name} disabled={isDisabled} onRemove={() => remove(model.id)} />
                ))}
                {hiddenPills.length > 0 && (
                    <span className="included-models-more" title={hiddenPills.map(m => m.name).join(', ')}>
                        +{hiddenPills.length}
                    </span>
                )}
                <input
                    ref={inputRef}
                    id={inputId}
                    className="included-models-input"
                    role="combobox"
                    aria-expanded={showDropdown}
                    aria-controls={showDropdown ? listId : undefined}
                    aria-autocomplete="list"
                    aria-activedescendant={showDropdown && activeIndex >= 0 ? optionId(activeIndex) : undefined}
                    autoComplete="off"
                    placeholder={placeholder}
                    value={query}
                    disabled={isDisabled}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setHighlight(0);
                        setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                />
                <i ref={chevronRef} className="bi bi-chevron-down included-models-chevron" />
            </div>

            {showDropdown && (
                // Pressing the list, its scrollbar included, must not take the focus from the input
                <div id={listId} className="included-models-dropdown" role="listbox" onMouseDown={(e) => e.preventDefault()}>
                    {options.map((option, index) => (
                        <div
                            key={option.id}
                            id={optionId(index)}
                            className={`included-models-option${index === activeIndex ? ' included-models-option--active' : ''}`}
                            role="option"
                            aria-selected={index === activeIndex}
                            onMouseEnter={() => setHighlight(index)}
                            onClick={() => add(option)}
                        >
                            {option.name}
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div className="included-models-option included-models-option--empty" role="option" aria-selected={false} aria-disabled={true}>
                            No matching model
                        </div>
                    )}
                </div>
            )}

            <div ref={rulerRef} className="included-models-ruler" aria-hidden={true}>
                {selected.map(model => <Pill key={model.id} name={model.name} />)}
                <span className="included-models-more">+{selected.length}</span>
            </div>
        </div>
    );
};

export default IncludedModelsCombobox;
