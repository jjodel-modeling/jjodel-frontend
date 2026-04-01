import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { LViewPoint, LViewElement, DViewPoint, DViewElement, DPointerTargetable } from '../../../joiner';
import { getViewpointType, ViewpointType } from '../../../view/viewPoint/viewpoint';
import StyleTab from './tabs/StyleTab';

interface ViewpointEditorRootProps {
    viewpoint: LViewPoint;
    onViewSelect: (viewId: string) => void;
    onViewCreated?: () => void;
}

// ---------- View tree types & helpers ----------

interface ViewTreeItem {
    id: string;
    name: string;
    isViewpoint: boolean;
    isExclusive: boolean;
    priority?: number;
    hasOcl: boolean;
    hasJs: boolean;
    hasExclusive: boolean;
    children: ViewTreeItem[];
}

function buildTreeItems(lView: LViewElement, isRoot: boolean): ViewTreeItem {
    const raw = lView.__raw;
    let subViews: LViewElement[] = [];
    try {
        subViews = lView.subViews || [];
    } catch (e) {
        console.error('[VEP] buildTreeItems error reading subViews:', e);
    }

    const hasOcl = !!(raw?.oclCondition && raw.oclCondition.trim());
    const hasJs = !!(raw?.jsCondition && (raw as any).jsCondition.trim?.());

    return {
        id: lView.id,
        name: lView.name || 'Unnamed',
        isViewpoint: isRoot && (raw as any)?.className === DViewPoint.cname,
        isExclusive: raw?.isExclusiveView ?? false,
        priority: raw?.explicitApplicationPriority,
        hasOcl,
        hasJs,
        hasExclusive: raw?.isExclusiveView ?? false,
        children: subViews
            .filter(sv => !!sv)
            .map(sv => buildTreeItems(sv, false)),
    };
}

/**
 * Build tree items reading directly from Redux store (bypasses proxy L cache).
 * In the store, subViews is a dictionary { pointerId: number }, not an array.
 */
function buildTreeFromStore(state: any, nodeId: string, isRoot: boolean): ViewTreeItem | null {
    const raw = state.idlookup?.[nodeId];
    if (!raw) return null;

    const subViewDict = raw.subViews;
    const subViewIds = subViewDict ? Object.keys(subViewDict) : [];

    const children = subViewIds
        .map(id => buildTreeFromStore(state, id, false))
        .filter((item): item is ViewTreeItem => item !== null);

    return {
        id: nodeId,
        name: raw.name || 'Unnamed',
        isViewpoint: isRoot && raw.className === DViewPoint.cname,
        isExclusive: raw.isExclusiveView ?? false,
        priority: raw.explicitApplicationPriority,
        hasOcl: !!(raw.oclCondition && raw.oclCondition.trim()),
        hasJs: !!(raw.jsCondition && (raw.jsCondition as string)?.trim?.()),
        hasExclusive: raw.isExclusiveView ?? false,
        children,
    };
}

// ---------- ViewTreeRow ----------

interface ViewTreeRowProps {
    item: ViewTreeItem;
    depth: number;
    selectedId: string | null;
    onSelect: (id: string) => void;
}

const ViewTreeRow: React.FC<ViewTreeRowProps> = ({ item, depth, selectedId, onSelect }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = item.children.length > 0;
    const isSelected = selectedId === item.id;

    const badgeLetter = item.isViewpoint ? 'VP' : 'V';
    const badgeBg = item.isViewpoint ? '#f0fdf4' : '#ede9fe';
    const badgeColor = item.isViewpoint ? '#166534' : '#5b21b6';

    return (
        <>
            <div
                className={`vep-tree__row ${isSelected ? 'vep-tree__row--selected' : ''}`}
                style={{ paddingLeft: 8 + depth * 14 }}
                onClick={() => onSelect(item.id)}
            >
                {/* Toggle */}
                {hasChildren ? (
                    <span
                        className="vep-tree__toggle"
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    >
                        {expanded ? '▾' : '▸'}
                    </span>
                ) : (
                    <span className="vep-tree__toggle" />
                )}

                {/* Badge */}
                <span
                    className="vep-tree__badge"
                    style={{ background: badgeBg, color: badgeColor }}
                >
                    {badgeLetter}
                </span>

                {/* Name */}
                <span className="vep-tree__name">{item.name}</span>

                {/* Right side: priority + feature badges */}
                <span className="vep-tree__meta">
                    {item.priority !== undefined && (
                        <span className="vep-tree__priority">p:{item.priority}</span>
                    )}
                    {item.hasOcl && (
                        <span className="vep-tree__feature-badge vep-tree__feature-badge--ocl">OCL</span>
                    )}
                    {item.hasJs && (
                        <span className="vep-tree__feature-badge vep-tree__feature-badge--js">JS</span>
                    )}
                    {item.hasExclusive && !item.isViewpoint && (
                        <span className="vep-tree__feature-badge vep-tree__feature-badge--ex">EX</span>
                    )}
                </span>
            </div>

            {hasChildren && expanded && item.children.map(child => (
                <ViewTreeRow
                    key={child.id}
                    item={child}
                    depth={depth + 1}
                    selectedId={selectedId}
                    onSelect={onSelect}
                />
            ))}
        </>
    );
};

// ---------- ViewpointEditorRoot ----------

const ViewpointEditorRoot: React.FC<ViewpointEditorRootProps> = ({
    viewpoint,
    onViewSelect,
    onViewCreated,
}) => {
    const [activeTab, setActiveTab] = useState<'views' | 'style'>('views');
    const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    // Read tree directly from Redux store — bypasses proxy L cache for reactivity
    const treeRoot = useSelector(
        (state: any) => buildTreeFromStore(state, viewpoint.id, true),
        (a, b) => JSON.stringify(a) === JSON.stringify(b)
    ) ?? buildTreeItems(viewpoint as any as LViewElement, true);

    const vpType = getViewpointType(viewpoint.__raw);
    const typeBadge = vpType === 'syntax'
        ? { label: 'Syntax', bg: '#dbeafe', color: '#1e40af' }
        : vpType === 'validation'
        ? { label: 'Validation', bg: '#fef3c7', color: '#92400e' }
        : { label: vpType.replace('_', ' '), bg: '#f1f5f9', color: '#64748b' };

    const handleTreeSelect = useCallback((id: string) => {
        setSelectedTreeId(id);
        // If clicking a view (not the viewpoint root), navigate to single view editing
        if (id !== viewpoint.id) {
            onViewSelect(id);
        }
    }, [viewpoint.id, onViewSelect]);

    const handleCreateView = useCallback(() => {
        // Fresh lookup from Redux — viewpoint.__raw can be a stale snapshot
        // if the reducer replaced the state object since the proxy was created.
        // DPointerTargetable.from(id) always reads from store.getState().idlookup.
        const dVp = DPointerTargetable.from(viewpoint.id) as DViewElement;
        if (!dVp || !dVp.id) {
            console.error('[VEP] handleCreateView: could not resolve viewpoint', viewpoint.id);
            return;
        }

        const viewName = 'New View ' + (treeRoot.children.length + 1);

        DViewElement.new2(
            viewName,
`<View className={'root bg-white p-1'}>
    <div className={'header'}>
        {!data ? null :
            <label className={'input-container mx-2'}>
                <b className={'object-name'}>Name:</b>
                <Input data={data} field={'name'} hidden={true} autosize={true} placeholder={'enter name'}/>
            </label>
        }
    </div>
    <div className={'body'}>To add information here,<br/> edit the view<br/>"{view.name}"</div>
    {decorators}
</View>`,
            dVp,
            (d) => {
                d.appliableToClasses = ['DObject'];
                d.appliableTo = 'Vertex' as any;
            },
            true,
        );

        if (onViewCreated) {
            onViewCreated();
        }

    }, [viewpoint.id, treeRoot.children.length, onViewCreated]);

    // Viewpoint properties handlers
    const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        viewpoint.name = e.target.value;
    }, [viewpoint]);

    const handleTypeToggle = useCallback((newType: 'syntax' | 'validation') => {
        (viewpoint as any).viewpointType = newType;
        viewpoint.isExclusiveView = (newType === 'syntax');
        (viewpoint as any).isValidation = (newType === 'validation');
    }, [viewpoint]);

    const handleExclusiveToggle = useCallback(() => {
        viewpoint.isExclusiveView = !viewpoint.__raw.isExclusiveView;
    }, [viewpoint]);

    return (
        <div className="vep-root">
            {/* Header */}
            <div className="vep-root__header">
                <div className="vep-root__header-left">
                    <span className="vep-root__name">{viewpoint.name || 'Unnamed'}</span>
                    <span
                        className="vep-root__type-badge"
                        style={{ background: typeBadge.bg, color: typeBadge.color }}
                    >
                        {typeBadge.label}
                    </span>
                </div>
                <div className="vep-root__header-actions">
                    <button
                        className="vep-root__action-btn"
                        onClick={handleCreateView}
                        title="New view"
                    >
                        <i className="bi bi-plus" />
                    </button>
                    <div style={{ position: 'relative' }}>
                        <button
                            className="vep-root__action-btn"
                            title="More options"
                            onClick={() => setMenuOpen(prev => !prev)}
                        >
                            <i className="bi bi-three-dots-vertical" />
                        </button>
                        {menuOpen && (
                            <>
                                <div
                                    style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                                    onClick={() => setMenuOpen(false)}
                                />
                                <div className="vep-root__dropdown" style={{
                                    position: 'absolute', right: 0, top: '100%', zIndex: 1000,
                                    background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', minWidth: 160, padding: '4px 0',
                                }}>
                                    <button
                                        className="vep-root__dropdown-item"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                            padding: '6px 12px', background: 'none', border: 'none',
                                            color: '#e2e8f0', fontSize: 13, cursor: 'pointer', textAlign: 'left',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                        onClick={() => { setMenuOpen(false); handleCreateView(); }}
                                    >
                                        <i className="bi bi-plus-lg" style={{ fontSize: 14 }} />
                                        Add View
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs: Views | Style */}
            <div className="vep-root__tabs">
                <button
                    className={`vep-root__tab ${activeTab === 'views' ? 'vep-root__tab--active' : ''}`}
                    onClick={() => setActiveTab('views')}
                >
                    Views
                </button>
                <button
                    className={`vep-root__tab ${activeTab === 'style' ? 'vep-root__tab--active' : ''}`}
                    onClick={() => setActiveTab('style')}
                >
                    Style
                </button>
            </div>

            {/* Tab content */}
            <div className="vep-root__content">
                {activeTab === 'views' ? (
                    <>
                        {/* View tree */}
                        <div className="vep-tree">
                            {treeRoot.children.length === 0 ? (
                                <div className="vep-tree__empty">
                                    <i className="bi bi-layers" />
                                    <span>No views defined yet</span>
                                    <button
                                        className="vep-tree__empty-cta"
                                        onClick={handleCreateView}
                                    >
                                        Create your first view
                                    </button>
                                </div>
                            ) : (
                                <div className="vep-tree__list">
                                    <ViewTreeRow
                                        item={treeRoot}
                                        depth={0}
                                        selectedId={selectedTreeId}
                                        onSelect={handleTreeSelect}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Viewpoint properties */}
                        <div className="vep-props">
                            <div className="vep-props__header">Viewpoint properties</div>

                            <div className="vep-props__field">
                                <label className="vep-props__label">Name</label>
                                <input
                                    className="vep-props__input"
                                    value={viewpoint.name || ''}
                                    onChange={handleNameChange}
                                />
                            </div>

                            <div className="vep-props__field">
                                <label className="vep-props__label">Type</label>
                                <div className="vep-props__segmented">
                                    <button
                                        className={`vep-props__seg-btn ${vpType === 'syntax' ? 'vep-props__seg-btn--active' : ''}`}
                                        onClick={() => handleTypeToggle('syntax')}
                                    >
                                        Syntax
                                    </button>
                                    <button
                                        className={`vep-props__seg-btn ${vpType === 'validation' ? 'vep-props__seg-btn--active' : ''}`}
                                        onClick={() => handleTypeToggle('validation')}
                                    >
                                        Validation
                                    </button>
                                </div>
                            </div>

                            <div className="vep-props__toggle-row">
                                <span className="vep-props__label">Exclusive</span>
                                <button
                                    type="button"
                                    className={`vep-props__switch ${viewpoint.__raw.isExclusiveView ? 'vep-props__switch--active' : ''}`}
                                    onClick={handleExclusiveToggle}
                                />
                            </div>
                        </div>

                        {/* Empty state hint */}
                        <div className="vep-root__hint">
                            Select a view to edit its notation
                        </div>
                    </>
                ) : (
                    <StyleTab
                        view={viewpoint as any as LViewElement}
                        isViewpointLevel={true}
                        onViewUpdate={() => {/* trigger re-render if needed */}}
                    />
                )}
            </div>
        </div>
    );
};

export default ViewpointEditorRoot;
