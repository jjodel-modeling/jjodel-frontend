/**
 * Markdown Renderer Component
 * Renders Markdown content with full GFM support and syntax highlighting
 */

import React, { memo, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './MarkdownRenderer.scss';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

// Custom theme based on oneDark but adapted for Jjodie chat
const jjodieCodeTheme = {
    ...oneDark,
    'pre[class*="language-"]': {
        ...oneDark['pre[class*="language-"]'],
        background: '#1e293b', // slate-800
        borderRadius: '0',
        padding: '12px 16px',
        margin: '0',
        fontSize: '13px',
        lineHeight: '1.5',
    },
    'code[class*="language-"]': {
        ...oneDark['code[class*="language-"]'],
        background: 'transparent',
        fontFamily: "'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'Consolas', monospace",
        fontSize: '13px',
    },
};

// Mapping for non-standard languages or aliases
const languageAliases: Record<string, string> = {
    'plantuml': 'java',      // PlantUML uses Java-like syntax
    'puml': 'java',
    'uml': 'java',
    'ts': 'typescript',
    'tsx': 'tsx',
    'js': 'javascript',
    'jsx': 'jsx',
    'sh': 'bash',
    'shell': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'ocl': 'typescript',     // OCL has similar syntax
    'ecore': 'xml',
    'xmi': 'xml',
    'emfatic': 'java',
};

function normalizeLanguage(lang: string | undefined): string {
    if (!lang) return 'text';
    const lower = lang.toLowerCase();
    return languageAliases[lower] || lower;
}

// Code block component with copy button
interface CodeBlockProps {
    language: string;
    code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [code]);

    const lineCount = code.split('\n').length;
    const isSingleLine = lineCount === 1;
    const displayLanguage = language === 'text' ? '' : language.toUpperCase();
    const showLineNumbers = lineCount > 5;

    return (
        <div className={`md-code-block ${isSingleLine ? 'md-code-block--single' : ''}`}>
            {/* Header only for multi-line code */}
            {!isSingleLine && (
                <div className="md-code-header">
                    {displayLanguage && (
                        <span className="md-code-language">{displayLanguage}</span>
                    )}
                    {!displayLanguage && <span />}
                    <button
                        className={`md-code-copy ${copied ? 'copied' : ''}`}
                        onClick={handleCopy}
                        title={copied ? 'Copied!' : 'Copy code'}
                    >
                        {copied ? (
                            <>
                                <i className="bi bi-check2" />
                                <span>Copied</span>
                            </>
                        ) : (
                            <>
                                <i className="bi bi-clipboard" />
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Code with syntax highlighting */}
            <SyntaxHighlighter
                style={jjodieCodeTheme}
                language={language}
                PreTag="div"
                className="md-code-content"
                showLineNumbers={showLineNumbers}
                lineNumberStyle={{
                    minWidth: '2.5em',
                    paddingRight: '1em',
                    color: '#475569',
                    userSelect: 'none',
                }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
};

/**
 * Custom components for ReactMarkdown
 */
const createMarkdownComponents = () => ({
    // Code blocks with syntax highlighting
    code({ inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const language = normalizeLanguage(match?.[1]);
        const codeString = String(children).replace(/\n$/, '');

        // Inline code
        if (inline) {
            return (
                <code className="md-inline-code" {...props}>
                    {children}
                </code>
            );
        }

        // Block code with syntax highlighting
        return <CodeBlock language={language} code={codeString} />;
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
});

// Memoize components to prevent recreation on every render
const markdownComponents = createMarkdownComponents();

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
