import React, { useCallback, useId } from 'react';
import { LViewPoint } from '../../../../joiner';
import { ViewpointType, getViewpointType } from '../../../../view/viewPoint/viewpoint';
import { readMetaclassColoring, type MetaclassColoring } from '../../../../view/viewPoint/metaclassPalette';
// Self-import the stylesheet so .wp-type-segmented + .wp-field + .workbench-properties
// render correctly even when this component is mounted outside WorkbenchProperties
// (e.g., directly from Info.tsx's view-branch).
import './properties.scss';

interface ViewpointPropertiesProps {
    viewpoint: LViewPoint;
    readOnly: boolean;
}

const typeOptions: { value: ViewpointType; label: string; enabled: boolean; reason?: string }[] = [
    { value: 'syntax', label: 'Syntax', enabled: true },
    { value: 'decoration', label: 'Decoration', enabled: false, reason: 'Overlay viewpoints are not created from this panel.' },
    { value: 'validation', label: 'Validation', enabled: false, reason: 'Validation viewpoints are created in the validation authoring environment.' },
    { value: 'semantics', label: 'Semantics', enabled: false, reason: 'Not available yet.' },
    { value: 'editor_behavior', label: 'Editor', enabled: false, reason: 'Not available yet.' },
];

const ViewpointProperties: React.FC<ViewpointPropertiesProps> = ({ viewpoint, readOnly }) => {
    const dview = viewpoint.__raw;
    const currentType = getViewpointType(dview);

    const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!readOnly) {
            viewpoint.name = e.target.value;
        }
    }, [viewpoint, readOnly]);

    const handleTypeChange = useCallback((newType: ViewpointType) => {
        if (readOnly) return;
        // Set the explicit viewpointType field
        (viewpoint as any).viewpointType = newType;
        // Sync legacy booleans for backward compat
        viewpoint.isExclusiveView = (newType === 'syntax');
        (viewpoint as any).isValidation = (newType === 'validation');
    }, [viewpoint, readOnly]);

    // «Color by metaclass» (R-VP-27, R-VP-28). Absent reads as off with the defaults; the field
    // is written WHOLE through the L proxy, as Name is, because the default setter replaces it:
    // turning it off writes `enabled: false` and keeps the base colour and the border.
    const coloring = readMetaclassColoring(dview as any);
    const colorId = useId();
    const writeColoring = useCallback((patch: Partial<MetaclassColoring>) => {
        if (readOnly) return;
        (viewpoint as any).metaclassColoring = { ...readMetaclassColoring(viewpoint.__raw as any), ...patch };
    }, [viewpoint, readOnly]);

    return (
        <div className="workbench-properties">
            <h4 className="workbench-properties__section-header">Viewpoint</h4>

            <div className="wp-field">
                <label className="wp-field__label">Name</label>
                <input
                    className="wp-field__input"
                    value={viewpoint.name || ''}
                    onChange={handleNameChange}
                    disabled={readOnly}
                />
            </div>

            <div className="wp-field">
                <label className="wp-field__label">Type</label>
                <div className="wp-type-segmented">
                    {typeOptions.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`wp-type-segmented__option ${currentType === opt.value ? 'wp-type-segmented__option--selected' : ''}`}
                            onClick={() => handleTypeChange(opt.value)}
                            disabled={readOnly || !opt.enabled}
                            title={opt.reason}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <p className="wp-field__hint">Only Syntax can be chosen here.</p>
            </div>

            <div className="wp-toggle">
                <span className="wp-toggle__label" id={`${colorId}-toggle`}>Color by metaclass</span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={coloring.enabled}
                    aria-labelledby={`${colorId}-toggle`}
                    className={`wp-switch${coloring.enabled ? ' wp-switch--active' : ''}`}
                    onClick={() => writeColoring({ enabled: !coloring.enabled })}
                    disabled={readOnly}
                />
            </div>

            {coloring.enabled && (
                <>
                    <div className="wp-field">
                        <label className="wp-field__label" htmlFor={`${colorId}-base`}>Base color</label>
                        <div className="wp-field__color-row">
                            <input
                                id={`${colorId}-base`}
                                type="color"
                                className="wp-field__color"
                                value={coloring.baseColor}
                                onChange={(e) => writeColoring({ baseColor: e.target.value })}
                                disabled={readOnly}
                            />
                            <span className="wp-field__color-hex">{coloring.baseColor}</span>
                        </div>
                    </div>

                    <label className="wp-toggle">
                        <span className="wp-toggle__label">Border</span>
                        <input
                            type="checkbox"
                            checked={coloring.border}
                            onChange={(e) => writeColoring({ border: e.target.checked })}
                            disabled={readOnly}
                        />
                    </label>
                </>
            )}
        </div>
    );
};

export default ViewpointProperties;
