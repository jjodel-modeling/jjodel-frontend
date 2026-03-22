import React, { Dispatch, ReactElement, memo, useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import {
    DState,
    DGraph,
    LModel,
    LObject,
    LNamedElement,
    LPointerTargetable,
    SetRootFieldAction,
} from '../../joiner';
import { resolveEntityType, entityLetter, entityIcon } from '../../common/entityMeta';
import { FakeStateProps } from '../../joiner/types';
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

    // Get icon letter from centralized entityMeta
    const iconLetter = useMemo(() => {
        const resolved = resolveEntityType(data.className);
        return resolved ? entityLetter(resolved) : data.className.slice(1, 2);
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

interface ModelTreeProps {
    model: TreeNodeData;
    objects: TreeNodeData[];
    selectedId?: string;
    onSelect?: () => void;
    defaultExpanded?: boolean;
    highlightedElementId?: string | null;
    highlightedAction?: ElementAction | null;
    expandedNodeIds?: Set<string>;
    isScriptExecuting?: boolean;
}

/**
 * Memoized ModelTree — renders an M1 model with its objects
 */
const ModelTree = memo(function ModelTree({
    model,
    objects,
    selectedId,
    onSelect,
    defaultExpanded = true,
    highlightedElementId,
    highlightedAction,
    expandedNodeIds,
    isScriptExecuting
}: ModelTreeProps): ReactElement {
    const [isExpanded, setIsExpanded] = useStateIfMounted(defaultExpanded);

    const isHighlighted = highlightedElementId === model.id;

    const hasHighlightedDescendant = useMemo(() => {
        if (!highlightedElementId) return false;
        const checkObjects = (objs: TreeNodeData[]): boolean => {
            for (const obj of objs) {
                if (obj.id === highlightedElementId) return true;
                if (obj.children) {
                    const checkChildren = (children: TreeNodeData[]): boolean => {
                        for (const child of children) {
                            if (child.id === highlightedElementId) return true;
                            if (child.children && checkChildren(child.children)) return true;
                        }
                        return false;
                    };
                    if (checkChildren(obj.children)) return true;
                }
            }
            return false;
        };
        return checkObjects(objects);
    }, [highlightedElementId, objects]);

    useEffect(() => {
        if (hasHighlightedDescendant) {
            setIsExpanded(true);
        }
    }, [hasHighlightedDescendant, setIsExpanded]);

    const handleToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(prev => !prev);
    }, [setIsExpanded]);

    const handleModelClick = useCallback(() => {
        SetRootFieldAction.new('_lastSelected', {
            node: model.nodeId,
            view: model.viewId,
            modelElement: model.id
        }, '', false);
        onSelect?.();
    }, [model.id, model.nodeId, model.viewId, onSelect]);

    const highlightClass = isHighlighted
        ? `metamodel-tree__header--highlighted metamodel-tree__header--action-${highlightedAction || 'unknown'}`
        : '';

    return (
        <div className="metamodel-tree" data-element-id={model.id}>
            <div className={`metamodel-tree__header ${highlightClass}`}>
                <button className="tree-node__toggle" onClick={handleToggle}>
                    <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} />
                </button>
                <div className="metamodel-tree__title" onClick={handleModelClick}>
                    <span className="tree-node__icon tree-nested-model">m</span>
                    <span>{model.name || 'Unnamed Model'}</span>
                    {isHighlighted && highlightedAction === 'create' && (
                        <span className="tree-node__badge tree-node__badge--new">NEW</span>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="metamodel-tree__content">
                    {objects.length > 0 ? (
                        objects.map((obj) => (
                            <TreeNode
                                key={obj.id}
                                data={obj}
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
                            <span>No instances</span>
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

/** Instance data for M1 objects displayed under a model in the tree */
interface TreeInstanceData {
    id: string;
    objectId: string;
    name: string;
    metaclassName: string;
    modelId: string;
}

/** M1 model displayed nested under its parent metamodel */
interface TreeModelData {
    id: string;
    name: string;
    metamodelId: string | null;
    isActive: boolean;
    instances: TreeInstanceData[];
}

interface ProcessedMetamodel {
    data: TreeNodeData;
    packages: TreeNodeData[];
    /** M1 models that conform to this metamodel */
    childModels: TreeModelData[];
}

interface ProcessedModel {
    data: TreeNodeData;
    objects: TreeNodeData[];
}

/**
 * InstanceItem — renders a single M1 object instance in the tree.
 * Click dispatches jjodel:selectNode to select it on the canvas.
 */
const InstanceItem = memo(function InstanceItem({
    instance,
    depth,
    selectedId,
    onSelect,
}: {
    instance: TreeInstanceData;
    depth: number;
    selectedId?: string;
    onSelect?: () => void;
}): ReactElement {
    const isSelected = selectedId === instance.objectId;

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        // Dispatch custom event for EditorV2 to select the node on the canvas
        window.dispatchEvent(new CustomEvent('jjodel:selectNode', {
            detail: { nodeId: instance.id, modelId: instance.modelId }
        }));
        onSelect?.();
    }, [instance.id, instance.modelId, onSelect]);

    return (
        <div className="tree-node" data-element-id={instance.objectId}>
            <div
                className={`tree-node__header ${isSelected ? 'tree-node__header--selected' : ''}`}
                style={{ paddingLeft: `${depth * 12}px` }}
            >
                <span className="tree-node__spacer" style={{ width: 16 }} />
                <div className="tree-node__content" onClick={handleClick}>
                    <i className="bi bi-app-fill tree-instance__icon" />
                    <span className="tree-node__name tree-instance__name">
                        {instance.name}
                    </span>
                    <span className="tree-instance__metaclass">
                        : {instance.metaclassName}
                    </span>
                </div>
            </div>
        </div>
    );
});

/**
 * NestedModelTree — renders an M1 model nested under its metamodel.
 * Shows instances only when isActive.
 */
const NestedModelTree = memo(function NestedModelTree({
    model,
    depth,
    selectedId,
    onSelect,
}: {
    model: TreeModelData;
    depth: number;
    selectedId?: string;
    onSelect?: () => void;
}): ReactElement {
    const [isExpanded, setIsExpanded] = useStateIfMounted(model.isActive);

    // Auto-expand/collapse when active state changes
    useEffect(() => {
        if (model.isActive) setIsExpanded(true);
    }, [model.isActive, setIsExpanded]);

    const handleToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (model.isActive && model.instances.length > 0) {
            setIsExpanded(prev => !prev);
        }
    }, [model.isActive, model.instances.length, setIsExpanded]);

    const handleModelClick = useCallback(() => {
        SetRootFieldAction.new('_lastSelected', {
            node: '',
            view: '',
            modelElement: model.id
        }, '', false);
        onSelect?.();
    }, [model.id, onSelect]);

    // Show chevron if instances exist (even when not active — just not expandable)
    const hasChildren = model.instances.length > 0;
    const canExpand = model.isActive && hasChildren;

    return (
        <div className="tree-node nested-model-tree" data-element-id={model.id}>
            <div
                className="tree-node__header"
                style={{ paddingLeft: `${depth * 12}px` }}
            >
                <button
                    className="tree-node__toggle"
                    onClick={handleToggle}
                    disabled={!canExpand}
                >
                    {hasChildren ? (
                        <i className={`bi bi-chevron-${isExpanded && canExpand ? 'down' : 'right'}`} />
                    ) : (
                        <span className="tree-node__spacer" />
                    )}
                </button>

                <div className="tree-node__content" onClick={handleModelClick}>
                    <span className="tree-node__icon tree-nested-model">m</span>
                    <span className="tree-node__name">{model.name || 'Unnamed Model'}</span>
                    <span className="tree-nested-model__badge">M1</span>
                </div>
            </div>

            {isExpanded && canExpand && (
                <div className="tree-node__children">
                    {model.instances.map((inst) => (
                        <InstanceItem
                            key={inst.id}
                            instance={inst}
                            depth={depth + 1}
                            selectedId={selectedId}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

// ─── Transformation data received via CustomEvent from ProjectEditor ────────

interface TreeTransformationData {
    id: string;
    name: string;
    sourceMMName?: string;
    targetMMName?: string;
}

/**
 * MegamodelEntry — top-level entry that opens the Megamodel view on click
 */
const MegamodelEntry = memo(function MegamodelEntry(): ReactElement {
    const handleClick = useCallback(() => {
        window.dispatchEvent(new CustomEvent('jjodel:openMegamodel'));
    }, []);

    return (
        <div className="megamodel-entry" onClick={handleClick}>
            <div className="megamodel-entry__header">
                <span className="megamodel-entry__icon">
                    <i className="bi bi-diagram-3-fill" />
                </span>
                <span className="megamodel-entry__label">Megamodel</span>
            </div>
        </div>
    );
});

/**
 * TransformationItem — a single transformation entry in the tree
 */
const TransformationItem = memo(function TransformationItem({
    transformation,
    selectedId,
    onSelect,
}: {
    transformation: TreeTransformationData;
    selectedId?: string;
    onSelect?: () => void;
}): ReactElement {
    const isSelected = selectedId === transformation.id;

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        SetRootFieldAction.new('_lastSelected', {
            node: '',
            view: '',
            modelElement: transformation.id
        }, '', false);
        onSelect?.();
    }, [transformation.id, onSelect]);

    return (
        <div className="tree-node" data-element-id={transformation.id}>
            <div
                className={`tree-node__header ${isSelected ? 'tree-node__header--selected' : ''}`}
                style={{ paddingLeft: '12px' }}
            >
                <span className="tree-node__spacer" style={{ width: 16 }} />
                <div className="tree-node__content" onClick={handleClick}>
                    <span className="tree-node__icon tree-transformation">
                        <i className={`bi ${entityIcon('transformation')}`} />
                    </span>
                    <span className="tree-node__name">{transformation.name}</span>
                </div>
            </div>
        </div>
    );
});

/**
 * TransformationSection — collapsable section listing all JjTL transformations
 */
const TransformationSection = memo(function TransformationSection({
    transformations,
    selectedId,
    onSelect,
}: {
    transformations: TreeTransformationData[];
    selectedId?: string;
    onSelect?: () => void;
}): ReactElement {
    const [isExpanded, setIsExpanded] = useStateIfMounted(true);

    const handleToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(prev => !prev);
    }, [setIsExpanded]);

    return (
        <div className="transformation-section">
            <div className="transformation-section__header" onClick={handleToggle}>
                <button className="tree-node__toggle">
                    <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} />
                </button>
                <span className="transformation-section__icon">
                    <i className={`bi ${entityIcon('transformation')}`} />
                </span>
                <span className="transformation-section__label">Transformations</span>
                <span className="transformation-section__count">{transformations.length}</span>
            </div>

            {isExpanded && (
                <div className="transformation-section__content">
                    {transformations.map((t) => (
                        <TransformationItem
                            key={t.id}
                            transformation={t}
                            selectedId={selectedId}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

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

    // Transformations received via CustomEvent from ProjectEditor
    const [transformations, setTransformations] = useState<TreeTransformationData[]>([]);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail as TreeTransformationData[] | undefined;
            setTransformations(detail || []);
        };
        window.addEventListener('jjodel:transformations', handler);
        return () => window.removeEventListener('jjodel:transformations', handler);
    }, []);

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

    const { standaloneModels } = props as AllProps;

    const hasContent = (processedMetamodels && processedMetamodels.length > 0) || standaloneModels.length > 0;

    if (!hasContent && transformations.length === 0) {
        return (
            <div ref={containerRef} className="tree-view-content">
                <MegamodelEntry />
                <div className="tree-view-empty">
                    <i className="bi bi-diagram-3" />
                    <p>No metamodels</p>
                    <span>Create a metamodel to see the hierarchy</span>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="tree-view-content">
            <MegamodelEntry />

            {processedMetamodels.map((mm, index) => (
                <React.Fragment key={mm.data.id}>
                    <MetamodelTree
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
                    {/* M1 models at same level as their parent metamodel */}
                    {mm.childModels.map((model) => (
                        <NestedModelTree
                            key={model.id}
                            model={model}
                            depth={0}
                            selectedId={selectedElementId}
                            onSelect={onSelect}
                        />
                    ))}
                </React.Fragment>
            ))}

            {/* Standalone M1 models (no metamodel parent open) */}
            {standaloneModels.map((model) => (
                <NestedModelTree
                    key={model.id}
                    model={model}
                    depth={0}
                    selectedId={selectedElementId}
                    onSelect={onSelect}
                />
            ))}

            {transformations.length > 0 && (
                <TransformationSection
                    transformations={transformations}
                    selectedId={selectedElementId}
                    onSelect={onSelect}
                />
            )}
        </div>
    );
}

interface OwnProps extends TreeViewContentProps {}

interface StateProps {
    processedMetamodels: ProcessedMetamodel[];
    standaloneModels: TreeModelData[];
    selectedElementId?: string;
}

interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

/**
 * Determine the "active" model ID from _lastSelected.
 * Resolves the selected element's parent model.
 */
function resolveActiveModelId(state: DState): string | null {
    const selectedPtr = state._lastSelected?.modelElement;
    if (!selectedPtr) return null;
    try {
        const element = state.idlookup?.[selectedPtr] as any;
        if (!element) return null;
        // If the element IS a model, return its id
        if (element.className === 'DModel') return element.id;
        // Otherwise, traverse up to find the parent model
        // For DObject, .father chain eventually reaches DModel
        let current = element;
        let depth = 0;
        while (current && depth < 10) {
            if (current.className === 'DModel') return current.id;
            const fatherId = current.father || current.model;
            if (!fatherId || typeof fatherId !== 'string') break;
            current = state.idlookup?.[fatherId] as any;
            depth++;
        }
    } catch { /* ignore */ }
    return null;
}

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;

    // Determine which model is currently active (focused tab)
    const activeModelId = resolveActiveModelId(state);

    // Get metamodels
    const metamodelPointers = state.m2models || [];
    const metamodels: LModel[] = LPointerTargetable.fromPointer(metamodelPointers) || [];
    const metamodelIdSet = new Set(metamodels.map(mm => mm.id));

    // Get M1 models
    const modelPointers = state.m1models || [];
    const m1Models: LModel[] = LPointerTargetable.fromPointer(modelPointers) || [];

    // Check which M1 models have a graph (tab has been opened)
    const graphs: DGraph[] = DGraph.fromPointer(state.graphs || []);
    const modelsWithGraph = new Set<string>();
    for (const g of graphs) {
        if (g.model) modelsWithGraph.add(g.model as string);
    }

    // Build M1 model data grouped by metamodel
    const modelsByMetamodel = new Map<string, TreeModelData[]>();
    const standaloneModels: TreeModelData[] = [];

    for (const m1 of m1Models) {
        // Only show models that have a graph (tab was opened at some point)
        if (!modelsWithGraph.has(m1.id)) continue;

        const metamodelId = (m1.instanceof as any)?.id || null;
        const isActive = m1.id === activeModelId;

        // Build instance list
        const instances: TreeInstanceData[] = [];
        if (isActive) {
            try {
                const objects: LObject[] = m1.objects || [];
                for (const obj of objects) {
                    const metaclass = (obj as any).instanceof;
                    const metaclassName = metaclass?.name || 'Orphan';
                    instances.push({
                        id: obj.id,
                        objectId: obj.id,
                        name: obj.name || obj.id?.slice(0, 8) || 'unnamed',
                        metaclassName,
                        modelId: m1.id,
                    });
                }
            } catch { /* ignore errors reading objects */ }
        }

        const modelData: TreeModelData = {
            id: m1.id,
            name: m1.name || 'Unnamed Model',
            metamodelId,
            isActive,
            instances,
        };

        if (metamodelId && metamodelIdSet.has(metamodelId)) {
            if (!modelsByMetamodel.has(metamodelId)) modelsByMetamodel.set(metamodelId, []);
            modelsByMetamodel.get(metamodelId)!.push(modelData);
        } else {
            standaloneModels.push(modelData);
        }
    }

    ret.processedMetamodels = metamodels.map((mm) => ({
        data: {
            id: mm.id,
            name: mm.name || 'Unnamed Metamodel',
            className: 'DModel',
            nodeId: mm.node?.id,
            viewId: mm.node?.view?.id,
        },
        packages: (mm.packages || []).map((pkg: any) => convertToTreeData(pkg)),
        childModels: modelsByMetamodel.get(mm.id) || [],
    }));

    ret.standaloneModels = standaloneModels;
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
