/**
 * Markdown Message Component
 * Renders markdown content with toggle for source view
 * Uses react-markdown with remark-gfm for full GFM support (tables, strikethrough, etc.)
 */

import React, { useState, useMemo } from 'react';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import type { ScriptLineResult } from '../../jjscript';
import './MarkdownMessage.css';

interface MarkdownMessageProps {
    content: string;
    isUser?: boolean;
    /** Optional callback to execute JjScript commands */
    onJjScriptExecute?: (commands: string[]) => Promise<ScriptLineResult[]>;
}

/**
 * Check if content contains markdown syntax
 */
function hasMarkdownSyntax(text: string): boolean {
    const patterns = [
        /\*\*[^*]+\*\*/,          // Bold
        /\*[^*]+\*/,               // Italic
        /`[^`]+`/,                 // Inline code
        /```[\s\S]*?```/,          // Code block
        /^#{1,3}\s/m,              // Headers
        /\[.+\]\(.+\)/,            // Links
        /^- /m,                    // Unordered list
        /^\d+\. /m,                // Ordered list
        /^>/m,                     // Blockquote
        /\|.+\|/,                  // Tables
        /~~[^~]+~~/,               // Strikethrough
    ];

    return patterns.some(pattern => pattern.test(text));
}

export function MarkdownMessage({ content, isUser = false, onJjScriptExecute }: MarkdownMessageProps): JSX.Element {
    const [showSource, setShowSource] = useState(false);

    const hasMarkdown = useMemo(() => hasMarkdownSyntax(content), [content]);

    // For user messages or non-markdown content, just show plain text
    if (isUser || !hasMarkdown) {
        return <div className="md-plain-text">{content}</div>;
    }

    return (
        <div className="md-message-wrapper">
            {showSource ? (
                <pre className="md-source">
                    <code>{content}</code>
                </pre>
            ) : (
                <MarkdownRenderer
                    content={content}
                    className="md-content"
                    onJjScriptExecute={onJjScriptExecute}
                />
            )}

            {/* Toggle button for markdown content */}
            <button
                className="md-toggle-btn"
                onClick={() => setShowSource(!showSource)}
                title={showSource ? 'Show formatted' : 'Show source'}
            >
                <i className={`bi ${showSource ? 'bi-eye' : 'bi-code-slash'}`} />
                <span>{showSource ? 'Formatted' : 'Source'}</span>
            </button>
        </div>
    );
}

export default MarkdownMessage;
