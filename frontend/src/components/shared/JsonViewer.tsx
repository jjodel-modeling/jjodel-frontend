import React from 'react';
import { JsonView, darkStyles, defaultStyles, collapseAllNested, allExpanded } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

// Compatibility wrapper replacing the deprecated react-json-view library.
// Accepts the same props used in the codebase so call sites need minimal changes.

interface JsonViewerProps {
    src: object | null | undefined;
    collapsed?: boolean | number;
    collapseStringsAfterLength?: number; // not supported by react-json-view-lite, accepted for compatibility
    displayDataTypes?: boolean;          // not supported, accepted for compatibility
    displayObjectSize?: boolean;         // not supported, accepted for compatibility
    enableClipboard?: boolean;           // not supported natively, accepted for compatibility
    groupArraysAfterLength?: number;     // not supported, accepted for compatibility
    indentWidth?: number;                // not supported, accepted for compatibility
    iconStyle?: string;                  // not supported, accepted for compatibility
    name?: string | false | null;
    quotesOnKeys?: boolean;              // not supported, accepted for compatibility
    shouldCollapse?: boolean | ((field: any) => boolean);
    sortKeys?: boolean;                  // not supported, accepted for compatibility
    theme?: string;
    style?: React.CSSProperties;
    className?: string;
}

const JsonViewer: React.FC<JsonViewerProps> = ({
    src,
    collapsed = false,
    name,
    theme,
    style,
    className,
}) => {
    // Determine whether to use dark styles based on theme name or current CSS variables
    const isDark = theme ? theme.includes('dark') || theme === 'rjv-default' : true;
    const baseStyle = isDark ? darkStyles : defaultStyles;

    // Map the `collapsed` prop: number means "collapse at that depth", true = collapse all
    let shouldExpandNode: (level: number, value: any, field?: string) => boolean;
    if (collapsed === true) {
        shouldExpandNode = () => false;
    } else if (typeof collapsed === 'number' && collapsed > 0) {
        // collapsed={1} → expand only root (level 0), collapse the rest
        shouldExpandNode = collapseAllNested;
    } else {
        // collapsed={false} or collapsed={0} → expand everything
        shouldExpandNode = allExpanded;
    }

    if (src === null || src === undefined) {
        return <span className="react-json-view" style={style}>null</span>;
    }

    return (
        <div className={`react-json-view${className ? ' ' + className : ''}`} style={style}>
            {name ? <span style={{ fontWeight: 'bold', marginRight: 6 }}>{name}:</span> : null}
            <JsonView
                data={src}
                style={baseStyle}
                shouldExpandNode={shouldExpandNode}
                clickToExpandNode
            />
        </div>
    );
};

export default JsonViewer;
