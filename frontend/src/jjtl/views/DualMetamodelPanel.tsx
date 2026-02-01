/**
 * DualMetamodelPanel Component
 * Side-by-side view of source and target metamodels with mapping visualization
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MetamodelTreeView, MetamodelElement } from './MetamodelTreeView';
import { MappingLinesOverlay, MappingLine } from './MappingLinesOverlay';

export interface MappingConnection {
    id: string;
    sourceElementId: string;
    targetElementId: string;
    mappingType: 'class' | 'attribute' | 'reference';
    isInferred?: boolean;
}

export interface DualMetamodelPanelProps {
    sourceMetamodel: MetamodelElement[];
    targetMetamodel: MetamodelElement[];
    sourceMetamodelName: string;
    targetMetamodelName: string;
    mappings: MappingConnection[];
    selectedMapping?: string;
    onMappingSelect?: (mapping: MappingConnection) => void;
    onMappingCreate?: (sourceId: string, targetId: string) => void;
    onMappingDelete?: (mappingId: string) => void;
}

export const DualMetamodelPanel: React.FC<DualMetamodelPanelProps> = ({
    sourceMetamodel,
    targetMetamodel,
    sourceMetamodelName,
    targetMetamodelName,
    mappings,
    selectedMapping,
    onMappingSelect,
    onMappingCreate,
    onMappingDelete,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedSource, setSelectedSource] = useState<string | undefined>();
    const [selectedTarget, setSelectedTarget] = useState<string | undefined>();
    const [mappingLines, setMappingLines] = useState<MappingLine[]>([]);
    const [dragSource, setDragSource] = useState<MetamodelElement | null>(null);

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
        }));

        setMappingLines(lines);
    }, [mappings, selectedMapping]);

    // Get highlighted elements based on selected mapping
    const getHighlightedElements = useCallback((): Set<string> => {
        const highlighted = new Set<string>();
        if (selectedMapping) {
            const mapping = mappings.find(m => m.id === selectedMapping);
            if (mapping) {
                highlighted.add(mapping.sourceElementId);
                highlighted.add(mapping.targetElementId);
            }
        }
        return highlighted;
    }, [mappings, selectedMapping]);

    const highlightedElements = getHighlightedElements();

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
            {/* Source metamodel */}
            <div className="jjtl-dual-panel-side jjtl-dual-panel-source">
                <MetamodelTreeView
                    metamodel={sourceMetamodel}
                    title={sourceMetamodelName}
                    side="source"
                    selectedElement={selectedSource}
                    onElementSelect={handleSourceSelect}
                    onElementDragStart={handleSourceDragStart}
                    highlightedElements={highlightedElements}
                />
            </div>

            {/* Mapping lines overlay */}
            <div className="jjtl-dual-panel-center">
                <MappingLinesOverlay
                    lines={mappingLines}
                    containerRef={containerRef}
                    onLineClick={handleLineClick}
                    onLineDelete={onMappingDelete}
                />
            </div>

            {/* Target metamodel */}
            <div
                className="jjtl-dual-panel-side jjtl-dual-panel-target"
                onDrop={handleTargetDrop}
                onDragOver={handleDragOver}
            >
                <MetamodelTreeView
                    metamodel={targetMetamodel}
                    title={targetMetamodelName}
                    side="target"
                    selectedElement={selectedTarget}
                    onElementSelect={handleTargetSelect}
                    highlightedElements={highlightedElements}
                />
            </div>

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
