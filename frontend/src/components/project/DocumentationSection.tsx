/**
 * Documentation Section for Project Dashboard
 * Simplified: clickable card that opens Documentation Tab
 *
 * - No doc → empty card with "Generate" action
 * - Doc exists → card showing status, click to view
 *
 * Provider selection (Local/Jjodie) is now in DocumentationTab toolbar.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { LProject } from '../../joiner';
import DockManager from '../abstract/DockManager';
import DocumentationService, { ProjectDocumentation } from '../../services/DocumentationService';
import './DocumentationSection.scss';

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// ============================================
// COMPONENT
// ============================================

interface Props {
    project: LProject;
}

const DocumentationSection: React.FC<Props> = ({ project }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [documentation, setDocumentation] = useState<ProjectDocumentation | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Check if we can generate
    const canGenerate = DocumentationService.hasCriticalMass(project);

    // Load documentation on mount
    useEffect(() => {
        if (project?.id) {
            setDocumentation(DocumentationService.load(project.id));
        }
    }, [project?.id]);

    // Calculate hash for change detection
    const currentHash = useMemo(() => DocumentationService.calculateHash(project), [project]);
    const isOutdated = documentation && documentation.projectHash !== currentHash;

    // Confidence score
    const confidence = documentation?.confidence || 0;

    // Open Documentation Tab
    const handleView = useCallback(() => {
        DockManager.openDocumentation?.(project, documentation);
    }, [documentation, project]);

    // Generate documentation (for empty state)
    const handleGenerate = useCallback(async () => {
        if (!canGenerate) return;
        setIsGenerating(true);
        setError(null);

        try {
            // Use local generation by default from dashboard
            const result = DocumentationService.generateLocal(project);

            const newDoc: ProjectDocumentation = {
                content: result.content,
                generatedAt: Date.now(),
                projectHash: currentHash,
                confidence: result.confidence,
                generatedWith: result.generatedWith
            };

            setDocumentation(newDoc);
            DocumentationService.save(project.id, newDoc);

            // Open the tab after generation
            DockManager.openDocumentation?.(project, newDoc);
        } catch (err) {
            console.error('Documentation generation failed:', err);
            setError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    }, [project, currentHash, canGenerate]);

    // ==========================================
    // RENDER
    // ==========================================
    return (
        <div className="documentation-section">
            {/* Header - just title */}
            <div className="section-header">
                <h3 className="section-title">DOCUMENTATION</h3>
            </div>

            {/* Documentation Card */}
            {documentation ? (
                // Card with documentation - click to view
                <div
                    className="documentation-card"
                    onClick={handleView}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleView()}
                >
                    <div className="doc-icon">
                        <span>D</span>
                    </div>

                    <div className="doc-content">
                        <div className="doc-header">
                            <span className="doc-title">Project Documentation</span>
                            {isOutdated && (
                                <span className="status-badge status-outdated">
                                    <i className="bi bi-exclamation-triangle" />
                                    Outdated
                                </span>
                            )}
                        </div>
                        <div className="doc-meta">
                            <span>Generated {formatTimeAgo(documentation.generatedAt)}</span>
                            {confidence > 0 && (
                                <>
                                    <span className="meta-separator">·</span>
                                    <span className={`confidence confidence--${confidence >= 70 ? 'high' : confidence >= 40 ? 'medium' : 'low'}`}>
                                        {confidence}%
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // Empty state - click to generate
                <div
                    className={`documentation-card documentation-card--empty ${!canGenerate ? 'documentation-card--disabled' : ''}`}
                    onClick={canGenerate ? handleGenerate : undefined}
                    role="button"
                    tabIndex={canGenerate ? 0 : -1}
                    onKeyDown={(e) => e.key === 'Enter' && canGenerate && handleGenerate()}
                    title={!canGenerate ? 'Add at least 1 class with 1 attribute to generate docs' : ''}
                >
                    <div className="doc-icon doc-icon--empty">
                        {isGenerating ? (
                            <i className="bi bi-arrow-repeat doc-spinning" />
                        ) : (
                            <i className="bi bi-file-earmark-plus" />
                        )}
                    </div>

                    <div className="doc-content">
                        <div className="doc-header">
                            <span className="doc-title">
                                {isGenerating ? 'Generating...' : 'Generate Documentation'}
                            </span>
                        </div>
                        <div className="doc-meta">
                            {canGenerate
                                ? 'Click to create documentation for your metamodel'
                                : 'Add classes to your metamodel first'
                            }
                        </div>
                    </div>

                    {error && (
                        <div className="doc-error">
                            <i className="bi bi-exclamation-circle" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DocumentationSection;
