import React from 'react';
import { ConsoleEntry, ConsoleEntryData } from './ConsoleEntry';
import { U } from '../../../joiner';
import { Tooltip } from '../../forEndUser/Tooltip';

interface ConsoleHistoryProps {
  entries: ConsoleEntryData[];
  onToggleCollapse: (id: string) => void;
  onDeleteEntry: (id: string) => void;
}

export const ConsoleHistory: React.FC<ConsoleHistoryProps> = ({
  entries,
  onToggleCollapse,
  onDeleteEntry
}) => {
  const handleCopyResult = (content: string) => {
    U.clipboardCopy(content, () => {
      Tooltip.show('Content copied to clipboard', undefined, undefined, 2);
    });
  };

  if (entries.length === 0) {
    return (
      <div className="console-history">
        <div className="console-history__empty">
          <i className="bi bi-terminal" />
          <p>No commands yet</p>
          <span>Type JavaScript code above and press Enter</span>
          <span className="console-history__hint">
            <i className="bi bi-lightbulb" /> Tip: Type <code>/help</code> to see available commands
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="console-history">
      {entries.map(entry => (
        <ConsoleEntry
          key={entry.id}
          entry={entry}
          onToggle={() => onToggleCollapse(entry.id)}
          onCopy={() => handleCopyResult(entry.content)}
          onDelete={() => onDeleteEntry(entry.id)}
        />
      ))}
    </div>
  );
};

export default ConsoleHistory;
