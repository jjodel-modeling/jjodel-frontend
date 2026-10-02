import React, { useCallback, useId, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { LViewPoint } from '../../../../joiner';
import { JjSelect } from '../../../ui';
import { ViewpointType, getViewpointType } from '../../../../view/viewPoint/viewpoint';
import {
    PASTEL_SWATCHES,
    clearMetaclassOverrides,
    metaclassColorTable,
    notationGlyphClasses,
    readMetaclassColoring,
    withMetaclassOverride,
    type MetaclassColorRow,
    type MetaclassColoring,
} from '../../../../view/viewPoint/metaclassPalette';
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

/**
 * One entry of the metaclass dropdown: the class, and the colour it paints under this viewpoint.
 * `glyph`: the viewpoint draws the class only as a notation glyph, which is not coloured (R-VP-50).
 */
interface MetaclassOption { value: string; label: string; color: string; glyph?: boolean }

const toMetaclassOption = (c: MetaclassColorRow['classes'][number], glyph = false): MetaclassOption => ({ value: c.id, label: c.name, color: c.color, glyph });

// The small swatch and the name, for the options and the selected value alike; the name is
// clipped with an ellipsis so the fixed-width control never grows (R-VP-39). A notation glyph
// shows the swatch empty: it is not coloured.
const formatMetaclassOption = (o: MetaclassOption) => (
    <span className="wp-metaclass-option" title={o.glyph ? `${o.label}: notation glyph, not coloured` : o.label}>
        <span className="wp-metaclass-option__swatch" style={o.glyph ? undefined : { background: o.color }} />
        <span className="wp-metaclass-option__name">{o.label}</span>
    </span>
);

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

    // Per-metaclass colours (R-VP-39): the classes of every metamodel of the project with the
    // colour each paints under THIS viewpoint's setting (the edited one, not the active one).
    // Selected as a string so an unrelated store change does not re-render the panel.
    const vpId = dview?.id as string | undefined;
    const tableKey = useSelector((state: any) => {
        const setting = readMetaclassColoring(vpId ? state.idlookup?.[vpId] : undefined);
        if (!setting.enabled) return '[]';
        return JSON.stringify(metaclassColorTable(state.idlookup ?? {}, state.m2models ?? [], setting));
    });
    const table = useMemo(() => JSON.parse(tableKey) as MetaclassColorRow[], [tableKey]);
    // The classes this viewpoint draws only as notation glyphs (R-VP-50): listed, not coloured,
    // no swatch picker. Selected as a string too.
    const glyphKey = useSelector((state: any) => JSON.stringify(notationGlyphClasses(state, vpId)));
    const glyphIds = useMemo(() => new Set(JSON.parse(glyphKey) as string[]), [glyphKey]);
    const toOption = (c: MetaclassColorRow['classes'][number]) => toMetaclassOption(c, glyphIds.has(c.id));
    const [pickedId, setPickedId] = useState<string | null>(null);
    const allClasses = table.flatMap((r) => r.classes);
    const selected = allClasses.find((c) => c.id === pickedId) ?? allClasses[0] ?? null;
    const selectedGlyph = !!selected && glyphIds.has(selected.id);
    const metaclassOptions = table.length > 1
        ? table.map((r) => ({ label: r.modelName, options: r.classes.map(toOption) }))
        : (table[0]?.classes ?? []).map(toOption);

    // One write each, whole, through the same default setter: «Reset» removes the override of
    // the selected class, «Reset all» every override; the automatic colour comes back.
    const writeOverride = useCallback((classId: string, color: string | null) => {
        if (readOnly) return;
        (viewpoint as any).metaclassColoring = withMetaclassOverride(readMetaclassColoring(viewpoint.__raw as any), classId, color);
    }, [viewpoint, readOnly]);
    const resetAllOverrides = useCallback(() => {
        if (readOnly) return;
        (viewpoint as any).metaclassColoring = clearMetaclassOverrides(readMetaclassColoring(viewpoint.__raw as any));
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

                    <div className="wp-field">
                        <label className="wp-field__label" id={`${colorId}-metaclass`}>Metaclass color</label>
                        <div className="wp-metaclass-row">
                            <JjSelect<MetaclassOption>
                                className="jj-select wp-metaclass-select"
                                aria-labelledby={`${colorId}-metaclass`}
                                options={metaclassOptions as any}
                                value={selected ? toOption(selected) : null}
                                formatOptionLabel={formatMetaclassOption}
                                onChange={(o: any) => setPickedId(o ? o.value : null)}
                                placeholder="No metaclasses"
                                isDisabled={readOnly || !selected}
                            />
                            {!selectedGlyph && <div className="wp-swatch-grid" role="radiogroup" aria-labelledby={`${colorId}-metaclass`}>
                                {PASTEL_SWATCHES.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected?.color === c}
                                        aria-label={c}
                                        title={c}
                                        className={`wp-swatch${selected?.color === c ? ' wp-swatch--current' : ''}`}
                                        style={{ background: c }}
                                        onClick={() => selected && writeOverride(selected.id, c)}
                                        disabled={readOnly || !selected}
                                    />
                                ))}
                            </div>}
                        </div>
                        {selectedGlyph && <p className="wp-field__hint">Not coloured: notation glyph.</p>}
                        <div className="wp-metaclass-resets">
                            <button
                                type="button"
                                className="wp-text-button"
                                onClick={() => selected && writeOverride(selected.id, null)}
                                disabled={readOnly || !selected?.overridden}
                            >
                                Reset
                            </button>
                            <button
                                type="button"
                                className="wp-text-button"
                                onClick={resetAllOverrides}
                                disabled={readOnly || !coloring.overrides}
                            >
                                Reset all
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ViewpointProperties;
