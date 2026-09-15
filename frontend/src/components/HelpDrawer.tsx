import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useHelpResolver } from '../hooks/useHelpResolver';
import { JjodelEvents } from '../events/registry';
import './HelpDrawer.scss';

// Local fallback: try fetching from bundled public/docs/help/
async function loadLocalDoc(docPath: string): Promise<string | null> {
    try {
        const res = await fetch(`/docs/help/${docPath}`);
        if (res.ok) return await res.text();
    } catch { /* not available */ }
    return null;
}

/** Prettify helpKey into a readable title */
function keyToTitle(helpKey: string): string {
    return helpKey
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Global help drawer that listens for `jjodel:help-open` events
 * and displays contextual Markdown documentation.
 */
const HelpDrawer: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [helpKey, setHelpKey] = useState<string | null>(null);
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);

    const resolved = useHelpResolver(helpKey);

    // Listen for help-open events
    useEffect(() => {
        const handler = (e: Event) => {
            const key = (e as CustomEvent<{ helpKey: string }>).detail.helpKey;
            setHelpKey(key);
            setIsOpen(true);
        };
        window.addEventListener(JjodelEvents.HELP_OPEN, handler);
        return () => window.removeEventListener(JjodelEvents.HELP_OPEN, handler);
    }, []);

    // Fetch content when helpKey changes
    // Use resolved?.url (string) as dep — stable across renders unlike the object ref
    const resolvedUrl = resolved?.url ?? null;
    const resolvedPath = resolved?.path ?? null;

    useEffect(() => {
        if (!isOpen || !resolvedUrl || !resolvedPath) return;

        let cancelled = false;
        setLoading(true);
        setError(false);
        setContent(null);

        const fetchContent = async () => {
            // Try GitHub first
            try {
                const res = await fetch(resolvedUrl);
                if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
                const text = await res.text();
                if (!cancelled) { setContent(text); setLoading(false); }
                return;
            } catch { /* fallback to local */ }

            // Fallback: local docs
            const localText = await loadLocalDoc(resolvedPath);
            if (localText) {
                if (!cancelled) { setContent(localText); setLoading(false); }
                return;
            }

            if (!cancelled) { setError(true); setLoading(false); }
        };

        fetchContent();
        return () => { cancelled = true; };
    }, [isOpen, resolvedUrl, resolvedPath]);

    // F1 or Cmd+/ — open with default key (always active, regardless of drawer state)
    useEffect(() => {
        const handleF1 = (e: KeyboardEvent) => {
            const isCmdSlash = (e.key === '/' && e.metaKey);
            const isF1 = e.key === 'F1';
            if (!isCmdSlash && !isF1) return;
            e.preventDefault();
            window.dispatchEvent(
                new CustomEvent(JjodelEvents.HELP_OPEN, { detail: { helpKey: 'properties-panel' } })
            );
        };
        window.addEventListener('keydown', handleF1, true);
        return () => window.removeEventListener('keydown', handleF1, true);
    }, []);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) setIsOpen(false);
    }, []);

    const handleClose = useCallback(() => setIsOpen(false), []);

    if (!isOpen) return null;

    const title = helpKey ? keyToTitle(helpKey) : 'Help';
    const webUrl = resolved?.webUrl ?? 'https://github.com/jjodel-modeling/jjodel-docs';

    return (
        <div className="jj-help-overlay" onClick={handleOverlayClick}>
            <div className="jj-help-drawer" ref={drawerRef}>
                <div className="jj-help-drawer__header">
                    <div className="jj-help-drawer__title-row">
                        <i className="bi bi-question-circle-fill" />
                        <span className="jj-help-drawer__title">{title}</span>
                    </div>
                    <div className="jj-help-drawer__header-actions">
                        <a
                            className="jj-help-drawer__docs-link"
                            href={webUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open full documentation"
                        >
                            <i className="bi bi-box-arrow-up-right" />
                        </a>
                        <button
                            className="jj-help-drawer__close"
                            onClick={handleClose}
                            aria-label="Close help"
                            type="button"
                        >
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                </div>

                <div className="jj-help-drawer__body">
                    {loading && (
                        <div className="jj-help-drawer__loading">
                            <div className="spinner-border spinner-border-sm" role="status" />
                            <span>Loading documentation...</span>
                        </div>
                    )}

                    {error && (
                        <div className="jj-help-drawer__error">
                            <i className="bi bi-exclamation-triangle" />
                            <p>Documentation not available.</p>
                            <a
                                href={webUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Visit the documentation repository
                            </a>
                        </div>
                    )}

                    {content && (
                        <div className="jj-help-drawer__content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HelpDrawer;
