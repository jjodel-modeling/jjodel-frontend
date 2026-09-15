import React, { useState } from 'react';

interface CollapsibleContextKeysProps {
  contextKeys: string[];
  onInsertKey: (key: string) => void;
}

export const CollapsibleContextKeys: React.FC<CollapsibleContextKeysProps> = ({
  contextKeys,
  onInsertKey
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (contextKeys.length === 0) {
    return null;
  }

  const visibleKeys = showAll ? contextKeys : contextKeys.slice(0, 8);

  return (
    <div className="collapsible-section">
      <button
        className="collapsible-section__header"
        onClick={() => setExpanded(!expanded)}
        type="button"
        aria-expanded={expanded}
      >
        <i className={`bi ${expanded ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
        <span>Context keys</span>
        <span className="count">({contextKeys.length} available)</span>
      </button>

      {expanded && (
        <div className="collapsible-section__content">
          <div className="context-keys-grid">
            {visibleKeys.map(key => (
              <button
                key={key}
                className="context-key"
                onClick={() => onInsertKey(key)}
                title={`Click to insert "${key}"`}
                type="button"
              >
                {key}
              </button>
            ))}

            {!showAll && contextKeys.length > 8 && (
              <button
                className="context-key context-key--show-more"
                onClick={() => setShowAll(true)}
                type="button"
              >
                +{contextKeys.length - 8} more
              </button>
            )}

            {showAll && contextKeys.length > 8 && (
              <button
                className="context-key context-key--show-less"
                onClick={() => setShowAll(false)}
                type="button"
              >
                Show less
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleContextKeys;
