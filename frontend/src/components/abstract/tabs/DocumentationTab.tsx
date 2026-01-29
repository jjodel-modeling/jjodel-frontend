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
import Editor from '@monaco-editor/react';
import { DState, LProject, LUser, DUser, LModel } from '../../../joiner';
import type { FakeStateProps } from '../../../joiner/types';
import DocumentationService from '../../../services/DocumentationService';
import type { ProjectDocumentation } from '../../../services/DocumentationService';
import { JodieConfigService, ALL_PROVIDERS } from '../../../services/JodieConfig';
import type { AIProvider } from '../../../types/jodie';
import { useAIProviderPreference } from '../../../hooks/useAIProviderPreference';
import { useAISettingsSafe } from '../../../contexts/AISettingsContext';
import { DocumentationStatus } from '../../../types/jodie';
import { markdownMonacoOptions } from '../../editors/monacoConfig';
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

    // Convert @protected ... @end markers to visual indicators (using Bootstrap Icons, not emoji)
    html = html.replace(
        new RegExp(`${PROTECTED_TAG_START}`, 'g'),
        '<span class="protected-marker protected-start" title="Protected section - preserved on regeneration"><i class="bi bi-lock-fill"></i> Protected</span>'
    );
    html = html.replace(
        new RegExp(`${PROTECTED_TAG_END}`, 'g'),
        '<span class="protected-marker protected-end" title="End of protected section"><i class="bi bi-lock-fill"></i></span>'
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

// Storage functions now delegated to DocumentationService
// loadDocumentation -> DocumentationService.load
// saveDocumentation -> DocumentationService.save

// ============================================
// STATUS HELPERS
// ============================================
// Note: Protected sections helpers are now in DocumentationService

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

function formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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

    return (
        <span className={`confidence-indicator ${colorClass}`} title={`Documentation confidence: ${score}% - Higher values indicate more reliable semantic analysis`}>
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
// GENERATION PROGRESS MODAL
// ============================================

interface GenerationStep {
    id: string;
    label: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    detail?: string;
}

interface GenerationProgressModalProps {
    steps: GenerationStep[];
    onClose: () => void;
    isComplete: boolean;
}

function GenerationProgressModal({ steps, onClose, isComplete }: GenerationProgressModalProps) {
    const hasError = steps.some(s => s.status === 'error');

    return (
        <div className="progress-modal-overlay" onClick={isComplete || hasError ? onClose : undefined}>
            <div className="progress-modal" onClick={e => e.stopPropagation()}>
                <div className="progress-modal-header">
                    <div className="progress-title">
                        <i className={`bi ${isComplete && !hasError ? 'bi-check-circle-fill' : hasError ? 'bi-x-circle-fill' : 'bi-stars'}`} />
                        <span>
                            {isComplete && !hasError ? 'Generation Complete' :
                             hasError ? 'Generation Failed' :
                             'Generating Documentation...'}
                        </span>
                    </div>
                </div>

                <div className="progress-steps">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={`progress-step ${step.status}`}
                        >
                            <div className="step-indicator">
                                {step.status === 'completed' && <i className="bi bi-check-lg" />}
                                {step.status === 'running' && <div className="spinner" />}
                                {step.status === 'pending' && <span className="step-number">{index + 1}</span>}
                                {step.status === 'error' && <i className="bi bi-x-lg" />}
                            </div>
                            <div className="step-content">
                                <div className="step-label">{step.label}</div>
                                {step.detail && (
                                    <div className="step-detail">{step.detail}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="progress-footer">
                    <button
                        className="progress-close-btn"
                        onClick={onClose}
                        disabled={!isComplete && !hasError}
                    >
                        {isComplete || hasError ? 'Close' : 'Please wait...'}
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

    // Editor settings
    const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
    const [splitView, setSplitView] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [editorCopyStatus, setEditorCopyStatus] = useState<'idle' | 'copied'>('idle');

    // AI Provider selector (with persistence)
    const { selectedProvider, setSelectedProvider } = useAIProviderPreference('documentation');
    const [showProviderMenu, setShowProviderMenu] = useState(false);
    const aiSettingsContext = useAISettingsSafe();

    // Progress modal for regeneration
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);

    // Calculate project hash for change detection
    const projectHash = useMemo(() => {
        if (!project) return '';
        return DocumentationService.calculateHash(project);
    }, [project]);

    // Load documentation from storage on mount
    useEffect(() => {
        if (project?.id) {
            const stored = DocumentationService.load(project.id);
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
        return documentation ? DocumentationService.countProtectedSections(documentation.content) : 0;
    }, [documentation]);

    // Get confidence score from documentation (only for Jjodie-generated docs)
    const confidenceScore = useMemo(() => {
        if (documentation?.generatedWith === 'jjodie' && documentation.confidence !== undefined) {
            return documentation.confidence;
        }
        return 0; // Local generation has no confidence score
    }, [documentation]);

    // Parse markdown to HTML
    const renderedHtml = useMemo(() => {
        const content = viewMode === 'edit' ? editContent : (documentation?.content || '');
        return parseMarkdown(content);
    }, [documentation?.content, editContent, viewMode]);

    // Get available AI providers
    const availableProviders = useMemo(() => {
        const providers: Array<{ id: 'local' | AIProvider; name: string; available: boolean }> = [
            { id: 'local', name: 'Local (Instant)', available: true }
        ];

        // Add configured AI providers
        for (const providerId of ALL_PROVIDERS) {
            if (JodieConfigService.isProviderEnabled(providerId)) {
                const displayName = providerId === 'claude' ? 'Anthropic' :
                    providerId.charAt(0).toUpperCase() + providerId.slice(1);
                providers.push({ id: providerId, name: displayName, available: true });
            }
        }

        return providers;
    }, []);

    // Get selected provider display name
    const selectedProviderName = useMemo(() => {
        if (selectedProvider === 'local') return 'Local';
        const provider = availableProviders.find(p => p.id === selectedProvider);
        return provider?.name || selectedProvider;
    }, [selectedProvider, availableProviders]);

    // Close provider menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowProviderMenu(false);
        if (showProviderMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showProviderMenu]);

    // Generate initial documentation
    const handleGenerate = useCallback(async () => {
        if (!project) return;

        setIsGenerating(true);
        try {
            // Use AI if available, otherwise local
            const useJjodie = DocumentationService.isAIAvailable();
            const result = await DocumentationService.generate(project, useJjodie);

            // Content already includes @protected section from DocumentationService
            const newDoc: ProjectDocumentation = {
                content: result.content,
                generatedAt: Date.now(),
                projectHash: projectHash,
                confidence: result.confidence,
                generatedWith: result.generatedWith,
            };
            setDocumentation(newDoc);
            setEditContent(result.content);
            DocumentationService.save(project.id, newDoc);
        } catch (err) {
            console.error('Failed to generate documentation:', err);
            // Fallback to local
            try {
                const result = DocumentationService.generateLocal(project);
                const newDoc: ProjectDocumentation = {
                    content: result.content,
                    generatedAt: Date.now(),
                    projectHash: projectHash,
                    confidence: 0,
                    generatedWith: 'local',
                };
                setDocumentation(newDoc);
                setEditContent(result.content);
                DocumentationService.save(project.id, newDoc);
            } catch (fallbackErr) {
                console.error('Local fallback also failed:', fallbackErr);
            }
        } finally {
            setIsGenerating(false);
        }
    }, [project, projectHash]);

    // Regenerate with preservation of protected sections (with progress tracking)
    const handleRegenerate = useCallback(async () => {
        if (!project || !documentation) return;

        setShowRegenerateModal(false);

        // Determine if using AI or Local
        const useAI = selectedProvider !== 'local' && DocumentationService.isAIAvailable();

        // Initialize steps based on generation mode
        const initialSteps: GenerationStep[] = useAI ? [
            { id: 'extract', label: 'Extracting metamodel structure', status: 'pending' },
            { id: 'wikidata', label: 'Fetching Wikidata definitions', status: 'pending' },
            { id: 'prompt', label: 'Building AI prompt', status: 'pending' },
            { id: 'generate', label: `Generating with ${selectedProviderName}`, status: 'pending' },
            { id: 'parse', label: 'Parsing response', status: 'pending' },
            { id: 'merge', label: 'Merging protected sections', status: 'pending' },
            { id: 'save', label: 'Saving documentation', status: 'pending' },
        ] : [
            { id: 'extract', label: 'Extracting metamodel structure', status: 'pending' },
            { id: 'infer', label: 'Inferring domain', status: 'pending' },
            { id: 'generate', label: 'Generating documentation', status: 'pending' },
            { id: 'merge', label: 'Merging protected sections', status: 'pending' },
            { id: 'save', label: 'Saving documentation', status: 'pending' },
        ];

        setGenerationSteps(initialSteps);
        setShowProgressModal(true);
        setIsGenerating(true);

        // Helper to update step
        const updateStep = (id: string, status: GenerationStep['status'], detail?: string) => {
            setGenerationSteps(prev => prev.map(s =>
                s.id === id ? { ...s, status, detail } : s
            ));
        };

        try {
            // Step 1: Extract
            updateStep('extract', 'running');
            await new Promise(r => setTimeout(r, 300));
            const classCount = project.classes?.length || 0;
            updateStep('extract', 'completed', `${classCount} classes found`);

            if (useAI) {
                // AI generation steps
                updateStep('wikidata', 'running');
                await new Promise(r => setTimeout(r, 400));
                updateStep('wikidata', 'completed');

                updateStep('prompt', 'running');
                await new Promise(r => setTimeout(r, 200));
                updateStep('prompt', 'completed');

                updateStep('generate', 'running');
            } else {
                // Local generation steps
                updateStep('infer', 'running');
                await new Promise(r => setTimeout(r, 200));
                updateStep('infer', 'completed');

                updateStep('generate', 'running');
            }

            // Generate documentation
            const result = await DocumentationService.generate(project, useAI);
            updateStep('generate', 'completed');

            // Parse response (only for AI mode)
            if (useAI) {
                updateStep('parse', 'running');
                await new Promise(r => setTimeout(r, 300));
                updateStep('parse', 'completed');
            }

            // Merge protected sections
            updateStep('merge', 'running');
            const mergedContent = DocumentationService.mergeProtectedSections(
                result.content,
                documentation.content
            );
            updateStep('merge', 'completed');

            // Save
            updateStep('save', 'running');
            const newDoc: ProjectDocumentation = {
                content: mergedContent,
                generatedAt: Date.now(),
                lastManualEdit: documentation.lastManualEdit,
                projectHash: projectHash,
                confidence: result.confidence,
                generatedWith: result.generatedWith,
            };

            setDocumentation(newDoc);
            setEditContent(mergedContent);
            DocumentationService.save(project.id, newDoc);
            updateStep('save', 'completed');

        } catch (err) {
            console.error('Failed to regenerate documentation:', err);
            // Mark current running step as error
            setGenerationSteps(prev => prev.map(s =>
                s.status === 'running' ? { ...s, status: 'error', detail: String(err) } : s
            ));
        } finally {
            setIsGenerating(false);
        }
    }, [project, documentation, projectHash, selectedProvider, selectedProviderName]);

    // Check if generation is complete
    const isGenerationComplete = useMemo(() => {
        return generationSteps.length > 0 &&
            generationSteps.every(s => s.status === 'completed' || s.status === 'error');
    }, [generationSteps]);

    // Save edited content
    const handleSaveEdit = useCallback(() => {
        if (!project || !documentation) return;

        const newDoc: ProjectDocumentation = {
            ...documentation,
            content: editContent,
            lastManualEdit: Date.now(),
        };
        setDocumentation(newDoc);
        DocumentationService.save(project.id, newDoc);
        setViewMode('formatted');
    }, [project, documentation, editContent]);

    // Cancel edit
    const handleCancelEdit = useCallback(() => {
        if (documentation) {
            setEditContent(documentation.content);
        }
        setViewMode('formatted');
        setSplitView(false);
    }, [documentation]);

    // Copy editor content
    const handleEditorCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(editContent);
            setEditorCopyStatus('copied');
            setTimeout(() => setEditorCopyStatus('idle'), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [editContent]);

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

                    {/* Status Badge with Timestamp */}
                    {status === 'outdated' && (
                        <>
                            <span className="status-badge status-outdated" title="Project has been modified since documentation was generated">
                                <i className="bi bi-exclamation-triangle" />
                                Outdated
                            </span>
                            {documentation?.generatedAt && (
                                <span className="status-timestamp" title={`Last generated: ${new Date(documentation.generatedAt).toLocaleString()}`}>
                                    Last: {formatDateTime(documentation.generatedAt)}
                                </span>
                            )}
                        </>
                    )}
                    {status === 'up_to_date' && (
                        <>
                            <span className="status-badge status-synced" title="Documentation is up to date">
                                <i className="bi bi-check-circle" />
                                Synced
                            </span>
                            {documentation?.generatedAt && (
                                <span className="status-timestamp" title={`Generated: ${new Date(documentation.generatedAt).toLocaleString()}`}>
                                    {formatDateTime(documentation.generatedAt)}
                                </span>
                            )}
                        </>
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
                            <button
                                className="toolbar-btn"
                                onClick={handleCancelEdit}
                                title="Cancel editing"
                            >
                                <i className="bi bi-x-lg" />
                                <span>Cancel</span>
                            </button>
                            <button
                                className="toolbar-btn toolbar-btn-primary"
                                onClick={handleSaveEdit}
                                title="Save changes"
                            >
                                <i className="bi bi-check-lg" />
                                <span>Save</span>
                            </button>
                        </>
                    ) : (
                        <>
                            {/* AI Provider Selector */}
                            <div className="provider-selector" onClick={(e) => e.stopPropagation()}>
                                <button
                                    className="provider-btn"
                                    onClick={() => setShowProviderMenu(!showProviderMenu)}
                                    title="Select AI provider for generation"
                                >
                                    <i className="bi bi-cpu" />
                                    <span>{selectedProviderName}</span>
                                    <i className={`bi bi-chevron-${showProviderMenu ? 'up' : 'down'}`} />
                                </button>

                                {showProviderMenu && (
                                    <div className="provider-menu">
                                        <div className="provider-menu-header">AI Provider</div>

                                        {availableProviders.map(provider => (
                                            <button
                                                key={provider.id}
                                                className={`provider-option ${selectedProvider === provider.id ? 'active' : ''}`}
                                                onClick={() => {
                                                    setSelectedProvider(provider.id);
                                                    setShowProviderMenu(false);
                                                }}
                                                disabled={!provider.available}
                                            >
                                                <i className={`bi ${provider.id === 'local' ? 'bi-lightning' : 'bi-stars'}`} />
                                                <span>{provider.name}</span>
                                                {selectedProvider === provider.id && (
                                                    <i className="bi bi-check-lg check-icon" />
                                                )}
                                            </button>
                                        ))}

                                        <div className="provider-menu-footer">
                                            <button
                                                className="provider-hint"
                                                onClick={() => {
                                                    setShowProviderMenu(false);
                                                    aiSettingsContext?.openAISettings();
                                                }}
                                            >
                                                <i className="bi bi-gear" /> Configure in Settings
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

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
                    <div className={`documentation-editor-wrapper ${fullscreen ? 'fullscreen' : ''}`}>
                        {/* Editor Container */}
                        <div className={`editor-container ${splitView ? 'split' : ''}`}>
                            {/* Monaco Editor Pane */}
                            <div className="editor-pane">
                                {/* Floating Light Toolbar */}
                                <div className="editor-light-toolbar">
                                    <button
                                        className={`light-toolbar-btn ${wordWrap === 'on' ? 'active' : ''}`}
                                        onClick={() => setWordWrap(wordWrap === 'on' ? 'off' : 'on')}
                                        title={wordWrap === 'on' ? 'Disable word wrap' : 'Enable word wrap'}
                                    >
                                        <i className="bi bi-text-wrap" />
                                    </button>
                                    <button
                                        className="light-toolbar-btn"
                                        onClick={handleEditorCopy}
                                        title="Copy to clipboard"
                                    >
                                        <i className={`bi ${editorCopyStatus === 'copied' ? 'bi-check-lg' : 'bi-clipboard'}`} />
                                    </button>
                                    <button
                                        className={`light-toolbar-btn ${splitView ? 'active' : ''}`}
                                        onClick={() => setSplitView(!splitView)}
                                        title={splitView ? 'Hide preview' : 'Show split preview'}
                                    >
                                        <i className="bi bi-layout-split" />
                                    </button>
                                    <button
                                        className="light-toolbar-btn"
                                        onClick={() => setFullscreen(!fullscreen)}
                                        title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                                    >
                                        <i className={`bi ${fullscreen ? 'bi-fullscreen-exit' : 'bi-fullscreen'}`} />
                                    </button>
                                </div>

                                <Editor
                                    width="100%"
                                    height="100%"
                                    language="markdown"
                                    theme={document.documentElement.getAttribute('data-theme') === 'dark' ? 'vs-dark' : 'vs'}
                                    value={editContent}
                                    onChange={(value) => setEditContent(value || '')}
                                    options={{
                                        ...markdownMonacoOptions,
                                        wordWrap: wordWrap,
                                        minimap: { enabled: false },
                                        lineNumbers: 'on',
                                        fontSize: 13,
                                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                                        padding: { top: 16, bottom: 16 },
                                        scrollBeyondLastLine: false,
                                        renderLineHighlight: 'line',
                                        cursorBlinking: 'smooth',
                                        smoothScrolling: true,
                                    }}
                                />
                            </div>

                            {/* Preview Pane (split view only) */}
                            {splitView && (
                                <div className="preview-pane">
                                    <div className="preview-header">
                                        <i className="bi bi-eye" />
                                        Preview
                                    </div>
                                    <div
                                        className="preview-content md-content"
                                        dangerouslySetInnerHTML={{ __html: parseMarkdown(editContent) }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
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

            {/* Generation progress modal */}
            {showProgressModal && (
                <GenerationProgressModal
                    steps={generationSteps}
                    onClose={() => setShowProgressModal(false)}
                    isComplete={isGenerationComplete}
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
