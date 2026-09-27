/**
 * SimRolesModal — the «Simulation roles» dialog of the M2 face (R-SIM-55; S11b,
 * S11c; P-2026-09-27-1740, docs/discovery/discovery_2026-09-27_sim_modal.md).
 *
 * «Configure…» of the simulation panel opens it; it replaces the inline groups
 * of R-SIM-37 (R-SIM-79's declared deviation closes here). The dialog is a
 * draft over the M2 bag (simRolesDraft.ts): the preset picked, the rows
 * changed, the declarations as edited, the binder's proposals kept or
 * withdrawn. Apply writes it in one `state` assignment, one undo step (D3);
 * Cancel, the close button and Escape discard it. Nothing is written before
 * Apply.
 *
 * The sections say what the code says (report §5): Required is
 * `requiredRoles` (R-SIM-48), a role another active role depends on is «Needed
 * by» it, Bound is a parameter (R-SIM-49) whose helper quotes the engine's own
 * reason (R-SIM-81(1) as amended). A bag with no role key and no profile opens
 * on the model kind picker (4a, D10).
 *
 * Portaled onto `document.body` from the panel, which holds every input it
 * reads (D4), at the stacking level of the other modals
 * (SymbolEditorModal.scss). React events bubble through the React tree, not
 * the DOM, so the dialog stops keyboard and pointer events at its root: the
 * editor's own onKeyDown (Backspace deletes the selection, EditorV2.tsx) would
 * otherwise receive them.
 */

import { ReactElement, SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { DState, LPointerTargetable, store } from '../../../joiner';
import {
    PANEL_PROFILE_IDS, boundProposalBag, boundProposalInputs, invalidEngineRoles, storedProfile,
} from './simRoleStatus';
import { boundEstimate, boundEstimateSignature } from './modelMarkings';
import {
    bagWithEdits, boundHelp, draftApply, draftBag, draftPatch, draftProposals, draftStatus, isFirstOpen, matchLine, roleBadge,
    roleSections, rowValue,
} from './simRolesDraft';
import type { DraftEdits, DraftInput, RoleBadge } from './simRolesDraft';
import { bindProfile } from '../../../model/simulation/profileBinder';
import { roleDescriptor } from '../../../model/simulation/roleCatalog';
import { systemProfile, validateProfile } from '../../../model/simulation/simProfiles';
import { encodeStateAttributes, stateAttributeRows } from '../../../model/simulation/stateAttributesCodec';
import type { MetamodelSketch, ProfileBindings } from '../../../model/simulation/profileBinder';
import type { RoleId } from '../../../model/simulation/roleCatalog';
import type { ProfileShape, SimProfile, SystemProfileId } from '../../../model/simulation/simProfiles';
import type { StateAttributeRecord } from '../../../model/simulation/stateAttributesCodec';
import type { RoleOverlap } from '../../../model/simulation/stcFromRoles';
import './SimRolesModal.scss';

/** An option of a role select: a class or a feature, `Class.feature` for a feature. */
export interface SimRoleOption { id: string; name: string }

/** The option lists the panel reads from the metamodel (`collectMetaOptions`, SimulationPanel.tsx). */
export interface SimRoleOptions {
    classes: SimRoleOption[]; compositions: SimRoleOption[]; references: SimRoleOption[]; attributes: SimRoleOption[];
    expressionAttributes: SimRoleOption[]; actionAttributes: SimRoleOption[]; allClasses: SimRoleOption[];
}

export interface SimRolesModalProps {
    /** The metamodel whose bag holds the roles. */
    configModelId: string;
    /** The catalog keys set in the raw bag, and `simProfile` (the panel's `profileBagSig`). */
    bag: Record<string, unknown>;
    sketch: MetamodelSketch | null;
    options: SimRoleOptions;
    /** The raw `simStateAttributes`, `null` when unset. */
    stateAttributesRaw: string | null;
    /** The derived event class (R-SIM-38), '' without one. */
    eventClassName: string;
    /** The preset picked in the panel's select and not applied, `null` for the stored profile. */
    initialPreset: string | null;
    /** Open on the Data section with its Add attribute focused (the summary's declarations hint, R-SIM-81(3)). */
    openOnData: boolean;
    /** The panel's reason for an overlap (R-SIM-16). */
    describeOverlap: (overlap: RoleOverlap) => string;
    /** A class or feature by id, as the panel names it. */
    nameOf: (id: string) => string;
    onClose: () => void;
    /** After a write: the overlap warning, if any, for the panel's line. */
    onApplied: (warning: string | null) => void;
}

/** The two model kinds of the first open (4a), with the presets of each (engine names, D7). */
const KINDS: ReadonlyArray<{ shape: ProfileShape; title: string; icon: string; description: string; presets: SystemProfileId[] }> = [
    {
        shape: 'controlFlow', title: 'Control flow', icon: 'bi-diagram-2',
        description: 'States or activities, transitions, guards, fork and join.',
        presets: ['stateMachine', 'extendedStateMachine', 'flowchart'],
    },
    { shape: 'petri', title: 'Petri net', icon: 'bi-bezier2', description: 'Tokens on places, weighted arcs.', presets: ['petri'] },
];

const SHAPE_LABEL: Record<ProfileShape, { icon: string; label: string }> = {
    controlFlow: { icon: 'bi-diagram-2', label: 'Control flow' },
    petri: { icon: 'bi-bezier2', label: 'Petri net' },
};

const label = (r: RoleId) => roleDescriptor(r).label;

/** The kind badge's text and title (the design's Role Kind Badge). */
const BADGE: Record<RoleBadge, { text: string; title: string }> = {
    class: { text: 'Class', title: 'Class: binds a metaclass' },
    ref: { text: 'Ref', title: 'Reference: binds a reference of a metaclass' },
    attr: { text: 'Attr', title: 'Attribute: binds an attribute of a metaclass' },
    value: { text: 'Value', title: 'Value: a number set here' },
};

/** The select placeholder of a role, the panel's wording (simRoleStatus.ts ROLE_SPECS). */
function placeholderOf(role: RoleId): string {
    if (role === 'eventIdentifier') return 'name (default)';
    if (role === 'ownedTransitions') return 'Select a composition';
    const kind = roleDescriptor(role).kind;
    if (kind === 'class') return 'Select a metaclass';
    if (kind === 'reference') return 'Select a reference';
    return 'Select an attribute';
}

/** The list of a role's select, as the panel's selects listed them (`selectOptions`, before the modal). */
function listOf(role: RoleId, shape: ProfileShape, options: SimRoleOptions): SimRoleOption[] {
    const kind = roleDescriptor(role).kind;
    // Node and Transition may be abstract in control flow (R-SIM-81): the engine matches their instances by kind.
    if ((role === 'node' || role === 'transition') && shape === 'controlFlow') return options.allClasses;
    if (kind === 'class') return options.classes;
    if (role === 'ownedTransitions') return options.compositions;
    if (kind === 'reference') return options.references;
    if (kind === 'expressionAttribute') return options.expressionAttributes;
    if (kind === 'actionListAttribute') return options.actionAttributes;
    return options.attributes;
}

/** Stops a React event at the dialog: the portal still bubbles through the editor's React tree. */
const stop = (e: SyntheticEvent) => e.stopPropagation();

// ---------------------------------------------------------------------------
// The declarations (R-SIM-19, R-SIM-67, R-SIM-76), in the draft
// ---------------------------------------------------------------------------

type DeclField = 'name' | 'metaclass' | 'initial' | 'space' | 'kind' | 'min' | 'max' | 'literals' | 'form' | 'equation';

/** The first name `x1`, `x2`, … no row uses: a new declaration is never nameless. */
function freshName(rows: readonly StateAttributeRecord[]): string {
    for (let n = 1; ; n++) if (!rows.some(r => r.name === `x${n}`)) return `x${n}`;
}

/** One cell typed into its row (the rules of the panel's table, lane C1 and C2). */
function patchOf(row: StateAttributeRecord, field: DeclField, typed: string): Partial<StateAttributeRecord> | null {
    switch (field) {
        case 'name': return { name: typed.trim() };
        case 'initial': return { initial: typed.trim() };
        case 'equation': return { equation: typed.trim() };
        // A derived row has no initial (R-SIM-72); back to stored, the equation goes.
        case 'form': return typed === 'derived' ? { initial: '', equation: row.equation ?? '' } : { equation: undefined };
        case 'metaclass': return { metaclass: typed === '' ? null : typed };
        // Presentation has no domain (R-SIM-18); back to semantic, a domain is needed.
        case 'space': return typed === 'presentation' ? { space: 'presentation', domain: null } : { space: 'semantic', domain: row.domain ?? { kind: 'boolean' } };
        case 'kind':
            return {
                domain: typed === 'range' ? { kind: 'range', min: 0, max: 1 }
                    : typed === 'enum' ? { kind: 'enum', literals: [] } : { kind: 'boolean' },
            };
        case 'literals': return { domain: { kind: 'enum', literals: typed.split(',').map(x => x.trim()).filter(x => x !== '') } };
        case 'min':
        case 'max': {
            const n = Number(typed);
            if (typed.trim() === '' || !Number.isFinite(n) || row.domain?.kind !== 'range') return null;
            return { domain: { kind: 'range', min: field === 'min' ? n : row.domain.min, max: field === 'max' ? n : row.domain.max } };
        }
    }
}

interface DeclarationsProps {
    rows: StateAttributeRecord[];
    classes: SimRoleOption[];
    onChange: (rows: StateAttributeRecord[]) => void;
    /** The row whose name takes the focus after Add attribute. */
    focusRow: number | null;
    onFocused: () => void;
}

/**
 * The declarations as rows of two fixed lines (D9): name, metaclass, stored or
 * derived, remove; space, domain, its bounds or literals, then the initial
 * value or the equation. A text cell commits into the draft on blur or Enter,
 * a select on change; Escape drops the cell's edit; focusing a text cell
 * selects its text, so a prefilled cell is replaced by typing.
 */
function Declarations({ rows, classes, onChange, focusRow, onFocused }: DeclarationsProps): ReactElement {
    const [cells, setCells] = useState<Record<string, string>>({});
    const ref = useRef<HTMLDivElement>(null);
    const keyOf = (i: number, f: DeclField) => `${i}:${f}`;
    const drop = (key: string) => setCells(c => {
        const rest = { ...c };
        delete rest[key];
        return rest;
    });

    useEffect(() => {
        if (focusRow === null) return;
        const input = ref.current?.querySelector<HTMLInputElement>(`[data-decl-name="${focusRow}"]`);
        if (!input) return;
        input.scrollIntoView({ block: 'nearest' });
        input.focus();
        input.select();
        onFocused();
    }, [focusRow, rows.length, onFocused]);

    const commit = (i: number, f: DeclField, typed: string | undefined): void => {
        const row = rows[i];
        const patch = row && typed !== undefined ? patchOf(row, f, typed) : null;
        drop(keyOf(i, f));
        if (patch) onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    };
    const shown = (i: number, f: DeclField, stored: string) => cells[keyOf(i, f)] ?? stored;

    const text = (i: number, f: DeclField, stored: string, aria: string, placeholder: string, extra: string, data?: Record<string, string>) => (
        <input
            type="text"
            className={`sim-roles-modal__input sim-roles-modal__decl-${extra}`}
            aria-label={aria}
            placeholder={placeholder}
            title={shown(i, f, stored) || undefined}
            value={shown(i, f, stored)}
            onFocus={e => e.currentTarget.select()}
            onChange={e => { const v = e.target.value; setCells(c => ({ ...c, [keyOf(i, f)]: v })); }}
            onBlur={() => commit(i, f, cells[keyOf(i, f)])}
            onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') { e.stopPropagation(); drop(keyOf(i, f)); }
            }}
            {...data}
        />
    );
    const choose = (i: number, f: DeclField, value: string) => commit(i, f, value);

    if (rows.length === 0) {
        return <div className="sim-roles-modal__empty">No attributes. Add one to use it in guards, actions and equations.</div>;
    }
    return (
        <div ref={ref}>
            {rows.map((r, i) => {
                const n = i + 1;
                const semantic = r.space !== 'presentation';
                const kind = r.domain?.kind ?? '';
                const derived = r.equation !== undefined;
                return (
                    <div className="sim-roles-modal__decl" key={i}>
                        <div className="sim-roles-modal__decl-line sim-roles-modal__decl-line--first">
                            {text(i, 'name', r.name, `Name of state attribute ${n}`, 'name', 'name', { 'data-decl-name': String(i) })}
                            <select
                                className="sim-roles-modal__select"
                                aria-label={`Metaclass of state attribute ${n}`}
                                value={r.metaclass ?? ''}
                                onChange={e => choose(i, 'metaclass', e.target.value)}
                            >
                                <option value="">Global</option>
                                {r.metaclass && !classes.some(c => c.id === r.metaclass) && <option value={r.metaclass}>Unknown metaclass</option>}
                                {classes.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}
                            </select>
                            <select
                                className="sim-roles-modal__select"
                                aria-label={`Stored or derived, state attribute ${n}`}
                                value={derived ? 'derived' : 'stored'}
                                onChange={e => choose(i, 'form', e.target.value)}
                            >
                                <option value="stored">stored</option>
                                <option value="derived">derived</option>
                            </select>
                            <button
                                type="button"
                                className="sim-roles-modal__icon-btn"
                                title="Remove"
                                aria-label={`Remove state attribute ${n}`}
                                onClick={() => onChange(rows.filter((_, j) => j !== i))}
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                        <div className="sim-roles-modal__decl-line sim-roles-modal__decl-line--second">
                            <select
                                className="sim-roles-modal__select"
                                aria-label={`Space of state attribute ${n}`}
                                value={semantic ? 'semantic' : 'presentation'}
                                onChange={e => choose(i, 'space', e.target.value)}
                            >
                                <option value="semantic">semantic</option>
                                <option value="presentation">presentation</option>
                            </select>
                            {/* Presentation has no domain: the cells stay, hidden, so the row keeps its layout. */}
                            <select
                                className={`sim-roles-modal__select${semantic ? '' : ' sim-roles-modal__hidden'}`}
                                aria-label={`Domain of state attribute ${n}`}
                                aria-hidden={!semantic}
                                tabIndex={semantic ? undefined : -1}
                                value={kind}
                                onChange={e => choose(i, 'kind', e.target.value)}
                            >
                                {kind === '' && <option value="" disabled>domain</option>}
                                <option value="boolean">boolean</option>
                                <option value="range">range</option>
                                <option value="enum">enum</option>
                            </select>
                            {semantic && r.domain?.kind === 'range' ? (
                                <>
                                    {text(i, 'min', String(r.domain.min), `Minimum of state attribute ${n}`, 'min', 'bound')}
                                    {text(i, 'max', String(r.domain.max), `Maximum of state attribute ${n}`, 'max', 'bound')}
                                </>
                            ) : semantic && r.domain?.kind === 'enum' ? (
                                text(i, 'literals', r.domain.literals.join(', '), `Literals of state attribute ${n}`, 'A, B', 'literals')
                            ) : (
                                <span className="sim-roles-modal__decl-void" title={semantic ? 'Only for range and enum' : 'Presentation has no domain'} />
                            )}
                            {/* The equation takes the place of the initial value, in the same cell (R-SIM-76). */}
                            {derived
                                ? text(i, 'equation', r.equation ?? '', `Equation of state attribute ${n}, a JjEL expression`, 'equation', 'value')
                                : text(i, 'initial', r.initial, `Initial value of state attribute ${n}, a JjEL literal`, 'initial', 'value')}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// The dialog
// ---------------------------------------------------------------------------

export function SimRolesModal(props: SimRolesModalProps): ReactElement {
    const {
        configModelId, bag, sketch, options, stateAttributesRaw, eventClassName, initialPreset, openOnData, describeOverlap, nameOf,
        onClose, onApplied,
    } = props;

    const stored = useMemo(() => storedProfile(bag), [bag]);
    const [preset, setPreset] = useState<string | null>(initialPreset);
    const [picked, setPicked] = useState<string | null>(null);
    const [edits, setEdits] = useState<DraftEdits>({});
    const [declRows, setDeclRows] = useState<StateAttributeRecord[] | null>(null);
    const [matchOff, setMatchOff] = useState(false);
    const [optionalOpen, setOptionalOpen] = useState(false);
    const [restOpen, setRestOpen] = useState(false);
    const [dataOpen, setDataOpen] = useState(openOnData);
    const [focusRow, setFocusRow] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const dataRef = useRef<HTMLDivElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    const firstOpen = preset === null && isFirstOpen(bag);
    const profile: SimProfile = (preset ? systemProfile(preset) : undefined) ?? stored.profile;
    const bindings: ProfileBindings | null = useMemo(
        () => (profile.system && sketch ? bindProfile(profile, sketch) : null),
        [profile, sketch],
    );
    const edited = useMemo(() => bagWithEdits(bag, edits), [bag, edits]);

    // The Bound proposal (R-SIM-81(1) as amended): the reachable markings of the models under the bag as Apply
    // leaves it, as the panel reads it; the selector reads only their signature, the exploration runs in the memo.
    const boundBag = useMemo(
        () => (bindings && !matchOff && boundProposalInputs(profile, edited, bindings) ? boundProposalBag(profile, edited, bindings) : null),
        [bindings, matchOff, profile, edited],
    );
    const markingSig = useSelector((state: DState) => (boundBag ? boundEstimateSignature((state as any)?.idlookup ?? {}, configModelId) : ''));
    const estimate = useMemo(
        () => (markingSig && boundBag ? boundEstimate((store.getState() as any).idlookup ?? {}, configModelId, boundBag) : null),
        [markingSig, boundBag, configModelId],
    );

    const storedRows = useMemo(() => stateAttributeRows(stateAttributesRaw ?? undefined), [stateAttributesRaw]);
    const rows = declRows ?? storedRows.rows;

    const input: DraftInput = {
        profile, bag, bindings, edits,
        declarations: declRows ? encodeStateAttributes(declRows) : null,
        matchOff,
        writeProfile: preset !== null || !stored.custom,
        estimate,
    };
    const proposals = draftProposals(input);
    const patch = draftPatch(input);
    const status = draftStatus(input);
    const sections = roleSections(profile, edited);
    const defects = validateProfile(profile);
    const match = matchLine(bindings);
    const help = boundHelp(proposals);
    // The actions write state attributes and none is declared: the first firing would halt (R-SIM-81(3), G9).
    const after = draftBag(input);
    const declareHint = ['simAction', 'simEntry', 'simExit'].some(k => typeof after[k] === 'string' && after[k] !== '') && rows.length === 0;
    const pending = Object.keys(patch).length > 0;
    const pristine = preset === initialPreset && Object.keys(edits).length === 0 && declRows === null && !matchOff;

    // Escape closes without writing: from inside, the root's onKeyDown (which stops the event there, so it never
    // reaches window); with the focus outside the dialog, this listener. The focus goes into the dialog on open.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    useEffect(() => { dialogRef.current?.focus(); }, []);

    // The declarations hint opens the dialog on Data, its Add attribute in view and focused (R-SIM-81(3)).
    useEffect(() => {
        if (!openOnData || firstOpen) return;
        const add = dataRef.current?.querySelector<HTMLButtonElement>('.sim-roles-modal__add');
        dataRef.current?.scrollIntoView({ block: 'start' });
        add?.focus();
        // Once, on open.
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const setEdit = (key: string, value: string) => setEdits(e => ({ ...e, [key]: value === '' ? null : value }));

    const reset = (): void => {
        setPreset(initialPreset);
        setEdits({});
        setDeclRows(null);
        setMatchOff(false);
        setError(null);
    };

    const apply = (): void => {
        const lmm: any = LPointerTargetable.fromPointer(configModelId);
        if (!lmm) return;
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const result = draftApply(input, lookup, options.classes.map(c => c.id));
        if (result.kind === 'refused') {
            setError(describeOverlap(result.overlap));
            return;
        }
        lmm.state = result.patch;
        onApplied(result.overlap ? describeOverlap(result.overlap) : null);
    };

    const addDeclaration = (): void => {
        const next = [...rows, { name: freshName(rows), metaclass: null, space: 'semantic' as const, domain: { kind: 'boolean' as const }, initial: 'false' }];
        setDeclRows(next);
        setFocusRow(next.length - 1);
    };

    // -- rows ----------------------------------------------------------------

    const badge = (r: RoleId) => {
        const b = roleBadge(r);
        return b
            ? <span className={`sim-roles-modal__badge sim-roles-modal__badge--${b}`} title={BADGE[b].title}>{BADGE[b].text}</span>
            : <span className="sim-roles-modal__badge" />;
    };

    const bindingRow = (r: RoleId, prefix?: string, note?: string | null): ReactElement => {
        const key = roleDescriptor(r).key as string;
        const v = rowValue(key, input, proposals);
        const list = listOf(r, profile.shape, options);
        const all = v.value && !list.some(o => o.id === v.value) ? [{ id: v.value, name: nameOf(v.value) }, ...list] : list;
        const why = v.source === 'proposed' ? bindings?.[r]?.why : undefined;
        return (
            <div className="sim-roles-modal__row" key={r}>
                <div className="sim-roles-modal__role">
                    {badge(r)}
                    <span className="sim-roles-modal__label">{prefix ? `${prefix} ${label(r)}` : label(r)}</span>
                </div>
                <div className="sim-roles-modal__value">
                    <select
                        className={`sim-roles-modal__select sim-roles-modal__select--${v.source}${v.value ? '' : ' sim-roles-modal__select--empty'}`}
                        aria-label={label(r)}
                        title={why ? `Proposed: ${nameOf(v.value)}. ${why}` : undefined}
                        value={v.value}
                        onChange={e => setEdit(key, e.target.value)}
                    >
                        <option value="">{placeholderOf(r)}</option>
                        {all.map(o => <option value={o.id} key={o.id}>{o.name}</option>)}
                    </select>
                    {note && <span className="sim-roles-modal__help">{note}</span>}
                </div>
            </div>
        );
    };

    const neededNote = (r: RoleId): string | null => {
        const by = sections.neededBy[r];
        return by && by.length > 0 ? `Needed by ${by.map(label).join(', ')}` : null;
    };

    const boundRow = (): ReactElement => {
        const v = rowValue('simBound', input, proposals);
        const invalid = invalidEngineRoles({ simBound: v.value || undefined }).length > 0;
        const text = invalid ? 'Bound must be a whole number ≥ 1.' : help;
        return (
            <div className="sim-roles-modal__row" key="bound">
                <div className="sim-roles-modal__role">
                    {badge('bound')}
                    <span className="sim-roles-modal__label">{label('bound')}</span>
                </div>
                <div className="sim-roles-modal__value">
                    <div className="sim-roles-modal__bound">
                        <input
                            type="number"
                            className={`sim-roles-modal__input sim-roles-modal__bound-input sim-roles-modal__select--${v.source}`}
                            aria-label="Bound"
                            min={1}
                            step={1}
                            placeholder="1"
                            value={v.value}
                            onChange={e => setEdit('simBound', e.target.value)}
                        />
                        <span className="sim-roles-modal__unit">tokens per place</span>
                    </div>
                    <span className={`sim-roles-modal__help sim-roles-modal__help--two${invalid ? ' sim-roles-modal__help--error' : ''}`} title={text ?? undefined}>
                        {text ?? ''}
                    </span>
                </div>
            </div>
        );
    };

    const derivedText = (r: RoleId): string => {
        const m = profile.modes[r];
        // The class is the stored Trigger's type (R-SIM-38): a Trigger only proposed or changed here is named after Apply.
        if (r === 'event') {
            if (!after.simTrigger) return 'Set Trigger to enable events';
            return after.simTrigger === bag.simTrigger && eventClassName ? `${eventClassName} · the declared type of Trigger` : 'The declared type of Trigger';
        }
        if (m.mode !== 'derived') return '';
        return m.from ? `from ${label(m.from)} · ${m.note}` : m.note;
    };

    // -- render ----------------------------------------------------------------

    const shape = SHAPE_LABEL[profile.shape];
    const presetValue = preset ?? (stored.profile.system && PANEL_PROFILE_IDS.some(id => id === stored.profile.id) && !stored.custom ? stored.profile.id : '');
    const statusText = status.status === 'checkable' ? 'Checkable' : status.status === 'warnings' ? 'Checkable with warnings' : 'Not checkable';
    const statusTitle = status.missing.length > 0 ? `Missing: ${status.missing.join(', ')}.` : 'Every required role is bound.';
    const dataMode = profile.modes.stateAttributes;
    const dataOff = dataMode.mode === 'off';
    const dataOffReason = dataMode.mode === 'off' ? dataMode.reason : '';
    const dataNeeded = neededNote('stateAttributes');

    const header = (
        <div className="sim-roles-modal__header">
            <div className="sim-roles-modal__title-row">
                <h2 className="sim-roles-modal__title" id="sim-roles-modal-title">Simulation roles</h2>
                {!firstOpen && (
                    <span className={`sim-roles-modal__pill sim-roles-modal__pill--${status.status}`} title={`${pending ? 'After Apply. ' : ''}${statusTitle}`}>
                        <i className={`bi ${status.status === 'notCheckable' ? 'bi-x-circle' : 'bi-check-circle-fill'}`} />
                        {statusText}
                    </span>
                )}
                <button type="button" className="sim-roles-modal__close" title="Close" aria-label="Close" onClick={onClose}>
                    <i className="bi bi-x-lg" />
                </button>
            </div>
            {firstOpen ? (
                <span className="sim-roles-modal__subtitle">What kind of model is this?</span>
            ) : (
                <div className="sim-roles-modal__preset-row">
                    <select
                        className="sim-roles-modal__select sim-roles-modal__preset"
                        aria-label="Simulation profile"
                        value={presetValue}
                        onChange={e => { setPreset(e.target.value); setError(null); }}
                    >
                        {!presetValue && <option value="" disabled hidden>{stored.profile.name}</option>}
                        {PANEL_PROFILE_IDS.map(id => <option value={id} key={id}>{systemProfile(id)?.name}</option>)}
                    </select>
                    <span className="sim-roles-modal__dot">·</span>
                    <span className="sim-roles-modal__shape"><i className={`bi ${shape.icon}`} />{shape.label}</span>
                    {!stored.readable && <span className="sim-roles-modal__warning">The stored profile is not readable.</span>}
                </div>
            )}
        </div>
    );

    const picker = (
        <>
            <div className="sim-roles-modal__body">
                <div className="sim-roles-modal__kinds">
                    {KINDS.map(k => {
                        const on = k.presets.some(p => p === picked);
                        return (
                            <div className={`sim-roles-modal__kind${on ? ' sim-roles-modal__kind--on' : ''}`} key={k.shape}>
                                <span className="sim-roles-modal__kind-icon"><i className={`bi ${k.icon}`} /></span>
                                <span className="sim-roles-modal__kind-title">{k.title}</span>
                                <span className="sim-roles-modal__kind-text">{k.description}</span>
                                <div className="sim-roles-modal__chips">
                                    {k.presets.map(id => (
                                        <button
                                            type="button"
                                            key={id}
                                            className={`sim-roles-modal__chip${picked === id ? ' sim-roles-modal__chip--on' : ''}`}
                                            aria-pressed={picked === id}
                                            onClick={() => setPicked(id)}
                                        >
                                            {systemProfile(id)?.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="sim-roles-modal__footer">
                <span className="sim-roles-modal__note">{picked ? 'You can change it later in the header.' : 'Pick a model kind to continue.'}</span>
                <div className="sim-roles-modal__actions">
                    <button type="button" className="sim-roles-modal__btn sim-roles-modal__btn--secondary" onClick={onClose}>Cancel</button>
                    <button type="button" className="sim-roles-modal__btn sim-roles-modal__btn--primary" disabled={!picked} onClick={() => setPreset(picked)}>
                        Continue
                    </button>
                </div>
            </div>
        </>
    );

    const roles = (
        <>
            <div className="sim-roles-modal__match">
                <i className="bi bi-check2-all" />
                {match === null ? (
                    <span>{`${profile.name}: the roles as set, nothing proposed`}</span>
                ) : matchOff ? (
                    <>
                        <span>Proposals withdrawn</span>
                        <span>·</span>
                        <button type="button" className="sim-roles-modal__link" onClick={() => setMatchOff(false)}>Redo</button>
                    </>
                ) : (
                    <>
                        <span title="Matched from the metamodel's structure, then by name; Apply writes the proposals on the roles not set.">
                            {`${match.matched} of ${match.total} roles matched`}
                        </span>
                        <span>·</span>
                        <button type="button" className="sim-roles-modal__link" onClick={() => setMatchOff(true)}>Undo</button>
                    </>
                )}
            </div>
            <div className="sim-roles-modal__body" ref={bodyRef}>
                <div className="sim-roles-modal__section">
                    Required<span className="sim-roles-modal__count">{sections.required.length}</span>
                </div>
                {sections.required.flatMap(item => item.map((r, i) => bindingRow(r, i > 0 ? 'or' : undefined)))}

                {sections.parameters.length > 0 && (
                    <>
                        <div className="sim-roles-modal__section">Parameters</div>
                        {sections.parameters.map(r => (r === 'bound' ? boundRow() : bindingRow(r)))}
                    </>
                )}

                <button type="button" className="sim-roles-modal__fold" aria-expanded={optionalOpen} onClick={() => setOptionalOpen(o => !o)}>
                    <i className={`bi bi-chevron-${optionalOpen ? 'down' : 'right'}`} />
                    <span className="sim-roles-modal__fold-title">Optional</span>
                    <span className="sim-roles-modal__count">{sections.optional.length}</span>
                </button>
                {optionalOpen && sections.optional.map(r => bindingRow(r, undefined, neededNote(r)))}

                <button type="button" className="sim-roles-modal__fold" aria-expanded={restOpen} onClick={() => setRestOpen(o => !o)}>
                    <i className={`bi bi-chevron-${restOpen ? 'down' : 'right'}`} />
                    <i className="bi bi-lock" />
                    <span className="sim-roles-modal__fold-title">
                        {`${sections.derived.length > 0 ? `${sections.derived.length} derived · ` : ''}${sections.off.length} not used`}
                    </span>
                </button>
                {restOpen && (
                    <>
                        {sections.derived.map(r => (
                            <div className="sim-roles-modal__row" key={r}>
                                <div className="sim-roles-modal__role">
                                    {badge(r)}
                                    <span className="sim-roles-modal__label sim-roles-modal__label--muted">{label(r)}</span>
                                </div>
                                <div className="sim-roles-modal__value">
                                    <div className="sim-roles-modal__locked" title="Derived by the profile">
                                        <i className="bi bi-lock" />
                                        <span>{derivedText(r)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="sim-roles-modal__row sim-roles-modal__row--off">
                            <div className="sim-roles-modal__role"><span className="sim-roles-modal__label sim-roles-modal__label--muted">Not used</span></div>
                            <div
                                className="sim-roles-modal__off"
                                title={sections.off.map(r => { const m = profile.modes[r]; return `${label(r)}: ${m.mode === 'off' ? m.reason : ''}`; }).join('\n')}
                            >
                                {sections.off.map(r => `${label(r)}${edited[roleDescriptor(r).key ?? ''] ? ' (set)' : ''}`).join(', ') || 'none'}
                            </div>
                        </div>
                    </>
                )}

                <div className="sim-roles-modal__data" ref={dataRef}>
                    <div className="sim-roles-modal__data-head">
                        <button type="button" className="sim-roles-modal__fold sim-roles-modal__fold--data" aria-expanded={dataOpen} onClick={() => setDataOpen(o => !o)}>
                            <i className={`bi bi-chevron-${dataOpen ? 'down' : 'right'}`} />
                            <i className="bi bi-database" />
                            <span className="sim-roles-modal__fold-title">Data</span>
                            <span className="sim-roles-modal__count">{rows.length}</span>
                            <span className="sim-roles-modal__data-note">
                                {declareHint ? 'Declare the state attributes the actions write' : dataNeeded ?? (dataOff ? dataOffReason : '')}
                            </span>
                        </button>
                        {dataOpen && (
                            <button type="button" className="sim-roles-modal__btn sim-roles-modal__btn--outline sim-roles-modal__add" onClick={addDeclaration}>
                                <i className="bi bi-plus-lg" />
                                Add attribute
                            </button>
                        )}
                    </div>
                    {dataOpen && !storedRows.readable && declRows === null && (
                        <div className="sim-roles-modal__warning">The stored declarations are not readable. Adding an attribute replaces them.</div>
                    )}
                    {dataOpen && (
                        <Declarations rows={rows} classes={options.allClasses} onChange={setDeclRows} focusRow={focusRow} onFocused={() => setFocusRow(null)} />
                    )}
                </div>
            </div>
            <div className="sim-roles-modal__footer">
                {error ? (
                    <span className="sim-roles-modal__message sim-roles-modal__message--error" title={error}>
                        <i className="bi bi-exclamation-circle-fill" />{error}
                    </span>
                ) : (
                    <div className="sim-roles-modal__actions">
                        <button type="button" className="sim-roles-modal__btn sim-roles-modal__btn--ghost" disabled={pristine} onClick={reset}
                            title="Discard the changes made in this dialog">
                            <i className="bi bi-arrow-counterclockwise" />Reset
                        </button>
                        <button type="button" className="sim-roles-modal__btn sim-roles-modal__btn--ghost" disabled={!bindings || !matchOff}
                            onClick={() => setMatchOff(false)} title="Propose the roles matched from the metamodel again">
                            <i className="bi bi-magic" />Match
                        </button>
                    </div>
                )}
                <div className="sim-roles-modal__actions sim-roles-modal__actions--end">
                    {defects.length > 0 && (
                        <span className="sim-roles-modal__message sim-roles-modal__message--error" title={defects.map(d => d.message).join('\n')}>
                            <i className="bi bi-exclamation-circle-fill" />{`${defects.length} ${defects.length === 1 ? 'problem' : 'problems'}`}
                        </span>
                    )}
                    <button type="button" className="sim-roles-modal__btn sim-roles-modal__btn--secondary" onClick={onClose}>Cancel</button>
                    <button
                        type="button"
                        className="sim-roles-modal__btn sim-roles-modal__btn--primary"
                        disabled={!pending || defects.length > 0}
                        title={pending ? 'Write the roles in one step; one undo reverts it. A run on a model of this metamodel is interrupted.' : 'Nothing to write'}
                        onClick={apply}
                    >
                        Apply
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(
        <div
            className="sim-roles-modal-backdrop"
            role="presentation"
            onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') onClose(); }} onKeyUp={stop} onMouseDown={stop} onMouseUp={stop} onClick={stop} onDoubleClick={stop}
            onPointerDown={stop} onPointerUp={stop} onContextMenu={stop} onWheel={stop}
        >
            <div className="sim-roles-modal" role="dialog" aria-modal="true" aria-labelledby="sim-roles-modal-title" tabIndex={-1} ref={dialogRef}>
                {header}
                {firstOpen ? picker : roles}
            </div>
        </div>,
        document.body,
    );
}

export default SimRolesModal;
