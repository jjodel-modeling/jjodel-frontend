/**
 * Metamodel Overview Component
 * Collapsible panel showing metamodel statistics, hierarchy, and completeness
 */

import React, { useState, useMemo } from 'react';
import './MetamodelOverview.css';

interface MetamodelClass {
    name: string;
    isAbstract?: boolean;
    attributes?: Array<{ name: string; type?: string }>;
    references?: Array<{ name: string; target?: string }>;
    constraints?: Array<{ name: string }>;
    description?: string;
    superclass?: string;
}

interface Metamodel {
    classes?: MetamodelClass[];
}

interface MetamodelOverviewProps {
    metamodel: Metamodel | null | undefined;
}

interface MetamodelStats {
    classes: number;
    attributes: number;
    references: number;
    constraints: number;
    completeness: number;
}

interface MissingElement {
    type: 'warning' | 'error';
    element: string;
    issue: string;
}

interface HierarchyNode {
    name: string;
    isAbstract: boolean;
    attributeCount: number;
    referenceCount: number;
    superclass?: string;
    children: HierarchyNode[];
}

export function MetamodelOverview({ metamodel }: MetamodelOverviewProps): JSX.Element | null {
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate all derived data
    const stats = useMemo(() => calculateStats(metamodel), [metamodel]);
    const hierarchy = useMemo(() => buildHierarchy(metamodel), [metamodel]);
    const missingElements = useMemo(() => findMissingElements(metamodel), [metamodel]);

    // Don't render if no metamodel or no classes
    if (!metamodel || !metamodel.classes || metamodel.classes.length === 0) {
        return null;
    }

    return (
        <div className="metamodel-overview">
            <div
                className="overview-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="overview-title">
                    <i className="bi bi-box-seam"></i>
                    <span>Metamodel Overview</span>
                    <span className="overview-count">({stats.classes} classes)</span>
                </div>
                <button className="overview-toggle">
                    <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                </button>
            </div>

            {isExpanded && (
                <div className="overview-content">
                    {/* Statistics */}
                    <div className="overview-section">
                        <h4 className="section-title">
                            <i className="bi bi-bar-chart"></i>
                            Statistics
                        </h4>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-label">Classes</span>
                                <span className="stat-value">{stats.classes}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Attributes</span>
                                <span className="stat-value">{stats.attributes}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">References</span>
                                <span className="stat-value">{stats.references}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Constraints</span>
                                <span className="stat-value">{stats.constraints}</span>
                            </div>
                        </div>

                        {/* Completeness Bar */}
                        <div className="completeness-bar">
                            <div className="completeness-label">
                                <span>Completeness</span>
                                <span className="completeness-value">{stats.completeness}%</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className={`progress-fill ${getCompletenessClass(stats.completeness)}`}
                                    style={{ width: `${stats.completeness}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Class Hierarchy */}
                    <div className="overview-section">
                        <h4 className="section-title">
                            <i className="bi bi-diagram-3"></i>
                            Class Hierarchy
                        </h4>
                        <div className="hierarchy-tree">
                            {hierarchy.map((node, idx) => (
                                <HierarchyNodeComponent key={idx} node={node} level={0} />
                            ))}
                        </div>
                    </div>

                    {/* Missing Elements */}
                    {missingElements.length > 0 && (
                        <div className="overview-section">
                            <h4 className="section-title">
                                <i className="bi bi-exclamation-triangle"></i>
                                Missing Elements ({missingElements.length})
                            </h4>
                            <div className="missing-list">
                                {missingElements.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className={`missing-item ${item.type}`}>
                                        <i className={`bi bi-${item.type === 'error' ? 'x-circle' : 'exclamation-circle'}`}></i>
                                        <span className="missing-element">{item.element}</span>
                                        <span className="missing-issue">{item.issue}</span>
                                    </div>
                                ))}
                                {missingElements.length > 5 && (
                                    <div className="missing-more">
                                        +{missingElements.length - 5} more issues
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Hierarchy Node Component
interface HierarchyNodeComponentProps {
    node: HierarchyNode;
    level: number;
}

function HierarchyNodeComponent({ node, level }: HierarchyNodeComponentProps): JSX.Element {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="hierarchy-node">
            <div
                className="node-label"
                style={{ paddingLeft: `${level * 20}px` }}
            >
                {hasChildren && (
                    <button
                        className="node-toggle"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`}></i>
                    </button>
                )}
                {!hasChildren && <span className="node-spacer"></span>}
                <i className={`node-icon bi ${getClassIcon(node)}`}></i>
                <span className="node-name">{node.name}</span>
                {node.isAbstract && <span className="node-badge abstract">abstract</span>}
                <span className="node-count">
                    ({node.attributeCount} attr, {node.referenceCount} ref)
                </span>
            </div>

            {hasChildren && isExpanded && (
                <div className="node-children">
                    {node.children.map((child, idx) => (
                        <HierarchyNodeComponent key={idx} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Helper Functions

function calculateStats(metamodel: Metamodel | null | undefined): MetamodelStats {
    if (!metamodel || !metamodel.classes) {
        return { classes: 0, attributes: 0, references: 0, constraints: 0, completeness: 0 };
    }

    const classes = metamodel.classes.length;

    const attributes = metamodel.classes.reduce(
        (sum, cls) => sum + (cls.attributes?.length || 0),
        0
    );

    const references = metamodel.classes.reduce(
        (sum, cls) => sum + (cls.references?.length || 0),
        0
    );

    const constraints = metamodel.classes.reduce(
        (sum, cls) => sum + (cls.constraints?.length || 0),
        0
    );

    // Calculate completeness (simple heuristic)
    let score = 0;
    let maxScore = 0;

    metamodel.classes.forEach((cls) => {
        maxScore += 5; // name, attributes, references, description, constraints

        if (cls.name) score += 1;
        if (cls.attributes && cls.attributes.length > 0) score += 1;
        if (cls.description) score += 1;
        if (cls.references && cls.references.length > 0) score += 1;
        if (cls.constraints && cls.constraints.length > 0) score += 1;
    });

    const completeness = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return { classes, attributes, references, constraints, completeness };
}

function buildHierarchy(metamodel: Metamodel | null | undefined): HierarchyNode[] {
    if (!metamodel || !metamodel.classes) {
        return [];
    }

    const classes = metamodel.classes;
    const classMap = new Map<string, HierarchyNode>();

    // Build map of all classes
    classes.forEach((cls) => {
        classMap.set(cls.name, {
            name: cls.name,
            isAbstract: cls.isAbstract || false,
            attributeCount: cls.attributes?.length || 0,
            referenceCount: cls.references?.length || 0,
            superclass: cls.superclass,
            children: [],
        });
    });

    // Build hierarchy
    const roots: HierarchyNode[] = [];

    classMap.forEach((node) => {
        if (node.superclass) {
            const parent = classMap.get(node.superclass);
            if (parent) {
                parent.children.push(node);
            } else {
                roots.push(node); // Parent not found, treat as root
            }
        } else {
            roots.push(node);
        }
    });

    return roots;
}

function findMissingElements(metamodel: Metamodel | null | undefined): MissingElement[] {
    if (!metamodel || !metamodel.classes) {
        return [];
    }

    const missing: MissingElement[] = [];

    metamodel.classes.forEach((cls) => {
        // Check for missing description
        if (!cls.description || cls.description.trim() === '') {
            missing.push({
                type: 'warning',
                element: cls.name,
                issue: 'No description',
            });
        }

        // Check for classes with no attributes
        if (!cls.attributes || cls.attributes.length === 0) {
            if (!cls.isAbstract) {
                // Abstract classes may not have attributes
                missing.push({
                    type: 'warning',
                    element: cls.name,
                    issue: 'No attributes defined',
                });
            }
        }

        // Check for isolated classes (no references in or out)
        const hasReferences = cls.references && cls.references.length > 0;
        const isReferenced = metamodel.classes?.some((other) =>
            other.references?.some((ref) => ref.target === cls.name)
        );

        if (!hasReferences && !isReferenced && !cls.superclass && !cls.isAbstract) {
            missing.push({
                type: 'warning',
                element: cls.name,
                issue: 'Isolated class (no relationships)',
            });
        }

        // Check for missing constraints on complex classes
        if (
            (!cls.constraints || cls.constraints.length === 0) &&
            cls.attributes &&
            cls.attributes.length > 3
        ) {
            missing.push({
                type: 'warning',
                element: cls.name,
                issue: 'No constraints defined',
            });
        }
    });

    return missing;
}

function getClassIcon(node: HierarchyNode): string {
    if (node.isAbstract) return 'bi-box';
    // Customize icons based on common class name patterns
    const nameLower = node.name.toLowerCase();
    if (nameLower.includes('sensor')) return 'bi-broadcast';
    if (nameLower.includes('bulb') || nameLower.includes('light')) return 'bi-lightbulb';
    if (nameLower.includes('person') || nameLower.includes('user')) return 'bi-person';
    if (nameLower.includes('device')) return 'bi-cpu';
    if (nameLower.includes('room') || nameLower.includes('space')) return 'bi-building';
    if (nameLower.includes('event') || nameLower.includes('action')) return 'bi-lightning';
    return 'bi-file-earmark';
}

function getCompletenessClass(percentage: number): string {
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
}

export default MetamodelOverview;
