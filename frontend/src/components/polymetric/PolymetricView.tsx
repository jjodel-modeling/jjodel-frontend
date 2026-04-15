/**
 * PolymetricView — Full-screen modal for polymetric visualization.
 *
 * Inspired by Lanza & Ducasse (2003). Renders metamodel or model data
 * as metric-enriched node graphs with selectable predefined views,
 * user-saved presets, and a fully interactive custom mapping editor.
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { PolymetricViewConfig, PolymetricNodeData, MetricKey } from './polymetricViews';
import {
    PREDEFINED_VIEWS,
    getDefaultView,
    getViewsForTarget,
    METRIC_LABELS,
    loadUserPresets,
    deleteUserPreset,
} from './polymetricViews';
import { extractMetamodelMetrics, extractModelMetrics, subsampleIfNeeded } from './polymetricMetrics';
import { applyLayout } from './polymetricLayouts';
import PolymetricCanvas from './PolymetricCanvas';
import PolymetricMappingEditor from './PolymetricMappingEditor';
import { Selectors, type DState } from '../../joiner';

import { JjodelEvents } from '../../events/registry';
import './polymetric-view.scss';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OpenModelItem {
    id: string;
    name: string;
    type: 'metamodel' | 'model';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CUSTOM_VIEW_ID = '__custom__';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PolymetricViewProps {
    isOpen: boolean;
    onClose: () => void;
    modelId: string;
    modelName: string;
    target: 'metamodel' | 'model';
    instanceModelId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PolymetricView: React.FC<PolymetricViewProps> = ({
    isOpen,
    onClose,
    modelId: initialModelId,
    modelName: _initialModelName,
    target: initialTarget,
    instanceModelId,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Read all models from Redux store
    

    const openModels: OpenModelItem[] = useSelector((_state: DState) => {
    const dModels = Selectors.getModels();
    // console.log('[DEBUG PolymetricView] getModels():', dModels?.length, dModels?.map(m => m.name));
    return dModels.map(m => ({
        id: m.id,
        name: m.name || 'unnamed',
        type: (m.isMetamodel ? 'metamodel' : 'model') as 'metamodel' | 'model',
    }));
});

    // Selected target (model/metamodel)
    const [selectedTargetId, setSelectedTargetId] = useState<string>(initialModelId);

    useEffect(() => {
        if (isOpen) setSelectedTargetId(initialModelId);
    }, [isOpen, initialModelId]);

    const selectedItem = useMemo(
        () => openModels.find(m => m.id === selectedTargetId) ?? openModels[0],
        [openModels, selectedTargetId],
    );
    const target = selectedItem?.type ?? initialTarget;
    const modelId = selectedItem?.id ?? initialModelId;

    // User presets from localStorage
    const [userPresets, setUserPresets] = useState<PolymetricViewConfig[]>(() => loadUserPresets());

    // All views = built-in + user presets
    const allViews = useMemo(
        () => [...PREDEFINED_VIEWS, ...userPresets],
        [userPresets],
    );

    // Active view
    const [activeViewId, setActiveViewId] = useState<string>(() => getDefaultView(initialTarget).id);

    // Custom mapping state
    const [customConfig, setCustomConfig] = useState<PolymetricViewConfig | null>(null);
    const isCustomMode = activeViewId === CUSTOM_VIEW_ID;

    // Animation handling
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            requestAnimationFrame(() => setIsAnimating(true));
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => setIsVisible(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // When the selected model's type changes, auto-pick a compatible view
    const prevTargetRef = useRef(target);
    useEffect(() => {
        if (target !== prevTargetRef.current) {
            prevTargetRef.current = target;
            setActiveViewId(getDefaultView(target).id);
            setCustomConfig(null);
        }
    }, [target]);

    const compatibleViews = useMemo(() => getViewsForTarget(target), [target]);

    const activeConfig: PolymetricViewConfig = useMemo(() => {
        if (isCustomMode && customConfig) return customConfig;
        return allViews.find(v => v.id === activeViewId) ?? getDefaultView(target);
    }, [isCustomMode, customConfig, activeViewId, target, allViews]);

    // Switch to custom mode
    const handleActivateCustom = useCallback(() => {
        if (!customConfig) {
            const base = allViews.find(v => v.id === activeViewId) ?? getDefaultView(target);
            setCustomConfig({
                ...base,
                id: CUSTOM_VIEW_ID,
                name: 'Custom',
                description: 'User-defined metric mapping',
                question: 'Explore your own metric combinations',
                icon: 'sliders',
                builtIn: false,
            });
        }
        setActiveViewId(CUSTOM_VIEW_ID);
    }, [customConfig, activeViewId, target, allViews]);

    const handlePresetSaved = useCallback((preset: PolymetricViewConfig) => {
        setUserPresets(loadUserPresets());
        setActiveViewId(preset.id);
    }, []);

    const handleDeletePreset = useCallback((presetId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = deleteUserPreset(presetId);
        setUserPresets(updated);
        if (activeViewId === presetId) {
            setActiveViewId(getDefaultView(target).id);
        }
    }, [activeViewId, target]);

    // Extract metrics
    const rawNodes: PolymetricNodeData[] = useMemo(() => {
        if (!modelId) return [];
        try {
            return target === 'metamodel'
                ? extractMetamodelMetrics(modelId, instanceModelId)
                : extractModelMetrics(modelId);
        } catch (e) {
            console.warn('[PolymetricView] Metric extraction failed:', e);
            return [];
        }
    }, [modelId, target, instanceModelId]);

    const [nodes, wasSubsampled] = useMemo(() => subsampleIfNeeded(rawNodes), [rawNodes]);

    const layoutNodes: PolymetricNodeData[] = useMemo(() => {
        if (nodes.length === 0) return [];
        const cloned = nodes.map(n => ({ ...n, metrics: { ...n.metrics } }));
        return applyLayout(cloned, activeConfig, 900, 600);
    }, [nodes, activeConfig]);

    const topNodes = useMemo(() => {
        return [...layoutNodes]
            .sort((a, b) => {
                const sumA = Object.values(a.metrics).reduce((s, v) => s + (v ?? 0), 0);
                const sumB = Object.values(b.metrics).reduce((s, v) => s + (v ?? 0), 0);
                return sumB - sumA;
            })
            .slice(0, 3);
    }, [layoutNodes]);

    const handleNodeClick = useCallback((nodeId: string) => {
        document.dispatchEvent(new CustomEvent(JjodelEvents.POLYMETRIC_NODE_SELECTED, {
            detail: { nodeId, type: target === 'metamodel' ? 'metaclass' : 'instance' },
        }));
    }, [target]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isVisible) return null;

    // Build the metric mapping table for the sidebar
    const mappingEntries: { channel: string; metric: MetricKey }[] = [
        { channel: 'Width', metric: activeConfig.metrics.width },
        { channel: 'Height', metric: activeConfig.metrics.height },
        { channel: 'Color', metric: activeConfig.metrics.color },
    ];
    if (activeConfig.metrics.posX) mappingEntries.push({ channel: 'Pos X', metric: activeConfig.metrics.posX });
    if (activeConfig.metrics.posY) mappingEntries.push({ channel: 'Pos Y', metric: activeConfig.metrics.posY });

    return (
        <div
            className={`polymetric-overlay ${isAnimating ? 'visible' : ''}`}
            onClick={onClose}
        >
            <div
                className={`polymetric-modal ${isAnimating ? 'visible' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="polymetric-modal__header">
                    <div className="polymetric-modal__title-row">
                        <i className="bi bi-grid-3x3-gap" />
                        <h2>Polymetric View</h2>
                    </div>

                    <div className="polymetric-modal__model-selector">
                        {openModels.map(item => (
                            <button
                                key={item.id}
                                className={`polymetric-model-pill ${selectedTargetId === item.id ? 'active' : ''}`}
                                onClick={() => setSelectedTargetId(item.id)}
                            >
                                <i className={`bi ${item.type === 'metamodel' ? 'bi-diagram-3' : 'bi-boxes'}`} />
                                <span>
                                    {item.name.length > 18
                                        ? item.name.slice(0, 17) + '\u2026'
                                        : item.name}
                                </span>
                            </button>
                        ))}
                    </div>

                    <button className="polymetric-modal__close" onClick={onClose} aria-label="Close">
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* View tabs */}
                <div className="polymetric-modal__tabs">
                    {allViews.map(view => {
                        const isCompatible = compatibleViews.some(v => v.id === view.id)
                            || !view.builtIn;
                        const isUserPreset = !view.builtIn && view.id !== CUSTOM_VIEW_ID;
                        return (
                            <button
                                key={view.id}
                                className={`polymetric-tab ${activeViewId === view.id ? 'active' : ''} ${!isCompatible ? 'disabled' : ''}`}
                                onClick={() => isCompatible && setActiveViewId(view.id)}
                                title={view.description}
                                disabled={!isCompatible}
                            >
                                <i className={`bi bi-${view.icon}`} />
                                <span>{view.name}</span>
                                {isUserPreset && (
                                    <span
                                        className="polymetric-tab__delete"
                                        onClick={e => handleDeletePreset(view.id, e)}
                                        title="Delete preset"
                                    >
                                        <i className="bi bi-x" />
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    <button
                        className={`polymetric-tab polymetric-tab--custom ${isCustomMode ? 'active' : ''}`}
                        onClick={handleActivateCustom}
                        title="Custom metric mapping"
                    >
                        <i className="bi bi-sliders" />
                        <span>Custom</span>
                    </button>
                </div>

                {/* Custom mapping editor */}
                {isCustomMode && customConfig && (
                    <PolymetricMappingEditor
                        config={customConfig}
                        target={target}
                        onChange={setCustomConfig}
                        onSavePreset={handlePresetSaved}
                    />
                )}

                {/* Body */}
                <div className="polymetric-modal__body">
                    <div className="polymetric-modal__canvas-area">
                        {wasSubsampled && (
                            <div className="polymetric-modal__warning">
                                <i className="bi bi-exclamation-triangle" />
                                Showing top 500 of {rawNodes.length} nodes
                            </div>
                        )}
                        {layoutNodes.length === 0 ? (
                            <div className="polymetric-modal__empty">
                                <i className="bi bi-inbox" />
                                <p>No elements to visualize</p>
                            </div>
                        ) : (
                            <PolymetricCanvas
                                nodes={layoutNodes}
                                config={activeConfig}
                                onNodeClick={handleNodeClick}
                            />
                        )}
                    </div>

                    {/* Legend sidebar */}
                    <div className="polymetric-modal__legend">
                        <div className="legend-card">
                            <div className="legend-card__title">
                                <i className="bi bi-info-circle" />
                                About this view
                            </div>
                            {activeConfig.question && (
                                <p className="legend-card__question">{activeConfig.question}</p>
                            )}
                            <p className="legend-card__desc">{activeConfig.description}</p>
                        </div>

                        {/* Metric mapping table */}
                        <div className="legend-card">
                            <div className="legend-card__title">Mapping</div>
                            <div className="legend-mapping-table">
                                {mappingEntries.map(entry => (
                                    <div key={entry.channel} className="legend-mapping-row">
                                        <span className="legend-mapping-row__channel">{entry.channel}</span>
                                        <span className="legend-mapping-row__arrow">&rarr;</span>
                                        <span className="legend-mapping-row__metric">{entry.metric}</span>
                                        <span className="legend-mapping-row__label">
                                            {METRIC_LABELS[entry.metric]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Color scale */}
                        <div className="legend-card">
                            <div className="legend-card__title">Color</div>
                            <div className="legend-color-scale">
                                <div className="legend-color-scale__bar" />
                                <div className="legend-color-scale__labels">
                                    <span>Low</span>
                                    <span>{METRIC_LABELS[activeConfig.metrics.color]}</span>
                                    <span>High</span>
                                </div>
                            </div>
                        </div>

                        {/* Size legend */}
                        <div className="legend-card">
                            <div className="legend-card__title">Size</div>
                            <div className="legend-size">
                                <div className="legend-size__row">
                                    <div className="legend-size__small-rect" />
                                    <span className="legend-size__arrow">&rarr;</span>
                                    <div className="legend-size__large-rect" />
                                </div>
                                <div className="legend-size__labels">
                                    <span>W: {METRIC_LABELS[activeConfig.metrics.width]}</span>
                                    <span>H: {METRIC_LABELS[activeConfig.metrics.height]}</span>
                                </div>
                            </div>
                        </div>

                        {/* Top nodes */}
                        {topNodes.length > 0 && (
                            <div className="legend-card">
                                <div className="legend-card__title">
                                    <i className="bi bi-trophy" />
                                    Top elements
                                </div>
                                <div className="legend-top-nodes">
                                    {topNodes.map((node, i) => (
                                        <div key={node.id} className="legend-top-node">
                                            <span className="legend-top-node__rank">{i + 1}</span>
                                            <span className="legend-top-node__name">{node.label}</span>
                                            <div className="legend-top-node__metrics">
                                                {Object.entries(node.metrics).map(([key, val]) => (
                                                    <span key={key} className="legend-top-node__metric">
                                                        {METRIC_LABELS[key as keyof typeof METRIC_LABELS] ?? key}:{' '}
                                                        {key === 'Completeness'
                                                            ? `${((val ?? 0) * 100).toFixed(0)}%`
                                                            : val ?? 0}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="legend-card legend-card--stats">
                            <span>{layoutNodes.length} elements</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PolymetricView;
