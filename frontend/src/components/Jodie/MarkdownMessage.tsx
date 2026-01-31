/**
 * Markdown Message Component
 * Renders markdown content with toggle for source view
 */

import React, { useState, useMemo } from 'react';
import './MarkdownMessage.css';

interface MarkdownMessageProps {
    content: string;
    isUser?: boolean;
}

/**
 * Simple markdown parser (no external dependencies)
 * For full markdown support, install react-markdown + remark-gfm
 */
function parseMarkdown(text: string): string {
    let html = text;

    // Escape HTML first to prevent XSS
    html = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks (```language\ncode\n```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        const langClass = lang ? ` language-${lang}` : '';
        return `<pre class="md-code-block${langClass}"><code>${code.trim()}</code></pre>`;
    });

    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

    // Headers (# ## ###)
    html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>');

    // Bold (**text** or __text__)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic (*text* or _text_)
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Strikethrough (~~text~~)
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Links [text](url)
    html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>'
    );

    // Blockquotes (> quote)
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');

    // Horizontal rule (--- or ***)
    html = html.replace(/^(---|\*\*\*)$/gm, '<hr class="md-hr">');

    // Unordered lists (- item)
    html = html.replace(/^- (.+)$/gm, '<li class="md-li">$1</li>');
    html = html.replace(/(<li class="md-li">.*<\/li>\n?)+/g, '<ul class="md-ul">$&</ul>');

    // Ordered lists (1. item)
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="md-li-ordered">$1</li>');
    html = html.replace(/(<li class="md-li-ordered">.*<\/li>\n?)+/g, '<ol class="md-ol">$&</ol>');

    // Paragraphs (double newlines)
    html = html.replace(/\n\n+/g, '</p><p class="md-p">');

    // Single newlines to <br> (except within code blocks)
    html = html.replace(/(?<!<\/pre>)\n(?!<)/g, '<br>');

    // Wrap in paragraph if not starting with block element
    if (!html.match(/^<(h[1-6]|pre|ul|ol|blockquote|hr)/)) {
        html = `<p class="md-p">${html}</p>`;
    }

    return html;
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
    ];

    return patterns.some(pattern => pattern.test(text));
}

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps): JSX.Element {
    const [showSource, setShowSource] = useState(false);

    const hasMarkdown = useMemo(() => hasMarkdownSyntax(content), [content]);
    const renderedHtml = useMemo(() => parseMarkdown(content), [content]);

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
                <div
                    className="md-content"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
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
