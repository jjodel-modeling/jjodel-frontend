import React, { useCallback } from 'react';
import { LViewPoint } from '../../../../joiner';
import { ViewpointType, getViewpointType } from '../../../../view/viewPoint/viewpoint';
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
        </div>
    );
};

export default ViewpointProperties;
