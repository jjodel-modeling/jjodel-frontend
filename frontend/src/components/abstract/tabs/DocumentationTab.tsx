/**
 * Documentation Tab Component
 * Displays auto-generated Markdown documentation with edit support
 *
 * Features:
 * - View/Edit/Source modes
 * - Outdated indicator when project changes after generation
 * - Intelligent regeneration that preserves user sections
 * - Section markers for AUTO vs USER content
 */

import React, { Dispatch, ReactElement, ReactNode, useMemo, useState, useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { DState, LProject, LUser, DUser, LModel } from '../../../joiner';
import type { FakeStateProps } from '../../../joiner/types';
import { JjodieContextService, DocumentationData } from '../../../services/JjodieContext';
import {
    DocumentationStatus,
    ProjectDocumentation,
    DOCUMENTATION_STORAGE_PREFIX
} from '../../../types/jodie';
import './DocumentationTab.scss';

// ============================================
// MARKDOWN PARSER
// ============================================

function parseMarkdown(text: string): string {
    let html = text;

    // Remove section markers for rendered view
    html = html.replace(/<!-- JJODIE:(AUTO|USER):START:\S+ -->\n?/g, '');
    html = html.replace(/<!-- JJODIE:(AUTO|USER):END:\S+ -->\n?/g, '');

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

    // Tables - process before lists
    const tableRegex = /(\|.+\|\r?\n)+/g;
    html = html.replace(tableRegex, (table) => {
        const rows = table.trim().split('\n');
        if (rows.length < 2) return table;

        let tableHtml = '<table class="md-table">';

        rows.forEach((row, i) => {
            // Skip separator row (|---|---|)
            if (row.match(/^\|[\s-:|]+\|$/)) return;

            const cells = row.split('|').filter(cell => cell.trim() !== '');
            const tag = i === 0 ? 'th' : 'td';
            const rowClass = i === 0 ? 'md-table-header' : 'md-table-row';

            tableHtml += `<tr class="${rowClass}">`;
            cells.forEach(cell => {
                tableHtml += `<${tag} class="md-table-cell">${cell.trim()}</${tag}>`;
            });
            tableHtml += '</tr>';
        });

        tableHtml += '</table>';
        return tableHtml;
    });

    // Unordered lists (- item)
    html = html.replace(/^- (.+)$/gm, '<li class="md-li">$1</li>');
    html = html.replace(/(<li class="md-li">.*<\/li>\n?)+/g, '<ul class="md-ul">$&</ul>');

    // Ordered lists (1. item)
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="md-li-ordered">$1</li>');
    html = html.replace(/(<li class="md-li-ordered">.*<\/li>\n?)+/g, '<ol class="md-ol">$&</ol>');

    // Paragraphs (double newlines)
    html = html.replace(/\n\n+/g, '</p><p class="md-p">');

    // Single newlines to <br> (except within code blocks and tables)
    html = html.replace(/(?<!<\/pre>|<\/table>)\n(?!<)/g, '<br>');

    // Wrap in paragraph if not starting with block element
    if (!html.match(/^<(h[1-6]|pre|ul|ol|blockquote|hr|table)/)) {
        html = `<p class="md-p">${html}</p>`;
    }

    return html;
}

// ============================================
// STORAGE HELPERS
// ============================================

function getStorageKey(projectId: string): string {
    return `${DOCUMENTATION_STORAGE_PREFIX}${projectId}`;
}

function loadDocumentation(projectId: string): ProjectDocumentation | null {
    try {
        const stored = localStorage.getItem(getStorageKey(projectId));
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (err) {
        console.warn('Failed to load documentation from storage:', err);
    }
    return null;
}

function saveDocumentation(projectId: string, doc: ProjectDocumentation): void {
    try {
        localStorage.setItem(getStorageKey(projectId), JSON.stringify(doc));
    } catch (err) {
        console.warn('Failed to save documentation to storage:', err);
    }
}

// ============================================
// STATUS HELPERS
// ============================================

function getDocumentationStatus(
    doc: ProjectDocumentation | null,
    currentHash: string,
    isEditing: boolean
): DocumentationStatus {
    if (isEditing) return 'editing';
    if (!doc) return 'never_generated';
    if (doc.projectHash !== currentHash) return 'outdated';
    return 'up_to_date';
}

function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// ============================================
// REGENERATE MODAL
// ============================================

interface RegenerateModalProps {
    autoSections: string[];
    userSections: { id: string; lastModified?: number }[];
    onConfirm: () => void;
    onCancel: () => void;
}

function RegenerateModal({ autoSections, userSections, onConfirm, onCancel }: RegenerateModalProps) {
    return (
        <div className="regenerate-modal-overlay" onClick={onCancel}>
            <div className="regenerate-modal" onClick={e => e.stopPropagation()}>
                <div className="regenerate-modal-header">
                    <i className="bi bi-arrow-repeat" />
                    <h3>Regenerate Documentation?</h3>
                </div>
                <div className="regenerate-modal-content">
                    {autoSections.length > 0 && (
                        <div className="section-list">
                            <p className="section-list-title">
                                <i className="bi bi-arrow-clockwise" />
                                The following sections will be <strong>updated</strong>:
                            </p>
                            <ul>
                                {autoSections.map(id => (
                                    <li key={id}>{id}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {userSections.length > 0 && (
                        <div className="section-list section-list-preserved">
                            <p className="section-list-title">
                                <i className="bi bi-shield-check" />
                                The following sections will be <strong>preserved</strong>:
                            </p>
                            <ul>
                                {userSections.map(({ id, lastModified }) => (
                                    <li key={id}>
                                        {id}
                                        {lastModified && (
                                            <span className="modified-time">
                                                (modified {formatTimeAgo(lastModified)})
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="regenerate-modal-actions">
                    <button className="modal-btn modal-btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="modal-btn modal-btn-primary" onClick={onConfirm}>
                        <i className="bi bi-arrow-repeat" />
                        Regenerate
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

type ViewMode = 'formatted' | 'source' | 'edit';

function DocumentationTabComponent(props: AllProps) {
    const { project } = props;

    // View mode: formatted, source, or edit
    const [viewMode, setViewMode] = useState<ViewMode>('formatted');

    // Copy status
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    // Documentation state
    const [documentation, setDocumentation] = useState<ProjectDocumentation | null>(null);

    // Edit content (separate from saved documentation)
    const [editContent, setEditContent] = useState('');

    // Show regenerate confirmation modal
    const [showRegenerateModal, setShowRegenerateModal] = useState(false);

    // Generating state
    const [isGenerating, setIsGenerating] = useState(false);

    // Calculate project hash for change detection
    const projectHash = useMemo(() => {
        if (!project) return '';
        return JjodieContextService.getProjectHash(project);
    }, [project]);

    // Load documentation from storage on mount
    useEffect(() => {
        if (project?.id) {
            const stored = loadDocumentation(project.id);
            setDocumentation(stored);
            if (stored) {
                setEditContent(stored.content);
            }
        }
    }, [project?.id]);

    // Get current status
    const status = getDocumentationStatus(documentation, projectHash, viewMode === 'edit');

    // Parse sections from documentation
    const sections = useMemo(() => {
        if (!documentation) return { auto: [], user: [] };
        return JjodieContextService.parseSections(documentation.content);
    }, [documentation]);

    // Parse markdown to HTML
    const renderedHtml = useMemo(() => {
        const content = viewMode === 'edit' ? editContent : (documentation?.content || '');
        return parseMarkdown(content);
    }, [documentation?.content, editContent, viewMode]);

    // Generate initial documentation
    const handleGenerate = useCallback(async () => {
        if (!project) return;

        setIsGenerating(true);
        try {
            const docData = await JjodieContextService.generateDocumentationWithSections(project);
            const newDoc: ProjectDocumentation = {
                content: docData.content,
                generatedAt: Date.now(),
                projectHash: projectHash,
                sections: docData.sections,
            };
            setDocumentation(newDoc);
            setEditContent(docData.content);
            saveDocumentation(project.id, newDoc);
        } catch (err) {
            console.error('Failed to generate documentation:', err);
        } finally {
            setIsGenerating(false);
        }
    }, [project, projectHash]);

    // Regenerate with preservation of user sections
    const handleRegenerate = useCallback(async () => {
        if (!project || !documentation) return;

        setShowRegenerateModal(false);
        setIsGenerating(true);

        try {
            const newDocData = await JjodieContextService.regenerateDocumentation(
                project,
                documentation.content
            );
            const newDoc: ProjectDocumentation = {
                content: newDocData.content,
                generatedAt: Date.now(),
                lastManualEdit: documentation.lastManualEdit,
                projectHash: projectHash,
                sections: newDocData.sections,
            };
            setDocumentation(newDoc);
            setEditContent(newDocData.content);
            saveDocumentation(project.id, newDoc);
        } catch (err) {
            console.error('Failed to regenerate documentation:', err);
        } finally {
            setIsGenerating(false);
        }
    }, [project, documentation, projectHash]);

    // Save edited content
    const handleSaveEdit = useCallback(() => {
        if (!project || !documentation) return;

        // Mark any modified sections as USER type
        const updatedSections = JjodieContextService.parseSections(editContent);
        const newDoc: ProjectDocumentation = {
            ...documentation,
            content: editContent,
            lastManualEdit: Date.now(),
            sections: [
                ...updatedSections.auto.map(s => ({ ...s, type: 'AUTO' as const })),
                ...updatedSections.user.map(s => ({ ...s, type: 'USER' as const })),
            ],
        };
        setDocumentation(newDoc);
        saveDocumentation(project.id, newDoc);
        setViewMode('formatted');
    }, [project, documentation, editContent]);

    // Cancel edit
    const handleCancelEdit = useCallback(() => {
        if (documentation) {
            setEditContent(documentation.content);
        }
        setViewMode('formatted');
    }, [documentation]);

    // Copy to clipboard
    const handleCopy = useCallback(async () => {
        const content = documentation?.content || '';
        try {
            await navigator.clipboard.writeText(content);
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [documentation]);

    // Download as file
    const handleDownload = useCallback(() => {
        if (!project || !documentation) return;
        const filename = `${project.name || 'metamodel'}-documentation.md`;
        const blob = new Blob([documentation.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [project, documentation]);

    // Show regenerate modal
    const handleShowRegenerateModal = useCallback(() => {
        setShowRegenerateModal(true);
    }, []);

    // ========================================
    // RENDER
    // ========================================

    // No project loaded
    if (!project) {
        return (
            <div className="documentation-tab documentation-empty">
                <div className="empty-state">
                    <i className="bi bi-file-text" />
                    <h3>No Project Loaded</h3>
                    <p>Load a project to generate documentation.</p>
                </div>
            </div>
        );
    }

    // No documentation generated yet
    if (!documentation && status === 'never_generated') {
        return (
            <div className="documentation-tab documentation-empty">
                <div className="empty-state">
                    <i className="bi bi-file-earmark-text" />
                    <h3>No Documentation Yet</h3>
                    <p>Generate documentation for your metamodel to get started.</p>
                    <button
                        className="generate-btn"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <>
                                <i className="bi bi-arrow-repeat spinning" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-magic" />
                                Generate Documentation
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="documentation-tab">
            {/* Toolbar */}
            <div className="documentation-toolbar">
                <div className="toolbar-left">
                    <h2 className="toolbar-title">
                        <i className="bi bi-file-text" />
                        Documentation
                    </h2>
                    <span className="toolbar-subtitle">
                        {project.name || 'Metamodel'}
                    </span>

                    {/* Status Badge */}
                    {status === 'outdated' && (
                        <span className="status-badge status-outdated" title="Project has been modified since documentation was generated">
                            <i className="bi bi-exclamation-triangle" />
                            Outdated
                        </span>
                    )}
                    {status === 'up_to_date' && (
                        <span className="status-badge status-synced" title="Documentation is up to date">
                            <i className="bi bi-check-circle" />
                            Synced
                        </span>
                    )}
                    {status === 'editing' && (
                        <span className="status-badge status-editing" title="Currently editing">
                            <i className="bi bi-pencil" />
                            Editing
                        </span>
                    )}
                </div>

                <div className="toolbar-right">
                    {viewMode === 'edit' ? (
                        <>
                            <button className="toolbar-btn" onClick={handleCancelEdit}>
                                <i className="bi bi-x-lg" />
                                <span>Cancel</span>
                            </button>
                            <button className="toolbar-btn toolbar-btn-primary" onClick={handleSaveEdit}>
                                <i className="bi bi-check-lg" />
                                <span>Save</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="toolbar-btn"
                                onClick={() => setViewMode('edit')}
                                title="Edit documentation"
                            >
                                <i className="bi bi-pencil" />
                                <span>Edit</span>
                            </button>
                            <button
                                className={`toolbar-btn ${status === 'outdated' ? 'toolbar-btn-warning' : ''}`}
                                onClick={handleShowRegenerateModal}
                                disabled={isGenerating}
                                title="Regenerate documentation"
                            >
                                <i className={`bi bi-arrow-repeat ${isGenerating ? 'spinning' : ''}`} />
                                <span>{isGenerating ? 'Generating...' : 'Regenerate'}</span>
                            </button>
                            <button
                                className="toolbar-btn"
                                onClick={() => setViewMode(viewMode === 'source' ? 'formatted' : 'source')}
                                title={viewMode === 'source' ? 'Show formatted' : 'Show markdown source'}
                            >
                                <i className={`bi ${viewMode === 'source' ? 'bi-eye' : 'bi-code-slash'}`} />
                                <span>{viewMode === 'source' ? 'Formatted' : 'Markdown'}</span>
                            </button>
                            <button
                                className="toolbar-btn"
                                onClick={handleCopy}
                                title="Copy to clipboard"
                            >
                                <i className={`bi ${copyStatus === 'copied' ? 'bi-check' : 'bi-clipboard'}`} />
                                <span>{copyStatus === 'copied' ? 'Copied!' : 'Copy'}</span>
                            </button>
                            <button
                                className="toolbar-btn toolbar-btn-primary"
                                onClick={handleDownload}
                                title="Download as .md file"
                            >
                                <i className="bi bi-download" />
                                <span>Download</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="documentation-content">
                {viewMode === 'edit' ? (
                    <textarea
                        className="documentation-editor"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Write your documentation in Markdown..."
                        spellCheck={false}
                    />
                ) : viewMode === 'source' ? (
                    <pre className="documentation-source">
                        <code>{documentation?.content || ''}</code>
                    </pre>
                ) : (
                    <div
                        className="documentation-rendered md-content"
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                )}
            </div>

            {/* Footer with metadata */}
            {documentation && viewMode !== 'edit' && (
                <div className="documentation-footer">
                    <span>Generated {formatTimeAgo(documentation.generatedAt)}</span>
                    {documentation.lastManualEdit && (
                        <span>Last edited {formatTimeAgo(documentation.lastManualEdit)}</span>
                    )}
                </div>
            )}

            {/* Regenerate confirmation modal */}
            {showRegenerateModal && (
                <RegenerateModal
                    autoSections={sections.auto.map(s => s.id)}
                    userSections={sections.user.map(s => ({ id: s.id, lastModified: s.lastModified }))}
                    onConfirm={handleRegenerate}
                    onCancel={() => setShowRegenerateModal(false)}
                />
            )}
        </div>
    );
}

// ============================================
// REDUX CONNECTION
// ============================================

interface OwnProps {
    modelid?: string;
}
interface StateProps {
    project: LProject | null;
    model: LModel | null;
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = { project: null, model: null } as FakeStateProps;
    try {
        const luser = LUser.fromPointer(DUser.current, state) as any as LUser;
        ret.project = luser?.project as LProject || null;

        // If modelid provided, get that specific model
        if (ownProps.modelid) {
            ret.model = LModel.fromPointer(ownProps.modelid, state) as LModel;
        }
    } catch (err) {
        console.warn('DocumentationTab mapStateToProps error:', err);
    }
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const DocumentationTabConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(DocumentationTabComponent);

export const DocumentationTab = (props: OwnProps, children: ReactNode[] = []): ReactElement => {
    // @ts-ignore children
    return <DocumentationTabConnected {...{ ...props, children }} />;
};

export default DocumentationTab;
