import React, { useCallback } from 'react';
import { LViewPoint } from '../../../../joiner';
import { ViewpointType, getViewpointType } from '../../../../view/viewPoint/viewpoint';

interface ViewpointPropertiesProps {
    viewpoint: LViewPoint;
    readOnly: boolean;
}

const typeOptions: { value: ViewpointType; label: string }[] = [
    { value: 'syntax', label: 'Syntax' },
    { value: 'decoration', label: 'Decoration' },
    { value: 'validation', label: 'Validation' },
    { value: 'semantics', label: 'Semantics' },
    { value: 'editor_behavior', label: 'Editor behavior' },
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
                <div className="wp-type-select">
                    {typeOptions.map(opt => (
                        <div
                            key={opt.value}
                            className={`wp-type-select__option ${currentType === opt.value ? 'wp-type-select__option--selected' : ''}`}
                            onClick={() => handleTypeChange(opt.value)}
                        >
                            <span className="wp-type-select__dot" />
                            {opt.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ViewpointProperties;
