/**
 * Command Palette Component
 * VS Code-style command palette for Jjodie commands
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { JjodieHelpSystem } from '../../services/JjodieHelpSystem';
import './CommandPalette.css';

interface CommandSuggestion {
    command: string;
    description: string;
    example: string;
    category: string;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onExecute: (command: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
    isOpen,
    onClose,
    onExecute,
}) => {
    const [input, setInput] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Get all command suggestions
    const allCommands: CommandSuggestion[] = useMemo(
        () => JjodieHelpSystem.getCommandDescriptions(),
        []
    );

    // Filter suggestions based on input
    const suggestions = useMemo(() => {
        if (input.length === 0) return allCommands;

        const searchTerm = input.toLowerCase();
        return allCommands.filter(
            (cmd) =>
                cmd.command.toLowerCase().includes(searchTerm) ||
                cmd.description.toLowerCase().includes(searchTerm)
        );
    }, [input, allCommands]);

    // Group by category
    const groupedSuggestions = useMemo(() => {
        return suggestions.reduce(
            (acc, cmd) => {
                if (!acc[cmd.category]) acc[cmd.category] = [];
                acc[cmd.category].push(cmd);
                return acc;
            },
            {} as Record<string, CommandSuggestion[]>
        );
    }, [suggestions]);

    // Reset selection when filtering changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [suggestions]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setInput('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selectedElement = listRef.current.querySelector(
                '.command-item.selected'
            );
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth',
                });
            }
        }
    }, [selectedIndex]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestions[selectedIndex]) {
                handleExecute(suggestions[selectedIndex].command);
            } else if (input.trim()) {
                handleExecute(input.trim());
            }
        } else if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (suggestions[selectedIndex]) {
                setInput(suggestions[selectedIndex].example);
            }
        }
    };

    const handleExecute = (command: string) => {
        onExecute(command);
        setInput('');
        setSelectedIndex(0);
        onClose();
    };

    // Close on overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    // Flatten grouped suggestions for index tracking
    let flatIndex = 0;

    return (
        <div className="command-palette-overlay" onClick={handleOverlayClick}>
            <div className="command-palette" onClick={(e) => e.stopPropagation()}>
                {/* Input */}
                <div className="command-input-wrapper">
                    <i className="bi bi-terminal"></i>
                    <input
                        ref={inputRef}
                        type="text"
                        className="command-input"
                        placeholder="Type a command or search..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <kbd className="command-hint">Esc</kbd>
                </div>

                {/* Suggestions */}
                <div className="command-suggestions" ref={listRef}>
                    {Object.keys(groupedSuggestions).length === 0 ? (
                        <div className="no-suggestions">
                            No matching commands. Type <code>/help</code> for assistance.
                        </div>
                    ) : (
                        Object.entries(groupedSuggestions).map(([category, cmds]) => (
                            <div key={category} className="command-category">
                                <div className="category-header">{category}</div>
                                {cmds.map((cmd) => {
                                    const currentIndex = flatIndex++;
                                    const isSelected = currentIndex === selectedIndex;

                                    return (
                                        <div
                                            key={cmd.command}
                                            className={`command-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleExecute(cmd.command)}
                                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                                        >
                                            <div className="command-main">
                                                <code className="command-text">{cmd.command}</code>
                                                <span className="command-description">
                                                    {cmd.description}
                                                </span>
                                            </div>
                                            <div className="command-example">{cmd.example}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="command-footer">
                    <div className="footer-item">
                        <kbd>↑↓</kbd> Navigate
                    </div>
                    <div className="footer-item">
                        <kbd>Enter</kbd> Execute
                    </div>
                    <div className="footer-item">
                        <kbd>Tab</kbd> Use example
                    </div>
                    <div className="footer-item">
                        <kbd>Esc</kbd> Close
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
