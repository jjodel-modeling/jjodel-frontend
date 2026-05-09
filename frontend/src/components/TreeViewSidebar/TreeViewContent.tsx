import React, { Dispatch, ReactElement, ReactNode, memo, useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import type { FakeStateProps } from '../../joiner';
import {
    DState,
    DGraph,
    LModel,
    LObject,
    LPointerTargetable,
    SetFieldAction,
    SetRootFieldAction,
    DProject,
    LProject,
    LViewPoint,
    U,
    getViewpointType,
} from '../../joiner';
import type { Pointer } from '../../joiner';
import type { ViewpointType } from '../../view/viewPoint/viewpoint';
import { useTreeViewPanel, ElementAction } from '../../contexts/TreeViewPanelContext';
import { getLastEditedViewpointId, createViewInWorkbench } from '../../utils/lastViewpoint';
import { JjodelEvents, SystemEvents } from '../../events/registry';
import { Tooltip } from '../forEndUser/Tooltip';
import { useNodeProblems } from '../editor-v2/problems/useNodeProblems';
import type { NodeProblem } from '../editor-v2/problems/registry';

/**
 * TreeViewContent — redesign 2026-05-08.
 *
 * Sections (synthetic): MEGAMODEL > METAMODELS / VIEWPOINTS / DOCUMENTATION.
 * Per-metamodel sub-section MODELS lists conforming M1 models.
 * Expand/collapse persisted on DProject.expandedTreeNodes (string[]) — synthetic
 * section keys use the `__section:` prefix.
 *
 * Conventions:
 * - 16px padding-left per nesting level (no exceptions).
 * - Vertical guides drawn by .tree-children::before from chevron parent.
 * - Leaves render an invisible chevron slot to keep alignment.
 */

// ─── Synthetic section keys ──────────────────────────────────────────────────

const SECTION_KEYS = {
    MEGAMODEL: '__section:megamodel',
    METAMODELS: '__section:metamodels',
    VIEWPOINTS: '__section:viewpoints',
    VIEWPOINTS_SYNTAX: '__section:viewpoints/syntax',
    VIEWPOINTS_VALIDATION: '__section:viewpoints/validation',
    DOCUMENTATION: '__section:documentation',
} as const;

const STATIC_SECTION_KEYS: ReadonlySet<string> = new Set<string>([
    SECTION_KEYS.MEGAMODEL,
    SECTION_KEYS.METAMODELS,
    SECTION_KEYS.VIEWPOINTS,
    SECTION_KEYS.VIEWPOINTS_SYNTAX,
    SECTION_KEYS.VIEWPOINTS_VALIDATION,
    SECTION_KEYS.DOCUMENTATION,
]);

const SECTION_KEY_PREFIX = '__section:';
const MODELS_SECTION_PREFIX = '__section:models:';

function modelsSectionKey(metamodelId: string): string {
    return MODELS_SECTION_PREFIX + metamodelId;
}

function isSectionKey(key: string): boolean {
    return key.startsWith(SECTION_KEY_PREFIX);
}

// ─── Tree data structures ────────────────────────────────────────────────────

interface TreeFeatureData {
    id: string;
    name: string;
    metaclassName: string;
    modelId: string;
}

interface TreeModelData {
    id: string;
    name: string;
    fqn: string;
    metamodelId: string | null;
    isActive: boolean;
    objectCount: number;
    instances: TreeFeatureData[];
}

interface TreeClassData {
    id: string;
    name: string;
    fqn: string;
    isAbstract: boolean;
    isEdgeView: boolean;
    instanceCount: number;
}

interface TreePackageData {
    id: string;
    name: string;
    fqn: string;
    classCount: number;
    subPackageCount: number;
    subPackages: TreePackageData[];
    classes: TreeClassData[];
}

interface TreeMetamodelData {
    id: string;
    name: string;
    fqn: string;
    nodeId?: string;
    viewId?: string;
    classCount: number;
    modelCount: number;
    rootPackages: TreePackageData[];
    childModels: TreeModelData[];
}

interface TreeSubViewData {
    id: string;
    name: string;
    children: TreeSubViewData[];
}

interface TreeViewpointData {
    id: string;
    name: string;
    fqn: string;
    vpType: ViewpointType;
    isExclusive: boolean;
    viewCount: number;
    raw: LViewPoint;
    subViews: TreeSubViewData[];
}

interface TreeTransformationData {
    id: string;
    name: string;
    sourceMMName?: string;
    targetMMName?: string;
    rules?: string[];
    helpers?: string[];
}

// ─── Hook: persistent expand/collapse via DProject.expandedTreeNodes ─────────

/**
 * Persistent expansion state derived from DProject.expandedTreeNodes.
 *
 * Default behaviour: a key not present in the array is treated as **expanded**.
 * Toggling a node:
 *   - if currently expanded (absent or present) → collapse means we add the key to the
 *     collapsed-set ... but our convention is the opposite: the array stores
 *     EXPANDED keys. So "absent → expanded" requires inversion.
 *
 * To honour the prompt ("Default load progetto esistente: tutto aperto, migration
 * popola con tutti gli ID rilevanti") and the fallback for new entities ("ID assente
 * → trattato come aperto al primo render"), we implement:
 *   - If key is in expandedSet → expanded.
 *   - If key is absent and the user has never interacted with it → expanded (fallback).
 *   - User explicit collapse → we record by adding the key to a collapsed-set.
 *
 * Rather than introducing a second array, we use a single sentinel marker:
 *   collapsed keys are represented by `${COLLAPSED_PREFIX}${key}` entries.
 * This keeps the schema as a single string[] while distinguishing "collapsed" from
 * "never seen". Migration seeds expanded keys (no markers), preserving the all-open
 * default for legacy projects.
 */
const COLLAPSED_PREFIX = '!';

function isExpandedFromArray(arr: ReadonlyArray<string>, key: string): boolean {
    // explicit collapsed marker wins
    if (arr.indexOf(COLLAPSED_PREFIX + key) !== -1) return false;
    // present without marker → expanded
    if (arr.indexOf(key) !== -1) return true;
    // not present at all → fallback expanded (covers legacy + freshly created entities)
    return true;
}

function toggleInArray(arr: ReadonlyArray<string>, key: string, expand: boolean): string[] {
    const collapsedMarker = COLLAPSED_PREFIX + key;
    const next = arr.filter(s => s !== key && s !== collapsedMarker);
    if (expand) next.push(key);
    else next.push(collapsedMarker);
    return next;
}

// ─── Classifier context menu (Add View to Workbench) ────────────────────────

/**
 * Hook that returns context-menu state + handlers for a classifier (DClass,
 * DEnumerator, DModel, DPackage). Right-click on the row opens the popup;
 * "Create View" calls createViewInWorkbench on the last-edited viewpoint.
 */
function useClassifierContextMenu(elementId: string, name: string, className: string) {
    const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
    const nodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ctxMenu) return;
        const handleClick = () => setCtxMenu(null);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setCtxMenu(null);
        };
        const handleScroll = () => setCtxMenu(null);
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKeyDown);
        const scrollContainer = nodeRef.current?.closest('.tree-view-sidebar__body, .tree-view-overlay__body');
        scrollContainer?.addEventListener('scroll', handleScroll);
        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('keydown', handleKeyDown);
            scrollContainer?.removeEventListener('scroll', handleScroll);
        };
    }, [ctxMenu]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const menuWidth = 200;
        const menuHeight = 40;
        let x = e.clientX;
        let y = e.clientY;
        if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 8;
        if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 8;
        setCtxMenu({ x, y });
    }, []);

    const handleAddView = useCallback(() => {
        createViewInWorkbench(elementId, name, className);
        setCtxMenu(null);
    }, [elementId, name, className]);

    const hasWorkbenchVP = !!getLastEditedViewpointId();

    const popup = ctxMenu ? (
        <div
            className="tree-node__context-menu"
            style={{ position: 'fixed', top: ctxMenu.y, left: ctxMenu.x, zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className={`tree-node__context-item ${!hasWorkbenchVP ? 'tree-node__context-item--disabled' : ''}`}
                onClick={hasWorkbenchVP ? handleAddView : undefined}
            >
                <i className="bi bi-eye" />
                <span>{hasWorkbenchVP ? 'Create View' : 'Create View — open a viewpoint first'}</span>
            </div>
        </div>
    ) : null;

    return { handleContextMenu, popup, nodeRef };
}

// ─── Section node (synthetic, collapsible) ──────────────────────────────────

interface SectionNodeProps {
    sectionKey: string;
    label: string;
    counter?: number;
    expanded: boolean;
    onToggle: () => void;
    children?: ReactNode;
    depth: number;
}

const SectionNode = memo(function SectionNode({
    sectionKey,
    label,
    counter,
    expanded,
    onToggle,
    children,
    depth,
}: SectionNodeProps): ReactElement {
    return (
        <div className="tree-section" data-section-key={sectionKey}>
            <div
                className="tree-section__header"
                style={{ paddingLeft: `${depth * 16}px` }}
                onClick={onToggle}
            >
                <button className="tree-node__toggle" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                    <i className={`bi bi-chevron-${expanded ? 'down' : 'right'}`} />
                </button>
                <span className="tree-section__label">{label}</span>
                {typeof counter === 'number' && (
                    <span className="tree-counter">{counter}</span>
                )}
            </div>
            {expanded && (
                <div className="tree-children" data-section-content={sectionKey}>
                    {children}
                </div>
            )}
        </div>
    );
});

// ─── EntityRow — single row for a real entity (M, P, m, C, VP) ──────────────

type EntityBadge = 'M' | 'P' | 'm' | 'C' | 'VP';

interface EntityRowProps {
    badge: EntityBadge;
    badgeClassName?: string;       // CSS class for badge color (e.g. 'tree-DModel')
    name: string;
    nameClassName?: string;        // 'is-abstract' for italic
    pillText?: string;             // e.g. 'M1'
    expandKey?: string;            // synthetic or real id; absent → leaf
    isLeaf?: boolean;
    expanded?: boolean;
    onToggle?: () => void;
    extraIcon?: 'bezier2' | 'stack' | null;
    extraIconTitle?: string;
    tooltip?: ReactNode;
    selected?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    depth: number;
    dataElementId?: string;
    highlightAction?: ElementAction | null;
    isHighlighted?: boolean;
    showNewBadge?: boolean;
}

const EntityRow = memo(function EntityRow(props: EntityRowProps): ReactElement {
    const {
        badge, badgeClassName, name, nameClassName, pillText, expandKey, isLeaf,
        expanded, onToggle, extraIcon, extraIconTitle, tooltip, selected,
        onClick, onContextMenu, depth, dataElementId, highlightAction, isHighlighted, showNewBadge,
    } = props;

    const hasChevron = !!expandKey && !isLeaf;

    // Problem indicator — only for real entity ids (not synthetic section keys)
    const problemKey = (expandKey && !isSectionKey(expandKey)) ? expandKey : '';
    const problems = useNodeProblems(problemKey);
    const topProblem = useMemo<NodeProblem | null>(() => {
        if (!problems || problems.length === 0) return null;
        // pick highest severity (error > warning); first if tie
        let best: NodeProblem | null = null;
        for (const p of problems) {
            if (!best) { best = p; continue; }
            if (best.severity !== 'error' && p.severity === 'error') best = p;
        }
        return best;
    }, [problems]);

    const problemTooltip = useMemo(() => {
        if (!topProblem) return null;
        const extra = problems.length > 1 ? ` (+${problems.length - 1} more)` : '';
        return (topProblem.description || topProblem.title) + extra;
    }, [topProblem, problems.length]);

    const highlightClass = isHighlighted
        ? `tree-row--highlighted tree-row--action-${highlightAction || 'unknown'}`
        : '';

    const rowContent = (
        <div
            className={`tree-row ${selected ? 'tree-row--selected' : ''} ${highlightClass}`.trim()}
            style={{ paddingLeft: `${depth * 16}px` }}
            data-element-id={dataElementId}
            onContextMenu={onContextMenu}
        >
            {hasChevron ? (
                <button
                    className="tree-node__toggle"
                    onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
                >
                    <i className={`bi bi-chevron-${expanded ? 'down' : 'right'}`} />
                </button>
            ) : (
                <span className="tree-node__toggle is-leaf" aria-hidden />
            )}

            <div className="tree-row__content" onClick={onClick}>
                <span className={`tree-node__icon ${badgeClassName || ''}`}>{badge}</span>
                <span className={`tree-row__name ${nameClassName || ''}`.trim()}>{name || 'unnamed'}</span>
                {pillText && <span className="tree-pill">{pillText}</span>}
                {extraIcon === 'bezier2' && (
                    <i
                        className="bi bi-bezier2 tree-edge-marker"
                        aria-hidden
                        title={extraIconTitle || 'View as edge'}
                    />
                )}
                {extraIcon === 'stack' && (
                    <i
                        className="bi bi-stack tree-stack-marker"
                        aria-hidden
                        title={extraIconTitle || 'Stack'}
                    />
                )}
                {topProblem && (
                    <i
                        className="bi bi-exclamation-triangle-fill tree-problem-icon"
                        data-severity={topProblem.severity}
                        aria-hidden
                        title={problemTooltip || ''}
                    />
                )}
                {showNewBadge && (
                    <span className="tree-node__badge tree-node__badge--new">NEW</span>
                )}
            </div>
        </div>
    );

    return (
        <Tooltip tooltip={tooltip} inline position="r" offsetY={0}>
            {rowContent}
        </Tooltip>
    );
});

// ─── Feature (leaf) row — M1 instance, no chevron, no tooltip ────────────────

const FeatureRow = memo(function FeatureRow({
    instance,
    selected,
    onSelect,
    depth,
}: {
    instance: TreeFeatureData;
    selected: boolean;
    onSelect?: () => void;
    depth: number;
}): ReactElement {
    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        SetRootFieldAction.new('_lastSelected' as any, {
            node: '',
            view: '',
            modelElement: instance.id,
        }, '', false);
        window.dispatchEvent(new CustomEvent(JjodelEvents.SELECT_NODE, {
            detail: { nodeId: instance.id, modelId: instance.modelId },
        }));
        onSelect?.();
    }, [instance.id, instance.modelId, onSelect]);

    return (
        <div className="tree-row tree-row--feature" data-element-id={instance.id} style={{ paddingLeft: `${depth * 16}px` }}>
            <span className="tree-node__toggle is-leaf" aria-hidden />
            <div className={`tree-row__content ${selected ? 'tree-row__content--selected' : ''}`} onClick={handleClick}>
                <span className="tree-feature__name">{instance.name}</span>
                <span className="tree-feature__type">: {instance.metaclassName}</span>
            </div>
        </div>
    );
});

// ─── Class node ──────────────────────────────────────────────────────────────

const ClassNode = memo(function ClassNode({
    cls,
    selectedId,
    depth,
    highlightedElementId,
    highlightedAction,
}: {
    cls: TreeClassData;
    selectedId?: string;
    depth: number;
    highlightedElementId?: string | null;
    highlightedAction?: ElementAction | null;
}): ReactElement {
    const isSelected = selectedId === cls.id;
    const isHighlighted = highlightedElementId === cls.id;
    const { handleContextMenu, popup, nodeRef } = useClassifierContextMenu(cls.id, cls.name, 'DClass');

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        SetRootFieldAction.new('_lastSelected', {
            node: undefined,
            view: undefined,
            modelElement: cls.id,
        }, '', false);
    }, [cls.id]);

    const tooltip = useMemo(() => (
        <div>
            <div><strong>{cls.fqn}</strong></div>
            <div>{cls.instanceCount} instances across all models</div>
        </div>
    ), [cls.fqn, cls.instanceCount]);

    return (
        <div ref={nodeRef} className="tree-node" data-element-id={cls.id}>
            <EntityRow
                badge="C"
                badgeClassName="tree-DClass"
                name={cls.name}
                nameClassName={cls.isAbstract ? 'is-abstract' : undefined}
                isLeaf
                extraIcon={cls.isEdgeView ? 'bezier2' : null}
                extraIconTitle={cls.isEdgeView ? 'View as edge' : undefined}
                tooltip={tooltip}
                selected={isSelected}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                depth={depth}
                dataElementId={cls.id}
                isHighlighted={isHighlighted}
                highlightAction={highlightedAction}
                showNewBadge={isHighlighted && highlightedAction === 'create'}
                expandKey={cls.id}
            />
            {popup}
        </div>
    );
});

// ─── Package node (recursive) ────────────────────────────────────────────────

const PackageNode = memo(function PackageNode({
    pkg,
    selectedId,
    depth,
    isExpanded,
    onToggle,
    isExpandedFn,
    onToggleFn,
    highlightedElementId,
    highlightedAction,
}: {
    pkg: TreePackageData;
    selectedId?: string;
    depth: number;
    isExpanded: boolean;
    onToggle: () => void;
    /** lookup to compute expanded state for descendants */
    isExpandedFn: (key: string) => boolean;
    onToggleFn: (key: string) => void;
    highlightedElementId?: string | null;
    highlightedAction?: ElementAction | null;
}): ReactElement {
    const isSelected = selectedId === pkg.id;
    const isHighlighted = highlightedElementId === pkg.id;
    const { handleContextMenu, popup, nodeRef } = useClassifierContextMenu(pkg.id, pkg.name, 'DPackage');

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        SetRootFieldAction.new('_lastSelected', {
            node: undefined,
            view: undefined,
            modelElement: pkg.id,
        }, '', false);
    }, [pkg.id]);

    const tooltip = useMemo(() => (
        <div>
            <div><strong>{pkg.fqn}</strong></div>
            <div>{pkg.classCount} classes, {pkg.subPackageCount} sub-packages</div>
        </div>
    ), [pkg.fqn, pkg.classCount, pkg.subPackageCount]);

    return (
        <div ref={nodeRef} className="tree-node" data-element-id={pkg.id}>
            <EntityRow
                badge="P"
                badgeClassName="tree-DPackage"
                name={pkg.name}
                expandKey={pkg.id}
                expanded={isExpanded}
                onToggle={onToggle}
                tooltip={tooltip}
                selected={isSelected}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                depth={depth}
                dataElementId={pkg.id}
                isHighlighted={isHighlighted}
                highlightAction={highlightedAction}
                showNewBadge={isHighlighted && highlightedAction === 'create'}
            />
            {popup}
            {isExpanded && (
                <div className="tree-children">
                    {pkg.subPackages.map(sub => (
                        <PackageNode
                            key={sub.id}
                            pkg={sub}
                            selectedId={selectedId}
                            depth={depth + 1}
                            isExpanded={isExpandedFn(sub.id)}
                            onToggle={() => onToggleFn(sub.id)}
                            isExpandedFn={isExpandedFn}
                            onToggleFn={onToggleFn}
                            highlightedElementId={highlightedElementId}
                            highlightedAction={highlightedAction}
                        />
                    ))}
                    {pkg.classes.map(c => (
                        <ClassNode
                            key={c.id}
                            cls={c}
                            selectedId={selectedId}
                            depth={depth + 1}
                            highlightedElementId={highlightedElementId}
                            highlightedAction={highlightedAction}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

// ─── Model node (M1) ─────────────────────────────────────────────────────────

const ModelNode = memo(function ModelNode({
    model,
    selectedId,
    depth,
    isExpanded,
    onToggle,
    onSelect,
}: {
    model: TreeModelData;
    selectedId?: string;
    depth: number;
    isExpanded: boolean;
    onToggle: () => void;
    onSelect?: () => void;
}): ReactElement {
    const isSelected = selectedId === model.id;

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        SetRootFieldAction.new('_lastSelected', {
            node: undefined,
            view: undefined,
            modelElement: model.id,
        }, '', false);
        onSelect?.();
    }, [model.id, onSelect]);

    const tooltip = useMemo(() => (
        <div>
            <div><strong>{model.fqn}</strong></div>
            <div>{model.objectCount} objects</div>
        </div>
    ), [model.fqn, model.objectCount]);

    const hasInstances = model.instances.length > 0;
    const canExpand = model.isActive && hasInstances;

    return (
        <div className="tree-node" data-element-id={model.id}>
            <EntityRow
                badge="m"
                badgeClassName="tree-nested-model"
                name={model.name}
                pillText="M1"
                expandKey={model.id}
                isLeaf={!canExpand}
                expanded={isExpanded && canExpand}
                onToggle={onToggle}
                tooltip={tooltip}
                selected={isSelected}
                onClick={handleClick}
                depth={depth}
                dataElementId={model.id}
            />
            {isExpanded && canExpand && (
                <div className="tree-children">
                    {model.instances.map(inst => (
                        <FeatureRow
                            key={inst.id}
                            instance={inst}
                            selected={selectedId === inst.id}
                            onSelect={onSelect}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

// ─── Metamodel node ──────────────────────────────────────────────────────────

const MetamodelNode = memo(function MetamodelNode({
    mm,
    selectedId,
    depth,
    isExpanded,
    onToggle,
    isExpandedFn,
    onToggleFn,
    onSelect,
    highlightedElementId,
    highlightedAction,
}: {
    mm: TreeMetamodelData;
    selectedId?: string;
    depth: number;
    isExpanded: boolean;
    onToggle: () => void;
    isExpandedFn: (key: string) => boolean;
    onToggleFn: (key: string) => void;
    onSelect?: () => void;
    highlightedElementId?: string | null;
    highlightedAction?: ElementAction | null;
}): ReactElement {
    const isSelected = selectedId === mm.id;
    const isHighlighted = highlightedElementId === mm.id;
    const { handleContextMenu, popup, nodeRef } = useClassifierContextMenu(mm.id, mm.name, 'DModel');

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        SetRootFieldAction.new('_lastSelected', {
            node: mm.nodeId,
            view: mm.viewId,
            modelElement: mm.id,
        }, '', false);
        onSelect?.();
    }, [mm.id, mm.nodeId, mm.viewId, onSelect]);

    const tooltip = useMemo(() => (
        <div>
            <div><strong>{mm.fqn}</strong></div>
            <div>{mm.modelCount} models, {mm.classCount} classes</div>
        </div>
    ), [mm.fqn, mm.modelCount, mm.classCount]);

    const modelsKey = modelsSectionKey(mm.id);
    const modelsSectionExpanded = isExpandedFn(modelsKey);

    return (
        <div ref={nodeRef} className="tree-node" data-element-id={mm.id}>
            <EntityRow
                badge="M"
                badgeClassName="tree-DModel"
                name={mm.name}
                expandKey={mm.id}
                expanded={isExpanded}
                onToggle={onToggle}
                tooltip={tooltip}
                selected={isSelected}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                depth={depth}
                dataElementId={mm.id}
                isHighlighted={isHighlighted}
                highlightAction={highlightedAction}
                showNewBadge={isHighlighted && highlightedAction === 'create'}
            />
            {popup}
            {isExpanded && (
                <div className="tree-children">
                    {mm.rootPackages.map(pkg => (
                        <PackageNode
                            key={pkg.id}
                            pkg={pkg}
                            selectedId={selectedId}
                            depth={depth + 1}
                            isExpanded={isExpandedFn(pkg.id)}
                            onToggle={() => onToggleFn(pkg.id)}
                            isExpandedFn={isExpandedFn}
                            onToggleFn={onToggleFn}
                            highlightedElementId={highlightedElementId}
                            highlightedAction={highlightedAction}
                        />
                    ))}
                    <SectionNode
                        sectionKey={modelsKey}
                        label="Models"
                        counter={mm.childModels.length}
                        expanded={modelsSectionExpanded}
                        onToggle={() => onToggleFn(modelsKey)}
                        depth={depth + 1}
                    >
                        {mm.childModels.map(model => (
                            <ModelNode
                                key={model.id}
                                model={model}
                                selectedId={selectedId}
                                depth={depth + 2}
                                isExpanded={isExpandedFn(model.id)}
                                onToggle={() => onToggleFn(model.id)}
                                onSelect={onSelect}
                            />
                        ))}
                    </SectionNode>
                </div>
            )}
        </div>
    );
});

// ─── Viewpoint nodes ─────────────────────────────────────────────────────────

const SubViewItem = memo(function SubViewItem({
    view,
    depth,
    isExpandedFn,
    onToggleFn,
    onSelect,
}: {
    view: TreeSubViewData;
    depth: number;
    isExpandedFn: (key: string) => boolean;
    onToggleFn: (key: string) => void;
    onSelect?: () => void;
}): ReactElement {
    const hasChildren = view.children.length > 0;
    const expanded = isExpandedFn(view.id);

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            SetRootFieldAction.new('_lastSelected' as any, {
                node: '',
                view: view.id,
                modelElement: '',
            });
        } catch (err) {
            console.warn('[TreeView] Failed to select view:', err);
        }
        onSelect?.();
    }, [view.id, onSelect]);

    return (
        <div className="tree-node" data-element-id={view.id}>
            <EntityRow
                badge="VP"
                badgeClassName="tree-subview"
                name={view.name}
                expandKey={view.id}
                isLeaf={!hasChildren}
                expanded={expanded}
                onToggle={() => onToggleFn(view.id)}
                onClick={handleClick}
                depth={depth}
                dataElementId={view.id}
            />
            {expanded && hasChildren && (
                <div className="tree-children">
                    {view.children.map(child => (
                        <SubViewItem
                            key={child.id}
                            view={child}
                            depth={depth + 1}
                            isExpandedFn={isExpandedFn}
                            onToggleFn={onToggleFn}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

const ViewpointNode = memo(function ViewpointNode({
    vp,
    depth,
    isExpandedFn,
    onToggleFn,
    onSelect,
}: {
    vp: TreeViewpointData;
    depth: number;
    isExpandedFn: (key: string) => boolean;
    onToggleFn: (key: string) => void;
    onSelect?: () => void;
}): ReactElement {
    const hasSubViews = vp.subViews.length > 0;
    const expanded = isExpandedFn(vp.id);

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            SetRootFieldAction.new('_lastSelected' as any, {
                node: '',
                view: vp.id,
                modelElement: '',
            });
        } catch (err) {
            console.warn('[TreeView] Failed to select viewpoint:', err);
        }
        onSelect?.();
    }, [vp.id, onSelect]);

    const tooltip = useMemo(() => (
        <div>
            <div><strong>{vp.fqn}</strong></div>
            <div>{hasSubViews ? `${vp.viewCount} views` : `Type: ${vp.vpType}`}</div>
        </div>
    ), [vp.fqn, vp.viewCount, vp.vpType, hasSubViews]);

    return (
        <div className="tree-node" data-element-id={vp.id}>
            <EntityRow
                badge="VP"
                badgeClassName="tree-viewpoint"
                name={vp.name}
                expandKey={vp.id}
                isLeaf={!hasSubViews}
                expanded={expanded}
                onToggle={() => onToggleFn(vp.id)}
                extraIcon={!vp.isExclusive ? 'stack' : null}
                extraIconTitle={!vp.isExclusive ? 'Overlay viewpoint' : undefined}
                tooltip={tooltip}
                onClick={handleClick}
                depth={depth}
                dataElementId={vp.id}
            />
            {expanded && hasSubViews && (
                <div className="tree-children">
                    {vp.subViews.map(sv => (
                        <SubViewItem
                            key={sv.id}
                            view={sv}
                            depth={depth + 1}
                            isExpandedFn={isExpandedFn}
                            onToggleFn={onToggleFn}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

// ─── Transformation entries (kept from previous design, lightly adapted) ─────

const TransformationItem = memo(function TransformationItem({
    transformation,
    selectedId,
    depth,
    isExpandedFn,
    onToggleFn,
    onSelect,
}: {
    transformation: TreeTransformationData;
    selectedId?: string;
    depth: number;
    isExpandedFn: (key: string) => boolean;
    onToggleFn: (key: string) => void;
    onSelect?: () => void;
}): ReactElement {
    const expanded = isExpandedFn(transformation.id);
    const hasRules = (transformation.rules?.length || 0) > 0;
    const hasHelpers = (transformation.helpers?.length || 0) > 0;
    const hasChildren = hasRules || hasHelpers;
    const isSelected = selectedId === transformation.id;

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent(JjodelEvents.OPEN_TRANSFORMATION, {
            detail: { id: transformation.id },
        }));
        SetRootFieldAction.new('_lastSelected', {
            node: '',
            view: '',
            modelElement: transformation.id,
        }, '', false);
        onSelect?.();
    }, [transformation.id, onSelect]);

    return (
        <div className="tree-node" data-element-id={transformation.id}>
            <EntityRow
                badge="C"
                badgeClassName="tree-transformation"
                name={transformation.name}
                expandKey={transformation.id}
                isLeaf={!hasChildren}
                expanded={expanded}
                onToggle={() => onToggleFn(transformation.id)}
                selected={isSelected}
                onClick={handleClick}
                depth={depth}
                dataElementId={transformation.id}
            />
            {expanded && hasChildren && (
                <div className="tree-children">
                    {transformation.rules?.map((rule, i) => (
                        <div key={`r-${i}`} className="tree-row tree-row--feature" style={{ paddingLeft: `${(depth + 1) * 16}px` }}>
                            <span className="tree-node__toggle is-leaf" aria-hidden />
                            <div className="tree-row__content">
                                <span className="tree-node__icon tree-rule">R</span>
                                <span className="tree-row__name">{rule}</span>
                            </div>
                        </div>
                    ))}
                    {transformation.helpers?.map((helper, i) => (
                        <div key={`h-${i}`} className="tree-row tree-row--feature" style={{ paddingLeft: `${(depth + 1) * 16}px` }}>
                            <span className="tree-node__toggle is-leaf" aria-hidden />
                            <div className="tree-row__content">
                                <span className="tree-node__icon tree-helper">H</span>
                                <span className="tree-row__name">{helper}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

// ─── Documentation empty state ───────────────────────────────────────────────

const DocumentationEmptyState = memo(function DocumentationEmptyState({
    depth,
}: {
    depth: number;
}): ReactElement {
    const handleGenerate = useCallback(() => {
        // TODO: wire to AI doc generation when an action is exposed
        // (jjodie-integration/JjodieAPIImpl currently has createMetamodel but no generate-doc).
        console.warn('[TreeView] Generate documentation: not yet implemented');
    }, []);

    return (
        <div className="tree-empty-doc" style={{ paddingLeft: `${depth * 16}px` }}>
            <span className="tree-empty-doc-label">No documentation yet</span>
            <button className="tree-generate-btn" type="button" onClick={handleGenerate}>
                <i className="bi bi-stars" aria-hidden />
                Generate
            </button>
        </div>
    );
});

// ─── Main component ─────────────────────────────────────────────────────────

interface TreeViewContentProps {
    onSelect?: () => void;
}

interface OwnProps extends TreeViewContentProps {}

interface StateProps {
    metamodels: TreeMetamodelData[];
    standaloneModels: TreeModelData[];
    viewpoints: TreeViewpointData[];
    selectedElementId?: string;
    projectId?: Pointer<DProject>;
    expandedTreeNodes: string[];
}

interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function TreeViewContentComponent(props: AllProps) {
    const {
        metamodels, standaloneModels, viewpoints, selectedElementId,
        projectId, expandedTreeNodes, onSelect,
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const { highlightedElementId, highlightedAction } = useTreeViewPanel();

    // Transformations received via CustomEvent from ProjectEditor
    const [transformations, setTransformations] = useState<TreeTransformationData[]>([]);
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail as TreeTransformationData[] | undefined;
            setTransformations(detail || []);
        };
        window.addEventListener(JjodelEvents.TRANSFORMATIONS, handler);
        return () => window.removeEventListener(JjodelEvents.TRANSFORMATIONS, handler);
    }, []);

    // Listen for scroll-to-element events
    useEffect(() => {
        const handleScrollToElement = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { elementId } = customEvent.detail || {};
            if (!elementId || !containerRef.current) return;
            const targetElement = containerRef.current.querySelector(`[data-element-id="${elementId}"]`);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            }
        };
        window.addEventListener(SystemEvents.TREEVIEW_SCROLL, handleScrollToElement);
        return () => window.removeEventListener(SystemEvents.TREEVIEW_SCROLL, handleScrollToElement);
    }, []);

    // Expand/collapse helpers — derived from expandedTreeNodes prop
    const isExpandedFn = useCallback(
        (key: string) => isExpandedFromArray(expandedTreeNodes, key),
        [expandedTreeNodes]
    );

    const onToggleFn = useCallback((key: string) => {
        if (!projectId) return;
        const currentlyExpanded = isExpandedFromArray(expandedTreeNodes, key);
        const next = toggleInArray(expandedTreeNodes, key, !currentlyExpanded);
        SetFieldAction.new(projectId, 'expandedTreeNodes', next, '', false);
    }, [projectId, expandedTreeNodes]);

    // Cleanup orphaned ids — runs whenever live ids change. Dispatch is gated on
    // length-difference, which prevents the SetFieldAction → re-render loop:
    // after one cleanup pass, expandedTreeNodes is filtered, the next effect
    // run finds no diff and skips dispatch.
    useEffect(() => {
        if (!projectId) return;

        const validIds = new Set<string>();
        for (const mm of metamodels) {
            validIds.add(mm.id);
            const visit = (pkg: TreePackageData) => {
                validIds.add(pkg.id);
                for (const sub of pkg.subPackages) visit(sub);
                for (const c of pkg.classes) validIds.add(c.id);
            };
            for (const pkg of mm.rootPackages) visit(pkg);
            for (const m of mm.childModels) validIds.add(m.id);
        }
        for (const m of standaloneModels) validIds.add(m.id);
        for (const vp of viewpoints) {
            validIds.add(vp.id);
            const visit = (sv: TreeSubViewData) => {
                validIds.add(sv.id);
                for (const c of sv.children) visit(c);
            };
            for (const sv of vp.subViews) visit(sv);
        }
        const liveMetamodelIds = new Set(metamodels.map(m => m.id));

        const filtered = expandedTreeNodes.filter(entry => {
            const stripped = entry.startsWith(COLLAPSED_PREFIX) ? entry.slice(COLLAPSED_PREFIX.length) : entry;
            if (STATIC_SECTION_KEYS.has(stripped)) return true;
            if (stripped.startsWith(MODELS_SECTION_PREFIX)) {
                const mmId = stripped.slice(MODELS_SECTION_PREFIX.length);
                return liveMetamodelIds.has(mmId);
            }
            return validIds.has(stripped);
        });

        if (filtered.length !== expandedTreeNodes.length) {
            SetFieldAction.new(projectId, 'expandedTreeNodes', filtered, '', false);
        }
    }, [projectId, expandedTreeNodes, metamodels, standaloneModels, viewpoints]);

    // Group viewpoints by type
    const { syntaxVps, validationVps, otherVps } = useMemo(() => {
        const syntax: TreeViewpointData[] = [];
        const validation: TreeViewpointData[] = [];
        const other: TreeViewpointData[] = [];
        for (const vp of viewpoints) {
            if (vp.vpType === 'syntax') syntax.push(vp);
            else if (vp.vpType === 'validation') validation.push(vp);
            else other.push(vp);
        }
        return { syntaxVps: syntax, validationVps: validation, otherVps: other };
    }, [viewpoints]);

    const hasContent =
        metamodels.length > 0 ||
        standaloneModels.length > 0 ||
        viewpoints.length > 0 ||
        transformations.length > 0;

    const megamodelExpanded = isExpandedFn(SECTION_KEYS.MEGAMODEL);
    const metamodelsExpanded = isExpandedFn(SECTION_KEYS.METAMODELS);
    const viewpointsExpanded = isExpandedFn(SECTION_KEYS.VIEWPOINTS);
    const syntaxExpanded = isExpandedFn(SECTION_KEYS.VIEWPOINTS_SYNTAX);
    const validationExpanded = isExpandedFn(SECTION_KEYS.VIEWPOINTS_VALIDATION);
    const docsExpanded = isExpandedFn(SECTION_KEYS.DOCUMENTATION);

    if (!hasContent) {
        return (
            <div ref={containerRef} className="tree-view-content">
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
            <SectionNode
                sectionKey={SECTION_KEYS.MEGAMODEL}
                label="Megamodel"
                expanded={megamodelExpanded}
                onToggle={() => onToggleFn(SECTION_KEYS.MEGAMODEL)}
                depth={0}
            >
                {/* METAMODELS */}
                <SectionNode
                    sectionKey={SECTION_KEYS.METAMODELS}
                    label="Metamodels"
                    counter={metamodels.length}
                    expanded={metamodelsExpanded}
                    onToggle={() => onToggleFn(SECTION_KEYS.METAMODELS)}
                    depth={1}
                >
                    {metamodels.map(mm => (
                        <MetamodelNode
                            key={mm.id}
                            mm={mm}
                            selectedId={selectedElementId}
                            depth={2}
                            isExpanded={isExpandedFn(mm.id)}
                            onToggle={() => onToggleFn(mm.id)}
                            isExpandedFn={isExpandedFn}
                            onToggleFn={onToggleFn}
                            onSelect={onSelect}
                            highlightedElementId={highlightedElementId}
                            highlightedAction={highlightedAction}
                        />
                    ))}
                    {standaloneModels.map(model => (
                        <ModelNode
                            key={model.id}
                            model={model}
                            selectedId={selectedElementId}
                            depth={2}
                            isExpanded={isExpandedFn(model.id)}
                            onToggle={() => onToggleFn(model.id)}
                            onSelect={onSelect}
                        />
                    ))}
                </SectionNode>

                {/* VIEWPOINTS */}
                <SectionNode
                    sectionKey={SECTION_KEYS.VIEWPOINTS}
                    label="Viewpoints"
                    counter={viewpoints.length}
                    expanded={viewpointsExpanded}
                    onToggle={() => onToggleFn(SECTION_KEYS.VIEWPOINTS)}
                    depth={1}
                >
                    {syntaxVps.length > 0 && (
                        <SectionNode
                            sectionKey={SECTION_KEYS.VIEWPOINTS_SYNTAX}
                            label="Syntax"
                            counter={syntaxVps.length}
                            expanded={syntaxExpanded}
                            onToggle={() => onToggleFn(SECTION_KEYS.VIEWPOINTS_SYNTAX)}
                            depth={2}
                        >
                            {syntaxVps.map(vp => (
                                <ViewpointNode
                                    key={vp.id}
                                    vp={vp}
                                    depth={3}
                                    isExpandedFn={isExpandedFn}
                                    onToggleFn={onToggleFn}
                                    onSelect={onSelect}
                                />
                            ))}
                        </SectionNode>
                    )}
                    {validationVps.length > 0 && (
                        <SectionNode
                            sectionKey={SECTION_KEYS.VIEWPOINTS_VALIDATION}
                            label="Validation"
                            counter={validationVps.length}
                            expanded={validationExpanded}
                            onToggle={() => onToggleFn(SECTION_KEYS.VIEWPOINTS_VALIDATION)}
                            depth={2}
                        >
                            {validationVps.map(vp => (
                                <ViewpointNode
                                    key={vp.id}
                                    vp={vp}
                                    depth={3}
                                    isExpandedFn={isExpandedFn}
                                    onToggleFn={onToggleFn}
                                    onSelect={onSelect}
                                />
                            ))}
                        </SectionNode>
                    )}
                    {otherVps.map(vp => (
                        <ViewpointNode
                            key={vp.id}
                            vp={vp}
                            depth={2}
                            isExpandedFn={isExpandedFn}
                            onToggleFn={onToggleFn}
                            onSelect={onSelect}
                        />
                    ))}
                </SectionNode>

                {/* DOCUMENTATION */}
                <SectionNode
                    sectionKey={SECTION_KEYS.DOCUMENTATION}
                    label="Documentation"
                    expanded={docsExpanded}
                    onToggle={() => onToggleFn(SECTION_KEYS.DOCUMENTATION)}
                    depth={1}
                >
                    <DocumentationEmptyState depth={2} />
                </SectionNode>

                {/* TRANSFORMATIONS — kept under megamodel for visibility */}
                {transformations.length > 0 && transformations.map(t => (
                    <TransformationItem
                        key={t.id}
                        transformation={t}
                        selectedId={selectedElementId}
                        depth={1}
                        isExpandedFn={isExpandedFn}
                        onToggleFn={onToggleFn}
                        onSelect={onSelect}
                    />
                ))}
            </SectionNode>
        </div>
    );
}

// ─── Selectors ──────────────────────────────────────────────────────────────

function resolveActiveModelId(state: DState): string | null {
    const selectedPtr = state._lastSelected?.modelElement;
    if (!selectedPtr) return null;
    try {
        const element = state.idlookup?.[selectedPtr] as any;
        if (!element) return null;
        if (element.className === 'DModel') return element.id;
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

function buildPackageData(lPkg: any, parentFqn: string): TreePackageData {
    const fqn = parentFqn ? `${parentFqn}.${lPkg.name || 'unnamed'}` : (lPkg.name || 'unnamed');
    const subPackages: TreePackageData[] = [];
    const classes: TreeClassData[] = [];

    try {
        const subs = lPkg.subpackages || [];
        for (const sub of subs) {
            if (!sub) continue;
            subPackages.push(buildPackageData(sub, fqn));
        }
    } catch { /* ignore */ }

    try {
        const cls = lPkg.classes || [];
        for (const c of cls) {
            if (!c) continue;
            const view = c.node?.view;
            const isEdgeView = !!(view && (view as any).isEdge);
            // Approximate instance count: sum across all m1 models that conform to a metamodel
            // referencing this class. For now use c.instances if exposed, fallback to 0.
            let instanceCount = 0;
            try {
                const instances = (c as any).instances;
                if (Array.isArray(instances)) instanceCount = instances.length;
            } catch { /* ignore */ }
            classes.push({
                id: c.id,
                name: c.name || 'unnamed',
                fqn: `${fqn}.${c.name || 'unnamed'}`,
                isAbstract: !!(c as any).abstract,
                isEdgeView,
                instanceCount,
            });
        }
    } catch { /* ignore */ }

    let totalClassCount = classes.length;
    let totalSubPackageCount = subPackages.length;
    for (const sub of subPackages) {
        totalClassCount += sub.classCount;
        totalSubPackageCount += sub.subPackageCount;
    }

    return {
        id: lPkg.id,
        name: lPkg.name || 'unnamed',
        fqn,
        classCount: totalClassCount,
        subPackageCount: totalSubPackageCount,
        subPackages,
        classes,
    };
}

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;

    // Determine project id and expandedTreeNodes
    const pid = U.getProjectID_URL() as Pointer<DProject> | undefined;
    let projectId: Pointer<DProject> | undefined = undefined;
    let expandedTreeNodes: string[] = [];
    if (pid) {
        const projData = state.idlookup?.[pid] as DProject | undefined;
        if (projData && projData.className === 'DProject') {
            projectId = pid;
            expandedTreeNodes = Array.isArray(projData.expandedTreeNodes) ? projData.expandedTreeNodes : [];
        }
    }
    ret.projectId = projectId;
    ret.expandedTreeNodes = expandedTreeNodes;

    // Active model id (focused tab)
    const activeModelId = resolveActiveModelId(state);

    // Metamodels
    const metamodelPointers = state.m2models || [];
    const metamodels: LModel[] = (LPointerTargetable.fromPointer(metamodelPointers) || []).filter(Boolean);
    const metamodelIdSet = new Set(metamodels.map(mm => mm.id));

    // M1 models
    const modelPointers = state.m1models || [];
    const m1Models: LModel[] = (LPointerTargetable.fromPointer(modelPointers) || []).filter(Boolean);

    // Models with graph (tab opened at least once)
    const graphs: DGraph[] = DGraph.fromPointer(state.graphs || []);
    const modelsWithGraph = new Set<string>();
    for (const g of graphs) {
        if (g.model) modelsWithGraph.add(g.model as string);
    }

    // Build M1 model data grouped by metamodel
    const modelsByMetamodel = new Map<string, TreeModelData[]>();
    const standaloneModels: TreeModelData[] = [];

    for (const m1 of m1Models) {
        if (!modelsWithGraph.has(m1.id)) continue;
        const metamodelId = (m1.instanceof as any)?.id || null;
        const isActive = m1.id === activeModelId;

        const mmName = metamodelId ? (state.idlookup?.[metamodelId] as any)?.name || '' : '';
        const fqn = mmName ? `${mmName} / ${m1.name || 'Unnamed Model'}` : (m1.name || 'Unnamed Model');

        const instances: TreeFeatureData[] = [];
        let objectCount = 0;
        try {
            const objects: LObject[] = m1.objects || [];
            objectCount = objects.length;
            if (isActive) {
                for (const obj of objects) {
                    const metaclass = (obj as any).instanceof;
                    const metaclassName = metaclass?.name || 'Orphan';
                    instances.push({
                        id: obj.id,
                        name: obj.name || obj.id?.slice(0, 8) || 'unnamed',
                        metaclassName,
                        modelId: m1.id,
                    });
                }
            }
        } catch { /* ignore */ }

        const modelData: TreeModelData = {
            id: m1.id,
            name: m1.name || 'Unnamed Model',
            fqn,
            metamodelId,
            isActive,
            objectCount,
            instances,
        };

        if (metamodelId && metamodelIdSet.has(metamodelId)) {
            if (!modelsByMetamodel.has(metamodelId)) modelsByMetamodel.set(metamodelId, []);
            modelsByMetamodel.get(metamodelId)!.push(modelData);
        } else {
            standaloneModels.push(modelData);
        }
    }

    // Build metamodel tree data
    ret.metamodels = metamodels.map((mm) => {
        const mmName = mm.name || 'Unnamed Metamodel';
        const rootPackages: TreePackageData[] = [];
        try {
            const pkgs = (mm as any).packages || [];
            for (const pkg of pkgs) {
                if (!pkg) continue;
                rootPackages.push(buildPackageData(pkg, mmName));
            }
        } catch { /* ignore */ }

        let totalClassCount = 0;
        for (const pkg of rootPackages) totalClassCount += pkg.classCount;

        const childModels = modelsByMetamodel.get(mm.id) || [];

        return {
            id: mm.id,
            name: mmName,
            fqn: mmName,
            nodeId: mm.node?.id,
            viewId: mm.node?.view?.id,
            classCount: totalClassCount,
            modelCount: childModels.length,
            rootPackages,
            childModels,
        };
    });

    ret.standaloneModels = standaloneModels;

    // Viewpoints
    const vpList: TreeViewpointData[] = [];
    function buildSubViewTree(lView: any): TreeSubViewData[] {
        const children: TreeSubViewData[] = [];
        try {
            const subs = lView.subViews || [];
            for (const sv of subs) {
                if (!sv) continue;
                children.push({
                    id: sv.id,
                    name: sv.name || 'Unnamed View',
                    children: buildSubViewTree(sv),
                });
            }
        } catch { /* ignore */ }
        return children;
    }

    try {
        const project = LProject.getProject();
        if (project) {
            const projectName = project.name || 'Project';
            const lvps: LViewPoint[] = project.viewpoints || [];
            for (const vp of lvps) {
                if (!vp) continue;
                const vpType = getViewpointType(vp as any);
                const isExclusive = vpType === 'syntax';
                const subViews = buildSubViewTree(vp);
                vpList.push({
                    id: vp.id,
                    name: vp.name || 'Unnamed Viewpoint',
                    fqn: `${projectName} / ${vp.name || 'Unnamed Viewpoint'}`,
                    vpType,
                    isExclusive,
                    viewCount: subViews.length,
                    raw: vp,
                    subViews,
                });
            }
        }
    } catch { /* ignore */ }
    ret.viewpoints = vpList;

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
