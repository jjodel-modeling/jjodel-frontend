/**
 * Documentation Section for Project Dashboard
 * Workflow:
 * 1. No doc + no critical mass → disabled "Generate" button
 * 2. No doc + critical mass → enabled "Generate" button
 * 3. Doc exists → show card, can View/Regenerate
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { LProject } from '../../joiner';
import DockManager from '../abstract/DockManager';
import './DocumentationSection.scss';

const STORAGE_PREFIX = 'jjodel_doc_';

interface ProjectDocumentation {
    content: string;
    generatedAt: number;
    projectHash: string;
    confidence: number;
}

function loadDocumentation(projectId: string): ProjectDocumentation | null {
    try {
        const stored = localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
        return stored ? JSON.parse(stored) : null;
    } catch { return null; }
}

function saveDocumentation(projectId: string, doc: ProjectDocumentation): void {
    localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, JSON.stringify(doc));
}

function calculateProjectHash(project: LProject): string {
    const metamodels = project.metamodels || [];
    const classNames = metamodels
        .flatMap(mm => (mm.classes || []).map(c => c.name || ''))
        .sort().join(',');
    return `${project.name}_${metamodels.length}_${classNames}`;
}

function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// Check if project has critical mass for documentation
function hasCriticalMass(project: LProject): boolean {
    const metamodels = project.metamodels || [];
    const allClasses = metamodels.flatMap(mm => mm.classes || []);
    const totalAttributes = allClasses.reduce((sum, c) => sum + (c.attributes?.length || 0), 0);
    return allClasses.length >= 1 && totalAttributes >= 1;
}

// Check if AI provider is configured
function isAIProviderConfigured(): boolean {
    try {
        const settings = localStorage.getItem('jjodel_settings');
        if (!settings) return false;
        const parsed = JSON.parse(settings);
        return !!(parsed.aiProvider && parsed.apiKey);
    } catch { return false; }
}

const DOMAIN_KEYWORDS: Record<string, string[]> = {
    'E-commerce': ['product', 'order', 'cart', 'customer', 'payment', 'price'],
    'Healthcare': ['patient', 'doctor', 'appointment', 'diagnosis', 'treatment'],
    'Finance': ['account', 'transaction', 'balance', 'invoice', 'bank'],
    'Education': ['student', 'course', 'teacher', 'grade', 'enrollment'],
};

function inferDomain(classNames: string[]): { name: string; confidence: number } {
    const normalized = classNames.map(n => n.toLowerCase());
    let best = { name: 'General', confidence: 0 };
    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
        const matched = keywords.filter(kw => normalized.some(n => n.includes(kw)));
        const conf = Math.round((matched.length / keywords.length) * 100);
        if (conf > best.confidence) best = { name: domain, confidence: conf };
    }
    return best;
}

function calculateConfidence(project: LProject): number {
    const metamodels = project.metamodels || [];
    const allClasses = metamodels.flatMap(mm => mm.classes || []);
    let score = 30;
    if (allClasses.length > 0) score += 15;
    if (allClasses.length >= 3) score += 10;
    if (allClasses.some(c => c.attributes?.length > 0)) score += 10;
    if (allClasses.some(c => c.references?.length > 0)) score += 10;
    const domain = inferDomain(allClasses.map(c => c.name || ''));
    score += Math.round(domain.confidence * 0.2);
    return Math.min(100, score);
}

function generateDocumentation(project: LProject): string {
    const metamodels = project.metamodels || [];
    const allClasses = metamodels.flatMap(mm => mm.classes || []);
    const allEnums = metamodels.flatMap(mm => mm.enumerations || []);
    const domain = inferDomain(allClasses.map(c => c.name || ''));
    const confidence = calculateConfidence(project);

    const stats = {
        classes: allClasses.length,
        attributes: allClasses.reduce((sum, c) => sum + (c.attributes?.length || 0), 0),
        references: allClasses.reduce((sum, c) => sum + (c.references?.length || 0), 0),
    };

    let md = `# ${project.name || 'Project'} Documentation\n\n`;
    md += `## Overview\n\n`;
    md += `> **Confidence**: ${confidence >= 70 ? '🟢' : confidence >= 40 ? '🟡' : '🔴'} ${confidence}%\n\n`;
    if (domain.name !== 'General') md += `Domain: **${domain.name}**. `;
    md += `Contains ${stats.classes} classes, ${stats.attributes} attributes, ${stats.references} references.\n\n`;

    if (allClasses.length > 0) {
        md += `## Classes\n\n`;
        allClasses.forEach(cls => {
            md += `### ${cls.name || 'Unnamed'}${cls.abstract ? ' *(abstract)*' : ''}\n\n`;
            const attrs = cls.attributes || [];
            if (attrs.length > 0) {
                md += `| Attribute | Type |\n|-----------|------|\n`;
                attrs.forEach((a: any) => {
                    const type = typeof a.type === 'string' ? a.type : (a.type?.name || 'any');
                    md += `| ${a.name} | ${type} |\n`;
                });
                md += `\n`;
            }
        });
    }

    if (allEnums.length > 0) {
        md += `## Enumerations\n\n`;
        allEnums.forEach((en: any) => {
            const literals = (en.literals || []).map((l: any) => `\`${l.name}\``).join(', ');
            md += `**${en.name}**: ${literals}\n\n`;
        });
    }

    md += `## Notes\n\n@protected\n*Add notes here - preserved on regeneration*\n@end\n`;
    return md;
}

interface Props { project: LProject; }

const DocumentationSection: React.FC<Props> = ({ project }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [documentation, setDocumentation] = useState<ProjectDocumentation | null>(null);
    const [useJjodie, setUseJjodie] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    const hasAIProvider = isAIProviderConfigured();
    const canGenerate = hasCriticalMass(project);

    useEffect(() => {
        if (project?.id) setDocumentation(loadDocumentation(project.id));
    }, [project?.id]);

    const currentHash = useMemo(() => calculateProjectHash(project), [project]);
    const isOutdated = documentation && documentation.projectHash !== currentHash;
    const confidence = documentation?.confidence || 0;

    const handleGenerate = useCallback(() => {
        if (!canGenerate) return;
        setIsGenerating(true);
        setTimeout(() => {
            // TODO: if useJjodie, call Jjodie API instead
            const content = generateDocumentation(project);
            const conf = calculateConfidence(project);
            const newDoc: ProjectDocumentation = {
                content, generatedAt: Date.now(), projectHash: currentHash, confidence: conf
            };
            setDocumentation(newDoc);
            saveDocumentation(project.id, newDoc);
            setIsGenerating(false);
        }, 150);
    }, [project, currentHash, canGenerate, useJjodie]);

    const handleView = useCallback(() => {
        // Open Documentation Tab in left area (like metamodel tabs)
        DockManager.openDocumentation?.(project, documentation);
    }, [documentation, project]);

    // ==========================================
    // RENDER: No documentation yet
    // ==========================================
    if (!documentation) {
        return (
            <div className="project-section documentation-section">
                <div className="project-section__header">
                    <h2 className="project-section__title">DOCUMENTATION</h2>
                    <button
                        className="btn btn--primary"
                        onClick={handleGenerate}
                        disabled={isGenerating || !canGenerate}
                        title={!canGenerate ? "Add at least 1 class with 1 attribute" : ""}
                    >
                        {isGenerating ? <><i className="bi bi-arrow-repeat doc-spinning" /> Generating...</> : '+ Generate'}
                    </button>
                </div>
                <div className="empty-state empty-state--secondary">
                    <div className="empty-state__icon empty-state__icon--small"><i className="bi bi-file-text" /></div>
                    <h3 className="empty-state__title">No documentation yet</h3>
                    <p className="empty-state__description">
                        {canGenerate
                            ? "Your metamodel is ready. Click Generate to create documentation."
                            : "Add classes to your metamodel to generate docs."
                        }
                    </p>
                </div>
            </div>
        );
    }

    // ==========================================
    // RENDER: Documentation exists
    // ==========================================
    return (
        <div className="project-section documentation-section">
            <div className="project-section__header">
                <h2 className="project-section__title">DOCUMENTATION</h2>
                <div className="project-section__actions">
                    {isOutdated && (
                        <button className="btn btn--warning" onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? <i className="bi bi-arrow-repeat doc-spinning" /> : <><i className="bi bi-arrow-repeat" /> Update</>}
                        </button>
                    )}
                    <button className="btn btn--secondary" onClick={handleView}>View</button>
                </div>
            </div>
            <div className="list-card">
                <div className="list-card__item list-card__item--clickable" onClick={handleView}>
                    <span className="list-card__icon list-card__icon--doc">D</span>
                    <div className="list-card__content">
                        <div className="list-card__name">
                            Project Documentation
                            {isOutdated && <span className="list-card__badge list-card__badge--warning"><i className="bi bi-exclamation-triangle" /> Outdated</span>}
                        </div>
                        <div className="list-card__meta">
                            <span>Generated {formatTimeAgo(documentation.generatedAt)}</span>
                            <span className="list-card__separator">·</span>
                            <span className={`confidence-badge confidence-badge--${confidence >= 70 ? 'high' : confidence >= 40 ? 'medium' : 'low'}`}>
                                {confidence >= 70 ? '🟢' : confidence >= 40 ? '🟡' : '🔴'} {confidence}%
                            </span>
                        </div>
                    </div>
                    <div className="doc-toggle" onClick={(e) => e.stopPropagation()}>
                        <span className={`doc-toggle__label ${!useJjodie ? 'active' : ''}`}>Local</span>
                        <button
                            className={`doc-toggle__switch ${useJjodie ? 'active' : ''} ${!hasAIProvider ? 'disabled' : ''}`}
                            onClick={() => hasAIProvider && setUseJjodie(!useJjodie)}
                            disabled={!hasAIProvider}
                            aria-label="Toggle generation mode"
                        >
                            <span className="doc-toggle__slider" />
                        </button>
                        <span className={`doc-toggle__label ${useJjodie ? 'active' : ''} ${!hasAIProvider ? 'disabled' : ''}`}>Jjodie</span>
                        <div
                            className="doc-info-icon"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                        >
                            <i className="bi bi-info-circle" />
                            {showTooltip && (
                                <div className="doc-info-tooltip">
                                    {hasAIProvider
                                        ? "When using Jjodie, metamodel data is sent to your configured AI provider. You are responsible for data sharing compliance."
                                        : "Configure an AI provider in Settings to enable Jjodie generation."
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="list-card__arrow"><i className="bi bi-chevron-right" /></div>
                </div>
            </div>
        </div>
    );
};

export default DocumentationSection;
