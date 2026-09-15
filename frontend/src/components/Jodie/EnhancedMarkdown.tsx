/**
 * Enhanced Markdown Component
 * Proper rendering with syntax highlighting and fixed list numbering
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import './EnhancedMarkdown.css';

/**
 * Render metamodel syntax with highlighting
 * Highlights keywords, types, symbols, and comments
 */
function renderMetamodelSyntax(code: string): React.ReactNode[] {
    const lines = code.trim().split('\n');

    return lines.map((line, lineIndex) => {
        const elements: React.ReactNode[] = [];
        let remaining = line;
        let key = 0;

        // Handle metamodel name [Name]
        const nameMatch = remaining.match(/^\[(\w+)\]$/);
        if (nameMatch) {
            return (
                <div key={lineIndex} className="mm-line">
                    <span className="mm-bracket">[</span>
                    <span className="mm-metamodel-name">{nameMatch[1]}</span>
                    <span className="mm-bracket">]</span>
                </div>
            );
        }

        // Handle comments // ...
        const commentMatch = remaining.match(/(.*?)(\/\/.*)$/);
        let commentPart = '';
        if (commentMatch) {
            remaining = commentMatch[1];
            commentPart = commentMatch[2];
        }

        // Handle keywords at start of line
        const keywordPatterns = [
            { regex: /^(\s*)(abstract\s+metaclass)(\s+)/, type: 'keyword' },
            { regex: /^(\s*)(metaclass)(\s+)/, type: 'keyword' },
            { regex: /^(\s*)(extends)(\s+)/, type: 'keyword' },
        ];

        for (const pattern of keywordPatterns) {
            const match = remaining.match(pattern.regex);
            if (match) {
                if (match[1]) elements.push(<span key={key++}>{match[1]}</span>);
                elements.push(<span key={key++} className="mm-keyword">{match[2]}</span>);
                if (match[3]) elements.push(<span key={key++}>{match[3]}</span>);
                remaining = remaining.slice(match[0].length);

                // Next word is class name
                const classMatch = remaining.match(/^(\w+)(.*)/);
                if (classMatch) {
                    elements.push(<span key={key++} className="mm-class-name">{classMatch[1]}</span>);
                    remaining = classMatch[2];
                }
                break;
            }
        }

        // Handle attribute/reference lines: + attr: Type [mult]
        const attrMatch = remaining.match(/^(\s*)([+>-])\s+(\w+):\s*(\w+)(\s*\[.*?\])?(.*)$/);
        if (attrMatch) {
            const [, indent, symbol, attrName, typeName, multiplicity, rest] = attrMatch;
            if (indent) elements.push(<span key={key++}>{indent}</span>);

            // Symbol with different colors
            const symbolClass = symbol === '+' ? 'mm-attr-symbol' :
                               symbol === '>' ? 'mm-containment-symbol' :
                               'mm-reference-symbol';
            elements.push(<span key={key++} className={symbolClass}>{symbol}</span>);
            elements.push(<span key={key++}> </span>);
            elements.push(<span key={key++} className="mm-attr-name">{attrName}</span>);
            elements.push(<span key={key++} className="mm-punctuation">:</span>);
            elements.push(<span key={key++}> </span>);
            elements.push(<span key={key++} className="mm-type">{typeName}</span>);
            if (multiplicity) {
                elements.push(<span key={key++} className="mm-multiplicity">{multiplicity}</span>);
            }
            if (rest) elements.push(<span key={key++}>{rest}</span>);
            remaining = '';
        }

        // Add any remaining text
        if (remaining) {
            elements.push(<span key={key++}>{remaining}</span>);
        }

        // Add comment if present
        if (commentPart) {
            elements.push(<span key={key++} className="mm-comment">{commentPart}</span>);
        }

        return (
            <div key={lineIndex} className="mm-line">
                {elements.length > 0 ? elements : '\u00A0'}
            </div>
        );
    });
}

interface EnhancedMarkdownProps {
    content: string;
    className?: string;
}

export const EnhancedMarkdown: React.FC<EnhancedMarkdownProps> = ({
    content,
    className = '',
}) => {
    return (
        <div className={`enhanced-markdown ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    // Headings
                    h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
                    h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
                    h3: ({ children }) => <h3 className="md-h3">{children}</h3>,

                    // Paragraphs
                    p: ({ children }) => <p className="md-paragraph">{children}</p>,

                    // CRITICAL FIX: Proper list rendering
                    ol: ({ children, start, ...props }) => (
                        <ol className="md-ordered-list" start={start} {...props}>
                            {children}
                        </ol>
                    ),
                    ul: ({ children }) => <ul className="md-unordered-list">{children}</ul>,
                    li: ({ children }) => (
                        <li className="md-list-item">{children}</li>
                    ),

                    // Code - inline and blocks
                    code: ({ inline, className, children, ...props }: any) => {
                        if (inline) {
                            return (
                                <code className="md-code-inline" {...props}>
                                    {children}
                                </code>
                            );
                        }

                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';

                        // Special handling for metamodel language
                        if (language === 'metamodel') {
                            return (
                                <div className="md-metamodel-block">
                                    <div className="md-metamodel-header">
                                        <i className="bi bi-diagram-3"></i>
                                        <span>Metamodel Structure</span>
                                    </div>
                                    <pre className="md-metamodel-code">
                                        <code {...props}>
                                            {renderMetamodelSyntax(String(children))}
                                        </code>
                                    </pre>
                                </div>
                            );
                        }

                        return (
                            <div className="md-code-block-wrapper">
                                {language && (
                                    <div className="md-code-language">
                                        <i className="bi bi-code-slash"></i>
                                        <span>{language}</span>
                                    </div>
                                )}
                                <pre className="md-code-block">
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                </pre>
                            </div>
                        );
                    },

                    // Links
                    a: ({ href, children }) => (
                        <a
                            className="md-link"
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {children}
                        </a>
                    ),

                    // Strong/Bold
                    strong: ({ children }) => <strong className="md-strong">{children}</strong>,

                    // Emphasis/Italic
                    em: ({ children }) => <em className="md-em">{children}</em>,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default EnhancedMarkdown;
