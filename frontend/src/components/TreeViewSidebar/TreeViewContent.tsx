import React, { Dispatch, ReactElement, memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import type { FakeStateProps } from '../../joiner';
import {
    DState,
    LModel,
    LNamedElement,
    LPointerTargetable,
    SetRootFieldAction,
} from '../../joiner';
import { useStateIfMounted } from 'use-state-if-mounted';
import { useTreeViewPanel, ElementAction } from '../../contexts/TreeViewPanelContext';

/**
 * TreeViewContent Component (Optimized)
 *
 * Performance optimizations:
 * - Memoized TreeNode and MetamodelTree components
 * - Data passed directly instead of repeated fromPointer calls
 * - Shallow comparison in mapStateToProps
 * - Virtualization-ready structure
 */

interface TreeViewContentProps {
    onSelect?: () => void;
}

// Simplified node data structure to avoid repeated L-object lookups
interface TreeNodeData {
    id: string;
    name: string;
    className: string;
    isAbstract?: boolean;
    extendsNames?: string[];
    children?: TreeNodeData[];
    nodeId?: string;
    viewId?: string;
}

interface TreeNodeProps {
    data: TreeNodeData;
    depth: number;
    selectedId?: string;
    onSelect?: () => void;
    // Highlighting props
    highlightedElementId?: string | null;
    highlightedAction?: ElementAction | null;
    expandedNodeIds?: Set<string>;
    isScriptExecuting?: boolean;
}

/**
 * Memoized TreeNode - only re-renders when props change
 */
const TreeNode = memo(function TreeNode({
    data,
    depth,
    selectedId,
    onSelect,
    highlightedElementId,
    highlightedAction,
    expandedNodeIds,
    isScriptExecuting
}: TreeNodeProps): ReactElement {
    const nodeRef = useRef<HTMLDivElement>(null);

    // Check if this node or any child is highlighted
    const isHighlighted = highlightedElementId === data.id;
    const shouldForceExpand = expandedNodeIds?.has(data.id);

    // Check if any descendant is highlighted (for auto-expand)
    const hasHighlightedDescendant = useMemo(() => {
        if (!highlightedElementId || !data.children) return false;
        const checkDescendants = (children: TreeNodeData[]): boolean => {
            for (const child of children) {
                if (child.id === highlightedElementId) return true;
                if (child.children && checkDescendants(child.children)) return true;
            }
            return false;
        };
        return checkDescendants(data.children);
    }, [highlightedElementId, data.children]);

    const [isExpanded, setIsExpanded] = useStateIfMounted(
        depth < 2 || shouldForceExpand || hasHighlightedDescendant
    );

    // Auto-expand when forced or has highlighted descendant
    useEffect(() => {
        if (shouldForceExpand || hasHighlightedDescendant) {
            setIsExpanded(true);
        }
    }, [shouldForceExpand, hasHighlightedDescendant, setIsExpanded]);

    const hasChildren = data.children && data.children.length > 0;
    const isSelected = selectedId === data.id;

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        SetRootFieldAction.new('_lastSelected', {
            node: data.nodeId,
            view: data.viewId,
            modelElement: data.id
        }, '', false);
        onSelect?.();
    }, [data.id, data.nodeId, data.viewId, onSelect]);

    const toggleExpand = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(prev => !prev);
    }, [setIsExpanded]);

    // Get icon letter based on class type
    const iconLetter = useMemo(() => {
        if (data.className === 'DEnumLiteral') return 'L';
        return data.className.slice(1, 2);
    }, [data.className]);

    // Build highlight class name
    const highlightClass = isHighlighted
        ? `tree-node__header--highlighted tree-node__header--action-${highlightedAction || 'unknown'}`
        : '';

    return (
        <div
            ref={nodeRef}
            className="tree-node"
            data-element-id={data.id}
        >
            <div
                className={`tree-node__header ${isSelected ? 'tree-node__header--selected' : ''} ${highlightClass}`}
                style={{ paddingLeft: `${depth * 12}px` }}
            >
                <button
                    className="tree-node__toggle"
                    onClick={toggleExpand}
                    disabled={!hasChildren}
                >
                    {hasChildren ? (
                        <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} />
                    ) : (
                        <span className="tree-node__spacer" />
                    )}
                </button>

                <div className="tree-node__content" onClick={handleClick}>
                    <span className={`tree-node__icon tree-${data.className} ${data.isAbstract ? 'abstract-class' : ''}`}>
                        {iconLetter}
                    </span>
                    <span className="tree-node__name">
                        {data.name || 'unnamed'}
                    </span>
                    {data.extendsNames && data.extendsNames.length > 0 && (
                        <span className="tree-node__extends">
                            → [{data.extendsNames.join(', ')}]
                        </span>
                    )}
                    {/* NEW badge for created elements */}
                    {isHighlighted && highlightedAction === 'create' && (
                        <span className="tree-node__badge tree-node__badge--new">NEW</span>
                    )}
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div className="tree-node__children">
                    {data.children!.map((child) => (
                        <TreeNode
                            key={child.id}
                            data={child}
                            depth={depth + 1}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            highlightedElementId={highlightedElementId}
                            highlightedAction={highlightedAction}
                            expandedNodeIds={expandedNodeIds}
                            isScriptExecuting={isScriptExecuting}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

interface MetamodelTreeProps {
    metamodel: TreeNodeData;
    packages: TreeNodeData[];
    selectedId?: string;
    onSelect?: () => void;
    defaultExpanded?: boolean;
    // Highlighting props
    highlightedElementId?: string | null;
    highlightedAction?: ElementAction | null;
    expandedNodeIds?: Set<string>;
    isScriptExecuting?: boolean;
}

/**
 * Memoized MetamodelTree
 */
const MetamodelTree = memo(function MetamodelTree({
    metamodel,
    packages,
    selectedId,
    onSelect,
    defaultExpanded = true,
    highlightedElementId,
    highlightedAction,
    expandedNodeIds,
    isScriptExecuting
}: MetamodelTreeProps): ReactElement {
    const [isExpanded, setIsExpanded] = useStateIfMounted(defaultExpanded);

    // Check if this metamodel is highlighted
    const isHighlighted = highlightedElementId === metamodel.id;

    // Auto-expand when any descendant is highlighted
    const hasHighlightedDescendant = useMemo(() => {
        if (!highlightedElementId) return false;
        const checkPackages = (pkgs: TreeNodeData[]): boolean => {
            for (const pkg of pkgs) {
                if (pkg.id === highlightedElementId) return true;
                if (pkg.children) {
                    const checkChildren = (children: TreeNodeData[]): boolean => {
                        for (const child of children) {
                            if (child.id === highlightedElementId) return true;
                            if (child.children && checkChildren(child.children)) return true;
                        }
                        return false;
                    };
                    if (checkChildren(pkg.children)) return true;
                }
            }
            return false;
        };
        return checkPackages(packages);
    }, [highlightedElementId, packages]);

    // Auto-expand when highlighted descendant found
    useEffect(() => {
        if (hasHighlightedDescendant) {
            setIsExpanded(true);
        }
    }, [hasHighlightedDescendant, setIsExpanded]);

    const handleToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(prev => !prev);
    }, [setIsExpanded]);

    const handleMetamodelClick = useCallback(() => {
        SetRootFieldAction.new('_lastSelected', {
            node: metamodel.nodeId,
            view: metamodel.viewId,
            modelElement: metamodel.id
        }, '', false);
        onSelect?.();
    }, [metamodel.id, metamodel.nodeId, metamodel.viewId, onSelect]);

    // Build highlight class name for metamodel
    const highlightClass = isHighlighted
        ? `metamodel-tree__header--highlighted metamodel-tree__header--action-${highlightedAction || 'unknown'}`
        : '';

    return (
        <div className="metamodel-tree" data-element-id={metamodel.id}>
            <div className={`metamodel-tree__header ${highlightClass}`}>
                <button className="tree-node__toggle" onClick={handleToggle}>
                    <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} />
                </button>
                <div className="metamodel-tree__title" onClick={handleMetamodelClick}>
                    <span className="tree-node__icon tree-DModel">M</span>
                    <span>{metamodel.name || 'Unnamed Metamodel'}</span>
                    {/* NEW badge for created metamodels */}
                    {isHighlighted && highlightedAction === 'create' && (
                        <span className="tree-node__badge tree-node__badge--new">NEW</span>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="metamodel-tree__content">
                    {packages.length > 0 ? (
                        packages.map((pkg) => (
                            <TreeNode
                                key={pkg.id}
                                data={pkg}
                                depth={1}
                                selectedId={selectedId}
                                onSelect={onSelect}
                                highlightedElementId={highlightedElementId}
                                highlightedAction={highlightedAction}
                                expandedNodeIds={expandedNodeIds}
                                isScriptExecuting={isScriptExecuting}
                            />
                        ))
                    ) : (
                        <div className="tree-empty-package">
                            <span>No packages</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

/**
 * Convert LModel element to simplified TreeNodeData (recursive)
 * Uses LNamedElement.fromPointer to ensure children getter works correctly
 */
function convertToTreeData(element: any): TreeNodeData {
    // Use LNamedElement to properly access the children getter
    const namedElement = LNamedElement.fromPointer(element.id);

    const data: TreeNodeData = {
        id: element.id,
        name: element.name || 'unnamed',
        className: element.className || 'DModelElement',
        isAbstract: element.abstract,
        nodeId: element.node?.id,
        viewId: element.node?.view?.id,
    };

    // Get extends names for classes
    if (element.extends && element.extends.length > 0) {
        data.extendsNames = element.extends.map((s: any) => s?.name).filter(Boolean);
    }

    // Convert children recursively - use namedElement.children for proper getter access
    const children = (namedElement as any)?.children;
    if (children && Array.isArray(children) && children.length > 0) {
        data.children = children.map((child: any) => convertToTreeData(child));
    }

    return data;
}

interface ProcessedMetamodel {
    data: TreeNodeData;
    packages: TreeNodeData[];
}

function TreeViewContentComponent(props: AllProps & TreeViewContentProps) {
    const { processedMetamodels, selectedElementId, onSelect } = props;
    const containerRef = useRef<HTMLDivElement>(null);

    // Get highlighting state from context
    const {
        highlightedElementId,
        highlightedAction,
        expandedNodeIds,
        isScriptExecuting
    } = useTreeViewPanel();

    // Listen for scroll-to-element events
    useEffect(() => {
        const handleScrollToElement = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { elementId } = customEvent.detail || {};

            if (!elementId || !containerRef.current) return;

            // Find the element by data-element-id
            const targetElement = containerRef.current.querySelector(`[data-element-id="${elementId}"]`);

            if (targetElement) {
                // Scroll element into view with smooth animation
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
            }
        };

        window.addEventListener('treeview:scroll-to-element', handleScrollToElement);

        return () => {
            window.removeEventListener('treeview:scroll-to-element', handleScrollToElement);
        };
    }, []);

    if (!processedMetamodels || processedMetamodels.length === 0) {
        return (
            <div className="tree-view-empty">
                <i className="bi bi-diagram-3" />
                <p>No metamodels</p>
                <span>Create a metamodel to see the hierarchy</span>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="tree-view-content">
            {processedMetamodels.map((mm, index) => (
                <MetamodelTree
                    key={mm.data.id}
                    metamodel={mm.data}
                    packages={mm.packages}
                    selectedId={selectedElementId}
                    onSelect={onSelect}
                    defaultExpanded={index === 0}
                    highlightedElementId={highlightedElementId}
                    highlightedAction={highlightedAction}
                    expandedNodeIds={expandedNodeIds}
                    isScriptExecuting={isScriptExecuting}
                />
            ))}
        </div>
    );
}

interface OwnProps extends TreeViewContentProps {}

interface StateProps {
    processedMetamodels: ProcessedMetamodel[];
    selectedElementId?: string;
}

interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;

    // Get metamodels fresh on each state change to ensure dynamic updates
    const metamodelPointers = state.m2models || [];
    const metamodels: LModel[] = LPointerTargetable.fromPointer(metamodelPointers) || [];

    ret.processedMetamodels = metamodels.map((mm) => ({
        data: {
            id: mm.id,
            name: mm.name || 'Unnamed Metamodel',
            className: 'DModel',
            nodeId: mm.node?.id,
            viewId: mm.node?.view?.id,
        },
        packages: (mm.packages || []).map((pkg: any) => convertToTreeData(pkg))
    }));

    ret.selectedElementId = state._lastSelected?.modelElement || undefined;

    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    return {};
}

export const TreeViewContentConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(TreeViewContentComponent);

export const TreeViewContent = (props: TreeViewContentProps): ReactElement => {
    return <TreeViewContentConnected {...props} />;
};

export default TreeViewContent;
