/**
 * MetamodelTreeView Component
 * Displays a metamodel as a collapsible tree structure
 */

import React, { useState, useCallback } from 'react';
import { Badge } from '../../components/common/Badge';

export interface MetamodelElement {
    id: string;
    name: string;
    type: 'package' | 'class' | 'attribute' | 'reference' | 'enumeration' | 'literal';
    children?: MetamodelElement[];
    dataType?: string;
    multiplicity?: string;
    isAbstract?: boolean;
}

export interface MetamodelTreeViewProps {
    metamodel: MetamodelElement[];
    title: string;
    side: 'source' | 'target';
    selectedElement?: string;
    onElementSelect?: (element: MetamodelElement) => void;
    onElementDragStart?: (element: MetamodelElement, e: React.DragEvent) => void;
    highlightedElements?: Set<string>;
}

// Type icons and colors
const TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
    package: { icon: 'bi-folder', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' },
    class: { icon: 'bi-diagram-3', color: '#0ea5e9', bgColor: 'rgba(14, 165, 233, 0.15)' },
    attribute: { icon: 'bi-tag', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
    reference: { icon: 'bi-link-45deg', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' },
    enumeration: { icon: 'bi-list-ul', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)' },
    literal: { icon: 'bi-hash', color: '#f472b6', bgColor: 'rgba(244, 114, 182, 0.15)' },
};

interface TreeNodeProps {
    element: MetamodelElement;
    depth: number;
    selectedElement?: string;
    onSelect?: (element: MetamodelElement) => void;
    onDragStart?: (element: MetamodelElement, e: React.DragEvent) => void;
    highlightedElements?: Set<string>;
}

const TreeNode: React.FC<TreeNodeProps> = ({
    element,
    depth,
    selectedElement,
    onSelect,
    onDragStart,
    highlightedElements,
}) => {
    const [isExpanded, setIsExpanded] = useState(depth < 2);
    const hasChildren = element.children && element.children.length > 0;
    const config = TYPE_CONFIG[element.type] || TYPE_CONFIG.class;
    const isSelected = selectedElement === element.id;
    const isHighlighted = highlightedElements?.has(element.id);

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasChildren) {
            setIsExpanded(!isExpanded);
        }
        onSelect?.(element);
    }, [element, hasChildren, isExpanded, onSelect]);

    const handleDragStart = useCallback((e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', JSON.stringify(element));
        e.dataTransfer.effectAllowed = 'link';
        onDragStart?.(element, e);
    }, [element, onDragStart]);

    return (
        <div className="jjtl-tree-node">
            <div
                className={`jjtl-tree-node-content ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={handleClick}
                draggable={element.type === 'class' || element.type === 'attribute'}
                onDragStart={handleDragStart}
                data-element-id={element.id}
                data-element-name={element.name}
                data-element-type={element.type}
            >
                {/* Expand/collapse icon */}
                <span className="jjtl-tree-expand" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
                    {hasChildren ? (
                        <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
                    ) : (
                        <span style={{ width: 16 }} />
                    )}
                </span>

                {/* Type icon */}
                <span
                    className="jjtl-tree-icon"
                    style={{ backgroundColor: config.bgColor, color: config.color }}
                >
                    <i className={`bi ${config.icon}`} />
                </span>

                {/* Element name */}
                <span className="jjtl-tree-name">
                    {element.name}
                    {element.isAbstract && <span className="jjtl-tree-abstract">abstract</span>}
                </span>

                {/* Data type or multiplicity */}
                {element.dataType && (
                    <span className="jjtl-tree-type">{element.dataType}</span>
                )}
                {element.multiplicity && (
                    <span className="jjtl-tree-multiplicity">[{element.multiplicity}]</span>
                )}
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div className="jjtl-tree-children">
                    {element.children!.map(child => (
                        <TreeNode
                            key={child.id}
                            element={child}
                            depth={depth + 1}
                            selectedElement={selectedElement}
                            onSelect={onSelect}
                            onDragStart={onDragStart}
                            highlightedElements={highlightedElements}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const MetamodelTreeView: React.FC<MetamodelTreeViewProps> = ({
    metamodel,
    title,
    side,
    selectedElement,
    onElementSelect,
    onElementDragStart,
    highlightedElements,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter elements by search
    const filterElements = useCallback((elements: MetamodelElement[]): MetamodelElement[] => {
        if (!searchQuery) return elements;

        return elements.reduce<MetamodelElement[]>((acc, el) => {
            const matchesSearch = el.name.toLowerCase().includes(searchQuery.toLowerCase());
            const filteredChildren = el.children ? filterElements(el.children) : [];

            if (matchesSearch || filteredChildren.length > 0) {
                acc.push({
                    ...el,
                    children: filteredChildren.length > 0 ? filteredChildren : el.children,
                });
            }
            return acc;
        }, []);
    }, [searchQuery]);

    const filteredMetamodel = filterElements(metamodel);

    return (
        <div className={`jjtl-metamodel-tree jjtl-metamodel-tree--${side}`}>
            {/* Header */}
            <div className="jjtl-metamodel-tree-header">
                <span className="jjtl-metamodel-tree-title">{title}</span>
                <Badge category="type">
                    {side === 'source' ? 'SRC' : 'TGT'}
                </Badge>
            </div>

            {/* Search */}
            <div className="jjtl-metamodel-tree-search">
                <i className="bi bi-search" />
                <input
                    type="text"
                    placeholder="Search elements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')}>
                        <i className="bi bi-x" />
                    </button>
                )}
            </div>

            {/* Tree */}
            <div className="jjtl-metamodel-tree-content">
                {filteredMetamodel.length > 0 ? (
                    filteredMetamodel.map(element => (
                        <TreeNode
                            key={element.id}
                            element={element}
                            depth={0}
                            selectedElement={selectedElement}
                            onSelect={onElementSelect}
                            onDragStart={onElementDragStart}
                            highlightedElements={highlightedElements}
                        />
                    ))
                ) : (
                    <div className="jjtl-metamodel-tree-empty">
                        {searchQuery ? 'No elements match your search' : 'No metamodel loaded'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MetamodelTreeView;
