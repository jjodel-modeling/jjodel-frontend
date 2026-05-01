import { useCallback, useMemo } from 'react';
import type { Node } from '@xyflow/react';
import type { MetaclassInfo, MetaclassReference } from '../hooks/useEditorMode';
import type { ObjectNodeData } from '../types';
import { setDraggedMetaclassId } from '../utils/dragState';

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
    /** If 'model' → show M1 palette with rootable classes. Default 'metamodel'. */
    editorMode?: 'metamodel' | 'model';
    /** Rootable classes for M1 palette (concrete classes not targeted by compositions). */
    rootableClasses?: MetaclassInfo[];
    /** All metaclasses — used to resolve the selected node's metaclass in M1 mode. */
    allClasses?: MetaclassInfo[];
    /** Currently selected nodes on the canvas (M1 mode). */
    selectedNodes?: Node[];
}

function PalettePanel({ editorMode = 'metamodel', rootableClasses = [], allClasses = [], selectedNodes = [] }: PalettePanelProps) {
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

    // Resolve the metaclass of the currently selected element (M1 only).
    // Only shows info when exactly one ObjectNode is selected and it has a metaclass.
    const selectedMetaclass: MetaclassInfo | null = useMemo(() => {
        if (editorMode !== 'model') return null;
        if (selectedNodes.length !== 1) return null;
        const sel = selectedNodes[0];
        if (sel.type !== 'objectNode') return null;
        const data = sel.data as ObjectNodeData | undefined;
        const classId = data?.instanceOfClassId;
        if (!classId) return null;
        return allClasses.find(c => c.id === classId) ?? null;
    }, [editorMode, selectedNodes, allClasses]);

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
            <aside className="editor-v2-palette editor-v2-palette--m1">
                {/* Instances — root instance creation (kept as drag-to-canvas) */}
                <div className="palette-instances">
                    <div className="palette-instances__title">Instances</div>
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
                                >
                                    <i className="bi bi-box" />
                                    <span>{cls.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

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
        <aside className="editor-v2-palette">
            {m2Groups.map(group => (
                <div key={group} className="palette-group">
                    <div className="palette-group__title">{group}</div>
                    {m2PaletteItems.filter(i => i.group === group).map((item) => (
                        <div
                            key={item.type}
                            className={`palette-item ${item.group === 'Members' ? 'palette-item--member' : ''}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, item.type)}
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
