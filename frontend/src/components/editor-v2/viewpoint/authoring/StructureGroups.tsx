import React from 'react';
import { ColorPicker, FormSection, HelpText, SegmentedControl, Select, Toggle, PRESERVED_CHIP } from '../../../ui';
import {
    accentPlacementReason,
    compartmentModeReason,
    hiddenFieldNotes,
    namePositionReason,
    structureCapabilities,
    type StructureCapabilities,
} from '../ir/structureCapabilities';
import type {
    AccentPlacement,
    CompartmentColumns,
    CompartmentMode,
    EmptyBehavior,
    NamePosition,
    NameTypeDisplay,
    ShapeForm,
    StructureSpec,
} from '../ir/irTypes';
import './StructureGroups.scss';

/**
 * StructureGroups - the three level-2 groups of the Structure tab: Name, Accent,
 * Compartment.
 *
 * Design handoff: `Instance Node Proposal.dc.html`, Turno 7a and 7b.
 *
 * They sit ABOVE the existing `Field compartments` section, which the panel keeps
 * rendering unchanged - except that 7b hides it outright on a Symbol with no
 * compartment, and declares the absence in the summary row. That is why
 * `showsFieldCompartments` is read by the panel and not here.
 *
 * Purely presentational, like `FormAuthoringBody`: no effect, no subscription. Both
 * mounts of `VertexAuthoringPanel` keep every tab body mounted, so an effect here
 * would also run inside the symbol editor modal where this tab is unreachable.
 */

/** The neutral accent, as the design writes it. The literal value of
 *  `--color-inode-accent-neutral`, spelled out because the IR stores a colour and a
 *  `ColorPicker` needs a hex, not a token reference. */
export const DEFAULT_ACCENT = '#cbd5e1';

export const DEFAULT_TYPE_DISPLAY: NameTypeDisplay = 'inline';
export const DEFAULT_COLUMNS: CompartmentColumns = 2;
export const DEFAULT_EMPTY_BEHAVIOR: EmptyBehavior = 'dash';
export const DEFAULT_EDGE_MARKER = true;

const NAME_POSITION_LABEL: Record<NamePosition, string> = {
    'header-band': 'Header band',
    center: 'Center',
    below: 'Below',
    external: 'External',
};

const TYPE_DISPLAY_LABEL: Record<NameTypeDisplay, string> = {
    inline: 'Inline',
    chip: 'Chip',
    badge: 'Badge',
    hidden: 'Hidden',
};

const ACCENT_LABEL: Record<AccentPlacement, string> = {
    none: 'None',
    top: 'Top',
    left: 'Left',
    ring: 'Ring',
};

const MODE_LABEL: Record<CompartmentMode, string> = {
    inline: 'Inline',
    popover: 'Popover',
    none: 'None',
};

const EMPTY_LABEL: Record<EmptyBehavior, string> = {
    dash: 'Dash',
    collapse: 'Collapse',
    hide: 'Hide',
};

// --- pure helpers (exported for the unit tests) --------------------------------------

/** Every leaf of `StructureSpec`, addressed the way the field table spells it. */
export type StructureLeaf =
    | 'name.position'
    | 'name.typeDisplay'
    | 'accentPlacement'
    | 'accent'
    | 'compartment.mode'
    | 'compartment.columns'
    | 'emptyBehavior'
    | 'edgeMarker';

/**
 * A `StructureSpec` with nothing left in it is `undefined`, never `{}` - and a `name`
 * or `compartment` group with nothing left in it disappears rather than staying as an
 * empty object.
 *
 * Same reason `pruneForm` gives: the saved IR has no VersionFixer (R-B9), so a `{}`
 * left behind by an author who tried a field and put it back would stay in the file
 * for good. Every default in this slice is removal of the key, so this runs on every
 * write.
 */
export function pruneStructure(next: StructureSpec): StructureSpec | undefined {
    const out: StructureSpec = { ...next };
    if (out.name && Object.keys(out.name).length === 0) delete out.name;
    if (out.compartment && Object.keys(out.compartment).length === 0) delete out.compartment;
    return Object.keys(out).length === 0 ? undefined : out;
}

/**
 * Set or clear one leaf. `undefined` REMOVES the key rather than writing it undefined:
 * the round-trip of a view whose field was set and put back must be byte-identical to
 * one where it was never set. Same idiom as `withFormKey` and `withChildFilter`.
 */
export function withStructure(
    structure: StructureSpec | undefined,
    leaf: StructureLeaf,
    value: string | number | boolean | undefined,
): StructureSpec | undefined {
    const next: StructureSpec = { ...structure };

    if (leaf === 'name.position' || leaf === 'name.typeDisplay') {
        const group = { ...next.name };
        const key = leaf === 'name.position' ? 'position' : 'typeDisplay';
        if (value === undefined) delete (group as Record<string, unknown>)[key];
        else (group as Record<string, unknown>)[key] = value;
        next.name = group;
    } else if (leaf === 'compartment.mode' || leaf === 'compartment.columns') {
        const group = { ...next.compartment };
        const key = leaf === 'compartment.mode' ? 'mode' : 'columns';
        if (value === undefined) delete (group as Record<string, unknown>)[key];
        else (group as Record<string, unknown>)[key] = value;
        next.compartment = group;
    } else if (value === undefined) {
        delete (next as Record<string, unknown>)[leaf];
    } else {
        (next as Record<string, unknown>)[leaf] = value;
    }

    return pruneStructure(next);
}

export interface ResolvedStructure {
    namePosition: NamePosition;
    typeDisplay: NameTypeDisplay;
    accentPlacement: AccentPlacement;
    accent: string;
    mode: CompartmentMode;
    columns: CompartmentColumns;
    emptyBehavior: EmptyBehavior;
    edgeMarker: boolean;
    /**
     * Values the IR still holds that this Symbol no longer offers. The render falls
     * back to an offered value and the IR is NOT rewritten - the same discipline the
     * `double` border width follows: nothing is silently repaired, the panel says it
     * instead. Changing the Symbol back restores the authored value untouched.
     */
    preserved: Partial<Record<'name.position' | 'accentPlacement' | 'compartment.mode', string>>;
}

/** Resolve the authored values against what this Symbol offers. */
export function resolveStructure(
    structure: StructureSpec | undefined,
    caps: StructureCapabilities,
): ResolvedStructure {
    const preserved: ResolvedStructure['preserved'] = {};

    const authoredPosition = structure?.name?.position;
    const positionOffered = authoredPosition !== undefined && caps.namePositions.includes(authoredPosition);
    if (authoredPosition !== undefined && !positionOffered) preserved['name.position'] = authoredPosition;

    const authoredAccent = structure?.accentPlacement;
    const accentOffered = authoredAccent !== undefined && caps.accentPlacements.includes(authoredAccent);
    if (authoredAccent !== undefined && !accentOffered) preserved.accentPlacement = authoredAccent;

    const authoredMode = structure?.compartment?.mode;
    const modeOffered = authoredMode !== undefined && caps.compartmentModes.includes(authoredMode);
    if (authoredMode !== undefined && !modeOffered) preserved['compartment.mode'] = authoredMode;

    return {
        namePosition: positionOffered ? authoredPosition! : caps.defaultNamePosition,
        typeDisplay: structure?.name?.typeDisplay ?? DEFAULT_TYPE_DISPLAY,
        accentPlacement: accentOffered ? authoredAccent! : caps.defaultAccentPlacement,
        accent: structure?.accent ?? DEFAULT_ACCENT,
        mode: modeOffered ? authoredMode! : caps.defaultCompartmentMode,
        columns: structure?.compartment?.columns ?? DEFAULT_COLUMNS,
        emptyBehavior: structure?.emptyBehavior ?? DEFAULT_EMPTY_BEHAVIOR,
        edgeMarker: structure?.edgeMarker ?? DEFAULT_EDGE_MARKER,
        preserved,
    };
}

// --- component ----------------------------------------------------------------------

export interface StructureGroupsProps {
    structure: StructureSpec | undefined;
    /** Resolved scalar Symbol. `undefined` for a Conditional form - see
     *  `structureCapabilities`, which then offers the rectangle's superset. */
    form: ShapeForm | undefined;
    /**
     * The single metaclass this view applies to, when there is exactly one. Drives the
     * one contextual note of 7b under Type ("Every node in this viewpoint is a State"):
     * with one metaclass in the whole viewpoint, the type on the node repeats what the
     * diagram already says. Null for a wildcard or a multi-metaclass view.
     */
    singleMetaclass?: string | null;
    onChange: (next: StructureSpec | undefined) => void;
}

/** One label-left / control-right row, the anatomy of every row in 7a. */
const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="ir-structure-group__row">
        <span className="ir-structure-group__label">{label}</span>
        <span className="ir-structure-group__control">{children}</span>
    </div>
);

export const StructureGroups: React.FC<StructureGroupsProps> = ({
    structure, form, singleMetaclass, onChange,
}) => {
    const caps = structureCapabilities(form);
    const r = resolveStructure(structure, caps);

    /** Write a leaf, removing the key when the value is the Symbol's own default. */
    const set = (leaf: StructureLeaf, value: string | number | boolean, isDefault: boolean) =>
        onChange(withStructure(structure, leaf, isDefault ? undefined : value));

    const positionReason = namePositionReason(caps);
    const accentReason = accentPlacementReason(caps);
    const modeReason = compartmentModeReason(caps);

    return (
        <>
            <FormSection title="Name" divider={false}>
                <Row label="Position">
                    {/* The shared Select always renders a placeholder option with an empty
                        value, so the placeholder has to BE the default and an empty pick has
                        to resolve to it — the Padding idiom of this panel (nota Select
                        condiviso, 2026-08-08). A closed vocabulary never persists ''. */}
                    <Select
                        size="sm"
                        options={caps.namePositions.map(p => ({ value: p, label: NAME_POSITION_LABEL[p] }))}
                        placeholder={NAME_POSITION_LABEL[caps.defaultNamePosition]}
                        value={r.namePosition}
                        onChange={(e) => {
                            const v = e.target.value as NamePosition | '';
                            set('name.position', v === '' ? caps.defaultNamePosition : v,
                                v === '' || v === caps.defaultNamePosition);
                        }}
                    />
                </Row>
                {/* The reason line belongs to the fields whose AVAILABILITY depends on the
                    Symbol, and only to those: Position has one, Empty slots does not,
                    because Empty slots applies to every shape (7a). */}
                {positionReason && <HelpText>{positionReason}</HelpText>}
                {r.preserved['name.position'] && (
                    <div className="ir-structure-group__preserved">
                        <span style={PRESERVED_CHIP}>
                            {`kept in the view: ${NAME_POSITION_LABEL[r.preserved['name.position'] as NamePosition]}`}
                        </span>
                    </div>
                )}

                <Row label="Type">
                    <SegmentedControl<NameTypeDisplay>
                        ariaLabel="How the metaclass is shown next to the name"
                        value={r.typeDisplay}
                        options={(Object.keys(TYPE_DISPLAY_LABEL) as NameTypeDisplay[])
                            .map(v => ({ value: v, label: TYPE_DISPLAY_LABEL[v] }))}
                        onChange={(v) => set('name.typeDisplay', v, v === DEFAULT_TYPE_DISPLAY)}
                    />
                </Row>
                {singleMetaclass && (
                    <HelpText>
                        {'Every node in this viewpoint is a '}
                        <code>{singleMetaclass}</code>
                    </HelpText>
                )}
            </FormSection>

            <FormSection title="Accent" divider={false}>
                <Row label="Placement">
                    <SegmentedControl<AccentPlacement>
                        ariaLabel="Where the categorical accent is drawn"
                        value={r.accentPlacement}
                        options={caps.accentPlacements.map(v => ({ value: v, label: ACCENT_LABEL[v] }))}
                        onChange={(v) => set('accentPlacement', v, v === caps.defaultAccentPlacement)}
                    />
                </Row>
                {accentReason && <HelpText>{accentReason}</HelpText>}
                {r.preserved.accentPlacement && (
                    <div className="ir-structure-group__preserved">
                        <span style={PRESERVED_CHIP}>
                            {`kept in the view: ${ACCENT_LABEL[r.preserved.accentPlacement as AccentPlacement]}`}
                        </span>
                    </div>
                )}

                <Row label="Color">
                    <ColorPicker
                        value={r.accent}
                        onChange={(hex) => set('accent', hex, hex === DEFAULT_ACCENT)}
                    />
                </Row>
                <HelpText>Inherited from the metaclass · override per instance</HelpText>
            </FormSection>

            <FormSection title="Compartment" divider={false}>
                <Row label="Mode">
                    <SegmentedControl<CompartmentMode>
                        ariaLabel="How the compartment is presented"
                        value={r.mode}
                        options={caps.compartmentModes.map(v => ({ value: v, label: MODE_LABEL[v] }))}
                        onChange={(v) => set('compartment.mode', v, v === caps.defaultCompartmentMode)}
                    />
                </Row>
                {modeReason && <HelpText>{modeReason}</HelpText>}
                {r.preserved['compartment.mode'] && (
                    <div className="ir-structure-group__preserved">
                        <span style={PRESERVED_CHIP}>
                            {`kept in the view: ${MODE_LABEL[r.preserved['compartment.mode'] as CompartmentMode]}`}
                        </span>
                    </div>
                )}

                {/* The three fields the choice makes inert. Absent, not disabled - and
                    named in the summary row at the foot of the tab, so the absence is
                    never silent (7b). */}
                {r.mode !== 'none' && (
                    <>
                        <Row label="Columns">
                            <SegmentedControl<string>
                                ariaLabel="Columns of the compartment rows"
                                value={String(r.columns)}
                                options={[{ value: '2', label: '2' }, { value: '3', label: '3' }]}
                                onChange={(v) => {
                                    const n = Number(v) as CompartmentColumns;
                                    set('compartment.columns', n, n === DEFAULT_COLUMNS);
                                }}
                            />
                        </Row>
                        <Row label="Empty slots">
                            <SegmentedControl<EmptyBehavior>
                                ariaLabel="What an unset slot does"
                                value={r.emptyBehavior}
                                options={(Object.keys(EMPTY_LABEL) as EmptyBehavior[])
                                    .map(v => ({ value: v, label: EMPTY_LABEL[v] }))}
                                onChange={(v) => set('emptyBehavior', v, v === DEFAULT_EMPTY_BEHAVIOR)}
                            />
                        </Row>
                        <Row label="Edge marker">
                            <Toggle
                                checked={r.edgeMarker}
                                onChange={(checked) => set('edgeMarker', checked, checked === DEFAULT_EDGE_MARKER)}
                            />
                        </Row>
                    </>
                )}
            </FormSection>
        </>
    );
};

export interface StructureHiddenSummaryProps {
    form: ShapeForm | undefined;
    structure: StructureSpec | undefined;
}

/**
 * The single `bi-eye-slash` row at the foot of the tab (7b).
 *
 * It goes AFTER `Field compartments`, because it is the summary of the whole tab and
 * one of the things it reports is that `Field compartments` itself is not there.
 * Renders nothing when nothing is hidden, which is 7a.
 */
export const StructureHiddenSummary: React.FC<StructureHiddenSummaryProps> = ({ form, structure }) => {
    const caps = structureCapabilities(form);
    const notes = hiddenFieldNotes(caps, resolveStructure(structure, caps).mode);
    if (notes.length === 0) return null;

    return (
        <div className="ir-structure-group__hidden">
            <i className="bi bi-eye-slash" />
            <span>
                {'Not shown — '}
                {notes.map((n, i) => (
                    <React.Fragment key={n.cause}>
                        {i > 0 ? ' · ' : ''}
                        <span className="ir-structure-group__hidden-fields">{n.fields.join(', ')}</span>
                        {` (${n.cause})`}
                    </React.Fragment>
                ))}
            </span>
        </div>
    );
};
