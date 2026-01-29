/**
 * Documentation Tab Component
 * Displays auto-generated Markdown documentation with edit support
 *
 * Features:
 * - View/Edit/Source modes
 * - @protected ... @end tags for preserving user content on regeneration
 * - Confidence indicator (0-100%) showing documentation reliability
 * - Outdated indicator when project changes after generation
 * - Intelligent regeneration that preserves protected sections
 * - Export to Markdown and PDF
 */

import React, { Dispatch, ReactElement, ReactNode, useMemo, useState, useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { DState, LProject, LUser, DUser, LModel } from '../../../joiner';
import type { FakeStateProps } from '../../../joiner/types';
import { JjodieContextService, DocumentationData } from '../../../services/JjodieContext';
import {
    DocumentationStatus,
    ProjectDocumentation,
    DOCUMENTATION_STORAGE_PREFIX,
    ConfidenceScore,
} from '../../../types/jodie';
import './DocumentationTab.scss';

// ============================================
// CONSTANTS - Protected Section Tags
// ============================================

const PROTECTED_TAG_START = '@protected';
const PROTECTED_TAG_END = '@end';

// ============================================
// MARKDOWN PARSER
// ============================================

function parseMarkdown(text: string): string {
    let html = text;

    // Remove old section markers for backward compatibility
    html = html.replace(/<!-- JJODIE:(AUTO|USER):START:\S+ -->\n?/g, '');
    html = html.replace(/<!-- JJODIE:(AUTO|USER):END:\S+ -->\n?/g, '');

    // Convert @protected ... @end markers to visual indicators
    html = html.replace(
        new RegExp(`${PROTECTED_TAG_START}`, 'g'),
        '<span class="protected-marker protected-start" title="Protected section - preserved on regeneration">🔒 Protected</span>'
    );
    html = html.replace(
        new RegExp(`${PROTECTED_TAG_END}`, 'g'),
        '<span class="protected-marker protected-end" title="End of protected section">🔓</span>'
    );

    // Escape HTML first to prevent XSS
    html = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Restore protected markers after escaping
    html = html.replace(/&lt;span class="protected-marker.*?&gt;.*?&lt;\/span&gt;/g, match => {
        return match.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    });

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

    // Blockquotes - handle confidence indicators specially
    html = html.replace(/^&gt; \*\*Confidence Level\*\*:(.+)$/gm, (_, content) => {
        const match = content.match(/(\d+)%/);
        const score = match ? parseInt(match[1]) : 50;
        const colorClass = score >= 70 ? 'confidence-high' : score >= 40 ? 'confidence-medium' : 'confidence-low';
        return `<div class="confidence-badge-inline ${colorClass}"><strong>Confidence Level</strong>:${content}</div>`;
    });
    html = html.replace(/^&gt; Confidence:(.+)$/gm, (_, content) => {
        const match = content.match(/(\d+)%/);
        const score = match ? parseInt(match[1]) : 50;
        const colorClass = score >= 70 ? 'confidence-high' : score >= 40 ? 'confidence-medium' : 'confidence-low';
        return `<div class="confidence-badge-small ${colorClass}">Confidence:${content}</div>`;
    });
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
    if (!html.match(/^<(h[1-6]|pre|ul|ol|blockquote|hr|table|div)/)) {
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
// PROTECTED SECTIONS HELPERS
// ============================================

interface ProtectedSection {
    id: string;
    content: string;
    startIndex: number;
    endIndex: number;
}

/**
 * Extract @protected ... @end sections from content
 */
function extractProtectedSections(content: string): ProtectedSection[] {
    const sections: ProtectedSection[] = [];
    const regex = new RegExp(`${PROTECTED_TAG_START}([\\s\\S]*?)${PROTECTED_TAG_END}`, 'g');
    
    let match;
    let index = 0;
    while ((match = regex.exec(content)) !== null) {
        sections.push({
            id: `protected_${index}`,
            content: match[1].trim(),
            startIndex: match.index,
            endIndex: match.index + match[0].length,
        });
        index++;
    }
    
    return sections;
}

/**
 * Count protected sections in content
 */
function countProtectedSections(content: string): number {
    const matches = content.match(new RegExp(PROTECTED_TAG_START, 'g'));
    return matches ? matches.length : 0;
}

/**
 * Merge regenerated content with preserved protected sections
 */
function mergeWithProtectedSections(
    newContent: string,
    oldProtectedSections: ProtectedSection[]
): string {
    if (oldProtectedSections.length === 0) return newContent;
    
    // Find the Notes section in new content and replace its protected content
    // This assumes a standard structure with a Notes section at the end
    const notesMatch = newContent.match(/(## Notes[\s\S]*?)(@protected[\s\S]*?@end)/);
    
    if (notesMatch && oldProtectedSections.length > 0) {
        const oldContent = oldProtectedSections[0].content;
        return newContent.replace(
            notesMatch[2],
            `${PROTECTED_TAG_START}\n${oldContent}\n${PROTECTED_TAG_END}`
        );
    }
    
    return newContent;
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
// CONFIDENCE BADGE COMPONENT
// ============================================

interface ConfidenceBadgeProps {
    score: number;
    showLabel?: boolean;
}

function ConfidenceBadge({ score, showLabel = true }: ConfidenceBadgeProps) {
    const colorClass = score >= 70 ? 'confidence-high' : score >= 40 ? 'confidence-medium' : 'confidence-low';
    const emoji = score >= 70 ? '🟢' : score >= 40 ? '🟡' : '🔴';
    
    return (
        <span className={`confidence-indicator ${colorClass}`} title={`Documentation confidence: ${score}% - Higher values indicate more reliable semantic analysis`}>
            <span className="confidence-emoji">{emoji}</span>
            <span className="confidence-value">{score}%</span>
            {showLabel && <span className="confidence-label">confidence</span>}
        </span>
    );
}

// ============================================
// REGENERATE MODAL
// ============================================

interface RegenerateModalProps {
    protectedCount: number;
    onConfirm: () => void;
    onCancel: () => void;
}

function RegenerateModal({ protectedCount, onConfirm, onCancel }: RegenerateModalProps) {
    return (
        <div className="regenerate-modal-overlay" onClick={onCancel}>
            <div className="regenerate-modal" onClick={e => e.stopPropagation()}>
                <div className="regenerate-modal-header">
                    <i className="bi bi-arrow-repeat" />
                    <h3>Regenerate Documentation?</h3>
                </div>
                <div className="regenerate-modal-content">
                    <p>This will regenerate the documentation based on the current metamodel structure.</p>
                    
                    {protectedCount > 0 ? (
                        <div className="protected-notice">
                            <i className="bi bi-shield-check" />
                            <span>
                                <strong>{protectedCount}</strong> protected section(s) will be preserved.
                                Content between <code>@protected</code> and <code>@end</code> tags is kept.
                            </span>
                        </div>
                    ) : (
                        <div className="warning-notice">
                            <i className="bi bi-exclamation-triangle" />
                            <span>No protected sections found. All content will be regenerated.</span>
                        </div>
                    )}
                    
                    <p className="regenerate-tip">
                        <i className="bi bi-lightbulb" />
                        <em>Tip: Use <code>@protected</code> and <code>@end</code> tags in Edit mode to mark sections you want to preserve.</em>
                    </p>
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
// EXPORT DROPDOWN
// ============================================

type ExportFormat = 'markdown' | 'pdf';

interface ExportDropdownProps {
    onExport: (format: ExportFormat) => void;
    isOpen: boolean;
    onToggle: () => void;
}

function ExportDropdown({ onExport, isOpen, onToggle }: ExportDropdownProps) {
    return (
        <div className="export-dropdown-container">
            <button 
                className="toolbar-btn toolbar-btn-dark" 
                onClick={onToggle} 
                title="Export documentation"
            >
                <i className="bi bi-download" />
                <span>Export</span>
                <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} chevron-icon`} />
            </button>
            {isOpen && (
                <div className="export-dropdown">
                    <button onClick={() => { onExport('markdown'); onToggle(); }}>
                        <i className="bi bi-markdown" />
                        <span>Markdown (.md)</span>
                    </button>
                    <button onClick={() => { onExport('pdf'); onToggle(); }}>
                        <i className="bi bi-file-pdf" />
                        <span>PDF Document</span>
                    </button>
                </div>
            )}
        </div>
    );
}

// ============================================
// PDF EXPORT HELPER
// ============================================

function exportToPDF(content: string, projectName: string): void {
    // Convert markdown to styled HTML
    const htmlContent = parseMarkdown(content);
    
    const styledHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${projectName} - Documentation</title>
            <style>
                body {
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px;
                    line-height: 1.6;
                    color: #1e293b;
                }
                h1 { 
                    color: #0f172a; 
                    border-bottom: 2px solid #0ea5e9; 
                    padding-bottom: 8px; 
                    font-size: 28px;
                }
                h2 { 
                    color: #334155; 
                    margin-top: 32px;
                    font-size: 22px;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 8px;
                }
                h3 { 
                    color: #475569;
                    font-size: 18px;
                }
                table { 
                    border-collapse: collapse; 
                    width: 100%; 
                    margin: 16px 0;
                    font-size: 13px;
                }
                th, td { 
                    border: 1px solid #e2e8f0; 
                    padding: 8px 12px; 
                    text-align: left; 
                }
                th { 
                    background: #f1f5f9; 
                    font-weight: 600; 
                }
                blockquote { 
                    border-left: 4px solid #0ea5e9; 
                    margin: 16px 0; 
                    padding-left: 16px; 
                    color: #64748b;
                    background: #f8fafc;
                    padding: 12px 16px;
                    border-radius: 0 4px 4px 0;
                }
                code { 
                    background: #f1f5f9; 
                    padding: 2px 6px; 
                    border-radius: 4px; 
                    font-family: 'Consolas', monospace;
                    font-size: 0.9em;
                }
                pre {
                    background: #1e293b;
                    color: #e2e8f0;
                    padding: 16px;
                    border-radius: 6px;
                    overflow-x: auto;
                }
                pre code {
                    background: none;
                    padding: 0;
                    color: inherit;
                }
                hr { 
                    border: none; 
                    border-top: 1px solid #e2e8f0; 
                    margin: 24px 0; 
                }
                .confidence-badge-inline,
                .confidence-badge-small {
                    display: inline-block;
                    padding: 8px 14px;
                    border-radius: 6px;
                    font-size: 13px;
                    margin: 8px 0;
                }
                .confidence-high {
                    background: #dcfce7;
                    color: #166534;
                    border-left: 4px solid #22c55e;
                }
                .confidence-medium {
                    background: #fef3c7;
                    color: #92400e;
                    border-left: 4px solid #f59e0b;
                }
                .confidence-low {
                    background: #fee2e2;
                    color: #991b1b;
                    border-left: 4px solid #ef4444;
                }
                .protected-marker {
                    display: none;
                }
                @media print {
                    body { padding: 20px; }
                    h1 { page-break-after: avoid; }
                    h2, h3 { page-break-after: avoid; }
                    table { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            ${htmlContent}
            <hr>
            <p style="font-size: 11px; color: #94a3b8; text-align: center;">
                Generated by Jjodie on ${new Date().toLocaleDateString()}
            </p>
        </body>
        </html>
    `;
    
    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(styledHtml);
        printWindow.document.close();
        printWindow.focus();
        
        // Give content time to render, then trigger print
        setTimeout(() => {
            printWindow.print();
        }, 300);
    }
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

    // Export dropdown
    const [showExportDropdown, setShowExportDropdown] = useState(false);

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

    // Close export dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowExportDropdown(false);
        if (showExportDropdown) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showExportDropdown]);

    // Get current status
    const status = getDocumentationStatus(documentation, projectHash, viewMode === 'edit');

    // Count protected sections
    const protectedCount = useMemo(() => {
        return documentation ? countProtectedSections(documentation.content) : 0;
    }, [documentation]);

    // Get confidence score (default to calculated if not stored)
    const confidenceScore = useMemo(() => {
        if (documentation?.confidence?.overall !== undefined) {
            return documentation.confidence.overall;
        }
        // Calculate basic confidence if not stored
        if (!project) return 0;
        const classCount = project.classes?.length || 0;
        const hasAttributes = project.classes?.some(c => c.attributes?.length > 0);
        const hasReferences = project.classes?.some(c => c.references?.length > 0);
        
        let score = 30; // Base
        if (classCount > 0) score += 20;
        if (classCount > 3) score += 15;
        if (hasAttributes) score += 15;
        if (hasReferences) score += 15;
        if (project.description) score += 5;
        
        return Math.min(100, score);
    }, [documentation, project]);

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
            
            // Add protected Notes section if not present
            let content = docData.content;
            if (!content.includes(PROTECTED_TAG_START)) {
                content += `\n\n## Notes\n\n${PROTECTED_TAG_START}\n*Add your notes here. This section will be preserved when regenerating documentation.*\n${PROTECTED_TAG_END}\n`;
            }
            
            const newDoc: ProjectDocumentation = {
                content,
                generatedAt: Date.now(),
                projectHash: projectHash,
                sections: docData.sections,
                confidence: {
                    overall: confidenceScore,
                    sections: {},
                    factors: [],
                },
            };
            setDocumentation(newDoc);
            setEditContent(content);
            saveDocumentation(project.id, newDoc);
        } catch (err) {
            console.error('Failed to generate documentation:', err);
        } finally {
            setIsGenerating(false);
        }
    }, [project, projectHash, confidenceScore]);

    // Regenerate with preservation of protected sections
    const handleRegenerate = useCallback(async () => {
        if (!project || !documentation) return;

        setShowRegenerateModal(false);
        setIsGenerating(true);

        try {
            // Extract protected sections from current content
            const protectedSections = extractProtectedSections(documentation.content);
            
            // Generate new documentation
            const newDocData = await JjodieContextService.generateDocumentationWithSections(project);
            
            // Merge with protected sections
            let mergedContent = newDocData.content;
            
            // Add protected Notes section
            if (!mergedContent.includes(PROTECTED_TAG_START)) {
                const oldNotesContent = protectedSections.length > 0 
                    ? protectedSections[0].content 
                    : '*Add your notes here. This section will be preserved when regenerating documentation.*';
                mergedContent += `\n\n## Notes\n\n${PROTECTED_TAG_START}\n${oldNotesContent}\n${PROTECTED_TAG_END}\n`;
            } else {
                // Replace new protected content with old
                mergedContent = mergeWithProtectedSections(mergedContent, protectedSections);
            }
            
            const newDoc: ProjectDocumentation = {
                content: mergedContent,
                generatedAt: Date.now(),
                lastManualEdit: documentation.lastManualEdit,
                projectHash: projectHash,
                sections: newDocData.sections,
                confidence: {
                    overall: confidenceScore,
                    sections: {},
                    factors: [],
                },
            };
            setDocumentation(newDoc);
            setEditContent(mergedContent);
            saveDocumentation(project.id, newDoc);
        } catch (err) {
            console.error('Failed to regenerate documentation:', err);
        } finally {
            setIsGenerating(false);
        }
    }, [project, documentation, projectHash, confidenceScore]);

    // Save edited content
    const handleSaveEdit = useCallback(() => {
        if (!project || !documentation) return;

        const newDoc: ProjectDocumentation = {
            ...documentation,
            content: editContent,
            lastManualEdit: Date.now(),
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

    // Export handler
    const handleExport = useCallback((format: ExportFormat) => {
        if (!project || !documentation) return;
        
        const filename = `${project.name || 'metamodel'}-documentation`;
        
        if (format === 'markdown') {
            // Download as .md file
            const blob = new Blob([documentation.content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else if (format === 'pdf') {
            // Export as PDF via print dialog
            exportToPDF(documentation.content, project.name || 'Metamodel');
        }
    }, [project, documentation]);

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
                    <p>
                        Generate comprehensive documentation for your metamodel including 
                        domain analysis, class descriptions, and confidence scoring.
                    </p>
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
                    
                    {/* Confidence Badge */}
                    {documentation && (
                        <ConfidenceBadge score={confidenceScore} />
                    )}

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
                                onClick={() => setShowRegenerateModal(true)}
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
                            <div onClick={e => e.stopPropagation()}>
                                <ExportDropdown
                                    onExport={handleExport}
                                    isOpen={showExportDropdown}
                                    onToggle={() => setShowExportDropdown(!showExportDropdown)}
                                />
                            </div>
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
                        placeholder={`Write your documentation in Markdown...\n\nUse @protected and @end to mark sections that should be preserved when regenerating.\n\nExample:\n@protected\nYour custom notes here...\n@end`}
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
                    {protectedCount > 0 && (
                        <span className="protected-count">
                            <i className="bi bi-shield-check" />
                            {protectedCount} protected section(s)
                        </span>
                    )}
                </div>
            )}

            {/* Regenerate confirmation modal */}
            {showRegenerateModal && (
                <RegenerateModal
                    protectedCount={protectedCount}
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
