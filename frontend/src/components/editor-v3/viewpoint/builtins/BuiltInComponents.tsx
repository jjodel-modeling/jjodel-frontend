/**
 * Editor V3 — Built-in components available in custom viewpoint JSX.
 *
 * These components are injected into the JSX execution context
 * so viewpoint authors can use them in their templates:
 *
 *   <View className="my-card">
 *     <Field feature={data.name} />
 *     <Input value={data.age} onChange={...} />
 *     <SubView data={child} />
 *   </View>
 *
 * All writes go through syncFeatureValue in canvasToJjomV3.
 */

import React, { useState, useCallback } from 'react';
import { syncFeatureValue } from '../../sync/canvasToJjomV3';

// ---------------------------------------------------------------------------
// <View> — Main wrapper with className and style
// ---------------------------------------------------------------------------

export const BuiltInView: React.FC<{
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}> = ({ className, style, children }) => (
    <div className={cn('viewpoint-view', className)} style={style}>
        {children}
    </div>
);

// ---------------------------------------------------------------------------
// <Text> — Read-only text display
// ---------------------------------------------------------------------------

export const BuiltInText: React.FC<{
    value?: string;
    className?: string;
    children?: React.ReactNode;
}> = ({ value, className, children }) => (
    <span className={cn('viewpoint-text', className)}>
        {value ?? children ?? ''}
    </span>
);

// ---------------------------------------------------------------------------
// <Field> — Editable field linked to a DValue feature
// ---------------------------------------------------------------------------

export const BuiltInField: React.FC<{
    feature?: any;
    editable?: boolean;
    className?: string;
}> = ({ feature, editable = true, className }) => {
    const [editing, setEditing] = useState(false);
    const [localValue, setLocalValue] = useState('');

    const displayValue = feature?.values?.[0] ?? '';
    const featureName = feature?.instanceof?.name ?? feature?.name ?? '';
    const fatherId = feature?.father ?? '';

    const handleStartEdit = useCallback(() => {
        if (!editable) return;
        setLocalValue(String(displayValue));
        setEditing(true);
    }, [editable, displayValue]);

    const handleCommit = useCallback(() => {
        setEditing(false);
        if (fatherId && featureName) {
            syncFeatureValue(fatherId, featureName, localValue);
        }
    }, [fatherId, featureName, localValue]);

    if (!editable || !editing) {
        return (
            <span
                className={cn('viewpoint-field', className)}
                onDoubleClick={handleStartEdit}
            >
                {featureName ? `${featureName}: ` : ''}{String(displayValue) || '\u2014'}
            </span>
        );
    }

    return (
        <input
            className="viewpoint-field-input"
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={e => { if (e.key === 'Enter') handleCommit(); }}
            autoFocus
        />
    );
};

// ---------------------------------------------------------------------------
// <Input> — Direct input with onChange callback
// ---------------------------------------------------------------------------

export const BuiltInInput: React.FC<{
    value?: any;
    onChange?: (v: any) => void;
    placeholder?: string;
    type?: string;
    className?: string;
}> = ({ value, onChange, placeholder, type = 'text', className }) => (
    <input
        className={cn('viewpoint-input', className)}
        type={type}
        value={value ?? ''}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        onMouseDown={e => e.stopPropagation()}
    />
);

// ---------------------------------------------------------------------------
// <Toggle> — Boolean switch
// ---------------------------------------------------------------------------

export const BuiltInToggle: React.FC<{
    value?: boolean;
    onChange?: (v: boolean) => void;
    label?: string;
    className?: string;
}> = ({ value, onChange, label, className }) => (
    <label className={cn('viewpoint-toggle', className)}>
        {label && <span className="viewpoint-toggle__label">{label}</span>}
        <div
            className={`viewpoint-toggle__switch ${value ? 'viewpoint-toggle__switch--active' : ''}`}
            onClick={() => onChange?.(!value)}
        />
    </label>
);

// ---------------------------------------------------------------------------
// <Image> — Image display
// ---------------------------------------------------------------------------

export const BuiltInImage: React.FC<{
    src?: string;
    alt?: string;
    width?: number | string;
    height?: number | string;
    className?: string;
}> = ({ src, alt, width, height, className }) => (
    <img
        className={cn('viewpoint-image', className)}
        src={src}
        alt={alt || ''}
        width={width}
        height={height}
    />
);

// ---------------------------------------------------------------------------
// <Selector> — Dropdown for reference features
// ---------------------------------------------------------------------------

export const BuiltInSelector: React.FC<{
    feature?: any;
    options?: Array<{ value: string; label: string }>;
    multiple?: boolean;
    onChange?: (v: string) => void;
    className?: string;
}> = ({ feature, options = [], multiple, onChange, className }) => {
    const currentValue = feature?.values?.[0] ?? '';

    const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        if (onChange) {
            onChange(e.target.value);
        } else if (feature?.father && feature?.instanceof?.name) {
            syncFeatureValue(feature.father, feature.instanceof.name, e.target.value);
        }
    }, [feature, onChange]);

    return (
        <select
            className={cn('viewpoint-selector', className)}
            value={String(currentValue)}
            onChange={handleChange}
            multiple={multiple}
        >
            <option value="">-- select --</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
};

// ---------------------------------------------------------------------------
// <SubView> — Renders a sub-element with its own view
// ---------------------------------------------------------------------------

export const BuiltInSubView: React.FC<{
    data?: any;
    viewId?: string;
    className?: string;
    children?: React.ReactNode;
}> = ({ data, viewId, className, children }) => {
    // SubView delegates rendering back to the viewpoint system.
    // In this implementation, we render children as a simple container.
    // Full hierarchical sub-view rendering can be enhanced in future.
    return (
        <div className={cn('viewpoint-subview', className)}>
            {children || (
                <span className="viewpoint-subview__placeholder">
                    {data?.name ?? 'SubView'}
                </span>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Graph components (placeholders for graph-in-node rendering)
// ---------------------------------------------------------------------------

export const BuiltInGraph: React.FC<{ children?: React.ReactNode; className?: string }> =
    ({ children, className }) => (
        <div className={cn('viewpoint-graph', className)}>{children}</div>
    );

export const BuiltInEdge: React.FC<{ data?: any; className?: string }> =
    ({ data, className }) => (
        <div className={cn('viewpoint-edge', className)}>
            {data?.name ?? 'edge'}
        </div>
    );

export const BuiltInVertex: React.FC<{ data?: any; children?: React.ReactNode; className?: string }> =
    ({ data, children, className }) => (
        <div className={cn('viewpoint-vertex', className)}>
            {children || (data?.name ?? 'vertex')}
        </div>
    );

// ---------------------------------------------------------------------------
// Export all as a bundle for injection into compiled views
// ---------------------------------------------------------------------------

export const viewpointBuiltins = {
    View: BuiltInView,
    Field: BuiltInField,
    Input: BuiltInInput,
    Text: BuiltInText,
    SubView: BuiltInSubView,
    Image: BuiltInImage,
    Toggle: BuiltInToggle,
    Selector: BuiltInSelector,
    Graph: BuiltInGraph,
    Edge: BuiltInEdge,
    Vertex: BuiltInVertex,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple className joiner (avoids importing classnames for this small use). */
function cn(...parts: (string | undefined | null | false)[]): string {
    return parts.filter(Boolean).join(' ');
}
