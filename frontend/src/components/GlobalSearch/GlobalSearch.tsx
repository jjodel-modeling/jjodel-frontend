import React, { useState, useRef, useEffect } from 'react';
import './GlobalSearch.scss';

type GlobalSearchProps = {
    placeholder?: string;
    onSearch?: (query: string) => void;
    className?: string;
};

export const GlobalSearch = (props: GlobalSearchProps) => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Keyboard shortcut: Cmd+K or Ctrl+K to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            // Escape to blur
            if (e.key === 'Escape' && isFocused) {
                inputRef.current?.blur();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        props.onSearch?.(value);
    };

    const handleClear = () => {
        setQuery('');
        props.onSearch?.('');
        inputRef.current?.focus();
    };

    return (
        <div className={`global-search ${isFocused ? 'focused' : ''} ${props.className || ''}`}>
            <i className="bi bi-search search-icon" />
            <input
                ref={inputRef}
                type="text"
                placeholder={props.placeholder || "Search projects..."}
                value={query}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
            {query ? (
                <button className="clear-btn" onClick={handleClear} type="button">
                    <i className="bi bi-x-circle-fill" />
                </button>
            ) : (
                <span className="shortcut-hint">
                    <kbd>⌘</kbd><kbd>K</kbd>
                </span>
            )}
        </div>
    );
};

export default GlobalSearch;
