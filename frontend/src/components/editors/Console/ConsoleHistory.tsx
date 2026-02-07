import React from 'react';
import { ConsoleEntry, ConsoleEntryData } from './ConsoleEntry';
import { U } from '../../../joiner';
import { Tooltip } from '../../forEndUser/Tooltip';

interface ConsoleHistoryProps {
  entries: ConsoleEntryData[];
  onToggleCollapse: (id: string) => void;
  onDeleteEntry: (id: string) => void;
  onExecuteCode?: (code: string) => void;
}

export const ConsoleHistory: React.FC<ConsoleHistoryProps> = ({
  entries,
  onToggleCollapse,
  onDeleteEntry,
  onExecuteCode
}) => {
  const handleCopyResult = (content: string) => {
    U.clipboardCopy(content, () => {
      Tooltip.show('Content copied to clipboard', undefined, undefined, 2);
    });
  };

  const quickStartExamples = [
    { code: 'data', description: 'Current model data' },
    { code: 'data.classes', description: 'All classes' },
    { code: 'node', description: 'Selected node' },
    { code: '/help', description: 'Show commands' },
  ];

  if (entries.length === 0) {
    return (
      <div className="console-history">
        <div className="console-empty">
          <div className="console-empty__icon">
            <i className="bi bi-terminal" />
          </div>
          <h3 className="console-empty__title">Ready to explore</h3>
          <p className="console-empty__description">
            Execute JavaScript or JjEL expressions to inspect your model, query data, and test transformations.
          </p>

          <div className="console-empty__quickstart">
            <span className="console-empty__quickstart-label">Quick start</span>
            <div className="console-empty__examples">
              {quickStartExamples.map((example, index) => (
                <button
                  key={index}
                  className="console-empty__example"
                  onClick={() => onExecuteCode?.(example.code)}
                  title={example.description}
                >
                  <code>{example.code}</code>
                  <span>{example.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="console-empty__shortcuts">
            <div className="console-empty__shortcut">
              <kbd>Enter</kbd>
              <span>Execute</span>
            </div>
            <div className="console-empty__shortcut">
              <kbd>↑</kbd><kbd>↓</kbd>
              <span>History</span>
            </div>
            <div className="console-empty__shortcut">
              <kbd>Tab</kbd>
              <span>Autocomplete</span>
            </div>
          </div>
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
