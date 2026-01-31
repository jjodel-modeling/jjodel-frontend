import React, { useState, useRef, useEffect } from 'react';
import { sortSuggestionsByFrequency, updateSuggestionUsage } from './useSuggestionTracking';

interface ConsoleInputProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: (code: string) => void;
  history: string[];
  contextKeys: string[];
  placeholder?: string;
}

const getAutocompleteSuggestions = (
  input: string,
  contextKeys: string[]
): string[] => {
  const trimmedInput = input.trim();

  // If input starts with '/', suggest commands
  if (trimmedInput.startsWith('/')) {
    const commands = [
      '/help',
      '/clear',
      '/history',
      '/context',
      '/examples',
      '/shortcuts'
    ];
    return commands.filter(cmd =>
      cmd.toLowerCase().startsWith(trimmedInput.toLowerCase())
    ).slice(0, 6);
  }

  const lastToken = input.split(/[\s.,;(){}[\]]/).pop() || '';

  if (!lastToken || lastToken.length < 2) return [];

  // Match context keys
  const matchingKeys = contextKeys.filter(key =>
    key.toLowerCase().startsWith(lastToken.toLowerCase())
  );

  // Match common JavaScript keywords
  const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch', 'case'];
  const matchingKeywords = keywords.filter(kw =>
    kw.startsWith(lastToken.toLowerCase())
  );

  // Match common console methods
  const methods = ['console.log', 'console.error', 'console.warn', 'JSON.stringify', 'JSON.parse'];
  const matchingMethods = methods.filter(m =>
    m.toLowerCase().includes(lastToken.toLowerCase())
  );

  const allMatches = [...new Set([...matchingKeys, ...matchingKeywords, ...matchingMethods])];

  // Sort by frequency + recency
  return sortSuggestionsByFrequency(allMatches);
};

export const ConsoleInput: React.FC<ConsoleInputProps> = ({
  value,
  onChange,
  onExecute,
  history,
  contextKeys,
  placeholder = 'Type JavaScript or /help for commands... (Shift+Enter for new line, ↑↓ for history)'
}) => {
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Execute on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
      return;
    }

    // Multi-line support with Shift+Enter is default behavior

    // Navigate history with Arrow Up/Down (only when not at start/end of multi-line)
    if (e.key === 'ArrowUp' && !e.shiftKey) {
      const textarea = textareaRef.current;
      if (textarea && textarea.selectionStart === 0) {
        e.preventDefault();
        navigateHistory('up');
      }
    }

    if (e.key === 'ArrowDown' && !e.shiftKey) {
      const textarea = textareaRef.current;
      if (textarea && textarea.selectionStart === textarea.value.length) {
        e.preventDefault();
        navigateHistory('down');
      }
    }

    // Autocomplete with Tab
    if (e.key === 'Tab' && suggestions.length > 0 && showSuggestions) {
      e.preventDefault();
      applySuggestion(suggestions[0]);
    }

    // Close suggestions with Escape
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleExecute = () => {
    if (!value.trim()) return;

    onExecute(value);
    setHistoryIndex(-1);
    setShowSuggestions(false);
  };

  const navigateHistory = (direction: 'up' | 'down') => {
    if (history.length === 0) return;

    let newIndex = historyIndex;

    if (direction === 'up') {
      newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
    } else {
      newIndex = historyIndex > -1 ? historyIndex - 1 : -1;
    }

    setHistoryIndex(newIndex);
    const newValue = newIndex === -1 ? '' : history[history.length - 1 - newIndex];
    onChange(newValue);
  };

  const applySuggestion = (suggestion: string) => {
    // Track usage for frequency-based sorting
    updateSuggestionUsage(suggestion);

    const tokens = value.split(/[\s.,;(){}[\]]/);
    tokens[tokens.length - 1] = suggestion;
    const newValue = tokens.join(' ');
    onChange(newValue);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  // Update suggestions based on input
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setShowAllSuggestions(false);
      return;
    }

    const newSuggestions = getAutocompleteSuggestions(value, contextKeys);
    setSuggestions(newSuggestions);
    setShowSuggestions(newSuggestions.length > 0);
    setShowAllSuggestions(false); // Reset when suggestions change
  }, [value, contextKeys]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [value]);

  return (
    <div className="console-input">
      <span className="console-input__prompt">&gt;</span>
      <textarea
        ref={textareaRef}
        className="console-input__field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        spellCheck={false}
      />

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="console-input__suggestions">
          {(() => {
            const topSuggestions = suggestions.slice(0, 10);
            const restSuggestions = suggestions.slice(10);
            const displayRestSuggestions = showAllSuggestions
              ? restSuggestions
              : restSuggestions.slice(0, 10);

            return (
              <>
                {/* Most Used Section */}
                {topSuggestions.length > 0 && (
                  <div className="suggestions-section">
                    <div className="suggestions-section__header">
                      <span className="label">Most Used</span>
                      <span className="count">{topSuggestions.length}</span>
                    </div>
                    <div className="suggestions-list">
                      {topSuggestions.map((suggestion, i) => (
                        <button
                          key={`top-${i}`}
                          className={`suggestion-item suggestion-item--top ${
                            i === 0 ? 'suggestion-item--active' : ''
                          }`}
                          onClick={() => applySuggestion(suggestion)}
                          type="button"
                        >
                          <i className="bi bi-star-fill" />
                          <span className="suggestion-text">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Others Section */}
                {restSuggestions.length > 0 && (
                  <div className="suggestions-section">
                    <div className="suggestions-section__header">
                      <span className="label">All Others (A-Z)</span>
                      <span className="count">{restSuggestions.length}</span>
                    </div>
                    <div className="suggestions-list">
                      {displayRestSuggestions.map((suggestion, i) => (
                        <button
                          key={`rest-${i}`}
                          className="suggestion-item"
                          onClick={() => applySuggestion(suggestion)}
                          type="button"
                        >
                          <span className="suggestion-text">{suggestion}</span>
                        </button>
                      ))}
                    </div>

                    {/* Show More Button */}
                    {!showAllSuggestions && restSuggestions.length > 10 && (
                      <button
                        className="show-more-btn"
                        onClick={() => setShowAllSuggestions(true)}
                        type="button"
                      >
                        +{restSuggestions.length - 10} more
                      </button>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ConsoleInput;
