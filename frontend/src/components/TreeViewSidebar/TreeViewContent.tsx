import React, { Dispatch, ReactElement, ReactNode, memo, useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import type { FakeStateProps } from '../../joiner';
import {
    DState,
    DGraph,
    DPointerTargetable,
    DViewElement,
    LModel,
    LObject,
    LPointerTargetable,
    LViewElement,
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
import { getLastEditedViewpointId, createViewInWorkbench, createBlankViewInViewpoint } from '../../utils/lastViewpoint';
import { isAdvancedMode } from '../../hooks/useInterfaceMode';
import { JjodelEvents, SystemEvents } from '../../events/registry';
import { useNodeProblems } from '../editor-v2/problems/useNodeProblems';
import { getTypeName, getMultiplicity, formatFeatureSignature } from '../../common/featureSignature';
import type { NodeProblem } from '../editor-v2/problems/registry';
import { computeTreeViewScope } from './treeViewScope';

/**
 * TreeViewContent — redesign 2026-05-08.
 *
 * Sections (synthetic): MEGAMODEL > METAMODELS / VIEWPOINTS / DOCUMENTATION.
 * Per-metamodel sub-section MODELS lists conforming M1 models.
 * Expand/collapse persisted on DProject.expandedTreeNodes (string[]) — synthetic
 * section keys use the `__section:` prefix.
 *
 * Conventions:
 * - TREE_INDENT_STEP px padding-left per nesting level (no exceptions).
 * - Leaves render an invisible chevron slot to keep alignment.
 */

// Indentazione per livello di nesting (polish 2026-05-12: ridotta da 16 a 12,
// circa -25%, per migliorare la leggibilità dei nomi in tree profondi).
const TREE_INDENT_STEP = 12;

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
    attributes: TreeStructuralFeatureData[];
    references: TreeStructuralFeatureData[];
    /**
     * Il viewpoint attivo non rende questo classifier, ed e' dentro lo scopo del
     * filtro (cfr. treeViewScope.ts). False anche per i classifier FUORI scopo:
     * quelli non sono "non resi", sono elementi su cui il viewpoint non ha
     * opinioni, e vanno lasciati in chiaro.
     */
    notRendered?: boolean;
}

interface TreeStructuralFeatureData {
    id: string;
    name: string;
    typeName: string;
    multiplicity: string;
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

// ─── Search filtering (ephemeral, local-only — never persisted) ──────────────
//
// Pure functions that prune the Tree*Data structures already built by
// mapStateToProps. Semantics mirror `filterElements` in MetamodelTreeView:
//   - a node matches when its name contains the query (case-insensitive);
//   - a node survives if it matches or has a surviving descendant;
//   - a directly-matching node keeps its whole subtree; a node that survives
//     only through descendants keeps the pruned children.
// `matchCount` counts nodes that match DIRECTLY (not ancestors dragged in).
// `firstMatchId` is the id of the first directly-matching node in pre-order,
// used by Enter-to-scroll. `q` is expected pre-lowercased by the caller.

interface PrunedList<T> { items: T[]; matchCount: number; firstMatchId: string | null; }
interface PrunedNode<T> { item: T; matchCount: number; firstMatchId: string | null; }

function nameMatches(name: string, q: string): boolean {
    return (name || '').toLowerCase().includes(q);
}

function filterStructuralFeatures(features: TreeStructuralFeatureData[], q: string): PrunedList<TreeStructuralFeatureData> {
    const items: TreeStructuralFeatureData[] = [];
    let matchCount = 0;
    let firstMatchId: string | null = null;
    for (const f of features) {
        if (nameMatches(f.name, q)) {
            items.push(f);
            matchCount++;
            if (!firstMatchId) firstMatchId = f.id;
        }
    }
    return { items, matchCount, firstMatchId };
}

function filterClass(cls: TreeClassData, q: string): PrunedNode<TreeClassData> | null {
    const selfMatch = nameMatches(cls.name, q);
    const attrRes = filterStructuralFeatures(cls.attributes, q);
    const refRes = filterStructuralFeatures(cls.references, q);
    const childMatchCount = attrRes.matchCount + refRes.matchCount;
    if (selfMatch) {
        return { item: cls, matchCount: 1 + childMatchCount, firstMatchId: cls.id };
    }
    if (childMatchCount > 0) {
        return {
            item: { ...cls, attributes: attrRes.items, references: refRes.items },
            matchCount: childMatchCount,
            firstMatchId: attrRes.firstMatchId ?? refRes.firstMatchId,
        };
    }
    return null;
}

function filterPackage(pkg: TreePackageData, q: string): PrunedNode<TreePackageData> | null {
    const selfMatch = nameMatches(pkg.name, q);
    const subResults: PrunedNode<TreePackageData>[] = [];
    for (const sub of pkg.subPackages) {
        const r = filterPackage(sub, q);
        if (r) subResults.push(r);
    }
    const classResults: PrunedNode<TreeClassData>[] = [];
    for (const c of pkg.classes) {
        const r = filterClass(c, q);
        if (r) classResults.push(r);
    }
    let childMatchCount = 0;
    let firstMatchId: string | null = null;
    for (const r of subResults) { childMatchCount += r.matchCount; if (!firstMatchId) firstMatchId = r.firstMatchId; }
    for (const r of classResults) { childMatchCount += r.matchCount; if (!firstMatchId) firstMatchId = r.firstMatchId; }
    if (selfMatch) {
        return { item: pkg, matchCount: 1 + childMatchCount, firstMatchId: pkg.id };
    }
    if (subResults.length > 0 || classResults.length > 0) {
        return {
            item: { ...pkg, subPackages: subResults.map(r => r.item), classes: classResults.map(r => r.item) },
            matchCount: childMatchCount,
            firstMatchId,
        };
    }
    return null;
}

function filterModel(model: TreeModelData, q: string): PrunedNode<TreeModelData> | null {
    const selfMatch = nameMatches(model.name, q);
    const instances: TreeFeatureData[] = [];
    let instMatch = 0;
    let firstMatchId: string | null = null;
    for (const inst of model.instances) {
        if (nameMatches(inst.name, q)) {
            instances.push(inst);
            instMatch++;
            if (!firstMatchId) firstMatchId = inst.id;
        }
    }
    if (selfMatch) {
        return { item: model, matchCount: 1 + instMatch, firstMatchId: model.id };
    }
    if (instMatch > 0) {
        return { item: { ...model, instances }, matchCount: instMatch, firstMatchId };
    }
    return null;
}

function filterMetamodel(mm: TreeMetamodelData, q: string): PrunedNode<TreeMetamodelData> | null {
    const selfMatch = nameMatches(mm.name, q);
    const pkgResults: PrunedNode<TreePackageData>[] = [];
    for (const pkg of mm.rootPackages) {
        const r = filterPackage(pkg, q);
        if (r) pkgResults.push(r);
    }
    const modelResults: PrunedNode<TreeModelData>[] = [];
    for (const model of mm.childModels) {
        const r = filterModel(model, q);
        if (r) modelResults.push(r);
    }
    let childMatchCount = 0;
    let firstMatchId: string | null = null;
    for (const r of pkgResults) { childMatchCount += r.matchCount; if (!firstMatchId) firstMatchId = r.firstMatchId; }
    for (const r of modelResults) { childMatchCount += r.matchCount; if (!firstMatchId) firstMatchId = r.firstMatchId; }
    if (selfMatch) {
        return { item: mm, matchCount: 1 + childMatchCount, firstMatchId: mm.id };
    }
    if (pkgResults.length > 0 || modelResults.length > 0) {
        return {
            item: { ...mm, rootPackages: pkgResults.map(r => r.item), childModels: modelResults.map(r => r.item) },
            matchCount: childMatchCount,
            firstMatchId,
        };
    }
    return null;
}

function filterSubViews(subs: TreeSubViewData[], q: string): PrunedList<TreeSubViewData> {
    const items: TreeSubViewData[] = [];
    let matchCount = 0;
    let firstMatchId: string | null = null;
    for (const sv of subs) {
        const selfMatch = nameMatches(sv.name, q);
        const childRes = filterSubViews(sv.children, q);
        if (selfMatch) {
            items.push(sv);
            matchCount += 1 + childRes.matchCount;
            if (!firstMatchId) firstMatchId = sv.id;
        } else if (childRes.items.length > 0) {
            items.push({ ...sv, children: childRes.items });
            matchCount += childRes.matchCount;
            if (!firstMatchId) firstMatchId = childRes.firstMatchId;
        }
    }
    return { items, matchCount, firstMatchId };
}

function filterViewpoint(vp: TreeViewpointData, q: string): PrunedNode<TreeViewpointData> | null {
    const selfMatch = nameMatches(vp.name, q);
    const subRes = filterSubViews(vp.subViews, q);
    if (selfMatch) {
        return { item: vp, matchCount: 1 + subRes.matchCount, firstMatchId: vp.id };
    }
    if (subRes.items.length > 0) {
        return { item: { ...vp, subViews: subRes.items }, matchCount: subRes.matchCount, firstMatchId: subRes.firstMatchId };
    }
    return null;
}

function filterMetamodels(list: TreeMetamodelData[], q: string): PrunedList<TreeMetamodelData> {
    const items: TreeMetamodelData[] = [];
    let matchCount = 0;
    let firstMatchId: string | null = null;
    for (const mm of list) {
        const r = filterMetamodel(mm, q);
        if (r) { items.push(r.item); matchCount += r.matchCount; if (!firstMatchId) firstMatchId = r.firstMatchId; }
    }
    return { items, matchCount, firstMatchId };
}

function filterModels(list: TreeModelData[], q: string): PrunedList<TreeModelData> {
    const items: TreeModelData[] = [];
    let matchCount = 0;
    let firstMatchId: string | null = null;
    for (const model of list) {
        const r = filterModel(model, q);
        if (r) { items.push(r.item); matchCount += r.matchCount; if (!firstMatchId) firstMatchId = r.firstMatchId; }
    }
    return { items, matchCount, firstMatchId };
}

function filterViewpoints(list: TreeViewpointData[], q: string): PrunedList<TreeViewpointData> {
    const items: TreeViewpointData[] = [];
    let matchCount = 0;
    let firstMatchId: string | null = null;
    for (const vp of list) {
        const r = filterViewpoint(vp, q);
        if (r) { items.push(r.item); matchCount += r.matchCount; if (!firstMatchId) firstMatchId = r.firstMatchId; }
    }
    return { items, matchCount, firstMatchId };
}

function filterTransformations(list: TreeTransformationData[], q: string): PrunedList<TreeTransformationData> {
    const items: TreeTransformationData[] = [];
    let matchCount = 0;
    let firstMatchId: string | null = null;
    for (const t of list) {
        if (nameMatches(t.name, q)) {
            items.push(t);
            matchCount++;
            if (!firstMatchId) firstMatchId = t.id;
        }
    }
    return { items, matchCount, firstMatchId };
}

/**
 * Render a name with a <mark> around the first case-insensitive occurrence of
 * `query`. Returns the bare name when no query or no match. `query` is the
 * trimmed, original-case search string (matching is case-insensitive).
 */
function renderHighlightedName(name: string, query?: string): ReactNode {
    if (!query) return name;
    const idx = (name || '').toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return name;
    const end = idx + query.length;
    return (
        <>
            {name.slice(0, idx)}
            <mark>{name.slice(idx, end)}</mark>
            {name.slice(end)}
        </>
    );
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
        // Il container che scorre davvero e' quello del rail. I due selettori
        // precedenti appartenevano alla shell TreeViewSidebar, che non e' mai
        // stata montata: il closest non trovava nulla e il menu non si chiudeva
        // allo scroll, comportamento che questa logica esiste per garantire.
        const scrollContainer = nodeRef.current?.closest('.tree-view-panel-body');
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
        // The only entry (Create View) is view authoring: Advanced mode only
        if (!isAdvancedMode()) return;
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
                style={{ paddingLeft: `${depth * TREE_INDENT_STEP}px` }}
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

type EntityBadge = 'M' | 'P' | 'm' | 'C' | 'VP' | 'v' | 'A' | 'R';

// Type icon glyphs (Fase 2 C3, 2026-07-28): the per-type "badge" is now a
// Bootstrap glyph instead of a letter. Keyed by the per-type colour class so the
// old letter collisions (C = Class/Transformation, R = Reference/Rule) resolve to
// distinct icons. Colour still comes from the .tree-D* class on the wrapper span.
const BADGE_ICON: Record<string, { icon: string; label: string }> = {
    'tree-DModel': { icon: 'bi-diagram-3', label: 'Metamodel' },
    'tree-DPackage': { icon: 'bi-folder2', label: 'Package' },
    'tree-DClass': { icon: 'bi-box-seam', label: 'Class' },
    'tree-DAttribute': { icon: 'bi-tag', label: 'Attribute' },
    'tree-DReference': { icon: 'bi-arrow-right', label: 'Reference' },
    'tree-nested-model': { icon: 'bi-file-earmark', label: 'Model' },
    'tree-viewpoint': { icon: 'bi-eye', label: 'Viewpoint' },
    'tree-leaf-view': { icon: 'bi-easel', label: 'View' },
    'tree-transformation': { icon: 'bi-arrow-left-right', label: 'Transformation' },
    'tree-rule': { icon: 'bi-list-check', label: 'Rule' },
    'tree-helper': { icon: 'bi-wrench', label: 'Helper' },
};

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
    selected?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    onDoubleClick?: (e: React.MouseEvent) => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    depth: number;
    dataElementId?: string;
    highlightAction?: ElementAction | null;
    isHighlighted?: boolean;
    showNewBadge?: boolean;
    actions?: ReactNode;           // hover-reveal slot (e.g. add/duplicate/delete buttons)
    nameOverride?: ReactNode;      // custom name renderer (e.g. inline rename input)
    highlightQuery?: string;       // search substring to <mark> in the name
    /**
     * Il viewpoint attivo non rende questo elemento (dimming + hint "not rendered").
     * L'hint dice `not rendered` e non "Not in this viewpoint": quest'ultima e' la
     * label della palette, che risponde a "cosa posso creare". Le due domande danno
     * insiemi diversi per costruzione e non devono sembrare la stessa cosa.
     */
    notRendered?: boolean;
}

const EntityRow = memo(function EntityRow(props: EntityRowProps): ReactElement {
    const {
        badge, badgeClassName, name, nameClassName, pillText, expandKey, isLeaf,
        expanded, onToggle, extraIcon, selected,
        onClick, onDoubleClick, onContextMenu, depth, dataElementId, highlightAction, isHighlighted, showNewBadge,
        actions, nameOverride, highlightQuery, notRendered,
    } = props;

    const hasChevron = !!expandKey && !isLeaf;
    const badgeIcon = badgeClassName ? BADGE_ICON[badgeClassName] : undefined;

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
            className={`tree-row ${selected ? 'tree-row--selected' : ''} ${notRendered ? 'tree-row--not-rendered' : ''} ${highlightClass}`.trim()}
            style={{ paddingLeft: `${depth * TREE_INDENT_STEP}px` }}
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

            <div className="tree-row__content" onClick={onClick} onDoubleClick={onDoubleClick}>
                <span
                    className={`tree-node__icon ${badgeClassName || ''}`}
                    title={badgeIcon?.label}
                    aria-label={badgeIcon?.label}
                >
                    {badgeIcon ? <i className={`bi ${badgeIcon.icon}`} aria-hidden /> : badge}
                </span>
                {nameOverride !== undefined ? nameOverride : (
                    <span className={`tree-row__name ${nameClassName || ''}`.trim()}>{renderHighlightedName(name || 'unnamed', highlightQuery)}</span>
                )}
                {pillText && <span className="tree-pill">{pillText}</span>}
                {extraIcon === 'bezier2' && (
                    <i
                        className="bi bi-bezier2 tree-edge-marker"
                        aria-hidden
                    />
                )}
                {extraIcon === 'stack' && (
                    <i
                        className="bi bi-stack tree-stack-marker"
                        aria-hidden
                    />
                )}
                {topProblem && (
                    <i
                        className="bi bi-exclamation-triangle-fill tree-problem-icon"
                        data-severity={topProblem.severity}
                        aria-label={problemTooltip || undefined}
                    />
                )}
                {showNewBadge && (
                    <span className="tree-node__badge tree-node__badge--new">NEW</span>
                )}
                {notRendered && (
                    <span
                        className="tree-row__not-rendered-hint"
                        title="The active viewpoint declares no view for this classifier."
                    >
                        not rendered
                    </span>
                )}
            </div>
            {actions && <span className="tree-row__actions">{actions}</span>}
        </div>
    );

    return rowContent;
});

// ─── Feature (leaf) row — M1 instance, no chevron, no tooltip ────────────────

const FeatureRow = memo(function FeatureRow({
    instance,
    selected,
    onSelect,
    depth,
    highlightQuery,
}: {
    instance: TreeFeatureData;
    selected: boolean;
    onSelect?: () => void;
    depth: number;
    highlightQuery?: string;
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
        <div className="tree-row tree-row--feature" data-element-id={instance.id} style={{ paddingLeft: `${depth * TREE_INDENT_STEP}px` }}>
            <span className="tree-node__toggle is-leaf" aria-hidden />
            <div className={`tree-row__content ${selected ? 'tree-row__content--selected' : ''}`} onClick={handleClick}>
                <span className="tree-feature__name">{renderHighlightedName(instance.name, highlightQuery)}</span>
                <span className="tree-feature__type">{instance.metaclassName}</span>
            </div>
        </div>
    );
});

const StructuralFeatureRow = memo(function StructuralFeatureRow({
    feature,
    kind,
    selected,
    depth,
    highlightQuery,
}: {
    feature: TreeStructuralFeatureData;
    kind: 'attribute' | 'reference';
    selected: boolean;
    depth: number;
    highlightQuery?: string;
}): ReactElement {
    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        SetRootFieldAction.new('_lastSelected' as any, {
            node: '',
            view: '',
            modelElement: feature.id,
        }, '', false);
    }, [feature.id]);

    const badge = kind === 'attribute' ? 'A' : 'R';
    const badgeClassName = kind === 'attribute' ? 'tree-DAttribute' : 'tree-DReference';

    return (
        <div className="tree-node" data-element-id={feature.id}>
            <EntityRow
                badge={badge}
                badgeClassName={badgeClassName}
                name={feature.name}
                isLeaf
                selected={selected}
                onClick={handleClick}
                depth={depth}
                dataElementId={feature.id}
                nameOverride={(
                    <>
                        <span className="tree-feature__name">{renderHighlightedName(feature.name, highlightQuery)}</span>
                        <span className="tree-feature__type">{formatFeatureSignature(feature.typeName, feature.multiplicity)}</span>
                    </>
                )}
            />
        </div>
    );
});

// ─── Class node ──────────────────────────────────────────────────────────────

const ClassNode = memo(function ClassNode({
    cls,
    selectedId,
    depth,
    isExpanded,
    onToggle,
    highlightedElementId,
    highlightedAction,
    highlightQuery,
}: {
    cls: TreeClassData;
    selectedId?: string;
    depth: number;
    isExpanded: boolean;
    onToggle: () => void;
    highlightedElementId?: string | null;
    highlightedAction?: ElementAction | null;
    highlightQuery?: string;
}): ReactElement {
    const isSelected = selectedId === cls.id;
    const isHighlighted = highlightedElementId === cls.id;
    const { handleContextMenu, popup, nodeRef } = useClassifierContextMenu(cls.id, cls.name, 'DClass');

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        SetRootFieldAction.new('_lastSelected', {
            node: '',
            view: '',
            modelElement: cls.id,
        }, '', false);
    }, [cls.id]);

    // Le feature di un classifier non reso non si renderizzano: la riga resta al
    // proprio posto nella gerarchia, dimmed e senza chevron. Nessun riordino,
    // nessun auto-espandere: l'unica cosa che cambia e' lo stile.
    const notRendered = !!cls.notRendered;
    const hasStructuralFeatures = !notRendered && (cls.attributes.length > 0 || cls.references.length > 0);

    return (
        <div ref={nodeRef} className="tree-node" data-element-id={cls.id}>
            <EntityRow
                badge="C"
                badgeClassName="tree-DClass"
                name={cls.name}
                nameClassName={cls.isAbstract ? 'is-abstract' : undefined}
                isLeaf={!hasStructuralFeatures}
                expanded={isExpanded && hasStructuralFeatures}
                onToggle={onToggle}
                extraIcon={cls.isEdgeView ? 'bezier2' : null}
                selected={isSelected}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                depth={depth}
                dataElementId={cls.id}
                isHighlighted={isHighlighted}
                highlightAction={highlightedAction}
                showNewBadge={isHighlighted && highlightedAction === 'create'}
                expandKey={cls.id}
                highlightQuery={highlightQuery}
                notRendered={notRendered}
            />
            {popup}
            {isExpanded && hasStructuralFeatures && (
                <div className="tree-children" style={{ '--tree-depth': depth } as any}>
                    {cls.attributes.map(attr => (
                        <StructuralFeatureRow
                            key={attr.id}
                            feature={attr}
                            kind="attribute"
                            selected={selectedId === attr.id}
                            depth={depth + 1}
                            highlightQuery={highlightQuery}
                        />
                    ))}
                    {cls.references.map(ref => (
                        <StructuralFeatureRow
                            key={ref.id}
                            feature={ref}
                            kind="reference"
                            selected={selectedId === ref.id}
                            depth={depth + 1}
                            highlightQuery={highlightQuery}
                        />
                    ))}
                </div>
            )}
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
    highlightQuery,
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
    highlightQuery?: string;
}): ReactElement {
    const isSelected = selectedId === pkg.id;
    const isHighlighted = highlightedElementId === pkg.id;
    const { handleContextMenu, popup, nodeRef } = useClassifierContextMenu(pkg.id, pkg.name, 'DPackage');

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        SetRootFieldAction.new('_lastSelected', {
            node: '',
            view: '',
            modelElement: pkg.id,
        }, '', false);
    }, [pkg.id]);

    return (
        <div ref={nodeRef} className="tree-node" data-element-id={pkg.id}>
            <EntityRow
                badge="P"
                badgeClassName="tree-DPackage"
                name={pkg.name}
                expandKey={pkg.id}
                expanded={isExpanded}
                onToggle={onToggle}
                selected={isSelected}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                depth={depth}
                dataElementId={pkg.id}
                isHighlighted={isHighlighted}
                highlightAction={highlightedAction}
                showNewBadge={isHighlighted && highlightedAction === 'create'}
                highlightQuery={highlightQuery}
            />
            {popup}
            {isExpanded && (
                <div className="tree-children" style={{ '--tree-depth': depth } as any}>
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
                            highlightQuery={highlightQuery}
                        />
                    ))}
                    {pkg.classes.map(c => (
                        <ClassNode
                            key={c.id}
                            cls={c}
                            selectedId={selectedId}
                            depth={depth + 1}
                            isExpanded={isExpandedFn(c.id)}
                            onToggle={() => onToggleFn(c.id)}
                            highlightedElementId={highlightedElementId}
                            highlightedAction={highlightedAction}
                            highlightQuery={highlightQuery}
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
    highlightQuery,
}: {
    model: TreeModelData;
    selectedId?: string;
    depth: number;
    isExpanded: boolean;
    onToggle: () => void;
    onSelect?: () => void;
    highlightQuery?: string;
}): ReactElement {
    const isSelected = selectedId === model.id;

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        SetRootFieldAction.new('_lastSelected', {
            node: '',
            view: '',
            modelElement: model.id,
        }, '', false);
        onSelect?.();
    }, [model.id, onSelect]);

    const hasInstances = model.instances.length > 0;
    const canExpand = model.isActive && hasInstances;

    return (
        <div className="tree-node" data-element-id={model.id}>
            <EntityRow
                badge="m"
                badgeClassName="tree-nested-model"
                name={model.name}
                expandKey={model.id}
                isLeaf={!canExpand}
                expanded={isExpanded && canExpand}
                onToggle={onToggle}
                selected={isSelected}
                onClick={handleClick}
                depth={depth}
                dataElementId={model.id}
                highlightQuery={highlightQuery}
            />
            {isExpanded && canExpand && (
                <div className="tree-children" style={{ '--tree-depth': depth } as any}>
                    {model.instances.map(inst => (
                        <FeatureRow
                            key={inst.id}
                            instance={inst}
                            selected={selectedId === inst.id}
                            onSelect={onSelect}
                            depth={depth + 1}
                            highlightQuery={highlightQuery}
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
    highlightQuery,
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
    highlightQuery?: string;
}): ReactElement {
    const isSelected = selectedId === mm.id;
    const isHighlighted = highlightedElementId === mm.id;
    const { handleContextMenu, popup, nodeRef } = useClassifierContextMenu(mm.id, mm.name, 'DModel');

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        SetRootFieldAction.new('_lastSelected', {
            node: '',
            view: '',
            modelElement: mm.id,
        }, '', false);
        onSelect?.();
    }, [mm.id, onSelect]);

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
                selected={isSelected}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                depth={depth}
                dataElementId={mm.id}
                isHighlighted={isHighlighted}
                highlightAction={highlightedAction}
                showNewBadge={isHighlighted && highlightedAction === 'create'}
                highlightQuery={highlightQuery}
            />
            {popup}
            {isExpanded && (
                <div className="tree-children" style={{ '--tree-depth': depth } as any}>
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
                            highlightQuery={highlightQuery}
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
                                highlightQuery={highlightQuery}
                            />
                        ))}
                    </SectionNode>
                </div>
            )}
        </div>
    );
});

// ─── Viewpoint nodes ─────────────────────────────────────────────────────────

interface SubViewItemRenameProps {
    renamingViewId: string | null;
    renameValue: string;
    setRenameValue: (v: string) => void;
    submitRenameView: (lView: LViewElement) => void;
    handleRenameKeyDown: (e: React.KeyboardEvent, lView: LViewElement) => void;
    renameInputRef: React.RefObject<HTMLInputElement>;
}

const SubViewItem = memo(function SubViewItem({
    view,
    depth,
    isExpandedFn,
    onToggleFn,
    onSelect,
    selectedViewId,
    highlightQuery,
    renamingViewId,
    renameValue,
    setRenameValue,
    submitRenameView,
    handleRenameKeyDown,
    renameInputRef,
}: {
    view: TreeSubViewData;
    depth: number;
    isExpandedFn: (key: string) => boolean;
    onToggleFn: (key: string) => void;
    onSelect?: () => void;
    selectedViewId?: string;
    highlightQuery?: string;
} & SubViewItemRenameProps): ReactElement {
    const hasChildren = view.children.length > 0;
    const expanded = isExpandedFn(view.id);
    const isRenaming = renamingViewId === view.id;
    const isSelected = !!selectedViewId && view.id === selectedViewId;

    const lView = useMemo(
        () => LPointerTargetable.fromPointer(view.id) as LViewElement,
        [view.id]
    );

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

    // Double click on a view row auto-pins the Properties panel on it (2026-07-23).
    // The triple is built explicitly from view.id: Action.fire dispatches through
    // setTimeout(0), so the store still holds the PREVIOUS selection at this point and
    // reading _lastSelected here would pin the wrong element.
    // Guarded on isRenaming: the inline rename input lives inside .tree-row__content, so a
    // double click to select a word while renaming would otherwise pin the view.
    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        if (isRenaming) return;
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent(JjodelEvents.PROPERTIES_PIN_VIEW, {
            detail: { selected: { node: '', view: view.id, modelElement: '' } },
        }));
    }, [view.id, isRenaming]);

    const handleDuplicate = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        // LViewElement.duplicate(deep: boolean = true): wraps in TRANSACTION,
        // undo-tracked. Deep copies nested subViews recursively.
        lView.duplicate(true);
    }, [lView]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        lView.delete();
    }, [lView]);

    const nameOverride = isRenaming ? (
        <input
            ref={renameInputRef}
            className="tree-row__rename-input"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => submitRenameView(lView)}
            onKeyDown={(e) => handleRenameKeyDown(e, lView)}
            onClick={(e) => e.stopPropagation()}
        />
    ) : undefined;

    const actions = (
        <>
            <button
                className="tree-row__action"
                onClick={handleDuplicate}
                aria-label="Duplicate"
            >
                <i className="bi bi-copy" />
            </button>
            <button
                className="tree-row__action tree-row__action--danger"
                onClick={handleDelete}
                aria-label="Delete"
            >
                <i className="bi bi-trash" />
            </button>
        </>
    );

    return (
        <div className="tree-node" data-element-id={view.id}>
            <EntityRow
                badge="v"
                badgeClassName="tree-leaf-view"
                name={view.name}
                nameOverride={nameOverride}
                expandKey={view.id}
                isLeaf={!hasChildren}
                expanded={expanded}
                selected={isSelected}
                onToggle={() => onToggleFn(view.id)}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                depth={depth}
                dataElementId={view.id}
                actions={actions}
                highlightQuery={highlightQuery}
            />
            {expanded && hasChildren && (
                <div className="tree-children" style={{ '--tree-depth': depth } as any}>
                    {view.children.map(child => (
                        <SubViewItem
                            key={child.id}
                            view={child}
                            depth={depth + 1}
                            isExpandedFn={isExpandedFn}
                            onToggleFn={onToggleFn}
                            onSelect={onSelect}
                            selectedViewId={selectedViewId}
                            highlightQuery={highlightQuery}
                            renamingViewId={renamingViewId}
                            renameValue={renameValue}
                            setRenameValue={setRenameValue}
                            submitRenameView={submitRenameView}
                            handleRenameKeyDown={handleRenameKeyDown}
                            renameInputRef={renameInputRef}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

interface ViewpointRenameProps extends SubViewItemRenameProps {
    startRenameView: (viewId: string, currentName: string, isFirst?: boolean) => void;
}

const ViewpointNode = memo(function ViewpointNode({
    vp,
    depth,
    isExpandedFn,
    onToggleFn,
    onSelect,
    selectedViewId,
    highlightQuery,
    startRenameView,
    renamingViewId,
    renameValue,
    setRenameValue,
    submitRenameView,
    handleRenameKeyDown,
    renameInputRef,
}: {
    vp: TreeViewpointData;
    depth: number;
    isExpandedFn: (key: string) => boolean;
    onToggleFn: (key: string) => void;
    onSelect?: () => void;
    selectedViewId?: string;
    highlightQuery?: string;
} & ViewpointRenameProps): ReactElement {
    const hasSubViews = vp.subViews.length > 0;
    const expanded = isExpandedFn(vp.id);
    // Highlight the viewpoint when it is the one open in Properties (selection
    // pill, 2026-07-28 round 2 refinement). The active-in-editor dot was removed
    // earlier, and the inert `activeViewpointId` thread that survived it is gone
    // with it: il viewpoint attivo che conta ora e' il root `state.viewpoint`, letto
    // da treeViewScope.ts — lo stesso contro cui risolve il canvas.
    const isSelected = !!selectedViewId && vp.id === selectedViewId;

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

    const handleAddView = useCallback(() => {
        const dVp = DPointerTargetable.from(vp.id) as DViewElement | undefined;
        if (!dVp) {
            console.warn('[TreeView] handleAddView: viewpoint D-element not found:', vp.id);
            return;
        }
        const newView = createBlankViewInViewpoint(dVp, 'New view');
        // React 18 automatic batching: il dispatch Redux di new2 e la
        // setState di startRenameView sono applicati nello stesso commit.
        // Quando il nuovo <SubViewItem> monta, vede già renamingViewId === newView.id.
        startRenameView(newView.id, newView.name, true);
    }, [vp.id, startRenameView]);

    const actions = (
        <button
            className="tree-row__action"
            onClick={(e) => { e.stopPropagation(); handleAddView(); }}
            aria-label="Add view"
        >
            <i className="bi bi-plus-lg" />
        </button>
    );

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
                selected={isSelected}
                onClick={handleClick}
                depth={depth}
                dataElementId={vp.id}
                actions={actions}
                highlightQuery={highlightQuery}
            />
            {expanded && hasSubViews && (
                <div className="tree-children" style={{ '--tree-depth': depth } as any}>
                    {vp.subViews.map(sv => (
                        <SubViewItem
                            key={sv.id}
                            view={sv}
                            depth={depth + 1}
                            isExpandedFn={isExpandedFn}
                            onToggleFn={onToggleFn}
                            onSelect={onSelect}
                            selectedViewId={selectedViewId}
                            highlightQuery={highlightQuery}
                            renamingViewId={renamingViewId}
                            renameValue={renameValue}
                            setRenameValue={setRenameValue}
                            submitRenameView={submitRenameView}
                            handleRenameKeyDown={handleRenameKeyDown}
                            renameInputRef={renameInputRef}
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
    highlightQuery,
}: {
    transformation: TreeTransformationData;
    selectedId?: string;
    depth: number;
    isExpandedFn: (key: string) => boolean;
    onToggleFn: (key: string) => void;
    onSelect?: () => void;
    highlightQuery?: string;
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
                highlightQuery={highlightQuery}
            />
            {expanded && hasChildren && (
                <div className="tree-children" style={{ '--tree-depth': depth } as any}>
                    {transformation.rules?.map((rule, i) => (
                        <div key={`r-${i}`} className="tree-row tree-row--feature" style={{ paddingLeft: `${(depth + 1) * TREE_INDENT_STEP}px` }}>
                            <span className="tree-node__toggle is-leaf" aria-hidden />
                            <div className="tree-row__content">
                                <span className="tree-node__icon tree-rule" title="Rule" aria-label="Rule"><i className="bi bi-list-check" aria-hidden /></span>
                                <span className="tree-row__name">{rule}</span>
                            </div>
                        </div>
                    ))}
                    {transformation.helpers?.map((helper, i) => (
                        <div key={`h-${i}`} className="tree-row tree-row--feature" style={{ paddingLeft: `${(depth + 1) * TREE_INDENT_STEP}px` }}>
                            <span className="tree-node__toggle is-leaf" aria-hidden />
                            <div className="tree-row__content">
                                <span className="tree-node__icon tree-helper" title="Helper" aria-label="Helper"><i className="bi bi-wrench" aria-hidden /></span>
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
        <div className="tree-empty-doc" style={{ paddingLeft: `${depth * TREE_INDENT_STEP}px` }}>
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
    /** Controlled by TreeViewSidebar's header toggle. When false the search row is hidden. */
    searchOpen?: boolean;
    /** Called on empty-field Esc to close the search row (clears the filter). */
    onSearchClose?: () => void;
}

interface OwnProps extends TreeViewContentProps {}

interface StateProps {
    metamodels: TreeMetamodelData[];
    standaloneModels: TreeModelData[];
    viewpoints: TreeViewpointData[];
    selectedElementId?: string;
    selectedViewId?: string;
    projectId?: Pointer<DProject>;
    expandedTreeNodes: string[];
}

interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function TreeViewContentComponent(props: AllProps) {
    const {
        metamodels, standaloneModels, viewpoints, selectedElementId,
        selectedViewId, projectId, expandedTreeNodes, onSelect,
        searchOpen, onSearchClose,
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const { highlightedElementId, highlightedAction } = useTreeViewPanel();

    // ─── Search (ephemeral local state — NEVER persisted to Redux) ───────────
    // The auto-expansion during a search is an in-memory override that vanishes
    // when the query is cleared; it must never write DProject.expandedTreeNodes.
    const [searchQuery, setSearchQuery] = useState('');
    // Explicit user collapses DURING a search (ephemeral, not persisted).
    const [searchCollapsed, setSearchCollapsed] = useState<Set<string>>(new Set());
    const searchActive = searchQuery.trim().length > 0;
    const trimmedQuery = searchQuery.trim();

    // Reset ephemeral collapses whenever the query changes.
    useEffect(() => {
        setSearchCollapsed(new Set());
    }, [searchQuery]);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // `searchOpen` is a CONTROLLED prop (TreeViewSidebar toggles it via its header
    // lens). When a consumer does NOT pass it (uncontrolled — e.g.
    // PropertiesWithTreeView, which has no header toggle), default to visible so
    // that panel keeps its filter row rather than losing it silently.
    const showSearchRow = searchOpen ?? true;

    // Opening the search autofocuses the field; closing it clears the query,
    // which restores the persisted expansion state (searchActive → false).
    useEffect(() => {
        if (searchOpen) searchInputRef.current?.focus();
        else if (searchOpen === false) setSearchQuery('');
    }, [searchOpen]);

    // ─── Inline rename state for View nodes ─────────────────────────────────
    // `isFirstRename` distingue il primo rename post-creazione (Esc/blur-empty
    // elimina la view) dal rename di una view esistente (Esc annulla senza cancellare).
    const [renamingViewId, setRenamingViewId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [isFirstRename, setIsFirstRename] = useState(false);
    const renameInputRef = useRef<HTMLInputElement>(null);

    const startRenameView = useCallback(
        (viewId: string, currentName: string, isFirst: boolean = false) => {
            setRenamingViewId(viewId);
            setRenameValue(currentName);
            setIsFirstRename(isFirst);
        },
        []
    );

    const submitRenameView = useCallback((lView: LViewElement) => {
        const newName = renameValue.trim();
        if (newName && newName !== lView.name) {
            lView.name = newName; // L-proxy setter, undo-tracked
        }
        // Blur con campo vuoto durante il primo rename → elimina la view.
        if (!newName && isFirstRename) {
            lView.delete();
        }
        setRenamingViewId(null);
        setRenameValue('');
        setIsFirstRename(false);
    }, [renameValue, isFirstRename]);

    const cancelRenameView = useCallback((lView: LViewElement) => {
        // Esc durante il primo rename post-creazione → elimina la view.
        // Esc durante un rename di view esistente → solo annulla, non cancella.
        if (isFirstRename) {
            lView.delete();
        }
        setRenamingViewId(null);
        setRenameValue('');
        setIsFirstRename(false);
    }, [isFirstRename]);

    const handleRenameKeyDown = useCallback(
        (e: React.KeyboardEvent, lView: LViewElement) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitRenameView(lView);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelRenameView(lView);
            }
        },
        [submitRenameView, cancelRenameView]
    );

    useEffect(() => {
        if (renamingViewId && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [renamingViewId]);

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

    // Expand/collapse helpers — derived from expandedTreeNodes prop.
    // During a search, expansion is driven by the ephemeral `searchCollapsed`
    // override (everything expanded unless the user explicitly collapsed it),
    // never by the persisted array.
    const isExpandedFn = useCallback(
        (key: string) => searchActive
            ? !searchCollapsed.has(key)
            : isExpandedFromArray(expandedTreeNodes, key),
        [searchActive, searchCollapsed, expandedTreeNodes]
    );

    const onToggleFn = useCallback((key: string) => {
        // During a search: mutate only the ephemeral override. Do NOT dispatch
        // a Redux action — the persisted expansion state must stay untouched.
        if (searchActive) {
            setSearchCollapsed(prev => {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                return next;
            });
            return;
        }
        if (!projectId) return;
        const currentlyExpanded = isExpandedFromArray(expandedTreeNodes, key);
        const next = toggleInArray(expandedTreeNodes, key, !currentlyExpanded);
        SetFieldAction.new(projectId, 'expandedTreeNodes', next, '', false);
    }, [searchActive, projectId, expandedTreeNodes]);

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

    // Search filtering — prune the in-memory Tree*Data. No debounce (data is
    // already in memory). Only the RENDER consumes these; the orphan-cleanup
    // effect and hasContent stay on the unfiltered props.
    const {
        displayMetamodels, displayStandaloneModels, displayViewpoints,
        displayTransformations, matchCount, firstMatchId,
    } = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) {
            return {
                displayMetamodels: metamodels,
                displayStandaloneModels: standaloneModels,
                displayViewpoints: viewpoints,
                displayTransformations: transformations,
                matchCount: 0,
                firstMatchId: null as string | null,
            };
        }
        const mm = filterMetamodels(metamodels, q);
        const sm = filterModels(standaloneModels, q);
        const vp = filterViewpoints(viewpoints, q);
        const tr = filterTransformations(transformations, q);
        return {
            displayMetamodels: mm.items,
            displayStandaloneModels: sm.items,
            displayViewpoints: vp.items,
            displayTransformations: tr.items,
            matchCount: mm.matchCount + sm.matchCount + vp.matchCount + tr.matchCount,
            firstMatchId: mm.firstMatchId ?? sm.firstMatchId ?? vp.firstMatchId ?? tr.firstMatchId,
        };
    }, [metamodels, standaloneModels, viewpoints, transformations, searchQuery]);

    const noMatches = searchActive &&
        displayMetamodels.length === 0 &&
        displayStandaloneModels.length === 0 &&
        displayViewpoints.length === 0 &&
        displayTransformations.length === 0;

    // Substring to <mark> in node names (only while a search is active).
    const highlightQuery = searchActive ? trimmedQuery : undefined;

    const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            // While the field is focused, own the Esc so the laptop overlay's
            // window-level listener doesn't also fire: first Esc (with text)
            // clears the query, a second (empty-field) Esc closes the search row.
            // Only once the search is closed does an Esc reach the window listener
            // and close the overlay.
            e.stopPropagation();
            if (searchQuery.trim().length > 0) {
                setSearchQuery('');
            } else {
                onSearchClose?.();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (firstMatchId && containerRef.current) {
                const target = containerRef.current.querySelector(`[data-element-id="${firstMatchId}"]`);
                target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            }
        }
    }, [searchQuery, firstMatchId, onSearchClose]);

    // Group viewpoints by type (filtered set during search)
    const { syntaxVps, validationVps, otherVps } = useMemo(() => {
        const syntax: TreeViewpointData[] = [];
        const validation: TreeViewpointData[] = [];
        const other: TreeViewpointData[] = [];
        for (const vp of displayViewpoints) {
            if (vp.vpType === 'syntax') syntax.push(vp);
            else if (vp.vpType === 'validation') validation.push(vp);
            else other.push(vp);
        }
        return { syntaxVps: syntax, validationVps: validation, otherVps: other };
    }, [displayViewpoints]);

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
            {showSearchRow && (
                <div className="tree-search">
                    <i className="bi bi-search" aria-hidden />
                    <input
                        ref={searchInputRef}
                        className="tree-search__input"
                        type="text"
                        placeholder="Filter..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        aria-label="Filter tree"
                    />
                    {searchActive && <span className="tree-search__count">{matchCount}</span>}
                    {searchActive && (
                        <button className="tree-search__clear" onClick={() => setSearchQuery('')} aria-label="Clear">
                            <i className="bi bi-x" />
                        </button>
                    )}
                </div>
            )}

            {noMatches ? (
                <div className="tree-view-empty tree-view-empty--search">
                    <i className="bi bi-search" />
                    <p>No matches</p>
                </div>
            ) : (
            <SectionNode
                sectionKey={SECTION_KEYS.MEGAMODEL}
                label="Megamodel"
                expanded={megamodelExpanded}
                onToggle={() => onToggleFn(SECTION_KEYS.MEGAMODEL)}
                depth={0}
            >
                {/* METAMODELS — hidden during search when nothing matches */}
                {(!searchActive || displayMetamodels.length > 0 || displayStandaloneModels.length > 0) && (
                <SectionNode
                    sectionKey={SECTION_KEYS.METAMODELS}
                    label="Metamodels"
                    counter={displayMetamodels.length}
                    expanded={metamodelsExpanded}
                    onToggle={() => onToggleFn(SECTION_KEYS.METAMODELS)}
                    depth={1}
                >
                    {displayMetamodels.map(mm => (
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
                            highlightQuery={highlightQuery}
                        />
                    ))}
                    {displayStandaloneModels.map(model => (
                        <ModelNode
                            key={model.id}
                            model={model}
                            selectedId={selectedElementId}
                            depth={2}
                            isExpanded={isExpandedFn(model.id)}
                            onToggle={() => onToggleFn(model.id)}
                            onSelect={onSelect}
                            highlightQuery={highlightQuery}
                        />
                    ))}
                </SectionNode>
                )}

                {/* VIEWPOINTS — hidden during search when nothing matches */}
                {(!searchActive || displayViewpoints.length > 0) && (
                <SectionNode
                    sectionKey={SECTION_KEYS.VIEWPOINTS}
                    label="Viewpoints"
                    counter={displayViewpoints.length}
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
                                    selectedViewId={selectedViewId}
                                    highlightQuery={highlightQuery}
                                    startRenameView={startRenameView}
                                    renamingViewId={renamingViewId}
                                    renameValue={renameValue}
                                    setRenameValue={setRenameValue}
                                    submitRenameView={submitRenameView}
                                    handleRenameKeyDown={handleRenameKeyDown}
                                    renameInputRef={renameInputRef}
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
                                    selectedViewId={selectedViewId}
                                    highlightQuery={highlightQuery}
                                    startRenameView={startRenameView}
                                    renamingViewId={renamingViewId}
                                    renameValue={renameValue}
                                    setRenameValue={setRenameValue}
                                    submitRenameView={submitRenameView}
                                    handleRenameKeyDown={handleRenameKeyDown}
                                    renameInputRef={renameInputRef}
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
                            selectedViewId={selectedViewId}
                            highlightQuery={highlightQuery}
                            startRenameView={startRenameView}
                            renamingViewId={renamingViewId}
                            renameValue={renameValue}
                            setRenameValue={setRenameValue}
                            submitRenameView={submitRenameView}
                            handleRenameKeyDown={handleRenameKeyDown}
                            renameInputRef={renameInputRef}
                        />
                    ))}
                </SectionNode>
                )}

                {/* DOCUMENTATION — hidden during search (no searchable content) */}
                {!searchActive && (
                <SectionNode
                    sectionKey={SECTION_KEYS.DOCUMENTATION}
                    label="Documentation"
                    expanded={docsExpanded}
                    onToggle={() => onToggleFn(SECTION_KEYS.DOCUMENTATION)}
                    depth={1}
                >
                    <DocumentationEmptyState depth={2} />
                </SectionNode>
                )}

                {/* TRANSFORMATIONS — kept under megamodel for visibility */}
                {displayTransformations.length > 0 && displayTransformations.map(t => (
                    <TransformationItem
                        key={t.id}
                        transformation={t}
                        selectedId={selectedElementId}
                        depth={1}
                        isExpandedFn={isExpandedFn}
                        onToggleFn={onToggleFn}
                        onSelect={onSelect}
                        highlightQuery={highlightQuery}
                    />
                ))}
            </SectionNode>
            )}
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

/**
 * `rendered` e' l'insieme dei classifier resi dal viewpoint attivo, o null quando
 * il metamodello e' FUORI scopo oppure l'informazione non esiste (viewpoint
 * classico, view wildcard, artefatto aperto non determinabile). Null ⇒ nessun
 * `notRendered` viene marcato, che e' esattamente il comportamento di prima.
 */
function buildPackageData(lPkg: any, parentFqn: string, rendered: ReadonlySet<string> | null): TreePackageData {
    const fqn = parentFqn ? `${parentFqn}.${lPkg.name || 'unnamed'}` : (lPkg.name || 'unnamed');
    const subPackages: TreePackageData[] = [];
    const classes: TreeClassData[] = [];

    try {
        const subs = lPkg.subpackages || [];
        for (const sub of subs) {
            if (!sub) continue;
            subPackages.push(buildPackageData(sub, fqn, rendered));
        }
    } catch { /* ignore */ }

    try {
        const cls = lPkg.classes || [];
        for (const c of cls) {
            if (!c) continue;
            const view = c.node?.view;
            const isEdgeView = !!(view && (view as any).isEdge);
            const attributes: TreeStructuralFeatureData[] = [];
            const references: TreeStructuralFeatureData[] = [];

            try {
                const attrs = c.attributes || [];
                for (const attr of attrs) {
                    if (!attr) continue;
                    attributes.push({
                        id: attr.id,
                        name: attr.name || 'unnamed',
                        typeName: getTypeName(attr),
                        multiplicity: getMultiplicity(attr),
                    });
                }
            } catch { /* ignore */ }

            try {
                const refs = c.references || [];
                for (const ref of refs) {
                    if (!ref) continue;
                    references.push({
                        id: ref.id,
                        name: ref.name || 'unnamed',
                        typeName: getTypeName(ref),
                        multiplicity: getMultiplicity(ref),
                    });
                }
            } catch { /* ignore */ }

            // Approximate instance count: sum across all m1 models that conform to a metamodel
            // referencing this class. For now use c.instances if exposed, fallback to 0.
            let instanceCount = 0;
            try {
                const instances = (c as any).instances;
                if (Array.isArray(instances)) instanceCount = instances.length;
            } catch { /* ignore */ }
            const className = c.name || 'unnamed';
            classes.push({
                id: c.id,
                name: className,
                fqn: `${fqn}.${className}`,
                isAbstract: !!(c as any).abstract,
                isEdgeView,
                instanceCount,
                attributes,
                references,
                notRendered: rendered ? !rendered.has(className) : false,
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

    // Filtro per viewpoint: `rendered` viene applicato SOLO ai metamodelli in
    // scopo. Gli altri restano in chiaro — il viewpoint non ha opinioni su di
    // loro, e dimmarli sarebbe una bugia (cfr. treeViewScope.ts).
    const scope = computeTreeViewScope(state);
    const scopeIds = new Set(scope?.scopeMetamodelIds ?? []);

    // Build metamodel tree data
    ret.metamodels = metamodels.map((mm) => {
        const mmName = mm.name || 'Unnamed Metamodel';
        const mmRendered = scope && scopeIds.has(mm.id) ? scope.rendered : null;
        const rootPackages: TreePackageData[] = [];
        try {
            const pkgs = (mm as any).packages || [];
            for (const pkg of pkgs) {
                if (!pkg) continue;
                rootPackages.push(buildPackageData(pkg, mmName, mmRendered));
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
    // Selected view/viewpoint id (DProject._lastSelected.view) — highlights the
    // view or viewpoint currently open in Properties with the same selection pill
    // used for model-element rows (2026-07-28 round 2 refinement).
    ret.selectedViewId = state._lastSelected?.view || undefined;

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
