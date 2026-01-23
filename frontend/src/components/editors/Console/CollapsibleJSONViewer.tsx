import React, { useState } from 'react';

interface CollapsibleJSONProps {
  data: any;
  path?: string[];
  collapsed?: Set<string>;
  onToggle?: (path: string[]) => void;
}

/**
 * CollapsibleJSONViewer - Renders JSON data with collapsible nested objects/arrays
 *
 * Features:
 * - Collapsible objects and arrays
 * - Syntax highlighting for different types
 * - Preserves JSON formatting
 * - Shows item/property counts when collapsed
 */
export const CollapsibleJSONViewer: React.FC<CollapsibleJSONProps> = ({
  data,
  path = [],
  collapsed = new Set(),
  onToggle = () => {}
}) => {
  // Handle null and undefined
  if (data === null) {
    return <span className="json-null">null</span>;
  }
  if (data === undefined) {
    return <span className="json-undefined">undefined</span>;
  }

  const type = typeof data;

  // Primitives - direct rendering
  if (type === 'string') {
    return <span className="json-string">"{data}"</span>;
  }
  if (type === 'number') {
    return <span className="json-number">{data}</span>;
  }
  if (type === 'boolean') {
    return <span className="json-boolean">{data.toString()}</span>;
  }

  // Objects and Arrays - collapsible rendering
  const isArray = Array.isArray(data);
  const pathKey = path.join('.');
  const isCollapsed = collapsed.has(pathKey);
  const hasContent = isArray ? data.length > 0 : Object.keys(data).length > 0;

  // Empty object/array - no collapse needed
  if (!hasContent) {
    return (
      <span className="json-bracket">
        {isArray ? '[]' : '{}'}
      </span>
    );
  }

  return (
    <span className="json-collapsible">
      {/* Toggle button */}
      <button
        className="json-toggle"
        onClick={() => onToggle(path)}
        type="button"
        aria-label={isCollapsed ? 'Expand' : 'Collapse'}
      >
        <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-down'}`} />
      </button>

      {/* Opening bracket */}
      <span className="json-bracket">{isArray ? '[' : '{'}</span>

      {isCollapsed ? (
        // Collapsed state - show count
        <span className="json-collapsed">
          {isArray
            ? `${data.length} item${data.length !== 1 ? 's' : ''}`
            : `${Object.keys(data).length} propert${Object.keys(data).length !== 1 ? 'ies' : 'y'}`
          }
        </span>
      ) : (
        // Expanded state - show content
        <div className="json-content">
          {isArray ? (
            // Array items
            data.map((item: any, index: number) => (
              <div key={index} className="json-line">
                <CollapsibleJSONViewer
                  data={item}
                  path={[...path, String(index)]}
                  collapsed={collapsed}
                  onToggle={onToggle}
                />
                {index < data.length - 1 && <span className="json-comma">,</span>}
              </div>
            ))
          ) : (
            // Object properties
            Object.entries(data).map(([key, value], index, arr) => (
              <div key={key} className="json-line">
                <span className="json-key">"{key}"</span>
                <span className="json-colon">: </span>
                <CollapsibleJSONViewer
                  data={value}
                  path={[...path, key]}
                  collapsed={collapsed}
                  onToggle={onToggle}
                />
                {index < arr.length - 1 && <span className="json-comma">,</span>}
              </div>
            ))
          )}
        </div>
      )}

      {/* Closing bracket */}
      <span className="json-bracket">{isArray ? ']' : '}'}</span>
    </span>
  );
};

interface RootJSONViewerProps {
  content: string;
}

/**
 * RootJSONViewer - Root wrapper that manages collapse state
 */
export const RootJSONViewer: React.FC<RootJSONViewerProps> = ({ content }) => {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const handleToggle = (path: string[]) => {
    const pathKey = path.join('.');
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(pathKey)) {
        next.delete(pathKey);
      } else {
        next.add(pathKey);
      }
      return next;
    });
  };

  try {
    // Try to parse as JSON
    const parsed = JSON.parse(content);

    return (
      <div className="json-viewer">
        <CollapsibleJSONViewer
          data={parsed}
          path={[]}
          collapsed={collapsed}
          onToggle={handleToggle}
        />
      </div>
    );
  } catch {
    // If not valid JSON, fall back to plain text
    // Check if it's HTML from the old system
    if (content.includes('<')) {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }
    // Otherwise just display as-is
    return <>{content}</>;
  }
};

export default RootJSONViewer;
