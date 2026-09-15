/**
 * DualMetamodelPanel Component
 * Side-by-side view of source and target metamodels with mapping visualization
 * Supports toggling between metamodel (schema) and instance (data) views
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MetamodelTreeView, MetamodelElement } from './MetamodelTreeView';
import { MappingLinesOverlay, MappingLine } from './MappingLinesOverlay';

/**
 * Format an instance attribute value for display
 */
function formatInstanceValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        return `[${value.length} items]`;
    }
    if (typeof value === 'object') {
        return '{...}';
    }
    return String(value);
}

export interface MappingConnection {
    id: string;
    sourceElementId: string;
    targetElementId: string;
    mappingType: 'class' | 'attribute' | 'reference';
    isInferred?: boolean;
    /** Status for visibility: pending only shows when hovered, toInsert always shows */
    status?: 'pending' | 'toInsert' | 'rejected';
}

export interface InstanceElement {
    id: string;
    name: string;
    className: string;
    attributes?: { name: string; value: any }[];
}

export type ViewMode = 'metamodel' | 'instances';

export interface DualMetamodelPanelProps {
    sourceMetamodel: MetamodelElement[];
    targetMetamodel: MetamodelElement[];
    sourceMetamodelName: string;
    targetMetamodelName: string;
    mappings: MappingConnection[];
    selectedMapping?: string;
    hoveredMapping?: string | null;
    onMappingSelect?: (mapping: MappingConnection) => void;
    onMappingHover?: (mappingId: string | null) => void;
    onMappingCreate?: (sourceId: string, targetId: string) => void;
    onMappingDelete?: (mappingId: string) => void;
    // Instance-level props
    sourceInstances?: InstanceElement[];
    targetInstances?: InstanceElement[];
    viewMode?: ViewMode;
    onViewModeChange?: (mode: ViewMode) => void;
}

export const DualMetamodelPanel: React.FC<DualMetamodelPanelProps> = ({
    sourceMetamodel,
    targetMetamodel,
    sourceMetamodelName,
    targetMetamodelName,
    mappings,
    selectedMapping,
    hoveredMapping,
    onMappingSelect,
    onMappingHover,
    onMappingCreate,
    // Instance-level props
    sourceInstances = [],
    targetInstances = [],
    viewMode: externalViewMode,
    onViewModeChange,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedSource, setSelectedSource] = useState<string | undefined>();
    const [selectedTarget, setSelectedTarget] = useState<string | undefined>();
    const [mappingLines, setMappingLines] = useState<MappingLine[]>([]);
    const [dragSource, setDragSource] = useState<MetamodelElement | null>(null);
    const [internalHoveredMapping, setInternalHoveredMapping] = useState<string | null>(null);

    // View mode state (controlled or uncontrolled)
    const [internalViewMode, setInternalViewMode] = useState<ViewMode>('metamodel');
    const viewMode = externalViewMode ?? internalViewMode;

    const handleViewModeChange = useCallback((mode: ViewMode) => {
        if (onViewModeChange) {
            onViewModeChange(mode);
        } else {
            setInternalViewMode(mode);
        }
    }, [onViewModeChange]);

    // Convert instances to MetamodelElement format for display in tree
    const convertInstancesToElements = useCallback((instances: InstanceElement[]): MetamodelElement[] => {
        // Group instances by className
        const grouped = instances.reduce((acc, inst) => {
            if (!acc[inst.className]) {
                acc[inst.className] = [];
            }
            acc[inst.className].push(inst);
            return acc;
        }, {} as Record<string, InstanceElement[]>);

        // Create tree structure: Class -> Instances
        return Object.entries(grouped).map(([className, classInstances]) => ({
            id: `class-${className}`,
            name: className,
            type: 'class' as const,
            children: classInstances.map(inst => ({
                id: inst.id,
                name: inst.name || inst.id,
                type: 'attribute' as const, // Use attribute type for instances
                children: inst.attributes?.map(attr => ({
                    id: `${inst.id}-${attr.name}`,
                    name: `${attr.name}: ${formatInstanceValue(attr.value)}`,
                    type: 'attribute' as const,
                })) || [],
            })),
        }));
    }, []);

    // Get displayed elements based on view mode
    const displayedSourceElements = viewMode === 'instances'
        ? convertInstancesToElements(sourceInstances)
        : sourceMetamodel;

    const displayedTargetElements = viewMode === 'instances'
        ? convertInstancesToElements(targetInstances)
        : targetMetamodel;

    const hasSourceInstances = sourceInstances.length > 0;
    const hasTargetInstances = targetInstances.length > 0;
    const hasAnyInstances = hasSourceInstances || hasTargetInstances;

    // Combine internal and external hover state
    const effectiveHoveredMapping = hoveredMapping ?? internalHoveredMapping;

    // Calculate mapping lines from connections
    useEffect(() => {
        if (!containerRef.current) return;

        const lines: MappingLine[] = mappings.map(mapping => ({
            id: mapping.id,
            sourceId: mapping.sourceElementId,
            targetId: mapping.targetElementId,
            type: mapping.mappingType,
            isInferred: mapping.isInferred,
            isSelected: mapping.id === selectedMapping,
            status: mapping.status,
        }));

        // console.log('[DualMetamodelPanel] Mappings received:', mappings.length, mappings.map(m => ({ id: m.id, status: m.status })));
        // console.log('[DualMetamodelPanel] MappingLines created:', lines.length, lines.map(l => ({ id: l.id, status: l.status })));

        setMappingLines(lines);
    }, [mappings, selectedMapping]);

    // Get highlighted elements based on selected or hovered mapping
    const getHighlightedElements = useCallback((): Set<string> => {
        const highlighted = new Set<string>();

        // Highlight selected mapping elements
        if (selectedMapping) {
            const mapping = mappings.find(m => m.id === selectedMapping);
            if (mapping) {
                highlighted.add(mapping.sourceElementId);
                highlighted.add(mapping.targetElementId);
            }
        }

        // Also highlight hovered mapping elements
        if (effectiveHoveredMapping) {
            const mapping = mappings.find(m => m.id === effectiveHoveredMapping);
            if (mapping) {
                highlighted.add(mapping.sourceElementId);
                highlighted.add(mapping.targetElementId);
            }
        }

        return highlighted;
    }, [mappings, selectedMapping, effectiveHoveredMapping]);

    const highlightedElements = getHighlightedElements();

    // Handle line hover
    const handleLineHover = useCallback((lineId: string | null) => {
        setInternalHoveredMapping(lineId);
        onMappingHover?.(lineId);
    }, [onMappingHover]);

    // Handle element selection
    const handleSourceSelect = useCallback((element: MetamodelElement) => {
        setSelectedSource(element.id);

        // Find mapping for this source
        const mapping = mappings.find(m => m.sourceElementId === element.id);
        if (mapping) {
            onMappingSelect?.(mapping);
        }
    }, [mappings, onMappingSelect]);

    const handleTargetSelect = useCallback((element: MetamodelElement) => {
        setSelectedTarget(element.id);

        // Find mapping for this target
        const mapping = mappings.find(m => m.targetElementId === element.id);
        if (mapping) {
            onMappingSelect?.(mapping);
        }
    }, [mappings, onMappingSelect]);

    // Handle drag and drop for creating mappings
    const handleSourceDragStart = useCallback((element: MetamodelElement) => {
        setDragSource(element);
    }, []);

    const handleTargetDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!dragSource) return;

        try {
            const targetData = e.dataTransfer.getData('text/plain');
            const targetElement = JSON.parse(targetData) as MetamodelElement;

            if (dragSource && targetElement) {
                onMappingCreate?.(dragSource.id, targetElement.id);
            }
        } catch {
            // Ignore parse errors
        }

        setDragSource(null);
    }, [dragSource, onMappingCreate]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'link';
    }, []);

    // Handle line click
    const handleLineClick = useCallback((lineId: string) => {
        const mapping = mappings.find(m => m.id === lineId);
        if (mapping) {
            onMappingSelect?.(mapping);
        }
    }, [mappings, onMappingSelect]);

    return (
        <div className="jjtl-dual-panel" ref={containerRef}>
            {/* View mode toggle - only show when instances are available */}
            {hasAnyInstances && (
                <div className="jjtl-dual-panel-view-toggle">
                    <button
                        className={`jjtl-view-toggle-btn ${viewMode === 'metamodel' ? 'active' : ''}`}
                        onClick={() => handleViewModeChange('metamodel')}
                        title="View metamodel structure"
                    >
                        <i className="bi bi-diagram-3" />
                        <span>Schema</span>
                    </button>
                    <button
                        className={`jjtl-view-toggle-btn ${viewMode === 'instances' ? 'active' : ''}`}
                        onClick={() => handleViewModeChange('instances')}
                        title="View model instances"
                    >
                        <i className="bi bi-collection" />
                        <span>Instances</span>
                        {(hasSourceInstances || hasTargetInstances) && (
                            <span className="jjtl-view-toggle-badge">
                                {sourceInstances.length + targetInstances.length}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* Source metamodel/instances */}
            <div className="jjtl-dual-panel-side jjtl-dual-panel-source">
                <MetamodelTreeView
                    metamodel={displayedSourceElements}
                    title={viewMode === 'instances' ? `${sourceMetamodelName} Instances` : sourceMetamodelName}
                    side="source"
                    selectedElement={selectedSource}
                    onElementSelect={handleSourceSelect}
                    onElementDragStart={handleSourceDragStart}
                    highlightedElements={highlightedElements}
                />
                {viewMode === 'instances' && sourceInstances.length === 0 && (
                    <div className="jjtl-dual-panel-no-instances">
                        <i className="bi bi-inbox" />
                        <span>No source instances</span>
                    </div>
                )}
            </div>

            {/* Center spacer for visual separation */}
            <div className="jjtl-dual-panel-center" />

            {/* Target metamodel/instances */}
            <div
                className="jjtl-dual-panel-side jjtl-dual-panel-target"
                onDrop={handleTargetDrop}
                onDragOver={handleDragOver}
            >
                <MetamodelTreeView
                    metamodel={displayedTargetElements}
                    title={viewMode === 'instances' ? `${targetMetamodelName} Instances` : targetMetamodelName}
                    side="target"
                    selectedElement={selectedTarget}
                    onElementSelect={handleTargetSelect}
                    highlightedElements={highlightedElements}
                />
                {viewMode === 'instances' && targetInstances.length === 0 && (
                    <div className="jjtl-dual-panel-no-instances">
                        <i className="bi bi-inbox" />
                        <span>No target instances</span>
                    </div>
                )}
            </div>

            {/* Mapping lines overlay - covers entire panel (only show in metamodel mode) */}
            {viewMode === 'metamodel' && (
                <MappingLinesOverlay
                    lines={mappingLines}
                    containerRef={containerRef}
                    hoveredLineId={effectiveHoveredMapping}
                    onLineClick={handleLineClick}
                    onLineHover={handleLineHover}
                />
            )}

            {/* Drag hint */}
            {dragSource && (
                <div className="jjtl-dual-panel-drag-hint">
                    Drag to target element to create mapping
                </div>
            )}
        </div>
    );
};

export default DualMetamodelPanel;
