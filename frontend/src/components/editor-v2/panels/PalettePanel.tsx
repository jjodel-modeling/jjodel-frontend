import { useCallback, useMemo } from 'react';
import type { MetaclassInfo, MetaclassReference } from '../hooks/useEditorMode';
import { setDraggedMetaclassId } from '../utils/dragState';
import { classDragPayload, ONTO_DRAG_MIME, ontoDragPayload, type OntoRailSection } from '../hooks/instantiate';
import type { OntoBinding } from '../../../model/ontological/bindingCodec';
import { CLASS_RAIL_HINTS, type ClassRailGroup, type ClassRailKind } from '../../../model/ontological/classRail';
import { LPointerTargetable } from '../../../joiner';

// ---------------------------------------------------------------------------
// M2 (Metamodel) Palette
// ---------------------------------------------------------------------------

interface PaletteItem {
    type: string;
    label: string;
    icon: string;
    group: string;
}

const m2PaletteItems: PaletteItem[] = [
    { type: 'packageNode', label: 'Package', icon: 'bi-folder', group: 'Structure' },
    { type: 'classNode', label: 'Class', icon: 'bi-diagram-3', group: 'Classifiers' },
    { type: 'classNode:abstract', label: 'Abstract Class', icon: 'bi-diagram-3', group: 'Classifiers' },
    { type: 'enumNode', label: 'Enumeration', icon: 'bi-list-ol', group: 'Classifiers' },
    { type: 'attribute', label: 'Attribute', icon: 'bi-card-text', group: 'Members' },
    { type: 'operation', label: 'Operation', icon: 'bi-gear', group: 'Members' },
    { type: 'literal', label: 'Literal', icon: 'bi-hash', group: 'Members' },
];

const m2Groups = [...new Set(m2PaletteItems.map(i => i.group))];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMultiplicity(lower: number, upper: number): string {
    const u = upper === -1 ? '*' : String(upper);
    return `[${lower}..${u}]`;
}

// Inline SVG: simple "tree/hierarchy" glyph for Children header (parent → 2 leaves).
const ChildrenIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="7" cy="3" r="1.5" />
        <circle cx="3" cy="11" r="1.5" />
        <circle cx="11" cy="11" r="1.5" />
        <path d="M7 4.5v2.5H3v2.5M7 7h4v2.5" />
    </svg>
);

// Inline SVG: arrow-with-dot glyph for References header.
const ReferencesIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="3" cy="7" r="1.5" fill="currentColor" />
        <path d="M5 7h7M9 4l3 3-3 3" />
    </svg>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PalettePanelProps {
    /** Collapsed to nothing while a preview another view drives is on this canvas (the Refactoring tab beside it, R-JJD-16). */
    collapsed?: boolean;
    /** If 'model' → show M1 palette with rootable classes. Default 'metamodel'. */
    editorMode?: 'metamodel' | 'model';
    /** Rootable classes for M1 palette (concrete classes not targeted by compositions). */
    rootableClasses?: MetaclassInfo[];
    /** All metaclasses — used to resolve the selected DObject's metaclass in M1 mode. */
    allClasses?: MetaclassInfo[];
    /** ID of the currently selected DObject (M1 mode). Read from `_lastSelected.modelElement`
     *  in Redux — populated by both flow (`useJjomSelection`) and classic (`graphElement`).
     *  Null when nothing M1 is selected (or `_lastSelected` points to a DClass/DPackage/DModel
     *  in deselect-default state — filtered out via the `className === 'DObject'` check). */
    selectedDObjectId?: string | null;
    /** True when the IR palette filter fell back to the full rootable list because the
     *  active viewpoint declares no views for creatable root classes (spec v1.2 sez. 6). */
    irPaletteFallback?: boolean;
    /** Rootable classes the active IR viewpoint declares no view for. Creatable all the
     *  same (the drop gate reads the unfiltered rootable list) and rendered abstract per
     *  spec §10, so they get a secondary group instead of disappearing without a trace. */
    undeclaredClasses?: MetaclassInfo[];
    /** Click or Enter/Space on an entry: creates it at the canvas centre (the drop path). Member
     *  entries stay inert, as on a bare-canvas drop. Without it the entries are drag-only. */
    onItemActivate?: (type: string, metaclassId?: string) => void;
    /** The «Instances of» groups (R-OI-18, `ontoRailSections`): the classifiers of the model by binding record. */
    ontoSections?: OntoRailSection[];
    /** Click or Enter/Space on an «Instances of» entry: instantiates it at the canvas centre (the drop path). */
    onOntoActivate?: (record: OntoBinding, classifierId: string) => void;
    /** «Declare binding…» of the empty «Instances of» section; passed in Advanced only, so Basic shows no section
     *  without a binding (R-OI-18). */
    onDeclareBinding?: () => void;
    /** The groups of the `class` level (R-OI-21, `classRail`), which replace the linguistic block; `null` at any other level. */
    classGroups?: ClassRailGroup[] | null;
    /** Click or Enter/Space on an enabled class-level entry. */
    onClassActivate?: (kind: ClassRailKind, metaclassId: string) => void;
    /** True when the selection can hold a property: the «Attributes» entries take a click only then. */
    classPropertyEnabled?: boolean;
    /** In a split, the viewpoint of the pane this palette is showing, read beside the Instances title (multi-tab L6c). */
    viewpointName?: string;
}

const CLASS_GROUP_TITLES: Record<ClassRailKind, string> = {
    classifier: 'Classifiers', association: 'Associations', property: 'Attributes', generalization: 'Generalizations',
};
const CLASS_GROUP_ICONS: Record<ClassRailKind, string> = {
    classifier: 'bi-box', association: 'bi-arrow-left-right', property: 'bi-list-ul', generalization: 'bi-arrow-up-short',
};

function PalettePanel({ editorMode = 'metamodel', rootableClasses = [], allClasses = [], selectedDObjectId = null, irPaletteFallback = false, undeclaredClasses = [], onItemActivate, collapsed = false, ontoSections = [], onOntoActivate, onDeclareBinding, classGroups = null, onClassActivate, classPropertyEnabled = false, viewpointName }: PalettePanelProps) {
    const onDragStart = useCallback((event: React.DragEvent, type: string, metaclassId?: string) => {
        event.dataTransfer.setData('application/reactflow', type);
        if (metaclassId) {
            event.dataTransfer.setData('metaclassId', metaclassId);
            // Payload for the classic editor drop handler.
            // Both flow and classic read from the same dataTransfer; flow uses
            // 'application/reactflow', classic uses 'application/jjodel-classic'.
            event.dataTransfer.setData('application/jjodel-classic', metaclassId);
            setDraggedMetaclassId(metaclassId);
        }
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    const onDragEnd = useCallback(() => {
        setDraggedMetaclassId(null);
    }, []);

    // A drag from «Instances of» carries its own key alone (R-OI-18): no `application/reactflow`, the linguistic drop,
    // and no setDraggedMetaclassId, whose id onDragOver would read as a non-rootable metaclass.
    const onOntoDragStart = useCallback((event: React.DragEvent, record: OntoBinding, classifierId: string) => {
        event.dataTransfer.setData(ONTO_DRAG_MIME, ontoDragPayload(record, classifierId));
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    const onClassDragStart = useCallback((event: React.DragEvent, metaclassId: string) => {
        event.dataTransfer.setData(ONTO_DRAG_MIME, classDragPayload(metaclassId));
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    // Click and Enter/Space on an entry (WCAG: a focusable button). An HTML5 drag fires no click.
    const activateProps = (type: string, metaclassId?: string) => onItemActivate ? {
        role: 'button',
        tabIndex: 0,
        onClick: () => onItemActivate(type, metaclassId),
        onKeyDown: (event: React.KeyboardEvent) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            onItemActivate(type, metaclassId);
        },
    } : {};

    const ontoActivateProps = (record: OntoBinding, classifierId: string) => onOntoActivate ? {
        role: 'button',
        tabIndex: 0,
        onClick: () => onOntoActivate(record, classifierId),
        onKeyDown: (event: React.KeyboardEvent) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            onOntoActivate(record, classifierId);
        },
    } : {};

    const classActivateProps = (kind: ClassRailKind, metaclassId: string) => onClassActivate ? {
        role: 'button',
        tabIndex: 0,
        onClick: () => onClassActivate(kind, metaclassId),
        onKeyDown: (event: React.KeyboardEvent) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            onClassActivate(kind, metaclassId);
        },
    } : {};

    // Resolve the metaclass of the currently selected DObject (M1 only).
    // Reads from the canonical `_lastSelected.modelElement` channel (via prop) so the
    // panel reacts to selection from BOTH flow and classic editors. Filters out
    // non-DObject targets (DClass/DPackage/DModel) that `_lastSelected` may carry
    // in deselect-default state.
    const selectedMetaclass: MetaclassInfo | null = useMemo(() => {
        if (editorMode !== 'model') return null;
        if (!selectedDObjectId) return null;
        const lme: any = LPointerTargetable.fromPointer(selectedDObjectId);
        if (!lme || lme.className !== 'DObject') return null;
        const classId = lme.instanceof?.id;
        if (!classId) return null;
        return allClasses.find(c => c.id === classId) ?? null;
    }, [editorMode, selectedDObjectId, allClasses]);

    const containmentRefs: MetaclassReference[] = useMemo(
        () => (selectedMetaclass ? selectedMetaclass.references.filter(r => r.containment) : []),
        [selectedMetaclass],
    );
    const nonContainmentRefs: MetaclassReference[] = useMemo(
        () => (selectedMetaclass ? selectedMetaclass.references.filter(r => !r.containment) : []),
        [selectedMetaclass],
    );

    // ── M1 Palette ───────────────────────────────────────────────────
    if (editorMode === 'model') {
        return (
            <aside className={`editor-v2-palette editor-v2-palette--m1${collapsed ? ' editor-v2-palette--collapsed' : ''}`}>
                {/* Instances — root instance creation (kept as drag-to-canvas) */}
                {!classGroups?.length && <div className="palette-instances">
                    <div className="palette-instances__title">Instances{viewpointName && <> · <span className="palette-instances__viewpoint">{viewpointName}</span></>}</div>
                    {irPaletteFallback && (
                        <div className="palette-notice">
                            Active viewpoint declares no views for creatable root classes. Showing all.
                        </div>
                    )}
                    {rootableClasses.length === 0 ? (
                        <div className="palette-empty">No rootable classes found</div>
                    ) : (
                        <div className="palette-instances__list">
                            {rootableClasses.map((cls) => (
                                <div
                                    key={cls.id}
                                    className="palette-instances__item"
                                    draggable
                                    onDragStart={(e) => onDragStart(e, 'objectNode', cls.id)}
                                    onDragEnd={onDragEnd}
                                    {...activateProps('objectNode', cls.id)}
                                >
                                    <i className="bi bi-box" />
                                    <span>{cls.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {undeclaredClasses.length > 0 && (
                        <div className="palette-instances__undeclared">
                            <div className="palette-instances__subtitle">Not in this viewpoint</div>
                            <div className="palette-instances__list">
                                {undeclaredClasses.map((cls) => (
                                    <div
                                        key={cls.id}
                                        className="palette-instances__item palette-instances__item--undeclared"
                                        title="No view declared in the active viewpoint: instances render abstract until one is authored."
                                        draggable
                                        onDragStart={(e) => onDragStart(e, 'objectNode', cls.id)}
                                        onDragEnd={onDragEnd}
                                        {...activateProps('objectNode', cls.id)}
                                    >
                                        <i className="bi bi-box" />
                                        <span>{cls.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>}

                {/* Instances of — the classifiers of the model by binding record (R-OI-18), beside the pane menu.
                    Elements — at the `class` level, what the binding lets the class diagram create (R-OI-21). */}
                {(ontoSections.length > 0 || !!classGroups?.length || onDeclareBinding) && (
                    <div className="palette-onto">
                        <div className="palette-onto__title">{classGroups ? 'Elements' : 'Instances of'}</div>
                        {(classGroups ?? ontoSections).length === 0 ? (
                            <div className="palette-onto__empty">
                                <div className="palette-empty">No ontological binding declared</div>
                                <button type="button" className="palette-onto__declare" onClick={onDeclareBinding}>Declare binding…</button>
                            </div>
                        ) : classGroups ? classGroups.map((group) => (
                            <div key={group.kind} className="palette-onto__group">
                                <div className="palette-onto__subtitle">{CLASS_GROUP_TITLES[group.kind]}</div>
                                <div className="palette-onto__list">
                                    {group.items.map((item) => {
                                        const enabled = group.kind === 'classifier' || (group.kind === 'property' && classPropertyEnabled);
                                        const icon = <i className={`bi ${CLASS_GROUP_ICONS[group.kind]}`} />;
                                        return !enabled ? (
                                            <div
                                                key={item.metaclass}
                                                className="palette-onto__item palette-onto__item--disabled"
                                                aria-disabled="true"
                                                title={CLASS_RAIL_HINTS[group.kind as keyof typeof CLASS_RAIL_HINTS]}
                                            >
                                                {icon}
                                                <span>{item.name}</span>
                                            </div>
                                        ) : (
                                            <div
                                                key={item.metaclass}
                                                className="palette-onto__item"
                                                draggable={group.kind === 'classifier'}
                                                onDragStart={group.kind === 'classifier' ? (e) => onClassDragStart(e, item.metaclass) : undefined}
                                                {...classActivateProps(group.kind, item.metaclass)}
                                            >
                                                {icon}
                                                <span>{item.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )) : ontoSections.map((section) => (
                            <div key={section.record.name} className="palette-onto__group">
                                <div className="palette-onto__subtitle">{section.disabled ? 'Links' : 'Objects'}</div>
                                {section.options.length === 0 ? (
                                    <div className="palette-empty">No class to instantiate</div>
                                ) : (
                                    <div className="palette-onto__list">
                                        {section.options.map((option) => section.disabled ? (
                                            <div
                                                key={option.id}
                                                className="palette-onto__item palette-onto__item--disabled"
                                                aria-disabled="true"
                                                title="A link is drawn between two instances (S4)"
                                            >
                                                <i className="bi bi-arrow-left-right" />
                                                <span>{option.name}</span>
                                            </div>
                                        ) : (
                                            <div
                                                key={option.id}
                                                className="palette-onto__item"
                                                draggable
                                                onDragStart={(e) => onOntoDragStart(e, section.record, option.id)}
                                                {...ontoActivateProps(section.record, option.id)}
                                            >
                                                <i className="bi bi-box" />
                                                <span>{option.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Read-only info cards — only when exactly one element is selected */}
                {selectedMetaclass ? (
                    <div className="palette-info-cards">
                        <section className="palette-card">
                            <header className="palette-card__title">
                                <ChildrenIcon />
                                <span>Children</span>
                            </header>
                            {containmentRefs.length === 0 ? (
                                <div className="palette-card__empty">No children</div>
                            ) : (
                                <ul className="palette-ref-list">
                                    {containmentRefs.map((ref) => (
                                        <li key={ref.id} className="palette-ref">
                                            <div className="palette-ref__head">
                                                <span className="palette-ref__name">{ref.name}</span>
                                                <span className="palette-ref__mult">{formatMultiplicity(ref.lowerBound, ref.upperBound)}</span>
                                            </div>
                                            <div className="palette-ref__target palette-ref__target--dot">
                                                {ref.targetClassName}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section className="palette-card">
                            <header className="palette-card__title">
                                <ReferencesIcon />
                                <span>References</span>
                            </header>
                            {nonContainmentRefs.length === 0 ? (
                                <div className="palette-card__empty">No references</div>
                            ) : (
                                <ul className="palette-ref-list">
                                    {nonContainmentRefs.map((ref) => (
                                        <li key={ref.id} className="palette-ref">
                                            <div className="palette-ref__head">
                                                <span className="palette-ref__name">{ref.name}</span>
                                                <span className="palette-ref__mult">{formatMultiplicity(ref.lowerBound, ref.upperBound)}</span>
                                            </div>
                                            <div className="palette-ref__target palette-ref__target--chevron">
                                                {ref.targetClassName}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                ) : (
                    <div className="palette-info-cards">
                        <div className="palette-empty palette-empty--centered">
                            Select an element to see available operations
                        </div>
                    </div>
                )}

                {/* Keyboard shortcuts */}
                <div className="palette-hints">
                    <div className="palette-hint">
                        <span className="palette-hint__key">drag</span>
                        <span className="palette-hint__text">to canvas for root instances</span>
                    </div>
                    <div className="palette-hint">
                        <span className="palette-hint__key">right-click</span>
                        <span className="palette-hint__text">on a node to add children</span>
                    </div>
                    <div className="palette-hint">
                        <span className="palette-hint__key">dbl-click</span>
                        <span className="palette-hint__text">to edit values</span>
                    </div>
                </div>
            </aside>
        );
    }

    // ── M2 Palette ───────────────────────────────────────────────────
    return (
        <aside className={`editor-v2-palette${collapsed ? ' editor-v2-palette--collapsed' : ''}`}>
            {m2Groups.map(group => (
                <div key={group} className="palette-group">
                    <div className="palette-group__title">{group}</div>
                    {m2PaletteItems.filter(i => i.group === group).map((item) => (
                        <div
                            key={item.type}
                            className={`palette-item ${item.group === 'Members' ? 'palette-item--member' : ''}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, item.type)}
                            {...(item.group === 'Members' ? {} : activateProps(item.type))}
                        >
                            <i className={`bi ${item.icon}`} />
                            <span>{item.label}</span>
                            {item.group === 'Members' && (
                                <span className="palette-item__hint">drop on node</span>
                            )}
                        </div>
                    ))}
                </div>
            ))}

            <div className="palette-group">
                <div className="palette-group__title">Connections</div>
                <div className="palette-info">
                    <i className="bi bi-info-circle" style={{ marginRight: '4px' }} />
                    Drag between anchors to connect
                </div>
            </div>

            <div className="palette-divider" />

            <div className="palette-instructions">
                <p><strong>Drag</strong> classifiers to canvas</p>
                <p><strong>Drag</strong> features onto classes/enums</p>
                <p><strong>Double-click</strong> to edit names</p>
                <p><strong>Ctrl+Z/Y</strong> for undo/redo</p>
            </div>
        </aside>
    );
}

export default PalettePanel;
