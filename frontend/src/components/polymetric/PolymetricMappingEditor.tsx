/**
 * PolymetricMappingEditor — Inline custom mapping editor.
 *
 * Renders a single horizontal row of metric dropdowns (width, height, color,
 * posX, posY, layout, sortBy) with live update on every change.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { LayoutType, MetricKey, PolymetricViewConfig } from './polymetricViews';
import {
    METRIC_LABELS,
    METAMODEL_METRICS,
    MODEL_METRICS,
    loadUserPresets,
    saveUserPresets,
} from './polymetricViews';

interface PolymetricMappingEditorProps {
    config: PolymetricViewConfig;
    target: 'metamodel' | 'model';
    onChange: (config: PolymetricViewConfig) => void;
    onSavePreset: (preset: PolymetricViewConfig) => void;
}

const LAYOUT_OPTIONS: { value: LayoutType; label: string }[] = [
    { value: 'checker', label: 'Checker' },
    { value: 'tree', label: 'Tree' },
    { value: 'scatterplot', label: 'Scatterplot' },
];

const PolymetricMappingEditor: React.FC<PolymetricMappingEditorProps> = ({
    config,
    target,
    onChange,
    onSavePreset,
}) => {
    const [showSavePopover, setShowSavePopover] = useState(false);
    const [presetName, setPresetName] = useState('');
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close popover on outside click
    useEffect(() => {
        if (!showSavePopover) return;
        const handleClick = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setShowSavePopover(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showSavePopover]);

    const primaryMetrics = target === 'metamodel' ? METAMODEL_METRICS : MODEL_METRICS;
    const secondaryMetrics = target === 'metamodel' ? MODEL_METRICS : METAMODEL_METRICS;

    const updateMetric = useCallback((channel: keyof PolymetricViewConfig['metrics'], value: string) => {
        const newMetrics = { ...config.metrics };
        if (value === 'none') {
            delete newMetrics[channel as 'posX' | 'posY'];
        } else {
            (newMetrics as any)[channel] = value as MetricKey;
        }
        onChange({ ...config, metrics: newMetrics });
    }, [config, onChange]);

    const updateLayout = useCallback((layout: LayoutType) => {
        const isScatter = layout === 'scatterplot';
        const newMetrics = { ...config.metrics };
        if (isScatter) {
            if (!newMetrics.posX) newMetrics.posX = primaryMetrics[0]; // e.g. NAttr or NVal
            if (!newMetrics.posY) newMetrics.posY = primaryMetrics[2]; // e.g. NRef or NLinkIn
        } else {
            delete newMetrics.posX;
            delete newMetrics.posY;
        }
        onChange({ ...config, layout, metrics: newMetrics });
    }, [config, onChange, primaryMetrics]);

    const updateSortBy = useCallback((value: string) => {
        const updated = { ...config };
        if (value === 'none') {
            delete updated.sortBy;
        } else {
            updated.sortBy = value as MetricKey;
        }
        onChange(updated);
    }, [config, onChange]);

    const handleSavePreset = useCallback(() => {
        if (!presetName.trim()) return;
        const id = 'user-' + Date.now();
        const preset: PolymetricViewConfig = {
            ...config,
            id,
            name: presetName.trim(),
            description: `Custom view: ${presetName.trim()}`,
            icon: 'bookmark',
            builtIn: false,
        };
        const existing = loadUserPresets();
        existing.push(preset);
        saveUserPresets(existing);
        onSavePreset(preset);
        setPresetName('');
        setShowSavePopover(false);
    }, [config, presetName, onSavePreset]);

    const isScatterplot = config.layout === 'scatterplot';

    const renderMetricSelect = (
        label: string,
        channel: keyof PolymetricViewConfig['metrics'],
        allowNone: boolean,
        forceDisabled?: boolean,
    ) => {
        const currentValue = config.metrics[channel] ?? 'none';
        return (
            <div className="mapping-editor__field">
                <label>{label}</label>
                <select
                    className="mapping-editor__select"
                    value={currentValue}
                    onChange={e => updateMetric(channel, e.target.value)}
                    disabled={forceDisabled}
                    style={forceDisabled ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
                >
                    {allowNone && <option value="none">(none)</option>}
                    <optgroup label={target === 'metamodel' ? 'Metamodel' : 'Model'}>
                        {primaryMetrics.map(m => (
                            <option key={m} value={m}>{METRIC_LABELS[m]}</option>
                        ))}
                    </optgroup>
                    <optgroup label={target === 'metamodel' ? 'Model' : 'Metamodel'}>
                        {secondaryMetrics.map(m => (
                            <option key={m} value={m} disabled>{METRIC_LABELS[m]}</option>
                        ))}
                    </optgroup>
                </select>
            </div>
        );
    };

    return (
        <div className="mapping-editor">
            <div className="mapping-editor__row">
                {renderMetricSelect('Width', 'width', false)}
                {renderMetricSelect('Height', 'height', false)}
                {renderMetricSelect('Color', 'color', false)}
                {renderMetricSelect('Pos X', 'posX', true, !isScatterplot)}
                {renderMetricSelect('Pos Y', 'posY', true, !isScatterplot)}

                <div className="mapping-editor__separator" />

                <div className="mapping-editor__field">
                    <label>Layout</label>
                    <select
                        className="mapping-editor__select"
                        value={config.layout}
                        onChange={e => updateLayout(e.target.value as LayoutType)}
                    >
                        {LAYOUT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="mapping-editor__field">
                    <label>Sort</label>
                    <select
                        className="mapping-editor__select"
                        value={config.sortBy ?? 'none'}
                        onChange={e => updateSortBy(e.target.value)}
                    >
                        <option value="none">(none)</option>
                        {primaryMetrics.map(m => (
                            <option key={m} value={m}>{METRIC_LABELS[m]}</option>
                        ))}
                    </select>
                </div>

                <div className="mapping-editor__spacer" />

                <div className="mapping-editor__save-wrapper" ref={popoverRef}>
                    <button
                        className="mapping-editor__save-btn"
                        onClick={() => setShowSavePopover(!showSavePopover)}
                    >
                        <i className="bi bi-bookmark-plus" />
                        Save preset
                    </button>
                    {showSavePopover && (
                        <div className="mapping-editor__save-popover">
                            <input
                                type="text"
                                className="mapping-editor__save-input"
                                placeholder="My preset name"
                                value={presetName}
                                onChange={e => setPresetName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
                                autoFocus
                            />
                            <button
                                className="mapping-editor__save-confirm"
                                onClick={handleSavePreset}
                                disabled={!presetName.trim()}
                            >
                                Save
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(PolymetricMappingEditor);
