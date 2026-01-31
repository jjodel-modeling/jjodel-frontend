import React from 'react';
import { U } from '../../../joiner';
import { Tooltip } from '../../forEndUser/Tooltip';
import { ConsoleEntryData } from './ConsoleEntry';

interface ConsoleToolbarProps {
  onClear: () => void;
  onCopyAll: (entries: ConsoleEntryData[]) => void;
  entries: ConsoleEntryData[];
  historyCount: number;
}

export const ConsoleToolbar: React.FC<ConsoleToolbarProps> = ({
  onClear,
  onCopyAll,
  entries,
  historyCount
}) => {
  const handleClearConsole = () => {
    if (entries.length === 0) {
      Tooltip.show('Console is already empty', undefined, undefined, 2);
      return;
    }
    onClear();
    Tooltip.show('Console cleared', undefined, undefined, 2);
  };

  const handleCopyAll = () => {
    if (entries.length === 0) {
      Tooltip.show('Nothing to copy', undefined, undefined, 2);
      return;
    }

    // Combine all results into one string
    const allOutput = entries
      .filter(e => e.type === 'result' || e.type === 'error')
      .map(e => e.content)
      .join('\n\n---\n\n');

    U.clipboardCopy(allOutput, () => {
      Tooltip.show('All output copied to clipboard', undefined, undefined, 2);
    });
  };

  return (
    <div className="console-toolbar">
      <div className="console-toolbar__left">
        <button
          className="toolbar-btn"
          onClick={handleClearConsole}
          title="Clear console (Ctrl+L)"
          type="button"
        >
          <i className="bi bi-trash" />
          <span>Clear</span>
        </button>

        <button
          className="toolbar-btn"
          onClick={handleCopyAll}
          title="Copy all output"
          type="button"
          disabled={entries.length === 0}
        >
          <i className="bi bi-clipboard" />
          <span>Copy All</span>
        </button>

        <div className="toolbar-divider" />

        <span className="toolbar-info">
          {historyCount > 0 ? `${historyCount} command${historyCount !== 1 ? 's' : ''}` : 'No commands'}
        </span>
      </div>

      <div className="console-toolbar__right">
        <button
          className="toolbar-btn toolbar-btn--icon-only"
          title="Keyboard shortcuts"
          type="button"
          onClick={() => {
            Tooltip.show(
              'Enter: Execute | Shift+Enter: New line | ↑↓: History | Tab: Autocomplete | Ctrl+L: Clear',
              undefined,
              undefined,
              5
            );
          }}
        >
          <i className="bi bi-keyboard" />
        </button>
      </div>
    </div>
  );
};

export default ConsoleToolbar;
