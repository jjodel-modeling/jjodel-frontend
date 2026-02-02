/**
 * JjScript Input Component
 * Text input with command history and autocomplete
 */

import React, { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { COMMANDS, ELEMENT_TYPES, KEYWORDS, AutocompleteSuggestion } from '../types';
import './JjScriptInput.scss';

interface JjScriptInputProps {
    onExecute: (command: string) => void;
    disabled?: boolean;
    placeholder?: string;
    history?: string[];
    className?: string;
}

export const JjScriptInput: React.FC<JjScriptInputProps> = ({
    onExecute,
    disabled = false,
    placeholder = 'Enter JjScript command...',
    history = [],
    className = ''
}) => {
    const [value, setValue] = useState('');
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Generate autocomplete suggestions based on current input
    const generateSuggestions = useCallback((input: string): AutocompleteSuggestion[] => {
        if (!input || input.length < 1) return [];

        const suggestions: AutocompleteSuggestion[] = [];
        const words = input.trim().split(/\s+/);
        const lastWord = words[words.length - 1].toLowerCase();
        const isFirstWord = words.length === 1;

        // Command suggestions (only for first word)
        if (isFirstWord) {
            for (const cmd of COMMANDS) {
                if (cmd.startsWith(lastWord)) {
                    suggestions.push({
                        text: cmd,
                        displayText: cmd,
                        type: 'command',
                        description: getCommandDescription(cmd)
                    });
                }
            }
        }

        // Element type suggestions
        const isAfterCreate = words.length >= 2 && words[0].toLowerCase() === 'create';
        const isAfterAdd = words.length >= 2 && words[0].toLowerCase() === 'add';
        const isAfterList = words.length >= 2 && words[0].toLowerCase() === 'list';

        if (isAfterCreate || isAfterAdd || isAfterList) {
            for (const type of ELEMENT_TYPES) {
                if (type.toLowerCase().startsWith(lastWord)) {
                    suggestions.push({
                        text: type,
                        displayText: type,
                        type: 'element',
                        description: getElementDescription(type)
                    });
                }
            }
        }

        // Keyword suggestions
        if (words.length > 2) {
            for (const keyword of KEYWORDS) {
                if (keyword.startsWith(lastWord)) {
                    suggestions.push({
                        text: keyword,
                        displayText: keyword,
                        type: 'keyword',
                        description: ''
                    });
                }
            }
        }

        return suggestions.slice(0, 8); // Limit suggestions
    }, []);

    // Handle input changes
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        setHistoryIndex(-1);

        // Generate suggestions
        const newSuggestions = generateSuggestions(newValue);
        setSuggestions(newSuggestions);
        setShowSuggestions(newSuggestions.length > 0);
        setSelectedSuggestion(-1);
    }, [generateSuggestions]);

    // Handle key events
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        // Tab completion
        if (e.key === 'Tab' && showSuggestions && suggestions.length > 0) {
            e.preventDefault();
            const selected = selectedSuggestion >= 0 ? selectedSuggestion : 0;
            applySuggestion(suggestions[selected]);
            return;
        }

        // Arrow navigation for suggestions
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSuggestion(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                return;
            }
            if (e.key === 'ArrowUp' && selectedSuggestion >= 0) {
                e.preventDefault();
                setSelectedSuggestion(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
                return;
            }
        }

        // History navigation
        if (e.key === 'ArrowUp' && !showSuggestions && history.length > 0) {
            e.preventDefault();
            const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
            setHistoryIndex(newIndex);
            setValue(history[history.length - 1 - newIndex] || '');
            return;
        }
        if (e.key === 'ArrowDown' && historyIndex >= 0) {
            e.preventDefault();
            const newIndex = historyIndex > 0 ? historyIndex - 1 : -1;
            setHistoryIndex(newIndex);
            setValue(newIndex >= 0 ? history[history.length - 1 - newIndex] : '');
            return;
        }

        // Execute on Enter
        if (e.key === 'Enter') {
            if (showSuggestions && selectedSuggestion >= 0) {
                e.preventDefault();
                applySuggestion(suggestions[selectedSuggestion]);
                return;
            }

            if (value.trim()) {
                e.preventDefault();
                onExecute(value.trim());
                setValue('');
                setHistoryIndex(-1);
                setSuggestions([]);
                setShowSuggestions(false);
            }
            return;
        }

        // Escape to close suggestions
        if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSelectedSuggestion(-1);
        }
    }, [value, showSuggestions, suggestions, selectedSuggestion, history, historyIndex, onExecute]);

    // Apply selected suggestion
    const applySuggestion = useCallback((suggestion: AutocompleteSuggestion) => {
        const words = value.trim().split(/\s+/);
        words[words.length - 1] = suggestion.insertText || suggestion.text;
        const newValue = words.join(' ') + ' ';
        setValue(newValue);
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        inputRef.current?.focus();
    }, [value]);

    // Click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`jjscript-input-container ${className}`}>
            <div className="jjscript-input-wrapper">
                <span className="jjscript-prompt">&gt;</span>
                <input
                    ref={inputRef}
                    type="text"
                    className="jjscript-input"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder={placeholder}
                    autoComplete="off"
                    spellCheck={false}
                />
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="jjscript-suggestions">
                    {suggestions.map((s, i) => (
                        <div
                            key={i}
                            className={`jjscript-suggestion ${i === selectedSuggestion ? 'selected' : ''}`}
                            onClick={() => applySuggestion(s)}
                            onMouseEnter={() => setSelectedSuggestion(i)}
                        >
                            <span className={`suggestion-type suggestion-type--${s.type}`}>
                                {s.type.charAt(0).toUpperCase()}
                            </span>
                            <span className="suggestion-text">{s.displayText}</span>
                            {s.description && (
                                <span className="suggestion-desc">{s.description}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Helper functions for descriptions
function getCommandDescription(cmd: string): string {
    const descriptions: Record<string, string> = {
        create: 'Create a new element',
        delete: 'Delete an element',
        rename: 'Rename an element',
        set: 'Set a property value',
        add: 'Add to collection',
        remove: 'Remove from collection',
        move: 'Move element',
        copy: 'Copy element',
        list: 'List elements',
        show: 'Show element details',
        help: 'Show help',
        undo: 'Undo action',
        redo: 'Redo action',
        validate: 'Validate model',
        clear: 'Clear state'
    };
    return descriptions[cmd] || '';
}

function getElementDescription(type: string): string {
    const descriptions: Record<string, string> = {
        class: 'A model class',
        'abstract class': 'An abstract class',
        interface: 'An interface',
        attribute: 'A class attribute',
        reference: 'A class reference',
        operation: 'A class operation',
        parameter: 'Operation parameter',
        package: 'A package',
        enum: 'An enumeration',
        literal: 'Enum literal'
    };
    return descriptions[type] || '';
}

export default JjScriptInput;
