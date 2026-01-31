import React, { Dispatch, ReactElement, memo, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import {
    DState,
    LModel,
    LNamedElement,
    LPointerTargetable,
    SetRootFieldAction,
} from '../../joiner';
import { FakeStateProps } from '../../joiner/types';
import { useStateIfMounted } from 'use-state-if-mounted';

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
}

/**
 * Memoized TreeNode - only re-renders when props change
 */
const TreeNode = memo(function TreeNode({ data, depth, selectedId, onSelect }: TreeNodeProps): ReactElement {
    const [isExpanded, setIsExpanded] = useStateIfMounted(depth < 2);

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

    return (
        <div className="tree-node">
            <div
                className={`tree-node__header ${isSelected ? 'tree-node__header--selected' : ''}`}
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
}

/**
 * Memoized MetamodelTree
 */
const MetamodelTree = memo(function MetamodelTree({
    metamodel,
    packages,
    selectedId,
    onSelect,
    defaultExpanded = true
}: MetamodelTreeProps): ReactElement {
    const [isExpanded, setIsExpanded] = useStateIfMounted(defaultExpanded);

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

    return (
        <div className="metamodel-tree">
            <div className="metamodel-tree__header">
                <button className="tree-node__toggle" onClick={handleToggle}>
                    <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} />
                </button>
                <div className="metamodel-tree__title" onClick={handleMetamodelClick}>
                    <span className="tree-node__icon tree-DModel">M</span>
                    <span>{metamodel.name || 'Unnamed Metamodel'}</span>
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
        <div className="tree-view-content">
            {processedMetamodels.map((mm, index) => (
                <MetamodelTree
                    key={mm.data.id}
                    metamodel={mm.data}
                    packages={mm.packages}
                    selectedId={selectedElementId}
                    onSelect={onSelect}
                    defaultExpanded={index === 0}
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
