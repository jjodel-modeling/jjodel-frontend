import React, { useState } from 'react';

interface Shortcut {
  label: string;
  code: string;
  description: string;
}

interface CollapsibleShortcutsProps {
  onInsertCode: (code: string) => void;
  advanced: boolean;
}

const COMMON_SHORTCUTS: Shortcut[] = [
  {
    label: 'Get all classes',
    code: 'data.classes',
    description: 'Access all classes in the current metamodel'
  },
  {
    label: 'Get all packages',
    code: 'data.packages',
    description: 'Access all packages in the current metamodel'
  },
  {
    label: 'Find by name',
    code: 'data.classes.find(c => c.name === "ClassName")',
    description: 'Find a class by name'
  },
  {
    label: 'Filter abstract classes',
    code: 'data.classes.filter(c => c.abstract)',
    description: 'Get all abstract classes'
  },
  {
    label: 'Count attributes',
    code: 'data.classes.reduce((sum, c) => sum + c.attributes.length, 0)',
    description: 'Count total attributes across all classes'
  },
  {
    label: 'Map class names',
    code: 'data.classes.map(c => c.name)',
    description: 'Get array of all class names'
  },
  {
    label: 'Pretty print JSON',
    code: 'JSON.stringify(data, null, 2)',
    description: 'Format data as readable JSON'
  },
  {
    label: 'Get node info',
    code: 'node',
    description: 'Access the currently selected node'
  }
];

export const CollapsibleShortcuts: React.FC<CollapsibleShortcutsProps> = ({
  onInsertCode,
  advanced
}) => {
  const [expanded, setExpanded] = useState(false);

  // Only show in advanced mode
  if (!advanced) {
    return null;
  }

  return (
    <div className="collapsible-section">
      <button
        className="collapsible-section__header"
        onClick={() => setExpanded(!expanded)}
        type="button"
        aria-expanded={expanded}
      >
        <i className={`bi ${expanded ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
        <span>Code shortcuts</span>
        <span className="count">({COMMON_SHORTCUTS.length} available)</span>
      </button>

      {expanded && (
        <div className="collapsible-section__content">
          <div className="shortcuts-list">
            {COMMON_SHORTCUTS.map((shortcut, i) => (
              <button
                key={i}
                className="shortcut-item"
                onClick={() => onInsertCode(shortcut.code)}
                title={shortcut.description}
                type="button"
              >
                <div className="shortcut-item__label">
                  <i className="bi bi-code-slash" />
                  <span>{shortcut.label}</span>
                </div>
                <code className="shortcut-item__code">{shortcut.code}</code>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleShortcuts;
