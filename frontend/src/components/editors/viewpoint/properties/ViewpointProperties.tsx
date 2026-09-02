import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { LViewPoint } from '../../../../joiner';
import { ViewpointType, getViewpointType } from '../../../../view/viewPoint/viewpoint';
import { FORM_THEME_DEFAULT_NAME, FORM_THEME_NAMES, type FormThemeName } from '../../../../jjform';
// Self-import the stylesheet so .wp-type-segmented + .wp-field + .workbench-properties
// render correctly even when this component is mounted outside WorkbenchProperties
// (e.g., directly from Info.tsx's view-branch).
import './properties.scss';

interface ViewpointPropertiesProps {
    viewpoint: LViewPoint;
    readOnly: boolean;
}

/** The «no opinion» entry of the Form Theme select.
 *
 *  A named sentinel and not `''`, so that what the select shows and what the D field
 *  holds stay two different things: the field's contract is «one of the four preset
 *  names, or absent», and the sentinel is mapped back to `undefined` on write so no
 *  fifth literal ever reaches it. */
const FORM_THEME_INHERIT = '__inherit__';

const typeOptions: { value: ViewpointType; label: string }[] = [
    { value: 'syntax', label: 'Syntax' },
    { value: 'decoration', label: 'Decoration' },
    { value: 'validation', label: 'Validation' },
    { value: 'semantics', label: 'Semantics' },
    { value: 'editor_behavior', label: 'Editor' },
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

    /**
     * The viewpoint rung of the form theme (slice STYLE2).
     *
     * Written exactly as `viewpointType` above is written — a bare assignment on the
     * L-proxy, which routes to a `SetFieldAction` on the D element. `undefined` restores
     * «no opinion», which is the rendering committed before the field existed.
     *
     * This panel and not the Style tab, which is where the STYLE2 prompt (citing STYLE1's
     * reperto 2) expected it: measured here, `<ViewData>` — the component that owns the
     * Style tab — is mounted in ONE place, `Info.tsx:1394`, and that place is the `else`
     * branch of `isVP`. A viewpoint selected in the tree renders THIS component instead,
     * so a select added to `PaletteData` would have been unreachable code. `ViewData`
     * does carry a viewpoint branch internally (`ViewData.tsx:53`), which is what the
     * reperto read; nothing routes a viewpoint into it.
     */
    const currentFormTheme = ((viewpoint as any).formTheme as FormThemeName | undefined) ?? null;
    const handleFormThemeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        if (readOnly) return;
        const v = e.target.value;
        (viewpoint as any).formTheme = v === FORM_THEME_INHERIT ? undefined : (v as FormThemeName);
    }, [viewpoint, readOnly]);

    /**
     * The «applies once this viewpoint is active» hint (slice UX1).
     *
     * The select above writes the viewpoint SELECTED in the tree; `IRForm` reads the rung
     * off the viewpoint ACTIVE in the session (`IRForm.tsx:199`). They are the same object
     * most of the time, and different exactly when somebody inspects a viewpoint without
     * activating it — where the write lands correctly and nothing on screen moves. STYLE2's
     * referto §8 left that case open and named the cure: an affordance in the panel, not a
     * change of source.
     *
     * The SAME source `IRForm` reads, and not a second derivation of «active»: a panel that
     * decided it from `LProject.viewpoints`, or from the tree selection, could disagree with
     * the form it is describing, and the hint would then be wrong precisely in the case it
     * exists for.
     *
     * Text only. The select stays enabled and keeps writing in BOTH cases: the write is
     * legitimate — the theme belongs to the viewpoint, not to the session — and a disabled
     * control would make a correct action unavailable. No viewpoint active at all is the
     * divergent case too: the choice is stored and waits.
     */
    const activeViewpointId = useSelector((state: any) => state?.viewpoint) as string | undefined;
    const isActiveViewpoint = !!activeViewpointId && activeViewpointId === viewpoint.id;

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
                            disabled={readOnly}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="wp-field">
                <label className="wp-field__label">Form theme</label>
                <select
                    className="wp-field__select"
                    value={currentFormTheme ?? FORM_THEME_INHERIT}
                    onChange={handleFormThemeChange}
                    disabled={readOnly}
                    title="Preset applied to the property forms of this viewpoint: label placement, density and section chrome. A view that declares its own theme overrides it."
                >
                    <option value={FORM_THEME_INHERIT}>Default ({FORM_THEME_DEFAULT_NAME})</option>
                    {FORM_THEME_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                {!isActiveViewpoint && (
                    <p className="wp-field__hint">Applies when this viewpoint is active.</p>
                )}
            </div>
        </div>
    );
};

export default ViewpointProperties;
