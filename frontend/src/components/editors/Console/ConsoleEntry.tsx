import React, { useState, useEffect, useRef } from 'react';
import { U } from '../../../joiner';
import { HelpCommandOutput } from './HelpCommandOutput';
import { RootJSONViewer } from './CollapsibleJSONViewer';

export interface ConsoleEntryData {
  id: string;
  type: 'command' | 'result' | 'error' | 'info' | 'help';
  timestamp: Date;
  content: string;
  input?: string;
  collapsed?: boolean;
  onCommandClick?: (command: string) => void;
}

interface ConsoleEntryProps {
  entry: ConsoleEntryData;
  onToggle?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
}

export const ConsoleEntry: React.FC<ConsoleEntryProps> = ({
  entry,
  onToggle,
  onCopy,
  onDelete
}) => {
  const [showRelativeTime, setShowRelativeTime] = useState(false);

  // Helper functions for timestamp formatting
  // HH:MM format by default (no seconds for cleaner look)
  const formatAbsoluteTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatRelativeTime = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (entry.type === 'command') {
    return (
      <div className="console-entry console-entry--command">
        <span className="console-entry__prompt">&gt;</span>
        <pre className="console-entry__code">{entry.input}</pre>
        <button
          className="command-timestamp"
          onClick={() => setShowRelativeTime(!showRelativeTime)}
          title={showRelativeTime ? formatAbsoluteTime(entry.timestamp) : formatRelativeTime(entry.timestamp)}
          type="button"
        >
          {showRelativeTime
            ? formatRelativeTime(entry.timestamp)
            : formatAbsoluteTime(entry.timestamp)
          }
        </button>
      </div>
    );
  }

  // For help command output (clickable commands)
  if (entry.type === 'help') {
    return (
      <div className="console-entry console-entry--help">
        {entry.onCommandClick && (
          <HelpCommandOutput onCommandClick={entry.onCommandClick} />
        )}
      </div>
    );
  }

  // For info entries (special command outputs like /examples, /context, etc.)
  if (entry.type === 'info') {
    return (
      <div className="console-entry console-entry--info">
        <pre className="console-entry__info-content">{entry.content}</pre>
      </div>
    );
  }

  // For result and error entries
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut for search (Ctrl/Cmd+F)
  useEffect(() => {
    if (entry.type !== 'result' || entry.collapsed) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !entry.collapsed) {
        e.preventDefault();
        setSearchVisible(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setSearchVisible(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [entry.type, entry.collapsed]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (searchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchVisible]);

  return (
    <div className={`console-entry console-entry--${entry.type}`}>
      <div className="console-entry__header">
        <button
          className="console-entry__toggle"
          onClick={onToggle}
          aria-label={entry.collapsed ? "Expand result" : "Collapse result"}
          type="button"
        >
          <i className={`bi ${entry.collapsed ? 'bi-chevron-right' : 'bi-chevron-down'}`} />
          <span>{entry.type === 'error' ? 'Error' : 'Result'}</span>
        </button>

        <div className="console-entry__actions">
          {entry.type === 'result' && !entry.collapsed && (
            <button
              className={`action-btn ${searchVisible ? 'active' : ''}`}
              onClick={() => {
                setSearchVisible(!searchVisible);
                if (!searchVisible) {
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                } else {
                  setSearchTerm('');
                }
              }}
              title="Search in result (Ctrl+F)"
              type="button"
            >
              <i className="bi bi-search" />
            </button>
          )}
          <button
            className="action-btn"
            onClick={onCopy}
            title="Copy result"
            type="button"
          >
            <i className="bi bi-clipboard" />
          </button>
          <button
            className="action-btn"
            onClick={onDelete}
            title="Remove entry"
            type="button"
          >
            <i className="bi bi-x" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchVisible && !entry.collapsed && entry.type === 'result' && (
        <div className="result-search">
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search in result... (Esc to close)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="search-close"
            onClick={() => {
              setSearchVisible(false);
              setSearchTerm('');
            }}
            title="Close search"
            type="button"
          >
            <i className="bi bi-x" />
          </button>
        </div>
      )}

      {!entry.collapsed && (
        <div className="console-entry__result">
          {entry.type === 'error' ? (
            <pre><span className="error-text">{entry.content}</span></pre>
          ) : (
            <SearchableContent content={entry.content} searchTerm={searchTerm} />
          )}
        </div>
      )}
    </div>
  );
};

// Component to highlight search matches in content
const SearchableContent: React.FC<{ content: string; searchTerm: string }> = ({
  content,
  searchTerm
}) => {
  // If no search term, just render normally
  if (!searchTerm) {
    return <RootJSONViewer content={content} />;
  }

  // For JSON content with search, highlight matches
  try {
    const parsed = JSON.parse(content);
    const formatted = JSON.stringify(parsed, null, 2);
    const highlighted = highlightSearchMatches(formatted, searchTerm);

    return (
      <div className="json-viewer">
        <pre dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>
    );
  } catch {
    // For non-JSON content, still highlight matches
    const highlighted = highlightSearchMatches(content, searchTerm);
    return <pre dangerouslySetInnerHTML={{ __html: highlighted }} />;
  }
};

// Highlight search term in text
const highlightSearchMatches = (text: string, search: string): string => {
  if (!search) return text;

  // Escape special regex characters
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedSearch})`, 'gi');

  return text
    .split(regex)
    .map((part, i) => {
      if (part.toLowerCase() === search.toLowerCase()) {
        return `<mark class="search-highlight">${part}</mark>`;
      }
      return part;
    })
    .join('');
};

export default ConsoleEntry;
