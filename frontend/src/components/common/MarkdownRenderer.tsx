/**
 * Markdown Renderer Component
 * Renders Markdown content with full GFM support (tables, strikethrough, etc.)
 */

import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownRenderer.scss';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * Custom components for ReactMarkdown
 */
const markdownComponents = {
    // Code blocks with syntax highlighting placeholder
    code({ inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';

        if (inline) {
            return (
                <code className="md-inline-code" {...props}>
                    {children}
                </code>
            );
        }

        return (
            <div className="md-code-block">
                {language && (
                    <div className="md-code-header">
                        <span className="md-code-language">{language}</span>
                        <button
                            className="md-code-copy"
                            onClick={() => navigator.clipboard.writeText(String(children))}
                            title="Copy code"
                        >
                            <i className="bi bi-clipboard" />
                        </button>
                    </div>
                )}
                <pre className={className}>
                    <code {...props}>{children}</code>
                </pre>
            </div>
        );
    },

    // Tables
    table({ children }: any) {
        return (
            <div className="md-table-wrapper">
                <table className="md-table">{children}</table>
            </div>
        );
    },

    // Links - open in new tab
    a({ href, children }: any) {
        const isExternal = href?.startsWith('http');
        return (
            <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="md-link"
            >
                {children}
                {isExternal && <i className="bi bi-box-arrow-up-right md-external-icon" />}
            </a>
        );
    },

    // Blockquotes
    blockquote({ children }: any) {
        return <blockquote className="md-blockquote">{children}</blockquote>;
    },

    // Lists
    ul({ children }: any) {
        return <ul className="md-list md-list--unordered">{children}</ul>;
    },
    ol({ children }: any) {
        return <ol className="md-list md-list--ordered">{children}</ol>;
    },

    // Task list items (GFM)
    li({ children, className }: any) {
        const isTask = className?.includes('task-list-item');
        return (
            <li className={`md-list-item ${isTask ? 'md-task-item' : ''}`}>
                {children}
            </li>
        );
    },

    // Headings
    h1({ children }: any) {
        return <h1 className="md-heading md-h1">{children}</h1>;
    },
    h2({ children }: any) {
        return <h2 className="md-heading md-h2">{children}</h2>;
    },
    h3({ children }: any) {
        return <h3 className="md-heading md-h3">{children}</h3>;
    },
    h4({ children }: any) {
        return <h4 className="md-heading md-h4">{children}</h4>;
    },

    // Paragraphs
    p({ children }: any) {
        return <p className="md-paragraph">{children}</p>;
    },

    // Horizontal rule
    hr() {
        return <hr className="md-hr" />;
    },

    // Strong/Bold
    strong({ children }: any) {
        return <strong className="md-strong">{children}</strong>;
    },

    // Emphasis/Italic
    em({ children }: any) {
        return <em className="md-em">{children}</em>;
    },

    // Strikethrough (GFM)
    del({ children }: any) {
        return <del className="md-del">{children}</del>;
    },
};

export const MarkdownRenderer = memo(function MarkdownRenderer({
    content,
    className = ''
}: MarkdownRendererProps): JSX.Element {
    return (
        <div className={`markdown-renderer ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
});

export default MarkdownRenderer;
